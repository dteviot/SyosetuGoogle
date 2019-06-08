/*
  Makes HTML calls using Fetch API
*/
"use strict";

class HttpClient {
    constructor() {
    }

    static fetchOriginalJapanese(url) {
        return fetch(url).then(function(response) {
            return response.text();
        }).then(function(data) {
            return new DOMParser().parseFromString(data, "text/html");
        });
    }
}
