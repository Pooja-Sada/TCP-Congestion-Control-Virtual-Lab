// TCP Reno-style educational simulation. cwnd and ssthresh are measured in MSS.
const $ = (id) => document.getElementById(id);
let chart;
let timer = null;
let running = false;
let state = {};

const descriptions = {
  "Slow Start": "cwnd is increasing exponentially while it remains below ssthresh.",
  "Congestion Avoidance": "cwnd is increasing linearly, approximately 1 MSS per RTT.",
  "Fast Recovery": "A triple-duplicate-ACK event was detected. The sender retransmits and reduces its window.",
  "Ready": "Start the experiment to observe TCP congestion control."
};

function makeInitialState() {
  return {
    cwnd: Number($("initialCwnd").value),
    ssthresh: Number($("threshold").value),
    rtt: 0, losses: 0, phase: "Ready",
    data: [{x: 0, y: Number($("initialCwnd").value)}],
    thresholdData: [{x: 0, y: Number($("threshold").value)}],
    recoveryPending: false
  };
}

function setupChart() {
  const ctx = $("cwndChart").getContext("2d");
  if (chart) chart.destroy();
  chart = new Chart(ctx, {
    type: "line",
    data: {
      datasets: [
        {label: "cwnd", data: state.data, parsing: false, borderColor: "#55a9ff", backgroundColor: "rgba(85,169,255,.12)", borderWidth: 3, pointRadius: 3, pointBackgroundColor: "#62e0e0", fill: true, tension: .22},
        {label: "ssthresh", data: state.thresholdData, parsing: false, borderColor: "#ffd166", borderWidth: 2, borderDash: [7,6], pointRadius: 0, fill: false}
      ]
    },
    options: {
      responsive: true, maintainAspectRatio: false, animation: {duration: 250},
      plugins: {legend: {display: false}, tooltip: {backgroundColor: "#10243a", titleColor: "#fff", bodyColor: "#d7e7f7"}},
      scales: {
        x: {type: "linear", title: {display: true, text: "Round-trip time (RTT)", color: "#91a4bb"}, ticks: {color: "#91a4bb", stepSize: 1}, grid: {color: "rgba(145,164,187,.12)"}},
        y: {beginAtZero: true, suggestedMax: 20, title: {display: true, text: "Congestion window (MSS)", color: "#91a4bb"}, ticks: {color: "#91a4bb"}, grid: {color: "rgba(145,164,187,.12)"}}
      }
    }
  });
}

function updateChart() {
  chart.data.datasets[0].data = state.data;
  chart.data.datasets[1].data = state.thresholdData;
  chart.options.scales.y.suggestedMax = Math.max(20, state.ssthresh + 4, state.cwnd + 4);
  chart.update();
}

function updateUI() {
  $("cwndValue").innerHTML = `${state.cwnd} <small>MSS</small>`;
  $("ssthreshValue").innerHTML = `${state.ssthresh} <small>MSS</small>`;
  $("rttValue").textContent = state.rtt;
  $("rttLabel").textContent = `RTT: ${state.rtt}`;
  $("lossValue").textContent = state.losses;
  $("phaseValue").textContent = state.phase;
  $("phaseDescription").textContent = descriptions[state.phase] || "The simulation is progressing.";
  $("runStatus").textContent = running ? "● RUNNING" : (state.rtt ? "● PAUSED / STOPPED" : "● READY");
  $("routerStatus").textContent = state.phase === "Fast Recovery" ? "Loss detected" : "Normal traffic";
  $("eventMessage").textContent = state.message || "Ready. Start the simulation to transmit packets.";
  $("startBtn").disabled = running;
  $("pauseBtn").disabled = !running;
  $("lossBtn").disabled = !running;
  $("resultRtt").textContent = state.rtt;
  $("resultCwnd").textContent = `${state.cwnd} MSS`;
  $("resultLoss").textContent = state.losses;
  $("resultPhase").textContent = state.phase;
}

function stopTimer() {
  if (timer) clearInterval(timer);
  timer = null;
  running = false;
  updateUI();
}

