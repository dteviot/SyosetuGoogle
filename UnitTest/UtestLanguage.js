
"use strict";

module("language");

test("isJapaneseQuoted", function (assert) {
    let actual = Language.isJapaneseQuoted("「ア、アンタはお節介騎士のアリア……さん」");
    assert.ok(actual);
    actual = Language.isJapaneseQuoted("ご一緒させてください");
    assert.notOk(actual);
});

test("isHiragana", function (assert) {
    let actual = Language.isHiragana("さ");
    assert.ok(actual);
    actual = Language.isHiragana("ア");
    assert.notOk(actual);
});

test("isKatakana", function (assert) {
    let actual = Language.isKatakana("ア");
    assert.ok(actual);
    actual = Language.isKatakana("さ");
    assert.notOk(actual);
});

test("isPosibleStutter", function (assert) {
    let actual = Language.isPosibleStutter("ア、アンタはお節介騎士のアリア……さん");
    assert.ok(actual);
    actual = Language.isPosibleStutter("ご一緒させてください");
    assert.notOk(actual);
});

test("stripJapaneseQuotes", function (assert) {
    let actual = Language.stripJapaneseQuotes("「ア、アンタはお節介騎士のアリア……さん」");
    assert.equal(actual, "ア、アンタはお節介騎士のアリア……さん");
});

test("hasSuttering", function (assert) {
    let actual = Language.hasSuttering("「ア、アンタはお節介騎士のアリア……さん」");
    assert.ok(actual);
    actual = Language.hasSuttering("「ご一緒させてください」");
    assert.notOk(actual);
    actual = Language.hasSuttering("「お、おい！　クライン」");
    assert.ok(actual);
    actual = Language.hasSuttering("「クライン！　お、おい」");
    assert.ok(actual);
    actual = Language.hasSuttering("「クライン！　お、い」");
    assert.notOk(actual);
});

