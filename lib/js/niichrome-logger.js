/**
 * niichrome-logger
 *
 * @version 0.1.0
 * @author akirattii <tanaka.akira.2006@gmail.com>
 * @license The MIT License
 * @copyright (c) akirattii
 * @see https://github.com/akirattii/niichrome-logger/
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
(function(exports){
  /**
   * @namespace
   */
  var niichrome = exports.niichrome || {};

  niichrome.logger = {
    /**
     * log level.
     * 0: logs nothing (default)
     * 1: ERROR = logs error
     * 2: INFO = logs error + info
     * 3: WARN = logs error + info + warn
     * 4: DEBUG = logs error + info + warn + debug
     */
    logLevel: 0
    ,
    /**
     * dom element to which output logs.
     * <PRE> element is better because puts a newline "\n" at the end of line.
     * If null, logs into console.
     */
    element: null
    ,
    //
    debug: function () {
      if(this.logLevel >= 4) {
        Function.apply.call(console.log, console, arguments);
        if (this.element) this.dump(arguments);
      }
    },
    // 
    warn: function () {
      if(this.logLevel >= 3) {
        Function.apply.call(console.warn, console, arguments);
        if (this.element) this.dump(arguments);
      }
    },
    //
    info: function () {
      if(this.logLevel >= 2) {
        Function.apply.call(console.info, console, arguments);
        if (this.element) this.dump(arguments);
      }
    },
    //
    error: function () {
      if(this.logLevel >= 1) {
        Function.apply.call(console.error, console, arguments);
        if (this.element) this.dump(arguments);
      }
    },
    // dump logs into the dom element.
    dump: function(arr) {
      if (!this.element) return;
      var msg = "";
      for(var len = arr.length, i = 0; i < len; i++) {
        if(typeof arr[i] == "object") {
          msg += JSON.stringify(arr[i]) + " ";
        } else {
          msg += arr[i] + " ";
        }
      }
      this.element.innerText += msg + "\n";
    }
  };

  exports.niichrome = niichrome;
})(this);