// Regex-based forward parser for wiki content, breaking up text input into
// text and (possibly nested) tag nodes.
//
// The behavior here is quite tied into the `transformContent` content
// function, which converts nodes parsed here into actual HTML, links, etc
// for embedding in a wiki webpage.

import * as html from '#html';
import {escapeRegex, typeAppearance} from '#sugar';

// Syntax literals.
const tagBeginning = '[[';
const tagEnding = ']]';
const tagReplacerValue = ':';
const tagHash = '#';
const tagArgument = '*';
const tagArgumentValue = '=';
const tagLabel = '|';

const noPrecedingWhitespace = '(?<!\\s)';

const R_tagBeginning = escapeRegex(tagBeginning);

const R_tagEnding = escapeRegex(tagEnding);

const R_tagReplacerValue =
  noPrecedingWhitespace + escapeRegex(tagReplacerValue);

const R_tagHash = noPrecedingWhitespace + escapeRegex(tagHash);

const R_tagArgument = escapeRegex(tagArgument);

const R_tagArgumentValue = escapeRegex(tagArgumentValue);

const R_tagLabel = escapeRegex(tagLabel);

const regexpCache = {};

const makeError = (i, message) => ({i, type: 'error', data: {message}});
const endOfInput = (i, comment) =>
  makeError(i, `Unexpected end of input (${comment}).`);

// These are 8asically stored on the glo8al scope, which might seem odd
// for a recursive function, 8ut the values are only ever used immediately
// after they're set.
let stopped, stop_iParse, stop_literal;

function parseOneTextNode(input, i, stopAt) {
  return parseNodes(input, i, stopAt, true)[0];
}

