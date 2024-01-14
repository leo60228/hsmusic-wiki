// Some really, really simple functions for formatting HTML content.

import {inspect} from 'node:util';

import {colors} from '#cli';
import {empty, typeAppearance, unique, withAggregate} from '#sugar';
import * as commonValidators from '#validators';

const {
  anyOf,
  is,
  isArray,
  isBoolean,
  isNumber,
  isString,
  isSymbol,
  looseArrayOf,
  validateAllPropertyValues,
  validateArrayItems,
  validateInstanceOf,
} = commonValidators;

// COMPREHENSIVE!
// https://html.spec.whatwg.org/multipage/syntax.html#void-elements
export const selfClosingTags = [
  'area',
  'base',
  'br',
  'col',
  'embed',
  'hr',
  'img',
  'input',
  'link',
  'meta',
  'source',
  'track',
  'wbr',
];

// Not so comprehensive!!
export const attributeSpec = {
  'class': {
    arraylike: true,
    join: ' ',
    unique: true,
  },

  'style': {
    arraylike: true,
    join: '; ',
  },
};

// Pass to tag() as an attributes key to make tag() return a 8lank string if the
// provided content is empty. Useful for when you'll only 8e showing an element
// according to the presence of content that would 8elong there.
export const onlyIfContent = Symbol();

// Pass to tag() as an attributes key to make children be joined together by the
// provided string. This is handy, for example, for joining lines by <br> tags,
// or putting some other divider between each child. Note this will only have an
// effect if the tag content is passed as an array of children and not a single
// string.
export const joinChildren = Symbol();

// Pass to tag() as an attributes key to prevent additional whitespace from
// being added to the inner start and end of the tag's content - basically,
// ensuring that the start of the content begins immediately after the ">"
// ending the opening tag, and ends immediately before the "<" at the start of
// the closing tag. This has effect when a single child spans multiple lines,
// or when there are multiple children.
export const noEdgeWhitespace = Symbol();

// Don't pass this directly, use html.metatag('blockwrap') instead.
// Causes *following* content (past the metatag) to be placed inside a span
// which is styled 'inline-block', which ensures that the words inside the
// metatag all stay together, line-breaking only if needed, and following
// text is displayed immediately after the last character of the last line of
// the metatag (provided there's room on that line for the following word or
// character).
export const blockwrap = Symbol();

function* isBlankArrayHelper(content) {
  // First look for string items. These are the easiest to
  // test blankness.

  const nonStringContent = [];

  for (const item of content) {
    if (typeof item === 'string') {
      if (item.length > 0) {
        return false;
      }
    } else {
      nonStringContent.push(item);
    }
  }

  // Analyze the content more closely. Put arrays (and
  // content of tags marked onlyIfContent) into one array,
  // and templates into another. And if there's anything
  // else, that's a non-blank condition we'll detect now.

  const arrayContent = [];
  const templateContent = [];

  for (const item of nonStringContent) {
    if (item instanceof Tag) {
      if (item.onlyIfContent || item.contentOnly) {
        arrayContent.push(item.content);
      } else {
        return false;
      }
    } else if (Array.isArray(item)) {
      arrayContent.push(item);
    } else if (item instanceof Template) {
      templateContent.push(item);
    } else {
      return false;
    }
  }

  // Iterate over arrays and tag content recursively.
  // But only perform a basic test, first.

  const recursiveGenerators = [];

  for (const item of arrayContent) {
    const generator = isBlankArrayHelper(item);
    const firstResult = generator.next();
    if (firstResult.done) {
      if (firstResult.value === false) {
        return false;
      }
    } else {
      recursiveGenerators.push(generator);
    }
  }

  // If none of the arrays/tag content ended up including
  // templates, *and* this call's content doesn't have any
  // directly descendant templates, then we've iterated
  // over everything and didn't find anything non-blank.

  if (empty(recursiveGenerators) && empty(templateContent)) {
    return true;
  }

  // We'll continue the recursive generators to test for
  // template content only if nothing else passes first,
  // and only after a yield, so that the calling function
  // can refer back to this generator only if needed.

  yield;

  // First check directly descendant templates. We don't
  // actually have any way to rank one template as "easier"
  // to test for blankness tha nanother, so the order is
  // basically arbitrary, but this probably avoids some
  // overhead of resuming generators (which would perform
  // equivalent template-resolving work anyway).

  for (const template of templateContent) {
    // Note that we're using the atomic isBlank function
    // to test templates, instead of recursing into
    // another generator. At this point we've established
    // that there's no hope but to test the templates,
    // and we're already performing the worst operation
    // available - if we decided to defer recursively
    // evaluating one template's own descendant templates,
    // what would we do *instead?* Well, just evaluate
    // some other template... which is already the worst-
    // priority action. So there's nothing lost by just
    // checking each remaining template atomically.
    if (!isBlank(template.content)) {
      return false;
    }
  }

  // Test recursive generators last.

  for (const generator of recursiveGenerators) {
    if (generator.next().value === false) {
      return false;
    }
  }

  // If absolutely nothing has been found, we're golden!
  // This content is definitely blank.

  return true;
}

