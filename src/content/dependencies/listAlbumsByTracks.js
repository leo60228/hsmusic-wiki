import {empty, stitchArrays} from '../../util/sugar.js';

export default {
  contentDependencies: ['generateListingPage', 'linkAlbum'],
  extraDependencies: ['language', 'wikiData'],

  sprawl({albumData}) {
    return {albumData};
  },

  query({albumData}, spec) {
    return {
      spec,

      albums:
        albumData
          .filter(album => !empty(album.tracks))
          .sort((a, b) => b.tracks.length - a.tracks.length),
    };
  },

  relations(relation, query) {
    return {
      page: relation('generateListingPage', query.spec),

      albumLinks:
        query.albums
          .map(album => relation('linkAlbum', album)),
    };
  },

  data(query) {
    return {
      counts:
        query.albums
          .map(album => album.tracks.length),
    };
  },

  generate(data, relations, {language}) {
    return relations.page.slots({
      type: 'rows',
      rows:
        stitchArrays({
          link: relations.albumLinks,
          count: data.counts,
        }).map(({link, count}) => ({
            album: link,
            tracks: language.countTracks(count, {unit: true}),
          })),
    });
  },
};
