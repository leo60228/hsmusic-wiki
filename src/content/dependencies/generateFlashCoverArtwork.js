export default {
  contentDependencies: ['generateCoverArtwork'],
  extraDependencies: ['html', 'language'],

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

  slots: {
    mode: {type: 'string'},
  },

  generate: (data, relations, slots, {language}) =>
    relations.coverArtwork.slots({
      mode: slots.mode,

      image:
        relations.image.slots({
          data: data.path,
          color: data.color,
          alt: language.$('misc.alt.flashArt'),
        }),

      dimensions: data.dimensions,
    }),
};