// Checks if the content provided would be represented as nothing if included
// on a page. This can be used on its own, and is the underlying "interface"
// layer for specific classes' `blank` getters, so its definition and usage
// tend to be recursive.
//
// Note that this shouldn't be used to infer anything about non-content values
// (e.g. attributes) - it's only suited for actual page content.
export function isBlank(content) {
  if (content instanceof Tag || content instanceof Template) {
    return content.blank;
  }

  if (Array.isArray(content)) {
    const generator = isBlankArrayHelper(content);

    let result;
    do {
      result = generator.next();
    } while (!result.done);

    return result.value;
  }

  if (typeof content === 'string') {
    return content.length === 0;
  }

  return false;
}

export const validators = {
  isBlank(value) {
    if (!isBlank(value)) {
      throw new TypeError(`Expected blank content`);
    }

    return true;
  },

  isTag(value) {
    return isTag(value);
  },

  isTemplate(value) {
    return isTemplate(value);
  },

  isHTML(value) {
    return isHTML(value);
  },

  isAttributes(value) {
    return isAttributesAdditionSinglet(value);
  },
};

export function blank() {
  return [];
}

export function blankAttributes() {
  return new Attributes();
}

export function tag(tagName, ...args) {
  const lastArg = args.at(-1);

  const lastArgIsAttributes =
    typeof lastArg === 'object' && lastArg !== null &&
    !Array.isArray(lastArg) &&
    !(lastArg instanceof Tag) &&
    !(lastArg instanceof Template);

  const content =
    (lastArgIsAttributes
      ? null
      : args.at(-1));

  const attributes =
    (lastArgIsAttributes
      ? args
      : args.slice(0, -1));

  return new Tag(tagName, attributes, content);
}

export function tags(content, ...attributes) {
  return new Tag(null, attributes, content);
}

export function metatag(identifier, ...args) {
  let content;
  let opts = {};

  if (
    typeof args[0] === 'object' &&
    !(Array.isArray(args[0]) ||
      args[0] instanceof Tag ||
      args[0] instanceof Template)
  ) {
    opts = args[0];
    content = args[1];
  } else {
    content = args[0];
  }

  switch (identifier) {
    case 'blockwrap':
      return new Tag(null, {[blockwrap]: true}, content);

    default:
      throw new Error(`Unknown metatag "${identifier}"`);
  }
}

export function normalize(content) {
  return Tag.normalize(content);
}

export class Tag {
  #tagName = '';
  #content = null;
  #attributes = null;

  #traceError = null;

  constructor(tagName, attributes, content) {
    this.tagName = tagName;
    this.attributes = attributes;
    this.content = content;

    this.#traceError = new Error();
  }

  clone() {
    return Reflect.construct(this.constructor, [
      this.tagName,
      this.attributes,
      this.content,
    ]);
  }

  set tagName(value) {
    if (value === undefined || value === null) {
      this.tagName = '';
      return;
    }

    if (typeof value !== 'string') {
      throw new Error(`Expected tagName to be a string`);
    }

    if (selfClosingTags.includes(value) && this.content.length) {
      throw new Error(`Tag <${value}> is self-closing but this tag has content`);
    }

    this.#tagName = value;
  }

  get tagName() {
    return this.#tagName;
  }

  set attributes(attributes) {
    if (attributes instanceof Attributes) {
      this.#attributes = attributes;
    } else {
      this.#attributes = new Attributes(attributes);
    }
  }

  get attributes() {
    if (this.#attributes === null) {
      this.attributes = {};
    }

    return this.#attributes;
  }

  set content(value) {
    if (
      this.selfClosing &&
      !(value === null ||
        value === undefined ||
        !value ||
        Array.isArray(value) && value.filter(Boolean).length === 0)
    ) {
      throw new Error(`Tag <${this.tagName}> is self-closing but got content`);
    }

    let contentArray;

    if (Array.isArray(value)) {
      contentArray = value;
    } else {
      contentArray = [value];
    }

    this.#content = contentArray
      .flat(Infinity)
      .filter(Boolean);

    this.#content.toString = () => this.#stringifyContent();
  }

  get content() {
    if (this.#content === null) {
      this.#content = [];
    }

    return this.#content;
  }

  get selfClosing() {
    if (this.tagName) {
      return selfClosingTags.includes(this.tagName);
    } else {
      return false;
    }
  }

