import {inspect} from 'node:util';

import {colors} from '#cli';
import {input} from '#composite';
import find from '#find';

import {
  isColor,
  isContributionList,
  isDate,
  isFileExtension,
  validateReferenceList,
} from '#validators';

import {withPropertyFromObject} from '#composite/data';
import {withResolvedContribs, withResolvedReferenceList}
  from '#composite/wiki-data';

import {
  exitWithoutDependency,
  exposeConstant,
  exposeDependency,
  exposeDependencyOrContinue,
  exposeUpdateValueOrContinue,
} from '#composite/control-flow';

import {
  additionalFiles,
  additionalNameList,
  commentary,
  commentatorArtists,
  contributionList,
  directory,
  duration,
  flag,
  name,
  referenceList,
  reverseReferenceList,
  simpleDate,
  singleReference,
  simpleString,
  urls,
  wikiData,
} from '#composite/wiki-properties';

import {
  exitWithoutUniqueCoverArt,
  inferredAdditionalNameList,
  inheritFromOriginalRelease,
  sharedAdditionalNameList,
  trackReverseReferenceList,
  withAlbum,
  withAlwaysReferenceByDirectory,
  withContainingTrackSection,
  withHasUniqueCoverArt,
  withOtherReleases,
  withPropertyFromAlbum,
} from '#composite/things/track';

import CacheableObject from './cacheable-object.js';
import Thing from './thing.js';

export class Track extends Thing {
  static [Thing.referenceType] = 'track';

