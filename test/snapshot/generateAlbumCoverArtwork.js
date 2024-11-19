import t from 'tap';

import contentFunction from '#content-function';
import {testContentFunctions} from '#test-lib';

testContentFunctions(t, 'generateAlbumCoverArtwork (snapshot)', async (t, evaluate) => {
  await evaluate.load({
    mock: {
      image: evaluate.stubContentFunction('image'),
    },
  });

  const album = {
    directory: 'bee-forus-seatbelt-safebee',
    coverArtFileExtension: 'png',
    coverArtDimensions: [400, 300],
    color: '#f28514',
    artTags: [
      {name: 'Damara', directory: 'damara', isContentWarning: false},
      {name: 'Cronus', directory: 'cronus', isContentWarning: false},
      {name: 'Bees', directory: 'bees', isContentWarning: false},
      {name: 'creepy crawlies', isContentWarning: true},
    ],
    coverArtistContribs: [
      {artist: {name: 'Circlejourney', directory: 'circlejourney'}},
      {artist: {name: 'magnoliajades', directory: 'magnoliajades'}},
    ],
  };

  evaluate.snapshot('display: primary-tags', {
    name: 'generateAlbumCoverArtwork',
    args: [album],
    slots: {mode: 'primary-tags'},
  });

  evaluate.snapshot('display: thumbnail', {
    name: 'generateAlbumCoverArtwork',
    args: [album],
    slots: {mode: 'thumbnail'},
  });
});
