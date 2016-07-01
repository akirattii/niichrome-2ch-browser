JapaneseUtil = function() {

  const charMode = {
    none: null,
    ascii: "ascii",
    alphaNumMark: "alphaNumMark",
    surroundMark: "surroundMark", // "'{} etc.
    alphaNum: "alphaNum",
    alpha: "alpha",
    mark: "mark",
    num: "num",
    kanji: "kanji",
    hiragana: "hiragana",
    katakana: "katakana",
    hankakuKana: "hankakuKana",
  };

  // keep private function for keeping code simple.
  let funcs = [];

  let reLink = /^http[s]?\:\/\/(.+)/i;

  function separate(txt) {
    txt += " "; // おまじない
    let arr = [];
    let len = txt.length;
    let mode, prevMode;
    let c;
    let startIdx = 0,
      endIdx = 0;
    let word;
    for (let i = 0; i < len; i++) {
      c = txt.charAt(i);
      if (isKanji(c)) {
        mode = charMode.kanji;
      } else if (isHiragana(c)) {
        mode = charMode.hiragana;
      } else if (isKatakana(c)) {
        mode = charMode.katakana;
      } else if (isHankakuKana(c)) {
        mode = charMode.hankakuKana;
      } else if (isSurroundMark(c)) {
        mode = charMode.surroundMark;
      } else if (isAlphaNumMark(c)) {
        mode = charMode.alphaNumMark;
      } else {
        mode = charMode.none;
      }
      // Charモードが変わった、もしくは最後まで到達したら
      if (prevMode != mode || i == len - 1) {
        endIdx = i;
        word = txt.substring(startIdx, endIdx);
        if (word) {
          arr.push(word);
          // console.log(startIdx, endIdx, word);
          startIdx = endIdx;
        }
      }
      prevMode = mode;
    }
    return arr;
  }

  /**
   * @param c 判別したい文字
   */
  funcs._isKanji = function(c) {
    let unicode = c.charCodeAt(0);
    if ((unicode >= 0x4e00 && unicode <= 0x9fcf) || // CJK統合漢字
      (unicode >= 0x3400 && unicode <= 0x4dbf) || // CJK統合漢字拡張A
      (unicode >= 0x20000 && unicode <= 0x2a6df) || // CJK統合漢字拡張B
      (unicode >= 0xf900 && unicode <= 0xfadf) || // CJK互換漢字
      (unicode >= 0x2f800 && unicode <= 0x2fa1f)) // CJK互換漢字補助
      return true;

    return false;
  }

  // proxy generic method
  function _isSomething(calleename, word) {
    if (!word)
      return false;
    let chars = word.split("");
    let c;
    for (let i = 0; i < chars.length; i++) {
      c = chars[i];
      if (!funcs["_" + calleename](c))
        return false;
    }
    return true;
  }

  funcs._isHiragana = function(c) {
    let unicode = c.charCodeAt(0);
    if (unicode >= 0x3040 && unicode <= 0x309f)
      return true;

    return false;
  }

  funcs._isKatakana = function(c) {
    let unicode = c.charCodeAt(0);
    if (unicode >= 0x30a0 && unicode <= 0x30ff)
      return true;

    return false;
  }

  funcs._isHankakuKana = function(c) {
    let unicode = c.charCodeAt(0);
    if (unicode >= 0xff61 && unicode <= 0xff9f)
      return true;

    return false;
  }

  funcs._isAscii = function(c) {
    let unicode = c.charCodeAt(0);
    if (unicode >= 0x0000 && unicode <= 0x007F)
      return true;

    return false;
  }

  funcs._isAlphaNum = function(c) {
    let unicode = c.charCodeAt(0);
    if ((unicode >= 0x0030 && unicode <= 0x0039) || // 0-9
      (unicode >= 0x0041 && unicode <= 0x005A) || // A-Z
      (unicode >= 0x0061 && unicode <= 0x007A)) { // a-z
      return true;
    }
    return false;
  }
  funcs._isAlphaNumMark = function(c) {
    let unicode = c.charCodeAt(0);
    if (unicode >= 0x0021 && unicode <= 0x007E) { // スペースとか改行など以外のAscii文字（記号を含む）
      return true;
    }
    return false;
  }
  funcs._isSurroundMark = function(c) {
    let unicode = c.charCodeAt(0);
    // 囲む用の文字 eg. " ' { } [ ] () 
    if ((unicode >= 0x0022 && unicode <= 0x0022) || // A-Z
      (unicode >= 0x0028 && unicode <= 0x0029) || // ()
      (unicode == 0x003C || unicode == 0x003E) || // < >
      (unicode == 0x005B || unicode == 0x005D) || // [ ]
      (unicode == 0x007B || unicode == 0x007D) // [ ]
    ) {
      return true;
    }
    return false;
  }
  funcs._isMarkJa = function(c) {
    // 囲む用の文字とか(日本語) eg. 「」。、｛｝
    if (c == "「" ||
      c == "」" ||
      c == "。" ||
      c == "、" || 
      c == "｛" || 
      c == "｝" || 
      c == "＝" || 
      c == "＾" || 
      c == "＊" || 
      c == "＋" || 
      c == "＿" || 
      c == "＠" || 
      c == "￥" || 
      c == "～" ||
      c == "＜" || 
      c == "＞") {
      return true;
    }
    return false;
  }
  funcs._isAlpha = function(c) {
    let unicode = c.charCodeAt(0);
    if ((unicode >= 0x0041 && unicode <= 0x005A) || // A-Z
      (unicode >= 0x0061 && unicode <= 0x007A)) { // a-z
      return true;
    }
    return false;
  }
  funcs._isNum = function(c) {
    let unicode = c.charCodeAt(0);
    if (unicode >= 0x0030 && unicode <= 0x0039) { // 0-9
      return true;
    }
    return false;
  }
  funcs._isMark = function(c) {
    let unicode = c.charCodeAt(0);
    if ((unicode >= 0x0021 && unicode <= 0x002F) || // !-/
      (unicode >= 0x003A && unicode <= 0x0040) || // :-@
      (unicode >= 0x005B && unicode <= 0x0060) || // [-`
      (unicode >= 0x007B && unicode <= 0x007E)) // {-~
    {
      return true;
    }
    return false;
  }

  // 漢字かどうか
  function isKanji(word) {
    return _isSomething(arguments.callee.name, word);
  }
  // ひらがなかどうか
  function isHiragana(word) {
    return _isSomething(arguments.callee.name, word);
  }
  // カタカナかどうか
  function isKatakana(word) {
    return _isSomething(arguments.callee.name, word);
  }
  // 半角ｶﾅかどうか
  function isHankakuKana(word) {
    return _isSomething(arguments.callee.name, word);
  }
  // ASCII文字かどうか
  function isAscii(word) {
    return _isSomething(arguments.callee.name, word);
  }
  // アルファベット or 数字 or 記号 かどうか
  function isAlphaNumMark(word) {
    return _isSomething(arguments.callee.name, word);
  }
  // 囲み文字かどうか
  function isSurroundMark(word) {
    return _isSomething(arguments.callee.name, word);
  }
  // アルファベット or 数字 かどうか
  function isAlphaNum(word) {
    return _isSomething(arguments.callee.name, word);
  }
  // アルファベットかどうか
  function isAlpha(word) {
    return _isSomething(arguments.callee.name, word);
  }
  // 数字かどうか
  function isNum(word) {
    return _isSomething(arguments.callee.name, word);
  }
  // ASCIIの記号かどうか（改行などの制御文字は記号とみなさない）
  function isMark(word) {
    return _isSomething(arguments.callee.name, word);
  }
  // 記号化どうか（日本語）
  function isMarkJa(word) {
    return _isSomething(arguments.callee.name, word);
  }

  /**
   * TODO: Analyze sentence
   * @param {string} sentence
   * @param {Object} watchedWords
   *   eg. { "apple": 100, "orange": 90 } // apple's '100' value means the weight point as relation degree.
   * @return {Object} analyzed data
   */
  function analyze(sentence, watchedWords) {
    // ソース
    let src = sentence;
    // 総合得点
    let totalPoint = getTotalPoint(sentence, watchedWords);
    // 分解された単語
    let words = separate(sentence);
    // 分解された単語(不要な単語を除く)
    let cleanedWords = getCleanedWords(words);
    // 出現単語ランキング
    let freqRanking = getFreqRanking(cleanedWords);
    // 出現単語ランキングTop
    let freqRankingTop = getFreqRankingTopN(freqRanking, 3); // top3
    // リンク
    let links = getLinksFromWords(cleanedWords);

    return {
      src,
      totalPoint,
      words,
      cleanedWords,
      freqRanking,
      freqRankingTop,
      links,
    };
  }

  function getTotalPoint(sentence, watchedWords) {
    let point = 0;
    let words = separate(sentence);
    for (let i = 0; i < words.length; i++) {
      point += getPoint(words[i], watchedWords);
    }
    return point;
  }

  function getPoint(word, watchedWords, partialMatch = false) {
    for (let ww in watchedWords) {
      if (word == ww || (partialMatch === true && word.indexOf(ww) >= 0)) {
        return watchedWords[ww]; // return point
      }
    }
    return 0;
  }

  // get freqRankinguency of word.
  function getFreqRanking(words) {
    let counts = {};
    words.forEach(function(x) { counts[x] = (counts[x] || 0) + 1; });
    // sort
    let sortable = [];
    for (let k in counts) {
      sortable.push([k, counts[k]]);
    }
    sortable.sort(
      function(a, b) {
        return b[1] - a[1];
      }
    )
    return sortable;
  }

  function getFreqRankingTopN(freqRanking, topN) {
    let fr;
    let arr = [];
    for (let i = 0; i < freqRanking.length; i++) {
      fr = freqRanking[i];
      if (fr[1] >= 2) { // if occurs more than twice
        arr.push(fr[0]); // push the word to the rankingTop3 array
      }
      if (arr.length >= topN) break;
    }
    return arr;
  }

  function getLinksFromWords(words) {
    function exists(arr, url) {
      for (let i = 0; i < arr.length; i++) {
        if (arr[i].url == url) return true;
      }
      return false;
    }
    // reLink
    let ret = [];
    let w;
    let url, host;
    for (let i = 0; i < words.length; i++) {
      w = words[i];
      if (reLink.test(w)) {
        url = w;
        // url double check
        if (exists(ret, url)) continue;
        host = reLink.exec(w)[1].split("/")[0];
        ret.push({
          url,
          host,
        });
      }
    }
    return ret;
  }

  // remove trush words (一文字、ひらがなのみ、記号のみなどを除外)
  function getCleanedWords(words) {
    let arr = [];
    let w;
    for (let i = 0; i < words.length; i++) {
      w = words[i];
      if (!isGarbage(w)) {
        arr.push(w.trim());
      }
    }
    return arr;
  }

  // ゴミ単語かどうか(一文字、ひらがなのみ、記号のみなどはゴミとみなす)
  function isGarbage(word) {
    if (!word || !word.trim()) return true;
    word = word.trim();
    if (word.length === 1) return true;
    if (isMarkJa(word) ||
      isMark(word)) {
      return true;
    }
    if (isHiragana(word)) return true;
    return false;
  }

  /** 
   * return its related word's array from db or any webservice
   * TODO: implement this function to fit with each user's demand.
   *
   * @param {string} watchedWord eg. "AAA"
   * @return {Array}  eg. ["Mr.Aaa", "Ms.Aaa"]
   */
  function getRelatedWordsArray(watchedWord) {
    // FIXME: it is dummy
    // TODO: Implement below.
    let arr = [];
    arr.push(watchedWord + "様");
    arr.push(watchedWord + "さん");
    arr.push(watchedWord + "さま");
    return arr;
  }

  /**
   * merge some related words into the watchedWords' object.
   *
   * @param {Object} watchedWords. updated itself.
   *   { "apple": 100, "orange": 90 } // apple's 100 is relation weight point.
   *
   */
  function mergeRelatedWords(watchedWords) {
    let relatedWords = [];
    let ww;
    for (let ww in watchedWords) {
      relatedWords = getRelatedWordsArray(ww);
      for (let i = 0; i < relatedWords.length; i++) {
        let relatedWord = relatedWords[i];
        if (!watchedWords[relatedWord]) {
          // merge
          watchedWords[relatedWord] = watchedWords[ww] * 0.8; // 関連項目は元単語のポイントを割り引いて入れてみる TODO: 調整必要
        }
      }
    }
  }



  // public methods etc.
  return {
    charMode,
    separate,
    isKanji,
    isKatakana,
    isHiragana,
    isHankakuKana,
    isAscii,
    isSurroundMark,
    isAlphaNumMark,
    isAlphaNum,
    isAlpha,
    isNum,
    isMark,
    analyze,
    // mergeRelatedWords,
  };
}