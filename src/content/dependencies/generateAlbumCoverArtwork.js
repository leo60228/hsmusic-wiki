export default {
  contentDependencies: [
    'generateCoverArtwork',
    'generateCoverArtworkArtTagDetails',
    'generateCoverArtworkArtistDetails',
    'generateCoverArtworkReferenceDetails',
    'image',
    'linkAlbumReferencedArtworks',
    'linkAlbumReferencingArtworks',
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

    referenceDetails:
      relation('generateCoverArtworkReferenceDetails',
        album.referencedArtworks,
        album.referencedByArtworks),

    referencedArtworksLink:
      relation('linkAlbumReferencedArtworks', album),

    referencingArtworksLink:
      relation('linkAlbumReferencingArtworks', album),
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

    showReferenceLinks: {
      type: 'boolean',
      default: false,
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

      details: [
        slots.details === 'tags' &&
          relations.artTagDetails,

        slots.details === 'artists' &&
          relations.artistDetails,

        slots.showReferenceLinks &&
          relations.referenceDetails.slots({
            referencedLink:
              relations.referencedArtworksLink,

            referencingLink:
              relations.referencingArtworksLink,
          }),
      ],
    }),
};
