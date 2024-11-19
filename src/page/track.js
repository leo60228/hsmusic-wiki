// Track page specification.

import {empty} from '#sugar';

export const description = `per-track info pages`;

export function targets({wikiData}) {
  return wikiData.trackData;
}

export function pathsForTarget(track) {
  return [
    {
      type: 'page',
      path: ['track', track.directory],

      contentFunction: {
        name: 'generateTrackInfoPage',
        args: [track],
      },
    },

    !empty(track.referencedArtworks) && {
      type: 'page',
      path: ['trackReferencedArtworks', track.directory],

      contentFunction: {
        name: 'generateTrackReferencedArtworksPage',
        args: [track],
      },
    },

    !empty(track.referencedByArtworks) && {
      type: 'page',
      path: ['trackReferencingArtworks', track.directory],

      contentFunction: {
        name: 'generateTrackReferencingArtworksPage',
        args: [track],
      },
    },
  ];
}