function tick() {
  if (state.recoveryPending) {
    state.cwnd = state.ssthresh;
    state.recoveryPending = false;
    state.phase = "Congestion Avoidance";
    state.message = "Fast Recovery completed. TCP Reno continues with Congestion Avoidance.";
  } else {
    state.rtt += 1;
    if (state.cwnd < state.ssthresh) {
      state.phase = "Slow Start";
      state.cwnd = Math.min(state.cwnd * 2, state.ssthresh);
      if (state.cwnd >= state.ssthresh) {
        state.message = "ssthresh reached. The next growth phase is Congestion Avoidance.";
      } else {
        state.message = "ACKs received. Slow Start approximately doubles cwnd for this RTT.";
      }
    } else {
      state.phase = "Congestion Avoidance";
      state.cwnd += 1;
      state.message = "Congestion Avoidance: cwnd increases by approximately 1 MSS this RTT.";
    }
  }
  state.data.push({x: state.rtt, y: state.cwnd});
  state.thresholdData.push({x: state.rtt, y: state.ssthresh});
  updateChart();
  updateUI();
  if (state.rtt >= 30) {
    stopTimer();
    state.message = "Simulation reached 30 RTT rounds. Reset to run another experiment.";
    updateUI();
  }
}

function startTimer() {
  if (running) return;
  running = true;
  updateUI();
  const interval = Math.max(450, 1900 - Number($("speed").value) * 350);
  timer = setInterval(tick, interval);
}

function introduceLoss() {
  if (!running) return;
  stopTimer();
  state.losses += 1;
  state.ssthresh = Math.max(Math.floor(state.cwnd / 2), 2);
  state.thresholdData.push({x: state.rtt, y: state.ssthresh});
  if ($("lossType").value === "duplicate") {
    state.cwnd = state.ssthresh + 3;
    state.phase = "Fast Recovery";
    state.recoveryPending = true;
    state.message = "Three duplicate ACKs: Fast Retransmit is triggered. Reno enters Fast Recovery; cwnd is temporarily inflated by 3 MSS.";
  } else {
    state.cwnd = 1;
    state.phase = "Slow Start";
    state.recoveryPending = false;
    state.message = "Retransmission timeout: ssthresh is reduced and cwnd returns to 1 MSS. Slow Start restarts.";
  }
  state.data.push({x: state.rtt, y: state.cwnd});
  updateChart();
  updateUI();
  startTimer();
}

function resetSimulation() {
  stopTimer();
  state = makeInitialState();
  state.message = "Experiment reset. Press Start to begin.";
  setupChart();
  updateUI();
}

function showPage(pageName) {
  document.querySelectorAll(".page").forEach(p => p.classList.toggle("active-page", p.id === pageName));
  document.querySelectorAll(".nav-link").forEach(a => a.classList.toggle("active", a.dataset.page === pageName));
  $("mainNav").classList.remove("open");
  if (pageName === "results") updateUI();
  window.scrollTo({top: 0, behavior: "smooth"});
}

document.querySelectorAll("[data-go]").forEach(btn => btn.addEventListener("click", () => showPage(btn.dataset.go)));
document.querySelectorAll(".nav-link").forEach(link => {
  link.addEventListener("click", e => {
    if (link.dataset.page) {
      e.preventDefault();
      showPage(link.dataset.page);
    }
  });
});
$("menuToggle").addEventListener("click", () => $("mainNav").classList.toggle("open"));
$("startBtn").addEventListener("click", startTimer);
$("pauseBtn").addEventListener("click", stopTimer);
$("lossBtn").addEventListener("click", introduceLoss);
$("resetBtn").addEventListener("click", resetSimulation);
$("refreshResults").addEventListener("click", updateUI);
$("initialCwnd").addEventListener("input", e => $("initialCwndOut").textContent = `${e.target.value} MSS`);
$("threshold").addEventListener("input", e => $("thresholdOut").textContent = `${e.target.value} MSS`);
$("speed").addEventListener("input", e => $("speedOut").textContent = `${(Number(e.target.value)/2).toFixed(1)}×`);

// ================= QUIZ QUESTION BANK =================

