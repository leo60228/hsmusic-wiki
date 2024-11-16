import {input} from '#composite';
import {anyOf, isString, isThingClass, validateArrayItems} from '#validators';

export function referenceListInputDescriptions() {
  return {
    class: input.staticValue({
      validate:
        anyOf(
          isThingClass,
          validateArrayItems(isThingClass)),

      acceptsNull: true,
      defaultValue: null,
    }),

    referenceType: input.staticValue({
      validate:
        anyOf(
          isString,
          validateArrayItems(isString)),

      acceptsNull: true,
      defaultValue: null,
    }),
  };
}

export function referenceListUpdateDescription({
  validateReferenceList,
}) {
  return ({
    [input.staticValue('class')]: thingClass,
    [input.staticValue('referenceType')]: referenceType,
  }) => ({
    validate:
      validateReferenceList(
        (Array.isArray(thingClass)
          ? thingClass.map(thingClass =>
              thingClass[Symbol.for('Thing.referenceType')])
       : thingClass
          ? thingClass[Symbol.for('Thing.referenceType')]
          : referenceType)),
  });
}
