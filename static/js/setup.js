// Generated by CoffeeScript 2.0.2
// coffeelint: disable=max_line_length, indentation

// ---------- Experiment modes ---------- #
var CONDITION, DEBUG, LOCAL, LOG_DEBUG, handleError, psiturk, saveData, startExperiment, submitHit;

DEBUG = false;

LOCAL = false;

if (mode === "{{ mode }}") {
  LOCAL = true;
  CONDITION = 0;
}

if (DEBUG) {
  console.log("X X X X X X X X X X X X X X X X X\n X X X X X DEBUG  MODE X X X X X\nX X X X X X X X X X X X X X X X X");
  CONDITION = 0;
  LOG_DEBUG = function(...args) {
    return console.log(...args);
  };
} else {
  console.log("# =============================== #\n# ========= NORMAL MODE ========= #\n# =============================== #");
  CONDITION = parseInt(condition);
  LOG_DEBUG = function(...args) {
    return null;
  };
}

// ---------- Initialize PsiTurk ---------- #
psiturk = new PsiTurk(uniqueId, adServerLoc, mode);

saveData = function() {
  console.log('saveData');
  return new Promise(function(resolve, reject) {
    var timeout;
    if (LOCAL) {
      resolve('local');
      return;
    }
    timeout = delay(5000, function() {
      console.log('TIMEOUT');
      return reject('timeout');
    });
    return psiturk.saveData({
      error: function() {
        clearTimeout(timeout);
        console.log('Error saving data!');
        return reject('error');
      },
      success: function() {
        clearTimeout(timeout);
        console.log('Data saved to psiturk server.');
        return resolve();
      }
    });
  });
};

// ---------- Test connection to server, then initialize the experiment. ---------- #
// initializeExperiment is defined in experiment.coffee
$(window).on('load', function() {
  return saveData().then(function() {
    return delay(500, function() {
      $('#welcome').hide();
      return initializeExperiment().catch(handleError);
    });
  }).catch(function() {
    return $('#data-error').show();
  });
});

// This function is called once at the end of initializeExperiment.
startExperiment = function(config) {
  var defaults;
  LOG_DEBUG('run');
  defaults = {
    display_element: 'jspsych-target',
    on_finish: function() {
      if (DEBUG) {
        return jsPsych.data.displayData();
      } else {
        return submitHit();
      }
    },
    on_data_update: function(data) {
      console.log('data', data);
      return psiturk.recordTrialData(data);
    }
  };
  return jsPsych.init(_.extend(defaults, config));
};

submitHit = function() {
  var promptResubmit, triesLeft;
  console.log('submitHit');
  $('#jspsych-target').html('<div id="load-icon"></div>');
  triesLeft = 1;
  promptResubmit = function() {
    console.log('promptResubmit');
    if (triesLeft) {
      console.log('try again', triesLeft);
      $('#jspsych-target').html(`<div class="alert alert-danger">\n  <strong>Error!</strong>\n  We couldn't contact the database. We will try <b>${triesLeft}</b> more times\n  before attempting to submit your HIT without saving the data.\n\n  <div id="load-icon"></div>\n</div>`);
      triesLeft -= 1;
      return saveData().catch(promptResubmit);
    } else {
      console.log('GIVE UP');
      $('#jspsych-target').html("<div class=\"alert alert-danger\">\n  <strong>Error!</strong>\n  We couldn't save your data! Please contact cocosci.turk@gmail.com to report\n  the error. Then click the button below.\n</div>\n<br><br>\n<button class='btn btn-primary btn-lg' id=\"resubmit\">I reported the error</button>");
      return new Promise(function(resolve) {
        return $('#resubmit').click(function() {
          return resolve('gave up');
        });
      });
    }
  };
  return saveData().then(psiturk.completeHIT).catch(promptResubmit).then(psiturk.completeHIT);
};

if (!DEBUG) { 
  handleError = function(e) {
    var link, message, msg;
    console.log('Erorr in experiment', e);
    if (e.stack) {
      msg = e.stack;
    } else if (e.name != null) {
      msg = e.name;
      if (e.message) {
        msg += ': ' + e.message;
      }
    } else {
      msg = e;
    }
    psiturk.recordUnstructuredData('error', msg);
    message = `<pre>\n  HitID: ${(typeof hitId !== "undefined" && hitId !== null ? hitId[0] : 'N/A')}\n  AssignId: ${(typeof assignId !== "undefined" && assignId !== null ? assignId : 'N/A')}\n  WorkerId: ${(typeof workerId !== "undefined" && workerId !== null ? workerId[0] : 'N/A')}\n\n  ${msg}\n</pre>`;
    link = '<a href="mailto:cocosci.turk@gmail.com?subject=ERROR in experiment' + '&body=#{encodeURIComponent(message)}">Click here</a>';
    $('#jspsych-target').html(markdown(`# The experiment encountered an error!\n\n${link} to report the error by email. Please describe at what point in the HIT the error\noccurred, and include the following\n\n${message}\n\nThen click the button below to submit the HIT.\nIf you have trouble submitting the HIT, please\ncontact <cocosci.turk@gmail.com>\n\n<button id="submit">Submit HIT</button>`));
    return $('#submit').click(submitHit);
  };
}