function parseNodes(input, i, stopAt, textOnly) {
  let nodes = [];
  let string = '';
  let iString = 0;

  stopped = false;

  const pushTextNode = (isLast) => {
    string = input.slice(iString, i);

    // If this is the last text node 8efore stopping (at a stopAt match
    // or the end of the input), trim off whitespace at the end.
    if (isLast) {
      string = string.trimEnd();
    }

    if (string.length) {
      nodes.push({i: iString, iEnd: i, type: 'text', data: string});
      string = '';
    }
  };

  const literalsToMatch = stopAt
    ? stopAt.concat([R_tagBeginning])
    : [R_tagBeginning];

  // The 8ackslash stuff here is to only match an even (or zero) num8er
  // of sequential 'slashes. Even amounts always cancel out! Odd amounts
  // don't, which would mean the following literal is 8eing escaped and
  // should 8e counted only as part of the current string/text.
  //
  // Inspired 8y this: https://stackoverflow.com/a/41470813
  const regexpSource = `(?<!\\\\)(?:\\\\{2})*(${literalsToMatch.join('|')})`;

  // There are 8asically only a few regular expressions we'll ever use,
  // 8ut it's a pain to hard-code them all, so we dynamically gener8te
  // and cache them for reuse instead.
  let regexp;
  if (Object.hasOwn(regexpCache, regexpSource)) {
    regexp = regexpCache[regexpSource];
  } else {
    regexp = new RegExp(regexpSource);
    regexpCache[regexpSource] = regexp;
  }

  // Skip whitespace at the start of parsing. This is run every time
  // parseNodes is called (and thus parseOneTextNode too), so spaces
  // at the start of syntax elements will always 8e skipped. We don't
  // skip whitespace that shows up inside content (i.e. once we start
  // parsing below), though!
  const whitespaceOffset = input.slice(i).search(/[^\s]/);

  // If the string is all whitespace, that's just zero content, so
  // return the empty nodes array.
  if (whitespaceOffset === -1) {
    return nodes;
  }

  i += whitespaceOffset;

  while (i < input.length) {
    const match = input.slice(i).match(regexp);

    if (!match) {
      iString = i;
      i = input.length;
      pushTextNode(true);
      break;
    }

    const closestMatch = match[0];
    const closestMatchIndex = i + match.index;

    if (textOnly && closestMatch === tagBeginning)
      throw makeError(i, `Unexpected [[tag]] - expected only text here.`);

    const stopHere = closestMatch !== tagBeginning;

    iString = i;
    i = closestMatchIndex;
    pushTextNode(stopHere);

    i += closestMatch.length;

    if (stopHere) {
      stopped = true;
      stop_iParse = i;
      stop_literal = closestMatch;
      break;
    }

    if (closestMatch === tagBeginning) {
      const iTag = closestMatchIndex;

      let N;

      // Replacer key (or value)

      N = parseOneTextNode(input, i, [
        R_tagReplacerValue,
        R_tagHash,
        R_tagArgument,
        R_tagLabel,
        R_tagEnding,
      ]);

      if (!stopped) throw endOfInput(i, `reading replacer key`);

      if (!N) {
        switch (stop_literal) {
          case tagReplacerValue:
          case tagArgument:
            throw makeError(i, `Expected text (replacer key).`);
          case tagLabel:
          case tagHash:
          case tagEnding:
            throw makeError(i, `Expected text (replacer key/value).`);
        }
      }

      const replacerFirst = N;
      i = stop_iParse;

      // Replacer value (if explicit)

      let replacerSecond;

      if (stop_literal === tagReplacerValue) {
        N = parseNodes(input, i, [
          R_tagHash,
          R_tagArgument,
          R_tagLabel,
          R_tagEnding,
        ]);

        if (!stopped) throw endOfInput(i, `reading replacer value`);
        if (!N.length) throw makeError(i, `Expected content (replacer value).`);

        replacerSecond = N;
        i = stop_iParse;
      }

      // Assign first & second to replacer key/value

      let replacerKey, replacerValue;

      // Value is an array of nodes, 8ut key is just one (or null).
      // So if we use replacerFirst as the value, we need to stick
      // it in an array (on its own).
      if (replacerSecond) {
        replacerKey = replacerFirst;
        replacerValue = replacerSecond;
      } else {
        replacerKey = null;
        replacerValue = [replacerFirst];
      }

      // Hash

      let hash;

      if (stop_literal === tagHash) {
        N = parseOneTextNode(input, i, [R_tagArgument, R_tagLabel, R_tagEnding]);

        if (!stopped) throw endOfInput(i, `reading hash`);
        if (!N) throw makeError(i, `Expected text (hash).`);

        hash = N;
        i = stop_iParse;
      }

      // Arguments

      const args = [];

      while (stop_literal === tagArgument) {
        N = parseOneTextNode(input, i, [
          R_tagArgumentValue,
          R_tagArgument,
          R_tagLabel,
          R_tagEnding,
        ]);

        if (!stopped) throw endOfInput(i, `reading argument key`);

        if (stop_literal !== tagArgumentValue)
          throw makeError(
            i,
            `Expected ${tagArgumentValue.literal} (tag argument).`
          );

        if (!N) throw makeError(i, `Expected text (argument key).`);

        const key = N;
        i = stop_iParse;

        N = parseNodes(input, i, [R_tagArgument, R_tagLabel, R_tagEnding]);

        if (!stopped) throw endOfInput(i, `reading argument value`);
        if (!N.length) throw makeError(i, `Expected content (argument value).`);

        const value = N;
        i = stop_iParse;

        args.push({key, value});
      }

      let label;

      if (stop_literal === tagLabel) {
        N = parseOneTextNode(input, i, [R_tagEnding]);

        if (!stopped) throw endOfInput(i, `reading label`);
        if (!N) throw makeError(i, `Expected text (label).`);

        label = N;
        i = stop_iParse;
      }

      nodes.push({
        i: iTag,
        iEnd: i,
        type: 'tag',
        data: {replacerKey, replacerValue, hash, args, label},
      });

      continue;
    }
  }

  return nodes;
}

