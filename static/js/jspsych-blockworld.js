/*
 * BlockWorld
 */
X = undefined;
var BLOCKS = {};

class Block {
  constructor(parent, id) {
    this.$el = $('<div>', {
      class: 'draggable block',
      id: id
    });
    this.el = this.$el[0];
    this.$el.appendTo(parent);
    this.$el.html(id);

    BLOCKS[id] = this;
  }
  get pos() {
    var x, y;
    x = parseFloat(this.el.getAttribute('data-x')) || 0;
    y = parseFloat(this.el.getAttribute('data-y')) || 0;
    return [x, y];
  }
  set pos(newPos) {
    var x, y;
    [x, y] = newPos;
    this.el.style.webkitTransform = this.el.style.transform = `translate(${x}px, ${y}px)`;
    this.el.setAttribute('data-x', x);
    this.el.setAttribute('data-y', y);
  }
}

// target elements with the "draggable" class
interact('.draggable')
  .draggable({
    // enable inertial throwing
    inertia: true,
    // keep the element within the area of it's parent
    restrict: {
      restriction: "parent",
      endOnly: false,
      elementRect: { top: 0, left: 0, bottom: 1, right: 1 }
    },
    // enable autoScroll
    autoScroll: false,

    onmove: function(event) {

      block = BLOCKS[event.target.id];
      X = block;
      // console.log(block.pos);
      // console.log('block', block)
      // console.log('target', event.target)
      // console.log('el', block.el)
      [x, y] = block.pos
      block.pos = [x + event.dx, y + event.dy]


      // updatePos(event.target, event.dx, event.dy);
    },
    
    onend: function (event) {
    }
  });

jsPsych.plugins["blockworld"] = (function() {

  var plugin = {};
  plugin.info = {
    name: 'blockworld',
    parameters: {}
  };

  plugin.trial = function(display_element, trial) {
    
    start = [
      ['A', 'B'],
      ['C'],
      []
    ];

    $stage = $('<div>', {
      id: 'stage'
    }).appendTo(display_element);
    $blockContainer = $('<div>', {
      width: start.length * 100,
      height: 500
    }).appendTo($stage)

    // $stage.css('width', '800px');
    new Block($blockContainer, 'A');



      // this is used later in the resizing and gesture demos
      // window.dragMoveListener = dragMoveListener;
    
    // data saving
    var trial_data = {
      parameter_name: 'parameter value'
    };



    // end trial
    // jsPsych.finishTrial(trial_data);
  };

  return plugin;
})();
