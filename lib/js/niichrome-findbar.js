/**
 * niichrome-findbar
 *
 * @version 0.2.1
 * @author akirattii <tanaka.akira.2006@gmail.com>
 * @license The MIT License
 * @copyright (c) akirattii
 * @see https://github.com/akirattii/niichrome-findbar/
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
 * @dependencies jquery-2.1.0
 */
(function(exports) {
  /**
   * @namespace
   */
  var niichrome = exports.niichrome || {};

  niichrome.findbar = function(fbarSelector, targetSelector, params) {

    var focusIdx = -1;
    var maxIdx = -1;
    var recentWord; // recent finding word
    var classNameOfHighlight = "findbar_highlight";
    var classNameOfFocus = "findbar_focus";
    var highlightElems;
    var focusedEl;

    //
    // settings

    // toggle slide speed
    var toggleSpeed;
    if (params && params.toggleSpeed) {
      toggleSpeed = params.toggleSpeed;
    } else {
      toggleSpeed = 200;
    }

    // vertical margin when finded & scrolled
    var scrollMargin;
    if (params && params.scrollMargin && $.isNumeric(params.scrollMargin)) {
      scrollMargin = params.scrollMargin;
    } else {
      scrollMargin = 0;
    }

    // width of one charactor. Used for calculate paneResult's position left
    var charWidth;
    if (params && params.charWidth && $.isNumeric(params.charWidth)) {
      charWidth = params.charWidth;
    } else {
      charWidth = 10;
    }


    //
    // declare inner elements

    var paneFindbar = $(fbarSelector);
    var txtInput = $(fbarSelector).find(".findbar_input");
    var btnNext = $(fbarSelector).find(".findbar_next");
    var btnPrev = $(fbarSelector).find(".findbar_prev");
    var paneResult = $(fbarSelector).find(".findbar_result");
    var btnClose = $(fbarSelector).find(".findbar_close");

    //
    // init handlers

    btnNext.click(function() {
      _find(txtInput.val(), true, function(e) {
        _setResult(e);
      });
    });
    btnPrev.click(function() {
      _find(txtInput.val(), false, function(e) {
        _setResult(e);
      });
    });
    txtInput.keydown(function(e) {
      if (e.keyCode === 27) { // ESC
        // hide
        _hide();
      } else if (e.keyCode === 13) { // Enter
        if (e.shiftKey) { // + Shift
          btnPrev.trigger("click");
        } else {
          btnNext.trigger("click");
        }
      }
    });
    btnClose.click(function() {
      _hide();
    });

    //
    // private functions

    function _hide() {
      paneFindbar.slideToggle(toggleSpeed);
      _forget(); // let me forget
    }

    function _forget() {
      _clearMarker();
      recentWord = "";
      paneResult.html("&nbsp;");
    }

    function _setResult(e) {
      paneResult.text(e.message);
      // ajust paneResult's position left.
      var left = paneResult.text().length * charWidth;
      paneResult.css("left", "-" + left + "px");
      txtInput.css("padding-right", left + 2 + "px");
    }

    function _find(word, goNext, onsuccess) {
      if (goNext === undefined) goNext = true;
      if (!word) return;
      if (recentWord != word) {
        recentWord = word;
        focusIdx = -1;
        _highlight(word);
      }
      if (goNext) {
        _nextFocus(onsuccess);
      } else {
        _prevFocus(onsuccess);
      }
    }

    function _shiftFocus(goNext, onsuccess) {
      highlightElems = $("." + classNameOfHighlight);
      maxIdx = highlightElems.length - 1;
      if (goNext) {
        // focus next
        focusIdx += 1;
        if (maxIdx < focusIdx) focusIdx = 0;
      } else {
        // focus prev
        focusIdx -= 1;
        if (0 > focusIdx) focusIdx = maxIdx;
      };
      focusedEl = highlightElems.removeClass(classNameOfFocus).eq(focusIdx);
      focusedEl.addClass(classNameOfFocus);
      if (focusedEl[0]) {
        _doScroll($(targetSelector), focusedEl);
      } else {
        // matching not found
      }
      if (onsuccess) {
        var length = maxIdx + 1;
        var message = "";
        if (length > 0) {
          message = (focusIdx + 1) + "/" + length;
          paneResult.removeClass("notFound");
        } else {
          message = "0/0";
          paneResult.addClass("notFound");
        }
        onsuccess({
          maxIdx: maxIdx,
          focusIdx: focusIdx,
          length: length,
          message: message
        });
      }
      return;
    }

    function _nextFocus(onsuccess) {
      _shiftFocus(true, onsuccess);
    }

    function _prevFocus(onsuccess) {
      _shiftFocus(false, onsuccess);
    }

    function _doScroll(container, scrollTo) {
      container.animate({
        scrollTop: scrollTo.offset().top - container.offset().top + container.scrollTop() - scrollMargin
      }, toggleSpeed);
    }

    function _highlight(txt) {
      _clearMarker();
      var reg = _createRegExp(txt);
      // draw marker to matched text
      // ref: http://stackoverflow.com/questions/12919074/js-replace-only-text-without-html-tags-and-codes
      _walk($(targetSelector)[0], function(node) {
        var text = node.data.split(reg),
        // var text = node.data.split(txt),
          parent = node.parentNode,
          newNode;

        if (node.data == text[0]) {
          return;
        } else if (parent.className == classNameOfHighlight) {
          return;
        }

        parent.insertBefore(_createTextNode(text[0]), node);

        for (var i = 1; i < text.length; i++) {
          
          if(i % 2 == 1) {
            // Odd parity: matched text node
            newNode = document.createElement("b");
            newNode.innerText = text[i];
            newNode.className = classNameOfHighlight;
            parent.insertBefore(newNode, node);
            // parent.insertBefore(_createTextNode(matchedTxt), node);
          } else {
            // Even parity: other text node
            parent.insertBefore(_createTextNode(text[i]), node);
          }
          
        }

        parent.removeChild(node);
      });

    }

    function _createTextNode(txt) {
      return document.createTextNode(txt);
    }

    function _walk(el, fn) {
      for (var i = 0, len = el.childNodes.length; i < len; i++) {
        var node = el.childNodes[i];
        if (node.nodeType === 3) // 3=TextNode
          fn(node);
        else if (node.nodeType === 1 && node.nodeName !== "SCRIPT")
          _walk(node, fn);
      }
    }


    function _clearMarker() {
      $("." + classNameOfHighlight).each(function() {
        $(this)[0].outerHTML = $(this).text();
      });
    }


    function _createRegExp(word) {
      return new RegExp("(" + _escapeRegExp(word) + ")", "gi");
    }

    function _escapeRegExp(string) {
      return string.replace(/([.*+?^=!:${}()|[\]\/\\])/g, "\\$1");
    }

    function _escapeSpecialChars(string) {
      return string.replace(/&/g, "&amp;")
        .replace(/>/g, "&gt;")
        .replace(/</g, "&lt;")
        .replace(/"/g, "&quot;");
    }

    //
    // -- public functions

    return {
      /**
       * @param {string} text to enter into searchbox
       */
      show: function(word) {
        _forget();
        $(fbarSelector).slideDown(toggleSpeed);
        if (word)
          txtInput.val(word).focus().select();
        else
          txtInput.focus().select();
      }
    };

  }; // findbar

  exports.niichrome = niichrome;
})(this);