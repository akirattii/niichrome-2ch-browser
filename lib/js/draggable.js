var Draggable = function(id) {
  var el = document.getElementById(id),
    isDragReady = false,
    dragoffset = {
      x: 0,
      y: 0
    };
  this.init = function() {
    this.events();
  };
  //events for the element
  this.events = function() {
    var self = this;
    _on(el, 'mousedown', function(e) {
      if (el !== e.srcElement) return; // dont make it draggable in case of mousedown on child elements
      isDragReady = true;
      //corssbrowser mouse pointer values
      e.pageX = e.pageX || e.clientX + (document.documentElement.scrollLeft ?
        document.documentElement.scrollLeft :
        document.body.scrollLeft);
      e.pageY = e.pageY || e.clientY + (document.documentElement.scrollTop ?
        document.documentElement.scrollTop :
        document.body.scrollTop);
      dragoffset.x = e.pageX - el.offsetLeft;
      dragoffset.y = e.pageY - el.offsetTop;
    });
    _on(document, 'mouseup', function() {
      isDragReady = false;
    });
    _on(document, 'mousemove', function(e) {
      if (isDragReady) {
        e.pageX = e.pageX || e.clientX + (document.documentElement.scrollLeft ?
          document.documentElement.scrollLeft :
          document.body.scrollLeft);
        e.pageY = e.pageY || e.clientY + (document.documentElement.scrollTop ?
          document.documentElement.scrollTop :
          document.body.scrollTop);
        el.style.top = (e.pageY - dragoffset.y) + "px";
        el.style.left = (e.pageX - dragoffset.x) + "px";
      }
    });
  };
  //cross browser event Helper function
  var _on = function(el, event, fn) {
    document.attachEvent ? el.attachEvent('on' + event, fn) : el.addEventListener(event, fn, !0);
  };
  this.init();
}