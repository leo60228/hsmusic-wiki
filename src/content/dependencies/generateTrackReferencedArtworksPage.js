export default {
  contentDependencies: [
    'generateAlbumStyleRules',
    'generateBackToTrackLink',
    'generateReferencedArtworksPage',
    'generateTrackCoverArtwork',
    'generateTrackNavLinks',
  ],

  extraDependencies: ['html', 'language'],

  relations: (relation, track) => ({
    page:
      relation('generateReferencedArtworksPage', track.referencedArtworks),

    albumStyleRules:
      relation('generateAlbumStyleRules', track.album, track),

    navLinks:
      relation('generateTrackNavLinks', track),

    backToTrackLink:
      relation('generateBackToTrackLink', track),

    cover:
      relation('generateTrackCoverArtwork', track),
  }),

  data: (track) => ({
    name:
      track.name,

    color:
      track.color,
  }),

  generate: (data, relations, {html, language}) =>
    relations.page.slots({
      title:
        language.$('trackPage.title', {
          track:
            data.name,
        }),

      color: data.color,
      styleRules: [relations.albumStyleRules],

      cover: relations.cover,

      navLinks:
        html.resolve(
          relations.navLinks
            .slot('currentExtra', 'referenced-art')),

      navBottomRowContent: relations.backToTrackLink,
    }),
};
