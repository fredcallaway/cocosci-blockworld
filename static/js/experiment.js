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
      initializeExperiment(data);
    })
    .catch(function() {
      $('#data-error').show();
    });
}
/* jshint ignore:end */


$(window).on('load', start);

function initializeExperiment(data) {
  // Saving some subject metadata
  psiturk.recordUnstructuredData('browser', window.navigator.userAgent);

  // We select various short trials to let participants become
  // familiar, then present a shuffled version of the complex trials.
  // The key to the trials dictionary is a description of the
  // parameters used to generate the problem. B is the number of
  // blocks.
  const trials = [
    _.sample(data.trials['B=3']),
    _.sample(data.trials['B=4']),
    _.sample(data.trials['B=5']),
  ].concat(_.shuffle(data.trials['B=6']));
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

    On each round, you will see two sets of blocks. There are three places where you
    can build a column of blocks. Your task is to stack the blocks in the left box
    to match the blocks in the right box. The blocks
    in the right box will always be in alphabetical order in the middle column.
    You can only move the top block in each column.

    Here's an example with 3 blocks:

    <img width="355" src="static/images/blockworld.gif" />

    `),
    choices: ['Continue'],
    button_html: '<button class="btn btn-primary">%choice%</button>'
  };

  var pointInstructions = {
    type: "html-button-response",
    // We use the handy markdown function (defined in utils.js) to format our text.
    stimulus: markdown(`
    # Points

    For each round, you will start with some points. Every block costs one point to move.
    Once you complete all rounds, your points will be converted into a bonus. Your points
    will never go below 0, and even when they are 0, you should still complete the round.

    Here's an example xxxx:

    <img width="355" src="static/images/blockworld.gif" />

    `),
    choices: ['Continue'],
    button_html: '<button class="btn btn-primary">%choice%</button>'
  };

  var finalPoints = {
    type: "html-button-response",
    // We use the handy markdown function (defined in utils.js) to format our text.
    stimulus: function() {
      // HACK this is wrong this is wrong!
      var pointsToBonus = 0.01;
      // HACK we should save the price we presented XXX HACK

      var pointTrials = jsPsych.data.get().values().filter(function(trial) {
        return trial.hasOwnProperty('points'); });
      var total = pointTrials.reduce(function(acc, trial) { return acc + trial.points; }, 0);
      var bonus = (total * pointsToBonus).toFixed(2);

      return markdown(`
        # Total Points

        You were able to collect ${total} points. This will result in a bonus of <b>$${bonus}</b>!
      `);
    },
    choices: ['Continue'],
    button_html: '<button class="btn btn-primary">%choice%</button>'
  };

  var updateProgress = function() {
    var total = trials.length;
    var i = 0;
    return function() {
      i += 1;
      jsPsych.setProgressBar(i/total);
    };
  }();

  var test = {
    type: 'blockworld',
    timeline: trials,
    on_finish() {
      updateProgress();
      saveData();
    }
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
    pointInstructions,
    test,
    finalPoints,
    debrief,
  ];

  startExperiment({
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
