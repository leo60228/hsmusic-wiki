// Applies a filter - an array of truthy and falsy values - to the index-
// corresponding items in a list. Items which correspond to a truthy value
// are kept, and the rest are excluded from the output list.
//
// If the flip option is set, only items corresponding with a *falsy* value in
// the filter are kept.
//
// TODO: It would be neat to apply an availability check here, e.g. to allow
// not providing a filter at all and performing the check on the contents of
// the list (though on the filter, if present, is fine too). But that's best
// done by some shmancy-fancy mapping support in composite.js, so a bit out
// of reach for now (apart from proving uses built on top of a more boring
// implementation).
//
// TODO: There should be two outputs - one for the items included according to
// the filter, and one for the items excluded.
//
// See also:
//  - withMappedList
//  - withSortedList
//

import {input, templateCompositeFrom} from '#composite';

export default templateCompositeFrom({
  annotation: `withFilteredList`,

  inputs: {
    list: input({type: 'array'}),
    filter: input({type: 'array'}),

    flip: input({
      type: 'boolean',
      defaultValue: false,
    }),
  },

  outputs: ['#filteredList'],

  steps: () => [
    {
      dependencies: [input('list'), input('filter'), input('flip')],
      compute: (continuation, {
        [input('list')]: list,
        [input('filter')]: filter,
        [input('flip')]: flip,
      }) => continuation({
        '#filteredList':
          list.filter((_item, index) =>
            (flip
              ? !filter[index]
              :  filter[index])),
      }),
    },
  ],
});
