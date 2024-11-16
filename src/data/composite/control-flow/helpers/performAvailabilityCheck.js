import {empty} from '#sugar';

export default function performAvailabilityCheck(value, mode) {
  switch (mode) {
    case 'null':
      return value !== undefined && value !== null;

    case 'empty':
      return value !== undefined && !empty(value);

    case 'falsy':
      return !!value && (!Array.isArray(value) || !empty(value));

    case 'index':
      return typeof value === 'number' && value >= 0;
  }

  return undefined;
}
