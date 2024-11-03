import {input, templateCompositeFrom} from '#composite';

import {withResultOfAvailabilityCheck} from '#composite/control-flow';

import withPropertyFromAlbum from './withPropertyFromAlbum.js';

export default templateCompositeFrom({
  annotation: `withSuffixDirectoryFromAlbum`,

  inputs: {
    flagValue: input({
      defaultDependency: 'suffixDirectoryFromAlbum',
      acceptsNull: true,
    }),
  },

  outputs: ['#suffixDirectoryFromAlbum'],

  steps: () => [
    withResultOfAvailabilityCheck({
      from: 'suffixDirectoryFromAlbum',
    }),

    {
      dependencies: [
        '#availability',
        'suffixDirectoryFromAlbum'
      ],

      compute: (continuation, {
        ['#availability']: availability,
        ['suffixDirectoryFromAlbum']: flagValue,
      }) =>
        (availability
          ? continuation.raiseOutput({['#suffixDirectoryFromAlbum']: flagValue})
          : continuation()),
    },

    withPropertyFromAlbum({
      property: input.value('suffixTrackDirectories'),
    }),

    {
      dependencies: ['#album.suffixTrackDirectories'],
      compute: (continuation, {
        ['#album.suffixTrackDirectories']: suffixTrackDirectories,
      }) => continuation({
        ['#suffixDirectoryFromAlbum']:
          suffixTrackDirectories,
      }),
    },
  ],
});
