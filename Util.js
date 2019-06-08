/*
    General dumping ground for misc functions that I can't find a better place for.
    Warning: Don't look at this too closely, or you may loose your sanity.
    Side Note: Putting these all in one place may not have been a good idea. 
    I think they're breeding. There seem to be more functions in here that I didn't create.
*/

"use strict";

class Util {
    constructor() {
    }
    
    static isNullOrEmpty(s) {
        return ((s == null) || Util.isStringWhiteSpace(s));
    }

    static isStringWhiteSpace(s) {
        return !(/\S/.test(s));
    }
}

