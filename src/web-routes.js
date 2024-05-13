import {readdir} from 'node:fs/promises';
import * as path from 'node:path';
import {fileURLToPath} from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const codeSrcPath = __dirname;
const codeRootPath = path.resolve(codeSrcPath, '..');

function getNodeDependencyRootPath(dependencyName) {
  return (
    path.dirname(
      fileURLToPath(
        import.meta.resolve(dependencyName))));
}

export const stationaryCodeRoutes = [
  {
    from: path.join(codeSrcPath, 'static', 'css'),
    to: ['staticCSS.root'],
  },

  {
    from: path.join(codeSrcPath, 'static', 'js'),
    to: ['staticJS.root'],
  },

  {
    from: path.join(codeSrcPath, 'static', 'misc'),
    to: ['staticMisc.root'],
  },

  {
    from: path.join(codeSrcPath, 'util'),
    to: ['staticSharedUtil.root'],
  },
];

function quickNodeDependency({
  name,
  path: subpath = '',
}) {
  const root = getNodeDependencyRootPath(name);

  return [
    {
      from:
        (subpath
          ? path.join(root, subpath)
          : root),

      to: ['staticLib.path', name],
    },
  ];
}

export const dependencyRoutes = [
  quickNodeDependency({
    name: 'chroma-js',
  }),

  quickNodeDependency({
    name: 'compress-json',
    path: '..', // exit dist, access bundle.js
  }),

  quickNodeDependency({
    name: 'flexsearch',
  }),

  quickNodeDependency({
    name: 'msgpackr',
    path: 'dist',
  }),
].flat();

export const allStaticWebRoutes = [
  ...stationaryCodeRoutes,
  ...dependencyRoutes,
];

export async function identifyDynamicWebRoutes({
  mediaPath,
  mediaCachePath,
  wikiCachePath,
}) {
  const routeFunctions = [
    () => Promise.resolve([
      {from: path.resolve(mediaPath), to: ['media.root']},
      {from: path.resolve(mediaCachePath), to: ['thumb.root']},
    ]),

    () => {
      if (!wikiCachePath) return [];

      const from =
        path.resolve(path.join(wikiCachePath, 'search'));

      return (
        readdir(from).then(
          () => [{from, to: ['searchData.root']}],
          () => []));
    },
  ];

  const routeCheckPromises =
    routeFunctions.map(fn => fn());

  const routeCheckResults =
    await Promise.all(routeCheckPromises);

  return routeCheckResults.flat();
}

export async function identifyAllWebRoutes(opts) {
  return [
    ...allStaticWebRoutes,
    ...await identifyDynamicWebRoutes(opts),
  ];
}
