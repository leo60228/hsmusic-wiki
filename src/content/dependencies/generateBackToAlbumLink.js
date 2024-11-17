export default {
  contentDependencies: ['linkAlbum'],
  extraDependencies: ['language'],

  relations: (relation, track) => ({
    trackLink:
      relation('linkAlbum', track),
  }),

  generate: (relations, {language}) =>
    relations.trackLink.slots({
      content: language.$('albumPage.nav.backToAlbum'),
      color: false,
    }),
};
