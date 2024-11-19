export default {
  contentDependencies: ['image', 'linkArtistGallery'],
  extraDependencies: ['html'],

  slots: {
    image: {
      type: 'html',
      mutable: true,
    },

    mode: {
      validate: v => v.is('primary', 'thumbnail', 'commentary'),
      default: 'primary',
    },

    dimensions: {
      validate: v => v.isDimensions,
    },

    details: {
      type: 'html',
      mutable: false,
    },
  },

  generate(slots, {html}) {
    const square =
      (slots.dimensions
        ? slots.dimensions[0] === slots.dimensions[1]
        : true);

    const sizeSlots =
      (square
        ? {square: true}
        : {dimensions: slots.dimensions});

    return html.tags([
      (slots.mode === 'primary'
        ? slots.image.slots({
            thumb: 'medium',
            reveal: true,
            link: true,
            ...sizeSlots,
          })

     : slots.mode === 'thumbnail'
        ? slots.image.slots({
            thumb: 'small',
            reveal: false,
            link: false,
            ...sizeSlots,
          })

     : slots.mode === 'commentary'
        ? slots.image.slots({
            thumb: 'medium',
            reveal: true,
            link: true,
            lazy: true,
            ...sizeSlots,

            attributes:
              {class: 'commentary-art'},
          })

        : html.blank()),

      html.tags([slots.details], {[html.onlyIfSiblings]: true}),
    ]);
  },
};
