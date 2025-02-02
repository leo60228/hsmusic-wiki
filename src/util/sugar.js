// Syntactic sugar! (Mostly.)
// Generic functions - these are useful just a8out everywhere.
//
// Friendly(!) disclaimer: these utility functions haven't 8een tested all that
// much. Do not assume it will do exactly what you want it to do in all cases.
// It will likely only do exactly what I want it to, and only in the cases I
// decided were relevant enough to 8other handling.

import {colors} from './cli.js';

// Apparently JavaScript doesn't come with a function to split an array into
// chunks! Weird. Anyway, this is an awesome place to use a generator, even
// though we don't really make use of the 8enefits of generators any time we
// actually use this. 8ut it's still awesome, 8ecause I say so.
export function* splitArray(array, fn) {
  let lastIndex = 0;
  while (lastIndex < array.length) {
    let nextIndex = array.findIndex((item, index) => index >= lastIndex && fn(item));
    if (nextIndex === -1) {
      nextIndex = array.length;
    }
    yield array.slice(lastIndex, nextIndex);
    // Plus one because we don't want to include the dividing line in the
    // next array we yield.
    lastIndex = nextIndex + 1;
  }
}

// Null-accepting function to check if an array or set is empty. Accepts null
// (which is treated as empty) as a shorthand for "hey, check if this property
// is an array with/without stuff in it" for objects where properties that are
// PRESENT but don't currently have a VALUE are null (rather than undefined).
export function empty(value) {
  if (value === null) {
    return true;
  }

  if (Array.isArray(value)) {
    return value.length === 0;
  }

  if (value instanceof Set) {
    return value.size === 0;
  }

  throw new Error(`Expected array, set, or null`);
}

// Repeats all the items of an array a number of times.
export function repeat(times, array) {
  if (typeof array === 'string') return repeat(times, [array]);
  if (empty(array)) return [];
  if (times === 0) return [];
  if (times === 1) return array.slice();

  const out = [];
  for (let n = 1; n <= times; n++) {
    out.push(...array);
  }
  return out;
}

// Gets the item at an index relative to another index.
export function atOffset(array, index, offset, {
  wrap = false,
  valuePastEdge = null,
} = {}) {
  if (index === -1) {
    return valuePastEdge;
  }

  if (offset === 0) {
    return array[index];
  }

  if (wrap) {
    return array[(index + offset) % array.length];
  }

  if (offset > 0 && index + offset > array.length - 1) {
    return valuePastEdge;
  }

  if (offset < 0 && index + offset < 0) {
    return valuePastEdge;
  }

  return array[index + offset];
}

// Sums the values in an array, optionally taking a function which maps each
// item to a number (handy for accessing a certain property on an array of like
// objects). This also coalesces null values to zero, so if the mapping function
// returns null (or values in the array are nullish), they'll just be skipped in
// the sum.
export function accumulateSum(array, fn = x => x) {
  return array.reduce(
    (accumulator, value, index, array) =>
      accumulator +
        fn(value, index, array) ?? 0,
    0);
}

// Stitches together the items of separate arrays into one array of objects
// whose keys are the corresponding items from each array at that index.
// This is mostly useful for iterating over multiple arrays at once!
export function stitchArrays(keyToArray) {
  const errors = [];

  for (const [key, value] of Object.entries(keyToArray)) {
    if (value === null) continue;
    if (Array.isArray(value)) continue;
    errors.push(new TypeError(`(${key}) Expected array or null, got ${typeAppearance(value)}`));
  }

  if (!empty(errors)) {
    throw new AggregateError(errors, `Expected arrays or null`);
  }

  const keys = Object.keys(keyToArray);
  const arrays = Object.values(keyToArray).filter(val => Array.isArray(val));
  const length = Math.max(...arrays.map(({length}) => length));
  const results = [];

  for (let i = 0; i < length; i++) {
    const object = {};
    for (const key of keys) {
      object[key] =
        (Array.isArray(keyToArray[key])
          ? keyToArray[key][i]
          : null);
    }
    results.push(object);
  }

  return results;
}

