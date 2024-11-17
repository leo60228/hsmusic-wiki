import {stitchArrays} from '#sugar';

export default {
  contentDependencies: [
    'generateAlbumStyleRules',
    'generateBackToTrackLink',
    'generateCoverGrid',
    'generatePageLayout',
    'generateTrackCoverArtwork',
    'generateTrackNavLinks',
    'image',
    'linkAlbum',
    'linkTrack',
  ],

  extraDependencies: ['html', 'language'],

  relations: (relation, track) => ({
    layout:
      relation('generatePageLayout'),

    albumStyleRules:
      relation('generateAlbumStyleRules', track.album, track),

    navLinks:
      relation('generateTrackNavLinks', track),

    backToTrackLink:
      relation('generateBackToTrackLink', track),

    cover:
      relation('generateTrackCoverArtwork', track),

    coverGrid:
      relation('generateCoverGrid'),

    links:
      track.referencedArtworks
        .map(({thing}) =>
          (thing.album
            ? relation('linkTrack', thing)
            : relation('linkAlbum', thing))),

    images:
      track.referencedArtworks
        .map(({thing}) =>
          relation('image', thing.artTags)),
  }),

  data: (track) => ({
    name:
      track.name,

    color:
      track.color,

    count:
      track.referencedArtworks.length,

    names:
      track.referencedArtworks
        .map(({thing}) => thing.name),

    paths:
      track.referencedArtworks
        .map(({thing}) =>
          (thing.album
            ? ['media.trackCover', thing.album.directory, thing.directory, thing.coverArtFileExtension]
            : ['media.albumCover', thing.directory, thing.coverArtFileExtension])),

    dimensions:
      track.referencedArtworks
        .map(({thing}) => thing.coverArtDimensions),

    coverArtistNames:
      track.referencedArtworks
        .map(({thing}) =>
          thing.coverArtistContribs
            .map(contrib => contrib.artist.name)),
  }),

  generate: (data, relations, {html, language}) =>
    language.encapsulate('trackReferencedArtworksPage', pageCapsule =>
      relations.layout.slots({
        title:
          language.$(pageCapsule, 'title', {
            track:
              data.name,
          }),

        subtitle:
          language.$(pageCapsule, 'subtitle'),

        color: data.color,
        styleRules: [relations.albumStyleRules],

        cover:
          relations.cover
            .slot('mode', 'primary-artists'),

        mainClasses: ['top-index'],
        mainContent: [
          html.tag('p', {class: 'quick-info'},
            language.$(pageCapsule, 'statsLine', {
              artworks:
                language.countArtworks(data.count, {
                  unit: true,
                }),
            })),

          relations.coverGrid.slots({
            links: relations.links,
            names: data.names,

            images:
              stitchArrays({
                image: relations.images,
                path: data.paths,
                dimensions: data.dimensions,
              }).map(({image, path, dimensions}) =>
                  image.slots({
                    path,
                    dimensions,
                  })),

            info:
              data.coverArtistNames.map(names =>
                language.$('misc.coverGrid.details.coverArtists', {
                  artists:
                    language.formatUnitList(names),
                })),
          }),
        ],

        navLinkStyle: 'hierarchical',
        navLinks:
          html.resolve(
            relations.navLinks
              .slot('currentExtra', 'referenced-art')),

        navBottomRowContent: relations.backToTrackLink,
      })),
};
