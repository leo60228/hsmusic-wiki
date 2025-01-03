// Analogous implementation for withReverseReferenceList, for annotated
// references.
//
// Unlike withReverseContributionList, this composition is responsible for
// "flipping" the directionality of references: in a forward reference list,
// `thing` points to the thing being referenced, while here, it points to the
// referencing thing.
//
// This behavior can be customized to respect reference lists which are shaped
// differently than the default and/or to customize the reversed property and
// provide a less generic label than just "thing".

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

  additionalInputs: {
    forward: input({type: 'string', defaultValue: 'thing'}),
    backward: input({type: 'string', defaultValue: 'thing'}),
    annotation: input({type: 'string', defaultValue: 'annotation'}),
  },

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
      property: input('annotation'),
    }).outputs({
      '#values': '#annotations',
    }),

    withPropertyFromList({
      list: '#references',
      property: input.value('date'),
    }).outputs({
      '#references.date': '#dates',
    }),

    {
      dependencies: [
        input('backward'),
        input('annotation'),
        '#things',
        '#annotations',
        '#dates',
      ],

      compute: (continuation, {
        [input('backward')]: thingProperty,
        [input('annotation')]: annotationProperty,
        ['#things']: things,
        ['#annotations']: annotations,
        ['#dates']: dates,
      }) => continuation({
        '#referencingThings':
          stitchArrays({
            [thingProperty]: things,
            [annotationProperty]: annotations,
            date: dates,
          }),
      }),
    },

    withPropertyFromList({
      list: '#references',
      property: input('forward'),
    }).outputs({
      '#values': '#individualReferencedThings',
    }),

    withMappedList({
      list: '#individualReferencedThings',
      map: input.value(thing => [thing]),
    }).outputs({
      '#mappedList': '#referencedThings',
    }),
  ],
});
