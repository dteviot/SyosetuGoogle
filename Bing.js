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
            Bing.buildListOfLinesToSend(document);
        } else {
            Bing.addTranslation(document, message);
        }
        Bing.sendLineToTranslate();
    };

    static buildListOfLinesToSend(doc) {
        let elements = [...doc.querySelectorAll("p[source='syosetu']")]
            .filter(Bing.isWorthTranslating)
        let map = new Map()
        let rows = [];
        for(let element of elements) {
            let toTranslate = Bing.textToTranslate(element);
            let existing = map.get(toTranslate);
            if (existing) {
                existing.duplicates.push(element.id);
            } else {
                let request = Bing.buildTranslateRequest(element);
                map.set(toTranslate, request);
                rows.push(request);
            }
        }    
        Bing.linesToTranslate = rows.reverse();
        return Bing.linesToTranslate;
    }

    static buildTranslateRequest(element) {
        return {
            textID: element.id,
            toTranslate: Bing.textToTranslate(element),
            duplicates: []
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

    static addTranslation(doc, message) {
        // dummy
        let entry = Bing.linesToTranslate[Bing.linesToTranslate.length - 1];
        if (entry.textID !== message.textID) {
            console.log(entry);
            console.log(message);
            alert("Reply doesn't match expected ID");
            return;
        }

        Bing.insertTranslatedText(doc, message.textID, message.translated);
        for(let dupe of entry.duplicates) {
            Bing.insertTranslatedText(doc, dupe, message.translated);
        }

        Bing.linesToTranslate.pop();
    }

    static insertTranslatedText(doc, textID, translated) {
        let insertAfter = doc.querySelector(`p[orig='${textID}']`);

        let destination = doc.createElement("p");
        destination.setAttribute("source", "bing");
        destination.setAttribute("orig", textID);
        destination.setAttribute("lang", "en");
        Util.labelElementWithSource(destination, "bing");
        destination.appendChild(doc.createTextNode(translated));

        insertAfter.parentElement.insertBefore(destination, insertAfter.nextSibling);
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

