import {input, templateCompositeFrom} from '#composite';

import {exposeDependency} from '#composite/control-flow';
import {inputWikiData, withReverseAnnotatedReferenceList}
  from '#composite/wiki-data';

export default templateCompositeFrom({
  annotation: `reverseAnnotatedReferenceList`,

  compose: false,

  inputs: {
    data: inputWikiData({allowMixedTypes: false}),
    list: input({type: 'string'}),
  },

  steps: () => [
    withReverseAnnotatedReferenceList({
      data: input('data'),
      list: input('list'),
    }),

    exposeDependency({dependency: '#reverseAnnotatedReferenceList'}),
  ],
});
