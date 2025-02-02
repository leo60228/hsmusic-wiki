/* IMPORTANT
 * This snapshot file is auto-generated, but designed for humans.
 * It should be checked into source control and tracked carefully.
 * Re-generate by setting TAP_SNAPSHOT=1 and running tests.
 * Make sure to inspect the output below.  Do not ignore changes!
 */
'use strict'
exports[`test/snapshot/linkThing.js > TAP > linkThing (snapshot) > basic behavior 1`] = `
<a style="--primary-color: #abcdef" href="track/foo/">Cool track!</a>
`

exports[`test/snapshot/linkThing.js > TAP > linkThing (snapshot) > color 1`] = `
<a href="track/showtime-piano-refrain/">Showtime (Piano Refrain)</a>
<a style="--primary-color: #38f43d" href="track/showtime-piano-refrain/">Showtime (Piano Refrain)</a>
<a style="--primary-color: #aaccff" href="track/showtime-piano-refrain/">Showtime (Piano Refrain)</a>
<span style="--primary-color: #aaccff" class="text-with-tooltip"><a href="track/showtime-piano-refrain/">Showtime (Piano Refrain)</a><span class="tooltip thing-name-tooltip"><span class="tooltip-content">Showtime (Piano Refrain)</span></span></span>
`

exports[`test/snapshot/linkThing.js > TAP > linkThing (snapshot) > nested links in content stripped 1`] = `
<a href="foo/"><b>Oooo! Very spooky.</b></a>
`

exports[`test/snapshot/linkThing.js > TAP > linkThing (snapshot) > preferShortName 1`] = `
<span class="text-with-tooltip"><a href="tag/five-oceanfalls/">Five</a><span class="tooltip thing-name-tooltip"><span class="tooltip-content">Five (Oceanfalls)</span></span></span>
`

exports[`test/snapshot/linkThing.js > TAP > linkThing (snapshot) > tags in name escaped 1`] = `
<a href="track/foo/">&lt;a href=&quot;SNOOPING&quot;&gt;AS USUAL&lt;/a&gt; I SEE</a>
<a href="track/bar/">&lt;b&gt;boldface&lt;/b&gt;</a>
<a href="album/exile/">&gt;Exile&lt;</a>
<a href="track/heart/">&lt;3</a>
`

exports[`test/snapshot/linkThing.js > TAP > linkThing (snapshot) > tooltip & content 1`] = `
<a href="album/beyond-canon/">Beyond Canon</a>
<a title="Beyond Canon" href="album/beyond-canon/">Beyond Canon</a>
<a title="Beyond Canon" href="album/beyond-canon/">Next</a>
<a href="album/beyond-canon/">Beyond Canon</a>
<span class="text-with-tooltip"><a href="album/beyond-canon/">BC</a><span class="tooltip thing-name-tooltip"><span class="tooltip-content">Beyond Canon</span></span></span>
<span class="text-with-tooltip"><a href="album/beyond-canon/">Next</a><span class="tooltip thing-name-tooltip"><span class="tooltip-content">Beyond Canon</span></span></span>
<a href="album/beyond-canon/">Next</a>
<span class="text-with-tooltip"><a href="album/beyond-canon/">Beyond Canon</a><span class="tooltip thing-name-tooltip"><span class="tooltip-content">Beyond Canon</span></span></span>
<span class="text-with-tooltip"><a href="album/beyond-canon/">Next</a><span class="tooltip thing-name-tooltip"><span class="tooltip-content">Beyond Canon</span></span></span>
<a href="album/beyond-canon/">Banana</a>
`
