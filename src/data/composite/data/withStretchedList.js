// Repeats each item in a list in-place by a corresponding length.

import {input, templateCompositeFrom} from '#composite';
import {repeat, stitchArrays} from '#sugar';
import {isNumber, validateArrayItems} from '#validators';

export default templateCompositeFrom({
  annotation: `withStretchedList`,

  inputs: {
    list: input({type: 'array'}),

    lengths: input({
      validate: validateArrayItems(isNumber),
    }),
  },

  outputs: ['#stretchedList'],

  steps: () => [
    {
      dependencies: [input('list'), input('lengths')],
      compute: (continuation, {
        [input('list')]: list,
        [input('lengths')]: lengths,
      }) => continuation({
        ['#stretchedList']:
          stitchArrays({
            item: list,
            length: lengths,
          }).map(({item, length}) => repeat(length, [item]))
            .flat(),
      }),
    },
  ],
});
