import {input, templateCompositeFrom} from '#composite';
import {stitchArrays} from '#sugar';
import {isDate, isObject, validateArrayItems} from '#validators';

import {withPropertyFromList} from '#composite/data';

import {
  exitWithoutDependency,
  raiseOutputWithoutDependency,
  withAvailabilityFilter,
} from '#composite/control-flow';

import inputNotFoundMode from './inputNotFoundMode.js';
import inputWikiData from './inputWikiData.js';
import raiseResolvedReferenceList from './raiseResolvedReferenceList.js';
import withResolvedReferenceList from './withResolvedReferenceList.js';

export default templateCompositeFrom({
  annotation: `withResolvedAnnotatedReferenceList`,

  inputs: {
    list: input({
      validate: validateArrayItems(isObject),
      acceptsNull: true,
    }),

    date: input({
      validate: isDate,
      acceptsNull: true,
    }),

    reference: input({type: 'string', defaultValue: 'reference'}),
    annotation: input({type: 'string', defaultValue: 'annotation'}),
    thing: input({type: 'string', defaultValue: 'thing'}),

    data: inputWikiData({allowMixedTypes: true}),
    find: input({type: 'function'}),

    notFoundMode: inputNotFoundMode(),
  },

  outputs: ['#resolvedAnnotatedReferenceList'],

  steps: () => [
    exitWithoutDependency({
      dependency: input('data'),
      value: input.value([]),
    }),

    raiseOutputWithoutDependency({
      dependency: input('list'),
      mode: input.value('empty'),
      output: input.value({
        ['#resolvedAnnotatedReferenceList']: [],
      }),
    }),

    withPropertyFromList({
      list: input('list'),
      property: input('reference'),
    }).outputs({
      ['#values']: '#references',
    }),

    withPropertyFromList({
      list: input('list'),
      property: input('annotation'),
    }).outputs({
      ['#values']: '#annotations',
    }),

    withResolvedReferenceList({
      list: '#references',
      data: input('data'),
      find: input('find'),
      notFoundMode: input.value('null'),
    }),

    {
      dependencies: [
        input('thing'),
        input('annotation'),
        '#resolvedReferenceList',
        '#annotations',
      ],

      compute: (continuation, {
        [input('thing')]: thingProperty,
        [input('annotation')]: annotationProperty,
        ['#resolvedReferenceList']: things,
        ['#annotations']: annotations,
      }) => continuation({
        ['#matches']:
          stitchArrays({
            [thingProperty]: things,
            [annotationProperty]: annotations,
          }),
      }),
    },

    {
      dependencies: ['#matches', input('date')],
      compute: (continuation, {
        ['#matches']: matches,
        [input('date')]: date,
      }) => continuation({
        ['#matches']:
          matches.map(match => ({...match, date})),
      }),
    },

    withAvailabilityFilter({
      from: '#resolvedReferenceList',
    }),

    raiseResolvedReferenceList({
      notFoundMode: input('notFoundMode'),
      results: '#matches',
      filter: '#availabilityFilter',
      outputs: input.value('#resolvedAnnotatedReferenceList'),
    }),
  ],
})
