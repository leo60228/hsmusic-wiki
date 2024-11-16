import {input} from '#composite';
import {is} from '#validators';

export default function inputNotFoundMode() {
  return input({
    validate: is('exit', 'filter', 'null'),
    defaultValue: 'filter',
  });
}