// Turns this:
//
//   [
//     [123, 'orange', null],
//     [456, 'apple', true],
//     [789, 'banana', false],
//     [1000, 'pear', undefined],
//   ]
//
// Into this:
//
//   [
//     [123, 456, 789, 1000],
//     ['orange', 'apple', 'banana', 'pear'],
//     [null, true, false, undefined],
//   ]
//
// And back again, if you call it again on its results.
export function transposeArrays(arrays) {
  if (empty(arrays)) {
    return [];
  }

  const length = arrays[0].length;
  const results = new Array(length).fill(null).map(() => []);

  for (const array of arrays) {
    for (let i = 0; i < length; i++) {
      results[i].push(array[i]);
    }
  }

  return results;
}

export const mapInPlace = (array, fn) =>
  array.splice(0, array.length, ...array.map(fn));

export const unique = (arr) => Array.from(new Set(arr));

export const compareArrays = (arr1, arr2, {checkOrder = true} = {}) =>
  arr1.length === arr2.length &&
  (checkOrder
    ? arr1.every((x, i) => arr2[i] === x)
    : arr1.every((x) => arr2.includes(x)));

// Stolen from jq! Which pro8a8ly stole the concept from other places. Nice.
export const withEntries = (obj, fn) =>
  Object.fromEntries(fn(Object.entries(obj)));

export function setIntersection(set1, set2) {
  const intersection = new Set();
  for (const item of set1) {
    if (set2.has(item)) {
      intersection.add(item);
    }
  }
  return intersection;
}

export function filterProperties(object, properties, {
  preserveOriginalOrder = false,
} = {}) {
  if (typeof object !== 'object' || object === null) {
    throw new TypeError(`Expected object to be an object, got ${typeAppearance(object)}`);
  }

  if (!Array.isArray(properties)) {
    throw new TypeError(`Expected properties to be an array, got ${typeAppearance(properties)}`);
  }

  const filteredObject = {};

  if (preserveOriginalOrder) {
    for (const property of Object.keys(object)) {
      if (properties.includes(property)) {
        filteredObject[property] = object[property];
      }
    }
  } else {
    for (const property of properties) {
      if (Object.hasOwn(object, property)) {
        filteredObject[property] = object[property];
      }
    }
  }

  return filteredObject;
}

export function queue(array, max = 50) {
  if (max === 0) {
    return array.map((fn) => fn());
  }

  const begin = [];
  let current = 0;
  const ret = array.map(
    (fn) =>
      new Promise((resolve, reject) => {
        begin.push(() => {
          current++;
          Promise.resolve(fn()).then((value) => {
            current--;
            if (current < max && begin.length) {
              begin.shift()();
            }
            resolve(value);
          }, reject);
        });
      })
  );

  for (let i = 0; i < max && begin.length; i++) {
    begin.shift()();
  }

  return ret;
}

export function delay(ms) {
  return new Promise((res) => setTimeout(res, ms));
}

// Stolen from here: https://stackoverflow.com/a/3561711
//
// There's a proposal for a native JS function like this, 8ut it's not even
// past stage 1 yet: https://github.com/tc39/proposal-regex-escaping
export function escapeRegex(string) {
  return string.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
}

// Gets the "look" of some arbitrary value. It's like typeof, but smarter.
// Don't use this for actually validating types - it's only suitable for
// inclusion in error messages.
export function typeAppearance(value) {
  if (value === null) return 'null';
  if (value === undefined) return 'undefined';
  if (Array.isArray(value)) return 'array';
  return typeof value;
}

// Limits a string to the desired length, filling in an ellipsis at the end
// if it cuts any text off.
export function cut(text, length = 40) {
  if (text.length >= length) {
    return text.slice(0, Math.max(1, length - 3)) + '...';
  } else {
    return text;
  }
}