const questions = [
    {
        q: "What does cwnd represent in TCP?",
        a: ["Receiver's IP address", "Sender's congestion window", "Number of routers", "Physical link speed"],
        correct: 1,
        why: "cwnd represents the congestion window and controls how much unacknowledged data can be sent."
    },
    {
        q: "How does cwnd grow during Slow Start?",
        a: ["It doubles approximately every RTT", "It decreases every RTT", "It remains constant", "It increases by one byte"],
        correct: 0,
        why: "Slow Start produces approximately exponential growth."
    },
    {
        q: "How does cwnd grow during Congestion Avoidance?",
        a: ["Exponentially", "It becomes zero", "Approximately 1 MSS per RTT", "It remains constant"],
        correct: 2,
        why: "Congestion Avoidance uses approximately linear growth."
    },
    {
        q: "What can three duplicate ACKs trigger in TCP Reno?",
        a: ["DNS lookup", "Fast Retransmit", "Connection shutdown", "IP address change"],
        correct: 1,
        why: "Three duplicate ACKs trigger Fast Retransmit and Fast Recovery."
    },
    {
        q: "What happens to cwnd after a timeout in this model?",
        a: ["It doubles", "It remains unchanged", "It returns to 1 MSS", "It becomes 100 MSS"],
        correct: 2,
        why: "A timeout causes cwnd to return to 1 MSS in this teaching model."
    },
    {
        q: "What is the full form of MSS?",
        a: ["Maximum Segment Size", "Minimum Server Speed", "Maximum Signal Strength", "Multiple Segment System"],
        correct: 0,
        why: "MSS stands for Maximum Segment Size."
    },
    {
        q: "What does RTT stand for?",
        a: ["Real Transfer Time", "Round Trip Time", "Router Transmission Type", "Random Time Transfer"],
        correct: 1,
        why: "RTT is the time taken for a packet to travel to the destination and for its acknowledgement to return."
    },
    {
        q: "Which TCP mechanism controls the sender's transmission rate?",
        a: ["DNS", "ARP", "Congestion Control", "HTTP"],
        correct: 2,
        why: "Congestion Control adjusts the sending rate according to network conditions."
    },
    {
        q: "What is ssthresh?",
        a: ["Slow Start Threshold", "Segment Size Transfer", "Server Start Time", "Signal Strength Threshold"],
        correct: 0,
        why: "ssthresh is the threshold used to switch between Slow Start and Congestion Avoidance."
    },
    {
        q: "Which phase uses exponential growth?",
        a: ["Fast Recovery", "Slow Start", "Congestion Avoidance", "Termination"],
        correct: 1,
        why: "Slow Start increases cwnd exponentially."
    },
    {
        q: "Which phase uses linear growth?",
        a: ["Slow Start", "Fast Retransmit", "Congestion Avoidance", "Connection Setup"],
        correct: 2,
        why: "Congestion Avoidance increases cwnd approximately linearly."
    },
    {
        q: "What does packet loss usually indicate?",
        a: ["Network congestion may have occurred", "The connection is faster", "The receiver is switched off", "The IP address has changed"],
        correct: 0,
        why: "Packet loss can indicate congestion in the network."
    },
    {
        q: "What is the purpose of Fast Retransmit?",
        a: ["To change IP addresses", "To retransmit a lost segment quickly", "To close the connection", "To increase MSS"],
        correct: 1,
        why: "Fast Retransmit retransmits a segment without waiting for a timeout."
    },
    {
        q: "What is the unit commonly used for cwnd in this simulation?",
        a: ["Volts", "Seconds", "MSS", "Hertz"],
        correct: 2,
        why: "The congestion window is represented in MSS units."
    },
    {
        q: "What does an ACK indicate?",
        a: ["Acknowledgement of received data", "A packet loss", "A network failure", "A new connection"],
        correct: 0,
        why: "ACK confirms that data has been received."
    },
    {
        q: "Which protocol provides reliable data transmission?",
        a: ["UDP", "TCP", "IP only", "ARP"],
        correct: 1,
        why: "TCP provides reliable, ordered data transmission."
    },
    {
        q: "What happens when the congestion window increases?",
        a: ["The sender can send more unacknowledged data", "The receiver is disconnected", "The packet size becomes zero", "The connection automatically closes"],
        correct: 0,
        why: "A larger cwnd allows more data to be in transit before acknowledgements arrive."
    },
    {
        q: "Which event is used as a congestion signal in TCP?",
        a: ["Successful DNS lookup", "Packet loss", "Opening a webpage", "Changing a port number"],
        correct: 1,
        why: "Packet loss is commonly treated as a sign of possible network congestion."
    },
    {
        q: "What is the main objective of TCP congestion control?",
        a: ["Increase screen resolution", "Prevent network congestion", "Change the destination IP", "Encrypt every packet"],
        correct: 1,
        why: "It helps prevent excessive traffic from overwhelming the network."
    },
    {
        q: "What does Fast Recovery help avoid?",
        a: ["Returning to Slow Start unnecessarily after certain loss events", "Sending acknowledgements", "Using TCP", "Receiving packets"],
        correct: 0,
        why: "Fast Recovery helps TCP Reno recover from certain packet-loss events without restarting Slow Start immediately."
    }
];