  get blank() {
    if (this.onlyIfContent && isBlank(this.content)) {
      return true;
    }

    if (this.contentOnly && isBlank(this.content)) {
      return true;
    }

    return false;
  }

  get contentOnly() {
    if (this.tagName !== '') return false;
    if (!this.attributes.blank) return false;
    if (this.blockwrap) return false;
    return true;
  }

  #setAttributeFlag(attribute, value) {
    if (value) {
      this.attributes.set(attribute, true);
    } else {
      this.attributes.remove(attribute);
    }
  }

  #getAttributeFlag(attribute) {
    return !!this.attributes.get(attribute);
  }

  #setAttributeString(attribute, value) {
    // Note: This function accepts and records the empty string ('')
    // distinctly from null/undefined.

    if (value === undefined || value === null) {
      this.attributes.remove(attribute);
      return undefined;
    } else {
      this.attributes.set(attribute, String(value));
    }
  }

  #getAttributeString(attribute) {
    const value = this.attributes.get(attribute);

    if (value === undefined || value === null) {
      return undefined;
    } else {
      return String(value);
    }
  }

  set onlyIfContent(value) {
    this.#setAttributeFlag(onlyIfContent, value);
  }

  get onlyIfContent() {
    return this.#getAttributeFlag(onlyIfContent);
  }

  set joinChildren(value) {
    this.#setAttributeString(joinChildren, value);
  }

  get joinChildren() {
    return this.#getAttributeString(joinChildren);
  }

  set noEdgeWhitespace(value) {
    this.#setAttributeFlag(noEdgeWhitespace, value);
  }

  get noEdgeWhitespace() {
    return this.#getAttributeFlag(noEdgeWhitespace);
  }

  set blockwrap(value) {
    this.#setAttributeFlag(blockwrap, value);
  }

  get blockwrap() {
    return this.#getAttributeFlag(blockwrap);
  }

  toString() {
    if (this.onlyIfContent && isBlank(this.content)) {
      return '';
    }

    const attributesString = this.attributes.toString();
    const contentString = this.content.toString();

    if (!this.tagName) {
      return contentString;
    }

    const openTag = (attributesString
      ? `<${this.tagName} ${attributesString}>`
      : `<${this.tagName}>`);

    if (this.selfClosing) {
      return openTag;
    }

    const closeTag = `</${this.tagName}>`;

    if (!this.content.length) {
      return openTag + closeTag;
    }

    if (!contentString.includes('\n')) {
      return openTag + contentString + closeTag;
    }

    const parts = [
      openTag,
      contentString
        .split('\n')
        .map((line, i) =>
          (i === 0 && this.noEdgeWhitespace
            ? line
            : '    ' + line))
        .join('\n'),
      closeTag,
    ];

    return parts.join(
      (this.noEdgeWhitespace
        ? ''
        : '\n'));
  }

  #stringifyContent() {
    if (this.selfClosing) {
      return '';
    }

    const joiner =
      (this.joinChildren === undefined
        ? '\n'
     : this.joinChildren === ''
        ? ''
        : `\n${this.joinChildren}\n`);

    let content = '';
    let blockwrapClosers = '';

    for (const [index, item] of this.content.entries()) {
      let itemContent;

      try {
        itemContent = item.toString();
      } catch (caughtError) {
        const indexPart = colors.yellow(`child #${index + 1}`);

        const error =
          new Error(
            `Error in ${indexPart} ` +
            `of ${inspect(this, {compact: true})}`,
            {cause: caughtError});

        error[Symbol.for(`hsmusic.aggregate.alwaysTrace`)] = true;
        error[Symbol.for(`hsmusic.aggregate.traceFrom`)] = this.#traceError;

        error[Symbol.for(`hsmusic.aggregate.unhelpfulTraceLines`)] = [
          /content-function\.js/,
          /util\/html\.js/,
        ];

        error[Symbol.for(`hsmusic.aggregate.helpfulTraceLines`)] = [
          /content\/dependencies\/(.*\.js:.*(?=\)))/,
        ];

        throw error;
      }

      if (!itemContent) {
        continue;
      }

      if (content) {
        content += joiner;
      }

      // Blockwraps only apply if they actually contain some content whose
      // words should be kept together, so it's okay to put them beneath the
      // itemContent check. They also never apply at the very start of content,
      // because at that point there aren't any preceding words from which the
      // blockwrap would differentiate its content.
      if (item instanceof Tag && item.blockwrap && content) {
        content += `<span class="blockwrap">`;
        blockwrapClosers += `</span>`;
      }

      content += itemContent;
    }

    content += blockwrapClosers;

    return content;
  }

  static normalize(content) {
    // Normalizes contents that are valid from an `isHTML` perspective so
    // that it's always a pure, single Tag object.

    if (content instanceof Template) {
      return Tag.normalize(Template.resolve(content));
    }

    if (content instanceof Tag) {
      return content;
    }

    return new Tag(null, null, content);
  }

  [inspect.custom](depth, opts) {
    const lines = [];

    const niceAttributes = ['id', 'class'];
    const attributes = blankAttributes();

    for (const attribute of niceAttributes) {
      if (this.attributes.has(attribute)) {
        const value = this.attributes.get(attribute);

        if (!value) continue;
        if (Array.isArray(value) && empty(value)) continue;

        let string;
        let suffix = '';

        if (Array.isArray(value)) {
          string = value[0].toString();
          if (value.length > 1) {
            suffix = ` (+${value.length - 1})`;
          }
        } else {
          string = value.toString();
        }

        const trim =
          (string.length > 15
            ? `${string.slice(0, 12)}...`
            : string);

        attributes.set(attribute, trim + suffix);
      }
    }

    const attributesPart =
      (attributes.blank
        ? ``
        : ` ${attributes.toString({color: true})}`);

    const tagNamePart =
      (this.tagName
        ? colors.bright(colors.blue(this.tagName))
        : ``);

    const tagPart =
      (this.tagName
        ? [
            `<`,
            tagNamePart,
            attributesPart,
            (empty(this.content) ? ` />` : `>`),
          ].join(``)
        : ``);

    const accentText =
      (this.tagName
        ? (empty(this.content)
            ? ``
            : `(${this.content.length} items)`)
        : (empty(this.content)
            ? `(no name)`
            : `(no name, ${this.content.length} items)`));

    const accentPart =
      (accentText
        ? `${colors.dim(accentText)}`
        : ``);

    const headingParts = [
      `Tag`,
      tagPart,
      accentPart,
    ];

    const heading = headingParts.filter(Boolean).join(` `);

    lines.push(heading);

    if (!opts.compact && (depth === null || depth >= 0)) {
      const nextDepth =
        (depth === null
          ? null
          : depth - 1);

      for (const child of this.content) {
        const childLines = [];

        if (typeof child === 'string') {
          const childFlat = child.replace(/\n/g, String.raw`\n`);
          const childTrim =
            (childFlat.length >= 40
              ? childFlat.slice(0, 37) + '...'
              : childFlat);

          childLines.push(
            `  Text: ${opts.stylize(`"${childTrim}"`, 'string')}`);
        } else {
          childLines.push(...
            inspect(child, {depth: nextDepth})
              .split('\n')
              .map(line => `  ${line}`));
        }

        lines.push(...childLines);
      }
    }

    return lines.join('\n');
  }
}