// Iterates over regular expression matches within a single- or multiline
// string, yielding each match as well as:
//
// * its line and column numbers;
// * if `formatWhere` is true (the default), a pretty-formatted,
//   human-readable indication of the match's placement in the string;
// * if `getContainingLine` is true, the entire line (or multiple lines)
//   of text containing the match.
//
export function* matchMultiline(content, matchRegexp, {
  formatWhere = true,
  getContainingLine = false,
} = {}) {
  const lineRegexp = /\n/g;
  const isMultiline = content.includes('\n');

  let lineNumber = 0;
  let startOfLine = 0;
  let previousIndex = 0;

  const countLineBreaks = (offset, range) => {
    const lineBreaks = Array.from(range.matchAll(lineRegexp));
    if (!empty(lineBreaks)) {
      lineNumber += lineBreaks.length;
      startOfLine = offset + lineBreaks.at(-1).index + 1;
    }
  };

  for (const match of content.matchAll(matchRegexp)) {
    countLineBreaks(
      previousIndex,
      content.slice(previousIndex, match.index));

    const matchStartOfLine = startOfLine;

    previousIndex = match.index + match[0].length;

    const columnNumber = match.index - startOfLine;

    let where = null;
    if (formatWhere) {
      where =
        colors.yellow(
          (isMultiline
            ? `line: ${lineNumber + 1}, col: ${columnNumber + 1}`
            : `pos: ${match.index + 1}`));
    }

    countLineBreaks(match.index, match[0]);

    let containingLine = null;
    if (getContainingLine) {
      const nextLineResult =
        content
          .slice(previousIndex)
          .matchAll(lineRegexp)
          .next();

      const nextStartOfLine =
        (nextLineResult.done
          ? content.length
          : previousIndex + nextLineResult.value.index);

      containingLine =
        content.slice(matchStartOfLine, nextStartOfLine);
    }

    yield {
      match,
      lineNumber,
      columnNumber,
      where,
      containingLine,
    };
  }
}

// Binds default values for arguments in a {key: value} type function argument
// (typically the second argument, but may be overridden by providing a
// [bindOpts.bindIndex] argument). Typically useful for preparing a function for
// reuse within one or multiple other contexts, which may not be aware of
// required or relevant values provided in the initial context.
//
// This function also passes the identity of `this` through (the returned value
// is not an arrow function), though note it's not a true bound function either
// (since Function.prototype.bind only supports positional arguments, not
// "options" specified via key/value).
//
export function bindOpts(fn, bind) {
  const bindIndex = bind[bindOpts.bindIndex] ?? 1;

  const bound = function (...args) {
    const opts = args[bindIndex] ?? {};
    return Reflect.apply(fn, this, [
      ...args.slice(0, bindIndex),
      {...bind, ...opts}
    ]);
  };

  annotateFunction(bound, {
    name: fn,
    trait: 'options-bound',
  });

  for (const [key, descriptor] of Object.entries(Object.getOwnPropertyDescriptors(fn))) {
    if (key === 'length') continue;
    if (key === 'name') continue;
    if (key === 'arguments') continue;
    if (key === 'caller') continue;
    if (key === 'prototype') continue;
    Object.defineProperty(bound, key, descriptor);
  }

  return bound;
}

bindOpts.bindIndex = Symbol();

// Utility function for providing useful interfaces to the JS AggregateError
// class.
//
// Generally, this works by returning a set of interfaces which operate on
// functions: wrap() takes a function and returns a new function which passes
// its arguments through and appends any resulting error to the internal error
// list; call() simplifies this process by wrapping the provided function and
// then calling it immediately. Once the process for which errors should be
// aggregated is complete, close() constructs and throws an AggregateError
// object containing all caught errors (or doesn't throw anything if there were
// no errors).
export function openAggregate({
  // Constructor to use, defaulting to the builtin AggregateError class.
  // Anything passed here should probably extend from that! May be used for
  // letting callers programatically distinguish between multiple aggregate
  // errors.
  //
  // This should be provided using the aggregateThrows utility function.
  [openAggregate.errorClassSymbol]: errorClass = AggregateError,

  // Optional human-readable message to describe the aggregate error, if
  // constructed.
  message = '',

  // Optional flag to indicate that this layer of the aggregate error isn't
  // generally useful outside of developer debugging purposes - it will be
  // skipped by default when using showAggregate, showing contained errors
  // inline with other children of this aggregate's parent.
  //
  // If set to 'single', it'll be hidden only if there's a single error in the
  // aggregate (so it's not grouping multiple errors together).
  translucent = false,

  // Value to return when a provided function throws an error. If this is a
  // function, it will be called with the arguments given to the function.
  // (This is primarily useful when wrapping a function and then providing it
  // to another utility, e.g. array.map().)
  returnOnFail = null,
} = {}) {
  const errors = [];

  const aggregate = {};

  aggregate.wrap =
    (fn) =>
    (...args) => {
      try {
        return fn(...args);
      } catch (error) {
        errors.push(error);
        return typeof returnOnFail === 'function'
          ? returnOnFail(...args)
          : returnOnFail;
      }
    };

  aggregate.wrapAsync =
    (fn) =>
    (...args) => {
      return fn(...args).then(
        (value) => value,
        (error) => {
          errors.push(error);
          return typeof returnOnFail === 'function'
            ? returnOnFail(...args)
            : returnOnFail;
        }
      );
    };

  aggregate.push = (error) => {
    errors.push(error);
  };

  aggregate.call = (fn, ...args) => {
    return aggregate.wrap(fn)(...args);
  };

  aggregate.callAsync = (fn, ...args) => {
    return aggregate.wrapAsync(fn)(...args);
  };

  aggregate.nest = (...args) => {
    return aggregate.call(() => withAggregate(...args));
  };

  aggregate.nestAsync = (...args) => {
    return aggregate.callAsync(() => withAggregateAsync(...args));
  };

  aggregate.map = (...args) => {
    const parent = aggregate;
    const {result, aggregate: child} = mapAggregate(...args);
    parent.call(child.close);
    return result;
  };

  aggregate.mapAsync = async (...args) => {
    const parent = aggregate;
    const {result, aggregate: child} = await mapAggregateAsync(...args);
    parent.call(child.close);
    return result;
  };

  aggregate.filter = (...args) => {
    const parent = aggregate;
    const {result, aggregate: child} = filterAggregate(...args);
    parent.call(child.close);
    return result;
  };

  aggregate.throws = aggregateThrows;

  aggregate.close = () => {
    if (errors.length) {
      const error = Reflect.construct(errorClass, [errors, message]);

      if (translucent) {
        error[Symbol.for('hsmusic.aggregate.translucent')] = translucent;
      }

      throw error;
    }
  };

  return aggregate;
}

