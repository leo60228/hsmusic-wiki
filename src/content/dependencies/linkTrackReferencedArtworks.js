export default {
  contentDependencies: ['linkThing'],

  relations: (relation, track) =>
    ({link: relation('linkThing', 'localized.trackReferencedArtworks', track)}),

  generate: (relations) => relations.link,
};
