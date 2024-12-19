export default {
  extraDependencies: ['html'],

  slots: {
    content: {
      type: 'html',
      mutable: false,
    },

    class: {
      validate: v => v.anyOf(v.isString, v.sparseArrayOf(v.isString)),
    },

    alwaysVisible: {
      type: 'boolean',
      default: false,
    },
  },

  generate: (slots, {html}) =>
    html.tag('nav', {id: 'secondary-nav'},
      {[html.onlyIfContent]: true},
      {class: slots.class},

      slots.alwaysVisible &&
        {class: 'always-visible'},

      slots.content),
};
