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
        let rows = [...document.querySelectorAll("p[source='syosetu']")]
           .filter(Bing.isWorthTranslating)
           .map(Bing.buildTranslateRequest);
        Bing.linesToTranslate = rows.reverse();
        return Bing.linesToTranslate;
    }

    static buildTranslateRequest(element) {
        return {
            textID: element.id,
            toTranslate: Bing.textToTranslate(element),
        }
    }

    static textToTranslate(element) {
        // strip leading "(syosetu)"
        return element.textContent.trim().substring(9).trim();
    }

    static isWorthTranslating(entry) {
        let text = Bing.textToTranslate(entry);
        return text !== "..." 
            && !Bing.isBingTranslated(entry)
    }

    static isBingTranslated(entry) {
       let destination = document.querySelector(`p[orig='${entry.id}'][source='bing']`);
       return destination !== null;
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

        let insertAfter = document.querySelector(`p[orig='${entry.textID}']`);

        let destination = document.createElement("p");
        destination.setAttribute("source", "bing");
        destination.setAttribute("orig", entry.textID);
        destination.setAttribute("lang", "en");
        Util.labelElementWithSource(destination, "bing");
        destination.appendChild(document.createTextNode(message.translated));

        insertAfter.parentElement.insertBefore(destination, insertAfter.nextSibling);
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

    static createBingTab() {
        return new Promise(function (resolve, reject) {
            chrome.tabs.create({ url: "https://www.bing.com/translator", active: false },
                function (tab) {
                    resolve(tab.id);
                }
            );
        });
    }

    static closeBingTab(tabId) {
        return new Promise(function (resolve, reject) {
            chrome.tabs.remove(tabId, () => resolve());
        });
    }

    static doTranslation() {
        Bing.createBingTab().then(
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
            Bing.closeBingTab(Bing.tabId).then(
                () => alert("finished")
            );
        }
    }

    static sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

