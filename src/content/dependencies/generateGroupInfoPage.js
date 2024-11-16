export default {
  contentDependencies: [
    'generateColorStyleAttribute',
    'generateGroupInfoPageAlbumsSection',
    'generateGroupNavLinks',
    'generateGroupSecondaryNav',
    'generateGroupSidebar',
    'generatePageLayout',
    'linkArtist',
    'linkExternal',
    'transformContent',
  ],

  extraDependencies: ['html', 'language', 'wikiData'],

  sprawl: ({wikiInfo}) => ({
    enableGroupUI:
      wikiInfo.enableGroupUI,

    wikiColor:
      wikiInfo.color,
  }),

  relations: (relation, sprawl, group) => ({
    layout:
      relation('generatePageLayout'),

    navLinks:
      relation('generateGroupNavLinks', group),

    secondaryNav:
      (sprawl.enableGroupUI
        ? relation('generateGroupSecondaryNav', group)
        : null),

    sidebar:
      (sprawl.enableGroupUI
        ? relation('generateGroupSidebar', group)
        : null),

    wikiColorAttribute:
      relation('generateColorStyleAttribute', sprawl.wikiColor),

    closeArtistLinks:
      group.closelyLinkedArtists
        .map(artist => relation('linkArtist', artist)),

    visitLinks:
      group.urls
        .map(url => relation('linkExternal', url)),

    description:
      relation('transformContent', group.description),

    albumSection:
      relation('generateGroupInfoPageAlbumsSection', group),
  }),

  data: (_sprawl, group) => ({
    name:
      group.name,

    color:
      group.color,
  }),

  generate: (data, relations, {html, language}) =>
    language.encapsulate('groupInfoPage', pageCapsule =>
      relations.layout.slots({
        title: language.$(pageCapsule, 'title', {group: data.name}),
        headingMode: 'sticky',
        color: data.color,

        mainContent: [
          html.tag('p',
            {[html.onlyIfContent]: true},

            language.encapsulate(pageCapsule, 'closelyLinkedArtists', capsule => {
              let option;
              [capsule, option] =
                (relations.closeArtistLinks.length === 0
                  ? [null, null]
               : relations.closeArtistLinks.length === 1
                  ? [language.encapsulate(capsule, 'one'), 'artist']
                  : [language.encapsulate(capsule, 'multiple'), 'artists']);

              if (!capsule) return html.blank();

              return language.$(capsule, {
                [option]:
                  language.formatUnitList(
                    relations.closeArtistLinks
                      .map(link => link.slots({
                        attributes: [relations.wikiColorAttribute],
                      }))),
              });
            })),

          html.tag('p',
            {[html.onlyIfContent]: true},

            language.$('releaseInfo.visitOn', {
              [language.onlyIfOptions]: ['links'],

              links:
                language.formatDisjunctionList(
                  relations.visitLinks
                    .map(link => link.slot('context', 'group'))),
            })),

          html.tag('blockquote',
            {[html.onlyIfContent]: true},
            relations.description.slot('mode', 'multiline')),

          relations.albumSection,
        ],

        leftSidebar:
          (relations.sidebar
            ? relations.sidebar
                .content /* TODO: Kludge. */
            : null),

        navLinkStyle: 'hierarchical',
        navLinks: relations.navLinks.content,

        secondaryNav: relations.secondaryNav ?? null,
      })),
};
