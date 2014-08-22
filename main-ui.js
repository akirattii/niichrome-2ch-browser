/**
 * niichrome 2ch browser
 *
 * @version 0.5.1
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

  // fullscreen mode
  // chrome.app.window.current().fullscreen();
  chrome.app.window.current().maximize();

  var request = niichrome.request();
  var util2ch = niichrome.util2ch();
  var idbutil = niichrome.idbutil("niichromedb", 1);
  var amazonutil = niichrome.amazonutil();

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
    {
      storename: 'snapshots',
      keyPath: 'url',
      autoIncrement: false
    },
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
  var btn_write = $("#btn_write");
  var btn_arrowBack = $("#btn_arrowBack");
  var btn_arrowForward = $("#btn_arrowForward");
  var btn_arrowUp = $("#btn_arrowUp");
  var btn_arrowDn = $("#btn_arrowDn");
  var btn_arrowUpTList = $("#btn_arrowUpTList");
  var btn_arrowDnTList = $("#btn_arrowDnTList");
  var btn_showPaneWrite = $("#btn_showPaneWrite");
  var btn_addBm = $("#btn_addBm");
  var readmore = $("#readmore");
  var readhere = $("#readhere");
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
  var message = $("#message");
  var res_tpl = $("#res_tpl");
  var blist_tpl = $("#blist_tpl");
  var tlist_tpl = $("#tlist_tpl");
  var onlineStat = $("#onlineStat");
  var txt_filter = $("#txt_filter");
  var btn_bmRemove = $("<span id='btn_bmRemove' class='remove_in_cell' style='background-color:transparent;position:relative;top:0;left:0;' title='お気に入りから削除'></span>");
  var pane_wv = $("#pane_wv");
  var wv = $("#wv");
  var btn_closeWv = $("#btn_closeWv");
  var body = $("body");
  var dlg_adultCheck = $("#dlg_adultCheck");
  var btn_adultCheckYes = $("#btn_adultCheckYes");
  var btn_adultCheckNo = $("#btn_adultCheckNo");
  var lbl_version = $("#lbl_version");

  //
  // -- window onload
  //
  window.onload = function(e) {
    lbl_version.find("a").text("v." + chrome.runtime.getManifest().version);
    readmore.hide();
    readhere.hide();
    // make webview pane draggable
    new Draggable("pane_wv");
    // init webview pane of kakiko
    initWriteForm();
    // createContextMenus(); // needs "contextMenus" to "permissions" of manifest.
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
      switch (event.which) {
        case 76: // Ctrl+L
          event.preventDefault();
          console.log('Ctrl+L');
          txt_url.select();
          break;
        case 70: // Ctrl+F
          event.preventDefault();
          console.log('Ctrl+F');
          txt_filter.select();
          break;
        case 66: // Ctrl+B
          event.preventDefault();
          console.log('Ctrl+B');
          btn_bmlist.trigger("click");
          break;
        case 68: // Ctrl+D
          event.preventDefault();
          console.log('Ctrl+D');
          btn_addBm.trigger("click");
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
    btn_reloadTList.hide();
    setBBSInfo({
      url: cmd.bookmarks,
      bbs: "お気に入り"
    });
    getAllBookmarks(function(list) {
      console.log("list", list);
      drawThreadList(list);
    });
  });

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



  //
  // -- address bar
  //

  txt_url.on("keydown", function(e, xe) {
    console.log("txt_url keydown:", e.keyCode);
    if (e.keyCode === 13 || (xe && xe.keyCode === 13)) { // RETURN key
      console.log($(this).val());
      var url = $(this).val().trim();
      if (!url) return;

      if (!isCommand(url) &&
        !util2ch.isBBSURL(url) &&
        !util2ch.isReadCGIURL(url) &&
        !util2ch.isDatURL(url)) {
        // If url is neither commands nor 2ch's URL, it means keywords to search.
        // url = util2ch.getFind2chURL(url);
        url = util2ch.getDig2chURL(url);
      }
      $(this).val(url);

      // prettify read.cgi URL 
      // eg.: read.cgi/xxxxx/l50 → read.cgi/xxxxx/
      url = util2ch.prettifyReadCGIURL(url);

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
          viewResponses(url, null, true);
        }
      }
    }
  });

  //
  // -- write pane
  //

  btn_showPaneWrite.click(function(e) {
    console.log("btn_showPaneWrite");
    if ($(this).hasClass("disabled")) return;
    pane_wv[0].style.visibility = "visible";
  });

  btn_closeWv.click(function(e) {
    console.log("btn_closeWv");
    pane_wv[0].style.visibility = "hidden";
  });

  function initWriteForm() {
    wv[0].addEventListener("loadcommit", function() {
      // insert css
      wv[0].insertCSS({
        code: "iframe,div,hr,img,dl,a,script { display: none; } " +
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
    viewResponses(url, row, true);
  });

  /**
   * view responses of the thread
   * @param url
   * @param row
   *    selected row in threadList. null is also OK.
   * @param {bool} historyUpdate
   *    default is "false"
   */
  function viewResponses(url, row, historyUpdate) {
    startLoading(url, row);
    // If URL contains "headline.2ch.net", read data of ".dat" instead of "read.cgi".
    if (util2ch.isHeadlineURL(url)) {
      if (!row) {
        row = getTListRowByURL(util2ch.datURLToReadCGIURL(url));
      }
      url = util2ch.readCGIURLToDatURL(url);
    }
    txt_url.val(url);
    var readhereurl = readhere.data("url");
    if (!historyUpdate) historyUpdate = false;
    console.log("url:", url);
    // get resnum of readhere
    getReadhereFromStore(url, function(resnum) {
      var startIdx = resnum; // starting resnum to display
      // load res.
      util2ch.getResponses(url, function(data, type) {
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
          util2ch.updateHistory(url, prevURL);
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
        btn_jumpToReadhere.removeClass("disabled");
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
        // if first visit of thread, clear responses.
        if (!resnum || readhereurl != url) {
          // $("#res_wrapper").empty();
          startIdx = 0;
          if (resnum === undefined) {
            resnum = 0; // init resnum for getting all res.
            // jump to top
            thread.scrollTop(0);
          }
        }
        // draw responses.
        var lastResnum = drawResponses(responses, startIdx);
        if (lastResnum < 0) showErrorMessage("dat落ちです");
        readhere
          .data("resnum", lastResnum)
          .data("url", url)
          .remove() // remove readhere div from responses
        .insertAfter($("#resnum" + resnum)); // move readhere div to prev of readmore div
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
          selectedRow.find(".newcnt").text("0");
        }
        // update readhere's resnum
        saveReadhereToStore(url, lastResnum);
        // change readhere's visibility
        if (resnum === 0) {
          readhere.css("display", "none");
          btn_jumpToReadhere.addClass("disabled");
        } else {
          readhere.css("display", "block");
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
    getSS(bbsurl, function(ss) {
      var ss4save = {};
      var target = $("#tlist .body");
      var html = "";
      for (var len = list.length, i = 0; i < len; i++) {
        var json = list[i];
        var url = util2ch.datURLToReadCGIURL(json.url); // dat's url to read.cgi's url
        var title = json.title;
        var res = json.res;
        var diff = "";
        if (!isCommandURL && ss) {
          var resInSS = ss[url];
          if (resInSS) {
            diff = res - resInSS;
          } else {
            diff = "New";
          }
        }
        html += '<div data-url="' + url + '" class="row">\n' +
          '<div class="col ttitle" title="' + title.replace(/"/g, '&quot;') + '" style="width:' + ttitle_col_w + 'px">' + title + '</div>\n' +
          '<div class="col newcnt">' + diff + '</div>\n' +
          '<div class="col rescnt">' + res + '</div>\n' +
          '</div>';
        ss4save[url] = res;
      }
      target.html(html);
      // callback onEnd
      if (endHandler) endHandler();
      // go to top
      tlist.scrollTop(0);
      // save the snapshot
      saveSS(bbsurl, {
        url: bbsurl,
        ss: ss4save
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

        htmlBuf += '<div class="res" id="resnum' + num + '">\n' +
          '<div class="res_header">\n' +
          '<span class="num">' + num + '</span>:&nbsp;\n' +
          '<span class="handle"><b>' + handle + '</b></span>\n' +
          '[<span class="email">' + email + '</span>]&nbsp;\n' +
          '<span class="date">' + date + '</span>\n' +
          '<span class="uid">' + uid + '</span>\n' +
          '<span class="be">' + be + '</span>\n' +
          '</div>\n' +
          '<div class="content">' + res.content + '</div>\n' +
          '</div>\n';
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
    } else if (isVideoLink(href)) {
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
    // make an video element
    var iframe = $("<br><webview width='420' height='345' data-url='" + url + "' src='" + src + "'></webview>");
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

  //
  // -- message for info and error 
  //

  function showMessage(msg, bgcolor) {
    if (bgcolor) {
      message.css("background-color", bgcolor);
    } else {
      message.css("background-color", "#fdfdaf");
    }
    message.text(msg);
    message.fadeIn();
    setTimeout(function() {
      message.fadeOut();
    }, 2000);
  }

  function showErrorMessage(msg) {
    showMessage(msg, "#ffcfcf");
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
    reloadTList();
  });

  function execReadmore() {
    var url = readmore.data("url");
    viewResponses(url, null, true);
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

  // tool icon buttons' effect
  $("#tools .btn").click(function(e) {
    if ($(this).hasClass("disabled")) return;
    var options = {};
    $(this).effect("puff", options, 300, function(e) {
      $(this).css("display", "block");
    });
  });

  btn_arrowBack.click(function(e) {
    console.log("btn_arrowBack");
    if ($(this).hasClass("disabled")) return;
    goBackOrForward(true); // go back
  });
  btn_arrowForward.click(function(e) {
    console.log("btn_arrowForward");
    if ($(this).hasClass("disabled")) return;
    goBackOrForward(false); // go forward
  });

  function goBackOrForward(back) {
    var curURL = thread_title.data("url");
    if (!curURL) return;
    var baf = util2ch.getBackAndForwardURL(curURL);
    var url;
    if (back && baf.backURL) {
      url = baf.backURL;
    } else if (!back && baf.forwardURL) {
      url = baf.forwardURL;
    }
    if (url) {
      viewResponses(url, null, false);
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
    var resnum = readhere.data("resnum");
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
    var ot = readhere.offset().top;
    var st = thread.scrollTop();
    thread.animate({
      scrollTop: st + ot - 120
    }, 100);
  });

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
    var half_w = ww / 2;
    var tlist_w = half_w - 66;
    tlist[0].style.width = tlist_w + "px";
    tlist_header[0].style.width = (tlist_w - 20) + "px";
    var ttitle_col_w = tlist_w - (124); // = tlist_w - (.rescnt + .newcnt)
    $("#tlist_row_wrapper .ttitle").width(ttitle_col_w);
    thread[0].style.right = "0px";
    thread[0].style.width = half_w + 20 + "px";
    thread_title[0].style.width = half_w + 20 + "px";
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
        // display the responses disappeared by filtering
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

  // get resnum from readhere store by key=url
  function getReadhereFromStore(daturl, cb) {
    console.log("getReadhereFromStore", daturl);
    idbutil.get("readheres", daturl, function(data) {
      console.log("data", data);
      var ret;
      if (data && data.res) {
        ret = data.res;
      }
      cb(ret);
    });
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

  // get a snapshot of the bbs from snapshots store
  function getSS(bbsurl, cb) {
    idbutil.get("snapshots", bbsurl, function(data) {
      console.log("snapshot of " + bbsurl, data);
      if (data) {
        cb(data.ss);
      } else {
        cb();
      }
    });
  }
  // save a snapshot of the bbs to snapshots store
  function saveSS(bbsurl, item) {
    console.log("saveSS.");
    idbutil.update("snapshots", item);
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
    var rtx = e.clientX + pu.width(); // right top X
    var rby = e.clientY + pu.height(); // right bottom Y
    var WW = $window.width();
    var WH = $window.height();
    var top = e.clientY - 16; // "-4" is for creating refpop under mouse cursor.
    var left = e.clientX - 4; // "-4" is for creating refpop under mouse cursor.
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

});