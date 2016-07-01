/**
 * niichrome-amazonutil
 *
 * @version 1.7.0
 * @author akirattii <tanaka.akira.2006@gmail.com>
 * @license The MIT License
 * @copyright (c) akirattii
 * @see https://github.com/akirattii/niichrome-amazonutil/
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

  niichrome.amazonutil = function() {

    var request = niichrome.request();

    const ASSOC_TAG = "niic-22";
    const SEARCH_URL_BASE = "https://www.amazon.co.jp/s/ref=nb_sb_noss_2?__mk_ja_JP=%E3%82%AB%E3%82%BF%E3%82%AB%E3%83%8A&url=search-alias%3Daps&field-keywords=";
    const TIMEOUT = 10000;

    // define regex 
    RE = {
      ASIN: /^[0-9A-Z]{10}$/
    }

    // get ASIN from amazon url string
    var _getASIN = function(url) {
      if (!url) return null;
      var tmp = url.match(/^https?\:\/\/www\.amazon\.co\.jp\/?.*\/([0-9A-Z]{10})($|\/)/);
      if (!tmp) return null;
      return tmp[1];
    }

    // 
    var _isValidURL = function(url) {
      if (_getASIN(url)) return true;
      return false;
    }

    // create amazon url from ASIN
    var _getURL = function(asin) {
      var url;
      if (!_isASIN(asin)) return null;
      url = "http://www.amazon.co.jp/dp/" + asin + "/";
      if (ASSOC_TAG) url += "?tag=" + ASSOC_TAG;
      return url;
    }

    var _isASIN = function(asin) {
      if (!asin) return false;
      var tmp = asin.match(RE.ASIN);
      if (tmp) {
        return true;
      }
      return false;
    }

    // get charset from elements of META Tag.
    var _getCharset = function(metaElems) {
      var charset;
      var el;
      for (var len = metaElems.length, i = 0; i < len; i++) {
        el = metaElems[i];
        var httpEquiv = el.getAttribute("http-equiv");
        if (httpEquiv && httpEquiv.toLowerCase() == "content-type") {
          var contentType = el.getAttribute("content");
          var arr = contentType.split("charset=");
          if (arr.length >= 2) {
            var semicIdx = arr[1].indexOf(";");
            if (semicIdx === -1) return arr[1].trim();
            return arr[1].substr(0, semicIdx).trim();
          }
        }
        charset = el.getAttribute("charset");
        if (charset) {
          return charset.trim();
        }
      }
      return charset;
    }

    var _getItemByASIN = function(asin, onsuccess, onerror) {
      var charset = "UTF-8";
      var url = _getURL(asin);
      _getItem(url, charset, onsuccess, onerror);
      return;
    }

    /**
     * get item from amazon
     * @param {string} amazon's url
     * @param {string} charset
     *  Default is "UTF-8"
     * @param {function} onsuccess
     * @param {function} onerror
     */
    var _getItem = function(url, charset, onsuccess, onerror) {
        var errors = [];
        if (!url) {
          errors.push("'url' is required.");
        }
        if (!onsuccess) {
          errors.push("'onsuccess' is required.");
        }
        if (errors.length >= 1) {
          onerror({
            errors: errors
          });
          return;
        }

        var ret;

        if (!charset) charset = "UTF-8";

        request.doRequest({
          url: url,
          method: "GET",
          mimeType: "text/html;charset=" + charset,
          responseType: "document",
          onsuccess: function(xhr) {
            var xml = xhr.responseXML;
            /* 
            check 'content' attribute of META tag for charset recognition.
            <meta http-equiv="Content-type" content="text/html;charset=UTF-8" /> 
           */
            var actualCharset = _getCharset(xml.getElementsByTagName("meta"));
            if (!actualCharset) actualCharset = "Shift_JIS";
            if (actualCharset.toLowerCase() != charset.toLowerCase()) {
              // If different 'charset' from 'actualCharset', retry to get item...
              _getItem(url, actualCharset, onsuccess, onerror);
              return;
            }

            if (xml) {
              var asin, beautifiedURL, imgSrc, title, price, stars;
              // get ASIN
              asin = _getASIN(url);
              // get item's title
              title = xml.title;
              // get item's valid url
              beautifiedURL = _getURL(asin);
              /* If warning page of adult, returns a little irregular params  */
              if (title == "警告：アダルトコンテンツ") {
                ret = {
                  charset: charset,
                  warningPage: true,
                  title: title,
                  url: beautifiedURL
                };
                onsuccess(ret);
                return;
              }
              // get item's image
              var imgElem = xml.getElementById("imgTagWrapperId");
              if (imgElem) {
                imgElem = imgElem.children[0]; // Its "src" attr contains object like "data:image/jpeg;base64,..."
              }
              if (!imgElem) {
                imgElem = xml.getElementById("imgBlkFront"); // Its "src" attr contains object like "data:image/jpeg;base64,..."
              }
              if (!imgElem) {
                imgElem = xml.getElementById("prodImage"); // Its "src" attr contains URL like "http://ecx.images-amazon.com/images/I/....._.png"
              }
              if (imgElem) imgSrc = imgElem.src;
              // get item's Price
              var priceElem = xml.getElementById("actualPriceValue");
              if (priceElem) price = priceElem.innerText.trim();
              // get item's review stars.
              starsElem = xml.getElementById("acrPopover");
              var stars_txt;
              if (starsElem) {
                stars_txt = starsElem.getAttribute("title").trim();
              } else if (xml.getElementsByClassName("asinReviewsSummary").length >= 1) {
                starsElem = xml.getElementsByClassName("asinReviewsSummary")[0];
                if (starsElem.getAttribute("name") == asin) {
                  stars_txt = starsElem.children[0].innerText.trim();
                }
              }
              if (stars_txt) {
                stars = parseFloat(stars_txt.split(" ")[1]); // stars_txt like this: "5つ星のうち 5.0"
              }

              ret = {
                charset: charset,
                asin: asin,
                url: beautifiedURL,
                imgSrc: imgSrc,
                price: price,
                title: title,
                stars: stars,
                warningPage: false
              };
            }
            onsuccess(ret);
          },
          onerror: onerror
        }); // doRequest  
        return;
      } // _getItem

    /**
     * get amazon recommend items.
     *
     * This method uses responseXML. It means that this doesn't work on webworker thread.
     * @param {String} keyword
     * @param {Integer} max item's count to get. default is 3.
     * @param {Function} callback. 'function(err, items){...})'
     */
    function _getRecommends(kwd, max, cb) {
      let url = SEARCH_URL_BASE + encodeURIComponent(kwd);
      let xhr = new XMLHttpRequest();

      xhr.onload = function() {
        if (this.readyState === XMLHttpRequest.DONE) {
          if (this.status === 200) {
            if (!this.responseXML) return cb("No items recommended.");
            let els = this.responseXML.querySelectorAll(".s-result-item");
            let items = makeItems(els);
            if (items.length <= 0) {
              return cb("No items recommended.");
            }
            return cb(null, items);
          } else {
            return cb(this.statusText);
          }
        }
      };

      xhr.ontimeout = function() {
        return cb("The request for ${url} timed out.");
      };

      xhr.responseType = "document";
      xhr.timeout = TIMEOUT;
      xhr.open("GET", url);
      xhr.send(null);

      function makeItems(els) {
        if (!els || els.length <= 0) return [];
        let arr = [];
        let el;
        let p, img;
        let title, href, imgsrc;
        let len = (max >= els.length) ? els.length : max;
        for (let i = 0; i < len; i++) {
          el = els[i];
          // image url
          img = el.querySelector("img");
          if (img) {
            imgsrc = img.src;
          }
          // title
          p = el.querySelector(".a-link-normal[title]");
          if (!p) continue;
          title = p.title;
          // link
          href = p.href + "&tag=" + ASSOC_TAG;
          if (!title || !href) {
            continue;
          }
          //
          arr.push({
            title,
            href,
            imgsrc,
          });
        }
        return arr;
      }
    }

    //
    // -- public functions
    //
    return {
      /**
       * get ASIN from amazon's url string
       */
      getASIN: function(url) {
        return _getASIN(url);
      },
      /**
       * check if valid ASIN or not.
       */
      isASIN: function(asin) {
        return _isASIN(asin);
      },
      /**
       * check if valid amazon's url or not.
       */
      isValidURL: function(url) {
        return _isValidURL(url);
      },
      /**
       * create amazon's item page url from ASIN
       */
      getURL: function(asin) {
        return _getURL(asin);
      },

      /**
       * get item by ASIN
       *
       * @param {string} ASIN
       * @param {function} on success
       * @param {function} on error
       */
      getItemByASIN: function(asin, onsuccess, onerror) {
        var errors = [];
        if (!asin) errors.push("'ASIN' is required.");
        if (!onsuccess) errors.push("'onsuccess' is required.");
        if (errors.length >= 1) {
          onerror(errors);
          return;
        }
        _getItemByASIN(asin, onsuccess, onerror);
        return;
      },

      /**
       * get amazon recommend items.
       * @param {String} keyword
       * @param {Integer} max item's count to get. default is 3.
       * @param {Function} callback. 'function(err, items){...})'
       */
      getRecommends: function(kwd, max, cb) {
        return _getRecommends(kwd, max, cb);
      },
    };

  };

  exports.niichrome = niichrome;
})(this);
