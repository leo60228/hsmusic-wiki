export default {
  contentDependencies: ['generateCoverArtwork'],
  extraDependencies: ['language'],

  relations: (relation, album) => ({
    coverArtwork:
      relation('generateCoverArtwork', album.artTags, album.coverArtistContribs),
  }),

  data: (album) => ({
    path:
      ['media.albumCover', album.directory, album.coverArtFileExtension],

    color:
      album.color,

    dimensions:
      album.coverArtDimensions,
  }),

  generate: (data, relations, {language}) =>
    relations.coverArtwork.slots({
      path: data.path,
      color: data.color,
      dimensions: data.dimensions,
      alt: language.$('misc.alt.albumCover'),
    }),
};