export function attributes(attributes) {
  return new Attributes(attributes);
}

export function parseAttributes(string) {
  return Attributes.parse(string);
}

export class Attributes {
  #attributes = Object.create(null);

  constructor(attributes) {
    this.attributes = attributes;
  }

  clone() {
    return new Attributes(this);
  }

  set attributes(value) {
    this.#attributes = Object.create(null);

    if (value === undefined || value === null) {
      return;
    }

    this.add(value);
  }

  get attributes() {
    return this.#attributes;
  }

  get blank() {
    const keepAnyAttributes =
      Object.entries(this.attributes).some(([attribute, value]) =>
        this.#keepAttributeValue(attribute, value));

    return !keepAnyAttributes;
  }

  set(attribute, value) {
    if (value instanceof Template) {
      value = Template.resolve(value);
    }

    if (Array.isArray(value)) {
      value = value.flat(Infinity);
    }

    if (value === null || value === undefined) {
      this.remove(attribute);
    } else {
      this.#attributes[attribute] = value;
    }

    return value;
  }

  add(...args) {
    switch (args.length) {
      case 1:
        isAttributesAdditionSinglet(args[0]);
        return this.#addMultipleAttributes(args[0]);

      case 2:
        isAttributesAdditionPair(args);
        return this.#addOneAttribute(args[0], args[1]);

      default:
        throw new Error(
          `Expected array or object, or attribute and value`);
    }
  }

  #addMultipleAttributes(attributes) {
    const flatInputAttributes =
      [attributes].flat(Infinity).filter(Boolean);

    const attributeSets =
      flatInputAttributes.map(attributes => this.#getAttributeSet(attributes));

    const resultList = [];

    for (const set of attributeSets) {
      const setResults = {};

      for (const key of Reflect.ownKeys(set)) {
        const value = set[key];
        setResults[key] = this.#addOneAttribute(key, value);
      }

      resultList.push(setResults);
    }

    return resultList;
  }

  #getAttributeSet(attributes) {
    if (attributes instanceof Attributes) {
      return attributes.attributes;
    }

    if (attributes instanceof Template) {
      const resolved = Template.resolve(attributes);
      isAttributesAdditionSinglet(resolved);
      return resolved;
    }

    if (typeof attributes === 'object') {
      return attributes;
    }

    throw new Error(
      `Expected Attributes, Template, or object, ` +
      `got ${typeAppearance(attribute)}`);
  }

