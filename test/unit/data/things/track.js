import t from 'tap';

import {showAggregate} from '#sugar';
import {linkAndBindWikiData} from '#test-lib';
import thingConstructors from '#things';

const {
  Album,
  ArtTag,
  Artist,
  Flash,
  FlashAct,
  Thing,
  Track,
} = thingConstructors;

function stubAlbum(tracks, directory = 'bar') {
  const album = new Album();
  album.directory = directory;

  const trackRefs = tracks.map(t => Thing.getReference(t));
  album.trackSections = [{tracks: trackRefs}];

  return album;
}

function stubTrack(directory = 'foo') {
  const track = new Track();
  track.directory = directory;

  return track;
}

function stubTrackAndAlbum(trackDirectory = 'foo', albumDirectory = 'bar') {
  const track = stubTrack(trackDirectory);
  const album = stubAlbum([track], albumDirectory);

  return {track, album};
}

function stubArtist(artistName = `Test Artist`) {
  const artist = new Artist();
  artist.name = artistName;

  return artist;
}

function stubArtistAndContribs(artistName = `Test Artist`) {
  const artist = stubArtist(artistName);
  const contribs = [{who: artistName, what: null}];
  const badContribs = [{who: `Figment of Your Imagination`, what: null}];

  return {artist, contribs, badContribs};
}

function stubArtTag(tagName = `Test Art Tag`) {
  const tag = new ArtTag();
  tag.name = tagName;

  return tag;
}

function stubFlashAndAct(directory = 'zam') {
  const flash = new Flash();
  flash.directory = directory;

  const flashAct = new FlashAct();
  flashAct.flashes = [Thing.getReference(flash)];

  return {flash, flashAct};
}

t.test(`Track.album`, t => {
  t.plan(6);

  // Note: These asserts use manual albumData/trackData relationships
  // to illustrate more specifically the properties which are expected to
  // be relevant for this case. Other properties use the same underlying
  // get-album behavior as Track.album so aren't tested as aggressively.

  const track1 = stubTrack('track1');
  const track2 = stubTrack('track2');
  const album1 = new Album();
  const album2 = new Album();

  t.equal(track1.album, null,
    `album #1: defaults to null`);

  track1.albumData = [album1, album2];
  track2.albumData = [album1, album2];
  album1.ownTrackData = [track1, track2];
  album2.ownTrackData = [track1, track2];
  album1.trackSections = [{tracks: ['track:track1']}];
  album2.trackSections = [{tracks: ['track:track2']}];

  t.equal(track1.album, album1,
    `album #2: is album when album's trackSections matches track`);

  track1.albumData = [album2, album1];

  t.equal(track1.album, album1,
    `album #3: is album when albumData is in different order`);

  track1.albumData = [];

  t.equal(track1.album, null,
    `album #4: is null when track missing albumData`);

  album1.ownTrackData = [];
  track1.albumData = [album1, album2];

  t.equal(track1.album, null,
    `album #5: is null when album missing ownTrackData`);

  album1.ownTrackData = [track1, track2];
  album1.trackSections = [{tracks: ['track:track2']}];

  // XXX_decacheWikiData
  track1.albumData = [];
  track1.albumData = [album1, album2];

  t.equal(track1.album, null,
    `album #6: is null when album's trackSections don't match track`);
});

t.test(`Track.artTags`, t => {
  t.plan(6);

  const {track, album} = stubTrackAndAlbum();
  const {artist, contribs} = stubArtistAndContribs();
  const tag1 = stubArtTag(`Tag 1`);
  const tag2 = stubArtTag(`Tag 2`);

  const {XXX_decacheWikiData} = linkAndBindWikiData({
    albumData: [album],
    artistData: [artist],
    artTagData: [tag1, tag2],
    trackData: [track],
  });

  t.same(track.artTags, [],
    `artTags #1: defaults to empty array`);

  track.artTags = [`Tag 1`, `Tag 2`];

  t.same(track.artTags, [],
    `artTags #2: is empty if track doesn't have cover artists`);

  track.coverArtistContribs = contribs;

  t.same(track.artTags, [tag1, tag2],
    `artTags #3: resolves if track has cover artists`);

  track.coverArtistContribs = null;
  album.trackCoverArtistContribs = contribs;

  XXX_decacheWikiData();

  t.same(track.artTags, [tag1, tag2],
    `artTags #4: resolves if track inherits cover artists`);

  track.disableUniqueCoverArt = true;

  t.same(track.artTags, [],
    `artTags #5: is empty if track disables unique cover artwork`);

  album.coverArtistContribs = contribs;
  album.artTags = [`Tag 2`];

  XXX_decacheWikiData();

  t.notSame(track.artTags, [tag2],
    `artTags #6: doesn't inherit from album's art tags`);
});

