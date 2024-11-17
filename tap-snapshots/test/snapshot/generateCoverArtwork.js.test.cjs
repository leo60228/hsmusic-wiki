/* IMPORTANT
 * This snapshot file is auto-generated, but designed for humans.
 * It should be checked into source control and tracked carefully.
 * Re-generate by setting TAP_SNAPSHOT=1 and running tests.
 * Make sure to inspect the output below.  Do not ignore changes!
 */
'use strict'
exports[`test/snapshot/generateCoverArtwork.js > TAP > generateCoverArtwork (snapshot) > mode: commentary 1`] = `
[mocked: image
 args: [
   [
     { name: 'Damara', directory: 'damara', isContentWarning: false },
     { name: 'Cronus', directory: 'cronus', isContentWarning: false },
     { name: 'Bees', directory: 'bees', isContentWarning: false },
     { name: 'creepy crawlies', isContentWarning: true }
   ]
 ]
 slots: { path: [ 'media.albumCover', 'bee-forus-seatbelt-safebee', 'png' ], thumb: 'medium', reveal: true, link: true, lazy: true, square: true, attributes: { class: 'commentary-art' } }]
`

exports[`test/snapshot/generateCoverArtwork.js > TAP > generateCoverArtwork (snapshot) > mode: primary-artists 1`] = `
[mocked: image
 args: [
   [
     { name: 'Damara', directory: 'damara', isContentWarning: false },
     { name: 'Cronus', directory: 'cronus', isContentWarning: false },
     { name: 'Bees', directory: 'bees', isContentWarning: false },
     { name: 'creepy crawlies', isContentWarning: true }
   ]
 ]
 slots: { path: [ 'media.albumCover', 'bee-forus-seatbelt-safebee', 'png' ], thumb: 'medium', reveal: true, link: true, square: true }]
<p class="image-details illustrator-details">
    Artwork by [mocked: linkArtistGallery
     args: [ { name: 'Circlejourney', directory: 'circlejourney' } ]
     slots: {}] and [mocked: linkArtistGallery
     args: [ { name: 'magnoliajades', directory: 'magnoliajades' } ]
     slots: {}]
</p>
`

exports[`test/snapshot/generateCoverArtwork.js > TAP > generateCoverArtwork (snapshot) > mode: primary-tags 1`] = `
[mocked: image
 args: [
   [
     { name: 'Damara', directory: 'damara', isContentWarning: false },
     { name: 'Cronus', directory: 'cronus', isContentWarning: false },
     { name: 'Bees', directory: 'bees', isContentWarning: false },
     { name: 'creepy crawlies', isContentWarning: true }
   ]
 ]
 slots: { path: [ 'media.albumCover', 'bee-forus-seatbelt-safebee', 'png' ], thumb: 'medium', reveal: true, link: true, square: true }]
<ul class="image-details art-tag-details">
    <li><a href="tag/damara/">Damara</a></li>
    <li><a href="tag/cronus/">Cronus</a></li>
    <li><a href="tag/bees/">Bees</a></li>
</ul>
`

exports[`test/snapshot/generateCoverArtwork.js > TAP > generateCoverArtwork (snapshot) > mode: thumbnail 1`] = `
[mocked: image
 args: [
   [
     { name: 'Damara', directory: 'damara', isContentWarning: false },
     { name: 'Cronus', directory: 'cronus', isContentWarning: false },
     { name: 'Bees', directory: 'bees', isContentWarning: false },
     { name: 'creepy crawlies', isContentWarning: true }
   ]
 ]
 slots: { path: [ 'media.albumCover', 'bee-forus-seatbelt-safebee', 'png' ], thumb: 'small', reveal: false, link: false, square: true }]
`
