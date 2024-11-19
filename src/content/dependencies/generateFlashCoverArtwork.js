export default {
  contentDependencies: ['generateCoverArtwork'],
  extraDependencies: ['language'],

  relations: (relation) => ({
    coverArtwork:
      relation('generateCoverArtwork'),

    image:
      relation('image'),
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
      image:
        relations.image.slots({
          data: data.path,
          color: data.color,
          alt: language.$('misc.alt.flashArt'),
        }),

      dimensions: data.dimensions,
    }),
};
