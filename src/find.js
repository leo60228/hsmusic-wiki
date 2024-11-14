import {inspect} from 'node:util';

import {colors, logWarn} from '#cli';
import {compareObjects, typeAppearance} from '#sugar';
import thingConstructors from '#things';
import {isFunction, validateArrayItems} from '#validators';

function warnOrThrow(mode, message) {
  if (mode === 'error') {
    throw new Error(message);
  }

  if (mode === 'warn') {
    logWarn(message);
  }

  return null;
}

export function processAllAvailableMatches(data, {
  include = _thing => true,

  getMatchableNames = thing =>
    (Object.hasOwn(thing, 'name')
      ? [thing.name]
      : []),

  getMatchableDirectories = thing =>
    (Object.hasOwn(thing, 'directory')
      ? [thing.directory]
      : [null]),
} = {}) {
  const byName = Object.create(null);
  const byDirectory = Object.create(null);
  const multipleNameMatches = Object.create(null);

  for (const thing of data) {
    if (!include(thing)) continue;

    for (const directory of getMatchableDirectories(thing)) {
      if (typeof directory !== 'string') {
        logWarn`Unexpected ${typeAppearance(directory)} returned in directories for ${inspect(thing)}`;
        continue;
      }

      byDirectory[directory] = thing;
    }

    for (const name of getMatchableNames(thing)) {
      if (typeof name !== 'string') {
        logWarn`Unexpected ${typeAppearance(name)} returned in names for ${inspect(thing)}`;
        continue;
      }

      const normalizedName = name.toLowerCase();

      if (normalizedName in byName) {
        const alreadyMatchesByName = byName[normalizedName];
        byName[normalizedName] = null;
        if (normalizedName in multipleNameMatches) {
          multipleNameMatches[normalizedName].push(thing);
        } else {
          multipleNameMatches[normalizedName] = [alreadyMatchesByName, thing];
        }
      } else {
        byName[normalizedName] = thing;
      }
    }
  }

  return {byName, byDirectory, multipleNameMatches};
}

function findHelper({
  referenceTypes,

  include = undefined,
  getMatchableNames = undefined,
  getMatchableDirectories = undefined,
}) {
  const keyRefRegex =
    new RegExp(String.raw`^(?:(${referenceTypes.join('|')}):(?=\S))?(.*)$`);

  // Note: This cache explicitly *doesn't* support mutable data arrays. If the
  // data array is modified, make sure it's actually a new array object, not
  // the original, or the cache here will break and act as though the data
  // hasn't changed!
  const cache = new WeakMap();

  // The mode argument here may be 'warn', 'error', or 'quiet'. 'error' throws
  // errors for null matches (with details about the error), while 'warn' and
  // 'quiet' both return null, with 'warn' logging details directly to the
  // console.
  return (fullRef, data, {mode = 'warn'} = {}) => {
    if (!fullRef) return null;
    if (typeof fullRef !== 'string') {
      throw new TypeError(`Expected a string, got ${typeAppearance(fullRef)}`);
    }

    if (!data) {
      throw new TypeError(`Expected data to be present`);
    }

    let subcache = cache.get(data);
    if (!subcache) {
      subcache =
        processAllAvailableMatches(data, {
          include,
          getMatchableNames,
          getMatchableDirectories,
        });

      cache.set(data, subcache);
    }

    const regexMatch = fullRef.match(keyRefRegex);
    if (!regexMatch) {
      return warnOrThrow(mode,
        `Malformed link reference: "${fullRef}"`);
    }

    const typePart = regexMatch[1];
    const refPart = regexMatch[2];

    const normalizedName =
      (typePart
        ? null
        : refPart.toLowerCase());

    const match =
      (typePart
        ? subcache.byDirectory[refPart]
        : subcache.byName[normalizedName]);

    if (!match && !typePart) {
      if (subcache.multipleNameMatches[normalizedName]) {
        return warnOrThrow(mode,
          `Multiple matches for reference "${fullRef}". Please resolve:\n` +
          subcache.multipleNameMatches[normalizedName]
            .map(match => `- ${inspect(match)}\n`)
            .join('') +
          `Returning null for this reference.`);
      }
    }

    if (!match) {
      return warnOrThrow(mode,
        `Didn't match anything for ${colors.bright(fullRef)}`);
    }

    return match;
  };
}

const hardcodedFindSpecs = {
  // Listings aren't Thing objects, so this find spec isn't provided by any
  // Thing constructor.
  listing: {
    referenceTypes: ['listing'],
    bindTo: 'listingSpec',
  },
};