openAggregate.errorClassSymbol = Symbol('error class');

// Utility function for providing {errorClass} parameter to aggregate functions.
export function aggregateThrows(errorClass) {
  return {[openAggregate.errorClassSymbol]: errorClass};
}

// Helper function for allowing both (fn, aggregateOpts) and (aggregateOpts, fn)
// in aggregate utilities.
function _reorganizeAggregateArguments(arg1, arg2) {
  if (typeof arg1 === 'function') {
    return {fn: arg1, opts: arg2 ?? {}};
  } else if (typeof arg2 === 'function') {
    return {fn: arg2, opts: arg1 ?? {}};
  } else {
    throw new Error(`Expected a function`);
  }
}

// Performs an ordinary array map with the given function, collating into a
// results array (with errored inputs filtered out) and an error aggregate.
//
// Optionally, override returnOnFail to disable filtering and map errored inputs
// to a particular output.
//
// Note the aggregate property is the result of openAggregate(), still unclosed;
// use aggregate.close() to throw the error. (This aggregate may be passed to a
// parent aggregate: `parent.call(aggregate.close)`!)
export function mapAggregate(array, arg1, arg2) {
  const {fn, opts} = _reorganizeAggregateArguments(arg1, arg2);
  return _mapAggregate('sync', null, array, fn, opts);
}

export function mapAggregateAsync(array, arg1, arg2) {
  const {fn, opts} = _reorganizeAggregateArguments(arg1, arg2);
  const {promiseAll = Promise.all.bind(Promise), ...remainingOpts} = opts;
  return _mapAggregate('async', promiseAll, array, fn, remainingOpts);
}

// Helper function for mapAggregate which holds code common between sync and
// async versions.
export function _mapAggregate(mode, promiseAll, array, fn, aggregateOpts) {
  const failureSymbol = Symbol();

  const aggregate = openAggregate({
    returnOnFail: failureSymbol,
    ...aggregateOpts,
  });

  if (mode === 'sync') {
    const result = array
      .map(aggregate.wrap(fn))
      .filter((value) => value !== failureSymbol);
    return {result, aggregate};
  } else {
    return promiseAll(array.map(aggregate.wrapAsync(fn)))
      .then((values) => {
        const result = values.filter((value) => value !== failureSymbol);
        return {result, aggregate};
      });
  }
}

// Performs an ordinary array filter with the given function, collating into a
// results array (with errored inputs filtered out) and an error aggregate.
//
// Optionally, override returnOnFail to disable filtering errors and map errored
// inputs to a particular output.
//
// As with mapAggregate, the returned aggregate property is not yet closed.
export function filterAggregate(array, arg1, arg2) {
  const {fn, opts} = _reorganizeAggregateArguments(arg1, arg2);
  return _filterAggregate('sync', null, array, fn, opts);
}

