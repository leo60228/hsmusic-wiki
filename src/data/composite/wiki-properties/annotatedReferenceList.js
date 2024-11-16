import {input, templateCompositeFrom} from '#composite';
import find from '#find';
import {validateAnnotatedReferenceList} from '#validators';
import {combineWikiDataArrays} from '#wiki-data';

import {exposeDependency} from '#composite/control-flow';
import {inputWikiData, withResolvedAnnotatedReferenceList}
  from '#composite/wiki-data';

import {referenceListInputDescriptions, referenceListUpdateDescription}
  from './helpers/reference-list-helpers.js';

export default templateCompositeFrom({
  annotation: `referencedArtworkList`,

  compose: false,

  inputs: {
    ...referenceListInputDescriptions(),

    data: inputWikiData({allowMixedTypes: true}),
    find: input({type: 'function'}),
  },

  update:
    referenceListUpdateDescription({
      validateReferenceList: validateAnnotatedReferenceList,
    }),

  steps: () => [
    withResolvedAnnotatedReferenceList({
      list: input.updateValue(),
      data: input('data'),
      find: input('find'),
    }),

    exposeDependency({dependency: '#resolvedAnnotatedReferenceList'}),
  ],
});
