/**
 * niichrome 2ch browser
 *
 * @version 1.7.1
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
$(function() {

  console.log = function() {};

  // chrome web store URL
  CWS_URL = "https://chrome.google.com/webstore/detail/niichrome-2ch%E3%83%96%E3%83%A9%E3%82%A6%E3%82%B6/iabgdknpefinjdmfacfgkpfiiglbdhnc";

  // fullscreen mode
  // chrome.app.window.current().fullscreen();
  // chrome.app.window.current().maximize();

  var request = niichrome.request();
  var util2ch = niichrome.util2ch();
  var idbutil = niichrome.idbutil("niichromedb", 1);
  var amazonutil = niichrome.amazonutil();
  var ju = JapaneseUtil();
  var gdriveutil = niichrome.gdriveutil();
  var findbar = niichrome.findbar("#findbar", "#thread", {
    toggleSpeed: 100,
    scrollMargin: 260
  });
  var updatechecker = niichrome.updatechecker();


  // appConfig's default setting
  DEFAULT_APP_CONFIG = {
    fontSize: 16, // px
    theme: 'default',
    ngWords: undefined, // NG word list {string[]}
    dividerPos: 50, // 2PaneDivider's X position (percent)
    autoImgLoad: 0, // auto-load images within res_content. 0:off 1:on
    appInWindow: 1 // start application in new window
  };

  // this app's config
  var appConfig = DEFAULT_APP_CONFIG;

  // observe appConfig
  Object.observe(appConfig, function(changes) {
    console.log("appConfig changed: ", changes);
    saveAppConfig(); // save appConfig into the storage
  });

  // load appConfig from the storage
  loadAppConfig(function() {
    console.log("loadAppConfig callback", appConfig.dividerPos);
    /* apply configs to window */
    // fontSize
    applyFontSize(appConfig.fontSize);
    // theme 
    applyTheme(appConfig.theme);
    // adjust divider range
    applyDividerPos(appConfig.dividerPos);
    // apply AutoImgLoad
    applyAutoImgLoad(appConfig.autoImgLoad);
    // apply appInWindow
    applyAppInWindow(appConfig.appInWindow);
  });

  //
  // -- set up indexedDB
  //
  idbutil.openDB([
    /* -- stores -- */
    /* 
      [readheres]
      Res number of the thread read by user.
      Props:
        url(key):
          dat's url 
        res:
          res's number      
    */
    {
      storename: 'readheres',
      keyPath: 'url',
      autoIncrement: false
    },
    /* 
      [bookmarks]
      User's bookmark.
      Props:
        url(key):
          dat's url
        title:
          thread title
        res:
          res's number
        update: 
          timestamp updated (eg. 1399419812722)
    */
    {
      storename: 'bookmarks',
      keyPath: 'url',
      autoIncrement: false,
      nonuniques: ['update']
    }
  ], function(e) {
    console.log("open store successfully", e);
  }, function(e) {
    console.error("open failed!", e);
  });

  // popups to be opened
  var refpops = [];

  // command list usable on addressbar
  var cmd = {
    bookmarks: "about:bookmarks"
  };

  // process loading flag
  var nowloading = false;

  // adult contents confirmed flag
  var adultConfirmed = false;

  //
  // -- UI controls
  //
  var $window = $(window);
  var $document = $(document);
  var ta_clipboard = $("#ta_clipboard");
  var btn_history = $("#btn_history");
  var btn_arrowUp = $("#btn_arrowUp");
  var btn_arrowDn = $("#btn_arrowDn");
  var btn_arrowUpTList = $("#btn_arrowUpTList");
  var btn_arrowDnTList = $("#btn_arrowDnTList");
  var btn_showPaneWrite = $("#btn_showPaneWrite");
  var btn_addBm = $("#btn_addBm");
  var rng_divider = $("#rng_divider");
  var readmore = $("#readmore");
  var readhere = $("#readhere");
  var fetchline = $("#fetchline");
  var btn_jumpToReadhere = $("#btn_jumpToReadhere");
  var lbl_kakolog = $("#lbl_kakolog");
  var thread = $("#thread");
  var tlist = $("#tlist");
  // var tlist_body = $("#tlist .body");
  var blist = $("#blist");
  var blist_toggle_bar = $('#blist_toggle_bar');
  var btn_addBBSBm = $("#btn_addBBSBm");
  var btn_readherefilter = $("#btn_readherefilter");
  var btn_sortByMomentum = $("#btn_sortByMomentum");
  var btn_reloadTList = $("#btn_reloadTList");
  var btn_reloadBList = $("#btn_reloadBList");
  var blist_wrapper = $("#blist_wrapper");
  var btn_bmlist = $("#btn_bmlist");
  var txt_url = $("#txt_url");
  var bbs_title = $("#bbs_title");
  var thread_title = $("#thread_title");
  var btn_write_cancel = $("#btn_write_cancel");
  var txt_write_name = $("#txt_write_name");
  var txt_write_email = $("#txt_write_email");
  var txt_write_content = $("#txt_write_content");
  // var res_wrapper = $("#res_wrapper");
  var tlist_row_wrapper = $("#tlist_row_wrapper");
  var tlist_header = $("#tlist_header");
  var tlist_row_wrapper_ttitle = $("#tlist_row_wrapper .ttitle");
  var pane_message = $("#pane_message");
  var txt_message = $("#txt_message");
  var btn_closePaneMessage = $("#btn_closePaneMessage");
  var pane_dialogYN_wrapper = $("#pane_dialogYN_wrapper");
  var pane_dialogYN_txt = $("#pane_dialogYN_txt");
  var btn_dialogY = $("#btn_dialogY");
  var btn_dialogN = $("#btn_dialogN");
  var res_tpl = $("#res_tpl");
  var blist_tpl = $("#blist_tpl");
  var tlist_tpl = $("#tlist_tpl");
  var onlineStat = $("#onlineStat");
  var txt_filter = $("#txt_filter");
  var btn_bmRemove = $("<span id='btn_bmRemove' class='remove_in_cell' style='background-color:transparent;position:relative;top:0;left:0;' title='お気に入りから削除'></span>");
  var pane_wv = $("#pane_wv");
  var wv = $("#wv");
  var btn_closeWv = $("#btn_closeWv");
  var pane_confBg = $("#pane_confBg");
  var pane_confWrapper = $("#pane_confWrapper");
  var pane_conf = $("#pane_conf");
  var btn_closeConfPane = $("#btn_closeConfPane");
  var txt_confFontSize = $("#txt_confFontSize");
  var btn_confClearReadheres = $("#btn_confClearReadheres");
  var ta_confNGWords = $("#ta_confNGWords");
  var rdo_autoImgLoad_on = $("#rdo_autoImgLoad_on");
  var rdo_autoImgLoad_off = $("#rdo_autoImgLoad_off");
  var rdo_appInWindow_on = $("#rdo_appInWindow_on");
  var rdo_appInWindow_off = $("#rdo_appInWindow_off");
  var body = $("body");
  var menu_historyURLs = $("#menu_historyURLs");
  var dlg_adultCheck = $("#dlg_adultCheck");
  var btn_adultCheckYes = $("#btn_adultCheckYes");
  var btn_adultCheckNo = $("#btn_adultCheckNo");
  var lbl_version = $("#lbl_version");
  var btn_settings = $("#btn_settings");
  var pane_settings = $("#pane_settings");
  var btn_closePaneSettings = $("#btn_closePaneSettings");
  var btn_settingBMList = $("#btn_settingBMList");
  var btn_settingBM = $("#btn_settingBM");
  var btn_settingSizeUp = $("#btn_settingSizeUp");
  var btn_settingSizeDn = $("#btn_settingSizeDn");
  var btn_settingCloudSave = $("#btn_settingCloudSave");
  var btn_settingCloudLoad = $("#btn_settingCloudLoad");
  var btn_settingFind = $("#btn_settingFind");
  var btn_settingConfig = $("#btn_settingConfig");
  var btn_settingAbout = $("#btn_settingAbout");
  var btn_settingQuit = $("#btn_settingQuit");
  var pane_wv_adsbar = $("#pane_wv_adsbar");
  var wv_adsbar = $("#wv_adsbar");
  var adsbar_dogear = $("#adsbar_dogear");
  var pane_recommend = $("#pane_recommend");
  var pane_recommendImg = $("#pane_recommendImg");
  var btn_closePaneRecommend = $("#btn_closePaneRecommend");

  txt_url.focus();

  //
  // -- window onload
  //
  window.onload = function(e) {
    console.log("window.onload");
    lbl_version.text(chrome.runtime.getManifest().name + " v." + chrome.runtime.getManifest().version);
    readmore.hide();
    readhere.hide();
    // make webview pane draggable
    new Draggable("pane_wv");
    // init webview pane of kakiko
    initWriteForm();
    // createContextMenus(); // needs "contextMenus" to "permissions" of manifest.
    updatechecker.check(function(updatedVer) {
      if (updatedVer) {
        showMessage("お使いの " + chrome.runtime.getManifest().name + " は v." + updatedVer +
          " にバージョンアップしました！ <a href='" + CWS_URL + "' target='_blank'>詳細</a>", false);
      }
    });
  }

  //
  // -- window onMessage
  //

  $window.on("message", function(e) {
    let data = e.originalEvent.data;
    console.log("window onmessage:", data);
    let url = thread_title.data("url");
    // If successed to write, close webview's pane.
    if ((util2ch.isMachiReadCGIURL(url) && data.title.trim() == thread_title.text().trim()) || data.title.trim() == "書きこみました。") {
      if (pane_wv[0].style.visibility != "hidden") {
        pane_wv[0].style.visibility = "hidden";
        execReadmore();
      }
    } else {
      return;
    }
  });

  //
  // -- Message passing from background
  //
  chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
      if (request.command == "searchByGoogle") {
        // *** open new window for Google search
        window.open("https://www.google.co.jp/search?q=" + request.text);
        sendResponse({
          status: "OK"
        });
      } else if (request.command == "searchBy2ch") {
        // *** search by finding service of 2ch
        let e = new Event("keydown");
        e.keyCode = 13; // set Enter key to the event
        txt_url.val(request.text).trigger("keydown", e);
      } else if (request.command == "addNG") {
        // *** add as NG word
        if (!appConfig.ngWords) appConfig.ngWords = [];
        let ngWords = appConfig.ngWords;
        let ngWord = request.text;
        // double check
        if ($.inArray(ngWord, ngWords) >= 0) return;
        ngWords.push(ngWord);
        // set cloned array to fire the change event for object.observe
        appConfig.ngWords = ngWords.concat();
      } else if (request.command == "filter") {
        // *** filtering
        txt_filter.val(request.text)
          .select()
          .trigger("keydown");
      } else if (request.command == "findbar") {
        // *** findbar
        btn_settingFind.val(request.text)
          .trigger("click");
      } else if (request.command == "copylink") {
        // *** copy link
        copyToClipboard(request.text);
      }
    });

  function copyToClipboard(text) {
    ta_clipboard.text(text).select();
    document.execCommand("copy");
  }

  //
  // -- window clicked
  //
  $window.on("click", function(e) {
    hideIfUnhovered([
      menu_historyURLs,
      pane_settings
    ], e);
  });

  /**
   * hide elements of un-hovered
   */
  function hideIfUnhovered(elems, e) {
    console.log("hideIfUnhovered");
    // Unless the element is hovered, hide it.
    let elem;
    for (let i = 0, len = elems.length; i < len; i++) {
      elem = elems[i];
      if (!isMouseHovered(elem, e)) elem.hide();
    }
  }

  function isMouseHovered(elem, evt) {
    let vRangeStart = elem.offset().top;
    let vRangeEnd = vRangeStart + elem.height();
    let hRangeStart = elem.offset().left;
    let hRangeEnd = hRangeStart + elem.width();
    if (vRangeStart <= evt.clientY && evt.clientY <= vRangeEnd &&
      hRangeStart <= evt.clientX && evt.clientX <= hRangeEnd) {
      return true;
    } else {
      return false;
    }
  }

  //
  // -- shortcut key
  //

  $window.bind('keydown', function(event) {
    if (event.altKey) { // with "Alt" key
      switch (event.which) {
        case 39: // Alt+Right
          event.preventDefault();
          console.log('Alt+Right');
          // go forward
          goBackFromHistory(-1);
          break;
        case 37: // Alt+Left
          event.preventDefault();
          console.log('Alt+Left');
          // go back 
          goBackFromHistory(1);
          break;
      }
    } else if (event.ctrlKey || event.metaKey) { // with "Ctrl" key
      console.log("which:", event.which);
      switch (event.which) {
        // fontsize adjustment
        case 107: // Ctrl+"+"
          event.preventDefault();
          console.log('Ctrl+"+"');
          btn_settingSizeUp.trigger("click");
          break;
        case 109: // Ctrl+"-"
          event.preventDefault();
          console.log('Ctrl+"-"');
          btn_settingSizeDn.trigger("click");
          break;
        case 76: // Ctrl+L
          event.preventDefault();
          console.log('Ctrl+L');
          txt_url.select();
          break;
        case 70: // Ctrl+F
          event.preventDefault();
          if (event.shiftKey) {
            console.log('Ctrl+Shift+F');
            // Ctrl+Shift+F
            txt_filter.select();
          } else {
            console.log('Ctrl+F');
            // Ctrl+F
            btn_settingFind.trigger("click");
          }
          break;
        case 72: // Ctrl+H
          event.preventDefault();
          btn_history.trigger("click");
          break;
        case 66: // Ctrl+B
          event.preventDefault();
          console.log('Ctrl+B');
          btn_settingBMList.trigger("click");
          break;
        case 68: // Ctrl+D
          event.preventDefault();
          console.log('Ctrl+D');
          btn_settingBM.trigger("click");
          break;
      }
    }
  });


  //
  // -- BBS List
  //

  $document.on("click", "#blist .cate0", function() {
    $(this).next().slideToggle(200);
  });

  // left menu animation
  blist_toggle_bar.mouseover(function() {
    toggleBBSList();
  });


  $document.on("mouseleave", "#blist", function() {
    toggleBBSList(false);
  });

  $document.on("click", "#blist .cate1", function() {
    let url = $(this).data("url");
    let bbs = $(this).text();
    url = util2ch.complementSlash(url); // add "/" to string hip.
    url = optimizeXpicURL(url);
    console.log("cate1 click:", url);
    // check if it's adult contents or not.
    if (util2ch.isAdultContents(url)) {
      // If "adultConfirmed" in local cache === true, pass the next step.
      if (!adultConfirmed) {
        dlg_adultCheck.show();
      }
    }
    // reverse color on clicking
    $("#blist .selected").removeClass("selected");
    $(this).addClass("selected");
    toggleBBSList(false);
    // make the threadList reloading button enabled.
    btn_reloadTList.show();
    // set bbs infos
    txt_url.val(url);
    btn_reloadTList.data("url", url);
    bbs_title.text(bbs);
    // reload Thread's list
    reloadTList();
  });

  btn_adultCheckYes.click(function(e) {
    // save "adultConfirmed" flag.
    adultConfirmed = true;
    dlg_adultCheck.hide();
  });
  btn_adultCheckNo.click(function(e) {
    chrome.app.window.current().close();
  });

  btn_reloadBList.click(function(e) {
    reloadBList($(this));
  });

  // reload BBSMENU. If does not get it, get from local cache
  btn_reloadBList.trigger("click");

  function reloadBList(el) {
    console.log("reloadBList");
    el.addClass("loading_in_cell");
    // get bbsmenu from local first.
    util2ch.getBBSFromCache(function(bbsmenu) {
      console.log(bbsmenu);
      if (bbsmenu) {
        makeBList(bbsmenu);
      }
    });
    // get bbsmenu from web
    util2ch.updateBBS(function(bbsmenu) { // onsuccess
      console.log(bbsmenu);
      if (bbsmenu) {
        makeBList(bbsmenu);
      }
      el.removeClass("loading_in_cell");
    }, function(e) {
      errorOnReload(el, e);
    });
  }

  function toggleBBSList(flg) {
    DEFAULT_W = "184px";
    let marginLeft;
    if (flg == undefined) {
      if (blist_wrapper.css("marginLeft") == DEFAULT_W) {
        marginLeft = "0px";
      } else {
        marginLeft = DEFAULT_W;
      }
    } else if (flg == true) {
      marginLeft = DEFAULT_W;
    } else {
      marginLeft = "0px";
    }
    // toggle bbslist
    blist_wrapper.stop().animate({
      'marginLeft': marginLeft
    }, 200);
  }

  btn_bmlist.on("click", function() {
    console.log("btn_bmlist click");
    let url = cmd.bookmarks;
    toggleBBSList(false);
    // make the threadList reloading button disabled, because bookmarkList is unreloadable.
    // btn_reloadTList.hide();
    setBBSInfo({
      url: url,
      bbs: "お気に入り"
    });
    getAllBookmarks(function(list) {
      console.log("list", list);
      drawThreadList(list);
      setResCountAndNewCountOnBM();
    });
    changeBmStarStyle(url, btn_addBBSBm);
  });

  // get and set the latest rescounts and newcounts of bookmarked threads.
  function setResCountAndNewCountOnBM() {
    let elems = $("#tlist .body > div");
    let cnt = elems.length;
    elems.each(function() {
      let el = $(this);
      let rescntEl = el.find(".col.rescnt");
      let newcntEl = el.find(".col.newcnt");
      let url = el.data("url");
      // get latest rescount of this thread
      util2ch.getLatestResnum(url, function(rescnt) {
        console.log(rescnt);
        rescntEl.text(rescnt);
        // calc newcount and set.
        getReadhereFromStore(url, function(rescntInBM) {
          if (!rescntInBM) return;
          let newcnt = rescnt - rescntInBM;
          newcntEl.text(newcnt);
        });
      });
    });
  }

  //

  function setBBSInfo(info) {
    console.log("setBBSInfo", info);
    txt_url.val(info.url);
    txt_url.data("url", info.url);
    txt_url.css("background-color", "white");
    bbs_title.text(info.bbs);
    bbs_title.data("url", info.url);
    btn_reloadTList.data("url", info.url);
  }

  function setThreadInfo(info) {
    console.log("setThreadInfo", info);
    txt_url.val(info.url);
    txt_url.data("url", info.url);
    txt_url.data("title", info.title);
    txt_url.css("background-color", "white");
    thread_title.text(info.title);
    thread_title.data("url", info.url);
    thread_title.data("title", info.title);
    readmore.data("url", info.url);
    // if thread title is null, try to get it from subject.txt
    if (!info.title) {
      console.log("'title' not found. Searching it from subject.txt...");
      util2ch.getThreadTitle(info.url, function(title) {
        console.log("title:", title);
        thread_title.text(info.title);
        thread_title.data("title", info.title);
      });
    }
  }

  btn_confClearReadheres.click(function() {
    console.log("btn_confClearReadheres click");
    // show YesNo dialog.
    let msg = "「ここまで読んだ」履歴を<br>削除しますか？";
    showDialogYN(msg, function() {
      // YES
      idbutil.clear("readheres");
      pane_dialogYN_wrapper.hide();
    }, function() {
      // NO
      pane_dialogYN_wrapper.hide();
    });
  });

  //
  // -- dialog box
  //

  // shows YesNoDialogBox
  function showDialogYN(msg, onYes, onNo) {
    btn_dialogY.unbind("click").bind("click", onYes);
    btn_dialogN.unbind("click").bind("click", onNo);
    pane_dialogYN_txt.html(msg);
    pane_dialogYN_wrapper.show();
  }


  //
  // -- address bar
  //

  txt_url.on("keydown", function(e, xe) {
    console.log("txt_url keydown:", e.keyCode);
    if (e.keyCode === 13 || (xe && xe.keyCode === 13)) { // RETURN key
      console.log($(this).val());
      let url = $(this).val().trim();
      if (!url) return;

      // 2ch.net -> 2ch.sc
      url = util2ch.netToSc(url);

      // prettify read.cgi URL 
      // eg.: read.cgi/xxxxx/l50 → read.cgi/xxxxx/
      url = util2ch.prettifyReadCGIURL(url);

      // optimize url for xpic.sc
      url = optimizeXpicURL(url);

      if (!isCommand(url) &&
        !util2ch.isBBSURL(url) &&
        !util2ch.isReadCGIURL(url) &&
        !util2ch.isMachiReadCGIURL(url) &&
        !util2ch.isDatURL(url)) {
        // If url is neither commands nor 2ch's URL, it means keywords to search.
        url = util2ch.getFind2chURL(url);
      }
      $(this).val(url);

      if (InputValidator.txt_url()) {
        console.log("txt_url input data is valid");
        $(this).data("url", url);
        if (util2ch.isBBSURL(url) || util2ch.isFind2chURL(url)) {
          // when BBS's url
          btn_reloadTList.data("url", url);
          reloadTList();
        } else if (url == cmd.bookmarks) {
          // show bookmark list
          btn_bmlist.trigger("click");
        } else {
          // when thread's or others' url.
          viewResponses(url, null, true, false);
        }
      }
    }
  });


  //
  // -- write pane
  //

  btn_showPaneWrite.click(function(e, data) { // data format: { from:, mail:, msg: }
    console.log("btn_showPaneWrite");
    if ($(this).hasClass("disabled")) return;
    // insert css
    insertWriteFormCSS();
    // preset anything into writeform's input
    // let from = "";
    let mail = "sage";
    let msg = "";
    if (data) {
      // if (data.from) from = data.from;
      if (data.mail) mail = data.mail;
      if (data.msg) msg = data.msg;
    }
    // hidden params for writeform
    let url = thread_title.data("url");
    let bbsinfo = util2ch.getBBSInfo(url);
    let bbs = bbsinfo.bbs;
    let key = bbsinfo.thread;
    let time = Math.floor(new Date().getTime() / 1000) - 86400;
    // keyname of each hidden param
    let keyname_from = "FROM";
    let keyname_mail = "mail";
    let keyname_message = "MESSAGE";
    let keyname_bbs = "bbs";
    let keyname_key = "key";
    let keyname_time = "time";
    if (util2ch.isMachiReadCGIURL(url)) { // *** when machibbs...
      keyname_from = "FROM";
      keyname_mail = "MAIL";
      keyname_message = "MESSAGE";
      keyname_bbs = "BBS";
      keyname_key = "KEY";
      keyname_time = "TIME";
    }
    // set focus to the webview
    wv.focus();
    // execute script
    wv[0].executeScript({
      code:
      // "let ipt_from = document.getElementsByName('" + keyname_from + "')[0];"+
      // "if(ipt_from) ipt_from.value = '" + from + "';" +
        "let ipt_mail = document.getElementsByName('" + keyname_mail + "')[0];" +
        "if(ipt_mail) ipt_mail.value = '" + mail + "';" +
        "let ta_msg = document.getElementsByName('" + keyname_message + "')[0];" +
        "if(ta_msg) ta_msg.value = '" + msg + "';" +
        "let ipt_bbs = document.getElementsByName('" + keyname_bbs + "')[0];" +
        "if(ipt_bbs) ipt_bbs.value = '" + bbs + "';" +
        "let ipt_key = document.getElementsByName('" + keyname_key + "')[0];" +
        "if(ipt_key) ipt_key.value = '" + key + "';" +
        "let ipt_time = document.getElementsByName('" + keyname_time + "')[0];" +
        "if(ipt_time) ipt_time.value = '" + time + "';" +
        "if(ta_msg){" +
        "  ta_msg.setAttribute('rows', '15');" + // textarea
        "  ta_msg.select();" +
        "}"
    });
    pane_wv[0].style.visibility = "visible";
  });

  btn_closeWv.click(function(e) {
    console.log("btn_closeWv");
    pane_wv[0].style.visibility = "hidden";
  });

  function initWriteForm() {
    console.log("initWriteForm");

    // block evil external sites
    wv[0].request.onBeforeRequest.addListener(
      function(details) {
        return {
          cancel: true
        };
      }, {
        urls: [
          "*://*.microad.jp/*",
          "*://*.adlantis.jp/*"
        ],
        // urls: ["<all_urls>"],
        types: [
          "sub_frame",
          "stylesheet",
          "script",
          "image",
          "object",
          "xmlhttprequest",
          "other"
        ]
      }, ["blocking"]); // block evil external sites

    //
    // -- webview loadcommit
    wv[0].addEventListener("loadcommit", function() {
      console.log("webview loadcommit");
      // insert css
      insertWriteFormCSS();
      // execute script on document_start
      wv[0].executeScript({
        runAt: 'document_start',
        code: "console.log('writeForm webview loadcommit document_start');" +
          // remove 2ch cookie "READJS" for "bbs.cgi mode" POST
          "function setJSModeOff() {" +
          // "  console.log('befor document.cookie', document.cookie);" +
          "  let maxAge = 365*24*60*60;" +
          "  let date  = new Date();" +
          "  date.setTime(date.getTime() + maxAge*1000);" +
          "  let expires = date.toUTCString();" +
          "  document.cookie = 'READJS=off; version=1; path=/; domain=.2ch.sc; max-age=' + maxAge + '; expires=' + expires + '; ';" +
          // "  console.log('after document.cookie', document.cookie);" +
          "}" +
          "setJSModeOff();" + // always set READJS=off as "read.cgi mode".
          // On messaging "getTitle" command, returns the title to app's window.
          "let appWindow, appOrigin;" +
          "window.addEventListener('message', function(e){" +
          "  console.log('Received:', e.data);" +
          "  appWindow = e.source;" +
          "  appOrigin = e.origin;" +
          "  if(e.data.command == 'getTitle'){" +
          "    console.log('Reterning title...', document.title);" +
          "    appWindow.postMessage({ title: document.title }, appOrigin);" +
          "    if(document.title == e.data.ttitle) document.getElementById('backBtn').style.display = 'none';" +
          "  }" +
          "});" +
          // create custom back button 
          "let backBtn = document.getElementById('backBtn');" +
          "if (!backBtn) {" +
          "  backBtn = document.createElement('div');" +
          "  backBtn.setAttribute('id', 'backBtn');" +
          "  backBtn.innerText = '< Back';" +
          "  backBtn.setAttribute('onclick', 'history.back()');" +
          "  backBtn.style.cssText = 'z-index:999999;display:block;cursor:pointer;padding:10px 4px 10px 4px;background-color:rgba(0,0,0,0.8);border-radius:6px;color:white;position:fixed;top:2px;right:2px;';" +
          "  document.body.appendChild(backBtn);" +
          "}"
      });
      // execute script on document_end
      wv[0].executeScript({
        runAt: 'document_end',
        code: "console.log('writeForm webview loadcommit document_end');" +
          // remove side_ad of machi.to because it bothers to set mouse pointer on input.
          "let sideAd = document.getElementById('side_ad');" +
          "if (sideAd) sideAd.parentElement.removeChild(sideAd);" +
          // remake postForm for "bbs.cgi mode" POST
          "let postForm = document.getElementById('postForm');" +
          "console.log('postForm', postForm);" +
          "if(postForm) {" +
          "  postForm.method = 'POST';" +
          "  postForm.action = '../test/bbs.cgi?guid=ON';" +
          "}"
      });
      // posts "getTitle" command to writeForm's webview
      // IMPORTANT: needs enough time using setTimeout to complete to render html&script by the above executeScript()
      setTimeout(function() {
        requestTitleToWriteForm();
      }, 200);
    }); // wv[0].addEventListener
  } // initWriteForm

  function requestTitleToWriteForm() {
    wv[0].contentWindow.postMessage({
      command: 'getTitle',
      ttitle: thread_title.text()
    }, '*');
  }

  function insertWriteFormCSS() {
    let css;
    let isMachi = false;
    let isXpic = false;
    let url = wv[0].src;
    if (util2ch.isMachiReadCGIURL(url)) isMachi = true;
    if (util2ch.isXpicReadCGIURL(url)) isXpic = true;
    // create css for making unnecessary elems unvisible
    if (isMachi) { // ** when machibbs
      css = "#contents > a, hr { display:none; }" +
        "#contents { margin:0px; margin-right:0px; width:100%; }" +
        "dl > font { padding: 6px; }" +
        "dl > dt { padding: 6px; -webkit-margin-start:0px; font-size:10px; }" +
        "dl > dd { -webkit-margin-start:0px; font-size:10px; }" +
        "textarea{ width: 98%; margin: 4px 0px; font-size: 16px; }"
    } else if (isXpic) { // ** when xpic
      // style for xpic.sc
      css = "body > :not(h1), hr {display: none;}" +
        "body > div { display: block; }" +
        ".thread-box-links { display: none; }";
    } else { // ** when normal 2ch thread
      css = "body > div, a, hr, form:last-child { display:none; }" +
        "body > h1 { padding: 10px; 4px; }" +
        "dl > font { padding: 6px; }" +
        "dl > dt { padding: 6px; -webkit-margin-start:0px; font-size:10px; }" +
        "dl > dd { -webkit-margin-start:0px; font-size:10px; }" +
        "dd > a { display:block; }" +
        "textarea{ width: 98%; margin: 4px 0px; font-size: 16px; }"
    }
    wv[0].insertCSS({
      code: css
    });
  }

  function prepareWriteForm() {
    console.log("prepareWriteForm");
    // convert to read.cgi's url
    let url = txt_url.data("url");
    if (util2ch.isDatURL(url)) {
      url = util2ch.datURLToReadCGIURL(url) + "1"; // url of only first res displayed
    } else { // when machibbs's url
      url += "1";
    }
    wv[0].src = url;
  }

  //
  // -- ads bar
  //
  pane_wv_adsbar.on("mouseleave", function(e) {
    let h = wv_adsbar.height();
    $(this).animate({
      bottom: -h
    }, 'fast');
  }).on("mouseenter", function(e) {
    $(this).animate({
      bottom: 0
    }, 'fast');
  });

  wv_adsbar[0].addEventListener("newwindow", function(e) {
    window.open(e.targetUrl);
  })

  //
  // -- validator for input controls
  //
  InputValidator = {

    // addressBar
    txt_url: function() {
      let el = txt_url;
      el.css("background-color", "white");
      let inputed = el.val();
      // check if it is command
      if (isCommand(inputed)) {
        return true;
      }
      // check if it is valid as 2ch's url
      if (util2ch.getBBSInfo(inputed)) {
        return true;
      }
      // // check if it starts with "http[s]://.2ch.net/search?"
      // if (util2ch.isFind2chURL(inputed)) {
      //   return true;
      // }
      // // Otherwise, this is invalid...
      // el.css("background-color", "#ffcfcf");
      // return false;
      return true;
    }

  };

  function isCommand(str) {
    for (let key in cmd) {
      if (cmd[key] == str) return true;
    }
    return false;
  }


  //
  // -- filter
  //

  /* 
    clearable input box
   */
  function tog(v) {
    return v ? 'addClass' : 'removeClass';
  }
  $document.on('input', '.clearable', function() {
    $(this)[tog(this.value)]('x');
  }).on('mousemove', '.x', function(e) {
    $(this)[tog(this.offsetWidth - 18 < e.clientX - this.getBoundingClientRect().left)]('onX');
  }).on('click', '.onX', function() {
    $(this).removeClass('x onX').val('').trigger("keydown");
  });

  txt_filter.on("keydown", function(e) {
    console.log("txt_filter change.");
    // filtering of thread's response
    setTimeout(function() {
      filterRes(txt_filter.val());
    }, 0);
    // filtering of thread list
    setTimeout(function() {
      filterTList(txt_filter.val());
    }, 100);
  });


  //
  // -- thread list
  //

  $document.on("click", "#btn_bmRemove", function(e) {
    console.log("bmRemove Clicked");
    let row = e.currentTarget.parentNode;
    let url = $(row).data("url");
    removeBookmark(url);
    row.remove();
    if (thread_title.data("url") == url) {
      styleBmStar(btn_addBm, false);
    }
    e.stopPropagation(); // stop all events after this.
  });

  $document.on("click", "#tlist .body .row", function(e) {
    // return when now loading.
    if (nowloading) return;
    let row = $(this); // a selected row on threadList
    let url = row.data("url");
    url = util2ch.prettifyReadCGIURL(url);
    if (util2ch.isBBSURL(url) || util2ch.isDig2chURL(url) || isCommand(url)) {
      // if the url of bbs|dig2ch|command, set url to txt_url and trigger enterkey down.
      e.keyCode = 13; // set Enter key to the event
      txt_url.val(url).trigger("keydown", e);
    } else {
      // else regards the url as thread's one
      viewResponses(url, row, true, false);
    }
  });

  /**
   * view responses of the thread
   * @param url
   * @param row
   *    selected row in threadList. null is also OK.
   * @param {bool} historyUpdate
   *    default is "false"
   * @param {bool} isReadmoreClicked
   *    default is "false"
   */
  function viewResponses(url, row, historyUpdate, isReadmoreClicked) {
    startLoading(url, row);
    txt_url.val(url);
    let thread_title_url = thread_title.data("url");
    if (!historyUpdate) historyUpdate = false;
    if (!isReadmoreClicked) isReadmoreClicked = false;
    console.log("url:", url);
    // get resnum of readhere
    getReadhereFromStore(url, function(resnum) {
      let startIdx = 0; // starting res index.
      // get url for getting responses.
      let daturl;
      if (!util2ch.isMachiReadCGIURL(url)) {
        daturl = util2ch.readCGIURLToDatURL(url);
      } else { // when url of machibbs's readcgi
        daturl = url;
      }
      // get res.
      util2ch.getResponses(daturl, appConfig.ngWords, function(data, type) {
        console.log("type:", type, " data:", data);
        let responses = data.responses;
        // If type="html", get threadTitle from data.title. Else from selected row's "title" attr.
        let title;
        // the res ID for starting to fetch. This uses on readmore clicked.
        // it's required because #resnum's index is not always same as #resnum's id
        let fetchStartResId;
        let prevURL = thread_title.data("url");
        if (type == "dat") {
          responses ? title = responses[0].title : title = "";
        } else { // "html" or "kako"
          title = data.title;
        }
        // access history update
        if (historyUpdate) {
          util2ch.updateHistory(url, title);
        }
        //
        setThreadInfo({
          url: url,
          title: title
        });
        // effect of thread_title appearance
        thread_title.effect("slide", {}, 400);
        // if type="kako", disabled btn_write & readmore
        if (type == "kako") {
          btn_showPaneWrite.addClass("disabled");
          readmore.hide();
          lbl_kakolog.show();
        } else {
          btn_showPaneWrite.removeClass("disabled");
          readmore.show();
          lbl_kakolog.hide();
          // preload read.cgi for preparing to write a response.
          prepareWriteForm();
        }
        // make the buttons of readhere, arrowUp and arrowDn enable.
        if (resnum) {
          btn_jumpToReadhere.removeClass("disabled");
        } else {
          btn_jumpToReadhere.addClass("disabled");
        }
        btn_arrowUp.removeClass("disabled");
        btn_arrowDn.removeClass("disabled");

        // history button toggle style
        if (util2ch.getHistory().length >= 1) {
          btn_history.removeClass("disabled");
        } else {
          btn_history.addClass("disabled");
        }

        // close res write webview if opened.
        pane_wv[0].style.visibility = "hidden";

        if (isReadmoreClicked) {
          // if it comes by clicking readmore button, set lastResnum as startIdx
          startIdx = getLastResIdxOfThreadPane() + 1;
        } else if (!resnum || thread_title_url != url) {
          // unless by clicking readmore button nor any thread with readhere, clear responses.
          startIdx = 0;
          if (resnum === undefined) {
            resnum = 0; // init resnum for getting all res.
            // jump to top
            thread.scrollTop(0);
          }
        }
        // draw responses.
        let lastResnum = drawResponses(responses, startIdx);
        if (lastResnum < 0) {
          showErrorMessage("datが存在しない or dat落ち or 鯖落ちです");
        } else if (isReadmoreClicked) {
          fetchStartResId = $(".res[id]").get(startIdx - 1).id;
          fetchline.insertAfter($("#" + fetchStartResId)).show();
        } else {
          fetchline.hide();
        }
        // insert Readhere element after the last read res
        if (resnum >= 1) insertReadhereElem(resnum);
        // set lastResnum as ThreadTitle's data
        thread_title.data("resnum", lastResnum);
        // make previous selected row's style to "unselected"
        let prevSelectedRow = tlist_row_wrapper.find(".selected");
        if (prevSelectedRow[0]) {
          prevSelectedRow.removeClass("selected");
        }
        // make new selected row's style to "selected"
        let selectedRow;
        if (row) {
          selectedRow = row;
        } else {
          selectedRow = tlist_row_wrapper.find("[data-url='" + url + "']");
        }
        if (selectedRow[0]) {
          // affect each cols of selected row to "selected"
          selectedRow.children().addClass("selected");
          // update the text of ".rescnt" col of the selected row
          selectedRow.find(".rescnt").text(lastResnum);
          // zero-init the text of ".newcnt" col of the selected row
          let newcnt = "";
          if (resnum) newcnt = lastResnum - resnum;
          selectedRow.find(".newcnt").text(newcnt);
        }
        // change readhere's visibility
        if (isReadmoreClicked) {
          scrollToTheRes($("#" + fetchStartResId));
        } else if (resnum === 0) {
          readhere.hide();
          btn_jumpToReadhere.addClass("disabled");
        } else {
          readhere.show();
          btn_jumpToReadhere
            .removeClass("disabled")
            .trigger("click");
        }
        stopLoading();
        // analyze the sentence then get amazon recommends...
        let sentence = createSentenceToAnalyze(responses);
        analyzeAndGetAmazonRecommends(sentence);
      }, function(e) { // onerror of util2ch.getResponses.
        let suppl;
        e.status === 0 ? suppl = "Timeout" : suppl = e.status;
        showErrorMessage(`レスを取得できませんでした: ${suppl}`);
        stopLoading();
      }); // util2ch.getResponses
    });
    changeBmStarStyle(url, btn_addBm);
  } // viewResponses

  function createSentenceToAnalyze(reses) {
    const re = /(<([^>]+)>)/ig; // strip tags
    const max = 10; // pick up some reses to analyze
    let arr = [];
    let len = reses.length;
    if (len > max) len = max;
    let title, content;
    for (let i = 0; i < len; i++) {
      if (i === 0) {
        title = reses[i].title.replace(re, "");
        arr.push(title);
      }
      content = reses[i].content.replace(re, "");
      arr.push(content);
    }
    return arr.join("\n");
  }

  /**
   * analyzes the sentence passing as param then gets related amazon items.
   * @param {String} the sentence to analyze
   */
  function analyzeAndGetAmazonRecommends(sentence) {
    let analysis = ju.analyze(sentence);
    let kwd = analysis.freqRankingTop.join(" ");
    // get some amazon recommend items.
    amazonutil.getRecommends(kwd, 3, function(err, items) {
      if (err || !items || items.length <= 0) return;
      let idx = getRandomInt(0, items.length - 1);
      let item = items[idx];
      let html = `<a href="${item.href}" target="_blank" title="${item.title}"></a>`;
      pane_recommendImg.html(html);
      let aEl = pane_recommendImg[0].querySelector("a");
      loadImage(item.imgsrc, aEl, function(imgEl) {
        pane_recommend.fadeIn().delay(6000).fadeOut('slow');
      });
    });

    function getRandomInt(min, max) {
      return Math.floor(Math.random() * (max - min + 1)) + min;
    }
  }

  /**
   * dl an external image resource and append it as an img element into the rootEl
   *
   * @param {String}
   *    image resource's url
   * @param {Element} Optional
   *    root element to be appended an img element.
   * @param {Function} Optional
   *    callback function. 'function(imgEl){...}'
   */
  function loadImage(url, rootEl, cb) {
    if (!url) {
      console.error("url is required.");
      return cb && cb(null);
    }
    if (!rootEl) rootEl = document.body;

    let xhr = new XMLHttpRequest();

    xhr.onload = function(e) {
      if (this.readyState === XMLHttpRequest.DONE) {
        if (this.status === 200) {
          let img = document.createElement('img');
          rootEl.appendChild(img);
          img.src = window.URL.createObjectURL(this.response);
          return cb && cb(img);
        }
      }
    };

    xhr.responseType = "blob";
    xhr.open('GET', url, true);
    xhr.send();
  }
  /**
   * toggle the bookmark button ON if the url will be bookmarked.
   * @param {string} url which might be bookmarked.
   * @param {dom} bookmark button element
   */
  function changeBmStarStyle(url, bmbtn) {
    // check if this thread/BBS is bookmarked or not
    getBookmark(url, function(data) {
      if (!data) {
        // unless bookmarked url, toggle OFF.
        styleBmStar(bmbtn, false);
      } else {
        // toggle ON.
        styleBmStar(bmbtn, true);
      }
    });
  }

  // insert Readhere element after the res
  function insertReadhereElem(resnum) {
    readhere
      .data("resnum", resnum)
      .insertAfter($("#resnum" + resnum)); // move readhere div to prev of readmore div
  }

  $document.on("click", "#readhere", function() {
    let url = thread_title.data("url");
    removeReadhereFromStore(url);
    let row = getTListRowByURL(url);
    if (row) row.find(".newcnt").text("");
    readhere.hide();
    btn_jumpToReadhere.addClass("disabled");
  });

  $document.on("mouseenter", "#tlist .body .row", function() {
    // if it is "bmlist"(bookmarkList), makes bookmark removable
    console.log("mouseenter row");
    let dataurl = bbs_title.data("url");
    if (dataurl == cmd.bookmarks) {
      $(this).find(".rescnt").after(btn_bmRemove);
      btn_bmRemove.show();
    }
  });
  $document.on("mouseleave", "#tlist .body .row", function() {
    let dataurl = txt_url.data("url");
    if (dataurl == cmd.bookmarks) {
      btn_bmRemove.hide();
    }
  });

  // thread list header icon buttons' effect
  $("#tlist_header .icon").click(function(e) {
    let options = {};
    $(this).effect("puff", options, 300, function(e) {
      $(this).css("display", "block");
    });
  });

  btn_arrowUpTList.click(function() {
    tlist.animate({
      scrollTop: 0
    }, 100);
  });
  btn_arrowDnTList.click(function() {
    let target = tlist.last();
    let h = tlist[0].scrollHeight;
    tlist.animate({
      scrollTop: h
    }, 100);
  });


  function drawThreadList(list, endHandler) {
    console.log("drawThreadList");
    let bbsurl = bbs_title.data("url");
    let ttitle_col_w = $("#tlist_row_wrapper .header .ttitle").width();
    let isCommandURL = isCommand(bbsurl);

    let target = $("#tlist .body");
    let html = "";
    let json, url, title, res, momentum, index;
    for (let len = list.length, i = 0; i < len; i++) {
      json = list[i];
      url = util2ch.datURLToReadCGIURL(json.url); // dat's url to read.cgi's url
      if (!url) url = json.url;
      title = json.title;
      if (!isBookmarkView()) {
        res = json.res;
      } else {
        res = "";
      }
      momentum = json.momentum;
      index = json.index;
      html += '<div data-url="' + url + '" data-momentum="' + momentum + '" data-index="' + index + '" class="row">\n' +
        '<div class="col ttitle" title="' + title.replace(/"/g, '&quot;') + '" style="width:' + ttitle_col_w + 'px">' + title + '</div>\n' +
        '<div class="col newcnt"></div>\n' +
        '<div class="col rescnt">' + res + '</div>\n' +
        '</div>';
    }
    target.html(html).promise().done(function() {
      // callback onEnd
      if (endHandler) endHandler();
    });
    // go to top
    tlist.scrollTop(0);
    // set new count of each threads if it is NOT the bookmark view
    if (!isBookmarkView()) setResNewCounts();
  }

  // calc & set new count of each thread
  function setResNewCounts() {
    $("#tlist .body > div").each(function() {
      let el = $(this);
      let url = el.data("url");
      let rescntEl = el.find(".col.rescnt");
      let newcntEl = el.find(".col.newcnt");
      let rescnt = rescntEl.text();
      if ($.isNumeric(rescnt)) {
        rescnt = parseInt(rescnt);
      } else {
        return;
      }
      getReadhereFromStore(url, function(resnum) {
        if (!resnum) return;
        let newcnt = rescnt - resnum;
        newcntEl.text(newcnt);
      });
    });
  }

  //
  // -- Responses
  //

  function drawResponses(responses, startIdx) {
    console.log("drawResponses");
    let htmlBuf = "";
    let res;
    let num, handle, email, date, uid, be, content, host;
    if (!startIdx) startIdx = 0;
    // evacuate readhere & fetchline element
    readhere.insertAfter($("#res_wrapper"));
    fetchline.insertAfter($("#res_wrapper"));
    for (let len = responses.length, i = 0; i < len; i++) {
      // start to build html from specified index of responses
      if (startIdx <= i) {
        res = responses[i];
        res.num ? num = res.num : num = "";
        res.handle ? handle = res.handle : handle = "";
        res.email ? email = res.email : email = "";
        res.date ? date = res.date : date = "";
        res.uid ? uid = res.uid : uid = "";
        res.be ? be = res.be : be = "";
        res.host ? host = res.host : host = ""; // machi.to only
        res.content ? content = res.content.replace(/<script[^>]*>/gi, '') : content = ""; // for [email protected]

        if (res.ng) {
          // if contains NG words, then abooooon!
          htmlBuf += '<div class="res" id="resnum' + num + '"></div>\n';
        } else {
          htmlBuf += '<div class="res" id="resnum' + num + '">\n' +
            ' <div class="res_header">\n' +
            '  <span class="num">' + num + '</span>:&nbsp;\n' +
            '  <span class="handle"><b>' + handle + '</b></span>\n' +
            '  [<span class="email">' + email + '</span>]&nbsp;\n' +
            '  <span class="date">' + date + '</span>\n' +
            '  <span class="uid">' + uid + '</span>\n' +
            '  <span class="be">' + be + '</span>\n' +
            '  <span class="host">' + host + '</span>\n' +
            ' </div>\n' +
            ' <div class="content">' + content + '</div>\n' +
            ' <div class="restool">\n' +
            '  <div class="btn btn_reply" title="返信">&nbsp;</div>\n' +
            '  <div class="btn btn_readhere" title="ここまで読んだ">&nbsp;</div>\n' +
            '  <div style="clear:both"></div>\n' +
            ' </div>\n' +
            '</div>\n';
        }
      }
    }
    if (startIdx != 0) {
      // htmlBuf = $("#res_wrapper").html() + htmlBuf;
      $("#res_wrapper").append(htmlBuf).promise().done(function() {
        reddenReferedResnums(); // all refered nums' color to red
      });
    } else {
      $("#res_wrapper").html(htmlBuf).promise().done(function() {
        reddenReferedResnums(); // all refered nums' color to red
      });
    }

    // return last resnum.
    let lastResnum = responses[responses.length - 1].num;
    if (lastResnum < 0) {
      // FIXME: deal with kakolog.
      console.log("Maybe this thead's gone to kakolog storage...");
    }
    return lastResnum;
  }

  // make refered nums red (>=3), pink (1 - 2) , or default
  function reddenReferedResnums() {
    let arr = [];
    let tmpArr = [];
    let resEls = document.querySelectorAll("#res_wrapper > .res");
    let resEl;
    let linkEls;
    let linkEl;
    let resnum;
    for (let i = 0; i < resEls.length; i++) {
      resEl = resEls[i];
      linkEls = resEl.querySelectorAll(".content > [data-resnum]");
      for (let j = 0; j < linkEls.length; j++) {
        linkEl = linkEls[j];
        // TODO: consider some resnum value like "201-202"
        resnum = linkEl.dataset.resnum;
        if (!$.isNumeric(resnum)) {
          continue;
        }
        // excludes same refered resnum in this res.
        if (tmpArr.indexOf(resnum) < 0) {
          tmpArr.push(resnum);
          arr.push(resnum);
        }
      }
      tmpArr = [];
    }
    // referedResnums is like this: { resnum: count, ...}
    let referedResnums = arr.reduce(function(acc, curr) {
      if (typeof acc[curr] == 'undefined') {
        acc[curr] = 1;
      } else {
        acc[curr] += 1;
      }
      return acc;
    }, {});
    // redden resnums!
    let el;
    let cnt;
    for (let k in referedResnums) {
      el = document.querySelector("#resnum" + k + " .num");
      if (!el) continue;
      cnt = referedResnums[k];
      if (cnt >= 3)
        el.className = "num red";
      else if (cnt >= 1)
        el.className = "num pink";
    }
  }


  //
  // -- refpop and links
  //

  $document.on('click', ".res .content a[data-resnum]", function(e) {
    console.log("resnum:", $(this).data("resnum"));
    let value = $(this).data("resnum");
    showRefpop({
      key: "resnum",
      value: value
    }, e);
  });
  $document.on('click', ".res .res_header .num", function(e) {
    console.log("num:", $(this).text());
    let value = $(this).text();
    showRefpop({
      key: "refered",
      value: value
    }, e);
  });
  $document.on('click', ".res .handle", function(e) {
    console.log("handle:", $(this).text());
    let value = $(this).text();
    showRefpop({
      key: "handle",
      value: value
    }, e);
  });
  $document.on('click', ".res .email", function(e) {
    console.log("email:", $(this).text());
    let value = $(this).text();
    showRefpop({
      key: "email",
      value: value
    }, e);
  });
  $document.on('click', ".res .uid", function(e) {
    console.log("uid:", $(this).text());
    let value = $(this).text();
    showRefpop({
      key: "uid",
      value: value
    }, e);
  });
  $document.on('click', ".res .host", function(e) {
    console.log("host:", $(this).text());
    let value = $(this).text();
    showRefpop({
      key: "host",
      value: value
    }, e);
  });
  // click a link with href
  $document.on('click', ".content a", function(e) {
    let href = $(this).attr("href");
    console.log("href=", href);
    href = util2ch.replace2chNetDomainToSc(href); // replace domain "2ch.net" to "2ch.sc" when 2ch.net's url
    if (util2ch.isReadCGIURL(href) ||
      util2ch.isMachiReadCGIURL(href) ||
      util2ch.is2chBBSURL(href)) {
      e.keyCode = 13; // set Enter key to the event
      txt_url.val(href).trigger("keydown", e);
      return false;
    }
    if (!href) return false; // if res's anchor link, return to exit.
    // check whether image link or others
    if (isImageLink(href)) {
      // view image's thumbnail.
      popThumb(href, $(this));
      return false;
    } else if (isVideoLink(href) && $(this).hasClass("jumpToYoutube") == false) {
      // pop video
      popVideo(href, $(this));
      return false;
    } else if (amazonutil.isValidURL(href)) {
      if ($(this).data("jumplink") == "1") return true;
      // pop amazon info panel
      popAmazon(href, $(this));
      return false;
    } else {
      // jump
      $(this).attr("target", "_blank");
      return true;
    }
  });

  /**
   * add inviewListenr for image auto-loading
   * For best performance, remove this listener when not using image auto-loading
   */
  function addAutoImgLoadInviewListener() {
    // a link of image enter in the viewport
    $document.on("inview", ".content a", function(event, isInView, visiblePartX, visiblePartY) {
      if (appConfig.autoImgLoad !== 1) return;
      if (isInView) {
        // if an image link is in the viewport, load the image automatically.
        let url = $(this).attr("href");
        if (isImageLink(url) || amazonutil.isValidURL(url)) {
          $(this).trigger("click");
        }
      }
    });
  }
  /**
   * remove inviewListenr for image auto-loading
   */
  function removeAutoImgLoadInviewListener() {
    // a link of image enter in the viewport
    $document.off("inview", ".content a");
  }

  function popThumb(url, elem) {
    console.log("popThumb");
    // check if img already exists
    let next2elem = elem.next().next(); // <a ...><br><img .../>
    if (next2elem.is("img") && next2elem.data("url") == url) {
      console.log("this image's already loaded.");
      return;
    }
    // make an img element
    let img = $("<br><img data-url='" + url + "' class='loading_mini' /><p class='percentComplete'></p>");
    elem.after(img);
    // request
    request.doRequest({
      method: "HEAD",
      responseType: "blob",
      url: url,
      onsuccess: function(xhr) {
        let contentType = xhr.getResponseHeader("Content-Type");
        let percentComplete;
        // if the link's content type is "image", then load that.
        if (contentType.match(/^image\//)) {
          request.doRequest({
            method: "GET",
            responseType: "blob",
            url: url,
            onprogress: function(xhr) {
              percentComplete = Math.floor((xhr.loaded / xhr.total) * 100);
              img[2].textContent = percentComplete + "%";
            },
            onsuccess: function(xhr) {
              let ourl = window.URL.createObjectURL(xhr.response);
              img.attr("src", ourl)
                .addClass("thumb")
                .attr("title", "クリックで拡大");
              console.log("objectURL:", ourl);
              img.removeClass("loading_mini");
              img[2].textContent = "";
            }
          });
        } else {
          // TODO: anything to alert should be add to DOM? 
          console.log("this link is NOT image.");
          img[1].className = "imgNotFound";
          img[1].title = "画像に偽装されたリンク";
          img.removeClass("loading_mini");
        }
      },
      onerror: function(xhr) {
        let msg = xhr.status + ": " + xhr.statusText;
        img[1].className = "imgNotFound";
        img[1].title = msg;
      }
    });
  }

  function popVideo(url, elem) {
    // popup video
    console.log("popVideo");
    // check if img already exists
    let next2elem = elem.next().next(); // <a ...><br><webview .../>
    if (next2elem.is("webview") && next2elem.data("url") == url) {
      console.log("this video's already loaded.");
      return;
    }
    // convert 'http://www.youtube.com/watch?v=***' to 'http://www.youtube.com/v/***'
    let src = getDirectVideoURL(url);
    // create video width // FIXME: This's uneffective for video's width adjustment.
    let width = thread_title.width() - 24;
    // make an video element
    let html = "<br><webview width='" + width + "' data-url='" + url + "' src='" + src + "'></webview>" + "<br><a href='" + url + "' target='_blank' class='jumpToYoutube'>YouTubeで見る</a>";
    let iframe = $(html);
    elem.after(iframe);
  }

  function popAmazon(url, elem) {
    // popup amazon pane
    console.log("popAmazon");
    // check if img already exists
    let next2elem = elem.next().next(); // <a ...><br><div .../>
    if (next2elem.is("div") && next2elem.data("url") == url) {
      console.log("this amazon's pane has already loaded.");
      return;
    }
    let div = $("<br>" +
      "<div class='amazonPane' data-url='" + url + "'>" +
      "  <img class='loading_mini'></img>" +
      "  <p class='percentComplete'></p>" +
      "  <div class='starlevel5' style='display:none'></div>" +
      "  <a href='' data-jumplink='1' target='_blank'></a>" +
      "</div>");
    elem.after(div);
    let imgElem = div.find("img");
    let aElem = div.find("a");
    asin = amazonutil.getASIN(url);
    if (!asin) {
      imgElem.removeClass("loading_mini");
      return;
    }
    amazonutil.getItemByASIN(asin, function(item) {
      // make an amazon info's Pane
      div.next().data("url", url);
      // item title & price
      let amazon_detail = item.title;
      if (item.price) amazon_detail += " " + item.price;
      aElem.text(amazon_detail).attr("href", item.url);
      let percentCompleteElem = div.find(".percentComplete");
      // warning for adult item
      if (item.warn) {
        imgElem.removeClass("loading_mini");
        return;
      }
      // review stars
      if (!isNaN(item.stars)) {
        let stars = Math.round(item.stars * 2) / 2 * 10;
        div.find(".starlevel5")
          .addClass("star" + stars)
          .attr("title", item.stars).show();
      }
      // item image
      if (item.imgSrc && item.imgSrc.lastIndexOf("data:", 0) === 0) {
        imgElem
          .addClass("thumb")
          .removeClass("loading_mini")
          .attr("src", item.imgSrc);
      } else if (item.imgSrc && item.imgSrc.lastIndexOf("http", 0) === 0) {
        // load image by xhr
        request.doRequest({
          method: "GET",
          responseType: "blob",
          url: item.imgSrc,
          onprogress: function(xhr) {
            percentComplete = Math.floor((xhr.loaded / xhr.total) * 100);
            percentCompleteElem.text(percentComplete + "%");
          },
          onsuccess: function(xhr) {
            let ourl = window.URL.createObjectURL(xhr.response);
            imgElem
              .attr("src", ourl)
              .addClass("thumb")
              .removeClass("loading_mini")
              .attr("title", "クリックで拡大");
            percentCompleteElem.text("");
          }
        }, function(e) { // onerror of doRequest for getting image.
          imgElem.removeClass("loading_mini");
        });
      } else {
        imgElem.removeClass("loading_mini");
      }
    }, function(e) { // onerror of amazonutil.getItemByASIN
      imgElem.removeClass("loading_mini");
      // jump when amazon bestsellers link etc.
      elem.data("jumplink", "1").attr("target", "_blank").trigger("click");
    });
  }

  // When img ".thumb" clicked, change thumbnail to raw image.
  $document.on("click", ".thumb", function(e) {
    console.log("img.thumb clicked");
    // get thread pane's width
    let w = thread_title.width() - 24;
    $(this).removeClass("thumb")
      .addClass("rawimg")
      .width(w)
      .attr("title", "クリックで縮小");
  });
  // When img ".rawimg" clicked, change the raw image to thumbnail.
  $document.on("click", ".rawimg", function(e) {
    console.log("img.rawimg clicked");
    $(this).removeClass("rawimg")
      .addClass("thumb")
      .attr("title", "クリックで拡大");
  });

  function isImageLink(url) {
    console.log("isImageLink");
    if (!url) return false;
    if (url.match(/\.(png|gif|jpg|jpeg)$/i)) {
      return true;
    } else {
      return false;
    }
  }

  function isVideoLink(url) {
    console.log("isVideoLink");
    let ret = getDirectVideoURL(url);
    if (ret) {
      return true;
    } else {
      return false;
    }
  }

  /** 
   * get video's direct URL from youtube's one.
   */
  function getDirectVideoURL(url) {
    let arr;
    arr = url.match(/^http[s]*:\/\/www\.youtube\.com\/v\/(.+)/i);
    if (arr) {
      return url;
    };
    arr = url.match(/^http[s]*:\/\/www\.youtube\.com\/watch\?v\=(.+)/i);
    if (arr) {
      return "http://www.youtube.com/v/" + arr[1];
    }
    arr = url.match(/^http[s]*:\/\/youtu\.be\/(.+)/i);
    if (arr) {
      return "http://www.youtube.com/v/" + arr[1];
    }
    return null;
  }

  //
  // -- loading images
  //

  // start loading.
  function startLoading(url, row) {
    if (row) row.addClass("loading_in_cell");
    txt_url.addClass("loading_in_cell_rev");
    if (url == $("#readmore").data("url")) {
      readmore.addClass("loading_in_cell");
    }
    nowloading = true;
  }
  // stop loading.
  function stopLoading() {
    $("#tlist_row_wrapper .body .loading_in_cell").removeClass("loading_in_cell");
    txt_url.removeClass("loading_in_cell_rev");
    readmore.removeClass("loading_in_cell");
    nowloading = false;
  }

  //
  // -- online / offline
  //

  if (navigator.onLine) {
    toggleOnlineStat("online");
  } else {
    toggleOnlineStat("offline");
  }

  window.addEventListener("online", function() {
    toggleOnlineStat("online");
  });
  window.addEventListener("offline", function() {
    toggleOnlineStat("offline");
  });

  /**
   *
   * @param cls ("online" | "offline")
   */
  function toggleOnlineStat(cls) {
    let el = onlineStat;
    if (cls) {
      el.removeClass("offline").removeClass("online").addClass(cls);
    } else {
      let curr_cls = el[0].className;
      if (curr_cls == "offline") {
        el.removeClass("offline").addClass("online");
      } else {
        el.removeClass("online").addClass("offline");
      }
    }
    el.attr("title", "現在" + el[0].className);
  }

  /** 
   * font size adjustment
   * @param {int} fontSize up/down tick
   */
  function tickFontSize(upDown) {
    if (!upDown) upDown = 0;
    let fontSize = appConfig.fontSize;
    let newFontSize = fontSize + upDown;
    applyFontSize(newFontSize + "px");
    appConfig.fontSize = newFontSize;
  }

  // apply specific fontSize
  function applyFontSize(fontSize) {
    $("body").css("font-size", fontSize);
  }

  //
  // -- message for info and error 
  //

  btn_closePaneMessage.click(function(e) {
    pane_message.hide();
  });

  /**
   * @param {string} msg
   * @param {boolean} fadeout
   *  If it will be true, shows fadeoutable messagebox.
   *  default is true.
   * @param {string} bgcolor
   *  background's color.
   *  default is "#fdfdaf"
   */
  function showMessage(msg, fadeout, bgcolor) {
    if (bgcolor) {
      pane_message.css("background-color", bgcolor);
    } else {
      pane_message.css("background-color", "#fdfdaf");
    }
    if (fadeout == undefined) fadeout = true;
    txt_message.html(msg);
    if (fadeout) {
      pane_message.fadeIn();
      setTimeout(function() {
        pane_message.fadeOut();
      }, 3000);
    } else {
      pane_message.show();
    }
  }

  function showErrorMessage(msg) {
    showMessage(msg, true, "#ffcfcf");
  }


  btn_closePaneRecommend.click(function(e) {
    pane_recommend.hide();
  });

  //
  // -- error handler
  //

  function error(e) {
    console.log("error:", e);
    showErrorMessage("Error: " + e.statusText);
  }

  function errorOnReload(reloadBtn, e) {
    console.log("error:", e);
    let reason;
    if (navigator.isOnline) {
      reason = "正しいデータを取得できませんでした";
    } else {
      reason = "現在オフラインです";
    }
    showErrorMessage("Connection Error: " + reason);
    reloadBtn.removeClass("loading_in_cell");
  }



  $document.on("click", "#readmore", function(e) {
    if (nowloading) return;
    execReadmore();
  });

  btn_addBBSBm.click(function(e) {
    toggleBmStar($(this), true);
  });

  btn_reloadTList.click(function(e) {
    if (nowloading) return;
    console.log("btn_reloadTList url:", $(this).data("url"));
    $("#bbs_title").data("url")
    if (isBookmarkView()) {
      btn_bmlist.trigger("click");
    } else {
      reloadTList();
    }
  });

  btn_readherefilter.click(function(e) {
    let elems;
    let elem;
    if ($(this).hasClass("grayout")) {
      $(this).removeClass("grayout");
      // do filtering readhered thread.
      elems = $("#tlist_row_wrapper .body .row .col.newcnt:empty").parent();
      elems.hide();
    } else {
      // cancel filtering
      $(this).addClass("grayout");
      elems = $("#tlist_row_wrapper .body .row");
      elems.show();
    }
  });

  btn_sortByMomentum.click(function(e) {
    // sort thread list by momentum
    console.log("btn_sortByMomentum");
    let newList;

    function getSortedThreadList(list, attrName, desc) {
      return list.sort(function(a, b) {
        let va = parseFloat(a.getAttribute(attrName));
        let vb = parseFloat(b.getAttribute(attrName));
        if (desc)
          return vb - va;
        else
          return va - vb;
      });
    }

    let list = $('#tlist_row_wrapper .body .row');

    if ($(this).hasClass("grayout")) {
      $(this).removeClass("grayout");
      // sort by momentum DESC
      newList = getSortedThreadList(list, "data-momentum", true);
    } else {
      $(this).addClass("grayout");
      // sort thread list by index ASC (restore sort)
      newList = getSortedThreadList(list, "data-index");
    }

    $('#tlist_row_wrapper .body').append(newList);
  });

  function isBookmarkView() {
    if (bbs_title.data("url") == cmd.bookmarks) {
      return true;
    } else {
      return false;
    }
  }

  function execReadmore() {
    let url = readmore.data("url");
    viewResponses(url, null, true, true);
  }

  function reloadTList() {
    console.log("reloadTList exec.");
    let el = btn_reloadTList;
    let url = el.data("url");
    // let bbs = bbs_title.text();
    let bbs;
    let bbsrow = getBBSRowByURL(url);
    if (bbsrow) bbs = bbsrow.text();
    if (util2ch.isFind2chURL(url)) {
      bbs = "「" + util2ch.getKeywordFromFind2chURL(url) + "」関連スレ";
    }
    // set bbs title. It's re-set again after the below process for getting threadList
    bbs_title.text(bbs);

    // start loading image...
    startLoading();
    el.removeClass("reload24");
    el.addClass("loading_mini");
    //
    btn_readherefilter.addClass("grayout");
    btn_sortByMomentum.addClass("grayout");
    // 
    changeBmStarStyle(url, btn_addBBSBm);
    // loading thread list of the clicked bbs.
    util2ch.getThreadList(url, function(list) {
      // console.log("ThreadList:", list);
      setBBSInfo({
        url: url,
        bbs: bbs
      });
      // draw thread list.
      drawThreadList(list, function() {
        // finish loading image.
        stopLoading();
        el.removeClass("loading_mini").addClass("reload24");
      });
    }, function(e) {
      // finish loading image.
      stopLoading();
      el.removeClass("loading_mini").addClass("reload24");
      let suppl;
      e.status === 0 ? suppl = "Timeout" : suppl = e.status;
      showErrorMessage(`Error: スレッド一覧の取得に失敗しました: ${suppl}`);
    });
  }

  // FIXME: 
  function makeBList(bbsmenu) {

    let parent = blist;
    let tpl = blist_tpl;
    let nextCate;
    let item;
    let nextItem;
    let cateElem;
    let isFirstLoop = true;

    function _createCateElem(categoryName) {
      let elem = tpl.clone().removeClass("tpl").attr("id", null);
      elem.find(".cate0").text(categoryName);
      return elem;
    }

    function _appendBBSToCateElem(item, categoryElem) {
      let li = $("<li class='cate1'></li>")
        .data("url", item.url)
        .text(item.cate1);
      categoryElem.find("ul").append(li);
    }

    // First, clear current bbs list.
    parent.find(".cate").remove();

    for (let len = bbsmenu.length, i = 0; i < len; i++) {
      item = bbsmenu[i];
      if (i + 1 < len) {
        nextItem = bbsmenu[i + 1];
      }
      if (!item || !item.cate0) {
        continue;
      }

      if (isFirstLoop) { // ** when first step of loop
        nextCate = item.cate0;
        // create a category element
        cateElem = _createCateElem(item.cate0);
        isFirstLoop = false;
      } else if (i === len - 1) { // ** when last step of loop
        // create the bbs emelent, then append it to the category element.
        _appendBBSToCateElem(item, cateElem);
        parent.append(cateElem);
        continue;
      }

      _appendBBSToCateElem(item, cateElem);
      nextCate = bbsmenu[i + 1].cate0;
      if (item.cate0 != nextCate) { // ** when just before category change.
        parent.append(cateElem);
        // create a category element
        cateElem = _createCateElem(nextItem.cate0);
      }
    }
  }

  //
  // -- menu icons
  //

  //
  // settings button
  btn_settings.click(function(e) {
    pane_settings.show();
    console.log("pane_settings shown");
    let offset = {
      top: $(this).offset().top + $(this).height() + 2,
      left: $(this).offset().left - pane_settings.width() + $(this).width()
    }
    pane_settings.offset(offset);
    return false;
  });
  $document.on("click", "#pane_settings .setting", function(e) {
    if ($(e.currentTarget).hasClass("disabled")) return;
    pane_settings.hide();
  });
  btn_closePaneSettings.click(function(e) {
    pane_settings.hide();
  });
  // settings - "お気に入り一覧"
  btn_settingBMList.click(function(e) {
    btn_bmlist.trigger("click");
  });
  // settings - "お気に入り登録/削除"
  btn_settingBM.click(function(e) {
    btn_addBm.trigger("click");
  });
  // settings - "スレ内検索"
  btn_settingFind.click(function(e) {
    findbar.show(window.getSelection().toString());
  });
  // settings - "文字サイズ拡大"
  btn_settingSizeUp.click(function(e) {
    tickFontSize(1);
  });
  // settings - "文字サイズ縮小"
  btn_settingSizeDn.click(function(e) {
    tickFontSize(-1);
  });

  // settings - "クラウドに保存"
  btn_settingCloudSave.click(function(e) {
    if ($(this).hasClass("disabled")) return;
    console.log("btn_settingCloudSave");
    let msg = "お気に入り一覧などの環境をクラウドにアップロードしますか？" +
      "<br>※回線状況やデータ量次第では少し時間が掛かる場合もあります";
    showDialogYN(msg, function() {
      // *** YES button clicked
      makeCloudMenuDisabled(true); // make menu disabled
      saveBookmarksToCloud(function() { // save bookmarks to cloud
        saveReadheresToCloud(function() { // save readheres to cloud
          showMessage("成功：お気に入りなどをクラウドに保存しました", false);
          makeCloudMenuDisabled(false);
        }, function() {
          showErrorMessage("<font color='red'>エラー：「ここまで読んだ」をクラウド保存できませんでした</font>", false);
          makeCloudMenuDisabled(false);
        }); // saveReadheresToCloud
      }, function() {
        showErrorMessage("<font color='red'>エラー：クラウド保存に失敗しました</font>", false);
        makeCloudMenuDisabled(false);
      }); // saveBookmarksToCloud
      pane_dialogYN_wrapper.hide();
    }, function() {
      // *** NO button clicked
      pane_dialogYN_wrapper.hide();
    }); // showDialogYN
  });

  // settings - "クラウドからロード"
  btn_settingCloudLoad.click(function(e) {
    if ($(this).hasClass("disabled")) return;
    console.log("btn_settingCloudLoad");
    let msg = "お気に入り一覧などの環境をクラウドからダウンロードしますか？" +
      "<br>※回線状況やデータ量次第では少し時間が掛かる場合もあります";
    showDialogYN(msg, function() {
      // *** YES button clicked
      makeCloudMenuDisabled(true); // make menu disabled
      loadFromCloud("bookmarks", function() { // load bookmarks from cloud
        loadFromCloud("readheres", function() { // load readheres from cloud
          showMessage("成功：お気に入りなどをクラウドから読み込みました", false);
          makeCloudMenuDisabled(false);
        }, function() {
          showErrorMessage("<font color='red'>エラー：「ここまで読んだ」のクラウド読込に失敗しました</font>", false);
          makeCloudMenuDisabled(false);
        }); // loadFromCloud "readheres"
      }, function() {
        showErrorMessage("<font color='red'>エラー：クラウド読込に失敗しました</font>", false);
        makeCloudMenuDisabled(false);
      }); // loadFromCloud "bookmarks"
      pane_dialogYN_wrapper.hide();
    }, function() {
      // *** NO button clicked
      pane_dialogYN_wrapper.hide();
    }); // showDialogYN
  });

  // make the cloudLoad/Save menu buttons disabled/enabled.
  function makeCloudMenuDisabled(bool) {
    if (bool === undefined) bool = true;
    if (bool === true) {
      btn_settingCloudLoad.addClass("disabled");
      btn_settingCloudSave.addClass("disabled");
    } else {
      btn_settingCloudLoad.removeClass("disabled");
      btn_settingCloudSave.removeClass("disabled");
    }
  }

  // settings - "設定"
  btn_settingConfig.click(function(e) {
    openConfPane();
  });
  // settings - "About"
  btn_settingAbout.click(function(e) {
    window.open(CWS_URL);
  });
  // settings - "終了"
  btn_settingQuit.click(function(e) {
    window.close();
  });

  // tool icon buttons' effect
  $("#tools .btn").click(function(e) {
    if ($(this).hasClass("disabled")) return;
    let options = {};
    $(this).effect("puff", options, 300, function(e) {
      $(this).css("display", "block");
    });
  });

  // History button
  btn_history.click(function(e) {
    console.log("btn_history");
    if ($(this).hasClass("disabled")) return;
    popupHistoryMenus(e);
  });

  function popupHistoryMenus(evt, callback) {
    let history = util2ch.getHistory();
    let curURL = txt_url.data("url");
    let curIdx = util2ch.getIdxInHistory(curURL);
    if (!history) return;
    let df = $(document.createDocumentFragment());
    for (let i = 0, len = history.length; i < len; i++) {
      let row = $('<div class="row" data-url="' + history[i].url + '">' + history[i].title + '</div>');
      if (curIdx === i) {
        row.addClass("current");
      }
      df.append(row);
    }
    // create menu element
    menu_historyURLs
      .empty()
      .append(df);
    // show
    if (evt) {
      menu_historyURLs.show()
        .offset({
          top: evt.clientY - 2,
          left: evt.clientX - 2
        });
      // prevent to make this pane disappeared by firing window click event (see hideIfUnhovered())
      evt.stopPropagation();
    }
    callback && callback();
  }

  $document.on("click", "#menu_historyURLs .row", function(e) {
    let url = $(this).data("url");
    goFromHistory(url);
    menu_historyURLs.hide();
  });

  /**
   * go back history from menu_historyUrls
   * @param {int} step
   *  Back step counts from current URL in history
   *  If step <= -1, it does not means "back" but "forward"
   */
  function goBackFromHistory(step) {
    // create menu element
    popupHistoryMenus(null, function() {
      let curIdx = menu_historyURLs.find(".row.current").index();
      let maxIdx = menu_historyURLs.find(".row").length - 1;
      let targetIdx = curIdx + step;
      if (targetIdx > maxIdx || targetIdx <= -1) return;
      let targetHist = $("#menu_historyURLs .row:eq(" + targetIdx + ")");
      let url = targetHist.data("url");
      goFromHistory(url);
    });
  }

  // jump from history
  function goFromHistory(url) {
    // set marker to the current history url
    menu_historyURLs.find("div").removeClass("current");
    menu_historyURLs.find("div[data-url='" + url + "']").addClass("current");
    if (url) {
      viewResponses(url, null, false, false);
    }
  }


  // Toggle bm star.
  btn_addBm.click(function(e) {
    toggleBmStar($(this), false);
  });

  function toggleBmStar(btn_elem, isBBSBm) {
    let url, title, tlist_url, resnum;
    if (isBBSBm) { // when bbs bookmark...
      url = bbs_title.data("url");
      title = bbs_title.text();
      tlist_url = bbs_title.data("url");
      resnum = undefined;
    } else { // when thread bookmark
      url = thread_title.data("url");
      title = thread_title.data("title");
      tlist_url = bbs_title.data("url");
      resnum = thread_title.data("resnum");
    }
    if (!url || !title) {
      return;
    }
    if (btn_elem.attr("class") == "btn star_on24" || btn_elem.attr("class") == "icon star_on24") {
      // remove from bookmark.
      removeBookmark(url);
      // if bookmarks pane is displayed, remove the row of the bookmarked url from there.
      if (tlist_url == cmd.bookmarks) {
        removeFromTListPane(url);
      }
      styleBmStar(btn_elem, false);
    } else {
      // add to bookmark.
      saveBookmark(url, title, resnum);
      // if bookmarks pane is displayed, add the row of the bookmarked url to there.
      if (tlist_url == cmd.bookmarks) {
        addToTListPane();
      }
      styleBmStar(btn_elem, true);
    }
  }

  function removeFromTListPane(url) {
    let row = getTListRowByURL(url);
    if (row) row.remove();
  }

  function addToTListPane() {
    btn_bmlist.trigger("click");
  }

  function getTListRowByURL(url) {
    let rows = $("#tlist .body .row");
    for (let len = rows.length, i = 0; i < len; i++) {
      let row = $(rows[i]);
      if (row.data("url") == url) {
        return row;
      }
    }
    return null;
  }

  function getBBSRowByURL(url) {
    let rows = $("#blist .cate1");
    for (let len = rows.length, i = 1; i < len; i++) { // starts index 1 cause index 0 is a row for template.
      let row = $(rows[i]);
      if (row.data("url") == url) {
        return row;
      }
    }
    return null;
  }

  // flg=true: "star_on", flg=false: "star_on disabled".
  function styleBmStar(btn_elem, flg) {
    if (flg) {
      btn_elem.removeClass("grayout").prop("title", "お気に入りから削除");
    } else {
      btn_elem.addClass("grayout").prop("title", "お気に入りに登録");
    }
  }

  btn_arrowUp.click(function() {
    if ($(this).hasClass("disabled")) return;
    thread.animate({
      scrollTop: 0
    }, 100);
  });
  btn_arrowDn.click(function() {
    if ($(this).hasClass("disabled")) return;
    let target = $("#res_wrapper .res").last();
    let h = thread[0].scrollHeight;
    thread.animate({
      scrollTop: h
    }, 100);
  });
  btn_jumpToReadhere.click(function() {
    if ($(this).hasClass("disabled")) return;
    let resElem = readhere.prev();
    scrollToTheRes(resElem);
  });
  rng_divider.on("input change", function() {
    appConfig.dividerPos = parseInt($(this).val());
    redraw();
  });

  function scrollToTheRes(resElem) {
    let ot = resElem.offset().top;
    let st = thread.scrollTop();
    thread.animate({
      scrollTop: st + ot - 120
    }, 100);
  }


  //
  // -- xpic.sc
  //

  /**
   * if "http://xpic.sc/" or "http://xpic.sc", replace to "xpic.sc/b/"
   * else return the param's url as it is
   */
  function optimizeXpicURL(url) {
    if (util2ch.isXpicBBSRootURL(url)) {
      url = util2ch.complementSlash(url);
      url += "b/";
      return url;
    } else {
      return url;
    }
  }


  //
  // -- cloud save/load
  //

  function createCloudQuery(filename, mimeType) {
    let params = [];
    let ret = "";
    if (filename) params.push("title='" + filename + "'");
    if (mimeType) params.push("mimeType='" + mimeType + "'");
    if (params.length >= 1) ret = params.join(" and ");
    return ret;
  }

  function saveBookmarksToCloud(onSuccess, onError) {
    let storename = "bookmarks";
    let label = "お気に入り";
    // get auth then upload the json 
    gdriveutil.auth(true, function() {
      console.log("accessToken", gdriveutil.getToken());
      //
      // -- export "bookmarks" store as json from indexeddb
      idbutil.export(storename, "update", "prev", function(jsonstr) {
        // save json to cloud
        saveJSONToCloud(jsonstr, storename + ".json", function(resp) {
          console.log("upload json completed. storename=", storename, " resp=", resp);
          onSuccess && onSuccess();
        }, function() {
          console.log("upload json error. storename=", storename);
          onError && onError();
        }); // saveJSONToCloud
      }); // export
    }); // auth
  }

  function saveReadheresToCloud(onSuccess, onError) {
    let storename = "readheres";
    // get auth then upload the json 
    gdriveutil.auth(true, function() {
      console.log("accessToken", gdriveutil.getToken());
      // -- export "redheres" store as json from indexeddb
      idbutil.export(storename, null, null, function(jsonstr) {
        // save json to cloud
        saveJSONToCloud(jsonstr, storename + ".json", function(resp) {
          console.log("upload json completed. storename=", storename, "resp=", resp);
          onSuccess && onSuccess();
        }, function() {
          console.log("upload json error. storename=", storename);
          onError && onError();
        }); // saveJSONToCloud
      }); // export
    }); // auth
  }

  function loadFromCloud(storename, onSuccess, onError) {
    // get auth then download the json
    gdriveutil.auth(true, function() {
      console.log("accessToken", gdriveutil.getToken());
      // load json from cloud
      loadJSONFromCloud(storename + ".json", function() {
        console.log("loadJSONFromCloud completed. storename=", storename);
        onSuccess && onSuccess();
      }, function() {
        console.log("loadJSONFromCloud error. storename=", storename);
        onError && onError();
      }); // loadJSONFromCloud
    }); // auth
  }

  function saveJSONToCloud(jsonstr, filename, onComplete, onError) {
    let mimeType = "application/json";
    console.log("jsonstr", jsonstr);
    let file = new Blob([jsonstr], {
      type: mimeType
    });
    let q = createCloudQuery(filename, mimeType);
    gdriveutil.getFile(q, function(items) {
      let opts = {
        // chunkSize: 0,
        metadata: {
          title: filename,
          mimeType: mimeType,
          parents: [{
            'id': 'appfolder' // need to get appfolder's file
          }]
        },
        file: file
      };
      if (items && items.length >= 1) {
        let item = items[0];
        opts.fileId = item.id;
      }
      gdriveutil.upload(opts, onComplete, onError);
    }); // getFile
  }

  function loadJSONFromCloud(filename, onComplete, onError) {
    let mimeType = "application/json";
    let q = createCloudQuery(filename, mimeType);
    gdriveutil.getFile(q, function(items) {
      if (items && items.length >= 1) {
        let item = items[0];
        gdriveutil.download(item.downloadUrl, function(resp) {
          console.log("resp=", resp);
          // import to indexeddb
          let storename = filename.slice(0, -".json".length);
          idbutil.import(storename, resp, function() {
            console.log("import has done. storename=", storename);
            onComplete && onComplete();
          }, function() {
            console.warn("import error. storename=", storename);
            onError && onError();
          }); // import
        }); // download
      }
    }, function(resp) {
      console.log("error: resp=", resp);
      onError && onError();
    }); // getFile
  }

  //
  // -- layouts
  //

  // refresh layouts.
  redraw();

  window.onresize = function(e) {
    redraw();
  }

  function redraw() {
    let ww = $window.width();
    let wh = $window.height();

    //
    // #tlist and #thread height setting
    let properTblHeight = wh - tlist_row_wrapper.offset().top;
    tlist_row_wrapper[0].style.maxHeight = properTblHeight + "px";
    // let properThreadHeight = wh;
    // thread[0].style.minHeight = properThreadHeight + "px";
    // thread[0].style.height = properThreadHeight + "px";

    //
    // #tlist and #thread width setting
    let tlist_w = ww * appConfig.dividerPos / 100; // for left pane
    let thread_w = ww - tlist_w - 46; // for right pane
    tlist[0].style.width = tlist_w + "px";
    tlist_header[0].style.width = (tlist_w - 20) + "px";
    let ttitle_col_w = tlist_w - (124); // = tlist_w - (.rescnt + .newcnt)
    $("#tlist_row_wrapper .ttitle").width(ttitle_col_w);
    thread[0].style.right = "0px";
    thread[0].style.width = thread_w + "px";
    thread_title[0].style.right = "10px"; // following scrollbar width
    thread_title[0].style.width = thread_w + "px";
    // when width of the pane <= 0, hide itself.
    if (tlist_w <= 0) {
      tlist[0].style.display = "none";
    } else {
      tlist[0].style.display = "block";
    }
    if (thread_w <= 0) {
      thread[0].style.display = "none";
    } else {
      thread[0].style.display = "block";
    }
  }

  $document.on("mouseenter", ".refpop", function() {
    console.log("mouseenter");
    // remove refpops of upper layer of an refpop onmoused.
    removeRefpops(this);
  });
  $document.on("mouseleave", ".refpop", function() {
    console.log("mouseleave");
    // if most upper layer, remove itself.
    let lastIdx = refpops.length - 1;
    if (refpops[lastIdx] === this) {
      removeRefpop(lastIdx);
    }
  });
  $document.on("click", ".refpop", function() {
    console.log("refpop clicked.");
  });
  $document.on("keydown", "body", function(e) {
    console.log("body keydown.", e.keyCode);
    if (e.keyCode == 27) { // *** ESC key down
      removeRefpops(); // hide refpop
      menu_historyURLs.hide(); // hide history pane
      pane_settings.hide(); // hide settings menu
      closeConfPane(); // hide conf pane
      stopLoading();
    }
  });


  /**
   *
   * @param query
   *  key: "resnum" | "handle" | "email" | "uid" | "refered"
   *  value: ex. 999, "1-999", "名無しさん", "aaa@bbb.com", "XXXXXXXXO0"
   * @param e
   *  event
   */
  function showRefpop(query, e) {
    let refpop = $(document.createElement("div"));
    refpop.addClass("refpop").addClass("res_wrapper");
    refpop.css("overflow", "auto");
    // get res by resnum
    let html = "";
    let key = query.key;
    let value = query.value;
    if (key == "resnum") {
      if ($.isNumeric(value)) {
        // get res by resnum
        html = getResHTML(value);
      } else if (value.match(/\d+\-\d+/)) {
        // get reses by range.
        let arr = value.match(/(\d+)\-(\d+)/);
        let from = Number(arr[1]);
        let to = Number(arr[2]);
        html = getResHTML(from, to);
      }
    } else {
      // get reses by any other query
      html = getResHTML(1, 1000, query);
    }
    if (!html) return;
    refpop.html(html);
    refpop.appendTo(body);
    adjustRefpopPos(refpop, e); // adjust top/left position
    refpops.push(refpop[0]); // push raw element but not jquery element
  }

  function getResHTML(from, to, query) {
    let html = "";
    let txt, tmp, res, res_clone;
    if (!to) to = from;
    for (i = from; i <= to; i++) {
      res = $("#resnum" + i);
      if (query && query.key == "refered") {
        // get reses which refers the target res. 
        tmp = res.find(".content a[data-resnum=" + query.value + "]").text();
        if (!tmp) continue;
      } else if (query) {
        // filtering by condition
        txt = res.find(".res_header ." + query.key).text();
        if (txt != query.value) continue;
      }
      res_clone = res.clone()
        .attr("id", null); // prevents any troubles of double ID;
      if (res_clone[0]) {
        // remove unwanted elements. 
        res_clone.find(".btn_readhere").remove();
        // display also any responses disappeared by filtering
        res_clone[0].style.display = "block";
        html += res_clone[0].outerHTML;
        res_clone = undefined;
      }
    }
    return html;
  }

  // if param "onmoused" is null, remove all refpops.
  function removeRefpops(onmoused) {
    if (onmoused) {
      let flg = false;
      for (let len = refpops.length, i = 0; i < len; i++) {
        if (onmoused === refpops[i]) {
          flg = true;
          continue;
        }
        if (flg)
          removeRefpop(i);
      }
    } else {
      // remove all refpops
      for (let len = refpops.length, i = 0; i < len; i++) {
        removeRefpop(0);
      }
    }
  }

  function removeRefpop(targetIdx) {
    if (refpops[targetIdx]) refpops[targetIdx].remove(); // visibility hidden.
    refpops.splice(targetIdx, 1); // object remove.
  }

  // get resnum from bookmark's or readhere's store by key=url
  function getReadhereFromStore(daturl, cb) {
    console.log("getReadhereFromStore", daturl);
    let ret;
    // First, get resnum from bookmarks.
    getBookmark(daturl, function(bm) {
      if (bm) {
        ret = bm.res;
        cb(ret);
        return;
      } else {
        // If can not get resnum from bookmarks store, try to get it from readheres store.
        idbutil.get("readheres", daturl, function(data) {
          console.log("data", data);
          if (data && data.res) {
            ret = data.res;
          }
          cb(ret);
          return;
        });
      }
    }); // getBookmark
  }

  // save readhere info to store
  function saveReadhereToStore(daturl, resnum) {
    console.log("saveReadhereToStore", daturl, resnum);
    let data = {
      url: daturl,
      res: resnum
    };
    idbutil.update("readheres", data);
    // get the bookmark from store
    getBookmark(daturl, function(bm) {
      // update the bookmark 
      if (!bm) return;
      bm.res = resnum;
      idbutil.update("bookmarks", bm);
    });
  }
  // remove readhere from store
  function removeReadhereFromStore(daturl) {
    idbutil.remove("readheres", daturl);
  }

  // get bookmarks from store
  function getAllBookmarks(cb) {
    console.log("getAllBookmarks");
    let col = "update";
    let range = null;
    let direction = "prev";
    idbutil.list("bookmarks", col, range, direction, function(data) {
      cb(data);
    });
  }
  // get a bookmark from store by key
  function getBookmark(daturl, cb) {
    console.log("getBookmark", daturl);
    idbutil.get("bookmarks", daturl, function(data) {
      cb(data);
    });
  }
  // save a bookmark to store
  function saveBookmark(daturl, title, resnum) {
    console.log("saveBookmark");
    let update = new Date().getTime();
    let data = {
      url: daturl,
      title: title,
      res: resnum,
      update: update
    };
    idbutil.update("bookmarks", data);
  }
  // remove a bookmark from store
  function removeBookmark(daturl) {
    console.log("removeBookmark");
    idbutil.remove("bookmarks", daturl);
  }


  /**
   * adjust popup window's position.
   * if elem(popup) would leave out of screen, adjusts it's position into screen.
   *
   * @param pu
   *    popup element
   * @param e
   *    click event
   */
  function adjustRefpopPos(pu, e) {
    let rtx = e.clientX + pu.width(); // right top X
    let rby = e.clientY + pu.height(); // right bottom Y
    let WW = $window.width();
    let WH = $window.height();
    let top = e.clientY - 16; // "-16" is for creating refpop under mouse cursor.
    let left = e.clientX - 18; // "-18" is for creating refpop under mouse cursor.
    if (rtx >= WW) {
      left -= rtx - WW;
    }
    if (rby >= WH) {
      top -= rby - WH;
    }
    pu.css("top", top + "px");
    pu.css("left", left + "px");
  }

  //
  // -- restool box

  // show toolBox on hover the res.
  $document.on({
    mouseenter: function() {
      //stuff to do on mouse enter
      $(this).find(".restool").css("visibility", "visible");
    },
    mouseleave: function() {
      //stuff to do on mouse leave
      $(this).find(".restool").css("visibility", "hidden");
    }
  }, ".res");

  // reply button click
  $document.on("click", ".restool .btn_reply", function() {
    let repmsg = createReplyMessage($(this).parent().parent());
    btn_showPaneWrite.trigger("click", [{
      // from: "",
      email: "sage",
      msg: repmsg
    }]);
  });
  // readhere button click
  $document.on("click", ".restool .btn_readhere", function() {
    let resdiv = $(this).parent().parent();
    let url = thread_title.data("url");
    let lastResnum = getLastResnumOfThreadPane();
    let curResnum = parseInt(resdiv.find(".num").text());
    // insert readhere element
    readhere.insertAfter(resdiv).show();
    btn_jumpToReadhere.removeClass("disabled");
    // save the last resnum into readhere's store
    saveReadhereToStore(url, curResnum);
    // update also rescnt col in the thread list
    let newcnt = lastResnum - curResnum;
    let selectedRow = tlist_row_wrapper.find("[data-url='" + url + "']");
    if (selectedRow[0]) {
      // update the text of ".rescnt" col of the selected row
      selectedRow.find(".rescnt").text(lastResnum);
      // zero-init the text of ".newcnt" col of the selected row
      selectedRow.find(".newcnt").text(newcnt);
    }
  });

  function getLastResnumOfThreadPane() {
    let lastResnum;
    lastResnum = $(".res[id]").last().attr("id").split("resnum")[1];
    return parseInt(lastResnum);
  }

  function getLastResIdxOfThreadPane() {
    let lastResIdxum;
    lastResIdx = $(".res[id]").length - 1;
    return parseInt(lastResIdx);
  }

  /**
   * create replying message for the specific res
   * @param {element} resElem
   *  jquery element selectored '.res'
   */
  function createReplyMessage(resElem) {
    let ret;
    let num = resElem.find(".res_header .num").text();
    let htmlcontent = resElem.find(".content")
      .html()
      .replace(/<br\s*[\/]?>/gi, '\\n> '); // replace <br> with '\n>'
    let txtcontent = $("<div>" + htmlcontent + "</div>")
      .text() // html to text
      .replace(/'/gi, "\\'"); // escape
    ret = ">>" + num + '\\n> ' + txtcontent;
    return ret;
  }


  //
  // -- filter functions

  function filterTList(txt) {
    // -- filtering TList.
    let re = new RegExp(txt, "i");
    let parent_cloned = $("#tlist_row_wrapper .body").clone();
    let rows_cloned = parent_cloned.find(".row");
    let row;
    for (let len = rows_cloned.length, i = 0; i < len; i++) {
      row = rows_cloned[i];
      if (!txt || row.children[0].title.search(re) >= 0) {
        row.style.display = "block";
      } else {
        row.style.display = "none";
      }
    }
    $("#tlist_row_wrapper .body").replaceWith(parent_cloned);
  }

  function filterRes(txt) {
    // -- filtering res.
    let re = new RegExp(txt, "i");
    let parent_cloned = $("#res_wrapper").clone();
    let rows_cloned = parent_cloned.find(".res");
    let row;
    for (let len = rows_cloned.length, i = 0; i < len; i++) {
      row = rows_cloned[i];
      if (!txt || row.innerText.search(re) >= 0) {
        row.style.display = "block";
      } else {
        row.style.display = "none";
      }
    }
    $("#res_wrapper").replaceWith(parent_cloned);
  }

  //
  // -- Configurations
  // 

  $("#sel_themes").on("change", function(e) {
    let theme = $(this).val();
    applyTheme(theme);
    // save to appConfig
    appConfig.theme = theme;
  });

  $("#txt_confFontSize").on("change", function(e) {
    let val = $(this).val();
    if ($.isNumeric(val)) {
      applyFontSize(val + "px");
      // save to appConfig
      appConfig.fontSize = parseInt(val);
    } else {
      $(this).val(appConfig.fontSize);
    }
  });

  $("#ta_confNGWords").on("change", function(e) {
    let val = $(this).val();
    if (!val) {
      appConfig.ngWords = undefined;
      return;
    }
    appConfig.ngWords = val.split("\n");
  });

  $('input[type=radio][name=rdo_appInWindow').on("change", function() {
    let val = $(this).val();
    if (!val) {
      appConfig.appInWindow = 1;
    }
    appConfig.appInWindow = parseInt(val);
    applyAppInWindow(appConfig.appInWindow);
  });

  function applyAppInWindow(flag) {
    chrome.storage.sync.set({ "appInWindow": flag });
  }

  $('input[type=radio][name=rdo_autoImgLoad]').on("change", function() {
    let val = $(this).val();
    if (!val) {
      appConfig.autoImgLoad = 0;
    }
    appConfig.autoImgLoad = parseInt(val);
    // apply to the elements
    applyAutoImgLoad(appConfig.autoImgLoad);
  });

  function applyAutoImgLoad(flag) {
    if (flag === 1) {
      addAutoImgLoadInviewListener();
    } else {
      removeAutoImgLoadInviewListener();
    }
  }

  function getThemes(onSuccess, onError) {
    let ret = [];
    chrome.runtime.getPackageDirectoryEntry(function(root) {
      root.getDirectory("themes", {
        create: false
      }, function(dirEntry) {
        let dirReader = dirEntry.createReader();
        dirReader.readEntries(function(entries) {
          for (let len = entries.length, i = 0; i < len; i++) {
            let entry = entries[i];
            if (entry.isDirectory) {
              console.log('Directory: ' + entry.fullPath + ", " + entry.name);
              ret.push(entry.name);
            }
          }
          onSuccess(ret);
          return;
        }, onError); // dirReader.readEntries
      }, onError); // getDirectory
    }); // getPackageDirectoryEntry
  }

  // reflect the theme to mainWindow
  function applyTheme(theme) {
    let themepath;
    if (theme == "default") {
      themepath = "themes/theme.css";
    } else {
      themepath = "themes/" + theme + "/" + theme + ".css";
    }
    $('link[rel="stylesheet"][data-custom-theme]')[0].href = themepath;
  }

  function applyDividerPos(pos) {
    rng_divider.val(pos);
    rng_divider.change(); // trigger "input change".
  }

  $("#btn_closeConfPane").click(closeConfPane);


  function openConfPane() {
    console.log("openConfPane");
    pane_confBg.show();
    // font
    setConfFontSize();
    // theme
    setConfThemeOptions();
    // NG words
    setConfNGWords();
    // img auto-loading
    setConfAutoImgLoad();
    // start in new window
    setConfAppInWindow();
  }

  function closeConfPane() {
    console.log("closeConfPane");
    pane_confBg.hide();
    // saveAppConfig();
  }

  function setConfFontSize() {
    txt_confFontSize.val(appConfig.fontSize);
  }

  // create themes list if themes.length <= 1 ('default' only)
  function setConfThemeOptions() {
    let sel_themes = $("#sel_themes");
    let sel_themes_len = $("#sel_themes option").length;
    if (sel_themes_len <= 1) {
      getThemes(function(themes) {
        let theme;
        let themename;
        for (let len = themes.length, i = 0; i < len; i++) {
          theme = themes[i];
          themename = theme.split("theme-")[1];
          sel_themes.append('<option value="' + theme + '">' + themename + '</option>');
        }
        // make current theme 'selected'
        let currentTheme = appConfig.theme;
        if (!currentTheme) currentTheme = "default";
        $("#sel_themes").val(currentTheme);
      });
    }
  }

  function setConfNGWords() {
    if (!appConfig.ngWords) return;
    ta_confNGWords.val(appConfig.ngWords.join("\n"));
  }

  function setConfAutoImgLoad() {
    let autoImgLoad = appConfig.autoImgLoad;
    if (autoImgLoad === undefined) return;
    if (autoImgLoad === 1) rdo_autoImgLoad_on.prop("checked", true);
    if (autoImgLoad === 0) rdo_autoImgLoad_off.prop("checked", true);
  }

  function setConfAppInWindow() {
    let appInWindow = appConfig.appInWindow;
    if (appInWindow === undefined) return;
    if (appInWindow === 1) rdo_appInWindow_on.prop("checked", true);
    if (appInWindow === 0) rdo_appInWindow_off.prop("checked", true);
  }

  // save appConfig to localStorage
  function saveAppConfig() {
    console.log("saveAppConfig");
    let appConfigStr = JSON.stringify(appConfig);
    chrome.storage.sync.set({
      'appConfig': appConfigStr
    }, function() {
      console.log('appConfig has been saved to localStorage. Stringified appConfig: ', appConfigStr);
    });
  }

  // load appConfig from localStorage
  function loadAppConfig(cb) {
    console.log("loadAppConfig");
    chrome.storage.sync.get("appConfig", function(items) {
      let appConfigStrInStorage = items.appConfig;
      let appConfigInStorage;
      console.log("appConfig in storage:", appConfigInStorage);
      if (appConfigStrInStorage) {
        let appConfigInStorage = JSON.parse(appConfigStrInStorage);
        for (let k in appConfigInStorage) {
          console.log(k, appConfigInStorage[k]);
          appConfig[k] = appConfigInStorage[k];
        }
      } else {
        console.log("set appConfig as default because no appConfig in the storage.");
      }
      cb();
    });
  }

  // clear appConfig in localStorage
  function clearAppConfig() {
    console.log("clearAppConfig");
    chrome.storage.sync.remove("appConfig", function() {
      console.log("Cleared appConfig in localStorage.");
    });
  }

});
