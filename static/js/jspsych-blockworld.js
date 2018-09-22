// ========================== //
// ========= Blocks ========= //
// ========================== //

var BLOCKS = {};

class Block {
  constructor(parent, id) {
    this.$el = $('<div>', {
      class: 'block',
      id: id
    });
    this.id = id;
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
    x = Math.round(newPos[0]);
    y = Math.round(newPos[1]);
    this.el.style.webkitTransform = this.el.style.transform = `translate(${x}px, ${y}px)`;
    this.el.setAttribute('data-x', x);
    this.el.setAttribute('data-y', y);
  }
  move(dx, dy) {
    this.$el.css('opacity', 0.5);
    var x, y;
    [x, y] = this.pos;
    this.pos = [x + dx, y + dy];
  }
  drop() {
    console.log(`drop ${this.id} at (${this.pos[0]}, ${this.pos[1]})`);
    this.$el.css('opacity', 1);
  }
}


// target elements with the "draggable" class
interact('.block')
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
      BLOCKS[event.target.id].move(event.dx, event.dy);
    },
    
    onend: function (event) {
      BLOCKS[event.target.id].drop();
    }
  });


// enable draggables to be dropped into this
interact('.dropzone').dropzone({
  // only accept elements matching this CSS selector
  accept: '.block',
  // Require a 75% element overlap for a drop to be possible
  overlap: 0.75,

  // listen for drop related events:
  ondropactivate: function (event) {
    // add active dropzone feedback
    event.target.classList.add('drop-active');
  },
  ondragenter: function (event) {
    var draggableElement = event.relatedTarget,
        dropzoneElement = event.target;

    // feedback the possibility of a drop
    dropzoneElement.classList.add('drop-target');
    draggableElement.classList.add('can-drop');
  },
  ondragleave: function (event) {
    // remove the drop feedback style
    event.target.classList.remove('drop-target');
    event.relatedTarget.classList.remove('can-drop');
  },
  ondrop: function (event) {
    // event.relatedTarget.textContent = 'Dropped';
  },
  ondropdeactivate: function (event) {
    // remove active dropzone feedback
    event.target.classList.remove('drop-active');
    event.target.classList.remove('drop-target');
  }
});

// ========================== //
// ========= Plugin ========= //
// ========================== //

jsPsych.plugins["blockworld"] = (function() {

  var plugin = {};
  plugin.info = {
    name: 'blockworld',
    parameters: {}
  };

  plugin.trial = function(display_element, trial) {

    state = [
      ['A', 'B', 'C'],
      ['D'],
      ['E']
    ];
    var HEIGHT = 500;

    $stage = $('<div>', {
      id: 'stage'
    }).appendTo(display_element);
    $blockContainer = $('<div>', {
      width: state.length * 100,
      height: HEIGHT
    }).appendTo($stage);


    function getPos(col, height) {
      return [col * 100, HEIGHT - 100*(height+1)];
    }

    // $stage.css('width', '800px');
    // A = new Block($blockContainer, 'A');

    columns = 
    state.forEach((blocks, col) => {
      c = $('<div>', {
        class: 'dropzone',
        width: 100,
        height: HEIGHT
      });
      c.appendTo($blockContainer);
      blocks.forEach((block, height) => {
        b = new Block($blockContainer, block);
        b.pos = getPos(col, height);

      });
    });



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
