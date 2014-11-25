/**
 * niichrome 2ch browser
 *
 * @version 0.12.2
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
  chrome.app.window.current().maximize();

  var request = niichrome.request();
  var util2ch = niichrome.util2ch();
  var idbutil = niichrome.idbutil("niichromedb", 1);
  var amazonutil = niichrome.amazonutil();
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
    dividerPos: 50 // 2PaneDivider's X position (percent)
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
    /* apply configs to window */
    // fontSize
    applyFontSize(appConfig.fontSize);
    // theme 
    applyTheme(appConfig.theme);
    // adjust divider range
    rng_divider.val(appConfig.dividerPos);
  });

  //
  // -- set up indexedDB
  //
  idbutil.openDB([
    /* -- stores -- */

    /*
      [snapshots]
      Used for storeing thread list (url & resnum) of each bbs.
      Props:
        url(key):
          bbs's url or command (eg.'bookmarks')
          eg. "http://hoge.com/bbs1/"
        ss:
          pair of dat's URL and resNum 
          eg. { "http://hoge.com/bbs1/dat/222.dat": 123, "http://hoge.com/bbs1/dat/222.dat": 345 ... }
    */
    // {
    //   storename: 'snapshots',
    //   keyPath: 'url',
    //   autoIncrement: false
    // },

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

  // for appearing history urls on Back & Forward button's long press.
  var pressTimer;

  //
  // -- UI controls
  //
  var $window = $(window);
  var $document = $(document);
  var btn_arrowBack = $("#btn_arrowBack");
  var btn_arrowForward = $("#btn_arrowForward");
  var btn_arrowUp = $("#btn_arrowUp");
  var btn_arrowDn = $("#btn_arrowDn");
  var btn_arrowUpTList = $("#btn_arrowUpTList");
  var btn_arrowDnTList = $("#btn_arrowDnTList");
  var btn_showPaneWrite = $("#btn_showPaneWrite");
  var btn_addBm = $("#btn_addBm");
  var rng_divider = $("#rng_divider");
  var readmore = $("#readmore");
  var readhere = $("#readhere");
  var btn_closeReadhere = $("#btn_closeReadhere");
  var fetchline = $("#fetchline");
  var btn_jumpToReadhere = $("#btn_jumpToReadhere");
  var lbl_kakolog = $("#lbl_kakolog");
  var thread = $("#thread");
  var tlist = $("#tlist");
  // var tlist_body = $("#tlist .body");
  var blist = $("#blist");
  var blist_toggle_bar = $('#blist_toggle_bar');
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
  var btn_settingFind = $("#btn_settingFind");
  var btn_settingConfig = $("#btn_settingConfig");
  var btn_settingAbout = $("#btn_settingAbout");
  var btn_settingQuit = $("#btn_settingQuit");

  txt_url.focus();

  //
  // -- window onload
  //
  window.onload = function(e) {
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
    var data = e.originalEvent.data;
    //console.log("window onmessage:", data);
    // If successed to write, close webview's pane.
    if (data && data.title == "書きこみました。") {
      pane_wv[0].style.visibility = "hidden";
      execReadmore();
    }
  });

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
    var elem;
    for (var i = 0, len = elems.length; i < len; i++) {
      elem = elems[i];
      if (!isMouseHovered(elem, e)) elem.hide();
    }
  }

  function isMouseHovered(elem, evt) {
    var vRangeStart = elem.offset().top;
    var vRangeEnd = vRangeStart + elem.height();
    var hRangeStart = elem.offset().left;
    var hRangeEnd = hRangeStart + elem.width();
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
          btn_arrowForward.trigger("click");
          break;
        case 37: // Alt+Left
          event.preventDefault();
          console.log('Alt+Left');
          btn_arrowBack.trigger("click");
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
    var url = $(this).data("url");
    var bbs = $(this).text();
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
    var marginLeft;
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
    blist_wrapper.stop().animate({
      'marginLeft': marginLeft
    }, 200);
  }

  btn_bmlist.on("click", function() {
    console.log("btn_bmlist click");
    toggleBBSList(false);
    // make the threadList reloading button disabled, because bookmarkList is unreloadable.
    // btn_reloadTList.hide();
    setBBSInfo({
      url: cmd.bookmarks,
      bbs: "お気に入り"
    });
    getAllBookmarks(function(list) {
      console.log("list", list);
      drawThreadList(list);
      setResCountAndNewCountOnBM();
    });
  });

  // get and set the latest rescounts and newcounts of bookmarked threads.
  function setResCountAndNewCountOnBM() {
    var elems = $("#tlist .body > div");
    var cnt = elems.length;
    elems.each(function() {
      var el = $(this);
      var rescntEl = el.find(".col.rescnt");
      var newcntEl = el.find(".col.newcnt");
      var url = el.data("url");
      // get latest rescount of this thread
      util2ch.getLatestResnum(url, function(rescnt) {
        console.log(rescnt);
        rescntEl.text(rescnt);
        // calc newcount and set.
        getReadhereFromStore(url, function(rescntInBM) {
          if (!rescntInBM) return;
          var newcnt = rescnt - rescntInBM;
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
    var msg = "「ここまで読んだ」履歴を<br>削除しますか？";
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
      var url = $(this).val().trim();
      if (!url) return;

      // prettify read.cgi URL 
      // eg.: read.cgi/xxxxx/l50 → read.cgi/xxxxx/
      url = util2ch.prettifyReadCGIURL(url);

      if (!isCommand(url) &&
        !util2ch.isBBSURL(url) &&
        !util2ch.isReadCGIURL(url) &&
        !util2ch.isDatURL(url)) {
        // If url is neither commands nor 2ch's URL, it means keywords to search.
        // url = util2ch.getFind2chURL(url);
        url = util2ch.getDig2chURL(url);
      }
      $(this).val(url);


      if (InputValidator.txt_url()) {
        console.log("txt_url input data is valid");
        $(this).data("url", url);
        if (util2ch.isBBSURL(url) || util2ch.isDig2chURL(url)) {
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

  btn_showPaneWrite.click(function(e, data) { // data = { from:, mail:, msg: }
    console.log("btn_showPaneWrite");
    if ($(this).hasClass("disabled")) return;
    pane_wv[0].style.visibility = "visible";
    // insert css
    wv[0].insertCSS({
      code: "div > div,iframe,dl,a,hr { display: none; } " +
        "form { display: block; } " +
        "h1 { padding: 12px 2px 12px 2px; } "
    });
    // preset anything into write form's input.
    var from = "";
    var mail = "sage";
    var msg = "";
    if (data) {
      if (data.from) from = data.from;
      if (data.mail) mail = data.mail;
      if (data.msg) msg = data.msg;
    }
    // execute script
    wv[0].executeScript({
      code: "var ipt_from = document.getElementsByName('FROM')[0]; ipt_from.value = '" + from + "';" +
        "var ipt_mail = document.getElementsByName('mail')[0]; ipt_mail.value = '" + mail + "';" +
        "var ta_msg = document.getElementsByName('MESSAGE')[0]; ta_msg.value = '" + msg + "';"
    });
  });

  btn_closeWv.click(function(e) {
    console.log("btn_closeWv");
    pane_wv[0].style.visibility = "hidden";
  });

  function initWriteForm() {
    wv[0].addEventListener("loadcommit", function() {
      // insert css
      wv[0].insertCSS({
        code: "div > div,iframe,dl,a,hr { display: none; } " +
          "form { display: block; } " +
          "h1 { padding: 12px 2px 12px 2px; } "
      });
      // execute script
      wv[0].executeScript({
        code: "window.addEventListener('message', function(e){" +
          "  console.log('Received:', e.data);" +
          "  if(e.data.command == 'getTitle'){" +
          "    console.log('Sending title...');" +
          "    e.source.postMessage({ title: document.title }, e.origin);" +
          "    if(document.title == e.data.ttitle) document.getElementById('backBtn').style.display = 'none';" +
          "  }" +
          "});" +
          "var backBtn = document.getElementById('backBtn');" +
          "if (!backBtn) {" +
          "  backBtn = document.createElement('div');" +
          "  backBtn.setAttribute('id', 'backBtn');" +
          "  backBtn.innerText = '< Back';" +
          "  backBtn.setAttribute('onclick', 'history.back()');" +
          "  backBtn.style.cssText = 'display:block;cursor:pointer;padding:10px 4px 10px 4px;background-color:rgba(0,0,0,0.8);border-radius:6px;color:white;position:fixed;bottom:2px;right:2px;';" +
          "  document.body.appendChild(backBtn);" +
          "}"
      });
      // post "getTitle" command to webview
      wv[0].contentWindow.postMessage({
        command: 'getTitle',
        ttitle: thread_title.text()
      }, '*');
      // block evil external sites
      wv[0].request.onBeforeRequest.addListener(
        function(details) {
          return {
            cancel: true
          };
        }, {
          //urls: ["*://*.microad.jp/*"], 
          urls: ["<all_urls>"],
          types: ["sub_frame", "stylesheet", "script", "image", "object", "xmlhttprequest", "other"]
        }, ["blocking"]); // block evil external sites

    });
  }

  function prepareWriteForm(url) {
    console.log("prepareWriteForm");
    // convert to read.cgi's url
    var url = txt_url.data("url");
    url = util2ch.datURLToReadCGIURL(url) + "-1n";
    wv[0].src = url;
  }

  //
  // -- validator for input controls
  //
  InputValidator = {

    // addressBar
    txt_url: function() {
      var el = txt_url;
      el.css("background-color", "white");
      var inputed = el.val();
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
    for (var key in cmd) {
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
    var row = e.currentTarget.parentNode;
    var url = $(row).data("url");
    removeBookmark(url);
    row.remove();
    if (thread_title.data("url") == url) {
      styleBmStar(false);
    }
    e.stopPropagation(); // stop all events after this.
  });

  $document.on("click", "#tlist .body .row", function(e) {
    // return when now loading.
    if (nowloading) return;
    var row = $(this); // a selected row on threadList
    var url = row.data("url");
    viewResponses(url, row, true, false);
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
      // If URL contains "headline.2ch.net", read data of ".dat" instead of "read.cgi".
      if (util2ch.isHeadlineURL(url)) {
        if (!row) {
          row = getTListRowByURL(util2ch.datURLToReadCGIURL(url));
        }
        url = util2ch.readCGIURLToDatURL(url);
      }
      txt_url.val(url);
      var thread_title_url = thread_title.data("url");
      if (!historyUpdate) historyUpdate = false;
      if (!isReadmoreClicked) isReadmoreClicked = false;
      console.log("url:", url);
      // get resnum of readhere
      getReadhereFromStore(url, function(resnum) {
        var startIdx = 0; // starting res index.
        // load res.
        util2ch.getResponses(url, appConfig.ngWords, function(data, type) {
          console.log("type:", type, " data:", data);
          var responses = data.responses;
          // If type="html", get threadTitle from data.title. Else from selected row's "title" attr.
          var title;
          var prevURL = thread_title.data("url");
          if (type == "dat") {
            if (row) title = row.find(".ttitle").attr("title");
          } else { // "html" or "kako"
            title = data.title;
          }
          // access history update
          if (historyUpdate) {
            util2ch.updateHistory(url, title, prevURL);
          }
          //
          setThreadInfo({
            url: url,
            title: title
          });
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
            prepareWriteForm(url);
          }
          // make the buttons of readhere, arrowUp and arrowDn enable.
          if (resnum) {
            btn_jumpToReadhere.removeClass("disabled");
          } else {
            btn_jumpToReadhere.addClass("disabled");
          }
          btn_arrowUp.removeClass("disabled");
          btn_arrowDn.removeClass("disabled");
          // back & forward buttons disability
          var baf = util2ch.getBackAndForwardURL(url);
          if (baf.backURL) {
            btn_arrowBack.removeClass("disabled");
          } else {
            btn_arrowBack.addClass("disabled");
          }
          if (baf.forwardURL) {
            btn_arrowForward.removeClass("disabled");
          } else {
            btn_arrowForward.addClass("disabled");
          }
          // close res write webview if opened.
          pane_wv[0].style.visibility = "hidden";

          if (isReadmoreClicked) {
            // if it comes by clicking readmore button, set lastResnum as startIdx
            startIdx = getLastResnumOfThreadPane();
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
          var lastResnum = drawResponses(responses, startIdx);
          if (lastResnum < 0) {
            showErrorMessage("datが存在しない or dat落ち or 鯖落ちです");
          } else if (isReadmoreClicked) {
            fetchline.insertAfter($("#resnum" + startIdx)).show();
          } else {
            fetchline.hide();
          }
          // insert Readhere element after the last read res
          if (resnum >= 1) insertReadhereElem(resnum);
          // set lastResnum as ThreadTitle's data
          thread_title.data("resnum", lastResnum);
          // make previous selected row's style to "unselected"
          var prevSelectedRow = tlist_row_wrapper.find(".selected");
          if (prevSelectedRow[0]) {
            prevSelectedRow.removeClass("selected");
          }
          // make new selected row's style to "selected"
          var selectedRow;
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
            var newcnt = "";
            if (resnum) newcnt = lastResnum - resnum;
            selectedRow.find(".newcnt").text(newcnt);
          }
          // change readhere's visibility
          if (isReadmoreClicked) {
            scrollToTheRes($("#resnum" + startIdx));
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
        }, function(e) { // onerror of util2ch.getResponses.
          showErrorMessage("レスを取得できませんでした");
          stopLoading();
        }); // util2ch.getResponses
      });
      // check this thread whether bookmarked or not
      getBookmark(url, function(data) {
        if (!data) {
          styleBmStar(false);
        } else {
          styleBmStar(true);
        }
      });
    } // viewResponses

  // insert Readhere element after the res
  function insertReadhereElem(resnum) {
    readhere
      .data("resnum", resnum)
      .insertAfter($("#resnum" + resnum)); // move readhere div to prev of readmore div
  }

  btn_closeReadhere.click(function() {
    var url = thread_title.data("url");
    removeReadhereFromStore(url);
    var row = getTListRowByURL(url);
    row.find(".newcnt").text("");
    readhere.hide();
    btn_jumpToReadhere.addClass("disabled");
  });

  $document.on("mouseenter", "#tlist .body .row", function() {
    // if it is "bmlist"(bookmarkList), makes bookmark removable
    console.log("mouseenter row");
    var dataurl = bbs_title.data("url");
    if (dataurl == cmd.bookmarks) {
      $(this).find(".rescnt").after(btn_bmRemove);
      btn_bmRemove.show();
    }
  });
  $document.on("mouseleave", "#tlist .body .row", function() {
    var dataurl = txt_url.data("url");
    if (dataurl == cmd.bookmarks) {
      btn_bmRemove.hide();
    }
  });

  // thread list header icon buttons' effect
  $("#tlist_header .icon").click(function(e) {
    var options = {};
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
    var target = tlist.last();
    var h = tlist[0].scrollHeight;
    tlist.animate({
      scrollTop: h
    }, 100);
  });


  function drawThreadList(list, endHandler) {
    console.log("drawThreadList");
    var bbsurl = bbs_title.data("url");
    var ttitle_col_w = $("#tlist_row_wrapper .header .ttitle").width();
    var isCommandURL = isCommand(bbsurl);

    var target = $("#tlist .body");
    var html = "";
    var json, url, title, res;
    for (var len = list.length, i = 0; i < len; i++) {
      json = list[i];
      url = util2ch.datURLToReadCGIURL(json.url); // dat's url to read.cgi's url
      title = json.title;
      if (!isBookmarkView()) {
        res = json.res;
      } else {
        res = "";
      }
      html += '<div data-url="' + url + '" class="row">\n' +
        '<div class="col ttitle" title="' + title.replace(/"/g, '&quot;') + '" style="width:' + ttitle_col_w + 'px">' + title + '</div>\n' +
        '<div class="col newcnt"></div>\n' +
        '<div class="col rescnt">' + res + '</div>\n' +
        '</div>';
    }
    target.html(html);
    // callback onEnd
    if (endHandler) endHandler();
    // go to top
    tlist.scrollTop(0);
    // set new count of each threads if it is NOT the bookmark view
    if (!isBookmarkView()) setResNewCounts();
  }

  // calc & set new count of each thread
  function setResNewCounts() {
    $("#tlist .body > div").each(function() {
      var el = $(this);
      var url = el.data("url");
      var rescntEl = el.find(".col.rescnt");
      var newcntEl = el.find(".col.newcnt");
      var rescnt = rescntEl.text();
      if ($.isNumeric(rescnt)) {
        rescnt = parseInt(rescnt);
      } else {
        return;
      }
      getReadhereFromStore(url, function(resnum) {
        if (!resnum) return;
        var newcnt = rescnt - resnum;
        newcntEl.text(newcnt);
      });
    });
  }

  //
  // -- Responses
  //

  function drawResponses(responses, startIdx) {
    console.log("drawResponses");
    var htmlBuf = "";
    var res;
    var num, handle, email, date, uid, be, content;
    if (!startIdx) startIdx = 0;
    // evacuate readhere & fetchline element
    readhere.insertAfter($("#res_wrapper"));
    fetchline.insertAfter($("#res_wrapper"));
    for (var len = responses.length, i = 0; i < len; i++) {
      // start to build html from specified index of responses
      if (startIdx <= i) {
        res = responses[i];
        res.num ? num = res.num : num = "";
        res.handle ? handle = res.handle : handle = "";
        res.email ? email = res.email : email = "";
        res.date ? date = res.date : date = "";
        res.uid ? uid = res.uid : uid = "";
        res.be ? be = res.be : be = "";
        res.content ? content = res.content : content = "";

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
            ' </div>\n' +
            ' <div class="content">' + res.content + '</div>\n' +
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
      htmlBuf = $("#res_wrapper").html() + htmlBuf;
    }
    $("#res_wrapper").html(htmlBuf);
    // return last resnum.
    var lastResnum = responses.length - 1;
    if (lastResnum < 0) {
      // FIXME: deal with kakolog.
      console.log("Maybe this thead's gone to kakolog storage...");
      return lastResnum;
    }
    return responses[lastResnum].num;
  }


  //
  // -- refpop and links
  //

  $document.on('click', ".res .content a[data-resnum]", function(e) {
    console.log("resnum:", $(this).data("resnum"));
    var value = $(this).data("resnum");
    showRefpop({
      key: "resnum",
      value: value
    }, e);
  });
  $document.on('click', ".res .res_header .num", function(e) {
    console.log("num:", $(this).text());
    var value = $(this).text();
    showRefpop({
      key: "refered",
      value: value
    }, e);
  });
  $document.on('click', ".res .handle", function(e) {
    console.log("handle:", $(this).text());
    var value = $(this).text();
    showRefpop({
      key: "handle",
      value: value
    }, e);
  });
  $document.on('click', ".res .email", function(e) {
    console.log("email:", $(this).text());
    var value = $(this).text();
    showRefpop({
      key: "email",
      value: value
    }, e);
  });
  $document.on('click', ".res .uid", function(e) {
    console.log("uid:", $(this).text());
    var value = $(this).text();
    showRefpop({
      key: "uid",
      value: value
    }, e);
  });
  // clicking a link with href
  $document.on('click', ".content a", function(e) {
    var href = $(this).attr("href");
    console.log("href=", href);
    if (util2ch.isReadCGIURL(href)) {
      e.keyCode = 13; // set Enter key to the event
      txt_url.val(href).trigger("keydown", e);
      return;
    }
    if (!href) return false; // if anchor link, return to exit.
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

  function popThumb(url, elem) {
    console.log("popThumb");
    // check if img already exists
    var next2elem = elem.next().next(); // <a ...><br><img .../>
    if (next2elem.is("img") && next2elem.data("url") == url) {
      console.log("this image's already loaded.");
      return;
    }
    // make an img element
    var img = $("<br><img data-url='" + url + "' class='loading_mini' /><p class='percentComplete'></p>");
    elem.after(img);
    // request
    request.doRequest({
      method: "HEAD",
      responseType: "blob",
      url: url,
      onsuccess: function(xhr) {
        var contentType = xhr.getResponseHeader("Content-Type");
        var percentComplete;
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
              var ourl = window.webkitURL.createObjectURL(xhr.response);
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
        var msg = xhr.status + ": " + xhr.statusText;
        img[1].className = "imgNotFound";
        img[1].title = msg;
      }
    });
  }

  function popVideo(url, elem) {
    // popup video
    console.log("popVideo");
    // check if img already exists
    var next2elem = elem.next().next(); // <a ...><br><webview .../>
    if (next2elem.is("webview") && next2elem.data("url") == url) {
      console.log("this video's already loaded.");
      return;
    }
    // convert 'http://www.youtube.com/watch?v=***' to 'http://www.youtube.com/v/***'
    var src = getDirectVideoURL(url);
    // create video width // FIXME: This's uneffective for video's width adjustment.
    var width = thread_title.width() - 24;
    // make an video element
    var html = "<br><webview width='" + width + "' data-url='" + url + "' src='" + src + "'></webview>" + "<br><a href='" + url + "' target='_blank' class='jumpToYoutube'>YouTubeで見る</a>";
    var iframe = $(html);
    elem.after(iframe);
  }

  function popAmazon(url, elem) {
    // popup amazon pane
    console.log("popAmazon");
    // check if img already exists
    var next2elem = elem.next().next(); // <a ...><br><div .../>
    if (next2elem.is("div") && next2elem.data("url") == url) {
      console.log("this amazon's pane has already loaded.");
      return;
    }
    var div = $("<br>" +
      "<div class='amazonPane' data-url='" + url + "'>" +
      "  <img class='loading_mini'></img>" +
      "  <p class='percentComplete'></p>" +
      "  <div class='starlevel5' style='display:none'></div>" +
      "  <a href='' data-jumplink='1' target='_blank'></a>" +
      "</div>");
    elem.after(div);
    var imgElem = div.find("img");
    var aElem = div.find("a");
    asin = amazonutil.getASIN(url);
    if (!asin) {
      imgElem.removeClass("loading_mini");
      return;
    }
    amazonutil.getItemByASIN(asin, function(item) {
      // make an amazon info's Pane
      div.next().data("url", url);
      // item title & price
      var amazon_detail = item.title;
      if (item.price) amazon_detail += " " + item.price;
      aElem.text(amazon_detail).attr("href", item.url);
      var percentCompleteElem = div.find(".percentComplete");
      // warning for adult item
      if (item.warn) {
        imgElem.removeClass("loading_mini");
        return;
      }
      // review stars
      if (!isNaN(item.stars)) {
        var stars = Math.round(item.stars * 2) / 2 * 10;
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
            var ourl = window.webkitURL.createObjectURL(xhr.response);
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
    var w = thread_title.width() - 24;
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
    if (url.match(/\.(png|gif|jpg|jpeg)$/i)) {
      return true;
    } else {
      return false;
    }
  }

  function isVideoLink(url) {
    console.log("isVideoLink");
    var ret = getDirectVideoURL(url);
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
    var arr;
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
    var el = onlineStat;
    if (cls) {
      el.removeClass("offline").removeClass("online").addClass(cls);
    } else {
      var curr_cls = el[0].className;
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
      var fontSize = appConfig.fontSize;
      var newFontSize = fontSize + upDown;
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

  //
  // -- error handler
  //

  function error(e) {
    console.log("error:", e);
    showErrorMessage("Error: " + e.statusText);
  }

  function errorOnReload(reloadBtn, e) {
    console.log("error:", e);
    var reason;
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

  function isBookmarkView() {
    if (bbs_title.data("url") == cmd.bookmarks) {
      return true;
    } else {
      return false;
    }
  }

  function execReadmore() {
    var url = readmore.data("url");
    viewResponses(url, null, true, true);
  }

  function reloadTList() {
    console.log("reloadTList exec.");
    var el = btn_reloadTList;
    var url = el.data("url");
    // var bbs = bbs_title.text();
    var bbs;
    var bbsrow = getBBSRowByURL(url);
    if (bbsrow) bbs = bbsrow.text();
    if (util2ch.isDig2chURL(url)) {
      bbs = "「" + util2ch.getKeywordFromDig2chURL(url) + "」関連スレ";
    }
    // set bbs title. It's re-set again after the below process for getting threadList
    bbs_title.text(bbs);

    // start loading image...
    startLoading();
    el.removeClass("reload24");
    el.addClass("loading_mini");
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
      showErrorMessage("Error: スレッド一覧の取得に失敗しました");
    });
  }


  function makeBList(bbsmenu) {
    var parent = blist;
    var tpl = blist_tpl;
    var cur_tpl;
    var cur_cate0Name;

    // First, clear current bbs list.
    parent.find(".cate").remove();

    for (var len = bbsmenu.length, i = 0; i < len; i++) {
      if (!bbsmenu[i].cate0) {
        continue;
      }
      if (cur_cate0Name != bbsmenu[i].cate0 || i == len - 1) {
        if (cur_tpl) parent.append(cur_tpl);
        // clone new template "cate"
        cur_tpl = tpl.clone()
          .removeClass("tpl").attr("id", null);
      }
      cur_tpl.find(".cate0").text(bbsmenu[i].cate0);
      var li = $("<li class='cate1'></li>")
        .data("url", bbsmenu[i].url)
        .text(bbsmenu[i].cate1);
      cur_tpl.find("ul").append(li);
      cur_cate0Name = bbsmenu[i].cate0;
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
    var offset = {
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
    findbar.show();
  });
  // settings - "文字サイズ拡大"
  btn_settingSizeUp.click(function(e) {
    tickFontSize(1);
  });
  // settings - "文字サイズ縮小"
  btn_settingSizeDn.click(function(e) {
    tickFontSize(-1);
  });
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
    var options = {};
    $(this).effect("puff", options, 300, function(e) {
      $(this).css("display", "block");
    });
  });

  // Back button
  btn_arrowBack.click(function(e) {
    console.log("btn_arrowBack");
    if ($(this).hasClass("disabled")) return;
    goBackOrForward(true); // go back
  });
  // show "Back" history on long press.
  btn_arrowBack.mouseup(function() {
    clearTimeout(pressTimer)
    return false;
  }).mousedown(function(e) {
    pressTimer = window.setTimeout(function() {
      popupHistoryMenus(e, false); // popup "back" history.
    }, 500);
    return false;
  });

  // Forward button
  btn_arrowForward.click(function(e) {
    console.log("btn_arrowForward");
    if ($(this).hasClass("disabled")) return;
    goBackOrForward(false); // go forward
  });
  // show "Forward" history on long press.
  btn_arrowForward.mouseup(function() {
    clearTimeout(pressTimer)
    return false;
  }).mousedown(function(e) {
    pressTimer = window.setTimeout(function() {
      popupHistoryMenus(e, true); // popup "forward" history.
    }, 1000);
    return false;
  });

  function popupHistoryMenus(evt, isForward) {
    // set back history 
    var curURL = txt_url.data("url");
    var history;
    if (isForward) {
      history = util2ch.getHistoryURLs(curURL).forwardHistory;
    } else {
      history = util2ch.getHistoryURLs(curURL).backHistory;
    }
    var df = $(document.createDocumentFragment());
    for (var i = 0, len = history.length; i < len; i++) {
      var row = $('<div class="row" data-url="' + history[i].url + '"">' + history[i].title + '</div>');
      df.append(row);
    }
    menu_historyURLs
      .empty()
      .append(df)
      .show()
      .offset({
        top: evt.clientY - 2,
        left: evt.clientX - 2
      });
  }

  $document.on("click", "#menu_historyURLs .row", function(e) {
    var url = $(this).data("url");
    goFromHistory(url);
    menu_historyURLs.hide();
  });

  // jump from history
  function goFromHistory(url) {
    if (url) {
      viewResponses(url, null, false, false);
    }
  }

  function goBackOrForward(back) {
    var curURL = thread_title.data("url");
    if (!curURL) return;
    var baf = util2ch.getBackAndForwardURL(curURL);
    var url;
    if (back && baf.backURL && baf.backURL.url) {
      url = baf.backURL.url;
    } else if (!back && baf.forwardURL && baf.forwardURL.url) {
      url = baf.forwardURL.url;
    }
    if (url) {
      viewResponses(url, null, false, false);
    }
  }


  // Toggle bm star.

  btn_addBm.click(function(e) {
    toggleBmStar();
  });

  function toggleBmStar() {
    var url = thread_title.data("url");
    var title = thread_title.data("title");
    var tlist_url = bbs_title.data("url");
    var resnum = thread_title.data("resnum");
    if (!url || !title) {
      return;
    }
    if (btn_addBm.attr("class") == "btn star_on24") {
      // remove from bookmark.
      removeBookmark(url);
      // if bookmarks pane is displayed, remove the row from there.
      if (tlist_url == cmd.bookmarks) {
        removeFromTListPane(url);
      }
      styleBmStar(false);
    } else {
      // add to bookmark.
      saveBookmark(url, title, resnum);
      // if bookmarks pane is displayed, add the row to there.
      if (tlist_url == cmd.bookmarks) {
        addToTListPane();
      }
      styleBmStar(true);
    }
  }

  function removeFromTListPane(url) {
    var row = getTListRowByURL(url);
    if (row) row.remove();
  }

  function addToTListPane() {
    btn_bmlist.trigger("click");
  }

  function getTListRowByURL(url) {
    var rows = $("#tlist .body .row");
    for (var len = rows.length, i = 0; i < len; i++) {
      var row = $(rows[i]);
      if (row.data("url") == url) {
        return row;
      }
    }
    return null;
  }

  function getBBSRowByURL(url) {
    var rows = $("#blist .cate1");
    for (var len = rows.length, i = 1; i < len; i++) { // starts index 1 cause index 0 is a row for template.
      var row = $(rows[i]);
      if (row.data("url") == url) {
        return row;
      }
    }
    return null;
  }

  // flg=true: "star_on", flg=false: "star_on disabled".
  function styleBmStar(flg) {
    if (flg) {
      btn_addBm.removeClass("grayout").prop("title", "お気に入りから削除");
    } else {
      btn_addBm.addClass("grayout").prop("title", "お気に入りに登録");
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
    var target = $("#res_wrapper .res").last();
    var h = thread[0].scrollHeight;
    thread.animate({
      scrollTop: h
    }, 100);
  });
  btn_jumpToReadhere.click(function() {
    if ($(this).hasClass("disabled")) return;
    var resElem = readhere.prev();
    scrollToTheRes(resElem);
  });
  rng_divider.on("input change", function() {
    appConfig.dividerPos = $(this).val();
    redraw();
  });

  function scrollToTheRes(resElem) {
    var ot = resElem.offset().top;
    var st = thread.scrollTop();
    thread.animate({
      scrollTop: st + ot - 120
    }, 100);
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
    var ww = $window.width();
    var wh = $window.height();

    //
    // #tlist and #thread height setting
    var properTblHeight = wh - tlist_row_wrapper.offset().top;
    tlist_row_wrapper[0].style.maxHeight = properTblHeight + "px";
    var properThreadHeight = wh;
    thread[0].style.minHeight = properThreadHeight + "px";
    thread[0].style.height = properThreadHeight + "px";

    //
    // #tlist and #thread width setting
    var tlist_w = ww * appConfig.dividerPos / 100; // for left pane
    var thread_w = ww - tlist_w - 46; // for right pane
    tlist[0].style.width = tlist_w + "px";
    tlist_header[0].style.width = (tlist_w - 20) + "px";
    var ttitle_col_w = tlist_w - (124); // = tlist_w - (.rescnt + .newcnt)
    $("#tlist_row_wrapper .ttitle").width(ttitle_col_w);
    thread[0].style.right = "0px";
    thread[0].style.width = thread_title[0].style.width = thread_w + "px";
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
    var lastIdx = refpops.length - 1;
    if (refpops[lastIdx] === this) {
      removeRefpop(lastIdx);
    }
  });
  $document.on("click", ".refpop", function() {
    console.log("refpop clicked.");
  });
  $document.on("keydown", "body", function(e) {
    console.log("body keydown.", e.keyCode);
    if (e.keyCode == 27) { // ESC key
      removeRefpops();
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
    var refpop = $(document.createElement("div"));
    refpop.addClass("refpop").addClass("res_wrapper");
    refpop.css("overflow", "auto");
    // get res by resnum
    var html = "";
    var key = query.key;
    var value = query.value;
    if (key == "resnum") {
      if ($.isNumeric(value)) {
        // get res by resnum
        html = getResHTML(value);
      } else if (value.match(/\d+\-\d+/)) {
        // get reses by range.
        var arr = value.match(/(\d+)\-(\d+)/);
        var from = Number(arr[1]);
        var to = Number(arr[2]);
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
    var html = "";
    var txt, tmp, res, res_clone;
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
      var flg = false;
      for (var len = refpops.length, i = 0; i < len; i++) {
        if (onmoused === refpops[i]) {
          flg = true;
          continue;
        }
        if (flg)
          removeRefpop(i);
      }
    } else {
      // remove all refpops
      for (var len = refpops.length, i = 0; i < len; i++) {
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
    var ret;
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
      var data = {
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
      var col = "update";
      var range = null;
      var direction = "prev";
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
      var update = new Date().getTime();
      var data = {
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

  // // get a snapshot of the bbs from snapshots store
  // function getSS(bbsurl, cb) {
  //   idbutil.get("snapshots", bbsurl, function(data) {
  //     console.log("snapshot of " + bbsurl, data);
  //     if (data) {
  //       cb(data.ss);
  //     } else {
  //       cb();
  //     }
  //   });
  // }
  // // save a snapshot of the bbs to snapshots store
  // function saveSS(bbsurl, item) {
  //   console.log("saveSS.");
  //   idbutil.update("snapshots", item);
  // }


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
    var rtx = e.clientX + pu.width(); // right top X
    var rby = e.clientY + pu.height(); // right bottom Y
    var WW = $window.width();
    var WH = $window.height();
    var top = e.clientY - 16; // "-16" is for creating refpop under mouse cursor.
    var left = e.clientX - 18; // "-18" is for creating refpop under mouse cursor.
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
    var repmsg = createReplyMessage($(this).parent().parent());
    btn_showPaneWrite.trigger("click", [{
      from: "",
      email: "sage",
      msg: repmsg
    }]);
  });
  // readhere button click
  $document.on("click", ".restool .btn_readhere", function() {
    var resdiv = $(this).parent().parent();
    var url = thread_title.data("url");
    var lastResnum = getLastResnumOfThreadPane();
    var curResnum = parseInt(resdiv.find(".num").text());
    var newcnt = lastResnum - curResnum;
    // insert readhere element
    readhere.insertAfter(resdiv).show();
    btn_jumpToReadhere.removeClass("disabled");
    // save the last resnum into readhere's store
    saveReadhereToStore(url, curResnum);
    // update also rescnt col in the thread list
    var newcnt = lastResnum - curResnum;
    var selectedRow = tlist_row_wrapper.find("[data-url='" + url + "']");
    if (selectedRow[0]) {
      // update the text of ".rescnt" col of the selected row
      selectedRow.find(".rescnt").text(lastResnum);
      // zero-init the text of ".newcnt" col of the selected row
      selectedRow.find(".newcnt").text(newcnt);
    }
  });

  function getLastResnumOfThreadPane() {
    var lastResnum = $(".res[id]").last().attr("id").split("resnum")[1];
    return parseInt(lastResnum);
  }

  /**
   * create replying message for the specific res
   * @param {element} resElem
   *  jquery element selectored '.res'
   */
  function createReplyMessage(resElem) {
    var ret;
    var num = resElem.find(".res_header .num").text();
    var htmlcontent = resElem.find(".content")
      .html()
      .replace(/<br\s*[\/]?>/gi, '\\n> '); // replace <br> with '\n>'
    var txtcontent = $("<div>" + htmlcontent + "</div>")
      .text() // html to text
      .replace(/'/gi, "\\'"); // escape
    ret = ">>" + num + '\\n> ' + txtcontent;
    return ret;
  }


  //
  // -- filter functions

  function filterTList(txt) {
    // -- filtering TList.
    var re = new RegExp(txt, "i");
    var parent_cloned = $("#tlist_row_wrapper .body").clone();
    var rows_cloned = parent_cloned.find(".row");
    var row;
    for (var len = rows_cloned.length, i = 0; i < len; i++) {
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
    var re = new RegExp(txt, "i");
    var parent_cloned = $("#res_wrapper").clone();
    var rows_cloned = parent_cloned.find(".res");
    var row;
    for (var len = rows_cloned.length, i = 0; i < len; i++) {
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
    var theme = $(this).val();
    applyTheme(theme);
    // save to appConfig
    appConfig.theme = theme;
  });

  $("#txt_confFontSize").on("change", function(e) {
    var val = $(this).val();
    if ($.isNumeric(val)) {
      applyFontSize(val + "px");
      // save to appConfig
      appConfig.fontSize = parseInt(val);
    } else {
      $(this).val(appConfig.fontSize);
    }
  });

  $("#ta_confNGWords").on("change", function(e) {
    var val = $(this).val();
    if (!val) {
      appConfig.ngWords = undefined;
      return;
    }
    appConfig.ngWords = val.split("\n");
  });

  function getThemes(onSuccess, onError) {
    var ret = [];
    chrome.runtime.getPackageDirectoryEntry(function(root) {
      root.getDirectory("themes", {
        create: false
      }, function(dirEntry) {
        var dirReader = dirEntry.createReader();
        dirReader.readEntries(function(entries) {
          for (var len = entries.length, i = 0; i < len; i++) {
            var entry = entries[i];
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
    var themepath;
    if (theme == "default") {
      themepath = "themes/theme.css";
    } else {
      themepath = "themes/" + theme + "/" + theme + ".css";
    }
    $('link[rel="stylesheet"][data-custom-theme]')[0].href = themepath;
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
    var sel_themes = $("#sel_themes");
    var sel_themes_len = $("#sel_themes option").length;
    if (sel_themes_len <= 1) {
      getThemes(function(themes) {
        var theme;
        var themename;
        for (var len = themes.length, i = 0; i < len; i++) {
          theme = themes[i];
          themename = theme.split("theme-")[1];
          sel_themes.append('<option value="' + theme + '">' + themename + '</option>');
        }
        // make current theme 'selected'
        var currentTheme = appConfig.theme;
        if (!currentTheme) currentTheme = "default";
        $("#sel_themes").val(currentTheme);
      });
    }
  }

  function setConfNGWords() {
    if (!appConfig.ngWords) return;
    ta_confNGWords.val(appConfig.ngWords.join("\n"));
  }

  // save appConfig to localStorage
  function saveAppConfig() {
    console.log("saveAppConfig");
    var appConfigStr = JSON.stringify(appConfig);
    chrome.storage.local.set({
      'appConfig': appConfigStr
    }, function() {
      console.log('appConfig has been saved to localStorage. Stringified appConfig: ', appConfigStr);
    });
  }

  // load appConfig from localStorage
  function loadAppConfig(cb) {
    console.log("loadAppConfig");
    chrome.storage.local.get("appConfig", function(items) {
      var appConfigStrInStorage = items.appConfig;
      var appConfigInStorage;
      console.log("appConfig in storage:", appConfigInStorage);
      if (appConfigStrInStorage) {
        var appConfigInStorage = JSON.parse(appConfigStrInStorage);
        for (var k in appConfigInStorage) {
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
    chrome.storage.local.remove("appConfig", function() {
      console.log("Cleared appConfig in localStorage.");
    });
  }

});