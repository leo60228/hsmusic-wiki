import {isWallpaperPartList} from '#validators';

export default function() {
  return {
    flags: {update: true, expose: true},
    update: {validate: isWallpaperPartList},
    expose: {transform: value => value ?? []},
  };
}
