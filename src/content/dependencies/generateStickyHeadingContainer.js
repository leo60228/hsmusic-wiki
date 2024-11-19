export default {
  extraDependencies: ['html'],

  slots: {
    title: {
      type: 'html',
      mutable: false,
    },

    cover: {
      type: 'html',
      mutable: true,
    },
  },

  generate: (slots, {html}) =>
    html.tag('div', {class: 'content-sticky-heading-container'},
      !html.isBlank(slots.cover) &&
        {class: 'has-cover'},

      [
        html.tag('div', {class: 'content-sticky-heading-row'}, [
          html.tag('h1', slots.title),

          html.tag('div', {class: 'content-sticky-heading-cover-container'},
            {[html.onlyIfContent]: true},

            html.tag('div', {class: 'content-sticky-heading-cover'},
              {[html.onlyIfContent]: true},

              (() => {
                if (html.isBlank(slots.cover)) {
                  return html.blank();
                }

                // Try very hard to set the cover's 'mode' slot to 'thumbnail'
                // and its 'details' slot to html.blank().
                let setMode = false;
                let setDetails = false;
                let cover = slots.cover;
                while (true) {
                  if (!cover) {
                    return html.blank();
                  }

                  if (!(cover instanceof html.Template)) {
                    return cover;
                  }

                  // The cover from `slots` is already cloned (since it's
                  // mutable), but later ones are not, and for extremely scary
                  // content function infrastructure reasons, it is possible
                  // for the identity of the content of the clone-template
                  // to be the same as the cloned template.
                  if (cover !== slots.cover) {
                    cover = cover.clone();
                  }

                  if (!setMode) {
                    try {
                      cover.setSlot('mode', 'thumbnail');
                      setMode = true;
                    } catch {
                      // No mode slot, or it doesn't allow 'thumbnail'.
                    }
                  }

                  if (!setDetails) {
                    try {
                      cover.setSlot('details', html.blank());
                      setDetails = true;
                    } catch {
                      // No details slot, or it doesn't allow html.blank().
                      // We're setting a blank instead of null because null is
                      // always allowed, and can carry a different semantic
                      // meaning, like "put something else here by default
                      // instead please".
                    }
                  }

                  if (setMode && setDetails) {
                    return cover;
                  }

                  cover = cover.content;
                }
              })())),
        ]),

        html.tag('div', {class: 'content-sticky-subheading-row'},
          html.tag('h2', {class: 'content-sticky-subheading'})),
      ]),
};
