/**
 * niichrome-request
 *
 * @version 0.2.0
 * @author akirattii <tanaka.akira.2006@gmail.com>
 * @license The MIT License
 * @copyright (c) akirattii
 * @see https://github.com/akirattii/niichrome-request/
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
(function(exports) {

  /**
   * @namespace
   */
  var niichrome = exports.niichrome || {};

  /**
   * @constructor
   */
  niichrome.request = function() {

    function createQueryStr(json, encoded) {
      if (!json) return null;
      var params = [];
      for (var prop in json) {
        var value = json[prop];
        var param;
        if (encoded === true) {
          param = prop + '=' + value;
        } else {
          param = encodeURIComponent(prop).replace(/%20/g, '+') + '=' + encodeURIComponent(value).replace(/%20/g, '+');
        }
        params.push(param);
      }
      if (params.length <= 0) {
        return null;
      } else {
        return params.join('&');
      }
    }


    return {
      /**
       * Simplified XMLHTTPRequest function
       *
       * @param {json} p
       *
       *    url:
       *      required.
       *
       *    onsuccess:
       *      required.
       *    
       *    onprogress:
       *
       *    onerror:
       *
       *
       *    method:
       *      ('GET' | 'POST' | 'HEAD' etc.)
       *      default is "GET"
       *
       *    responseType:
       *      ('document' | 'text')
       *      default is "document"
       *
       *    mimeType:
       *      e.g. "text/plain; charset=shift_jis"
       *
       *    requestHeaders:
       *      array of requestHeader. requestHeader is json likes { key:xxx, value:yyy }.
       *
       *    async:
       *      default is true
       *
       *    data:
       *      json data for request body
       *      if method == GET or HEAD, it is converted to queryString and joined to url.
       *
       *    encoded:http://ai.2ch.net/test/bbs.cgi
       *      "data" is encoded or not.
       *      default is false
       *
       */
      doRequest: function(p) {
        if (!p || !p.url || !p.onsuccess) {
          throw "'p' must be json included these properties: 'url', 'onsuccess'";
          return;
        }
        var xhr = new XMLHttpRequest();
        if (p.mimeType) {
          xhr.overrideMimeType(p.mimeType);
        }
        xhr.responseType = p.responseType || "document";
        var method = p.method || "GET";
        var async = true;
        if (p.async != undefined) {
          async = false;
        }
        var data = p.data;
        // query string
        var encoded = p.encoded || false;
        var qstr = null;
        if (data) qstr = createQueryStr(data, encoded);
        console.log("qstr", qstr);
        var url = p.url;
        if (qstr && method != "POST") {
          url += "?" + qstr;
        }
        if (p.onprogress) xhr.onprogress = p.onprogress;
        xhr.open(method, url, async);
        if (p.requestHeaders) {
          for (var len = p.requestHeaders.length, i = 0; i < len; i++) {
            xhr.setRequestHeader(p.requestHeaders[i].key, p.requestHeaders[i].value);
          }
        }

        /* 
          Chrome Apps do NOT need specific requestHeaders like 'Content-type' etc.
          ref:http://stackoverflow.com/questions/2623963/webkit-refused-to-set-unsafe-header-content-length
        */
        // if (qstr) {
        //   xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
        //   xhr.setRequestHeader("Content-length", qstr.length);
        //   xhr.setRequestHeader("Connection", "close");
        // }
        xhr.onreadystatechange = function() {
          // FIXME: onreadystatechange's memory leak problem
          if (xhr.readyState == 4 && xhr.status == 200) {
            p.onsuccess(xhr);
          } else if (xhr.readyState == 4 && xhr.status != 200) {
            if (p.onerror) p.onerror(xhr);
          }
        };
        xhr.send(qstr);
      }
    };

  };

  exports.niichrome = niichrome;
})(this);