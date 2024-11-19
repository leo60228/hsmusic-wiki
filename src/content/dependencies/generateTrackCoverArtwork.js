export default {
  contentDependencies: [
    'generateCoverArtwork',
    'generateCoverArtworkArtTagDetails',
    'generateCoverArtworkArtistDetails',
    'image',
  ],

  extraDependencies: ['html', 'language'],

  relations: (relation, track) => ({
    coverArtwork:
      relation('generateCoverArtwork'),

    image:
      relation('image'),

    artTagDetails:
      relation('generateCoverArtworkArtTagDetails',
        (track.hasUniqueCoverArt
          ? track.artTags
          : track.album.artTags)),

    artistDetails:
      relation('generateCoverArtworkArtistDetails',
        (track.hasUniqueCoverArt
          ? track.coverArtistContribs
          : track.album.coverArtistContribs)),
  }),

  data: (track) => ({
    path:
      (track.hasUniqueCoverArt
        ? ['media.trackCover', track.album.directory, track.directory, track.coverArtFileExtension]
        : ['media.albumCover', track.album.directory, track.album.coverArtFileExtension]),

    color:
      track.color,

    dimensions:
      (track.hasUniqueCoverArt
        ? track.coverArtDimensions
        : track.album.coverArtDimensions),
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
          alt: language.$('misc.alt.trackCover'),
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