  #addOneAttribute(attribute, value) {
    if (value === null || value === undefined) {
      return;
    }

    if (value instanceof Template) {
      return this.#addOneAttribute(attribute, Template.resolve(value));
    }

    if (Array.isArray(value)) {
      value = value.flat(Infinity);
    }

    if (!this.has(attribute)) {
      return this.set(attribute, value);
    }

    const descriptor = attributeSpec[attribute];
    const existingValue = this.get(attribute);

    let newValue = value;

    if (descriptor?.arraylike) {
      const valueArray =
        (Array.isArray(value)
          ? value
          : [value]);

      const existingValueArray =
        (Array.isArray(existingValue)
          ? existingValue
          : [existingValue]);

      newValue = existingValueArray.concat(valueArray);

      if (descriptor.unique) {
        newValue = unique(newValue);
      }

      if (newValue.length === 1) {
        newValue = newValue[0];
      }
    }

    return this.set(attribute, newValue);
  }

  get(attribute) {
    return this.#attributes[attribute];
  }

  has(attribute) {
    return attribute in this.#attributes;
  }

  remove(attribute) {
    return delete this.#attributes[attribute];
  }

  push(attribute, ...values) {
    const oldValue = this.get(attribute);
    const newValue =
      (Array.isArray(oldValue)
        ? oldValue.concat(values)
     : oldValue
        ? [oldValue, ...values]
        : values);
    this.set(attribute, newValue);
    return newValue;
  }

  toString({color = false} = {}) {
    const attributeKeyValues =
      Object.entries(this.attributes)
        .map(([key, value]) =>
          (this.#keepAttributeValue(key, value)
            ? [key, this.#transformAttributeValue(key, value), true]
            : [key, undefined, false]))
        .filter(([_key, _value, keep]) => keep)
        .map(([key, value]) => [key, value]);

    const attributeParts =
      attributeKeyValues
        .map(([key, value]) => {
          const keyPart = key;
          const escapedValue = this.#escapeAttributeValue(value);
          const valuePart =
            (color
              ? colors.green(`"${escapedValue}"`)
              : `"${escapedValue}"`);

          return (
            (typeof value === 'boolean'
              ? `${keyPart}`
              : `${keyPart}=${valuePart}`));
        });

    return attributeParts.join(' ');
  }

  #keepAttributeValue(attribute, value) {
    switch (typeof value) {
      case 'undefined':
        return false;

      case 'object':
        if (Array.isArray(value)) {
          return value.some(Boolean);
        } else if (value === null) {
          return false;
        } else {
          // Other objects are an error.
          break;
        }

      case 'boolean':
        return value;

      case 'string':
      case 'number':
        return true;

      case 'array':
        return value.some(Boolean);
    }

    throw new Error(
      `Value for attribute "${attribute}" should be primitive or array, ` +
      `got ${typeAppearance(value)}: ${inspect(value)}`);
  }

  #transformAttributeValue(attribute, value) {
    const descriptor = attributeSpec[attribute];

    switch (typeof value) {
      case 'boolean':
        return value;

      case 'number':
        return value.toString();

      // If it's a kept object, it's an array.
      case 'object': {
        const joiner =
          (descriptor?.arraylike && descriptor?.join)
            ?? ' ';

        return value.filter(Boolean).join(joiner);
      }

      default:
        return value;
    }
  }

  #escapeAttributeValue(value) {
    return value
      .toString()
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&apos;');
  }

  static parse(string) {
    const attributes = Object.create(null);

    const skipWhitespace = i => {
      if (!/\s/.test(string[i])) {
        return i;
      }

      const match = string.slice(i).match(/[^\s]/);
      if (match) {
        return i + match.index;
      }

      return string.length;
    };

    for (let i = 0; i < string.length; ) {
      i = skipWhitespace(i);
      const aStart = i;
      const aEnd = i + string.slice(i).match(/[\s=]|$/).index;
      const attribute = string.slice(aStart, aEnd);
      i = skipWhitespace(aEnd);
      if (string[i] === '=') {
        i = skipWhitespace(i + 1);
        let end, endOffset;
        if (string[i] === '"' || string[i] === "'") {
          end = string[i];
          endOffset = 1;
          i++;
        } else {
          end = '\\s';
          endOffset = 0;
        }
        const vStart = i;
        const vEnd = i + string.slice(i).match(new RegExp(`${end}|$`)).index;
        const value = string.slice(vStart, vEnd);
        i = vEnd + endOffset;
        attributes[attribute] = value;
      } else {
        attributes[attribute] = attribute;
      }
    }

    return (
      Reflect.construct(this, [
        Object.fromEntries(
          Object.entries(attributes)
            .map(([key, val]) => [
              key,
              (val === 'true'
                ? true
             : val === 'false'
                ? false
             : val === key
                ? true
                : val),
            ])),
      ]));
  }

  [inspect.custom]() {
    const visiblePart = this.toString({color: true});

    const numSymbols = Object.getOwnPropertySymbols(this.#attributes).length;
    const numSymbolsPart =
      (numSymbols >= 2
        ? `${numSymbols} symbol`
     : numSymbols === 1
        ? `1 symbol`
        : ``);

    const symbolPart =
      (visiblePart && numSymbolsPart
        ? `(+${numSymbolsPart})`
     : numSymbols
        ? `(${numSymbolsPart})`
        : ``);

    const contentPart =
      (visiblePart && symbolPart
        ? `<${visiblePart} ${symbolPart}>`
     : visiblePart || symbolPart
        ? `<${visiblePart || symbolPart}>`
        : `<no attributes>`);

    return `Attributes ${contentPart}`;
  }
}

