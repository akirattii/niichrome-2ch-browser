/**
 * niichrome-idbutil
 *
 * @version 0.3.1
 * @author akirattii <tanaka.akira.2006@gmail.com>
 * @license The MIT License
 * @copyright (c) akirattii
 * @see https://github.com/akirattii/niichrome-idbutil/
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
   * @param {string} dbname
   * @param {number} dbver
   */
  niichrome.idbutil = function(dbname, dbver) {

    var db = null;

    function upgrade(o, thisDB) {
        var storename = null;
        var store = null;
        if (!o.storename || !o.keyPath || o.autoIncrement == undefined) {
          console.error("'storename', 'keyPath', 'autoIncrement' are required.");
          return;
        } else {
          storename = o.storename;
        }
        if (!thisDB.objectStoreNames.contains(storename)) {
          // set keyPath 
          store = thisDB.createObjectStore(storename, {
            keyPath: o.keyPath,
            autoIncrement: o.autoIncrement
          });
        }
        // set unique indices
        if (o.uniques) {
          var cols = o.uniques;
          for (var len = cols.length, i = 0; i < len; i++) {
            store.createIndex(cols[i], cols[i], {
              unique: true
            });
          }
        }
        // set non-unique indices
        if (o.nonuniques) {
          var cols = o.nonuniques;
          for (var len = cols.length, i = 0; i < len; i++) {
            store.createIndex(cols[i], cols[i], {
              unique: false
            });
          }
        }

      } //-- upgrade

    var _list = function(storename, col, range, direction, successHandler) {
      if (!storename) {
        console.error("'storename' required.");
        return;
      }
      var direction_enums = ['next', 'nextunique', 'prev', 'prevunique'];
      if (!direction || (direction_enums.indexOf(direction) > -1) == false) {
        direction = "next";
      }
      var tx = db.transaction([storename], "readwrite");
      var store = tx.objectStore(storename);
      var cursor = null;
      if (!range) {
        // Get everything in the store;
        range = IDBKeyRange.lowerBound(0);
      }
      if (!col)
        cursor = store.openCursor(range, direction);
      else
        cursor = store.index(col).openCursor(range, direction);
      var list = [];
      cursor.onsuccess = function(e) {
        var res = e.target.result;
        if (!res) {
          successHandler(list);
          return;
        }
        list.push(res.value);
        res.
        continue();
      };
    }

    var _listAll = function(storename, col, direction, successHandler) {
      _list(storename, col, null, direction, successHandler);
    }

    var _batchUpdate = function(storename, items, successHandler, errorHandler) {
        if (!storename || !items) {
          console.error("'storename', 'items' : These parameters must not be empty!");
          return;
        }
        // console.log("batchUpdating...", items);
        var tx = db.transaction([storename], "readwrite");
        var store = tx.objectStore(storename);
        var req;
        var i = 0;
        putNext()

        function putNext() {
          if (i < items.length) {
            // // console.log("item", items[i]);
            req = store.put(items[i])
            req.onsuccess = putNext;
            if (errorHandler) req.onerror = errorHandler;
            ++i;
          } else { // complete
            // console.log("batchUpdate completed");
            if (successHandler) successHandler();
          }
        }
      } // -- batchUpdate

    return {
      /**
       * open a database
       * @param {object|object[]} params<br>
       *  {<br>
       *    storename: {string}, // objectStore's name<br>
       *    keyPath: {string}, // keyPath col's name<br>
       *    autoIncrement: {bool}, // autoIncrement<br>
       *    uniques: {string[]}, // unique indexed cols<br>
       *    nonuniques: {string[]} // non-unique indexed cols<br>
       *  }<br>
       *  This parameters is used for database upgrade.<br>
       *  @param {function} successHandler
       *  @param {function} errorHandler
       */
      openDB: function(params, successHandler, errorHandler) {
        if (!params) {
          console.error("'params' { storename, keyPath, autoIncrement } is required.");
          return;
        }
        // console.log("openDB", dbname, dbver);
        var req = indexedDB.open(dbname, dbver);
        req.onupgradeneeded = function(e) {
          // console.log("upgrading...");
          var thisDB = e.target.result;
          var store = null;
          var storename = null;
          if (Array.isArray(params)) {
            for (var len = params.length, i = 0; i < len; i++) {
              var o = params[i];
              upgrade(o, thisDB);
            }
          } else {
            var o = params;
            upgrade(o, thisDB);
          }
        }
        req.onsuccess = function(e) {
          // console.log("openDB success");
          db = e.target.result;
          if (successHandler) successHandler(e);
        };
        req.onerror = function(e) {
          // console.log("openDB error");
          if (errorHandler) errorHandler(e);
        };
      },
      /**
       * get a data
       * @param {string} storename
       * @param {object} key
       * @param {function} successHandler
       */
      get: function(storename, key, successHandler) {
        if (!storename || !key) {
          console.error("'storename', 'key' : These parameters must not be empty!");
          return;
        }
        // console.log("get", storename, key);
        var tx = db.transaction([storename], "readonly");
        var store = tx.objectStore(storename);
        var req = store.get(key);
        req.onsuccess = function(e) {
          successHandler(e.target.result);
        };
      },
      /**
       * list
       * @param {string} storename<br>
       *  required<br>
       * @param {string} col<br>
       *  col for range<br>
       *  required<br>
       * @param {IDBKeyRange} range<br>
       *  e.g. <br>
       *  If from&lt;= and &lt;to, range is IDBKeyRange.bound(from, to, false, true);<br>
       *  If range == null, list all.<br>
       * @param {string} direction<br>
       *  'next': Ascending order<br>
       *  'nextunique': Ascending order without repetition<br>
       *  'prev': Descending order<br>
       *  'prevunique': Descending order without repetition'<br>
       *  Not required, but if direction == null, 'next' will be set as default.<br>
       * @param {function} successHandler<br>
       *  required<br>
       */
      list: function(storename, col, range, direction, successHandler) {
        _list(storename, col, range, direction, successHandler);
      },
      listAll: function(storename, col, direction, successHandler) {
        _listAll(storename, col, direction, successHandler);
      },
      /**
       * update an item if it already exists, otherwise add it as new.
       * @param {string} storename
       * @param {object} item
       * @param {function} successHandler
       * @param {function} errorHandler
       */
      update: function(storename, item, successHandler, errorHandler) {
        if (!storename || !item) {
          console.error("'storename', 'item' : These parameters must not be empty!");
          return;
        }
        // console.log("updating...", JSON.stringify(item));
        var tx = db.transaction([storename], "readwrite");
        var store = tx.objectStore(storename);
        var req = store.put(item);
        req.onsuccess = function(e) {
          if (successHandler) successHandler(e);
        };
        req.onerror = function(e) {
          if (errorHandler) errorHandler(e);
        };
      },
      /**
       * batchUpdate if already exists, otherwise add as new.
       * @param {string} storename
       * @param {object[]} items
       * @param {function} successHandler
       * @param {function} errorHandler
       */
      batchUpdate: function(storename, items, successHandler, errorHandler) {
        _batchUpdate(storename, items, successHandler, errorHandler);
      },
      /**
       * remove an object
       * @param {string} storename
       * @param {string} key
       * @param {function} successHandler
       * @param {function} errorHandler
       */
      remove: function(storename, key, successHandler, errorHandler) {
        if (!storename || !key) {
          console.error("'storename', 'key' : These parameters must not be empty!");
          return;
        }
        // console.log("removing...", storename, key);
        var tx = db.transaction([storename], "readwrite");
        var store = tx.objectStore(storename);
        var req = store.delete(key);
        req.onsuccess = function(e) {
          if (successHandler) successHandler(e);
        };
        req.onerror = function(e) {
          if (errorHandler) errorHandler(e);
        };
      },
      /**
       * export store as json string
       * @param {string} storename Required
       * @param {string} col Uses for direction
       * @param {function} direction
       * @param {function} successHandler function(jsonstr){...}
       */
      export: function(storename, col, direction, successHandler) {
        _listAll(storename, col, direction, function(list) {
          var jsonstr = JSON.stringify(list);
          successHandler(jsonstr);
        });
      },
      /**
       * import store from json string
       * @param {string} storename required
       * @param {string} jsonstr required
       * @param {function} successHandler function(){...}
       * @param {function} errorHandler function(){...}
       */
      import: function(storename, jsonstr, successHandler, errorHandler) {
        var items = JSON.parse(jsonstr);
        _batchUpdate(storename, items, successHandler, errorHandler);
      },
      /**
       * clear objectStore
       * @param {string} storename
       * @param {function} successHandler
       * @param {function} errorHandler
       */
      clear: function(storename, successHandler, errorHandler) {
        if (!storename) {
          console.error("'storename' required.");
          return;
        }
        // console.log("clearing...", storename);
        var tx = db.transaction([storename], "readwrite");
        var store = tx.objectStore(storename);
        var req = store.clear();
        req.onsuccess = function(e) {
          if (successHandler) successHandler(e);
        };
        req.onerror = function(e) {
          if (errorHandler) errorHandler(e);
        };
      },
      /**
       * delete a database
       * @param {function} successHandler
       * @param {function} errorHandler
       */
      deleteDB: function(successHandler, errorHandler) {
        var dbname = db.name;
        // console.log("deleteDB", dbname);
        var req = indexedDB.deleteDatabase(dbname);
        req.onsuccess = function(e) {
          // console.log("deleteDB success");
          if (successHandler)
            successHandler(e);
        };
        req.onerror = function(e) {
          // console.log("deleteDB error");
          if (errorHandler)
            errorHandler(e);
        }
      },
      /**
       * get db object
       */
      getDB: function() {
        return db;
      }
    };

  };

  exports.niichrome = niichrome;
})(this);