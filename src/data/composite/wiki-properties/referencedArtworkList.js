import {input, templateCompositeFrom} from '#composite';
import find from '#find';
import {isDate} from '#validators';
import {combineWikiDataArrays} from '#wiki-data';

import annotatedReferenceList from './annotatedReferenceList.js';

export default templateCompositeFrom({
  annotation: `referencedArtworkList`,

  compose: false,

  inputs: {
    date: input({
      validate: isDate,
      acceptsNull: true,
    }),
  },

  steps: () => [
    {
      dependencies: [
        'albumData',
        'trackData',
      ],

      compute: (continuation, {
        albumData,
        trackData,
      }) => continuation({
        ['#data']:
          combineWikiDataArrays([
            albumData,
            trackData,
          ]),
      }),
    },

    {
      compute: (continuation) => continuation({
        ['#find']:
          find.mixed({
            track: find.trackWithArtwork,
            album: find.albumWithArtwork,
          }),
      }),
    },

    annotatedReferenceList({
      referenceType: input.value(['album', 'track']),
      data: '#data',
      find: '#find',
      date: input('date'),
    }),
  ],
});