export function resolve(tagOrTemplate, {normalize = null} = {}) {
  if (normalize === 'tag') {
    return Tag.normalize(tagOrTemplate);
  } else if (normalize === 'string') {
    return Tag.normalize(tagOrTemplate).toString();
  } else if (normalize) {
    throw new TypeError(`Expected normalize to be 'tag', 'string', or null`);
  } else {
    return Template.resolve(tagOrTemplate);
  }
}

export function template(description) {
  return new Template(description);
}

export class Template {
  #description = {};
  #slotValues = {};

  constructor(description) {
    if (!description[Stationery.validated]) {
      Template.validateDescription(description);
    }

    this.#description = description;
  }

  clone() {
    const clone = Reflect.construct(this.constructor, [
      this.#description,
    ]);

    clone.setSlots(this.#slotValues);

    return clone;
  }

  static validateDescription(description) {
    if (typeof description !== 'object') {
      throw new TypeError(`Expected object, got ${typeAppearance(description)}`);
    }

    if (description === null) {
      throw new TypeError(`Expected object, got null`);
    }

    const topErrors = [];

    if (!('content' in description)) {
      topErrors.push(new TypeError(`Expected description.content`));
    } else if (typeof description.content !== 'function') {
      topErrors.push(new TypeError(`Expected description.content to be function`));
    }

    if ('annotation' in description) {
      if (typeof description.annotation !== 'string') {
        topErrors.push(new TypeError(`Expected annotation to be string`));
      }
    }

    if ('slots' in description) validateSlots: {
      if (typeof description.slots !== 'object') {
        topErrors.push(new TypeError(`Expected description.slots to be object`));
        break validateSlots;
      }

      try {
        this.validateSlotsDescription(description.slots);
      } catch (slotError) {
        topErrors.push(slotError);
      }
    }

    if (!empty(topErrors)) {
      throw new AggregateError(topErrors,
        (typeof description.annotation === 'string'
          ? `Errors validating template "${description.annotation}" description`
          : `Errors validating template description`));
    }

    return true;
  }

  static validateSlotsDescription(slots) {
    const slotErrors = [];

    for (const [slotName, slotDescription] of Object.entries(slots)) {
      if (typeof slotDescription !== 'object' || slotDescription === null) {
        slotErrors.push(new TypeError(`(${slotName}) Expected slot description to be object`));
        continue;
      }

      if ('default' in slotDescription) validateDefault: {
        if (
          slotDescription.default === undefined ||
          slotDescription.default === null
        ) {
          slotErrors.push(new TypeError(`(${slotName}) Leave slot default unspecified instead of undefined or null`));
          break validateDefault;
        }

        try {
          Template.validateSlotValueAgainstDescription(slotDescription.default, slotDescription);
        } catch (error) {
          error.message = `(${slotName}) Error validating slot default value: ${error.message}`;
          slotErrors.push(error);
        }
      }

      if ('validate' in slotDescription && 'type' in slotDescription) {
        slotErrors.push(new TypeError(`(${slotName}) Don't specify both slot validate and type`));
      } else if (!('validate' in slotDescription || 'type' in slotDescription)) {
        slotErrors.push(new TypeError(`(${slotName}) Expected either slot validate or type`));
      } else if ('validate' in slotDescription) {
        if (typeof slotDescription.validate !== 'function') {
          slotErrors.push(new TypeError(`(${slotName}) Expected slot validate to be function`));
        }
      } else if ('type' in slotDescription) {
        const acceptableSlotTypes = [
          'string',
          'number',
          'bigint',
          'boolean',
          'symbol',
          'html',
          'attributes',
        ];

        if (slotDescription.type === 'function') {
          slotErrors.push(new TypeError(`(${slotName}) Functions shouldn't be provided to slots`));
        } else if (slotDescription.type === 'object') {
          slotErrors.push(new TypeError(`(${slotName}) Provide validate function instead of type: object`));
        } else if (
          (slotDescription.type === 'html' || slotDescription.type === 'attributes') &&
          !('mutable' in slotDescription)
        ) {
          slotErrors.push(new TypeError(`(${slotName}) Specify mutable: true/false alongside type: ${slotDescription.type}`));
        } else if (!acceptableSlotTypes.includes(slotDescription.type)) {
          slotErrors.push(new TypeError(`(${slotName}) Expected slot type to be one of ${acceptableSlotTypes.join(', ')}`));
        }
      }

      if ('mutable' in slotDescription) {
        if (slotDescription.type !== 'html' && slotDescription.type !== 'attributes') {
          slotErrors.push(new TypeError(`(${slotName}) Only specify mutable alongside type: html or attributes`));
        }

        if (typeof slotDescription.mutable !== 'boolean') {
          slotErrors.push(new TypeError(`(${slotName}) Expected slot mutable to be boolean`));
        }
      }
    }

    if (!empty(slotErrors)) {
      throw new AggregateError(slotErrors, `Errors in slot descriptions`);
    }

    return true;
  }

  slot(slotName, value) {
    this.setSlot(slotName, value);
    return this;
  }

  slots(slotNamesToValues) {
    this.setSlots(slotNamesToValues);
    return this;
  }

  setSlot(slotName, value) {
    const description = this.#getSlotDescriptionOrError(slotName);

    try {
      Template.validateSlotValueAgainstDescription(value, description);
    } catch (error) {
      error.message =
        (this.description.annotation
          ? `Error validating template "${this.description.annotation}" slot "${slotName}" value: ${error.message}`
          : `Error validating template slot "${slotName}" value: ${error.message}`);
      throw error;
    }

    this.#slotValues[slotName] = value;
  }

  setSlots(slotNamesToValues) {
    if (
      typeof slotNamesToValues !== 'object' ||
      Array.isArray(slotNamesToValues) ||
      slotNamesToValues === null
    ) {
      throw new TypeError(`Expected object mapping of slot names to values`);
    }

    const slotErrors = [];

    for (const [slotName, value] of Object.entries(slotNamesToValues)) {
      const description = this.#getSlotDescriptionNoError(slotName);
      if (!description) {
        slotErrors.push(new TypeError(`(${slotName}) Template doesn't have a "${slotName}" slot`));
        continue;
      }

      try {
        Template.validateSlotValueAgainstDescription(value, description);
      } catch (error) {
        error.message = `(${slotName}) ${error.message}`;
        slotErrors.push(error);
      }
    }

    if (!empty(slotErrors)) {
      throw new AggregateError(slotErrors,
        (this.description.annotation
          ? `Error validating template "${this.description.annotation}" slots`
          : `Error validating template slots`));
    }

    Object.assign(this.#slotValues, slotNamesToValues);
  }

  static validateSlotValueAgainstDescription(value, description) {
    if (value === undefined) {
      throw new TypeError(`Specify value as null or don't specify at all`);
    }

    // Null is always an acceptable slot value.
    if (value === null) {
      return true;
    }

    if ('validate' in description) {
      description.validate({
        ...commonValidators,
        ...validators,
      })(value);
    }

    if ('type' in description) {
      switch (description.type) {
        case 'html': {
          return isHTML(value);
        }

        case 'attributes': {
          return isAttributesAdditionSinglet(value);
        }

        case 'string': {
          // Tags and templates are valid in string arguments - they'll be
          // stringified when exposed to the description's .content() function.
          if (value instanceof Tag || value instanceof Template)
            return true;

          if (typeof value !== 'string')
            throw new TypeError(`Slot expects string, got ${typeof value}`);

          return true;
        }

        default: {
          if (typeof value !== description.type)
            throw new TypeError(`Slot expects ${description.type}, got ${typeof value}`);

          return true;
        }
      }
    }

    return true;
  }

  getSlotValue(slotName) {
    const description = this.#getSlotDescriptionOrError(slotName);
    const providedValue = this.#slotValues[slotName] ?? null;

    if (description.type === 'html') {
      if (!providedValue) {
        return blank();
      }

      if (
        (providedValue instanceof Tag || providedValue instanceof Template) &&
        description.mutable
      ) {
        return providedValue.clone();
      }

      return providedValue;
    }

    if (description.type === 'attributes') {
      if (!providedValue) {
        return blankAttributes();
      }

      if (providedValue instanceof Attributes) {
        if (description.mutable) {
          return providedValue.clone();
        } else {
          return providedValue;
        }
      }

      return new Attributes(providedValue);
    }

    if (description.type === 'string') {
      if (providedValue instanceof Tag || providedValue instanceof Template) {
        return providedValue.toString();
      }
    }

    if (providedValue !== null) {
      return providedValue;
    }

    if ('default' in description) {
      return description.default;
    }

    return null;
  }

  getSlotDescription(slotName) {
    return this.#getSlotDescriptionOrError(slotName);
  }

  #getSlotDescriptionNoError(slotName) {
    if (this.#description.slots) {
      if (Object.hasOwn(this.#description.slots, slotName)) {
        return this.#description.slots[slotName];
      }
    }

    return null;
  }

  #getSlotDescriptionOrError(slotName) {
    const description = this.#getSlotDescriptionNoError(slotName);

    if (!description) {
      throw new TypeError(
        (this.description.annotation
          ? `Template "${this.description.annotation}" doesn't have a "${slotName}" slot`
          : `Template doesn't have a "${slotName}" slot`));
    }

    return description;
  }

  set content(_value) {
    throw new Error(`Template content can't be changed after constructed`);
  }

  get content() {
    const slots = {};

    for (const slotName of Object.keys(this.description.slots ?? {})) {
      slots[slotName] = this.getSlotValue(slotName);
    }

    try {
      return this.description.content(slots);
    } catch (caughtError) {
      throw new Error(
        `Error in content of ${inspect(this, {compact: true})}`,
        {cause: caughtError});
    }
  }

  set description(_value) {
    throw new Error(`Template description can't be changed after constructed`);
  }

  get description() {
    return this.#description;
  }

  get blank() {
    return isBlank(this.content);
  }

  toString() {
    return this.content.toString();
  }

  static resolve(tagOrTemplate) {
    // Flattens contents of a template, recursively "resolving" until a
    // non-template is ready (or just returns a provided non-template
    // argument as-is).

    if (!(tagOrTemplate instanceof Template)) {
      return tagOrTemplate;
    }

    let {content} = tagOrTemplate;

    while (content instanceof Template) {
      content = content.content;
    }

    return content;
  }

  [inspect.custom]() {
    const {annotation} = this.description;

    return (
      (annotation
        ? `Template ${colors.bright(colors.blue(`"${annotation}"`))}`
        : `Template ${colors.dim(`(no annotation)`)}`));
  }
}

export function stationery(description) {
  return new Stationery(description);
}

export class Stationery {
  #templateDescription = null;

