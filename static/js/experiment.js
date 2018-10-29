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
  // We select a 3-block trial, a 4-block trial, and
  // then present a shuffled version of the 5-block trials.
  // The key to the trials dictionary is a description of the
  // parameters used to generate the problem. B is the number of
  // blocks, H is the height limits.
  const trials = [
    _.sample(data.trials['B=3,H=3,3,3']),
    _.sample(data.trials['B=4,H=4,4,4']),
  ].concat(_.shuffle(data.trials['B=5,H=5,5,5']));
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
    puzzles. There are ${trials.length} puzzles for you to solve.

    On each round, you will see two sets of blocks. Your task is to stack the
    blocks on the left so that they match the blocks on the right. The blocks
    on the right will always be in alphabetical order in the middle column.
    You can only move the top block in each column.

    Here's an example with 3 blocks:

    <img width="355" src="static/images/blockworld.gif" />

    `),
    choices: ['Continue'],
    button_html: '<button class="btn btn-primary">%choice%</button>'
  };
  var progress = function() {
    var total = trials.length;
    var i = 0;
    return function() {
      i += 1;
      jsPsych.setProgressBar(i/total);
    };
  };
  var test = {
    type: 'blockworld',
    timeline: trials,
    on_finish: progress()
  };

  var debrief = {
    type: 'survey-text',
    preamble: markdown(`
    # HIT complete

    Thanks for participating! Please answer the questions below before
    submitting the HIT.    
    `),
    button_label: 'Submit',
    questions: [
      {'prompt': 'Was anything confusing or hard to understand?',
       'rows': 2, columns: 60},
      {'prompt': 'Do you have any suggestions on how we can improve the instructions or interface?',
       'rows': 2, columns: 60},
      {'prompt': 'Any other comments?',
       'rows': 2, columns: 60}
    ]
  };


  // `timeline` determines the high-level structure of the experiment. When
  // developing the experiment, you can comment out blocks you aren't working
  // on so you don't have to click through them to test the section you're
  // working on.
  var timeline = [
    // welcome_block,
    instructions,
    test,
    debrief,
  ];


  return startExperiment({
    timeline,
    show_progress_bar: true,
    auto_update_progress_bar: false,
    auto_preload: false,
    exclusions: {
      // min_width: 800,
      // min_height: 600
    },
  });
}
