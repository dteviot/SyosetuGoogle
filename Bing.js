/*
    Functions to work with Bing Translate are here
*/

"use strict";

class Bing {
    constructor() {
        Bing.textsToTranslate = new Map();
    }

    static onMessageListener(message) {  // eslint-disable-line no-unused-vars
        if (message.translated === null) {
            Bing.buildListOfLinesToSend();
        } else {
            Bing.addTranslation(message);
        }
        Bing.sendLineToTranslate();
    };

    static buildListOfLinesToSend() {
        let rows = [...document.querySelectorAll("tr.Bing")]
           .map(Bing.buildEntryToTranslate)
           .filter(Bing.isWorthTranslating);
        Bing.linesToTranslate = rows.reverse();
    }

    static buildEntryToTranslate(element) {
        let textID = element.getAttribute("orig");
        let toTranslate = document.getElementById(textID).querySelector("td:nth-of-type(2)").textContent;
        let destination = element.querySelector("td:nth-of-type(2)")
        return {
            textID: textID,
            toTranslate: toTranslate,
            destination: destination
        }
    }

    static isWorthTranslating(entry) {
        let text = entry.toTranslate.trim();
        return text !== "..." 
            && (entry.destination.textContent === "");
    }

    static addTranslation(message) {
        // dummy
        let entry = Bing.linesToTranslate[Bing.linesToTranslate.length - 1];
        if (entry.textID !== message.textID) {
            console.log(entry);
            console.log(message);
            alert("Reply doesn't match expected ID");
            return;
        }
        entry.destination.textContent = message.translated;
        Bing.linesToTranslate.pop();
    }

    static injectScript(tabId) {
        Bing.tabId = tabId;
        chrome.tabs.executeScript(tabId, { file: "BingContentScript.js", runAt: "document_end" },
            function (result) {   // eslint-disable-line no-unused-vars
                if (chrome.runtime.lastError) {
                    util.log(chrome.runtime.lastError.message);
                };
            }
        );
    }

    static findTabWithBing() {
        return new Promise(function (resolve, reject) {
            chrome.tabs.query({ url: "https://www.bing.com/translator" }, function (tabs) {
                if ((tabs != null) && (0 < tabs.length)) {
                    resolve(tabs[0].id);
                } else {
                    reject("No Bing Tab found");
                };
            });
        });
    }

    static doTranslation() {
        Bing.findTabWithBing().then(
            tabId => Bing.injectScript(tabId)
        ).catch(
            e => alert(e)
        );
    }

    static sendLineToTranslate() {
        if (0 < Bing.linesToTranslate.length) {
            let entry = Bing.linesToTranslate[Bing.linesToTranslate.length - 1];
            let message = {
                messageType: "SyosetuGoogle-TextToTranslate",
                toTranslate: entry.toTranslate,
                textID: entry.textID
            };
            return Bing.sleep(20000)
                .then(() => chrome.tabs.sendMessage(Bing.tabId, message));
        } else {
            alert("finished");
        }
    }

    static sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