t.test(`Track.artistContribs`, t => {
  t.plan(4);

  const {track, album} = stubTrackAndAlbum();
  const artist1 = stubArtist(`Artist 1`);
  const artist2 = stubArtist(`Artist 2`);

  const {XXX_decacheWikiData} = linkAndBindWikiData({
    albumData: [album],
    artistData: [artist1, artist2],
    trackData: [track],
  });

  t.same(track.artistContribs, [],
    `artistContribs #1: defaults to empty array`);

  album.artistContribs = [
    {who: `Artist 1`, what: `composition`},
    {who: `Artist 2`, what: null},
  ];

  XXX_decacheWikiData();

  t.same(track.artistContribs,
    [{who: artist1, what: `composition`}, {who: artist2, what: null}],
    `artistContribs #2: inherits album artistContribs`);

  track.artistContribs = [
    {who: `Artist 1`, what: `arrangement`},
  ];

  t.same(track.artistContribs, [{who: artist1, what: `arrangement`}],
    `artistContribs #3: resolves from own value`);

  track.artistContribs = [
    {who: `Artist 1`, what: `snooping`},
    {who: `Artist 413`, what: `as`},
    {who: `Artist 2`, what: `usual`},
  ];

  t.same(track.artistContribs,
    [{who: artist1, what: `snooping`}, {who: artist2, what: `usual`}],
    `artistContribs #4: filters out names without matches`);
});

t.test(`Track.color`, t => {
  t.plan(5);

  const {track, album} = stubTrackAndAlbum();

  const {XXX_decacheWikiData} = linkAndBindWikiData({
    albumData: [album],
    trackData: [track],
  });

  t.equal(track.color, null,
    `color #1: defaults to null`);

  album.color = '#abcdef';
  album.trackSections = [{
    color: '#beeeef',
    tracks: [Thing.getReference(track)],
  }];
  XXX_decacheWikiData();

  t.equal(track.color, '#beeeef',
    `color #2: inherits from track section before album`);

  // Replace the album with a completely fake one. This isn't realistic, since
  // in correct data, Album.tracks depends on Albums.trackSections and so the
  // track's album will always have a corresponding track section. But if that
  // connection breaks for some future reason (with the album still present),
  // Track.color should still inherit directly from the album.
  track.albumData = [
    {
      constructor: {[Thing.referenceType]: 'album'},
      color: '#abcdef',
      tracks: [track],
      trackSections: [
        {color: '#baaaad', tracks: []},
      ],
    },
  ];

  t.equal(track.color, '#abcdef',
    `color #3: inherits from album without matching track section`);

  track.color = '#123456';

  t.equal(track.color, '#123456',
    `color #4: is own value`);

  t.throws(() => { track.color = '#aeiouw'; },
    {cause: TypeError},
    `color #5: must be set to valid color`);
});

