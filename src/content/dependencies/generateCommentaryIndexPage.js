import {accumulateSum, stitchArrays} from '#sugar';
import {filterMultipleArrays, sortChronologically} from '#wiki-data';

export default {
  contentDependencies: ['generatePageLayout', 'linkAlbumCommentary'],
  extraDependencies: ['html', 'language', 'wikiData'],

  sprawl({albumData}) {
    return {albumData};
  },

  query(sprawl) {
    const query = {};

    query.albums =
      sortChronologically(sprawl.albumData.slice());

    const entries =
      query.albums.map(album =>
        [album, ...album.tracks]
          .filter(({commentary}) => commentary)
          .flatMap(({commentary}) => commentary));

    query.wordCounts =
      entries.map(entries =>
        accumulateSum(
          entries,
          entry => entry.body.split(' ').length));

    query.entryCounts =
      entries.map(entries => entries.length);

    filterMultipleArrays(query.albums, query.wordCounts, query.entryCounts,
      (album, wordCount, entryCount) => entryCount >= 1);

    return query;
  },

  relations(relation, query) {
    return {
      layout:
        relation('generatePageLayout'),

      albumLinks:
        query.albums
          .map(album => relation('linkAlbumCommentary', album)),
    };
  },

  data(query) {
    return {
      wordCounts: query.wordCounts,
      entryCounts: query.entryCounts,

      totalWordCount: accumulateSum(query.wordCounts),
      totalEntryCount: accumulateSum(query.entryCounts),
    };
  },

  generate(data, relations, {html, language}) {
    return relations.layout.slots({
      title: language.$('commentaryIndex.title'),

      headingMode: 'static',

      mainClasses: ['long-content'],
      mainContent: [
        html.tag('p', language.$('commentaryIndex.infoLine', {
          words:
            html.tag('b',
              language.formatWordCount(data.totalWordCount, {unit: true})),

          entries:
            html.tag('b',
                language.countCommentaryEntries(data.totalEntryCount, {unit: true})),
        })),

        html.tag('p',
          language.$('commentaryIndex.albumList.title')),

        html.tag('ul',
          stitchArrays({
            albumLink: relations.albumLinks,
            wordCount: data.wordCounts,
            entryCount: data.entryCounts,
          }).map(({albumLink, wordCount, entryCount}) =>
            html.tag('li',
              language.$('commentaryIndex.albumList.item', {
                album: albumLink,
                words: language.formatWordCount(wordCount, {unit: true}),
                entries: language.countCommentaryEntries(entryCount, {unit: true}),
              })))),
      ],

      navLinkStyle: 'hierarchical',
      navLinks: [
        {auto: 'home'},
        {auto: 'current'},
      ],
    });
  },
};
