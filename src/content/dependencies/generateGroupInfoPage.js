export default {
  contentDependencies: [
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

            language.encapsulate(pageCapsule, 'closelyLinkedArtists', capsule =>
              (relations.closeArtistLinks.length === 0
                ? html.blank()
             : relations.closeArtistLinks.length === 1
                ? language.$(capsule, 'one', {
                    artist: relations.closeArtistLinks,
                  })
                : language.$(capsule, 'multiple', {
                    artists:
                      language.formatUnitList(relations.closeArtistLinks),
                  })))),

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
