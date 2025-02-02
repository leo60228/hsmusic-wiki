import {input, templateCompositeFrom} from '#composite';
import find from '#find';
import {empty, stitchArrays} from '#sugar';
import {isTrackSectionList} from '#validators';
import {filterMultipleArrays} from '#wiki-data';

import {exitWithoutDependency, exitWithoutUpdateValue}
  from '#composite/control-flow';
import {withResolvedReferenceList} from '#composite/wiki-data';

import {
  fillMissingListItems,
  withFlattenedList,
  withPropertiesFromList,
  withUnflattenedList,
} from '#composite/data';

export default templateCompositeFrom({
  annotation: `withTrackSections`,

  outputs: ['#trackSections'],

  steps: () => [
    exitWithoutDependency({
      dependency: 'ownTrackData',
      value: input.value([]),
    }),

    exitWithoutUpdateValue({
      mode: input.value('empty'),
      value: input.value([]),
    }),

    // TODO: input.updateValue description down here is a kludge.
    withPropertiesFromList({
      list: input.updateValue({
        validate: isTrackSectionList,
      }),
      prefix: input.value('#sections'),
      properties: input.value([
        'tracks',
        'dateOriginallyReleased',
        'isDefaultTrackSection',
        'name',
        'color',
      ]),
    }),

    fillMissingListItems({
      list: '#sections.tracks',
      fill: input.value([]),
    }),

    fillMissingListItems({
      list: '#sections.isDefaultTrackSection',
      fill: input.value(false),
    }),

    fillMissingListItems({
      list: '#sections.name',
      fill: input.value('Unnamed Track Section'),
    }),

    fillMissingListItems({
      list: '#sections.color',
      fill: input.dependency('color'),
    }),

    withFlattenedList({
      list: '#sections.tracks',
    }).outputs({
      ['#flattenedList']: '#trackRefs',
      ['#flattenedIndices']: '#sections.startIndex',
    }),

    withResolvedReferenceList({
      list: '#trackRefs',
      data: 'ownTrackData',
      notFoundMode: input.value('null'),
      find: input.value(find.track),
    }).outputs({
      ['#resolvedReferenceList']: '#tracks',
    }),

    withUnflattenedList({
      list: '#tracks',
      indices: '#sections.startIndex',
    }).outputs({
      ['#unflattenedList']: '#sections.tracks',
    }),

    {
      dependencies: [
        '#sections.tracks',
        '#sections.name',
        '#sections.color',
        '#sections.dateOriginallyReleased',
        '#sections.isDefaultTrackSection',
        '#sections.startIndex',
      ],

      compute: (continuation, {
        '#sections.tracks': tracks,
        '#sections.name': name,
        '#sections.color': color,
        '#sections.dateOriginallyReleased': dateOriginallyReleased,
        '#sections.isDefaultTrackSection': isDefaultTrackSection,
        '#sections.startIndex': startIndex,
      }) => {
        filterMultipleArrays(
          tracks, name, color, dateOriginallyReleased, isDefaultTrackSection, startIndex,
          tracks => !empty(tracks));

        return continuation({
          ['#trackSections']:
            stitchArrays({
              tracks,
              name,
              color,
              dateOriginallyReleased,
              isDefaultTrackSection,
              startIndex,
            }),
        });
      },
    },
  ],
});