export function postprocessImages(inputNodes) {
  const outputNodes = [];

  let atStartOfLine = true;

  const lastNode = inputNodes.at(-1);

  for (const node of inputNodes) {
    if (node.type === 'tag') {
      atStartOfLine = false;
    }

    if (node.type === 'text') {
      const imageRegexp = /<img (.*?)>/g;

      let match = null, parseFrom = 0;
      while (match = imageRegexp.exec(node.data)) {
        const previousText = node.data.slice(parseFrom, match.index);
        outputNodes.push({type: 'text', data: previousText});
        parseFrom = match.index + match[0].length;

        const imageNode = {type: 'image'};
        const attributes = html.parseAttributes(match[1]);

        imageNode.src = attributes.get('src');

        if (previousText.endsWith('\n')) {
          atStartOfLine = true;
        }

        imageNode.inline = (() => {
          // Images can force themselves to be rendered inline using a custom
          // attribute - this style just works better for certain embeds,
          // usually jokes or small images.
          if (attributes.get('inline')) return true;

          // If we've already determined we're in the middle of a line,
          // we're inline. (Of course!)
          if (!atStartOfLine) {
            return true;
          }

          // If there's more text to go in this text node, and what's
          // remaining doesn't start with a line break, we're inline.
          if (
            parseFrom !== node.data.length &&
            node.data[parseFrom] !== '\n'
          ) {
            return true;
          }

          // If we're at the end of this text node, but this text node
          // isn't the last node overall, we're inline.
          if (
            parseFrom === node.data.length &&
            node !== lastNode
          ) {
            return true;
          }

          // If no other condition matches, this image is on its own line.
          return false;
        })();

        if (attributes.get('link')) imageNode.link = attributes.get('link');
        if (attributes.get('width')) imageNode.width = parseInt(attributes.get('width'));
        if (attributes.get('height')) imageNode.height = parseInt(attributes.get('height'));
        if (attributes.get('pixelate')) imageNode.pixelate = true;

        outputNodes.push(imageNode);

        // No longer at the start of a line after an image - there will at
        // least be a text node with only '\n' before the next image that's
        // on its own line.
        atStartOfLine = false;
      }

      if (parseFrom !== node.data.length) {
        outputNodes.push({
          type: 'text',
          data: node.data.slice(parseFrom),
        });
      }

      continue;
    }

    outputNodes.push(node);
  }

  return outputNodes;
}

export function postprocessHeadings(inputNodes) {
  const outputNodes = [];

  for (const node of inputNodes) {
    if (node.type !== 'text') {
      outputNodes.push(node);
      continue;
    }

    const headingRegexp = /<h2 (.*?)>/g;

    let textContent = '';

    let match = null, parseFrom = 0;
    while (match = headingRegexp.exec(node.data)) {
      textContent += node.data.slice(parseFrom, match.index);
      parseFrom = match.index + match[0].length;

      const attributes = html.parseAttributes(match[1]);
      attributes.push('class', 'content-heading');

      // We're only modifying the opening tag here. The remaining content,
      // including the closing tag, will be pushed as-is.
      textContent += `<h2 ${attributes}>`;
    }

    if (parseFrom !== node.data.length) {
      textContent += node.data.slice(parseFrom);
    }

    outputNodes.push({type: 'text', data: textContent});
  }

  return outputNodes;
}

export function parseInput(input) {
  if (typeof input !== 'string') {
    throw new TypeError(`Expected input to be string, got ${typeAppearance(input)}`);
  }

  try {
    let output = parseNodes(input, 0);
    output = postprocessImages(output);
    output = postprocessHeadings(output);
    return output;
  } catch (errorNode) {
    if (errorNode.type !== 'error') {
      throw errorNode;
    }

    const {
      i,
      data: {message},
    } = errorNode;

    let lineStart = input.slice(0, i).lastIndexOf('\n');
    if (lineStart >= 0) {
      lineStart += 1;
    } else {
      lineStart = 0;
    }

    let lineEnd = input.slice(i).indexOf('\n');
    if (lineEnd >= 0) {
      lineEnd += i;
    } else {
      lineEnd = input.length;
    }

    const line = input.slice(lineStart, lineEnd);

    const cursor = i - lineStart;

    throw new SyntaxError([
      `Parse error (at pos ${i}): ${message}`,
      line,
      '-'.repeat(cursor) + '^',
    ].join('\n'));
  }
}
