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

    forward: input({type: 'string', defaultValue: 'thing'}),
    backward: input({type: 'string', defaultValue: 'thing'}),
    annotation: input({type: 'string', defaultValue: 'annotation'}),
  },

  steps: () => [
    withReverseAnnotatedReferenceList({
      data: input('data'),
      list: input('list'),

      forward: input('forward'),
      backward: input('backward'),
      annotation: input('annotation'),
    }),

    exposeDependency({dependency: '#reverseAnnotatedReferenceList'}),
  ],
});
