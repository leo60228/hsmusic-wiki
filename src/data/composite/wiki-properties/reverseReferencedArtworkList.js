import {input, templateCompositeFrom} from '#composite';
import {combineWikiDataArrays} from '#wiki-data';

import {exposeDependency} from '#composite/control-flow';
import {inputWikiData, withReverseAnnotatedReferenceList}
  from '#composite/wiki-data';

export default templateCompositeFrom({
  annotation: `reverseReferencedArtworkList`,

  compose: false,

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

    withReverseAnnotatedReferenceList({
      data: '#data',
      list: input.value('referencedArtworks'),
    }),

    exposeDependency({dependency: '#reverseAnnotatedReferenceList'}),
  ],
});
