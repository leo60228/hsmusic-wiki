export default {
  contentDependencies: ['linkThing'],

  relations: (relation, track) =>
    ({link: relation('linkThing', 'localized.trackReferencingArtworks', track)}),

  generate: (relations) => relations.link,
};
