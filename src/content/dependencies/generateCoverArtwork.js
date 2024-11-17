import {stitchArrays} from '#sugar';

export default {
  contentDependencies: ['image', 'linkArtTag', 'linkArtistGallery'],
  extraDependencies: ['html', 'language'],

  query: (artTags, _coverArtistContribs) => ({
    linkableArtTags:
      (artTags
        ? artTags.filter(tag => !tag.isContentWarning)
        : []),
  }),

  relations: (relation, query, artTags, coverArtistContribs) => ({
    image:
      relation('image', artTags),

    tagLinks:
      query.linkableArtTags
        .map(tag => relation('linkArtTag', tag)),

    artistLinks:
      coverArtistContribs
        .map(contrib => contrib.artist)
        .map(artist =>
          relation('linkArtistGallery', artist)),
  }),

  data: (query, _artTags, _coverArtistContribs) => {
    const data = {};

    const seenShortNames = new Set();
    const duplicateShortNames = new Set();

    for (const {nameShort: shortName} of query.linkableArtTags) {
      if (seenShortNames.has(shortName)) {
        duplicateShortNames.add(shortName);
      } else {
        seenShortNames.add(shortName);
      }
    }

    data.preferShortName =
      query.linkableArtTags
        .map(artTag => !duplicateShortNames.has(artTag.nameShort));

    return data;
  },

  slots: {
    path: {
      validate: v => v.validateArrayItems(v.isString),
    },

    alt: {
      type: 'string',
    },

    color: {
      validate: v => v.isColor,
    },

    mode: {
      validate: v =>
        v.is(...[
          'primary-tags',
          'primary-artists',
          'thumbnail',
          'commentary',
        ]),

      default: 'primary-tags',
    },

    dimensions: {
      validate: v => v.isDimensions,
    },
  },

  generate(data, relations, slots, {html, language}) {
    const square =
      (slots.dimensions
        ? slots.dimensions[0] === slots.dimensions[1]
        : true);

    const sizeSlots =
      (square
        ? {square: true}
        : {dimensions: slots.dimensions});

    switch (slots.mode) {
      case 'primary-tags':
        return html.tags([
          relations.image.slots({
            path: slots.path,
            alt: slots.alt,
            color: slots.color,
            thumb: 'medium',
            reveal: true,
            link: true,
            ...sizeSlots,
          }),

          html.tag('ul', {class: 'image-details'},
            {[html.onlyIfContent]: true},

            {class: 'art-tag-details'},

            stitchArrays({
              tagLink: relations.tagLinks,
              preferShortName: data.preferShortName,
            }).map(({tagLink, preferShortName}) =>
                html.tag('li',
                  tagLink.slot('preferShortName', preferShortName)))),
        ]);

      case 'primary-artists':
        return html.tags([
          relations.image.slots({
            path: slots.path,
            alt: slots.alt,
            color: slots.color,
            thumb: 'medium',
            reveal: true,
            link: true,
            ...sizeSlots,
          }),

          html.tag('p', {class: 'image-details'},
            {[html.onlyIfContent]: true},

            {class: 'illustrator-details'},

            language.$('misc.coverGrid.details.coverArtists', {
              artists:
                language.formatConjunctionList(relations.artistLinks),
            })),
        ]);

      case 'thumbnail':
        return relations.image.slots({
          path: slots.path,
          alt: slots.alt,
          color: slots.color,
          thumb: 'small',
          reveal: false,
          link: false,
          ...sizeSlots,
        });

      case 'commentary':
        return relations.image.slots({
          path: slots.path,
          alt: slots.alt,
          color: slots.color,
          thumb: 'medium',
          reveal: true,
          link: true,
          lazy: true,
          ...sizeSlots,

          attributes:
            {class: 'commentary-art'},
        });

      default:
        return html.blank();
    }
  },
};