export async function filterAggregateAsync(array, arg1, arg2) {
  const {fn, opts} = _reorganizeAggregateArguments(arg1, arg2);
  const {promiseAll = Promise.all.bind(Promise), ...remainingOpts} = opts;
  return _filterAggregate('async', promiseAll, array, fn, remainingOpts);
}

// Helper function for filterAggregate which holds code common between sync and
// async versions.
function _filterAggregate(mode, promiseAll, array, fn, aggregateOpts) {
  const failureSymbol = Symbol();

  const aggregate = openAggregate({
    returnOnFail: failureSymbol,
    ...aggregateOpts,
  });

  function filterFunction(value) {
    // Filter out results which match the failureSymbol, i.e. errored
    // inputs.
    if (value === failureSymbol) return false;

    // Always keep results which match the overridden returnOnFail
    // value, if provided.
    if (value === aggregateOpts.returnOnFail) return true;

    // Otherwise, filter according to the returned value of the wrapped
    // function.
    return value.output;
  }

  function mapFunction(value) {
    // Then turn the results back into their corresponding input, or, if
    // provided, the overridden returnOnFail value.
    return value === aggregateOpts.returnOnFail ? value : value.input;
  }

  if (mode === 'sync') {
    const result = array
      .map(aggregate.wrap((input, index, array) => {
        const output = fn(input, index, array);
        return {input, output};
      }))
      .filter(filterFunction)
      .map(mapFunction);

    return {result, aggregate};
  } else {
    return promiseAll(
      array.map(aggregate.wrapAsync(async (input, index, array) => {
        const output = await fn(input, index, array);
        return {input, output};
      }))
    ).then((values) => {
      const result = values.filter(filterFunction).map(mapFunction);

      return {result, aggregate};
    });
  }
}

// Totally sugar function for opening an aggregate, running the provided
// function with it, then closing the function and returning the result (if
// there's no throw).
export function withAggregate(arg1, arg2) {
  const {fn, opts} = _reorganizeAggregateArguments(arg1, arg2);
  return _withAggregate('sync', opts, fn);
}

export function withAggregateAsync(arg1, arg2) {
  const {fn, opts} = _reorganizeAggregateArguments(arg1, arg2);
  return _withAggregate('async', opts, fn);
}

export function _withAggregate(mode, aggregateOpts, fn) {
  const aggregate = openAggregate(aggregateOpts);

  if (mode === 'sync') {
    const result = fn(aggregate);
    aggregate.close();
    return result;
  } else {
    return fn(aggregate).then((result) => {
      aggregate.close();
      return result;
    });
  }
}

export const unhelpfulTraceLines = [
  /sugar/,
  /node:/,
  /<anonymous>/,
];

export function getUsefulTraceLine(trace, {helpful, unhelpful}) {
  if (!trace) return '';

  for (const traceLine of trace.split('\n')) {
    if (!traceLine.trim().startsWith('at')) {
      continue;
    }

    if (!empty(unhelpful)) {
      if (unhelpful.some(regex => regex.test(traceLine))) {
        continue;
      }
    }

    if (!empty(helpful)) {
      for (const regex of helpful) {
        const match = traceLine.match(regex);

        if (match) {
          return match[1] ?? traceLine;
        }
      }

      continue;
    }

    return traceLine;
  }

  return '';
}