t.test(`Track.commentatorArtists`, t => {
  t.plan(8);

  const track = new Track();
  const artist1 = stubArtist(`SnooPING`);
  const artist2 = stubArtist(`ASUsual`);
  const artist3 = stubArtist(`Icy`);

  linkAndBindWikiData({
    trackData: [track],
    artistData: [artist1, artist2, artist3],
  });

  // Keep track of the last commentary string in a separate value, since
  // the track.commentary property exposes as a completely different format
  // (i.e. an array of objects, one for each entry), and so isn't compatible
  // with the += operator on its own.
  let commentary;

  track.commentary = commentary =
    `<i>SnooPING:</i>\n` +
    `Wow.\n`;

  t.same(track.commentatorArtists, [artist1],
    `Track.commentatorArtists #1: works with one commentator`);

  track.commentary = commentary +=
    `<i>ASUsual:</i>\n` +
    `Yes!\n`;

  t.same(track.commentatorArtists, [artist1, artist2],
    `Track.commentatorArtists #2: works with two commentators`);

  track.commentary = commentary +=
    `<i>Icy|<b>Icy What You Did There</b>:</i>\n` +
    `Incredible.\n`;

  t.same(track.commentatorArtists, [artist1, artist2, artist3],
    `Track.commentatorArtists #3: works with custom artist text`);

  track.commentary = commentary =
    `<i>Icy:</i> (project manager)\n` +
    `Very good track.\n`;

  t.same(track.commentatorArtists, [artist3],
    `Track.commentatorArtists #4: works with annotation`);

  track.commentary = commentary =
    `<i>Icy:</i> (project manager, 08/15/2023)\n` +
    `Very very good track.\n`;

  t.same(track.commentatorArtists, [artist3],
    `Track.commentatorArtists #5: works with date`);

  track.commentary = commentary +=
    `<i>Ohohohoho:</i>\n` +
    `OHOHOHOHOHOHO...\n`;

  t.same(track.commentatorArtists, [artist3],
    `Track.commentatorArtists #6: ignores artist names not found`);

  track.commentary = commentary +=
    `<i>Icy:</i>\n` +
    `I'm back!\n`;

  t.same(track.commentatorArtists, [artist3],
    `Track.commentatorArtists #7: ignores duplicate artist`);

  track.commentary = commentary +=
    `<i>SNooPING, ASUsual, Icy:</i>\n` +
    `WITH ALL THREE POWERS COMBINED...`;

  t.same(track.commentatorArtists, [artist3, artist1, artist2],
    `Track.commentatorArtists #8: works with more than one artist in one entry`);
});

t.test(`Track.coverArtistContribs`, t => {
  t.plan(5);

  const {track, album} = stubTrackAndAlbum();
  const artist1 = stubArtist(`Artist 1`);
  const artist2 = stubArtist(`Artist 2`);

  const {XXX_decacheWikiData} = linkAndBindWikiData({
    albumData: [album],
    artistData: [artist1, artist2],
    trackData: [track],
  });

  t.same(track.coverArtistContribs, [],
    `coverArtistContribs #1: defaults to empty array`);

  album.trackCoverArtistContribs = [
    {who: `Artist 1`, what: `lines`},
    {who: `Artist 2`, what: null},
  ];

  XXX_decacheWikiData();

  t.same(track.coverArtistContribs,
    [{who: artist1, what: `lines`}, {who: artist2, what: null}],
    `coverArtistContribs #2: inherits album trackCoverArtistContribs`);

  track.coverArtistContribs = [
    {who: `Artist 1`, what: `collage`},
  ];

  t.same(track.coverArtistContribs, [{who: artist1, what: `collage`}],
    `coverArtistContribs #3: resolves from own value`);

  track.coverArtistContribs = [
    {who: `Artist 1`, what: `snooping`},
    {who: `Artist 413`, what: `as`},
    {who: `Artist 2`, what: `usual`},
  ];

  t.same(track.coverArtistContribs,
    [{who: artist1, what: `snooping`}, {who: artist2, what: `usual`}],
    `coverArtistContribs #4: filters out names without matches`);

  track.disableUniqueCoverArt = true;

  t.same(track.coverArtistContribs, [],
    `coverArtistContribs #5: is empty if track disables unique cover artwork`);
});