// ================= QUIZ STATE =================

let remainingQuestions = [];
let currentQuiz = [];
let currentQuestionIndex = 0;
let userAnswers = [];
let quizSubmitted = false;


// ================= SHUFFLE FUNCTION =================

function shuffleArray(array) {
    const shuffled = [...array];

    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    return shuffled;
}


// ================= GET NEXT 5 QUESTIONS =================

function startNewQuiz() {

    // Refill only after the question bank is exhausted
    if (remainingQuestions.length < 5) {
        remainingQuestions = shuffleArray(questions);
    }

    currentQuiz = remainingQuestions.splice(0, 5);

    // Shuffle answer options while preserving correct answers
    currentQuiz = currentQuiz.map(question => {

        const options = question.a.map((answer, index) => ({
            text: answer,
            isCorrect: index === question.correct
        }));

        const shuffledOptions = shuffleArray(options);

        return {
            ...question,
            a: shuffledOptions.map(option => option.text),
            correct: shuffledOptions.findIndex(option => option.isCorrect)
        };
    });

    currentQuestionIndex = 0;
    userAnswers = [];
    quizSubmitted = false;

    $("restartQuiz").style.display = "none";
    $("nextQuestion").style.display = "inline-block";
    $("nextQuestion").textContent = "Next Question";

    $("quizFeedback").textContent =
        "Answer all 5 questions. Correct answers will appear after submission.";

    renderQuizQuestion();
}


// ================= DISPLAY QUESTION =================

function renderQuizQuestion() {

    const question = currentQuiz[currentQuestionIndex];

    $("quizCount").textContent =
        `Question ${currentQuestionIndex + 1} / 5`;

    $("quizProgress").style.width =
        `${((currentQuestionIndex + 1) / 5) * 100}%`;

    $("questionText").textContent = question.q;

    $("quizScore").textContent =
        `Answered: ${userAnswers.filter(answer => answer !== null).length}/5`;

    $("quizFeedback").textContent =
        "Choose one answer to continue.";

    const optionsContainer = $("answerOptions");
    optionsContainer.innerHTML = "";

    question.a.forEach((answer, index) => {

        const button = document.createElement("button");

        button.className = "answer-option";
        button.textContent = answer;

        if (userAnswers[currentQuestionIndex] === index) {
            button.classList.add("selected");
        }

       button.addEventListener("click", () => {

        if (quizSubmitted) return;

          userAnswers[currentQuestionIndex] = index;

          $("nextQuestion").disabled = false;

          renderQuizQuestion();

       });

        optionsContainer.appendChild(button);
    });

    $("nextQuestion").textContent =
        currentQuestionIndex === 4 ? "Submit Quiz" : "Next Question";
}


// ================= NEXT QUESTION / SUBMIT =================

$("nextQuestion").addEventListener("click", () => {

    if (quizSubmitted) return;

    if (userAnswers[currentQuestionIndex] === undefined) {
        $("quizFeedback").textContent =
            "Please select an answer before continuing.";
        return;
    }

    if (currentQuestionIndex < 4) {

        currentQuestionIndex++;
        renderQuizQuestion();

    } else {

        submitQuiz();
    }
});


// ================= SUBMIT QUIZ =================

