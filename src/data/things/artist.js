import find from '#find';
import {isName, validateArrayItems} from '#validators';

import Thing from './thing.js';

export class Artist extends Thing {
  static [Thing.referenceType] = 'artist';

  static [Thing.getPropertyDescriptors] = ({Album, Flash, Track}) => ({
    // Update & expose

    name: Thing.common.name('Unnamed Artist'),
    directory: Thing.common.directory(),
    urls: Thing.common.urls(),
    contextNotes: Thing.common.simpleString(),

    hasAvatar: Thing.common.flag(false),
    avatarFileExtension: Thing.common.fileExtension('jpg'),

    aliasNames: {
      flags: {update: true, expose: true},
      update: {validate: validateArrayItems(isName)},
      expose: {transform: (names) => names ?? []},
    },

    isAlias: Thing.common.flag(),
    aliasedArtistRef: Thing.common.singleReference(Artist),

    // Update only

    albumData: Thing.common.wikiData(Album),
    artistData: Thing.common.wikiData(Artist),
    flashData: Thing.common.wikiData(Flash),
    trackData: Thing.common.wikiData(Track),

    // Expose only

    aliasedArtist: {
      flags: {expose: true},

      expose: {
        dependencies: ['artistData', 'aliasedArtistRef'],
        compute: ({artistData, aliasedArtistRef}) =>
          aliasedArtistRef && artistData
            ? find.artist(aliasedArtistRef, artistData, {mode: 'quiet'})
            : null,
      },
    },

    tracksAsArtist:
      Artist.filterByContrib('trackData', 'artistContribs'),
    tracksAsContributor:
      Artist.filterByContrib('trackData', 'contributorContribs'),
    tracksAsCoverArtist:
      Artist.filterByContrib('trackData', 'coverArtistContribs'),

    tracksAsAny: {
      flags: {expose: true},

      expose: {
        dependencies: ['this', 'trackData'],

        compute: ({this: artist, trackData}) =>
          trackData?.filter((track) =>
            [
              ...track.artistContribs ?? [],
              ...track.contributorContribs ?? [],
              ...track.coverArtistContribs ?? [],
            ].some(({who}) => who === artist)) ?? [],
      },
    },

    tracksAsCommentator: {
      flags: {expose: true},

      expose: {
        dependencies: ['this', 'trackData'],

        compute: ({this: artist, trackData}) =>
          trackData?.filter(({commentatorArtists}) =>
            commentatorArtists.includes(artist)) ?? [],
      },
    },

    albumsAsAlbumArtist:
      Artist.filterByContrib('albumData', 'artistContribs'),
    albumsAsCoverArtist:
      Artist.filterByContrib('albumData', 'coverArtistContribs'),
    albumsAsWallpaperArtist:
      Artist.filterByContrib('albumData', 'wallpaperArtistContribs'),
    albumsAsBannerArtist:
      Artist.filterByContrib('albumData', 'bannerArtistContribs'),

    albumsAsCommentator: {
      flags: {expose: true},

      expose: {
        dependencies: [this, 'albumData'],

        compute: ({this: artist, albumData}) =>
          albumData?.filter(({commentatorArtists}) =>
            commentatorArtists.includes(artist)) ?? [],
      },
    },

    flashesAsContributor:
      Artist.filterByContrib('flashData', 'contributorContribs'),
  });

  static [Thing.getSerializeDescriptors] = ({
    serialize: S,
  }) => ({
    name: S.id,
    directory: S.id,
    urls: S.id,
    contextNotes: S.id,

    hasAvatar: S.id,
    avatarFileExtension: S.id,

    aliasNames: S.id,

    tracksAsArtist: S.toRefs,
    tracksAsContributor: S.toRefs,
    tracksAsCoverArtist: S.toRefs,
    tracksAsCommentator: S.toRefs,

    albumsAsAlbumArtist: S.toRefs,
    albumsAsCoverArtist: S.toRefs,
    albumsAsWallpaperArtist: S.toRefs,
    albumsAsBannerArtist: S.toRefs,
    albumsAsCommentator: S.toRefs,

    flashesAsContributor: S.toRefs,
  });

  static filterByContrib = (thingDataProperty, contribsProperty) => ({
    flags: {expose: true},

    expose: {
      dependencies: ['this', thingDataProperty],

      compute: ({
        this: artist,
        [thingDataProperty]: thingData,
      }) =>
        thingData?.filter(thing =>
          thing[contribsProperty]
            ?.some(contrib => contrib.who === artist)) ?? [],
    },
  });
}