t.test(`Track.coverArtDate`, t => {
  t.plan(8);

  const {track, album} = stubTrackAndAlbum();
  const {artist, contribs, badContribs} = stubArtistAndContribs();

  const {XXX_decacheWikiData} = linkAndBindWikiData({
    albumData: [album],
    artistData: [artist],
    trackData: [track],
  });

  track.coverArtistContribs = contribs;

  t.equal(track.coverArtDate, null,
    `coverArtDate #1: defaults to null`);

  album.trackArtDate = new Date('2012-12-12');

  XXX_decacheWikiData();

  t.same(track.coverArtDate, new Date('2012-12-12'),
    `coverArtDate #2: inherits album trackArtDate`);

  track.coverArtDate = new Date('2009-09-09');

  t.same(track.coverArtDate, new Date('2009-09-09'),
    `coverArtDate #3: is own value`);

  track.coverArtistContribs = [];

  t.equal(track.coverArtDate, null,
    `coverArtDate #4: is null if track coverArtistContribs empty`);

  album.trackCoverArtistContribs = contribs;

  XXX_decacheWikiData();

  t.same(track.coverArtDate, new Date('2009-09-09'),
    `coverArtDate #5: is not null if album trackCoverArtistContribs specified`);

  album.trackCoverArtistContribs = badContribs;

  XXX_decacheWikiData();

  t.equal(track.coverArtDate, null,
    `coverArtDate #6: is null if album trackCoverArtistContribs resolves empty`);

  track.coverArtistContribs = badContribs;

  t.equal(track.coverArtDate, null,
    `coverArtDate #7: is null if track coverArtistContribs resolves empty`);

  track.coverArtistContribs = contribs;
  track.disableUniqueCoverArt = true;

  t.equal(track.coverArtDate, null,
    `coverArtDate #8: is null if track disables unique cover artwork`);
});

t.test(`Track.coverArtFileExtension`, t => {
  t.plan(8);

  const {track, album} = stubTrackAndAlbum();
  const {artist, contribs} = stubArtistAndContribs();

  const {XXX_decacheWikiData} = linkAndBindWikiData({
    albumData: [album],
    artistData: [artist],
    trackData: [track],
  });

  t.equal(track.coverArtFileExtension, null,
    `coverArtFileExtension #1: defaults to null`);

  track.coverArtistContribs = contribs;

  t.equal(track.coverArtFileExtension, 'jpg',
    `coverArtFileExtension #2: is jpg if has cover art and not further specified`);

  track.coverArtistContribs = [];

  album.coverArtistContribs = contribs;
  XXX_decacheWikiData();

  t.equal(track.coverArtFileExtension, null,
    `coverArtFileExtension #3: only has value for unique cover art`);

  track.coverArtistContribs = contribs;

  album.trackCoverArtFileExtension = 'png';
  XXX_decacheWikiData();

  t.equal(track.coverArtFileExtension, 'png',
    `coverArtFileExtension #4: inherits album trackCoverArtFileExtension (1/2)`);

  track.coverArtFileExtension = 'gif';

  t.equal(track.coverArtFileExtension, 'gif',
    `coverArtFileExtension #5: is own value (1/2)`);

  track.coverArtistContribs = [];

  album.trackCoverArtistContribs = contribs;
  XXX_decacheWikiData();

  t.equal(track.coverArtFileExtension, 'gif',
    `coverArtFileExtension #6: is own value (2/2)`);

  track.coverArtFileExtension = null;

  t.equal(track.coverArtFileExtension, 'png',
    `coverArtFileExtension #7: inherits album trackCoverArtFileExtension (2/2)`);

  track.disableUniqueCoverArt = true;

  t.equal(track.coverArtFileExtension, null,
    `coverArtFileExtension #8: is null if track disables unique cover art`);
});

t.test(`Track.date`, t => {
  t.plan(3);

  const {track, album} = stubTrackAndAlbum();

  const {XXX_decacheWikiData} = linkAndBindWikiData({
    albumData: [album],
    trackData: [track],
  });

  t.equal(track.date, null,
    `date #1: defaults to null`);

  album.date = new Date('2012-12-12');
  XXX_decacheWikiData();

  t.same(track.date, album.date,
    `date #2: inherits from album`);

  track.dateFirstReleased = new Date('2009-09-09');

  t.same(track.date, new Date('2009-09-09'),
    `date #3: is own dateFirstReleased`);
});

