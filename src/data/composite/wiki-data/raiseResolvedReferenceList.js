// Concludes compositions like withResolvedReferenceList, which share behavior
// in processing the resolved results before continuing further.

import {input, templateCompositeFrom} from '#composite';

import {withFilteredList} from '#composite/data';

import inputNotFoundMode from './inputNotFoundMode.js';

export default templateCompositeFrom({
  inputs: {
    notFoundMode: inputNotFoundMode(),

    results: input({type: 'array'}),
    filter: input({type: 'array'}),

    exitValue: input({defaultValue: []}),

    outputs: input.staticValue({type: 'string'}),
  },

  // TODO: Is it even necessary to specify outputs if you're using
  // raiseOutputAbove??
  outputs: ({
    [input.staticValue('outputs')]: outputs,
  }) => [outputs],

  steps: () => [
    {
      dependencies: [
        input('results'),
        input('filter'),
        input('outputs'),
      ],

      compute: (continuation, {
        [input('results')]: results,
        [input('filter')]: filter,
        [input('outputs')]: outputs,
      }) =>
        (filter.every(keep => keep)
          ? continuation.raiseOutput({[outputs]: results})
          : continuation()),
    },

    {
      dependencies: [
        input('notFoundMode'),
        input('exitValue'),
      ],

      compute: (continuation, {
        [input('notFoundMode')]: notFoundMode,
        [input('exitValue')]: exitValue,
      }) =>
        (notFoundMode === 'exit'
          ? continuation.exit(exitValue)
          : continuation()),
    },

    {
      dependencies: [
        input('results'),
        input('notFoundMode'),
        input('outputs'),
      ],

      compute: (continuation, {
        [input('results')]: results,
        [input('notFoundMode')]: notFoundMode,
        [input('outputs')]: outputs,
      }) =>
        (notFoundMode === 'null'
          ? continuation.raiseOutput({[outputs]: results})
          : continuation()),
    },

    withFilteredList({
      list: input('results'),
      filter: input('filter'),
    }),

    {
      dependencies: [
        '#filteredList',
        input('outputs'),
      ],

      compute: (continuation, {
        ['#filteredList']: filteredList,
        [input('outputs')]: outputs,
      }) => continuation({
        [outputs]:
          filteredList,
      }),
    },
  ],
});