  static [Thing.getPropertyDescriptors] = ({
    Album,
    ArtTag,
    Artist,
    Flash,
    Group,
  }) => ({
    // Update & expose

    name: name('Unnamed Track'),
    directory: directory(),

    additionalNames: additionalNameList(),
    sharedAdditionalNames: sharedAdditionalNameList(),
    inferredAdditionalNames: inferredAdditionalNameList(),

    duration: duration(),
    urls: urls(),
    dateFirstReleased: simpleDate(),

    color: [
      exposeUpdateValueOrContinue({
        validate: input.value(isColor),
      }),

      withContainingTrackSection(),

      withPropertyFromObject({
        object: '#trackSection',
        property: input.value('color'),
      }),

      exposeDependencyOrContinue({dependency: '#trackSection.color'}),

      withPropertyFromAlbum({
        property: input.value('color'),
      }),

      exposeDependency({dependency: '#album.color'}),
    ],

    alwaysReferenceByDirectory: [
      withAlwaysReferenceByDirectory(),
      exposeDependency({dependency: '#alwaysReferenceByDirectory'}),
    ],

    // Disables presenting the track as though it has its own unique artwork.
    // This flag should only be used in select circumstances, i.e. to override
    // an album's trackCoverArtists. This flag supercedes that property, as well
    // as the track's own coverArtists.
    disableUniqueCoverArt: flag(),

    // File extension for track's corresponding media file. This represents the
    // track's unique cover artwork, if any, and does not inherit the extension
    // of the album's main artwork. It does inherit trackCoverArtFileExtension,
    // if present on the album.
    coverArtFileExtension: [
      exitWithoutUniqueCoverArt(),

      exposeUpdateValueOrContinue({
        validate: input.value(isFileExtension),
      }),

      withPropertyFromAlbum({
        property: input.value('trackCoverArtFileExtension'),
      }),

      exposeDependencyOrContinue({dependency: '#album.trackCoverArtFileExtension'}),

      exposeConstant({
        value: input.value('jpg'),
      }),
    ],

    // Date of cover art release. Like coverArtFileExtension, this represents
    // only the track's own unique cover artwork, if any. This exposes only as
    // the track's own coverArtDate or its album's trackArtDate, so if neither
    // is specified, this value is null.
    coverArtDate: [
      withHasUniqueCoverArt(),

      exitWithoutDependency({
        dependency: '#hasUniqueCoverArt',
        mode: input.value('falsy'),
      }),

      exposeUpdateValueOrContinue({
        validate: input.value(isDate),
      }),

      withPropertyFromAlbum({
        property: input.value('trackArtDate'),
      }),

      exposeDependency({dependency: '#album.trackArtDate'}),
    ],

    commentary: commentary(),
    lyrics: simpleString(),

    additionalFiles: additionalFiles(),
    sheetMusicFiles: additionalFiles(),
    midiProjectFiles: additionalFiles(),

    originalReleaseTrack: singleReference({
      class: input.value(Track),
      find: input.value(find.track),
      data: 'trackData',
    }),

    // Internal use only - for directly identifying an album inside a track's
    // util.inspect display, if it isn't indirectly available (by way of being
    // included in an album's track list).
    dataSourceAlbum: singleReference({
      class: input.value(Album),
      find: input.value(find.album),
      data: 'albumData',
    }),

    artistContribs: [
      inheritFromOriginalRelease({
        property: input.value('artistContribs'),
      }),

      withResolvedContribs({
        from: input.updateValue({validate: isContributionList}),
      }).outputs({
        '#resolvedContribs': '#artistContribs',
      }),

      exposeDependencyOrContinue({
        dependency: '#artistContribs',
        mode: input.value('empty'),
      }),

      withPropertyFromAlbum({
        property: input.value('artistContribs'),
      }),

      exposeDependency({dependency: '#album.artistContribs'}),
    ],

    contributorContribs: [
      inheritFromOriginalRelease({
        property: input.value('contributorContribs'),
      }),

      contributionList(),
    ],

    // Cover artists aren't inherited from the original release, since it
    // typically varies by release and isn't defined by the musical qualities
    // of the track.
    coverArtistContribs: [
      exitWithoutUniqueCoverArt({
        value: input.value([]),
      }),

      withResolvedContribs({
        from: input.updateValue({validate: isContributionList}),
      }).outputs({
        '#resolvedContribs': '#coverArtistContribs',
      }),

      exposeDependencyOrContinue({
        dependency: '#coverArtistContribs',
        mode: input.value('empty'),
      }),

      withPropertyFromAlbum({
        property: input.value('trackCoverArtistContribs'),
      }),

      exposeDependency({dependency: '#album.trackCoverArtistContribs'}),
    ],

    referencedTracks: [
      inheritFromOriginalRelease({
        property: input.value('referencedTracks'),
      }),

      referenceList({
        class: input.value(Track),
        find: input.value(find.track),
        data: 'trackData',
      }),
    ],

    sampledTracks: [
      inheritFromOriginalRelease({
        property: input.value('sampledTracks'),
      }),

      referenceList({
        class: input.value(Track),
        find: input.value(find.track),
        data: 'trackData',
      }),
    ],

    groups: [
      withResolvedReferenceList({
        list: input.updateValue({
          validate: validateReferenceList(Group[Thing.referenceType]),
        }),

        find: input.value(find.group),
        data: 'groupData',
      }),

      exposeDependencyOrContinue({
        dependency: '#resolvedReferenceList',
        mode: input.value('empty'),
      }),

      withPropertyFromAlbum({
        property: input.value('trackGroups'),
      }),

      exposeDependency({
        dependency: '#album.trackGroups',
      }),
    ],

    artTags: referenceList({
      class: input.value(ArtTag),
      find: input.value(find.artTag),
      data: 'artTagData',
    }),

    // Update only

    albumData: wikiData({
      class: input.value(Album),
    }),

    artistData: wikiData({
      class: input.value(Artist),
    }),

    artTagData: wikiData({
      class: input.value(ArtTag),
    }),

    flashData: wikiData({
      class: input.value(Flash),
    }),

    groupData: wikiData({
      class: input.value(Group),
    }),

    trackData: wikiData({
      class: input.value(Track),
    }),

    // Expose only

    commentatorArtists: commentatorArtists(),

    album: [
      withAlbum(),
      exposeDependency({dependency: '#album'}),
    ],

    date: [
      exposeDependencyOrContinue({dependency: 'dateFirstReleased'}),

      withPropertyFromAlbum({
        property: input.value('date'),
      }),

      exposeDependency({dependency: '#album.date'}),
    ],

    hasUniqueCoverArt: [
      withHasUniqueCoverArt(),
      exposeDependency({dependency: '#hasUniqueCoverArt'}),
    ],

    otherReleases: [
      withOtherReleases(),
      exposeDependency({dependency: '#otherReleases'}),
    ],

    referencedByTracks: trackReverseReferenceList({
      list: input.value('referencedTracks'),
    }),

    sampledByTracks: trackReverseReferenceList({
      list: input.value('sampledTracks'),
    }),

    featuredInFlashes: reverseReferenceList({
      data: 'flashData',
      list: input.value('featuredTracks'),
    }),
  });

  [inspect.custom](depth) {
    const parts = [];

    parts.push(Thing.prototype[inspect.custom].apply(this));

    if (CacheableObject.getUpdateValue(this, 'originalReleaseTrack')) {
      parts.unshift(`${colors.yellow('[rerelease]')} `);
    }

    let album;

    if (depth >= 0) {
      try {
        album = this.album;
      } catch (_error) {}

      album ??= this.dataSourceAlbum;
    }

    if (album) {
      const albumName = album.name;
      const albumIndex = album.tracks.indexOf(this);
      const trackNum =
        (albumIndex === -1
          ? 'indeterminate position'
          : `#${albumIndex + 1}`);
      parts.push(` (${colors.yellow(trackNum)} in ${colors.green(albumName)})`);
    }

    return parts.join('');
  }
}
