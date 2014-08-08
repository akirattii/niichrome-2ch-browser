/**
 * niichrome-util2ch
 *
 * @version 0.5.0
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
      /\.2ch\.net$/,
      /\.bbspink\.com$/,
      /\.machi\.to$/,
      /\.open2ch\.net$/,
    ];

    // bbsmenu URL
    URL_BBSMENU = "http://menu.2ch.net/bbsmenu.html";

    // find.2ch URL
    URL_FIND2CH = "http://find.2ch.net/search?board=&site=&match=full&status=&size=100&q=";

    // dig.2ch URL
    URL_DIG2CH = "http://dig.2ch.net/";

    // regex for getting bbs info from url
    // e.g. http://anago.2ch.net/namazuplus/
    RE_GET_BBS_URL = /^[https]+\:\/\/([_0-9a-zA-Z.]+):?[0-9]*?\/([_0-9a-zA-Z.]+)\/$/;
    // regex for getting bbs info from url
    // e.g. http://find.2ch.net/search?...
    RE_GET_FIND2CH_URL = /^[https]+\:\/\/find\.2ch\.net:?[0-9]*?\/search\?/;
    // regex for getting bbs info from url
    // e.g. http://dig.2ch.net/search?...
    RE_GET_DIG2CH_URL = /^[https]+\:\/\/dig\.2ch\.net:?[0-9]*?/;
    // regex for getting thread info from url
    // e.g. http://uni.2ch.net/test/read.cgi/newsplus/1392945620/l50
    RE_GET_THREAD_URL = /^[https]+\:\/\/([_0-9a-zA-Z.]+):?[0-9]*?\/test\/read\.cgi\/([_0-9a-zA-Z.]+)\/([0-9]+)\/[0-9a-z\-]*$/;
    // regex for getting dat info from url
    // e.g. http://uni.2ch.net/newsplus/dat/1392945620.dat
    RE_GET_DAT_URL = /^[https]+\:\/\/([_0-9a-zA-Z.]+):?[0-9]*?\/([_0-9a-zA-Z.]+)\/dat\/([0-9]+)\.dat$/;
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

    var request = niichrome.request();

    // max count of 'history'
    HISTORY_MAX = 30;
    // history cache
    var history = {
      bbsURLs: [],
      threadURLs: []
    };

    var _isPermittedDomain = function(domain) {
      var ret;
      for (var len = RE_PERMISSIONS.length, i = 0; i < len; i++) {
        ret = domain.match(RE_PERMISSIONS[i]);
        if (ret) return true;
      }
      return false;
    }

    var _isPermittedURL = function(url) {
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
      // TODO: host check
      // isAppropriateHost: function(url) {
      //   if (!url) {
      //     logger.error("url required!");
      //     return false;
      //   }
      //   if (url.match(/\.2ch\.net\/.+/)) return true;
      //   if (url.match(/\.bbspink\.com\/.+/)) return true;
      //   if (url.match(/\.machi\.to\/.+/)) return true;
      //   return false;
      // };

    var _isDatURL = function(url) {
      if (!url) return false;
      if (url.match(RE_GET_DAT_URL)) {
        return true;
      } else {
        return false;
      }
    };

    var _isReadCGIURL = function(url) {
      if (!url) return false;
      if (url.match(RE_GET_THREAD_URL)) {
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
      var domain = bbsInfo.domain;
      if (domain == "headline.2ch.net") {
        return true;
      } else {
        return false;
      }
    };

    var _isAdultContents = function(url) {
      if (!url) return false;
      var bbsInfo = _getBBSInfo(url);
      BBSPINK_DOMAIN = "bbspink.com";
      var domain = bbsInfo.domain;
      if (domain.indexOf(BBSPINK_DOMAIN, domain.length - BBSPINK_DOMAIN.length) !== -1) {
        // if endsWith "bbspink.com"...
        return true;
      } else {
        return false;
      }
    };

    var _getBBSInfo = function(url) {
      var m;
      // get from BBS URL
      var m = url.match(RE_GET_BBS_URL);
      if (m) {
        if (!_isPermittedDomain(m[1])) return null;
        return {
          domain: m[1],
          bbs: m[2]
        };
      }
      // get from Thread URL
      var m = url.match(RE_GET_THREAD_URL);
      if (m) {
        if (!_isPermittedDomain(m[1])) return null;
        return {
          domain: m[1],
          bbs: m[2],
          thread: m[3]
        };
      }
      // get from dat URL
      var m = url.match(RE_GET_DAT_URL);
      if (m) {
        if (!_isPermittedDomain(m[1])) return null;
        return {
          domain: m[1],
          bbs: m[2],
          thread: m[3]
        };
      }
      return null;
    }

    var _getBBS = function(lastModified, onsuccess) {
      request.doRequest({
        url: URL_BBSMENU,
        onsuccess: function(xhr) {
          console.log("Getting bbs...");
          if (!xhr || !xhr.responseXML) {
            console.log("Nothing responsed");
            return;
          }
          elems = xhr.responseXML.body.getElementsByTagName("font")[0].children;
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
      request.doRequest({
        url: bbsURL + "subject.txt",
        mimeType: "text/plain; charset=shift_jis",
        responseType: "text",
        onsuccess: function(xhr) {
          var txt = xhr.responseText;
          // console.log(txt);
          var threadList = _parseSubjectTxt(bbsURL, txt);
          onsuccess(threadList);
        },
        onerror: onerror
      }); // doRequest   
    }// _getThreadList

    var _getThreadListByFind2ch = function(url, onsuccess, onerror) {
      request.doRequest({
        url: url,
        mimeType: "text/html; charset=shift_jis",
        responseType: "document",
        onsuccess: function(xhr) {
          var xml = xhr.responseXML;
          var results;
          // console.log(xml);
          if(xml) results = xml.getElementsByClassName("result");
          var threadList = _parseFind2chResults(results);
          onsuccess(threadList);
        },
        onerror: onerror
      }); // doRequest   
    }// _getThreadListByFind2ch

    var _getThreadListByDig2ch = function(url, onsuccess, onerror) {
      // 'http://dig.2ch.net/?検索キーワード'
      var keywords = url.split(URL_DIG2CH + '?')[1];
      var data = {
        keywords: keywords,
        AndOr: "0",
        maxResult: "200",
        atLeast: "1",
        Sort: "1",
        Link: "1",
        Bbs: "all"
      };
      request.doRequest({
        url: url,
        method: "POST",
        mimeType: "text/html; charset=UTF-8",
        responseType: "document",
        data: data,
        onsuccess: function(xhr) {
          var xml = xhr.responseXML;
          var results;
          // console.log(xml);
          if(xml) results = xml.getElementsByTagName("a");
          var threadList = _parseDig2chResults(results);
          onsuccess(threadList);
        },
        onerror: onerror
      }); // doRequest   
    }// _getThreadListByDig2ch

    var _parseSubjectTxt = function(bbsURL, txt) {
      var ret = [];
      SPLITTER = "<>";
      if (bbsURL.match(/\.machi\.to\//)) {
        SPLITTER = ","; // for machi BBS
      }
      var cols;
      var dat;
      var tmp;
      var title;
      var res;
      var lines = txt.split("\n");
      for (var len = lines.length, i = 0; i < len; i++) {
        cols = lines[i].split(SPLITTER);
        if (!cols || cols.length <= 1) {
          return ret;
        }
        dat = cols[0];
        tmp = cols[1].match(/(.+)\(([0-9]+)\)$/);
        title = tmp[1];
        res = tmp[2];
        ret.push({
          url: bbsURL + "dat/" + dat,
          title: title,
          res: res
        })
      }
      return ret;
    }; // _parseSubjectTxt

    var _parseFind2chResults = function(results) {
      var ret = [];
      var tmpDom;
      var url;
      var title;
      var res = "";
      for (var len = results.length, i = 1; i < len; i++) { // Skip first element as AD.
        tmpDom = results[i].getElementsByClassName("h5")[0];
        if (tmpDom) {
          title = tmpDom.innerText;
          url = tmpDom.childNodes[0].href;
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
        url = tmp.href;
        // res = "";
        if (_isReadCGIURL(url)) {
          url = _prettifyReadCGIURL(url);
          tinfo = tmp.innerText.match(RE_GET_INFO_FROM_THREAD_TITLE);
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


    var _parseDat = function(daturl, txt) {
      var ret = {
        responses: []
      };
      SPLITTER = "<>";
      if (daturl.match(/\.machi\.to\//)) {
        SPLITTER = ","; // for machi BBS
      }
      var cols;
      var tmp;
      var num;
      var handle;
      var email;
      var date;
      var uid;
      var be;
      var content;
      var lines = txt.split("\n");
      for (var len = lines.length, i = 0; i < len; i++) {
        cols = lines[i].split(SPLITTER);
        if (!cols || cols.length <= 1) {
          return ret;
        }
        num = i + 1;
        handle = cols[0];
        email = cols[1];
        tmp = cols[2].split(" ");
        if (tmp.length >= 2) date = tmp[0] + " " + tmp[1];
        if (tmp.length >= 3) uid = tmp[2];
        if (tmp.length >= 4) be = tmp[3];
        content = _makeLinks(cols[3]);
        ret.responses.push({
          num: num,
          handle: handle,
          email: email,
          date: date,
          uid: uid,
          be: be,
          content: content
        });
      }
      return ret;
    }; // _parseDat

    var _parseHTML = function(url, html) {
      var ret = {
        responses: [],
        title: undefined
      };
      console.log("html", html);
      var h1s = html.getElementsByTagName("h1");
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
          // odd is res info. 
          num += 1;
          // init
          data = {
            num: num,
            handle: undefined,
            email: undefined,
            date: undefined,
            uid: undefined,
            be: undefined,
            content: undefined
          };
          // set resHeader data to vars
          _parseHTMLofResHeader(tmp.outerHTML, data);
        } else {
          // even is res content.
          // set resContent data to vars
          _parseHTMLofResContent(tmp.outerHTML, data);
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
      request.doRequest({
        url: subjectURL,
        mimeType: "text/plain; charset=shift_jis",
        responseType: "text",
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

    var _getResponses = function(url, type, onsuccess, onerror) {
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
      request.doRequest({
        url: url,
        mimeType: mimeType,
        responseType: responseType,
        onsuccess: function(xhr) {
          var xhrres;
          var ret;
          if (type == "dat") {
            xhrres = xhr.responseText;
            console.log("xhrres:", xhrres);
            ret = _parseDat(url, xhrres);
            if (!ret.responses || ret.responses.length <= 0) {
              console.log("'dat' was not found. Trying to get 'html'...");
              _getResponses(url, "html", onsuccess, onerror);
              return;
            }
          } else if (type == "html") {
            xhrres = xhr.responseXML;
            console.log("xhrres:", xhrres);
            if (xhrres.body.children.length >= 5 &&
              xhrres.body.children[4].innerText == "■ このスレッドは過去ログ倉庫に格納されています") {
              type = "kako"; // if the html is kakolog, set type 'kako'.
            }
            ret = _parseHTML(url, xhrres);
          }
          onsuccess(ret, type);
          return;
        },
        onerror: onerror
      }); // doRequest   
    }; // _getResponses

    /**
     * update access history
     * @param newurl new URL to add
     * @param cururl current URL
     */
    var _updateHistory = function(newurl, cururl) {
      var arr;
      if (_isBBSURL(newurl)) {
        arr = history.bbsURLs;
      } else if (_isReadCGIURL(newurl) || _isDatURL(newurl)) {
        arr = history.threadURLs;
      } else {
        return;
      }
      // splice values of array lower than current url's index 
      var matchedIdx = arr.indexOf(cururl);
      if (matchedIdx >= 1) {
        arr.splice(0, matchedIdx);
      }
      if (arr && arr[0] != newurl){
        // unshift new url
        arr.unshift(newurl);
      }
      // 
      if (arr.length > HISTORY_MAX) arr.pop();
      console.log("history", history);
    };

    /**
     * get prev and next URL
     * @param curUrl 
     *  current URL
     * @return {json} 
     *  { backURL, forwardURL }
     */
    var _getBackAndForwardURL = function(curUrl) { 
      var ret = {
        backURL: undefined,
        forwardURL: undefined
      };
      var arr;
      if (_isBBSURL(curUrl)) {
        arr = history.bbsURLs;
      } else if (_isReadCGIURL(curUrl) || _isDatURL(curUrl)) {
        arr = history.threadURLs;
      } else {
        return ret;
      }
      var matchedIdx = arr.indexOf(curUrl);
      if (matchedIdx === -1) return ret;
      // get prev url
      var backIdx = matchedIdx + 1;
      var maxIdx = arr.length - 1;
      if (maxIdx >= backIdx) {
        ret.backURL = arr[backIdx];
      }
      var forwardIdx = matchedIdx - 1;
      if (forwardIdx >= 0) {
        ret.forwardURL = arr[forwardIdx];
      }
      return ret;
    }

    var _prettifyReadCGIURL = function(url) {
      if (url.match(/\/test\/read\.cgi\//)) {
          var arr = url.split("/");
          arr.pop();
          url = arr.join("/") + "/";
        }
        return url;
    }

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

      // 1st, remove all 'A' tags.
      str = str.replace(/<a.+?>|<\/a>/g, '');

      // 2nd, make link to urls.
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
        request.doRequest({
          url: URL_BBSMENU,
          method: "HEAD",
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
       * whether read.cgi's URL or not
       */
      isReadCGIURL: function(url) {
        return _isReadCGIURL(url);
      },
      /**
       * whether bbs's URL or not
       */
      isBBSURL: function(url) {
        return _isBBSURL(url);
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
       * @param curUrl
       *    current url
       */
      updateHistory: function(newUrl, curUrl) {
        return _updateHistory(newUrl, curUrl);
      },
      /**
       * get prev and next URL
       * @param curUrl 
       *  current URL
       * @return {json} 
       *  { backURL, forwardURL }
       */
      getBackAndForwardURL: function(curUrl) {
        return _getBackAndForwardURL(curUrl);
      },
      /**
       * get thread list from BBS URL
       */
      getThreadList: function(bbsURL, onsuccess, onerror) {
        if (_isDig2chURL(bbsURL)) {
          _getThreadListByDig2ch(bbsURL, onsuccess, onerror);
        } else {
          _getThreadList(bbsURL, onsuccess, onerror);
        }
      },
      /**
       * get find.2ch.net URL with some parameters including keyword
       * @param kwd {string} keyword
       */
      getFind2chURL: function(kwd) {
        return URL_FIND2CH + encodeURIComponent(kwd).replace(/%20/g, '+');
      },
      getDig2chURL: function(kwd){
        kwd = kwd.replace(URL_DIG2CH + "?", "");
        return URL_DIG2CH + "?" + kwd;
      },
      /**
       * get keyword from find2ch's queryStrings
       */
      getKeywordFromFind2chURL: function(url) {
        if (!_isFind2chURL(url)) return null;
        var qstr = url.split("?")[1];
        var qarr = qstr.split("&");
        for (var len = qarr.length, i = 0; i < len; i++) {
          if (qarr[i].indexOf("q=") == 0) {
            var q = qarr[i].substr(2).replace(/\+/g, ' ');
            return decodeURIComponent(q);
          }
        }
        return null;
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
       * .../test/read.cgi/xxxxxxx/l50 to ../test/read.cgi/xxxxxxx/
       */
      prettifyReadCGIURL: function(url) {
        return _prettifyReadCGIURL(url);
      },
      /**
       * conv Dat's URL to read.cgi's URL
       */
      datURLToReadCGIURL: function(daturl) {
        if(_isReadCGIURL(daturl)) return daturl;
        if(!_isDatURL(daturl)) return null;
        var bbsInfo = _getBBSInfo(daturl);
        if (!bbsInfo) return null;
        return "http://" + bbsInfo.domain + "/test/read.cgi/" + bbsInfo.bbs + "/" + bbsInfo.thread + "/";
      },
      /**
       * conv read.cgi's URL to dat URL
       */
      readCGIURLToDatURL: function(url) {
        if(_isDatURL(url)) return url;
        if(!_isReadCGIURL(url)) return null;
        var bbsInfo = _getBBSInfo(url);
        if (!bbsInfo) return null;
        return "http://" + bbsInfo.domain + "/" + bbsInfo.bbs + "/dat/" + bbsInfo.thread + ".dat";
      },
      /**
       * get responses of the thread
       * @param url
       * @param onsuccess
       *  onsuccess(responses, type)
       * @param onerror
       */
      getResponses: function(url, onsuccess, onerror) {
        var type;
        if (_isDatURL(url)) {
          type = "dat";
        } else if (_isReadCGIURL(url)) {
          type = "html";
        } else {
          console.error("Unrecognized 'url' type. url:", url);
          return;
        }
        _getResponses(url, type, onsuccess, onerror);
        return;
      }
    };

  };

  exports.niichrome = niichrome;
})(this);