/**
 * niichrome 2ch browser
 *
 * @version 1.4.1
 * @author akirattii <tanaka.akira.2006@gmail.com>
 * @license The MIT License
 * @copyright (c) akirattii
 * @see https://github.com/akirattii/niichrome-2ch-browser/
 *
 * Permission is hereby granted, free of charge, to any person
 * obtaining a copy of this software and associated documentation
 * files (the "Software"), to deal in the Software without
 * restriction, including without limitation the rights to use, copy,
 * modify, merge, publish, distribute, sublicense, and/or sell copies
 * of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
 * MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS
 * BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN
 * ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
 * CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

chrome.app.runtime.onLaunched.addListener(function() {
  chrome.storage.sync.get(null, function(items) {
    var appInWindow = items["appInWindow"];
    if (appInWindow === 1 || appInWindow === undefined) {
      chrome.app.window.create('main.html', {
        'bounds': {
          'width': 400,
          'height': 500
        }
      }, function(createdWindow) {
        createdWindow.maximize();
      });
    } else {
      window.open('main.html', "_blank");
    }
  });
});


//
// -- ContextMenus

function onCMClickHandler(info) {
  console.log("info", info);
  if (info.menuItemId == "menu_searchByGoogle") {
    searchByGoogle(info.selectionText);
  } else if (info.menuItemId == "menu_searchBy2ch") {
    searchBy2ch(info.selectionText);
  } else if (info.menuItemId == "menu_addNG") {
    addNG(info.selectionText);
  } else if (info.menuItemId == "menu_filter") {
    filter(info.selectionText);
  } else if (info.menuItemId == "menu_findbar") {
    findbar(info.selectionText);
  } else if (info.menuItemId == "menu_copylink") {
    copylink(info.linkUrl);
  }
}

chrome.contextMenus.onClicked.addListener(onCMClickHandler);

chrome.runtime.onInstalled.addListener(function() {

  // contextmenu for google search
  chrome.contextMenus.create({
    "title": "「%s」をGoogle検索",
    "contexts": ["selection"], // shows on text-selected
    "id": "menu_searchByGoogle"
  });

  // contextmenu for 2ch search
  chrome.contextMenus.create({
    "title": "「%s」を2ch検索",
    "contexts": ["selection"], // shows on text-selected
    "id": "menu_searchBy2ch"
  });

  // contextmenu for filtering
  chrome.contextMenus.create({
    "title": "「%s」を抽出",
    "contexts": ["selection"], // shows on text-selected
    "id": "menu_filter"
  });

  // contextmenu for filtering
  chrome.contextMenus.create({
    "title": "「%s」をスレ内検索",
    "contexts": ["selection"], // shows on text-selected
    "id": "menu_findbar"
  });

  // separator for addNG
  chrome.contextMenus.create({
    "type": "separator",
    "contexts": ["selection"], // shows on text-selected
    "id": "menu_separator4addNG"
  });

  // contextmenu for adding as NG word
  chrome.contextMenus.create({
    "title": "「%s」をNGワード登録",
    "contexts": ["selection"], // shows on text-selected
    "id": "menu_addNG"
  });

  // contextmenu for copying url of link
  chrome.contextMenus.create({
    "title": "URLをコピー",
    "contexts": ["link"], // shows on text-selected
    "id": "menu_copylink"
  });

});

function searchByGoogle(text) {
  var p = {
    command: "searchByGoogle",
    text: text.trim()
  };
  sendMessage(p);
}

function searchBy2ch(text) {
  var p = {
    command: "searchBy2ch",
    text: text.trim()
  };
  sendMessage(p);
}

function addNG(text) {
  var p = {
    command: "addNG",
    text: text.trim()
  };
  sendMessage(p);
}

function filter(text) {
  var p = {
    command: "filter",
    text: text.trim()
  };
  sendMessage(p);
}

function findbar(text) {
  var p = {
    command: "findbar",
    text: text.trim()
  };
  sendMessage(p);
}

function copylink(text) {
  var p = {
    command: "copylink",
    text: text.trim()
  };
  sendMessage(p);
}

function sendMessage(p) {
  chrome.runtime.sendMessage(p, function(response) {
    console.log(response.status);
  });
}