export function showAggregate(topError, {
  pathToFileURL = f => f,
  showTraces = true,
  showTranslucent = showTraces,
  print = true,
} = {}) {
  const getTranslucency = error =>
    error[Symbol.for('hsmusic.aggregate.translucent')] ?? false;

  const determineCauseHelper = cause => {
    if (!cause) {
      return null;
    }

    const translucency = getTranslucency(cause);

    if (!translucency) {
      return cause;
    }

    if (translucency === 'single') {
      if (cause.errors?.length === 1) {
        return determineCauseHelper(cause.errors[0]);
      } else {
        return cause;
      }
    }

    return determineCauseHelper(cause.cause);
  };

  const determineCause = error =>
    (showTranslucent
      ? error.cause ?? null
      : determineCauseHelper(error.cause));

  const determineErrorsHelper = error => {
    const translucency = getTranslucency(error);

    if (!translucency) {
      return [error];
    }

    if (translucency === 'single' && error.errors?.length >= 2) {
      return [error];
    }

    const errors = [];

    if (error.cause) {
      errors.push(...determineErrorsHelper(error.cause));
    }

    if (error.errors) {
      errors.push(...error.errors.flatMap(determineErrorsHelper));
    }

    return errors;
  };

  const determineErrors = error =>
    (showTranslucent
      ? error.errors ?? null
      : error.errors?.flatMap(determineErrorsHelper) ?? null);

  const flattenErrorStructure = (error, level = 0) => {
    const cause = determineCause(error);
    const errors = determineErrors(error);

    return {
      level,

      kind: error.constructor.name,
      message: error.message,

      trace:
        (error[Symbol.for(`hsmusic.aggregate.traceFrom`)]
          ? error[Symbol.for(`hsmusic.aggregate.traceFrom`)].stack
          : error.stack),

      cause:
        (cause
          ? flattenErrorStructure(cause, level + 1)
          : null),

      errors:
        (errors
          ? errors.map(error => flattenErrorStructure(error, level + 1))
          : null),

      options: {
        alwaysTrace:
          error[Symbol.for(`hsmusic.aggregate.alwaysTrace`)],

        helpfulTraceLines:
          error[Symbol.for(`hsmusic.aggregate.helpfulTraceLines`)],

        unhelpfulTraceLines:
          error[Symbol.for(`hsmusic.aggregate.unhelpfulTraceLines`)],
      }
    };
  };

  const recursive = ({
    level,
    kind,
    message,
    trace,
    cause,
    errors,
    options: {
      alwaysTrace,
      helpfulTraceLines: ownHelpfulTraceLines,
      unhelpfulTraceLines: ownUnhelpfulTraceLines,
    },
  }, index, apparentSiblings) => {
    const subApparentSiblings =
      (cause && errors
        ? [cause, ...errors]
     : cause
        ? [cause]
     : errors
        ? errors
        : []);

    const anythingHasErrorsThisLayer =
      apparentSiblings.some(({errors}) => !empty(errors));

    const messagePart =
      message || `(no message)`;

    const kindPart =
      kind || `unnamed kind`;

    let headerPart =
      (showTraces
        ? `[${kindPart}] ${messagePart}`
     : errors
        ? `[${messagePart}]`
     : anythingHasErrorsThisLayer
        ? ` ${messagePart}`
        : messagePart);

    if (showTraces || alwaysTrace) {
      const traceLine =
        getUsefulTraceLine(trace, {
          unhelpful:
            (ownUnhelpfulTraceLines
              ? unhelpfulTraceLines.concat(ownUnhelpfulTraceLines)
              : unhelpfulTraceLines),

          helpful:
            (ownHelpfulTraceLines
              ? ownHelpfulTraceLines
              : null),
        });

      const tracePart =
        (traceLine
          ? '- ' +
            traceLine
              .trim()
              .replace(/file:\/\/.*\.js/, (match) => pathToFileURL(match))
          : '(no stack trace)');

      headerPart += ` ${colors.dim(tracePart)}`;
    }

    const head1 = level % 2 === 0 ? '\u21aa' : colors.dim('\u21aa');
    const bar1 = ' ';

    const causePart =
      (cause
        ? recursive(cause, 0, subApparentSiblings)
            .split('\n')
            .map((line, i) => i === 0 ? ` ${head1} ${line}` : ` ${bar1} ${line}`)
            .join('\n')
        : '');

    const head2 = level % 2 === 0 ? '\u257f' : colors.dim('\u257f');
    const bar2 = level % 2 === 0 ? '\u2502' : colors.dim('\u254e');

    const errorsPart =
      (errors
        ? errors
            .map((error, index) => recursive(error, index + 1, subApparentSiblings))
            .flatMap(str => str.split('\n'))
            .map((line, i) => i === 0 ? ` ${head2} ${line}` : ` ${bar2} ${line}`)
            .join('\n')
        : '');

    return [headerPart, errorsPart, causePart].filter(Boolean).join('\n');
  };

  const structure = flattenErrorStructure(topError);
  const message = recursive(structure, 0, [structure]);

  if (print) {
    console.error(message);
  } else {
    return message;
  }
}

export function annotateError(error, ...callbacks) {
  for (const callback of callbacks) {
    error = callback(error) ?? error;
  }

  return error;
}

