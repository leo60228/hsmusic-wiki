import {empty, stitchArrays} from '#sugar';

export default {
  extraDependencies: ['to'],

  data(album, track) {
    const data = {};

    data.hasWallpaper = !empty(album.wallpaperArtistContribs);
    data.hasBanner = !empty(album.bannerArtistContribs);

    if (data.hasWallpaper) {
      if (!empty(album.wallpaperParts)) {
        data.wallpaperMode = 'parts';

        data.wallpaperPaths =
          album.wallpaperParts.map(part =>
            (part.asset
              ? ['media.albumWallpaperPart', album.directory, part.asset]
              : null));

        data.wallpaperStyles =
          album.wallpaperParts.map(part => part.style);
      } else {
        data.wallpaperMode = 'one';
        data.wallpaperPath = ['media.albumWallpaper', album.directory, album.wallpaperFileExtension];
        data.wallpaperStyle = album.wallpaperStyle;
      }
    }

    if (data.hasBanner) {
      data.hasBannerStyle = !!album.bannerStyle;
      data.bannerStyle = album.bannerStyle;
    }

    data.albumDirectory = album.directory;

    if (track) {
      data.trackDirectory = track.directory;
    }

    return data;
  },

  generate(data, {to}) {
    const indent = parts =>
      (parts ?? [])
        .filter(Boolean)
        .join('\n')
        .split('\n')
        .map(line => ' '.repeat(4) + line)
        .join('\n');

    const rule = (selector, parts) =>
      (!empty(parts.filter(Boolean))
        ? [`${selector} {`, indent(parts), `}`]
        : []);

    const oneWallpaperRule =
      data.wallpaperMode === 'one' &&
        rule(`body::before`, [
          `background-image: url("${to(...data.wallpaperPath)}");`,
          data.wallpaperStyle,
        ]);

    const wallpaperPartRules =
      data.wallpaperMode === 'parts' &&
        stitchArrays({
          path: data.wallpaperPaths,
          style: data.wallpaperStyles,
        }).map(({path, style}, index) =>
            rule(`.wallpaper-part:nth-child(${index + 1})`, [
              path && `background-image: url("${to(...path)}");`,
              style,
            ]));

    const nukeBasicWallpaperRule =
      data.wallpaperMode === 'parts' &&
        rule(`body::before`, ['display: none']);

    const wallpaperRules = [
      oneWallpaperRule,
      ...wallpaperPartRules || [],
      nukeBasicWallpaperRule,
    ];

    const bannerRule =
      data.hasBanner &&
        rule(`#banner img`, [
          data.bannerStyle,
        ]);

    const dataRule =
      rule(`:root`, [
        data.albumDirectory &&
          `--album-directory: ${data.albumDirectory};`,
        data.trackDirectory &&
          `--track-directory: ${data.trackDirectory};`,
      ]);

    return (
      [...wallpaperRules, bannerRule, dataRule]
        .filter(Boolean)
        .flat()
        .join('\n'));
  },
};
