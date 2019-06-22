/*
    Main processing handler for popup.html

*/
var main = (function () {
    "use strict";

    // this will be called when message listener fires
    function onMessageListener(message, sender, sendResponse) {  // eslint-disable-line no-unused-vars
        if (message.messageType == "SyosetuGoogle-ParseResults") {
            chrome.runtime.onMessage.removeListener(onMessageListener);
            // convert the string returned from content script back into a DOM
            let dom = new DOMParser().parseFromString(message.document, "text/html");
            populateUiWithDom(message.url, dom);
        }
    };

    // details 
    let initialWebPage = null;
    let initialUrl = null;
    let googleContent = null;

    // register listener that is invoked when script injected into HTML sends its results
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

    function getActiveTabDOM(tabId) {
        addMessageListener();
        chrome.tabs.executeScript(tabId, { file: "ContentScript.js", runAt: "document_end" },
            function (result) {   // eslint-disable-line no-unused-vars
                if (chrome.runtime.lastError) {
                    alert(chrome.runtime.lastError.message);
                };
            }
        );
    }

    function isRunningInTabMode() {
        // if query string supplied, we're running in Tab mode.
        let search = window.location.search;
        return !Util.isNullOrEmpty(search);
    }

    function populateUiWithDom(url, dom) {
        initialWebPage = dom;
        initialUrl = url;

        if (isSyosetuUrl(url)) {
            importTranslatedJapanese(dom);
            return;
        }

        alert("Is not Syosetu!");
        importFile(dom);
    }

    function enableControls() {
        document.getElementById("LoadOriginalJapanese").hidden = false;
        document.getElementById("SaveToFile").hidden = false;
        document.getElementById("ToGrid").hidden = false;
    }


    function importTranslatedJapanese(dom) {
        enableControls();
        googleContent = extractChapterContent(dom);

        let title = document.getElementById("title");
        title.appendChild(googleContent.title);

        let body = document.getElementById("body");
        for(let p of googleContent.paragraphs) {
            body.appendChild(p);
        }
    }

    function importFile(dom) {
        enableControls();
        let content = dom.getElementById("Translated");
        let oldContent = document.getElementById("Translated");
        oldContent.parentElement.insertBefore(content, oldContent);
        oldContent.remove();    
    }

    function isSyosetuUrl(url) {
        let parsed = new URL(url);
        return parsed.hostname === "ncode.syosetu.com";
    }

    function extractChapterContent(dom) {
        return {
            title: cloneElement(dom.querySelector("div#novel_contents .novel_subtitle")),
            paragraphs: [...dom.querySelectorAll("div#novel_honbun p")]
                .map(p => cloneElement(p))
        };
    }

    function cloneElement(element) {
        return document.importNode(element, true);
    }

    function interleaveParagraps(japaneseDom) {
        let japaneseContent = extractChapterContent(japaneseDom);
        interleaveParagraph(japaneseContent.title, googleContent.title);
        for(let jp of japaneseContent.paragraphs) {
            let english = document.getElementById(jp.id);
            if (english != null) {
                interleaveParagraph(jp, english);
            }
        }
    }

    function interleaveParagraph(japanese, english) {
        if (!Util.isNullOrEmpty(japanese.textContent)) {
            english.parentElement.insertBefore(japanese, english);
            japanese.setAttribute("lang", "jp");
            english.setAttribute("lang", "en");
        }
    }

    function openTabWindow() {
        // open new tab window, passing ID of open tab with content to convert to epub as query parameter.
        getActiveTab().then(function (tabId) {
            let url = chrome.extension.getURL("popup.html") + "?id=";
            url += tabId;
            chrome.tabs.create({ url: url });
            window.close();
        });
    }

    function getActiveTab() {
        return new Promise(function (resolve, reject) {
            chrome.tabs.query({ currentWindow: true, active: true }, function (tabs) {
                if ((tabs != null) && (0 < tabs.length)) {
                    resolve(tabs[0].id);
                } else {
                    reject();
                };
            });
        });
    }

    function extractTabIdFromQueryParameter() {
        let windowId = window.location.search.split("=")[1];
        if (!Util.isNullOrEmpty(windowId)) {
            return parseInt(windowId, 10);
        }
    }

    function loadOriginalJapanese() {
        return HttpClient.fetchOriginalJapanese(initialUrl)
           .then(japaneseDom => interleaveParagraps(japaneseDom));
    }

    function saveToFile() {
        let fileName = constructFileName();
        let content = constructHtmlToSave();
        return Download.save(content, fileName);
    }

    function constructFileName() {
        if (initialUrl.startsWith("http")) {
            return constructFileNameFromHttp();
        }
        return constructFileNameFromFile();
    }

    function constructFileNameFromFile() {
        let split = initialUrl.split("/");
        return split[split.length - 1];
    }

    function constructFileNameFromHttp() {
        let split = initialUrl.split("/")
            .filter(s => !Util.isNullOrEmpty(s));
        let chapterNum = '000' + split[split.length - 1];
        chapterNum = chapterNum.substring(chapterNum.length - 4);
        return `chapter-${chapterNum}.html`;
    }

    function constructHtmlToSave() {
        let dom = new DOMParser().parseFromString("<html><head><title></title>"+
            "<style>table {border-collapse: collapse;} table, th, td {border: 1px solid black;}</style>"+
            "</head><body></body></html>", "text/html");
        let content = document.getElementById("Translated");
        dom.body.appendChild(dom.importNode(content, true));
        flattenFontElements(dom);
        crudePrettyPrint(dom, dom.getRootNode().children[0], '', '  ');
        let htmlAsText = [dom.all[0].outerHTML];
        return new Blob(htmlAsText, {type : "text"});
    }

    function crudePrettyPrint(dom, element, indent, indentIncrement) {
        let children = [...element.children];
        for(let c of children) {
            let newIdent = indent + indentIncrement;
            indentElement(dom, c, newIdent);
            crudePrettyPrint(dom, c, newIdent, indentIncrement);
        }
    }

    function indentElement(dom, element, indent) {
        let text = '\r\n' + indent;
        let node = dom.createTextNode(text);
        element.parentElement.insertBefore(node, element);
    }

    function flattenFontElements(dom) {
        let font = [...dom.querySelectorAll("font[style='vertical-align: inherit;']")]
           .filter(f => f.querySelector("font") !== null);
        for(let f of font) {
            let pp = f.parentElement;
            let subfont = [...f.querySelectorAll("font")];
            if (1 == subfont.length) {
                let node = dom.createTextNode(subfont[0].textContent);
                pp.insertBefore(node, f);
            } else {
                for(let s of subfont) {
                    let node = dom.createElement("span");
                    node.textContent = s.textContent;
                    pp.insertBefore(node, f);
                }
            }
            f.remove();
        }
    }

    function toGrid() {
        let paragraphs = [...document.querySelectorAll("#Translated p")];
        let table = document.createElement("table");
        for(let p of paragraphs) {
            let row = createRow(p);
            table.appendChild(row);
            if (row.getAttribute("lang") == "en") {
                table.appendChild(createEmptyRow());
            }
            p.remove();
        }
        let translated = document.getElementById("Translated");
        for(let c of [...translated.children]) {
            c.remove();
        }
        translated.appendChild(table);
    }

    function createRow(paragraph) {
        let row = document.createElement("tr");
        let td = document.createElement("td");
        row.appendChild(td);
        if (paragraph.id != null) {
            row.id = paragraph.id;
        }
        let lang = paragraph.getAttribute("lang");
        if (lang != null) {
            row.setAttribute("lang", lang);
            td.textContent = (lang == "en") ? "Google" : "Original";
        }
        td = document.createElement("td");
        row.appendChild(td);
        moveChildNodes(paragraph, td);
        return row;
    }

    function moveChildNodes(from, to) {
        while (from.hasChildNodes()) {
            let node = from.childNodes[0];
            to.appendChild(node);
        };
    }

    function createEmptyRow() {
        let row = document.createElement("tr");
        let td = document.createElement("td");
        row.appendChild(td);
        td.textContent = "Mine";
        row.appendChild(document.createElement("td"));
        row.className = "Edited";
        return row;
    }

    function connectControls() {
        document.getElementById("LoadOriginalJapanese").onclick = loadOriginalJapanese;
        document.getElementById("SaveToFile").onclick = saveToFile;
        document.getElementById("ToGrid").onclick = toGrid;
    }

    // actions to do when window opened
    window.onload = function () {
        if (isRunningInTabMode()) {
            connectControls();
            getActiveTabDOM(extractTabIdFromQueryParameter());
        } else {
            openTabWindow();
        }
    }
})();

