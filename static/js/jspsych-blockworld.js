// ========================== //
// ========= Blocks ========= //
// ========================== //

var BLOCKS = {};

function move(el, f) {
  x = parseFloat(el.getAttribute('data-x')) || 0;
  y = parseFloat(el.getAttribute('data-y')) || 0;
  [x, y] = f(x, y);
  el.style.webkitTransform = el.style.transform = `translate(${x}px, ${y}px)`;
  el.setAttribute('data-x', x);
  el.setAttribute('data-y', y);
}
function shift(el, dx, dy) {
  move(el, (x, y) => [x+dx, y+dy]);
}

interact('.draggable')
  .draggable({
    inertia: true,
    restrict: {  // keep the element within the area of it's parent
      restriction: "parent",
      endOnly: false,
      elementRect: { top: 0, left: 0, bottom: 1, right: 1 }
    },
    onmove: function(event) {
      $(event.target).css('opacity', 0.5);
      shift(event.target, event.dx, event.dy);
    },
    onend: function (event) {
      $(event.target).css('opacity', 1);
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
    move(event.relatedTarget, (x, y) => [round(x, -2), round(y, -2)]);
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

    blocks = [];
    dropzones = [];
    state.forEach((blockIDs, col) => {
      drop = $('<div>', {
        class: 'dropzone',
        // width: 100,
        // height: HEIGHT
      });
      drop.appendTo($blockContainer);
      dropzones.push(drop);
      move(dropzones[col][0], (x, y) => [100*col, 0]);


      column = [];
      blocks.push(column);
      blockIDs.forEach((id, height) => {
        block = $('<div>', {
          class: 'block',
          id: id,
          html: id,
        });
        block.appendTo($blockContainer);
        column.push(block);
        shift(block[0], ...getPos(col, height));
      });
    });

    blocks.forEach((column, col) => {
      _.last(column).addClass('draggable');
      move(dropzones[col][0], (x, y) => [x, HEIGHT - 100*(column.length+1)]);
    });

    // data saving
    var trial_data = {
      parameter_name: 'parameter value'
    };

    // end trial
    // jsPsych.finishTrial(trial_data);
  };

  return plugin;
})();
