'use strict';

/* globals BLOCKS: true, $, _, jsPsych, interact */
// ========================== //
// ========= Blocks ========= //
// ========================== //

// BLOCKS = {};

function getPos(el) {
  return [parseFloat(el.getAttribute('data-x')) || 0,
          parseFloat(el.getAttribute('data-y')) || 0];
}
function setPos(el, pos) {
  var x, y;
  [x, y] = pos;
  el.style.webkitTransform = el.style.transform = `translate(${x}px, ${y}px)`;
  el.setAttribute('data-x', x);
  el.setAttribute('data-y', y);
}
function move(el, f) {
  setPos(el, f(...getPos(el)));
}
function shift(el, dx, dy) {
  move(el, (x, y) => [x+dx, y+dy]);
}

// ========================== //
// ========= Plugin ========= //
// ========================== //

jsPsych.plugins.blockworld = (function() {

  var plugin = {};
  plugin.info = {
    name: 'blockworld',
    parameters: {}
  };

  plugin.trial = function(display_element, trial) {

    var state = [
      ['A', 'B', 'C'],
      ['D'],
      ['E']
    ];
    var HEIGHT = 500;

    var $stage = $('<div>', {
      id: 'stage'
    }).appendTo(display_element);
    var $blockContainer = $('<div>', {
      width: state.length * 100,
      height: HEIGHT
    }).appendTo($stage);


    function layoutPos(col, height) {
      return [col * 100, HEIGHT - 100*(height+1)];
    }


    // Create blocks.
    var blocks = _.chain(state)
      .flatten()
      .map(id => {
        let block = $('<div>', {
          class: 'block',
          id: id,
          html: id,
        });
        block.appendTo($blockContainer);
        return [id, block];
      })
      .object().value();

    // Define dragging rules.
    var dragSuccess = false;
    var dropLocation = null;
    interact('.draggable')
      .draggable({
        inertia: true,
        restrict: {  // keep the element within the area of it's parent
          restriction: "parent",
          endOnly: false,
          elementRect: { top: 0, left: 0, bottom: 1, right: 1 }
        },
        onstart: function(event) {
          $(event.target).css('opacity', 0.5);
          dropLocation = getPos(event.target);
          console.log(`pickup ${event.target.id} at ${dropLocation}`);
        },
        onmove: function(event) {
          shift(event.target, event.dx, event.dy);
        },
        onend: function (event) {
          $(event.target).css('opacity', 1);
          console.log(`drop ${event.target.id} at ${dropLocation}`);
          setPos(event.target, dropLocation);
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
    
    function setLayout() {
      _(state).each((column, col) => {
        column.forEach((id, height) => {
          setPos(blocks[id][0], layoutPos(col, height));
        });
        blocks[_.last(column)].addClass('draggable');
      });
    }
    setLayout();

    // ...
    var trial_data = {
      parameter_name: 'parameter value'
    };

    // end trial
    // jsPsych.finishTrial(trial_data);
  };

  return plugin;
})();
