import {empty} from '../../util/sugar.js';

export default {
  contentDependencies: [
    'linkAlbum',
    'linkExternal',
    'linkGroup',
    'transformContent',
  ],

  extraDependencies: ['html', 'language'],

  relations(relation, album, group) {
    const relations = {};

    relations.groupLink =
      relation('linkGroup', group);

    relations.externalLinks =
      group.urls.map(url =>
        relation('linkExternal', url));

    if (group.descriptionShort) {
      relations.description =
        relation('transformContent', group.descriptionShort);
    }

    if (album.date) {
      const albums = group.albums.filter(album => album.date);
      const index = albums.indexOf(album);
      const previousAlbum = (index > 0) && albums[index - 1];
      const nextAlbum = (index < albums.length - 1) && albums[index + 1];

      if (previousAlbum) {
        relations.previousAlbumLink =
          relation('linkAlbum', previousAlbum);
      }

      if (nextAlbum) {
        relations.nextAlbumLink =
          relation('linkAlbum', nextAlbum);
      }
    }

    return relations;
  },

  slots: {
    isAlbumPage: {type: 'boolean', default: false},
  },

  generate(relations, slots, {html, language}) {
    return html.tags([
      html.tag('h1',
        language.$('albumSidebar.groupBox.title', {
          group: relations.groupLink,
        })),

      slots.isAlbumPage &&
        relations.description
          ?.slot('mode', 'multiline'),

      !empty(relations.externalLinks) &&
        html.tag('p',
          language.$('releaseInfo.visitOn', {
            links: language.formatDisjunctionList(relations.externalLinks),
          })),

      slots.isAlbumPage &&
      relations.nextAlbumLink &&
        html.tag('p', {class: 'group-chronology-link'},
          language.$('albumSidebar.groupBox.next', {
            album: relations.nextAlbumLink,
          })),

      slots.isAlbumPage &&
      relations.previousAlbumLink &&
        html.tag('p', {class: 'group-chronology-link'},
          language.$('albumSidebar.groupBox.previous', {
            album: relations.previousAlbumLink,
          })),
    ]);
  },
};
