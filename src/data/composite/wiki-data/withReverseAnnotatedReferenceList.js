// Analogous implementation for withReverseReferenceList, for annotated
// references.
//
// Unlike withReverseContributionList, this composition is responsible for
// "flipping" the directionality of references: in a forward reference list,
// `thing` points to the thing being referenced, while here, it points to the
// referencing thing.

import withReverseList_template from './helpers/withReverseList-template.js';

import {input} from '#composite';
import {stitchArrays} from '#sugar';

import {
  withFlattenedList,
  withMappedList,
  withPropertyFromList,
  withStretchedList,
} from '#composite/data';

export default withReverseList_template({
  annotation: `withReverseAnnotatedReferenceList`,

  propertyInputName: 'list',
  outputName: '#reverseAnnotatedReferenceList',

  customCompositionSteps: () => [
    withPropertyFromList({
      list: input('data'),
      property: input('list'),
    }).outputs({
      '#values': '#referenceLists',
    }),

    withPropertyFromList({
      list: '#referenceLists',
      property: input.value('length'),
    }),

    withFlattenedList({
      list: '#referenceLists',
    }).outputs({
      '#flattenedList': '#references',
    }),

    withStretchedList({
      list: input('data'),
      lengths: '#referenceLists.length',
    }).outputs({
      '#stretchedList': '#things',
    }),

    withPropertyFromList({
      list: '#references',
      property: input.value('annotation'),
    }).outputs({
      '#references.annotation': '#annotations',
    }),

    {
      dependencies: ['#things', '#annotations'],
      compute: (continuation, {
        ['#things']: things,
        ['#annotations']: annotations,
      }) => continuation({
        ['#referencingThings']:
          stitchArrays({
            thing: things,
            annotation: annotations,
          }),
      }),
    },

    withMappedList({
      list: '#references',
      map: input.value(reference => [reference.thing]),
    }).outputs({
      '#mappedList': '#referencedThings',
    }),
  ],
});
