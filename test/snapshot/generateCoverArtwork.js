import t from 'tap';
import {testContentFunctions} from '#test-lib';

testContentFunctions(t, 'generateCoverArtwork (snapshot)', async (t, evaluate) => {
  await evaluate.load({
    mock: {
      image: evaluate.stubContentFunction('image', {mock: true}),
      linkArtistGallery: evaluate.stubContentFunction('linkArtistGallery', {mock: true}),
    },
  });

  const artTags = [
    {name: 'Damara', directory: 'damara', isContentWarning: false},
    {name: 'Cronus', directory: 'cronus', isContentWarning: false},
    {name: 'Bees', directory: 'bees', isContentWarning: false},
    {name: 'creepy crawlies', isContentWarning: true},
  ];

  const coverArtistContribs = [
    {artist: {name: 'Circlejourney', directory: 'circlejourney'}},
    {artist: {name: 'magnoliajades', directory: 'magnoliajades'}},
  ];

  const path = ['media.albumCover', 'bee-forus-seatbelt-safebee', 'png'];

  const quickSnapshot = (mode) =>
    evaluate.snapshot(`mode: ${mode}`, {
      name: 'generateCoverArtwork',
      args: [artTags, coverArtistContribs],
      slots: {path, mode},
    });

  quickSnapshot('primary-tags');
  quickSnapshot('primary-artists');
  quickSnapshot('thumbnail');
  quickSnapshot('commentary');
});
