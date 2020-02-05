/*
  Javascript that is injected into bing translator
  gets text to translate and returns translation
*/
var main = (function () {
    "use strict";

    // this will be called when message listener fires
    function onMessageListener(message, sender, sendResponse) {  // eslint-disable-line no-unused-vars
        if (message.messageType == "SyosetuGoogle-TextToTranslate") {
            translateText(message);
        }
    };

    function addMessageListener() {
        try {
            // note, this will throw if not running as an extension.
            if (!chrome.runtime.onMessage.hasListener(onMessageListener)) {
                chrome.runtime.onMessage.addListener(onMessageListener);
            }
        } catch (chromeError) {
            alert(chromeError);
        }
    }

    function setTranslationOptions() {
        setBingLanguage("select#tta_srcsl", "ja");
        setBingLanguage("select#tta_tgtsl", "en");
    }

    function setBingLanguage(selector, value){
        let select = document.querySelector(selector);
        let options = [...select.getElementsByTagName("option")];
        for(let i = 0; i < options.length; ++i){
            if(options[i].value === value){
                select.selectedIndex = i;
                return;
            }
        }
    }

    function translateText(message) {
        let oldText = fetchTranslatedTextFromBing();
        insertTextTotranslateIntoBing(message.toTranslate);
        waitForTranslation(oldText, message);
    }

    function waitForTranslation(oldText, message) {
        return sleep(1000).then(function () {
            let newText = fetchTranslatedTextFromBing();
            if ((newText !== oldText) && (newText !== " ...")
                && (newText !== (oldText + " ..."))) {
                clearTranslatedTextFromBing();
                return returnTranslatedText(newText, message.textID);
            } else {
                return waitForTranslation(oldText, message);
            }
        });
    }

    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    function insertTextTotranslateIntoBing(toTranslate) {
        let textArea = window.document.querySelector("textarea#tta_input_ta");
        textArea.value = "";
        textArea.focus();
        document.execCommand("insertText", false /*no UI*/, toTranslate);
    }

    function getTranslatedTextArea() {
        return window.document.querySelector("textarea#tta_output_ta");
    }

    function fetchTranslatedTextFromBing() {
        return getTranslatedTextArea().value;
    }

    function clearTranslatedTextFromBing() {
        getTranslatedTextArea().value = "";
    }

    function doPrep() {
        addMessageListener();
        setTranslationOptions();
    }

    function returnTranslatedText(translated, textID) {
        let message = {
            messageType: "SyosetuGoogle-TranslatedText",
            translated: translated,
            textID: textID
        };
        chrome.runtime.sendMessage(message);
    }

    doPrep();
    returnTranslatedText(null, null); // sentinal to start process
})();
