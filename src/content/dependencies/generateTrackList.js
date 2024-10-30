export default {
  contentDependencies: ['generateTrackListItem'],
  extraDependencies: ['html'],

  relations: (relation, tracks) => ({
    items:
      tracks
        .map(track => relation('generateTrackListItem', track, [])),
  }),

  slots: {
    colorMode: {
      validate: v => v.is('none', 'track', 'line'),
      default: 'track',
    },
  },

  generate: (relations, slots, {html}) =>
    html.tag('ul',
      {[html.onlyIfContent]: true},

      relations.items.map(item =>
        item.slots({
          showArtists: true,
          showDuration: false,
          colorMode: slots.colorMode,
        }))),
};
