/**
 * niichrome-util2ch
 *
 * @version 1.6.0
 * @author akirattii <tanaka.akira.2006@gmail.com>
 * @license The MIT License
 * @copyright (c) akirattii
 * @see https://github.com/akirattii/niichrome-util2ch/
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
/**
 * @dependencies niichrome-request.js
 */
(function(exports) {

  /**
   * @namespace
   */
  var niichrome = exports.niichrome || {};

  /**
   * @constructor
   */
  niichrome.util2ch = function() {

    // regex for checking permitted urls
    RE_PERMISSIONS = [
      /\.2ch\.sc$/,
      /\.2ch\.net$/,
      /\.bbspink\.com$/,
      /\.machi\.to$/,
      /\.open2ch\.net$/,
      /^xpic\.sc$/,
    ];

    // bbsmenu URL
    URL_BBSMENU = "http://menu.2ch.sc/bbsmenu.html";

    // find.2ch URL
    URL_FIND2CH = "http://find.2ch.sc/"; //?TYPE=TITLE&SCEND=D&SORT=MODIFIED&BBS=ALL&STR=";

    // dig.2ch URL
    URL_DIG2CH = "http://dig.2ch.net/";

    // regex for getting bbs info from url
    // e.g. http://anago.*.*/namazuplus/
    RE_GET_BBS_URL = /^[https]+\:\/\/([_0-9a-zA-Z.]+):?[0-9]*?\/([_0-9a-zA-Z.]+)\/$/;
    // regex for getting bbs info from url
    // e.g. http://hoge.2ch.sc/namazuplus/
    RE_GET_2CHBBS_URL = /^(https?:\/\/)([^\/]+)(\.2ch\.sc):?[0-9]*?\/([^\/]+)\/$/;
    // regex for getting bbs info from url
    // e.g. http://anago.machi.to/namazuplus/
    RE_GET_MACHI_BBS_URL = /^[https]+\:\/\/([_0-9a-zA-Z.]+):?[0-9]*?\/([_0-9a-zA-Z.]+)\/$/;

    // regex for getting bbs info from url
    // e.g. http://find.2ch.net/search?...
    RE_GET_FIND2CH_URL = /^[https]+\:\/\/find\.2ch\.sc:?[0-9]*?\//;
    // regex for getting bbs info from url
    // e.g. http://dig.2ch.net/search?...
    RE_GET_DIG2CH_URL = /^[https]+\:\/\/dig\.2ch\.net:?[0-9]*?/;

    // regex for getting thread info from url
    // e.g. http://uni.2ch.net/test/read.cgi/newsplus/1392945620/l50
    RE_GET_THREAD_URL = /^[https]+\:\/\/([_0-9a-zA-Z.]+):?[0-9]*?\/test\/read\.cgi\/([_0-9a-zA-Z.]+)\/([0-9]+)\/[0-9a-z\-]*$/;
    // regex for getting thread info from url
    // e.g. http://uni.machi.to/bbs/read.cgi/hokkaido/1392945620/l50
    RE_GET_MACHI_THREAD_URL = /^[https]+\:\/\/([_0-9a-zA-Z.]+):?[0-9]*?\/bbs\/read\.cgi\/([_0-9a-zA-Z.]+)\/([0-9]+)\/[0-9a-z\-]*$/;
    // regex for getting thread info from url
    // e.g. http://xpic.sc/test/read.cgi/newsplus/1392945620/l50
    RE_GET_XPIC_THREAD_URL = /^[https]+\:\/\/(xpic\.sc):?[0-9]*?\/test\/read\.cgi\/([_0-9a-zA-Z.]+)\/([0-9]+)\/[0-9a-z\-]*$/;

    // regex for getting dat info from url
    // e.g. http://uni.2ch.net/newsplus/dat/1392945620.dat
    RE_GET_DAT_URL = /^[https]+\:\/\/([_0-9a-zA-Z.]+):?[0-9]*?\/([_0-9a-zA-Z.]+)\/dat\/([0-9]+)\.dat$/;
    // regex for getting machi.to dat info from url
    // e.g. "http://www.machi.to/bbs/offlaw.cgi/2/tokyo/1410645463/"
    RE_GET_MACHI_DAT_URL = RE_GET_MACHI_DAT_URL = /^[https]+\:\/\/([_0-9a-zA-Z.]+):?[0-9]*?\/bbs\/offlaw\.cgi\/2\/([_0-9a-zA-Z.]+)\/([0-9]+)\/$/;

    // regex for getting domain name from url
    RE_GET_DOMAIN = /^[https]+\:\/\/([_0-9a-zA-Z.]+):?[0-9]*?\/([_0-9a-zA-Z.]+)\/$/;

    // regex for getting resHeaders from read.cgi's html
    RE_GET_RES_HEADER_FROM_READCGI = /(<b>.+<\/b>).+[\uff1a](.+) (ID:\S+).*?<\/dt>$/;
    // regex for getting resHeaders without ID from read.cgi's html (e.g. bbspink)
    RE_GET_RES_HEADER_FROM_READCGI_WITHOUT_ID = /(<b>.+<\/b>).+[\uff1a](.+) .*?<\/dt>$/;
    // regex for getting resHeader with email from read.cgi's html
    RE_GET_RES_HEADER_WITH_EMAIL_FROM_READCGI = /<a href="mailto:(.+)">(<b>.+<\/b>).+[\uff1a](.+) (ID:\S+).*<\/dt>$/;
    // regex for getting resHeader with email without ID from read.cgi's html (e.g. bbspink)
    RE_GET_RES_HEADER_WITH_EMAIL_FROM_READCGI_WITHOUT_ID = /<a href="mailto:(.+)">(<b>.+<\/b>).+[\uff1a](.+) .*<\/dt>$/;
    // regex for getting resContent from read.cgi's html
    RE_GET_RES_CONTENT_FROM_READCGI = /^<dd>(.+)/;

    // regex for convert 2ch.net to 2ch.sc url
    RE_NET_TO_SC = /(^http:\/\/.+\.)(net)(\/)/;

    // regex for check whether xpic.sc or not
    RE_IS_XPIC_URL = /^http\:\/\/xpic.sc/;
    // regex for check whether xpic.sc or not
    RE_IS_XPIC_ROOT_URL = /^http\:\/\/xpic.sc\/$/;

    var request = niichrome.request();

    // max count of 'history'
    HISTORY_MAX = 30;
    // history cache
    var history = []; // this object array looks like: 
    /*
      [
        { url: 'http://hoge/test/read.cgi/foo/000000/', title: 'タイトル1', lastAccess: 1234567899 },
        { url: 'http://hoge/test/read.cgi/foo/099999/', title: 'タイトル2', lastAccess: 1234567898 },
        ...
      ]
    */

    var _isPermittedDomain = function(domain) {
      var ret;
      for (var len = RE_PERMISSIONS.length, i = 0; i < len; i++) {
        ret = domain.match(RE_PERMISSIONS[i]);
        if (ret) return true;
      }
      return false;
    }

    var _isPermittedURL = function(url) {
      if (url.match(RE_IS_XPIC_URL)) return true;
      var m = url.match(RE_GET_DOMAIN);
      if (m && m[1] && m.length == 3) { // e.g. http://aaa.2ch.net/bbb/
        var domain = m[1];
        var bbs = m[2];
        if (!bbs) {
          return false;
        }
        return _isPermittedDomain(domain);
      }
      return false;
    }

    var _isDatURL = function(url) {
      if (!url) return false;
      if (url.match(RE_GET_DAT_URL)) {
        return true;
      } else {
        return false;
      }
    };

    var _isMachiDatURL = function(url) {
      if (!url) return false;
      if (url.match(RE_GET_MACHI_DAT_URL)) {
        return true;
      } else {
        return false;
      }
    };

    var _isReadCGIURL = function(url) {
      if (!url) return false;
      url = _prettifyReadCGIURL(url);
      // if (url.slice(-1) != "/") url += "/"; // complement a slash
      if (url.match(RE_GET_THREAD_URL)) {
        return true;
      } else {
        return false;
      }
    };

    var _isMachiReadCGIURL = function(url) {
      if (!url) return false;
      url = _prettifyMachiReadCGIURL(url);
      // if (url.slice(-1) != "/") url += "/"; // complement a slash
      if (url.match(RE_GET_MACHI_THREAD_URL)) {
        return true;
      } else {
        return false;
      }
    };

    var _isXpicReadCGIURL = function(url) {
      if (!url) return false;
      url = _prettifyReadCGIURL(url);
      if (url.match(RE_GET_XPIC_THREAD_URL)) {
        return true;
      } else {
        return false;
      }
    };

    var _isXpicBBSRootURL = function(url) {
      if (!url) return false;
      url = _complementSlash(url);
      if (url.match(RE_IS_XPIC_ROOT_URL)) {
        return true;
      } else {
        return false;
      }
    };

    var _isBBSURL = function(url) {
      if (!url) return false;
      if (url.match(RE_GET_BBS_URL)) {
        return true;
      } else {
        return false;
      }
    };

    var _isFind2chURL = function(url) {
      if (!url) return false;
      if (url.match(RE_GET_FIND2CH_URL)) {
        return true;
      } else {
        return false;
      }
    };
    var _isDig2chURL = function(url) {
      if (!url) return false;
      if (url.match(RE_GET_DIG2CH_URL)) {
        return true;
      } else {
        return false;
      }
    };

    var _isHeadlineURL = function(url) {
      if (!url) return false;
      var bbsInfo = _getBBSInfo(url);
      if (!bbsInfo) return false;
      var bbs = bbsInfo.bbs;
      if (bbs == "headline") {
        return true;
      } else {
        return false;
      }
    };

    var _isAdultContents = function(url) {
      if (!url) return false;
      var bbsInfo = _getBBSInfo(url);
      ADULT_DOMAINS = [
        "bbspink.com",
        "xpic.sc"
      ];
      var domain;
      if (bbsInfo) {
        domain = bbsInfo.domain;
      } else {
        return false;
      }
      for (var len = ADULT_DOMAINS.length, i = 0; i < len; i++) {
        if (domain.indexOf(ADULT_DOMAINS[i], domain.length - ADULT_DOMAINS[i].length) !== -1) {
          // if endsWith "bbspink.com" etc...
          return true;
        }
      }
      return false;
    }; // _isAdultContents

    var _getBBSInfo = function(url) {
        var m;
        /*
         * 2ch url
         */
        // get from BBS URL
        m = url.match(RE_GET_BBS_URL);
        if (m) {
          if (!_isPermittedDomain(m[1])) return null;
          return {
            domain: m[1],
            bbs: m[2]
          };
        }
        // get from Thread URL
        m = url.match(RE_GET_THREAD_URL);
        if (m) {
          if (!_isPermittedDomain(m[1])) return null;
          return {
            domain: m[1],
            bbs: m[2],
            thread: m[3]
          };
        }
        // get from dat URL
        m = url.match(RE_GET_DAT_URL);
        if (m) {
          if (!_isPermittedDomain(m[1])) return null;
          return {
            domain: m[1],
            bbs: m[2],
            thread: m[3]
          };
        }
        /*
         * machibbs url
         */
        // get from BBS URL
        m = url.match(RE_GET_MACHI_BBS_URL);
        if (m) {
          if (!_isPermittedDomain(m[1])) return null;
          return {
            domain: m[1],
            bbs: m[2]
          };
        }
        // get from Thread URL
        m = url.match(RE_GET_MACHI_THREAD_URL);
        if (m) {
          if (!_isPermittedDomain(m[1])) return null;
          return {
            domain: m[1],
            bbs: m[2],
            thread: m[3]
          };
        }
        // get from dat URL
        m = url.match(RE_GET_MACHI_DAT_URL);
        if (m) {
          if (!_isPermittedDomain(m[1])) return null;
          return {
            domain: m[1],
            bbs: m[2],
            thread: m[3]
          };
        }
        return null;
      } // _getBBSInfo


    var _getMachiBBSInfo = function(url) {
        var m;
        // get from BBS URL
        var m = url.match(RE_GET_MACHI_BBS_URL);
        if (m) {
          if (!_isPermittedDomain(m[1])) return null;
          return {
            domain: m[1],
            bbs: m[2]
          };
        }
        // get from Thread URL
        var m = url.match(RE_GET_MACHI_THREAD_URL);
        if (m) {
          if (!_isPermittedDomain(m[1])) return null;
          return {
            domain: m[1],
            bbs: m[2],
            thread: m[3]
          };
        }
        // get from dat URL
        var m = url.match(RE_GET_MACHI_DAT_URL);
        if (m) {
          if (!_isPermittedDomain(m[1])) return null;
          return {
            domain: m[1],
            bbs: m[2],
            thread: m[3]
          };
        }
        return null;
      } // _getMachiBBSInfo

    var _getBBS = function(lastModified, onsuccess) {
      var requestHeaders = [];
      requestHeaders.push({
        key: "Cache-Control",
        value: "no-cache" // needs for acquiring dat realtime-updated
      });
      requestHeaders.push({
        key: "Pragma",
        value: "no-cache" // needs for acquiring dat realtime-updated
      });
      request.doRequest({
        url: URL_BBSMENU,
        requestHeaders: requestHeaders,
        onsuccess: function(xhr) {
            console.log("Getting bbs...");
            if (!xhr || !xhr.responseXML) {
              console.log("Nothing responsed");
              return;
            }
            elems = xhr.responseXML.body.getElementsByTagName("small")[0].children;
            var bbsmenu = [];
            var cate0 = null;
            for (var i = 0, len = elems.length; i < len; i++) {
              var elem = elems[i];
              if (elem.nodeName.toUpperCase() == "B") { // <B> tag
                cate0 = elem.innerText;
                continue;
              } else if (elem.nodeName.toUpperCase() == "A") { // <A HREF=...> tag
                if (_isPermittedURL(elem.href)) {
                  var p = {
                    cate0: cate0,
                    cate1: elem.innerText,
                    url: elem.href
                  };
                  bbsmenu.push(p);
                  // console.log(p);
                }
              }
            }
            console.log("BBS gotten.");
            // save bbsmenus to localStorage
            chrome.storage.local.set({
              bbsmenu_lastModified: lastModified,
              bbsmenu: bbsmenu
            }, function(e) {
              console.log("save bbsmenu to localStorage.");
              onsuccess(bbsmenu);
            });
          } // onsuccess
      });
    }; // _getBBS

    var _getThreadList = function(bbsURL, onsuccess, onerror) {
      var requestHeaders = [];
      requestHeaders.push({
        key: "Cache-Control",
        value: "no-cache" // needs for acquiring dat realtime-updated
      });
      requestHeaders.push({
        key: "Pragma",
        value: "no-cache" // needs for acquiring dat realtime-updated
      });
      bbsURL = _complementSlash(bbsURL);
      request.doRequest({
        url: bbsURL + "subject.txt",
        mimeType: "text/plain; charset=shift_jis",
        responseType: "text",
        requestHeaders: requestHeaders,
        onsuccess: function(xhr) {
          var txt = xhr.responseText;
          // console.log(txt);
          var threadList = _parseSubjectTxt(bbsURL, txt);
          onsuccess(threadList);
        },
        onerror: onerror
      }); // doRequest   
    }; // _getThreadList

    var _getHeadlineList = function(bbsURL, onsuccess, onerror) {
      var requestHeaders = [];
      requestHeaders.push({
        key: "Cache-Control",
        value: "no-cache" // needs for acquiring dat realtime-updated
      });
      requestHeaders.push({
        key: "Pragma",
        value: "no-cache" // needs for acquiring dat realtime-updated
      });
      request.doRequest({
        url: bbsURL,
        mimeType: "text/html; charset=shift_jis",
        responseType: "document",
        requestHeaders: requestHeaders,
        onsuccess: function(xhr) {
          var dom = xhr.response;
          // console.log(txt);
          var threadList = _parseHeadline(bbsURL, dom);
          onsuccess(threadList);
        },
        onerror: onerror
      }); // doRequest   
    }; // _getThreadList

    var _getThreadListByFind2ch = function(url, onsuccess, onerror) {
        // url eg. 'http://find.2ch.sc/?検索キーワード'
        var keywords = url.split(URL_FIND2CH + '?')[1];
        // from UTF8 "はげ" to EUC-JP "%a4%cf%a4%b2"
        keywords = _toUrlEncodedEUC(keywords);
        // query eg. "TYPE=TITLE&SCEND=D&SORT=MODIFIED&BBS=ALL&STR"
        var data = {
          STR: keywords,
          COUNT: "100",
          TYPE: "TITLE",
          SCEND: "D",
          SORT: "MODIFIED",
          BBS: "ALL"
        };
        var requestHeaders = [];
        requestHeaders.push({
          key: "Cache-Control",
          value: "no-cache" // needs for acquiring dat realtime-updated
        });
        requestHeaders.push({
          key: "Pragma",
          value: "no-cache" // needs for acquiring dat realtime-updated
        });
        request.doRequest({
          url: URL_FIND2CH,
          method: "GET",
          mimeType: "text/html; charset=euc-jp", // find.2ch.sc uses charset "euc-jp"
          responseType: "document",
          requestHeaders: requestHeaders,
          data: data,
          encoded: true, // because "keywords" has already encoded 
          onsuccess: function(xhr) {
            var xml = xhr.responseXML;
            var results;
            // console.log(xml);
            if (xml)
              results = xml
              .getElementsByClassName("content_pane")[0]
              .getElementsByTagName("dt");
            var threadList = _parseFind2chResults(results);
            onsuccess(threadList);
          },
          onerror: onerror
        }); // doRequest   
      } // _getThreadListByFind2ch

    var _toUrlEncodedEUC = function(str) {
      var arr = [];
      var ret;
      for (var len = str.length, i = 0; i < len; i++) arr.push(str.charCodeAt(i));
      ret = Encoding.convert(arr, 'EUCJP', 'UNICODE');
      return Encoding.urlEncode(ret);
    };

    var _getThreadListByDig2ch = function(url, onsuccess, onerror) {
        // 'http://dig.2ch.net/?検索キーワード'
        var keywords = url.split(URL_DIG2CH + '?')[1];
        var data = {
          keywords: keywords,
          AndOr: "0",
          maxResult: "200",
          atLeast: "1",
          Sort: "5",
          Link: "1",
          Bbs: "all"
        };
        var requestHeaders = [];
        requestHeaders.push({
          key: "Cache-Control",
          value: "no-cache" // needs for acquiring dat realtime-updated
        });
        requestHeaders.push({
          key: "Pragma",
          value: "no-cache" // needs for acquiring dat realtime-updated
        });
        request.doRequest({
          url: URL_DIG2CH,
          method: "GET",
          mimeType: "text/html; charset=UTF-8",
          responseType: "document",
          requestHeaders: requestHeaders,
          data: data,
          onsuccess: function(xhr) {
            var xml = xhr.responseXML;
            var results;
            // console.log(xml);
            if (xml) results = xml.getElementsByClassName("url");
            var threadList = _parseDig2chResults(results);
            onsuccess(threadList);
          },
          onerror: onerror
        }); // doRequest   
      } // _getThreadListByDig2ch

    var _parseSubjectTxt = function(bbsURL, txt) {
      // TODO: calc momentums
      var isMachi = false;
      if (bbsURL.match(/\.machi\.to\//)) isMachi = true;
      var ret = [];
      if (isMachi)
        SPLITTER = ".cgi,"; // for machi BBS
      else
        SPLITTER = "<>";
      var currentDate = new Date();
      var cols;
      var dat;
      var threadID;
      var tmp;
      var title;
      var res;
      var url;
      var momentum = 0;
      var lines = txt.split("\n");
      for (var len = lines.length, i = 0; i < len; i++) {
        cols = lines[i].split(SPLITTER);
        if (!cols || cols.length <= 1) {
          return ret;
        }
        dat = cols[0];
        tmp = cols[1].match(/(.+)\(([0-9]+)\)$/);
        if (!tmp || tmp.length < 2) continue;
        title = tmp[1];
        res = tmp[2];
        if (dat.substr(dat.length - 4, 4) == ".dat") {
          threadID = dat.substr(0, dat.length - 4);
        } else {
          threadID = dat;
        }
        momentum = _calcMomentum(res, threadID, currentDate);
        if (isMachi) {
          var bbsInfo = _getMachiBBSInfo(bbsURL);
          if (bbsInfo)
            url = "http://" + bbsInfo.domain + "/bbs/read.cgi/" + bbsInfo.bbs + "/" + dat + "/";
        } else {
          url = bbsURL + "dat/" + dat;
        }
        ret.push({
          url: url,
          title: title,
          res: res,
          momentum: momentum,
          index: i // index for the thread list display order
        });
      }
      return ret;
    }; // _parseSubjectTxt

    var _parseHeadline = function(bbsURL, dom) {
      var list = dom.getElementsByTagName("li");
      var li;
      var ret = [];
      var url, title, date;
      for (var len = list.length, i = 0; i < len; i++) {
        li = list[i];
        url = li.getElementsByTagName("a")[0].href;
        title = li.getElementsByTagName("a")[0].innerText;
        date = li.getElementsByTagName("var")[0].innerText;
        ret.push({
          url: url,
          title: title,
          date: date,
          res: 1
        });
      }
      // sort
      ret.sort(function(a, b) {
        if (a.date > b.date) {
          return -1;
        }
        if (a.date < b.date) {
          return 1;
        }
        // a must be equal to b
        return 0;
      });
      return ret;
    };

    var _parseFind2chResults = function(results) {
      var ret = [];
      var tmpDom;
      var url;
      var title;
      var res = "";
      for (var len = results.length, i = 0; i < len - 1; i++) { // "len - 1" because last one is a adv elem.
        // eg. "タイトル (999) - 板名＠sc"
        tmpDom = results[i];
        if (tmpDom) {
          title = tmpDom.innerText;
          if (!title) continue;
          res = title.match(/\(([0-9]+)\) - /)[1];
          url = tmpDom.getElementsByTagName("a")[0].href;
          url = _prettifyReadCGIURL(url);
          ret.push({
            url: url,
            title: title,
            res: res
          });
        }
      }
      return ret;
    }; // _parseFind2chResults

    var _parseDig2chResults = function(results) {
      var ret = [];
      var tmp;
      var title;
      var url;
      var res = "";
      var tinfo;
      var RE_GET_INFO_FROM_THREAD_TITLE = /(.*)\(([0-9]+)\)$/;

      // extract 2ch threads' link
      for (var len = results.length, i = 0; i < len; i++) {
        tmp = results[i];
        url = tmp.innerText;
        // res = "";
        if (_isReadCGIURL(url)) {
          url = _prettifyReadCGIURL(url);
          // e.g. <a href="http://bintan.ula.cc/test/read.cgi/xxx.2ch.net/zzz/999999999/l5">ThreadTitle (35)</a><br><div class="tab1em" ><span class="url">http://xxx.2ch.net/test/read.cgi/zzz/999999999/</span>
          tinfo = tmp.parentElement.previousElementSibling.previousElementSibling.innerText
            .match(RE_GET_INFO_FROM_THREAD_TITLE);
          title = tinfo[1];
          res = tinfo[2];
          ret.push({
            url: url,
            title: title,
            res: res
          });
        }
      }
      return ret;
    }; // _parseDig2chResults


    var _parseDat = function(daturl, ngWords, txt) {
      var isMachi = daturl.match(/\.machi\.to\//) ? true : false;
      var ret = {
        responses: []
      };
      SPLITTER = "<>";
      var cols;
      var tmp;
      var num;
      var handle;
      var email;
      var date;
      var uid;
      var be;
      var content;
      var title;
      var ng = false;
      var host;
      /* layout of record */
      var IDX_HANDLE = 0;
      var IDX_EMAIL = 1;
      var IDX_TMP = 2;
      var IDX_CONTENT = 3;
      var IDX_TITLE = 4;
      var IDX_HOST = -1;
      if (isMachi) {
        IDX_NUM = 0;
        IDX_HANDLE = 1;
        IDX_EMAIL = 2;
        IDX_TMP = 3;
        IDX_CONTENT = 4;
        IDX_TITLE = 5;
        IDX_HOST = 6;
      }
      /* /layout of record */
      var lines = txt.split("\n");
      for (var len = lines.length, i = 0; i < len; i++) {
        cols = lines[i].split(SPLITTER);
        if (!cols || cols.length <= 1) {
          return ret;
        }
        num = isMachi ? parseInt(cols[IDX_NUM]) : i + 1;
        // check NG Words (If not Mr.>>1)
        if (num != 1 && _isContained(lines[i], ngWords)) {
          ng = true;
        } else {
          ng = false;
          handle = cols[IDX_HANDLE];
          email = cols[IDX_EMAIL];
          tmp = cols[IDX_TMP].split(" ");
          tmp.length >= 2 ? date = tmp[0] + " " + tmp[1] : date = "";
          tmp.length >= 3 ? uid = tmp[2] : uid = "";
          tmp.length >= 4 ? be = tmp[3] : be = "";
          content = _makeLinks(cols[IDX_CONTENT]);
          title = cols[IDX_TITLE]; // 1st res only has "title"
          if (IDX_HOST != -1) {
            host = cols[IDX_HOST];
          } else {
            host = "";
          }
        }
        ret.responses.push({
          num: num,
          handle: handle,
          email: email,
          date: date,
          uid: uid,
          be: be,
          content: content,
          title: title,
          ng: ng,
          host: host
        });
      }
      return ret;
    }; // _parseDat

    var _parseHTML = function(url, ngWords, html) {
      var ret = {
        responses: [],
        title: undefined
      };
      console.log("html", html);
      var h1s = h1s = html.getElementsByTagName("h1");
      if (h1s && h1s.length >= 1) {
        ret.title = h1s[0].innerText;
      } else {
        // If thread title is not found, the page will be looked on improper read.cgi's page.
        return ret;
      }

      var arr = html.getElementsByTagName("dl")[0].children;
      var tmp;
      var num = 0;
      var data;
      for (var len = arr.length, i = 0; i < len; i++) {
        tmp = arr[i];
        if (i % 2 === 0) {
          //** odd is res info. 
          num += 1;
          // init
          data = {
            num: num,
            handle: undefined,
            email: undefined,
            date: undefined,
            uid: undefined,
            be: undefined,
            content: undefined,
            ng: false // contains NG words or not
          };
          // check NG Words (If ngWords is nothing or Mr.>>1's resHeader, do not check)
          if (ngWords && data.num != 1 && _isContained(tmp.textContent, ngWords)) {
            data.ng = true;
            continue;
          }
          // set resHeader data to vars
          _parseHTMLofResHeader(tmp.outerHTML, data);
        } else {
          //** even is res content.
          // check NG Words (If Mr.>>1's resContent, do not check)
          if (data.num != 1 && _isContained(tmp.textContent, ngWords)) {
            // if NG is contained in resContent
            data.ng = true;
          }
          // set resContent data to vars
          if (!data.ng) {
            _parseHTMLofResContent(tmp.outerHTML, data);
          }
          ret.responses.push(data);
        }
      }
      return ret;
    }; // _parseHTML

    var _parseHTMLofResHeader = function(html, data) {
      var arr;
      arr = html.match(RE_GET_RES_HEADER_WITH_EMAIL_FROM_READCGI);
      if (arr) {
        data.email = arr[1];
        data.handle = arr[2];
        data.date = arr[3];
        data.uid = arr[4];
        return;
      }
      arr = html.match(RE_GET_RES_HEADER_FROM_READCGI);
      if (arr) {
        data.handle = arr[1];
        data.date = arr[2];
        data.uid = arr[3];
        return;
      }
      arr = html.match(RE_GET_RES_HEADER_WITH_EMAIL_FROM_READCGI_WITHOUT_ID);
      if (arr) {
        data.email = arr[1];
        data.handle = arr[2];
        data.date = arr[3];
        return;
      }
      arr = html.match(RE_GET_RES_HEADER_FROM_READCGI_WITHOUT_ID);
      if (arr) {
        data.handle = arr[1];
        data.date = arr[2];
        return;
      }
    };
    var _parseHTMLofResContent = function(html, data) {
      var arr;
      arr = html.match(RE_GET_RES_CONTENT_FROM_READCGI);
      if (arr) {
        data.content = _makeLinks(arr[1]);
      }
    };


    /**
      calc a thread momentum
      @param {int} res's count
      @param {string} threadID
      @param {Date} current date. Optional. Default is new Date()
      @return {int} momentum value
    */
    function _calcMomentum(resCount, threadID, currentDate) {
      if (!currentDate) currentDate = new Date();
      // threadID of 2ch uses unix timestamp (which is "seconds" but not "miliseconds").
      var sec = currentDate.getTime() - (Number(threadID) * 1000);
      var tmp = resCount / (sec / 86400); // 86400 sec = 1 day
      // round to 2 decimal places
      return Math.round(tmp * 100) / 100;
    }


    /**
     * Check if the target text contains at least one of the specific word list.
     *
     * @param {string} targetText
     * @param {string[]} words
     *  word list which might be contained in the target text.
     * @return {bool}
     */
    var _isContained = function(targetText, words) {
      if (!targetText || !words || words.length <= 0) return false;
      var word;
      for (var len = words.length, i = 0; i < len; i++) {
        word = words[i];
        if (word.trim() == "") continue;
        if (targetText.indexOf(word) != -1) return true;
      }
      return false;
    }

    var _getThreadTitle = function(daturl, onend) {
      if (!daturl) {
        if (onend) onend();
        return;
      }
      var bbsInfo = _getBBSInfo(daturl);
      if (!bbsInfo) {
        if (onend) onend();
        return;
      }
      var subjectURL = "http://" + bbsInfo.domain + "/" + bbsInfo.bbs + "/subject.txt";
      var bbsURL = "http://" + bbsInfo.domain + "/" + bbsInfo.bbs + "/";
      var requestHeaders = [];
      requestHeaders.push({
        key: "Cache-Control",
        value: "no-cache" // needs for acquiring dat realtime-updated
      });
      requestHeaders.push({
        key: "Pragma",
        value: "no-cache" // needs for acquiring dat realtime-updated
      });
      request.doRequest({
        url: subjectURL,
        mimeType: "text/plain; charset=shift_jis",
        responseType: "text",
        requestHeaders: requestHeaders,
        onsuccess: function(xhr) {
          var title;
          var txt = xhr.responseText;
          // console.log(txt);
          var subjects = _parseSubjectTxt(bbsURL, txt);
          for (var len = subjects.length, i = 0; i < len; i++) {
            if (subjects[i].url == daturl) {
              title = subjects[i].title;
              break;
            }
          }
          onend(title);
        },
        onerror: function(e) {
          onend();
        }
      }); // doRequest   
    }; // _getThreadTitle

    var _getResponses = function(url, type, ngWords, onsuccess, onerror) {
      if (!url) {
        console.error("url is required.");
        onerror();
        return;
      }
      var mimeType;
      if (type == "html") {
        responseType = "document";
        mimeType = "text/html; charset=shift_jis";
      } else {
        responseType = "text";
        mimeType = "text/plain; charset=shift_jis";
      };
      var requestHeaders = [];
      requestHeaders.push({
        key: "Cache-Control",
        value: "no-cache" // needs for acquiring dat realtime-updated
      });
      requestHeaders.push({
        key: "Pragma",
        value: "no-cache" // needs for acquiring dat realtime-updated
      });
      //
      request.doRequest({
        url: url,
        mimeType: mimeType,
        responseType: responseType,
        requestHeaders: requestHeaders,
        onsuccess: function(xhr) {
          var xhrres;
          var ret;
          if (type == "dat") {
            xhrres = xhr.responseText;
            console.log("xhrres:", xhrres);
            ret = _parseDat(url, ngWords, xhrres);
            if (!ret.responses || ret.responses.length <= 0) {
              console.log("'dat' was not found. Trying to get 'html'...");
              _getResponses(url, "html", ngWords, onsuccess, onerror);
              return;
            }
          } else if (type == "html") {
            xhrres = xhr.responseXML;
            console.log("xhrres:", xhrres);
            if (xhrres.body.children.length >= 5 &&
              xhrres.body.children[4].innerText == "■ このスレッドは過去ログ倉庫に格納されています") {
              type = "kako"; // if the html is kakolog, set type 'kako'.
            }
            ret = _parseHTML(url, ngWords, xhrres);
          }
          onsuccess(ret, type);
          return;
        },
        onerror: onerror
      }); // doRequest   
    }; // _getResponses

    var _getLatestResnum = function(daturl, onsuccess, onerror) {
      if (!daturl) {
        console.error("daturl is required.");
        onerror();
        return;
      }
      var isMachi = _isMachiDatURL(daturl) ? true : false;
      var mimeType = "text/plain; charset=shift_jis";
      var responseType = "text";
      var requestHeaders = [];
      requestHeaders.push({
        key: "Cache-Control",
        value: "no-cache" // needs for acquiring dat realtime-updated
      });
      requestHeaders.push({
        key: "Pragma",
        value: "no-cache" // needs for acquiring dat realtime-updated
      });
      request.doRequest({
        url: daturl,
        mimeType: mimeType,
        responseType: responseType,
        requestHeaders: requestHeaders,
        onsuccess: function(xhr) {
          var xhrres;
          var ret;
          xhrres = xhr.responseText;
          console.log("xhrres:", xhrres);
          var lines = xhrres.split("\n");
          var lineLen = lines.length;
          if (lines) {
            if (isMachi) { // ** when machibbs
              ret = lines[lineLen - 2].split("<>")[0]; // get index [lineLen - 2] because last line is empty.
            } else {
              ret = lines.length - 1;
            }
          }
          onsuccess(ret);
          return;
        },
        onerror: onerror
      }); // doRequest   
    }; // _getLatestResnum

    /**
     * update access history
     * @param newurl new URL to add
     * @param newurl new Title to add
     */
    var _updateHistory = function(newurl, newtitle) {
      console.log("_updateHistory");
      var url;
      // TODO: implements history button 
      if (!newurl || !newtitle) {
        console.error("_updateHistory(): params are required.");
        return;
      }
      if (_isReadCGIURL(newurl) || _isMachiReadCGIURL(newurl)) {
        url = newurl;
      } else if (_isXpicReadCGIURL) {
        url = newurl;
      } else if (_isDatURL) {
        url = _datURLToReadCGIURL(newurl);
      } else if (_isMachiDatURL) {
        url = _machiDatURLToReadCGIURL(newurl);
      } else {
        console.error("_updateHistory(): newurl's type is unknown.");
        return;
      }
      // get data by url (key)
      var data = _getObjectFromObjectArray(history, "url", url);
      if (data) {
        data.lastAccess = new Date().getTime();
      } else {
        data = {
          url: url,
          title: newtitle,
          lastAccess: new Date().getTime()
        };
        history.push(data);
      }
      // sort by lastAccess
      history.sort(function(a, b) {
        return b.lastAccess - a.lastAccess
      });
      // tail-cut
      history.splice(HISTORY_MAX);
      // set current url in history
      currURLInHistory = url;
    };

    var _getHistory = function() {
      return history;
    };

    var _getIdxInHistory = function(url) {
      var tmp;
      var objArr = history;
      for (var len = objArr.length, i = 0; i < len; i++) {
        tmp = objArr[i];
        if (tmp.url == url) return i;
      }
      return -1;
    };

    var _getObjectFromObjectArray = function(objArr, keyname, value) {
      var tmp;
      for (var len = objArr.length, i = 0; i < len; i++) {
        tmp = objArr[i];
        if (tmp[keyname] == value) return tmp;
      }
      return null;
    };

    /**
     * var arr = [ { p1: "aaa" }, { p1: "bbb" } ];
     * _objectArrayIndexOf(arr, "p1", "bbb"); // returns 1;
     */
    var _objectArrayIndexOf = function(arr, property, searchTerm) {
      for (var i = 0, len = arr.length; i < len; i++) {
        if (arr[i][property] === searchTerm) return i;
      }
      return -1;
    }

    var _prettifyReadCGIURL = function(url) {
      if (url.match(/\/(test|bbs)\/read\.cgi\//)) {
        var arr = url.split("/");
        // "http://hoge.2ch.net/test/read.cgi/aaa/1234567890/l5" -> "http://hoge.2ch.net/test/read.cgi/aaa/1234567890/"
        if (arr.length >= 7) arr.splice(7, arr.length - 7);
        url = arr.join("/") + "/";
        if (url.slice(-2) == "//") url = url.substr(0, url.length - 1);
      }
      return url;
    }

    var _prettifyMachiReadCGIURL = function(url) {
      if (url.match(/\/bbs\/read\.cgi\//)) {
        var arr = url.split("/");
        // "http://hoge.machi.to/bbs/read.cgi/aaa/1234567890/l5" -> "http://hoge.machi.to/bbs/read.cgi/aaa/1234567890/"
        if (arr.length >= 7) arr.splice(7, arr.length - 7);
        url = arr.join("/") + "/";
        if (url.slice(-2) == "//") url = url.substr(0, url.length - 1);
      }
      return url;
    }

    /**
     * conv Dat's URL to read.cgi's URL
     */
    var _datURLToReadCGIURL = function(daturl) {
      if (_isReadCGIURL(daturl)) return daturl;
      if (!_isDatURL(daturl)) return null;
      var bbsInfo = _getBBSInfo(daturl);
      if (!bbsInfo) return null;
      return "http://" + bbsInfo.domain + "/test/read.cgi/" + bbsInfo.bbs + "/" + bbsInfo.thread + "/";
    };
    /**
     * conv machi.to's dat URL to read.cgi's URL
     */
    var _machiDatURLToReadCGIURL = function(daturl) {
      if (_isMachiReadCGIURL(daturl)) return daturl;
      if (!_isMachiDatURL(daturl)) return null;
      var bbsInfo = _getMachiBBSInfo(daturl);
      if (!bbsInfo) return null;
      return "http://" + bbsInfo.domain + "/bbs/read.cgi/" + bbsInfo.bbs + "/" + bbsInfo.thread + "/";
    };
    /**
     * conv machi.to's read.cgi URL to offlaw.cgi's URL
     */
    var _machiReadCGIURLToOfflawCGIURL = function(url) {
      if (_isMachiReadCGIURL(url)) {
        var bbsInfo = _getMachiBBSInfo(url);
        if (!bbsInfo) return null;
        return "http://www.machi.to/bbs/offlaw.cgi/2/" + bbsInfo.bbs + "/" + bbsInfo.thread + "/";
      }
    };
    /**
     * conv read.cgi's URL to dat URL
     */
    var _readCGIURLToDatURL = function(url) {
      if (_isDatURL(url)) return url;
      if (!_isReadCGIURL(url)) return null;
      var bbsInfo = _getBBSInfo(url);
      if (!bbsInfo) return null;
      return "http://" + bbsInfo.domain + "/" + bbsInfo.bbs + "/dat/" + bbsInfo.thread + ".dat";
    };

    /**
     * makes links to URLs and anchors.
     *
     *  This function works like these...
     *    1: makes autolink to URL started with "http://..." or "https://..."
     *    2: puts a link with custom attribute "data-anchorLink" to URL string.
     *      e.g. '&gt;123' to '<a data-resnum="123">&gt;123</a>'
     *            Also, zenkaku number '１２３' and zenkaku gt; '＞' is OK.
     *
     */
    var _makeLinks = function(str) {

      function zennum2han(zennum) {
        han = "0123456789";
        zen = "０１２３４５６７８９";
        str = "";
        for (var len = zennum.length, i = 0; i < len; i++) {
          c = zennum.charAt(i);
          n = zen.indexOf(c, 0);
          if (n >= 0) c = han.charAt(n);
          str += c;
        }
        return str;
      }

      function autolink(str) {
        return str.replace(/[h]?ttp[s]?:\/\/[\x21-\x3b,\x3d-\x7e]+/g, function(match) {
          url = match;
          // deal with irregular url like 'ttp://...'
          if (match.substring(0, 3) == "ttp") {
            url = "h" + match;
          }
          return '<a href="' + url + '">' + match + '</a>';
        });
      }

      // 1st, remove all 'a' tags.
      str = str.replace(/<a.+?>|<\/a>/g, '');

      // 2nd, remove all 'img' tags. for "xpic.sc"
      str = str.replace(/<img.+?>|<\/img>/g, '');

      // 3rd, make link to urls.
      str = autolink(str);

      // Last, make anchor links.
      return str.replace(/(((\&gt;)+)(\d+\-\d+))|((＞+)([０-９]+))|((＞+)(\d+))|(((\&gt;)+)(\d+))|(((\&gt;)+)([０-９]+))/g, function() {
        // data as it is: e.g. "&gt;&gt;999"
        var asitis = arguments[0];
        // hankaku number: e.g. 999
        var num = "";

        if (!arguments || arguments.length < 14) return asitis;

        /*
        idx: value
        ----------------
        0: &gt;&gt;999 | &gt;999 | ＞＞999 | ＞＞９９９ | &gt;1-2 | &gt;&gt;1-2
        1:
        2: &gt;&gt;
        3: 
        4: 12-34
        5:
        6: ＞＞
        7: ９９９
        8: 
        9:
        10: 
        11:
        12: &gt;&gt;
        13: 
        14: 999
        15:
        16: &gt;&gt;
        17:
        18: ９９
        */
        if (arguments[2] && arguments[4]) {
          num = arguments[4]; // "1-999"
        } else if (arguments[6] && arguments[7]) {
          num = zennum2han(arguments[7]); // "９９９"->"999"
        } else if (arguments[12] && arguments[14]) {
          num = arguments[14]; // "999"
        } else if (arguments[16] && arguments[18]) {
          num = zennum2han(arguments[18]); // "９９９"->"999"
        }

        if (num) {
          return '<a data-resnum="' + num + '">' + asitis + '</a>';
        } else {
          return asitis;
        }
      });

    }

    // complement a slash to suffix. 
    // e.g. "http://a.2ch.net/test/read.cgi/123" -> "http://a.2ch.net/test/read.cgi/123/"
    var _complementSlash = function(url) {
      // suffix is not ".dat" and doesn't end with "/"
      if (url.slice(-1) != "/" && url.slice(-4) != ".dat") {
        return url + "/";
      }
      return url;
    }

    // replace domain "2ch.net" to "2ch.sc"
    var _replace2chNetDomainToSc = function(url) {
      if (!url) return null;
      return url.replace(/(^https?:\/\/[^\/]*)(\.2ch\.net):?[0-9]*?(\/.*)?/, "$1" + ".2ch.sc" + "$3");
    }

    var _is2chBBSURL = function(url) {
      if (url.match(RE_GET_2CHBBS_URL))
        return true;
      else
        return false;
    }

    return {

      // put links to a content of 2ch response.
      makeLinks: function(content) {
        return _makeLinks(content);
      },
      /**
       * get BBS from local cache
       */
      getBBSFromCache: function(onsuccess) {
        chrome.storage.local.get(["bbsmenu"], function(item) {
          // console.log("get BBS from cache");
          onsuccess(item.bbsmenu);
        });
      },
      /**
       * update BBS List
       */
      updateBBS: function(onsuccess, onerror) {
        var requestHeaders = [];
        requestHeaders.push({
          key: "Cache-Control",
          value: "no-cache" // needs for acquiring dat realtime-updated
        });
        requestHeaders.push({
          key: "Pragma",
          value: "no-cache" // needs for acquiring dat realtime-updated
        });
        request.doRequest({
          url: URL_BBSMENU,
          method: "HEAD",
          requestHeaders: requestHeaders,
          onsuccess: function(xhr) {
            var lm = xhr.getResponseHeader("Last-Modified");
            // get localStorage's "bbsmenu_lastModified"
            chrome.storage.local.get(["bbsmenu", "bbsmenu_lastModified"], function(item) {
              if (!item || item.bbsmenu_lastModified != lm || !item.bbsmenu) {
                // get BBSMENU
                _getBBS(lm, onsuccess);
              } else {
                console.log("BBSMENU not modified");
                onsuccess(item.bbsmenu);
              }
            });
          },
          onerror: onerror
        }); // doRequest
      },
      /**
       * check whether the url is permitted or not
       */
      isPermittedURL: function(url) {
        var m = url.match(RE_GET_DOMAIN);
        if (m && m[1]) {
          var domain = m[1];
          return _isPermittedDomain(domain);
        }
        return false;
      },
      /**
       * whether dat's URL or not
       */
      isDatURL: function(url) {
        return _isDatURL(url);
      },
      /**
       * whether machibbs dat's URL or not
       */
      isMachiDatURL: function(url) {
        return _isMachiDatURL(url);
      },
      /**
       * whether read.cgi's URL or not
       */
      isReadCGIURL: function(url) {
        return _isReadCGIURL(url);
      },
      /**
       * whether mach's read.cgi's URL or not
       */
      isMachiReadCGIURL: function(url) {
        return _isMachiReadCGIURL(url);
      },
      /**
       * whether xpic's read.cgi's URL or not
       */
      isXpicReadCGIURL: function(url) {
        return _isXpicReadCGIURL(url);
      },
      /**
       * whether xpic's bbs's root URL or not
       */
      isXpicBBSRootURL: function(url) {
        return _isXpicBBSRootURL(url);
      },
      /**
       * whether bbs's URL or not
       */
      isBBSURL: function(url) {
        return _isBBSURL(url);
      },
      /**
       * whether bbs's URL or not
       */
      is2chBBSURL: function(url) {
        return _is2chBBSURL(url);
      },
      /**
       * whether headline's URL or not
       */
      isHeadlineURL: function(url) {
        return _isHeadlineURL(url);
      },
      /**
       * whether find.2ch.net's URL or not
       */
      isFind2chURL: function(url) {
        return _isFind2chURL(url);
      },
      /**
       * whether dig.2ch.net's URL or not
       */
      isDig2chURL: function(url) {
        return _isDig2chURL(url);
      },
      /**
       * whether adult content's URL or not
       */
      isAdultContents: function(url) {
        return _isAdultContents(url);
      },
      /**
       * get bbs info from url
       *
       * @param {string} url
       * @return {json}
       *  properties:
       *    "domain"
       *    "bbs"
       *    "thread" (exists if "url" will be the type of thread)
       */
      getBBSInfo: function(url) {
        return _getBBSInfo(url);
      },
      /**
       * update access history
       * @param newUrl
       *    new url
       * @param newTitle
       *    new title
       * @param curUrl
       *    current url
       */
      updateHistory: function(newUrl, newTitle) {
        return _updateHistory(newUrl, newTitle);
      },
      /**
       * returns history
       */
      getHistory: function() {
        return _getHistory();
      },
      /**
       * retruns index number of history by url
       */
      getIdxInHistory: function(url) {
        return _getIdxInHistory(url);
      },
      /**
       * get thread list from BBS URL
       */
      getThreadList: function(bbsURL, onsuccess, onerror) {
        if (_isFind2chURL(bbsURL)) {
          _getThreadListByFind2ch(bbsURL, onsuccess, onerror);
        } else if (_isHeadlineURL(bbsURL)) {
          _getHeadlineList(bbsURL, onsuccess, onerror);
        } else {
          _getThreadList(bbsURL, onsuccess, onerror);
        }
      },
      /**
       * get find.2ch.net URL with some parameters including keyword
       * @param kwd {string} keyword
       */
      getFind2chURL: function(kwd) {
        kwd = kwd.replace(URL_FIND2CH + "?", "");
        return URL_FIND2CH + "?" + kwd;
      },
      getDig2chURL: function(kwd) {
        kwd = kwd.replace(URL_DIG2CH + "?", "");
        return URL_DIG2CH + "?" + kwd;
      },
      /**
       * get keyword from find2ch's queryStrings
       */
      getKeywordFromFind2chURL: function(url) {
        if (!_isFind2chURL(url)) return null;
        kwd = url.replace(URL_FIND2CH + "?", "");
        return kwd;
      },
      /**
       * get keyword from dig2ch's queryStrings
       */
      getKeywordFromDig2chURL: function(url) {
        if (!_isDig2chURL(url)) return null;
        kwd = url.replace(URL_DIG2CH + "?", "");
        return kwd;
      },
      /**
       * get thread title from DAT URL
       */
      getThreadTitle: function(daturl, onend) {
        _getThreadTitle(daturl, onend);
        return;
      },
      /**
       * convert 2ch.sc's url to 2ch.net's
       * @param {string} 2ch.net's url
       */
      netToSc: function(url) {
        return url.replace(RE_NET_TO_SC, function(match, p1, p2, p3) {
          return p1 + "sc" + p3;
        });
      },
      /**
       * .../test/read.cgi/xxxxxxx/l50 to ../test/read.cgi/xxxxxxx/
       */
      prettifyReadCGIURL: function(url) {
        return _prettifyReadCGIURL(url);
      },
      /**
       * conv Dat's URL to read.cgi's URL
       */
      datURLToReadCGIURL: function(daturl) {
        return _datURLToReadCGIURL(daturl);
      },
      /**
       * conv machi's dat URL to read.cgi's URL
       */
      machiDatURLToReadCGIURL: function(daturl) {
        return _machiDatURLToReadCGIURL(daturl);
      },
      /**
       * conv machi's dat URL to read.cgi's URL
       */
      machiReadCGIURLToOfflawCGIURL: function(url) {
        return _machiReadCGIURLToOfflawCGIURL(url);
      },
      /**
       * conv read.cgi's URL to dat URL
       */
      readCGIURLToDatURL: function(url) {
        return _readCGIURLToDatURL(url);
      },
      /**
       * get responses of the thread
       * @param url
       * @param {string[]} ngWords
       *  NG Words
       * @param onsuccess
       *  onsuccess(responses, type)
       * @param onerror
       */
      getResponses: function(url, ngWords, onsuccess, onerror) {
        var type;
        if (_isDatURL(url)) {
          type = "dat";
        } else if (_isReadCGIURL(url)) {
          type = "html";
        } else if (_isMachiReadCGIURL(url)) {
          // convert machi.to's dat url to offlaw.cgi's dat url
          // offlaw url like this: "http://www.machi.to/bbs/offlaw.cgi/tawara/1269441710/"
          url = _machiReadCGIURLToOfflawCGIURL(url);
          type = "dat";
        } else {
          console.error("Unrecognized 'url' type. url:", url);
          return;
        }
        _getResponses(url, type, ngWords, onsuccess, onerror);
        return;
      },
      // complement slash "/" to tail-end of url
      complementSlash: function(url) {
        return _complementSlash(url);
      },
      // replace domain "2ch.net" to "2ch.sc"
      replace2chNetDomainToSc: function(url) {
        return _replace2chNetDomainToSc(url);
      },
      /**
       * get latest resnum of the thread
       * @param url
       *    CAUTION: "url" is read.cgi's URL only
       * @param onsuccess
       *  onsuccess(responses, type)
       * @param onerror
       */
      getLatestResnum: function(url, onsuccess, onerror) {
          var isReadCGI = _isReadCGIURL(url);
          var isMachiReadCGI = _isMachiReadCGIURL(url);
          var daturl;

          if (!isReadCGI && !isMachiReadCGI) {
            console.warn("read.cgi's url only. url:", url);
            return;
          }

          if (isReadCGI) daturl = _readCGIURLToDatURL(url);
          if (isMachiReadCGI) daturl = _machiReadCGIURLToOfflawCGIURL(url);

          _getLatestResnum(daturl, onsuccess, onerror);
          return;
        } // getLatestResnum

    }; // return

  };

  exports.niichrome = niichrome;
})(this);