export function annotateErrorWithIndex(error, index) {
  return Object.assign(error, {
    [Symbol.for('hsmusic.annotateError.indexInSourceArray')]:
      index,

    message:
      `(${colors.yellow(`#${index + 1}`)}) ` +
      error.message,
  });
}

export function annotateErrorWithFile(error, file) {
  return Object.assign(error, {
    [Symbol.for('hsmusic.annotateError.file')]:
      file,

    message:
      error.message +
      (error.message.includes('\n') ? '\n' : ' ') +
      `(file: ${colors.bright(colors.blue(file))})`,
  });
}

export function asyncAdaptiveDecorateError(fn, callback) {
  if (typeof callback !== 'function') {
    throw new Error(`Expected callback to be a function, got ${typeAppearance(callback)}`);
  }

  const syncDecorated = function (...args) {
    try {
      return fn(...args);
    } catch (caughtError) {
      throw callback(caughtError, ...args);
    }
  };

  const asyncDecorated = async function(...args) {
    try {
      return await fn(...args);
    } catch (caughtError) {
      throw callback(caughtError, ...args);
    }
  };

  syncDecorated.async = asyncDecorated;

  return syncDecorated;
}

export function decorateError(fn, callback) {
  return asyncAdaptiveDecorateError(fn, callback);
}

export function asyncDecorateError(fn, callback) {
  return asyncAdaptiveDecorateError(fn, callback).async;
}

export function decorateErrorWithAnnotation(fn, ...annotationCallbacks) {
  return asyncAdaptiveDecorateError(fn,
    (caughtError, ...args) =>
      annotateError(caughtError,
        ...annotationCallbacks
          .map(callback => error => callback(error, ...args))));
}

export function decorateErrorWithIndex(fn) {
  return decorateErrorWithAnnotation(fn,
    (caughtError, _value, index) =>
      annotateErrorWithIndex(caughtError, index));
}

export function decorateErrorWithCause(fn, cause) {
  return asyncAdaptiveDecorateError(fn,
    (caughtError) =>
      Object.assign(caughtError, {cause}));
}

export function asyncDecorateErrorWithAnnotation(fn, ...annotationCallbacks) {
  return decorateErrorWithAnnotation(fn, ...annotationCallbacks).async;
}

export function asyncDecorateErrorWithIndex(fn) {
  return decorateErrorWithIndex(fn).async;
}

export function asyncDecorateErrorWithCause(fn, cause) {
  return decorateErrorWithCause(fn, cause).async;
}

export function conditionallySuppressError(conditionFn, callbackFn) {
  return (...args) => {
    try {
      return callbackFn(...args);
    } catch (error) {
      if (conditionFn(error, ...args) === true) {
        return;
      }

      throw error;
    }
  };
}

// Delicious function annotations, such as:
//
//   (*bound) soWeAreBackInTheMine
//   (data *unfulfilled) generateShrekTwo
//
export function annotateFunction(fn, {
  name: nameOrFunction = null,
  description: newDescription,
  trait: newTrait,
}) {
  let name;

  if (typeof nameOrFunction === 'function') {
    name = nameOrFunction.name;
  } else if (typeof nameOrFunction === 'string') {
    name = nameOrFunction;
  }

  name ??= fn.name ?? 'anonymous';

  const match = name.match(/^ *(?<prefix>.*?) *\((?<description>.*)( #(?<trait>.*))?\) *(?<suffix>.*) *$/);

  let prefix, suffix, description, trait;
  if (match) {
    ({prefix, suffix, description, trait} = match.groups);
  }

  prefix ??= '';
  suffix ??= name;
  description ??= '';
  trait ??= '';

  if (newDescription) {
    if (description) {
      description += '; ' + newDescription;
    } else {
      description = newDescription;
    }
  }

  if (newTrait) {
    if (trait) {
      trait += ' #' + newTrait;
    } else {
      trait = '#' + newTrait;
    }
  }

  let parenthesesPart;

  if (description && trait) {
    parenthesesPart = `${description} ${trait}`;
  } else if (description || trait) {
    parenthesesPart = description || trait;
  } else {
    parenthesesPart = '';
  }

  let finalName;

  if (prefix && parenthesesPart) {
    finalName = `${prefix} (${parenthesesPart}) ${suffix}`;
  } else if (parenthesesPart) {
    finalName = `(${parenthesesPart}) ${suffix}`;
  } else {
    finalName = suffix;
  }

  Object.defineProperty(fn, 'name', {value: finalName});
}