t.test(`Track.featuredInFlashes`, t => {
  t.plan(2);

  const {track, album} = stubTrackAndAlbum('track1');

  const {flash: flash1, flashAct: flashAct1} = stubFlashAndAct('flash1');
  const {flash: flash2, flashAct: flashAct2} = stubFlashAndAct('flash2');

  const {XXX_decacheWikiData} = linkAndBindWikiData({
    albumData: [album],
    trackData: [track],
    flashData: [flash1, flash2],
    flashActData: [flashAct1, flashAct2],
  });

  t.same(track.featuredInFlashes, [],
    `featuredInFlashes #1: defaults to empty array`);

  flash1.featuredTracks = ['track:track1'];
  flash2.featuredTracks = ['track:track1'];
  XXX_decacheWikiData();

  t.same(track.featuredInFlashes, [flash1, flash2],
    `featuredInFlashes #2: matches flashes' featuredTracks`);
});

t.test(`Track.hasUniqueCoverArt`, t => {
  t.plan(7);

  const {track, album} = stubTrackAndAlbum();
  const {artist, contribs, badContribs} = stubArtistAndContribs();

  const {XXX_decacheWikiData} = linkAndBindWikiData({
    albumData: [album],
    artistData: [artist],
    trackData: [track],
  });

  t.equal(track.hasUniqueCoverArt, false,
    `hasUniqueCoverArt #1: defaults to false`);

  album.trackCoverArtistContribs = contribs;
  XXX_decacheWikiData();

  t.equal(track.hasUniqueCoverArt, true,
    `hasUniqueCoverArt #2: is true if album specifies trackCoverArtistContribs`);

  track.disableUniqueCoverArt = true;

  t.equal(track.hasUniqueCoverArt, false,
    `hasUniqueCoverArt #3: is false if disableUniqueCoverArt is true (1/2)`);

  track.disableUniqueCoverArt = false;

  album.trackCoverArtistContribs = badContribs;
  XXX_decacheWikiData();

  t.equal(track.hasUniqueCoverArt, false,
    `hasUniqueCoverArt #4: is false if album's trackCoverArtistContribs resolve empty`);

  track.coverArtistContribs = contribs;

  t.equal(track.hasUniqueCoverArt, true,
    `hasUniqueCoverArt #5: is true if track specifies coverArtistContribs`);

  track.disableUniqueCoverArt = true;

  t.equal(track.hasUniqueCoverArt, false,
    `hasUniqueCoverArt #6: is false if disableUniqueCoverArt is true (2/2)`);

  track.disableUniqueCoverArt = false;

  track.coverArtistContribs = badContribs;

  t.equal(track.hasUniqueCoverArt, false,
    `hasUniqueCoverArt #7: is false if track's coverArtistContribs resolve empty`);
});

t.test(`Track.originalReleaseTrack`, t => {
  t.plan(3);

  const {track: track1, album: album1} = stubTrackAndAlbum('track1');
  const {track: track2, album: album2} = stubTrackAndAlbum('track2');

  const {wikiData, linkWikiDataArrays, XXX_decacheWikiData} = linkAndBindWikiData({
    albumData: [album1, album2],
    trackData: [track1, track2],
  });

  t.equal(track2.originalReleaseTrack, null,
    `originalReleaseTrack #1: defaults to null`);

  track2.originalReleaseTrack = 'track:track1';

  t.equal(track2.originalReleaseTrack, track1,
    `originalReleaseTrack #2: is resolved from own value`);

  track2.trackData = [];

  t.equal(track2.originalReleaseTrack, null,
    `originalReleaseTrack #3: is null when track missing trackData`);
});

