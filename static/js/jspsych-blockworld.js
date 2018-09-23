'use strict';

/* globals BLOCKS: true, $, _, jsPsych, interact, console */
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

    function loc2pos(col, height) {
      return [col * 100, HEIGHT - 100*(height+1)];
    }
    // function pos2loc(loc) {
    //   return [col / 100, ]
    // }



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

    function createDropZones(startCol) {
      for (let col of [0, 1, 2]) {
        if (col == startCol) continue;
        let dz = $('<div>', {class: 'dropzone'});
        dz.appendTo($blockContainer);
        setPos(dz[0], loc2pos(col, state[col].length));
      }
    }

    function setLayout() {
      _(state).each((column, col) => {
        if (!column.length) return;
        column.forEach((id, height) => {
          setPos(blocks[id][0], loc2pos(col, height));
          blocks[id].removeClass('draggable');

        });
        blocks[_.last(column)].addClass('draggable');
      });
    }
    setLayout();

    // createDropZones(0);

    // Define dragging rules.
    var dropPos = null;
    var pickupPos = null;
    interact('.draggable')
      .draggable({
        inertia: true,
        restrict: {  // keep the element within the area of it's parent
          restriction: "parent",
          endOnly: false,
          elementRect: { top: 0, left: 0, bottom: 1, right: 1 }
        },
        onstart: function(event) {
          pickupPos = getPos(event.target);
          console.log(`pickup ${event.target.id} at ${pickupPos}`);
          $(event.target).css('opacity', 0.5);
          createDropZones(getPos(event.target)[0] / 100);
        },
        onmove: function(event) {
          shift(event.target, event.dx, event.dy);
        },
        onend: function (event) {
          $(event.target).css('opacity', 1);
          let pos = dropPos || pickupPos;
          console.log(`drop ${event.target.id} at ${pos}`);
          setPos(event.target, pos);
          $('.dropzone').remove();
          if (dropPos) {
            let pickupCol = pickupPos[0] / 100;
            let dropCol = dropPos[0] / 100;
            state[dropCol].push(state[pickupCol].pop());
            console.log(JSON.stringify(state));
            setLayout();
          }
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
        console.log('dragenter');
        dropPos = getPos(event.target);
        var draggableElement = event.relatedTarget,
            dropzoneElement = event.target;

        // feedback the possibility of a drop
        dropzoneElement.classList.add('drop-target');
        draggableElement.classList.add('can-drop');
      },
      ondragleave: function (event) {
        console.log('dragleave');
        dropPos = null;
        // remove the drop feedback style
        event.target.classList.remove('drop-target');
        event.relatedTarget.classList.remove('can-drop');
      },
      ondrop: function (event) {
        console.log('dropzone');
        // move(event.relatedTarget, (x, y) => [round(x, -2), round(y, -2)]);
      },
      ondropdeactivate: function (event) {
        // remove active dropzone feedback
        event.target.classList.remove('drop-active');
        event.target.classList.remove('drop-target');
      }
    });

    // ...
    var trial_data = {
      parameter_name: 'parameter value'
    };

    // end trial
    // jsPsych.finishTrial(trial_data);
  };

  return plugin;
})();