  static validated = Symbol('Stationery.validated');

  constructor(templateDescription) {
    Template.validateDescription(templateDescription);
    templateDescription[Stationery.validated] = true;
    this.#templateDescription = templateDescription;
  }

  template() {
    return new Template(this.#templateDescription);
  }

  [inspect.custom]() {
    const {annotation} = this.description;

    return (
      (annotation
        ? `Stationery ${colors.bright(colors.blue(`"${annotation}"`))}`
        : `Stationery ${colors.dim(`(no annotation)`)}`));
  }
}

export const isTag =
  validateInstanceOf(Tag);

export const isTemplate =
  validateInstanceOf(Template);

export const isArrayOfHTML =
  validateArrayItems(value => isHTML(value));

export const isHTML =
  anyOf(
    is(null, undefined, false),
    isString,
    isTag,
    isTemplate,

    value => {
      isArray(value);
      return value.length === 0;
    },

    isArrayOfHTML);

export const isAttributeKey =
  anyOf(isString, isSymbol);

export const isAttributeValue =
  anyOf(
    isString, isNumber, isBoolean, isArray,
    isTag, isTemplate,
    validateArrayItems(item => isAttributeValue(item)));

export const isAttributesAdditionPair = pair => {
  isArray(pair);

  if (pair.length !== 2) {
    throw new TypeError(`Expected attributes pair to have two items`);
  }

  withAggregate({message: `Error validating attributes pair`}, ({push}) => {
    try {
      isAttributeKey(pair[0]);
    } catch (caughtError) {
      push(new Error(`Error validating key`, {cause: caughtError}));
    }

    try {
      isAttributeValue(pair[1]);
    } catch (caughtError) {
      push(new Error(`Error validating value`, {cause: caughtError}));
    }
  });

  return true;
};

export const isAttributesAdditionSinglet =
  anyOf(
    validateInstanceOf(Template),
    validateInstanceOf(Attributes),
    validateAllPropertyValues(isAttributeValue),
    looseArrayOf(value => isAttributesAdditionSinglet(value)));
