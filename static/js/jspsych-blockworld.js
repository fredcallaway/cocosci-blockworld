'use strict';
/* globals BLOCKS: true, $, _, jsPsych, interact, console, showModal */

jsPsych.plugins.blockworld = (function() {
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

  class BlockWorld {
    constructor(state) {
      this.state = state;
      this.height = 500;
      
      this.div = $('<div>', {
        class: 'stage'
      });

      this.title = $('<h2>', {
        class: 'caption',
        html: '&nbsp;'
      }).appendTo(this.div);

      this.stage = $('<div>', {
        // class: 'stage',
        width: state.length * 100,
        height: this.height
      }).appendTo(this.div);

      this.blocks = _.chain(state)
        .flatten()
        .map(id => {
          let block = $('<div>', {
            class: 'block',
            id: id,
            html: id,
          });
          block.appendTo(this.stage);
          return [id, block];
        })
        .object().value();
      this.setLayout();
    }

    loc2pos(col, height) {
      return [col * 100, this.height - 100*(height+1)];
    } 

    appendTo(element) {
      this.div.appendTo(element);
    }

    createDropZones(startCol) {
      for (let col of _.range(this.state.length)) {
        if (col == startCol) continue;
        let dzContainer = $('<div>', {class: 'dropzone-container'});
        let dz = $('<div>', {class: 'dropzone'});
        dz.appendTo(dzContainer);
        setPos(dz[0], this.loc2pos(0, this.state[col].length));
        dzContainer.appendTo(this.stage);
        setPos(dzContainer[0], [col * 100, 0]);
        dzContainer.css('height', this.height);
      }
    }

    setLayout() {
      _(this.state).each((column, col) => {
        column.forEach((id, height) => {
          setPos(this.blocks[id][0], this.loc2pos(col, height));
          this.blocks[id].removeClass('draggable');
        });
      });
    }

    makeDraggable() {
      _(this.state).each((column, col) => {
        if (!column.length) return;
        this.blocks[_.last(column)].addClass('draggable');
      });
    }
  }

  var plugin = {};
  plugin.info = {
    name: 'blockworld',
    parameters: {}
  };

  function state2string(state) {
    return state.map(col => col.join(',')).join(':');
  }

  plugin.trial = function(display_element, trial) {
    // var state = trial.initial;
    // await sleep(1000);
    var goal = trial.goal;

    function goalTest(state) {
      return _.isEqual(state, goal);
    }

    var world = new BlockWorld(trial.initial);
    world.appendTo(display_element);
    world.makeDraggable();


    var goalWorld = new BlockWorld(trial.goal);
    goalWorld.appendTo(display_element);
    goalWorld.div.addClass('goal');
    goalWorld.title.html('Goal');

    var data = {
      states: [state2string(world.state)],
      times: []
    };

    function complete() {
      console.log('SUCCESS');
      showModal($('<div>')
        .add($('<h3>', {html: 'Success!'}))
        .add($('<button>', {
          class: 'btn btn-success',
          text: 'Continue',
          click: function() {
            $('.modal').remove();
            $(display_element).html('');
            jsPsych.finishTrial(data);
          }
        }))
      );
    }

    var startTime = Date.now();
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
          dropPos = null;
          // console.log(`pickup ${event.target.id} at ${pickupPos}`);
          $(event.target).css('opacity', 0.5);
          world.createDropZones(getPos(event.target)[0] / 100);
        },
        onmove: function(event) {
          shift(event.target, event.dx, event.dy);
        },
        onend: function (event) {
          $(event.target).css('opacity', 1);
          let pos = dropPos || pickupPos;
          // console.log(`drop ${event.target.id} at ${pos}`);
          setPos(event.target, pos);
          $('.dropzone-container').remove();
          if (dropPos) {
            // Successful move.
            let pickupCol = pickupPos[0] / 100;
            let dropCol = dropPos[0] / 100;
            world.state[dropCol].push(world.state[pickupCol].pop());
            console.log(state2string(world.state));
            data.states.push(state2string(world.state));
            data.times.push(Date.now() - startTime);
            world.setLayout();
            world.makeDraggable();
            if (goalTest(world.state)) {
              complete();
            }
            // console.log(JSON.stringify(state));
          }
        }
      });

    interact('.dropzone-container').dropzone({
      accept: '.block',
      overlap: 0.55,  // overlap necessary to allow drop

      ondropactivate: function (event) {
        const dropzone = event.target.querySelector('.dropzone');
        dropzone.classList.add('drop-active');
      },
      ondragenter: function (event) {
        // console.log('dragenter');
        // HACK this is a bit tricky with the dropzone-container. This is getting from
        // the container, which has a correct data-x. But should not get from the dropzone
        // which has data-x=0.
        dropPos = getPos(event.target);
        var draggableElement = event.relatedTarget,
            dropzoneElement = event.target.querySelector('.dropzone');

        dropzoneElement.classList.add('drop-target');
        draggableElement.classList.add('can-drop');
      },
      ondragleave: function (event) {
        // console.log('dragleave');
        const dropzone = event.target.querySelector('.dropzone');
        dropPos = null;
        dropzone.classList.remove('drop-target');
        event.relatedTarget.classList.remove('can-drop');
      },
      ondrop: function (event) {
        // console.log('dropzone');
      },
      ondropdeactivate: function (event) {
        const dropzone = event.target.querySelector('.dropzone');
        dropzone.classList.remove('drop-active');
        dropzone.classList.remove('drop-target');
      }
    });
  };

  return plugin;
})();