function submitQuiz() {

    quizSubmitted = true;

    let score = 0;

    const feedback = $("quizFeedback");
    feedback.innerHTML = "";

    currentQuiz.forEach((question, index) => {

        const selectedAnswer = userAnswers[index];
        const isCorrect = selectedAnswer === question.correct;

        if (isCorrect) score++;

        const review = document.createElement("div");

        review.className = "quiz-review-item";

        const questionHeading = document.createElement("h4");
        questionHeading.textContent =
            `${index + 1}. ${question.q}`;

        const yourAnswer = document.createElement("p");
        yourAnswer.textContent =
            `Your answer: ${question.a[selectedAnswer]}`;

        const correctAnswer = document.createElement("p");
        correctAnswer.textContent =
            `Correct answer: ${question.a[question.correct]}`;

        const explanation = document.createElement("p");
        explanation.textContent =
            `Explanation: ${question.why}`;

        const result = document.createElement("strong");
        result.textContent = isCorrect ? "Correct" : "Incorrect";

        review.classList.add(isCorrect ? "correct" : "wrong");

        review.appendChild(questionHeading);
        review.appendChild(yourAnswer);
        review.appendChild(correctAnswer);
        review.appendChild(explanation);
        review.appendChild(result);

        feedback.appendChild(review);
    });

    $("quizScore").textContent = `Final Score: ${score}/5`;

    $("questionText").textContent = "Quiz Completed!";

    $("quizCount").textContent = "5 / 5";

    $("quizProgress").style.width = "100%";

    $("answerOptions").innerHTML = "";

    $("nextQuestion").style.display = "none";

    $("restartQuiz").style.display = "inline-block";
    $("restartQuiz").textContent = "Restart Quiz";
}


// ================= RESTART QUIZ =================

$("restartQuiz").addEventListener("click", () => {
    startNewQuiz();
});


state = makeInitialState();
state.message = "Ready. Start the simulation to transmit packets.";
setupChart();
updateUI();




// Interactive TCP terminology and phase cards

const termInformation = {
  cwnd: {
    title: "Congestion Window (CWND)",
    description: "CWND controls the amount of unacknowledged data that a sender can transmit into the network. TCP adjusts this window according to network conditions."
  },

  ssthresh: {
    title: "Slow Start Threshold (SSThresh)",
    description: "SSThresh determines the transition point between Slow Start and Congestion Avoidance."
  },

  rtt: {
    title: "Round Trip Time (RTT)",
    description: "RTT is the time taken for a packet to reach the receiver and for its acknowledgement to return to the sender."
  },

  ack: {
    title: "Acknowledgement (ACK)",
    description: "An ACK is a response sent by the receiver to confirm that data has been received successfully."
  }
};

const phaseInformation = {
  slowstart: {
    title: "Slow Start",
    description: "TCP begins with a small congestion window. It increases CWND exponentially, approximately doubling every RTT in this simplified model. This continues until the threshold is reached or congestion is detected."
  },

  congestionavoidance: {
    title: "Congestion Avoidance",
    description: "When CWND reaches SSThresh, TCP enters Congestion Avoidance. The congestion window increases gradually, approximately by one MSS per RTT."
  },

  fastretransmit: {
    title: "Fast Retransmit",
    description: "When the sender receives three duplicate ACKs, it assumes that a segment may have been lost. TCP retransmits the missing segment without waiting for a timeout."
  },

  fastrecovery: {
    title: "Fast Recovery",
    description: "In TCP Reno, Fast Recovery follows Fast Retransmit. TCP reduces its congestion window and continues transmission without restarting from the initial Slow Start state."
  },

  timeout: {
    title: "Retransmission Timeout",
    description: "A retransmission timeout indicates that an acknowledgement has not arrived within the expected time. TCP treats this as a serious congestion signal, reduces its congestion window to 1 MSS in this teaching model, and restarts Slow Start."
  }
};

// Parameter cards
document.querySelectorAll(".term-card").forEach(card => {
  card.addEventListener("click", () => {
    const info = termInformation[card.dataset.term];
    if (!info) return;

    document.getElementById("termExplanation").innerHTML = `
      <span class="tag">PARAMETER EXPLANATION</span>
      <h2>${info.title}</h2>
      <p>${info.description}</p>
    `;

    document.querySelectorAll(".term-card").forEach(item => {
      item.classList.remove("selected");
    });

    card.classList.add("selected");
  });
});

// TCP phase cards
document.querySelectorAll(".phase-card").forEach(card => {
  card.addEventListener("click", () => {
    const info = phaseInformation[card.dataset.term];
    if (!info) return;

    document.getElementById("phaseExplanation").innerHTML = `
      <span class="tag">PHASE EXPLANATION</span>
      <h2>${info.title}</h2>
      <p>${info.description}</p>
    `;

    document.querySelectorAll(".phase-card").forEach(item => {
      item.classList.remove("selected");
    });

    card.classList.add("selected");
  });
});

 startNewQuiz();
const initialPage = window.location.hash.substring(1);

if (["home", "theory", "animation", "experiment", "results", "quiz"].includes(initialPage)) {
  showPage(initialPage);
}
