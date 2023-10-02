// Atomic implementation for reverseReferenceList.
//
// Expects these input token shapes:
//  - data: a string dependency name
//  - list: input.value(a string)
//
// Embeds behavior of:
//  - reverseReferenceList
//  - withReverseReferenceList
//

import {getInputTokenValue} from '#composite';
import {empty} from '#sugar';

export default function({
  data: dataToken,
  list: listToken,
}) {
  /* ref: reverseReferenceList */
  const dataProperty = dataToken;
  const refListProperty = getInputTokenValue(listToken);

  return {
    flags: {update: false, expose: true, compose: true},

    expose: {
      dependencies: ['this', dataProperty],

      compute({this: thisThing, [dataProperty]: data}) {
        /* ref: withReverseReferenceList step #1 (exitWithoutDependency) */
        if (data === undefined || empty(data)) {
          return [];
        }

        /* ref: withReverseReferenceList step #2 (custom) */
        return (
          data.filter(thing => thing[refListProperty].includes(thisThing)));
      },
    }
  };
}
