import {input, templateCompositeFrom} from '#composite';
import {stitchArrays} from '#sugar';
import {isString, optional, validateArrayItems, validateProperties}
  from '#validators';

import {withAvailabilityFilter} from '#composite/control-flow';
import {withPropertiesFromList} from '#composite/data';

import inputNotFoundMode from './inputNotFoundMode.js';
import inputWikiData from './inputWikiData.js';
import raiseResolvedReferenceList from './raiseResolvedReferenceList.js';
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

    notFoundMode: inputNotFoundMode(),
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

    withAvailabilityFilter({
      from: '#resolvedReferenceList',
    }),

    raiseResolvedReferenceList({
      notFoundMode: input('notFoundMode'),
      results: '#matches',
      filter: '#availabilityFilter',
      outputs: input.value('#resolvedArtworkReferenceList'),
    }),
  ],
})
