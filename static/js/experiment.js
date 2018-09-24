async function initializeExperiment() {
  LOG_DEBUG('initializeExperiment');

  ///////////
  // Setup //
  ///////////
  
  // trials = await $.getJSON 'static/json/rewards/increasing.json'
  const N_TRIAL = 4;
  // var anykey = "<div class='lower message'>Press any key to continue.</div>";

  var instructions = {
    type: "html-button-response",
    // We use the handy markdown function (defined in utils.js) to format our text.
    stimulus: markdown(`
    # Instructions

    Thanks for accepting our HIT! In this HIT, you will solve block
    puzzles. On each round, you will see two sets of blocks. Your task
    is to make the one on the left look like the one on the right.
    `),
    choices: ['Continue'],
    button_html: '<button class="btn btn-primary">%choice%</button>'
  };
  var test = {
    type: 'blockworld',
    timeline: [
      {
        initial: [['A', 'B'], [], []],
        goal: [['A'], ['B'], []],
      },
      {
        initial: [
          ['A', 'C'],
          ['B'],
          [],
        ],
        goal: [
          ['C', 'B', 'A'],
          [],
          [],
        ]
      },
      {
        initial: [['A', 'B', 'C'], [], []],
        goal: [['C', 'B', 'A'], [], []]
      }
    ]
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


