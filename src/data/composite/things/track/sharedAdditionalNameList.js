// Compiles additional names directly provided by other releases.

import {input, templateCompositeFrom} from '#composite';

import {exitWithoutDependency, exposeDependency}
  from '#composite/control-flow';

import {
  withFilteredList,
  withFlattenedList,
  withPropertyFromList,
} from '#composite/data';

import withOtherReleases from './withOtherReleases.js';

export default templateCompositeFrom({
  annotation: `sharedAdditionalNameList`,

  compose: false,

  steps: () => [
    withOtherReleases(),

    exitWithoutDependency({
      dependency: '#otherReleases',
      mode: input.value('empty'),
      value: input.value([]),
    }),

    withPropertyFromList({
      list: '#otherReleases',
      property: input.value('additionalNames'),
    }),

    withFlattenedList({
      list: '#otherReleases.additionalNames',
    }).outputs({
      ['#flattenedList']: '#otherReleaseEntries',
    }),

    withPropertyFromList({
      list: '#otherReleaseEntries',
      property: input.value('specificAlbumExclusive'),
    }),

    // Filter out entries that have been marked as exclusive to the containing
    // album.
    withFilteredList({
      list: '#otherReleaseEntries',
      filter: '#otherReleaseEntries.specificAlbumExclusive',
      flip: input.value(true),
    }),

    exposeDependency({
      dependency: '#filteredList',
    }),
  ],
});