t.test(`Track.otherReleases`, t => {
  t.plan(6);

  const {track: track1, album: album1} = stubTrackAndAlbum('track1');
  const {track: track2, album: album2} = stubTrackAndAlbum('track2');
  const {track: track3, album: album3} = stubTrackAndAlbum('track3');
  const {track: track4, album: album4} = stubTrackAndAlbum('track4');

  const {wikiData, linkWikiDataArrays, XXX_decacheWikiData} = linkAndBindWikiData({
    albumData: [album1, album2, album3, album4],
    trackData: [track1, track2, track3, track4],
  });

  t.same(track1.otherReleases, [],
    `otherReleases #1: defaults to empty array`);

  track2.originalReleaseTrack = 'track:track1';
  track3.originalReleaseTrack = 'track:track1';
  track4.originalReleaseTrack = 'track:track1';
  XXX_decacheWikiData();

  t.same(track1.otherReleases, [track2, track3, track4],
    `otherReleases #2: otherReleases of original release are its rereleases`);

  wikiData.trackData = [track1, track3, track2, track4];
  linkWikiDataArrays();

  t.same(track1.otherReleases, [track3, track2, track4],
    `otherReleases #3: otherReleases matches trackData order`);

  wikiData.trackData = [track3, track2, track1, track4];
  linkWikiDataArrays();

  t.same(track2.otherReleases, [track1, track3, track4],
    `otherReleases #4: otherReleases of rerelease are original track then other rereleases (1/3)`);

  t.same(track3.otherReleases, [track1, track2, track4],
    `otherReleases #5: otherReleases of rerelease are original track then other rereleases (2/3)`);

  t.same(track4.otherReleases, [track1, track3, track2],
    `otherReleases #6: otherReleases of rerelease are original track then other rereleases (3/3)`);
});

t.test(`Track.referencedByTracks`, t => {
  t.plan(4);

  const {track: track1, album: album1} = stubTrackAndAlbum('track1');
  const {track: track2, album: album2} = stubTrackAndAlbum('track2');
  const {track: track3, album: album3} = stubTrackAndAlbum('track3');
  const {track: track4, album: album4} = stubTrackAndAlbum('track4');

  const {XXX_decacheWikiData} = linkAndBindWikiData({
    albumData: [album1, album2, album3, album4],
    trackData: [track1, track2, track3, track4],
  });

  t.same(track1.referencedByTracks, [],
    `referencedByTracks #1: defaults to empty array`);

  track2.referencedTracks = ['track:track1'];
  track3.referencedTracks = ['track:track1'];
  XXX_decacheWikiData();

  t.same(track1.referencedByTracks, [track2, track3],
    `referencedByTracks #2: matches tracks' referencedTracks`);

  track4.sampledTracks = ['track:track1'];
  XXX_decacheWikiData();

  t.same(track1.referencedByTracks, [track2, track3],
    `referencedByTracks #3: doesn't match tracks' sampledTracks`);

  track3.originalReleaseTrack = 'track:track2';
  XXX_decacheWikiData();

  t.same(track1.referencedByTracks, [track2],
    `referencedByTracks #4: doesn't include re-releases`);
});

t.test(`Track.sampledByTracks`, t => {
  t.plan(4);

  const {track: track1, album: album1} = stubTrackAndAlbum('track1');
  const {track: track2, album: album2} = stubTrackAndAlbum('track2');
  const {track: track3, album: album3} = stubTrackAndAlbum('track3');
  const {track: track4, album: album4} = stubTrackAndAlbum('track4');

  const {XXX_decacheWikiData} = linkAndBindWikiData({
    albumData: [album1, album2, album3, album4],
    trackData: [track1, track2, track3, track4],
  });

  t.same(track1.sampledByTracks, [],
    `sampledByTracks #1: defaults to empty array`);

  track2.sampledTracks = ['track:track1'];
  track3.sampledTracks = ['track:track1'];
  XXX_decacheWikiData();

  t.same(track1.sampledByTracks, [track2, track3],
    `sampledByTracks #2: matches tracks' sampledTracks`);

  track4.referencedTracks = ['track:track1'];
  XXX_decacheWikiData();

  t.same(track1.sampledByTracks, [track2, track3],
    `sampledByTracks #3: doesn't match tracks' referencedTracks`);

  track3.originalReleaseTrack = 'track:track2';
  XXX_decacheWikiData();

  t.same(track1.sampledByTracks, [track2],
    `sampledByTracks #4: doesn't include re-releases`);
});
