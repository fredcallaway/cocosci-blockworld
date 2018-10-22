/* jshint ignore:start */
async function loadData() {
  return {
    trials: await $.getJSON('static/json/trials.json')
  };
}

async function start() {
  var data = loadData();
  var ready = Promise.all([data, saveData(), sleep(2000)]);
  ready
    .then(function([data, saveResult, _sleep]) {
      $('#welcome').hide();
      initializeExperiment(data).catch(handleError);
    })
    .catch(function() {
      $('#data-error').show();
    });
}
/* jshint ignore:end */


$(window).on('load', start);

function initializeExperiment(data) {
  trials = data.trials;
  LOG_DEBUG('initializeExperiment');
  ///////////
  // Setup //
  ///////////

  var instructions = {
    type: "html-button-response",
    // We use the handy markdown function (defined in utils.js) to format our text.
    stimulus: markdown(`
    # Instructions

    Thanks for accepting our HIT! In this HIT, you will solve block
    puzzles. On each round, you will see two sets of blocks.

    Your task is to stack the blocks on the left so they match the blocks on the
    right. You can only move the top block in each column. Stack the blocks in
    alphabetical order in the middle column.

    Here's an example with 3 blocks:

    <img width="355" src="static/images/blockworld.gif" />

    `),
    choices: ['Continue'],
    button_html: '<button class="btn btn-primary">%choice%</button>'
  };
  var test = {
    type: 'blockworld',
    timeline: trials
  };

  var debrief = {
    type: 'html-button-response',
    stimulus: markdown(`
    # HIT complete

    Thanks for participating!
    `),
    choices: ['Continue'],
    button_html: '<button class="btn btn-primary">%choice%</button>'
  };


  // `timeline` determines the high-level structure of the experiment. When
  // developing the experiment, you can comment out blocks you aren't working
  // on so you don't have to click through them to test the section you're
  // working on.
  var timeline = [
    // welcome_block,
    instructions,
    test,
    // debrief_block,
  ];


  return startExperiment({
    timeline,
    auto_preload: false,
    exclusions: {
      // min_width: 800,
      // min_height: 600
    },
  });
}
