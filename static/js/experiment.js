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

const pointsToBonus = 0.01;

$(window).on('load', start);

function initializeExperiment(data) {
  // Saving some subject metadata
  psiturk.recordUnstructuredData('browser', window.navigator.userAgent);
  psiturk.recordUnstructuredData('pointsToBonus', pointsToBonus);
  psiturk.recordUnstructuredData('timeZone', Intl.DateTimeFormat().resolvedOptions().timeZone);

  // We select various short trials to let participants become
  // familiar.
  // The key to the trials dictionary is a description of the
  // parameters used to generate the problem. B is the number of
  // blocks.
  const practice = [
    _.sample(data.trials['B=3']),
    _.sample(data.trials['B=4']),
    _.sample(data.trials['B=5']),
  ];
  practice.forEach(function(trial) {
    trial.noBonus = false;
  });
  practice[1].noBonus = true;

  // Now take complex problems & shuffle them, also adding in high stakes conditions.
  const mainTrials = _.shuffle(data.trials['B=6']);
  // The map gives us half true, half false values and then shuffles them.
  const mainTrialsNoBonus = _.shuffle(_.range(mainTrials.length).map(function(idx) {
    return idx % 2 == 0;
  }));
  // Add high stakes info to trials.
  mainTrials.forEach(function(trial, idx) {
    trial.noBonus = mainTrialsNoBonus[idx];
  });

  // Now create the second half of the trial.
  const secondHalf = _.shuffle(mainTrials.map(function(trial) {
    const newTrial = _.clone(trial);
    // We negate the high stakes variable for each trial
    newTrial.noBonus = !newTrial.noBonus;
    // And we flip the column order so it is harder to recall.
    newTrial.initial = newTrial.initial.slice(); // copy array first...
    newTrial.initial.reverse(); // since this modifies in place
    return newTrial;
  }));

  var trials = practice.concat(mainTrials).concat(secondHalf);
  trials.forEach(function(t) {
    t.highStakes = false;
  });
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

    You can earn a bonus on some rounds. You will begin these rounds with some number of points.
    It costs 1 point to move a block.
    If you lose all your points, they won't go below 0, but you still have to finish the round.

    Some rounds will have no bonus, so the screen will say <b>No Bonus</b>.

    At the end of the HIT, we will convert the final points from each round into a bonus payment.
    You will earn $${pointsToBonus.toFixed(2)} for each point.

    Here's an example:

    <img width="355" src="static/images/points.gif" />

    `),
    choices: ['Continue'],
    button_html: '<button class="btn btn-primary">%choice%</button>'
  };

  var finalPoints = {
    type: "html-button-response",
    // We use the handy markdown function (defined in utils.js) to format our text.
    stimulus: function() {
      var pointTrials = jsPsych.data.get().values().filter(function(trial) {
        return trial.hasOwnProperty('points'); });
      var total = pointTrials.reduce(function(acc, trial) { return acc + trial.points; }, 0);
      var bonus = (total * pointsToBonus).toFixed(2);
      psiturk.recordUnstructuredData('finalPoints', total);
      psiturk.recordUnstructuredData('finalBonus', bonus);

      return markdown(`
        # Total Points

        You got ${total} points in this HIT. Your bonus for this HIT is <b>$${bonus}</b>!
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
