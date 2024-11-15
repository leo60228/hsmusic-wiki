import {input, templateCompositeFrom} from '#composite';
import find from '#find';
import {validateAnnotatedReferenceList} from '#validators';
import {combineWikiDataArrays} from '#wiki-data';

import {exposeDependency} from '#composite/control-flow';
import {withResolvedArtworkReferenceList} from '#composite/wiki-data';

export default templateCompositeFrom({
  annotation: `referencedArtworkList`,

  update: ({
    [input.staticValue('class')]: thingClass,
    [input.staticValue('referenceType')]: referenceType,
  }) => ({
    validate:
      validateAnnotatedReferenceList(['album', 'track']),
  }),

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
            track: find.track,
            album: find.album,
          }),
      }),
    },

    withResolvedArtworkReferenceList({
      list: input.updateValue(),
      data: '#data',
      find: '#find',
    }),

    exposeDependency({dependency: '#resolvedArtworkReferenceList'}),
  ],
});
