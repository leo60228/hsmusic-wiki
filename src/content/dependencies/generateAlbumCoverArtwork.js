export default {
  contentDependencies: [
    'generateCoverArtwork',
    'generateCoverArtworkArtTagDetails',
    'generateCoverArtworkArtistDetails',
    'image',
  ],

  extraDependencies: ['html', 'language'],

  relations: (relation, album) => ({
    coverArtwork:
      relation('generateCoverArtwork'),

    image:
      relation('image'),

    artTagDetails:
      relation('generateCoverArtworkArtTagDetails', album.artTags),

    artistDetails:
      relation('generateCoverArtworkArtistDetails', album.coverArtistContribs),
  }),

  data: (album) => ({
    path:
      ['media.albumCover', album.directory, album.coverArtFileExtension],

    color:
      album.color,

    dimensions:
      album.coverArtDimensions,
  }),

  slots: {
    mode: {type: 'string'},

    details: {
      validate: v => v.is('tags', 'artists'),
      default: 'tags',
    },
  },

  generate: (data, relations, slots, {language}) =>
    relations.coverArtwork.slots({
      mode: slots.mode,

      image:
        relations.image.slots({
          path: data.path,
          color: data.color,
          alt: language.$('misc.alt.albumCover'),
        }),

      dimensions: data.dimensions,

      details:
        (slots.details === 'tags'
          ? relations.artTagDetails
       : slots.details === 'artists'
          ? relations.artistDetails
          : null),
    }),
};
