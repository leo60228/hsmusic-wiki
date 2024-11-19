import {stitchArrays} from '#sugar';

export default {
  contentDependencies: ['linkArtTag'],
  extraDependencies: ['html'],

  query: (artTags) => ({
    linkableArtTags:
      artTags
        .filter(tag => !tag.isContentWarning),
  }),

  relations: (relation, query, _artTags) => ({
    tagLinks:
      query.linkableArtTags
        .map(tag => relation('linkArtTag', tag)),
  }),

  data: (query, _artTags) => {
    const seenShortNames = new Set();
    const duplicateShortNames = new Set();

    for (const {nameShort: shortName} of query.linkableArtTags) {
      if (seenShortNames.has(shortName)) {
        duplicateShortNames.add(shortName);
      } else {
        seenShortNames.add(shortName);
      }
    }

    const preferShortName =
      query.linkableArtTags
        .map(artTag => !duplicateShortNames.has(artTag.nameShort));

    return {preferShortName};
  },

  generate: (data, relations, {html}) =>
    html.tag('ul', {class: 'image-details'},
      {[html.onlyIfContent]: true},

      {class: 'art-tag-details'},

      stitchArrays({
        tagLink: relations.tagLinks,
        preferShortName: data.preferShortName,
      }).map(({tagLink, preferShortName}) =>
          html.tag('li',
            tagLink.slot('preferShortName', preferShortName)))),
};
