import {input, templateCompositeFrom} from '#composite';
import {stitchArrays} from '#sugar';
import {is, isString, optional, validateArrayItems, validateProperties}
  from '#validators';

import {withFilteredList, withMappedList, withPropertiesFromList}
  from '#composite/data';

import inputWikiData from './inputWikiData.js';
import withResolvedReferenceList from './withResolvedReferenceList.js';

export default templateCompositeFrom({
  annotation: `withResolvedArtworkReferenceList`,

  inputs: {
    list: input({
      validate:
        validateArrayItems(
          validateProperties({
            reference: isString,
            annotation: optional(isString),
          })),

      acceptsNull: true,
    }),

    data: inputWikiData({allowMixedTypes: true}),
    find: input({type: 'function'}),

    notFoundMode: input({
      validate: is('exit', 'filter', 'null'),
      defaultValue: 'filter',
    }),
  },

  outputs: ['#resolvedArtworkReferenceList'],

  steps: () => [
    withPropertiesFromList({
      list: input('list'),
      properties: input.value([
        'reference',
        'annotation',
      ]),
    }),

    withResolvedReferenceList({
      list: '#list.reference',
      data: input('data'),
      find: input('find'),
      notFoundMode: input.value('null'),
    }),

    {
      dependencies: [
        '#resolvedReferenceList',
        '#list.annotation',
      ],

      compute: (continuation, {
        ['#resolvedReferenceList']: thing,
        ['#list.annotation']: annotation,
      }) => continuation({
        ['#matches']:
          stitchArrays({
            thing,
            annotation,
          }),
      }),
    },

    {
      dependencies: ['#matches'],
      compute: (continuation, {'#matches': matches}) =>
        (matches.every(match => match)
          ? continuation.raiseOutput({
              ['#resolvedArtworkReferenceList']:
                matches,
            })
          : continuation()),
    },

    {
      dependencies: [input('notFoundMode')],
      compute: (continuation, {
        [input('notFoundMode')]: notFoundMode,
      }) =>
        (notFoundMode === 'exit'
          ? continuation.exit([])
          : continuation()),
    },

    {
      dependencies: ['#matches', input('notFoundMode')],
      compute: (continuation, {
        ['#matches']: matches,
        [input('notFoundMode')]: notFoundMode,
      }) =>
        (notFoundMode === 'null'
          ? continuation.raiseOutput({
              ['#resolvedArtworkReferenceList']:
                matches,
            })
          : continuation()),
    },

    withMappedList({
      list: '#resolvedReferenceList',
      map: input.value(thing => thing !== null),
    }),

    withFilteredList({
      list: '#matches',
      filter: '#mappedList',
    }),

    {
      dependencies: ['#filteredList'],
      compute: (continuation, {
        ['#filteredList']: filteredList,
      }) => continuation({
        ['#resolvedArtworkReferenceList']:
          filteredList,
      }),
    },
  ],
})
