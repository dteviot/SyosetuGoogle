/*
    Functions for handling language
*/

"use strict";

class Language {
    constructor() {
    }
    
    static isJapaneseQuoted(s) {
        return s.includes("「");
    }

    static stripJapaneseQuotes(s) {
        return s.replace(/「|」/g, "");
    }

    static isHiragana(c) {
        let code = c.charCodeAt(0);
        return (0x303f < code) && (code <= 0x309f);
    }

    static isKatakana(c) {
        let code = c.charCodeAt(0);
        return (0x309f < code) && (code <= 0x30ff);
    }

    static hasSuttering(s) {
        // Stuttering doesn't only occur in spoken text
        let temp = Language.stripJapaneseQuotes(s).trim();
        for(let i = 0; i < s.length - 2; ++i) {
            if (Language.isPosibleStutter(temp.substring(i, i + 3))) {
                return true;
            }
        }
        return false;
    }

    static isPosibleStutter(s) {
        // stuttering looks like "<char>、<char>"
        return (s[1] === '、') 
            && (s[0] === s[2])
            && (Language.isHiragana(s[0]) || Language.isKatakana(s[0]));
    }

    static notesForMyTranslation(originalJapanese) {
        let notes = "";
        if (Language.hasSuttering(originalJapanese)) {
            notes += "(possible stuttering) "
        }
        if (Language.isJapaneseQuoted(originalJapanese)) {
            notes += "「」";
        }
        return notes;
    }
}

