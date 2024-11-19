export default {
  extraDependencies: ['html', 'language'],

  data: (referenced, referencedBy) => ({
    referenced:
      referenced.length,

    referencedBy:
      referencedBy.length,
  }),

  slots: {
    referencedLink: {type: 'html', mutable: true},
    referencingLink: {type: 'html', mutable: true},
  },

  generate: (data, slots, {html, language}) =>
    language.encapsulate('releaseInfo', capsule => {
      const referencedText =
        language.$(capsule, 'referencesArtworks', {
          [language.onlyIfOptions]: ['artworks'],

          artworks:
            language.countArtworks(data.referenced, {
              blankIfZero: true,
              unit: true,
            }),
        });

      const referencingText =
        language.$(capsule, 'referencedByArtworks', {
          [language.onlyIfOptions]: ['artworks'],

          artworks:
            language.countArtworks(data.referencedBy, {
              blankIfZero: true,
              unit: true,
            }),
        });

      return (
        html.tag('p', {class: 'image-details'},
          {[html.onlyIfContent]: true},
          {[html.joinChildren]: html.tag('br')},

          {class: 'reference-details'},

          [
            !html.isBlank(referencedText) &&
              slots.referencedLink.slot('content', referencedText),

            !html.isBlank(referencingText) &&
              slots.referencingLink.slot('content', referencingText),
          ]));
    }),
}
