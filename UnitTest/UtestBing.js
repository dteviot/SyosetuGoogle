
"use strict";

module("bing");

test("buildListOfLinesToSend", function (assert) {
    let dom = new DOMParser().parseFromString(BingDuplicateSample, "text/html");
    let actual = Bing.buildListOfLinesToSend(dom);
    assert.equal(actual.length, 2);
    assert.deepEqual(actual[1].duplicates, [ "L3" ]);
    assert.equal(actual[0].duplicates.length, 0);
});

test("addTranslation", function (assert) {
    let dom = new DOMParser().parseFromString(BingDuplicateSample, "text/html");
    let actual = Bing.buildListOfLinesToSend(dom);
    Bing.addTranslation(dom, {
        textID: actual[1].textID,
        translated: "test"
    });
    let inserted = [...dom.querySelectorAll(`p[source='bing']`)];
    assert.equal(inserted.length, 2);
    assert.equal(inserted[0].getAttribute("orig"), "L1");
    assert.equal(inserted[1].getAttribute("orig"), "L3");
});


let BingDuplicateSample =
`<body>
<p id="L1" source="syosetu" lang="jp">
<span class="source">(syosetu)</span>　僕とミリ。
</p>
<p source="google" lang="en" orig="L1">
<span class="source">(google)</span>　Me and Milly.
</p>
<p id="L2" source="syosetu" lang="jp">
<span class="source">(syosetu)</span>　今は和室。
</p>
<p source="google" lang="en" orig="L2">
<span class="source">(google)</span>　Now.
</p>
<p id="L3" source="syosetu" lang="jp">
<span class="source">(syosetu)</span>　僕とミリ。
</p>
<p source="google" lang="en" orig="L3">
<span class="source">(google)</span>　Me and Milly.
</p>
</body>`;
