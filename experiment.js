N = 200  // trials
console.log(N)

N_img_in_block = 50
attention_check_freq = 90

let range = n => Array.from(Array(n).keys())

const classes = ['-100', '-66', '-33', '33', '66', '100'];
const base = ['low', 'medium', 'high'];

const img = {}
for (let c of base) {
    img[c] = classes.map(s=>original_str([c, s]))
    img[c].push(`data/human-in-the-loop/stimuli/stimuli_${c}/avgimg_wr_${c}.png`)
}

let make_stim_dict = function(){
    c = Math.floor(Math.random() * 3)
    let images = img[base[c]]
    n1 = Math.floor(Math.random() * images.length)
    n2 = Math.floor(Math.random() * images.length)
    return {original: images[n1],
            inverted: images[n2]}
}
let all_image_pairs = function(n){
    stimuli = [];
    for (let c of base) {
        for (let i = 0; i < 6; i++) {
            for (let j = 0; j < 6; j++) {
                if (i == j) continue;
                stimuli.push({
                    original: original_str([c, classes[i]]),
                    inverted: original_str([c, classes[j]])})
            }
            stimuli.push({
                original: original_str([c, classes[i]]),
                inverted: `data/human-in-the-loop/stimuli/stimuli_${c}/avgimg_wr_${c}.png`
            })
            stimuli.push({
                original: `data/human-in-the-loop/stimuli/stimuli_${c}/avgimg_wr_${c}.png`,
                inverted: original_str([c, classes[i]])
            })
        }
    }
    for (let m of base) {
        for (let n of base) {
            stimuli.push({
                original: `data/human-in-the-loop/stimuli/stimuli_${m}/avgimg_wr_${m}.png`,
                inverted: `data/human-in-the-loop/stimuli/stimuli_${n}/avgimg_wr_${n}.png`,
            })
            stimuli.push({
                inverted: `data/human-in-the-loop/stimuli/stimuli_${m}/avgimg_wr_${m}.png`,
                original: `data/human-in-the-loop/stimuli/stimuli_${n}/avgimg_wr_${n}.png`,
            })
        }
    }
    return stimuli
}

function saveData(name, data) {
    var xhr = new XMLHttpRequest();
    xhr.open("POST", "write_data_a.php"); // 'write_data.php' is the path to the php file described above.
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.send(JSON.stringify({ filename: data_dir+name, filedata: data }));
}

var jsPsych = initJsPsych({
    show_progress_bar: true,
    auto_update_progress_bar: false,
    message_progress_bar: 'Block Completion Progress',
    on_finish: function(data){ 
        jatos.endStudy(jsPsych.data.get().json());
        window.location.assign(sona_link_str+sona_id)
    },
    show_progress_bar: true,
})

let sona_id = jsPsych.data.urlVariables()['sona_id']
console.log(sona_id)

let width = window.innerWidth
let height = window.innerHeight
var trial_count = 0
var block_count = -1

if (!subject_id) {
  var subject_id = jsPsych.randomization.randomID(15);
}
jsPsych.data.addProperties({
  subject: subject_id,
  sona: sona_id,
	browser_width: width,
	browser_height: height
});


timeline = []

var consent = {
    type: jsPsychHtmlButtonResponse,
    stimulus: consent_msg,
    choices: ["Ich stimme zu."],
}
timeline.push(consent)

var welcome = {
      type: jsPsychHtmlButtonResponse,
      stimulus: instructions,
      choices: ['Start the experiment!']
};
timeline.push(welcome)

// var test_stimuli = range(N).map(make_stim_dict)

var test_stimuli = all_image_pairs()
test_stimuli.push(...range(N-test_stimuli.length).map(make_stim_dict))
let stims = []
for (let x of test_stimuli) {
    stims.push(x.original)
    stims.push(x.inverted)
}
var preload = {
    type: jsPsychPreload,
    images: stims,
    show_progress_bar: true,
}
timeline.push(preload)

var test = {
      type: image2afc,
      left: jsPsych.timelineVariable('original'),
      right: jsPsych.timelineVariable('inverted'),
      choices: ['f', 'j'],
      data: {
          left: jsPsych.timelineVariable('original'),
          right: jsPsych.timelineVariable('inverted'),
          stimulus_type: 'test',
      },
      stimulus_width: 512,
      prompt: question,
      on_finish: function() {
        // saveData(
        //   `experiment_data_${sona_id}_${subject_id}`,
        //   jsPsych.data.get().csv()
        // );
        jatos.submitResultData(jsPsych.data.get().json());
		var curr_progress_bar_value = jsPsych.getProgressBarCompleted();
		jsPsych.setProgressBar(curr_progress_bar_value + (1/N_img_in_block));
      }
}


var block_finished = {
      type: jsPsychHtmlKeyboardResponse,
      stimulus: function() {
          return msg[block_count]
      },
      trial_duration: 15000,
      response_ends_trial: true,
      choices: ['q'],
      on_finish: function() {
        console.log(jsPsych.getProgressBarCompleted());
        jsPsych.setProgressBar(0);
    }
};

var continue_screen = {
      type: jsPsychHtmlKeyboardResponse,
      choices: [' '],
      stimulus: space_to_continue_msg,
};

var attention_check = {
      type: image2afc,
      left: 'samples/dog.jpg',
      right: 'samples/cat.jpg',
      choices: ['f', 'j', ' '],
      data: {
        stimulus_type: 'attentioncheck',
      },
      prompt: "<p>\nPlease press the space key!</p>",
      on_finish: function(data){
          // Score the response as correct or incorrect.
          if(jsPsych.pluginAPI.compareKeys(data.response, " ")){
            data.correct = true;
          } else {
            data.correct = false; 
          }
      }
}

var feedback = {
  type: jsPsychHtmlKeyboardResponse,
  trial_duration: 5000,
  response_ends_trial: true,
  choices: [' '],
  stimulus: function(){
    var last_trial_correct = jsPsych.data.get().last(1).values()[0].correct;
    if(last_trial_correct){
      return reward_msg;
    } else {
      return warn_msg
    }
  }
}

var attention_conditional = {
	timeline: [attention_check, feedback],
	conditional_function: function () {
		if (trial_count % attention_check_freq == 0) {
			return true;
		} else {
			return false;
		}
	}
};

var break_conditional = {
	timeline: [block_finished, continue_screen],
	conditional_function: function () {
		trial_count++;
		if (trial_count % N_img_in_block == 0 && trial_count < N) {
            block_count++;
			return true;
		} else {
			return false;
		}
	}
};

test_procedure = {
    timeline: [test, break_conditional],// attention_conditional],
    timeline_variables: test_stimuli,
    randomize_order: true,
}
timeline.push(test_procedure)

var survey = {
    type: jsPsychSurveyText,
    questions: [{
        prompt: "Worauf haben Sie besonders geachtet?",
        value: '',
        required: false,
        rows: 10,
        columns: 40,
        name: 'survey'
    }]
}
// timeline.push(survey)


var goodbye = {
	type: jsPsychHtmlKeyboardResponse,
	stimulus: sona_msg
};
timeline.push(goodbye)
var save = {
      type: jsPsychHtmlKeyboardResponse,
      stimulus: 'saving',
    trial_duration: 1000,
    on_start: function() {
        console.log('hidden response for saving');
      // saveData(
      //   `experiment_data_${sona_id}_${subject_id}`,
      //   jsPsych.data.get().csv()
      // );
    }
};
timeline.push(save);


// timeline = [];
// timeline.push(preload)
// timeline.push(test_procedure)
console.log(timeline);
jsPsych.run(timeline);
