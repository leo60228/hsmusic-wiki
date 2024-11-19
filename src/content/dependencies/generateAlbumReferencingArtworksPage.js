export default {
  contentDependencies: [
    'generateAlbumCoverArtwork',
    'generateAlbumStyleRules',
    'generateBackToAlbumLink',
    'generateReferencingArtworksPage',
    'linkAlbum',
  ],

  extraDependencies: ['html', 'language'],

  relations: (relation, album) => ({
    page:
      relation('generateReferencingArtworksPage', album.referencedByArtworks),

    albumStyleRules:
      relation('generateAlbumStyleRules', album, null),

    albumLink:
      relation('linkAlbum', album),

    backToAlbumLink:
      relation('generateBackToAlbumLink', album),

    cover:
      relation('generateAlbumCoverArtwork', album),
  }),

  data: (album) => ({
    name:
      album.name,

    color:
      album.color,
  }),

  generate: (data, relations, {html, language}) =>
    relations.page.slots({
      title:
        language.$('albumPage.title', {
          album:
            data.name,
        }),

      color: data.color,
      styleRules: [relations.albumStyleRules],

      cover: relations.cover,

      navLinks: [
        {auto: 'home'},

        {
          html:
            relations.albumLink
              .slot('attributes', {class: 'current'}),

          accent:
            html.tag('a', {href: ''},
              {class: 'current'},

              language.$('referencingArtworksPage.subtitle')),
        },
      ],

      navBottomRowContent: relations.backToAlbumLink,
    }),
};