export function getAllFindSpecs() {
  try {
    thingConstructors;
  } catch (error) {
    throw new Error(`Thing constructors aren't ready yet, can't get all find specs`);
  }

  const findSpecs = {...hardcodedFindSpecs};

  for (const thingConstructor of Object.values(thingConstructors)) {
    const thingFindSpecs = thingConstructor[Symbol.for('Thing.findSpecs')];
    if (!thingFindSpecs) continue;

    Object.assign(findSpecs, thingFindSpecs);
  }

  return findSpecs;
}

export function findFindSpec(key) {
  if (Object.hasOwn(hardcodedFindSpecs, key)) {
    return hardcodedFindSpecs[key];
  }

  try {
    thingConstructors;
  } catch (error) {
    throw new Error(`Thing constructors aren't ready yet, can't check if "find.${key}" available`);
  }

  for (const thingConstructor of Object.values(thingConstructors)) {
    const thingFindSpecs = thingConstructor[Symbol.for('Thing.findSpecs')];
    if (!thingFindSpecs) continue;

    if (Object.hasOwn(thingFindSpecs, key)) {
      return thingFindSpecs[key];
    }
  }

  throw new Error(`"find.${key}" isn't available`);
}

export const findTokenKey = Symbol.for('find.findTokenKey');
export const boundFindData = Symbol.for('find.boundFindData');
export const boundFindOptions = Symbol.for('find.boundFindOptions');

const mixedFindStore = new Map();

function findMixedHelper(config) {
  const keys = Object.keys(config);
  const tokens = Object.values(config);
  const specKeys = tokens.map(token => token[findTokenKey]);
  const specs = specKeys.map(specKey => findFindSpec(specKey));

  return () => {
    console.log(`I would do something with:`);
    console.log(specs);
    return null;
  };
}

export function mixedFind(config) {
  for (const key of mixedFindStore.keys()) {
    if (compareObjects(key, config)) {
      return mixedFindStore.get(key);
    }
  }

  // Validate that this is a valid config to begin with - we can do this
  // before find specs are actually available.
  const tokens = Object.values(config);

  try {
    validateArrayItems(token => {
      isFunction(token);

      if (token[boundFindData])
        throw new Error(`mixedFind doesn't work with bindFind yet`);

      if (!token[findTokenKey])
        throw new Error(`missing findTokenKey, is this actually a find.thing token?`);

      return true;
    })(tokens);
  } catch (caughtError) {
    throw new Error(
      `Expected mixedFind mapping to include valid find.thing tokens only`,
      {cause: caughtError});
  }

  let behavior = (...args) => {
    // findMixedHelper will error if find specs aren't available yet,
    // canceling overwriting `behavior` here.
    return (behavior = findMixedHelper(config))(...args);
  };

  mixedFindStore.set(config, (...args) => behavior(...args));
  return mixedFindStore.get(config);
}

export default new Proxy({}, {
  get: (store, key) => {
    if (key === 'mixed') {
      return mixedFind;
    }

    if (!Object.hasOwn(store, key)) {
      let behavior = (...args) => {
        // This will error if the find spec isn't available...
        const findSpec = findFindSpec(key);

        // ...or, if it is available, replace this function with the
        // ready-for-use find function made out of that find spec.
        return (behavior = findHelper(findSpec))(...args);
      };

      store[key] = (...args) => behavior(...args);
      store[key][findTokenKey] = key;
    }

    return store[key];
  },
});

// Handy utility function for binding the find.thing() functions to a complete
// wikiData object, optionally taking default options to provide to the find
// function. Note that this caches the arrays read from wikiData right when it's
// called, so if their values change, you'll have to continue with a fresh call
// to bindFind.
export function bindFind(wikiData, opts1) {
  const findSpecs = getAllFindSpecs();

  const boundFindFns = {};

  for (const [key, spec] of Object.entries(findSpecs)) {
    if (!spec.bindTo) continue;

    const findFn = findHelper(spec);
    const thingData = wikiData[spec.bindTo];

    boundFindFns[key] =
      (opts1
        ? (ref, opts2) =>
            (opts2
              ? findFn(ref, thingData, {...opts1, ...opts2})
              : findFn(ref, thingData, opts1))
        : (ref, opts2) =>
            (opts2
              ? findFn(ref, thingData, opts2)
              : findFn(ref, thingData)));

    boundFindFns[key][boundFindData] = thingData;
    boundFindFns[key][boundFindOptions] = opts1 ?? {};
  }

  boundFindFns.mixed = mixedFind;

  return boundFindFns;
}
