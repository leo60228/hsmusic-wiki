import {input, templateCompositeFrom} from '#composite';
import {isThingClass, validateAnnotatedReferenceList} from '#validators';

import {exposeDependency} from '#composite/control-flow';
import {inputWikiData, withResolvedArtworkReferenceList} from '#composite/wiki-data';

export default templateCompositeFrom({
  annotation: `referencedArtworkList`,

  inputs: {
    class: input.staticValue({
      validate: isThingClass,
      acceptsNull: true,
      defaultValue: null,
    }),

    referenceType: input.staticValue({
      type: 'string',
      acceptsNull: true,
      defaultValue: null,
    }),

    data: inputWikiData({allowMixedTypes: false}),
    find: input({type: 'function'}),
  },

  update: ({
    [input.staticValue('class')]: thingClass,
    [input.staticValue('referenceType')]: referenceType,
  }) => ({
    validate:
      validateAnnotatedReferenceList(
        (thingClass
          ? thingClass[Symbol.for('Thing.referenceType')]
          : referenceType)),
  }),

  steps: () => [
    withResolvedArtworkReferenceList({
      list: input.updateValue(),
      data: input('data'),
      find: input('find'),
    }),

    exposeDependency({dependency: '#resolvedArtworkReferenceList'}),
  ],
});
