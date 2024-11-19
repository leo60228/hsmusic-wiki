export default {
  contentDependencies: ['generateCoverArtwork'],
  extraDependencies: ['language'],

  relations: (relation) => ({
    coverArtwork:
      relation('generateCoverArtwork', [], []),
  }),

  data: (flash) => ({
    path:
      ['media.flashArt', flash.directory, flash.coverArtFileExtension],

    color:
      flash.color,

    dimensions:
      flash.coverArtDimensions,
  }),

  generate: (data, relations, {language}) =>
    relations.coverArtwork.slots({
      path: data.path,
      color: data.color,
      dimensions: data.dimensions,
      alt: language.$('misc.alt.flashArt'),
    }),
};
