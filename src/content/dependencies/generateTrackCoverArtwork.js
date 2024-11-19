export default {
  contentDependencies: ['generateCoverArtwork'],
  extraDependencies: ['language'],

  relations: (relation, track) => ({
    coverArtwork:
      relation('generateCoverArtwork',
        (track.hasUniqueCoverArt
          ? track.artTags
          : track.album.artTags),
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

  generate: (data, relations, {language}) =>
    relations.coverArtwork.slots({
      path: data.path,
      color: data.color,
      dimensions: data.dimensions,
      alt: language.$('misc.alt.trackCover'),
    }),
};

