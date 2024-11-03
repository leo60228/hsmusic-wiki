import {input, templateCompositeFrom} from '#composite';

import {raiseOutputWithoutDependency} from '#composite/control-flow';

import withPropertyFromAlbum from './withPropertyFromAlbum.js';
import withSuffixDirectoryFromAlbum from './withSuffixDirectoryFromAlbum.js';

export default templateCompositeFrom({
  annotation: `withDirectorySuffix`,

  outputs: ['#directorySuffix'],

  steps: () => [
    withSuffixDirectoryFromAlbum(),

    raiseOutputWithoutDependency({
      dependency: '#suffixDirectoryFromAlbum',
      mode: input.value('falsy'),
      output: input.value({['#directorySuffix']: null}),
    }),

    withPropertyFromAlbum({
      property: input.value('directorySuffix'),
    }),

    {
      dependencies: ['#album.directorySuffix'],
      compute: (continuation, {
        ['#album.directorySuffix']: directorySuffix,
      }) => continuation({
        ['#directorySuffix']:
          directorySuffix,
      }),
    },
  ],
});
