/**
 * niichrome-updatechecker
 *
 * @version 0.0.1
 * @author akirattii <tanaka.akira.2006@gmail.com>
 * @license The MIT License
 * @copyright (c) akirattii
 * @see https://github.com/akirattii/niichrome-updatechecker/
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
 * @dependencies chrome.storage, chrome.runtime
 */
(function(exports) {

  /**
   * @namespace
   */
  var niichrome = exports.niichrome || {};

  /**
   * @constructor
   */
  niichrome.updatechecker = function() {

    // localStorage key for getting version
    KEY_OF_VERSION = "version";

    return {
      /**
       * check if this chrome app has updated as latest version.
       * Old version info should be saved by this module into localStorage as key "version"
       *
       * @param {function} onsuccess
       *   This callback parameter should be a function that looks like this:
       *    function(string updatedVer) {...};
       *      if not updated, updatedVer is undefined.
       */
      check: function(onsuccess) {
        var versionInStorage, versionLaunched, item4save = {},
          updatedVer;

        // get the version of last launched which should be in localStorage as "version".
        chrome.storage.local.get(KEY_OF_VERSION, function(items) {
          versionInStorage = items.version;
          // get the launched app's version
          versionLaunched = chrome.runtime.getManifest().version;
          // if versions are different between launched app's and in localstorage... 
          if (versionInStorage != versionLaunched) {
            //  update the version in localStorage as the launched app's version
            item4save[KEY_OF_VERSION] = versionLaunched;
            chrome.storage.local.set(item4save, function() {
              console.log(KEY_OF_VERSION + ' has been saved to localStorage. ',
                KEY_OF_VERSION + "=" + item4save[KEY_OF_VERSION]);
            });
            // set 'updatedVer'
            updatedVer = versionLaunched;
          }
          onsuccess(updatedVer);
          return;
        });
      } // check

    }; // return

  };

  exports.niichrome = niichrome;
})(this);