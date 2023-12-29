import {compareArrays} from '#sugar';

export default {
  contentDependencies: [
    'generateAlbumSidebarGroupBox',
    'generateAlbumSidebarTrackSection',
    'linkAlbum',
    'linkGroup',
  ],

  extraDependencies: ['html', 'language'],

  query(album, track) {
    const query = {};

    if (track) {
      query.trackGroupsDifferFromAlbum =
        !compareArrays(track.groups, album.groups);
    }

    return query;
  },

  relations(relation, query, album, track) {
    const relations = {};

    relations.albumLink =
      relation('linkAlbum', album);

    const groups =
      (track
        ? track.groups
        : album.groups);

    relations.groupBoxes =
      groups
        .map(group =>
          relation('generateAlbumSidebarGroupBox', album, group));

    relations.trackSections =
      album.trackSections
        .map(trackSection =>
          relation('generateAlbumSidebarTrackSection', album, track, trackSection));

    if (query.trackGroupsDifferFromAlbum) {
      relations.albumGroupLinks =
        album.groups
          .map(group => relation('linkGroup', group));
    }

    return relations;
  },

  data(query, album, track) {
    const data = {};

    data.isAlbumPage = !track;

    if (track) {
      data.trackGroupsDifferFromAlbum =
        query.trackGroupsDifferFromAlbum;
    }

    return data;
  },

  generate(data, relations, {html, language}) {
    const trackListBox = {
      class: 'track-list-sidebar-box',
      content:
        html.tags([
          html.tag('h1', relations.albumLink),
          relations.trackSections,
        ]),
    };

    if (data.isAlbumPage) {
      const groupBoxes =
        relations.groupBoxes
          .map(content => ({
            class: 'individual-group-sidebar-box',
            content: content.slot('mode', 'album'),
          }));

      return {
        leftSidebarMultiple: [
          ...groupBoxes,
          trackListBox,
        ],
      };
    }

    const trackGroupsDifferNoticeBoxContent =
      data.trackGroupsDifferFromAlbum && [
        html.tag('p',
          language.$('albumSidebar.groupBox.trackGroupsDiffer', {
            groups:
              language.formatConjunctionList(relations.albumGroupLinks)),
          })),
      ];

    const trackGroupBoxContent =
      relations.groupBoxes
        .map(content => content.slot('mode', 'track'));

    const allGroupBoxes = [
      ...trackGroupBoxContent,
      trackGroupsDifferNoticeBoxContent,
    ].filter(Boolean);

    const conjoinedGroupBox = {
      class: 'conjoined-group-sidebar-box',
      content:
        allGroupBoxes.flatMap((content, i, {length}) => [
          content,
          i < length - 1 &&
            html.tag('hr', {
              style: `border-color: var(--primary-color); border-style: none none dotted none`
            }),
        ])
    };

    return {
      leftSidebarMultiple: [
        trackListBox,
        conjoinedGroupBox,
      ],
    };
  },
};
