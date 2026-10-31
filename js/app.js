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
document.querySelectorAll(".nav-link").forEach(link => link.addEventListener("click", e => {e.preventDefault(); showPage(link.dataset.page);}));
$("menuToggle").addEventListener("click", () => $("mainNav").classList.toggle("open"));
$("startBtn").addEventListener("click", startTimer);
$("pauseBtn").addEventListener("click", stopTimer);
$("lossBtn").addEventListener("click", introduceLoss);
$("resetBtn").addEventListener("click", resetSimulation);
$("refreshResults").addEventListener("click", updateUI);
$("initialCwnd").addEventListener("input", e => $("initialCwndOut").textContent = `${e.target.value} MSS`);
$("threshold").addEventListener("input", e => $("thresholdOut").textContent = `${e.target.value} MSS`);
$("speed").addEventListener("input", e => $("speedOut").textContent = `${(Number(e.target.value)/2).toFixed(1)}×`);

const questions = [
  {q:"What does cwnd represent in TCP?",a:["The receiver's IP address","The sender's congestion window","The number of routers","The physical link speed"],correct:1,why:"cwnd limits the amount of unacknowledged data the sender can have in the network."},
  {q:"How does cwnd approximately grow during Slow Start in this model?",a:["It halves every RTT","It stays constant","It doubles each RTT","It increases by exactly 1 byte"],correct:2,why:"Slow Start produces approximately exponential growth, doubling cwnd per RTT."},
  {q:"What is the approximate cwnd increase per RTT during Congestion Avoidance?",a:["1 MSS","10 MSS","It doubles","It becomes zero"],correct:0,why:"Congestion Avoidance uses approximately linear growth of 1 MSS per RTT."},
  {q:"In TCP Reno, what can three duplicate ACKs trigger?",a:["A new IP address","Fast Retransmit and Fast Recovery","Permanent shutdown","A DNS lookup"],correct:1,why:"Three duplicate ACKs are used as a loss signal and trigger Fast Retransmit and Fast Recovery."},
  {q:"What happens to cwnd after a retransmission timeout in this teaching model?",a:["It doubles","It remains unchanged","It returns to 1 MSS","It becomes equal to the router queue"],correct:2,why:"A timeout causes a stronger reduction: cwnd returns to 1 MSS and Slow Start begins again."}
];
let qIndex = 0, score = 0, answered = false;
function renderQuestion() {
  const q = questions[qIndex];
  $("quizCount").textContent = `QUESTION ${qIndex+1} OF ${questions.length}`;
  $("quizScore").textContent = `SCORE: ${score}`;
  $("quizProgress").style.width = `${((qIndex+1)/questions.length)*100}%`;
  $("questionText").textContent = q.q;
  $("quizFeedback").textContent = "";
  $("nextQuestion").disabled = true;
  $("nextQuestion").textContent = qIndex === questions.length-1 ? "See score →" : "Next question →";
  $("answerOptions").innerHTML = "";
  answered = false;
  q.a.forEach((answer, i) => {
    const b = document.createElement("button");
    b.className = "answer-option";
    b.textContent = `${String.fromCharCode(65+i)}. ${answer}`;
    b.addEventListener("click", () => chooseAnswer(i));
    $("answerOptions").appendChild(b);
  });
}
function chooseAnswer(index) {
  if (answered) return;
  answered = true;
  const q = questions[qIndex];
  [...$("answerOptions").children].forEach((b, i) => {
    b.disabled = true;
    if (i === q.correct) b.classList.add("correct");
    if (i === index && i !== q.correct) b.classList.add("wrong");
  });
  if (index === q.correct) {score++; $("quizFeedback").textContent = `Correct! ${q.why}`;}
  else $("quizFeedback").textContent = `Not quite. ${q.why}`;
  $("quizScore").textContent = `SCORE: ${score}`;
  $("nextQuestion").disabled = false;
}
$("nextQuestion").addEventListener("click", () => {
  if (qIndex < questions.length-1) {qIndex++; renderQuestion();}
  else {
    $("questionText").textContent = `Quiz complete! You scored ${score} out of ${questions.length}.`;
    $("answerOptions").innerHTML = "";
    $("quizFeedback").textContent = score >= 4 ? "Excellent work. You understand the main TCP congestion-control concepts." : "Review the Theory section and try again to strengthen your understanding.";
    $("nextQuestion").disabled = true;
    $("quizCount").textContent = "COMPLETED";
  }
});
$("restartQuiz").addEventListener("click", () => {qIndex=0;score=0;renderQuestion();});

state = makeInitialState();
state.message = "Ready. Start the simulation to transmit packets.";
setupChart();
updateUI();
renderQuestion();
