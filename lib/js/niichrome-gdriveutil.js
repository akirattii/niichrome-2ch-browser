/**
 * niichrome-gdriveutil
 *
 * @version 0.1.2
 * @author akirattii <tanaka.akira.2006@gmail.com>
 * @license The MIT License
 * @copyright (c) akirattii
 * @see https://github.com/akirattii/niichrome-gdriveutil/
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
 * @dependencies upload.js
 */
(function(exports) {

  /**
   * @namespace
   */
  var niichrome = exports.niichrome || {};

  /**
   * @constructor
   */
  niichrome.gdriveutil = function() {

    // accessToken
    var accessToken;

    var retry = false;

    var _auth = function(interactive, opt_callback) {
      if (accessToken) 
        opt_callback && opt_callback();
      try {
        chrome.identity.getAuthToken({
          interactive: interactive
        }, function(token) {
          if (token) {
            accessToken = token;
            opt_callback && opt_callback();
          }
          retry = false;
        });
      } catch (e) {
        console.log(e);
        if (e.status === 401) {
          if (retry === false) {
            _removeCachedAuthToken(function() {
              console.log("removed cachedAuthToken and retrying to auth...");
              retry = true;
              _auth(interactive, opt_callback);
            });
          } else {
            console.log(e);
          }
        }
      }
    };

    var _removeCachedAuthToken = function(opt_callback) {
      if (accessToken) {
        var tokenCopy = accessToken;
        accessToken = null;
        // Remove token from the token cache.
        chrome.identity.removeCachedAuthToken({
          token: tokenCopy
        }, function() {
          opt_callback && opt_callback();
        });
      } else {
        opt_callback && opt_callback();
      }
    };

    var _revokeAuthToken = function(opt_callback) {
      if (accessToken) {
        // Make a request to revoke token
        var xhr = new XMLHttpRequest();
        xhr.open('GET', 'https://accounts.google.com/o/oauth2/revoke?token=' +
          accessToken);
        xhr.send();
        _removeCachedAuthToken(opt_callback);
      }
    }

    var _upload = function(opts) {
      var uploader = new MediaUploader(opts);
      uploader.upload();
    }

    var _download = function(url, onComplete, onError) {
      var xhr = new XMLHttpRequest();
      xhr.open('GET', url);
      xhr.setRequestHeader('Authorization',
        'Bearer ' + accessToken);
      xhr.onreadystatechange = function(e) {
        if (xhr.readyState == 4 && xhr.status == 200) {
          // get the file's content.
          console.log("xhr.response", xhr.response);
          onComplete(xhr.response);
          return;
        } else if (xhr.readyState == 4 && xhr.status != 200) {
          console.error("Error: status=", xhr.status);
          onError(xhr);
          return;
        }
      };
      xhr.onerror = onError;
      xhr.send();
    }

    var _getFiles = function(q, maxResults, callback) {
      var params = [];
      var xhr = new XMLHttpRequest();
      var url = "https://www.googleapis.com/drive/v2/files";
      if (!maxResults) maxResults = 1000; // default is 1000. it's max
      params.push("maxResults=" + maxResults);
      if (q) params.push("q=" + encodeURIComponent(q));
      if(params.length >= 1) url += "?" + params.join('&');
      xhr.open('GET', url);
      xhr.setRequestHeader('Authorization',
        'Bearer ' + accessToken);
      xhr.onreadystatechange = function(e) {
        if (xhr.readyState == 4 && xhr.status == 200) {
          var json = JSON.parse(xhr.responseText);
          callback(json.items);
          return;
        } else if (xhr.readyState == 4 && xhr.status != 200) {
          console.error("Error: status=", xhr.status);
        }
      };
      xhr.onerror = function(e) {
        console.error("Error: ", e);
      };
      xhr.send();
    }

    var _getToken = function() {
      return accessToken;
    }

    /**
     * public functions
     */
    return {
      /**
       * remove cached accessToken
       * @param {function} function(){...}
       */
      removeCachedAuthToken: function(opt_callback) {
        _removeCachedAuthToken(opt_callback);
      },
      /**
       * revoke accessToken
       * @param {function} function(){...}
       */
      revokeAuthToken: function(opt_callback) {
        _revokeToken(opt_callback);
      },
      /**
       * auth
       * @param {boolean} interactive
       * @param {function} function(){...}
       */
      auth: function(interactive, opt_callback) {
        _auth(interactive, opt_callback);
      },
      /**
       * upload file
       *
       * @param {object} options Hash of options
       * @param {blob} options.file Blob-like item to upload
       * @param {int} options.chunkSize Chunk size
       * @param {string} options.fileId ID of file if replacing
       * @param {object} options.params Additional query parameters
       * @param {string} options.contentType Content-type, if overriding the type of the blob.
       * @param {object} options.metadata File metadata
       * {
       *   title: filename,
       *   mimeType: mimeType
       * }
       *
       * @param {function} onComplete Callback for when upload is complete
       * @param {function} onError Callback if upload fails
       *
       * @example
       * var content = new Blob(["Hello world"], {"type": "text/plain"});
       * upload({
       *   file: content,
       *   token: accessToken,
       *   onComplete: function(data) { ... }
       *   onError: function(data) { ... }
       * });
       *
       */
      upload: function(options, onComplete, onError) {
        if (!accessToken) {
          console.error("upload: acquire accessToken before upload/download.");
          return;
        }
        options.token = accessToken;
        if (onComplete) options.onComplete = onComplete;
        if (onError) options.onError = onError;
        _upload(options);
      },
      /**
       * download
       * @param {string} downloadUrl item.downloadUrl
       * @param {function} onComplete function(xhr.response){...}
       * @param {function} onError function(xhr){...}
       */
      download: function(downloadUrl, onComplete, onError) {
        _download(downloadUrl, onComplete, onError);
      },
      /**
       * get the files on GDrive by search query
       * @param {string} q search query @see https://developers.google.com/drive/web/search-parameters
       * @param {function} callback Required
       *  function(item){...}
       */
      getFiles: function(q, callback) {
        _getFiles(q, null, callback);
      },
      /**
       * get the files on GDrive by search query
       * @param {string} q search query @see https://developers.google.com/drive/web/search-parameters
       * @param {function} callback Required
       *  function(item){...}
       */
      getFile: function(q, callback) {
        _getFiles(q, 1, callback);
      },
      getToken: function() {
        return _getToken();
      }
    };

  };

  exports.niichrome = niichrome;
})(this);