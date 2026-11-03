
// TCP SLOW START - INTERACTIVE SIMULATION

const canvas = document.getElementById("cwndGraph");
const ctx = canvas.getContext("2d");

const initialInput = document.getElementById("initialCwnd");
const thresholdInput = document.getElementById("threshold");
const speedInput = document.getElementById("speed");

const initialValue = document.getElementById("initialValue");
const thresholdValue = document.getElementById("thresholdValue");
const speedValue = document.getElementById("speedValue");

const cwndStat = document.getElementById("cwndStat");
const ssthreshStat = document.getElementById("ssthreshStat");
const rttStat = document.getElementById("rttStat");
const ackStat = document.getElementById("ackStat");

const phaseStatus = document.getElementById("phaseStatus");
const phaseMessage = document.getElementById("phaseMessage");
const stepLabel = document.getElementById("stepLabel");
const stepTitle = document.getElementById("stepTitle");
const stepExplanation = document.getElementById("stepExplanation");

const networkMessage = document.getElementById("networkMessage");
const dataPacket = document.getElementById("dataPacket");
const ackPacket = document.getElementById("ackPacket");

const predictionQuestion = document.getElementById("predictionQuestion");
const predictionOptions = document.getElementById("predictionOptions");
const predictionFeedback = document.getElementById("predictionFeedback");
const checkPrediction = document.getElementById("checkPrediction");

const completionPanel = document.getElementById("completionPanel");
const completionTitle = document.getElementById("completionTitle");
const completionMessage = document.getElementById("completionMessage");

let initialCwnd = 1;
let cwnd = 1;
let ssthresh = 16;
let rtt = 0;
let ackCount = 0;

let history = [];
let timer = null;

let running = false;
let finished = false;

let selectedPrediction = null;
let expectedPrediction = null;
let predictionOpen = false;


// SETTINGS

function updateSettingsDisplay() {
    initialValue.textContent = initialInput.value + " MSS";
    thresholdValue.textContent = thresholdInput.value + " MSS";

    const names = {
        1: "Slow",
        2: "Normal",
        3: "Fast"
    };

    speedValue.textContent = names[speedInput.value];
}

initialInput.addEventListener("input", updateSettingsDisplay);
thresholdInput.addEventListener("input", updateSettingsDisplay);
speedInput.addEventListener("input", updateSettingsDisplay);


function getSpeed() {
    const speeds = {
        1: 2200,
        2: 1200,
        3: 500
    };

    return speeds[speedInput.value];
}


// APPLY SETTINGS

document.getElementById("applySettings").addEventListener("click", () => {

    if (Number(initialInput.value) >= Number(thresholdInput.value)) {
        document.getElementById("settingsMessage").textContent =
            "Initial CWND must be smaller than SSTHRESH.";
        return;
    }

    initialCwnd = Number(initialInput.value);
    ssthresh = Number(thresholdInput.value);

    resetSimulation();

    document.getElementById("settingsMessage").textContent =
        "Settings applied successfully. Start the simulation!";
});


// UPDATE STATISTICS

function updateStats() {
    cwndStat.textContent = cwnd + " MSS";
    ssthreshStat.textContent = ssthresh + " MSS";
    rttStat.textContent = rtt;
    ackStat.textContent = ackCount;
}


// PACKET ANIMATION

function animatePackets() {
    dataPacket.classList.remove("animate");
    ackPacket.classList.remove("animate");

    void dataPacket.offsetWidth;

    dataPacket.classList.add("animate");
    ackPacket.classList.add("animate");
}


// GRAPH

function drawGraph() {
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;

    const dpr = window.devicePixelRatio || 1;

    canvas.width = width * dpr;
    canvas.height = height * dpr;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);

    const padding = {
        left: 55,
        right: 25,
        top: 25,
        bottom: 45
    };

    const graphWidth = width - padding.left - padding.right;
    const graphHeight = height - padding.top - padding.bottom;

    const maxY = Math.max(ssthresh * 1.25, cwnd * 1.25, 8);
    const maxX = Math.max(4, history.length + 1);

    const x = value =>
        padding.left + (value / maxX) * graphWidth;

    const y = value =>
        padding.top + graphHeight - (value / maxY) * graphHeight;

    // GRAPH BACKGROUND

    ctx.fillStyle = "#0d1c32";
    ctx.fillRect(
        padding.left,
        padding.top,
        graphWidth,
        graphHeight
    );

    // SLOW START REGION HIGHLIGHT

    ctx.fillStyle = "rgba(112, 184, 255, 0.13)";
    ctx.fillRect(
        padding.left,
        padding.top,
        graphWidth,
        graphHeight
    );

    // GRID

    ctx.strokeStyle = "#28415e";
    ctx.lineWidth = 1;

    for (let i = 0; i <= 4; i++) {
        const value = (maxY / 4) * i;
        const position = y(value);

        ctx.beginPath();
        ctx.moveTo(padding.left, position);
        ctx.lineTo(width - padding.right, position);
        ctx.stroke();

        ctx.fillStyle = "#91a8c6";
        ctx.font = "11px Arial";
        ctx.textAlign = "right";
        ctx.fillText(value.toFixed(0), padding.left - 10, position + 4);
    }

    for (let i = 0; i <= maxX; i++) {
        const position = x(i);

        ctx.beginPath();
        ctx.moveTo(position, padding.top);
        ctx.lineTo(position, height - padding.bottom);
        ctx.stroke();

        ctx.fillStyle = "#91a8c6";
        ctx.textAlign = "center";
        ctx.fillText(i, position, height - padding.bottom + 20);
    }

    // AXIS LABELS

    ctx.fillStyle = "#d8e5f5";
    ctx.font = "12px Arial";
    ctx.textAlign = "center";
    ctx.fillText("RTT", width / 2, height - 5);

    ctx.save();
    ctx.translate(15, height / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText("CWND (MSS)", 0, 0);
    ctx.restore();

    // SSTHRESH LINE

    ctx.setLineDash([7, 5]);
    ctx.strokeStyle = "#ffc857";
    ctx.lineWidth = 2;

    ctx.beginPath();
    ctx.moveTo(padding.left, y(ssthresh));
    ctx.lineTo(width - padding.right, y(ssthresh));
    ctx.stroke();

    ctx.setLineDash([]);

    ctx.fillStyle = "#ffc857";
    ctx.textAlign = "right";
    ctx.fillText(
        "SSTHRESH = " + ssthresh + " MSS",
        width - padding.right,
        y(ssthresh) - 8
    );

    // CWND LINE

    if (history.length > 0) {
        ctx.beginPath();

        history.forEach((point, index) => {
            if (index === 0) {
                ctx.moveTo(x(index), y(point));
            } else {
                ctx.lineTo(x(index), y(point));
            }
        });

        ctx.strokeStyle = "#70b8ff";
        ctx.lineWidth = 3;
        ctx.stroke();

        // POINTS AND VALUES

        history.forEach((point, index) => {
            ctx.beginPath();
            ctx.arc(x(index), y(point), 5, 0, Math.PI * 2);

            ctx.fillStyle = "#70b8ff";
            ctx.fill();

            ctx.strokeStyle = "#edf4ff";
            ctx.lineWidth = 1.5;
            ctx.stroke();

            ctx.fillStyle = "#edf4ff";
            ctx.font = "11px Arial";
            ctx.textAlign = "center";

            ctx.fillText(
                point + " MSS",
                x(index),
                y(point) - 12
            );
        });
    }
}


// STEP-BY-STEP EXPLANATION

function explainStep(previous, current) {
    stepLabel.textContent = "RTT " + rtt;
    stepTitle.textContent = "CWND increased to " + current + " MSS";

    stepExplanation.textContent =
        "The sender transmitted data and received acknowledgements. " +
        "CWND increased from " + previous + " MSS to " + current +
        " MSS. In this simplified Slow Start model, the congestion " +
        "window approximately doubles after each RTT.";
}


// THRESHOLD COMPLETION

function completeSimulation() {
    finished = true;
    stopTimer();

    phaseStatus.textContent = "SLOW START COMPLETED";
    phaseMessage.textContent =
        "CWND has reached SSTHRESH.";

    networkMessage.textContent =
        "The threshold has been reached. Slow Start simulation stopped.";

    stepLabel.textContent = "COMPLETED";
    stepTitle.textContent = "Slow Start has ended";

    stepExplanation.textContent =
        "CWND reached " + ssthresh +
        " MSS, which is the configured SSTHRESH. " +
        "This module stops here. The next TCP phase is handled in your friend's module.";

    completionPanel.classList.add("completed");
    completionTitle.textContent = "Slow Start Completed!";
    completionMessage.textContent =
        "CWND reached the Slow Start Threshold of " +
        ssthresh + " MSS. You have completed this simulation.";

    document.getElementById("startBtn").disabled = true;
    document.getElementById("stepBtn").disabled = true;

    predictionOptions.innerHTML = "";
    predictionQuestion.textContent =
        "The Slow Start simulation is complete.";

    predictionFeedback.textContent =
        "Reset the simulation to experiment again.";

    checkPrediction.disabled = true;
}


// ADVANCE ONE RTT

function advanceRTT() {
    if (finished) return;

    const previousCwnd = cwnd;
    const nextCwnd = previousCwnd * 2;

    rtt++;

    // Simplified ACK count for this educational simulation.
    ackCount += previousCwnd;

    animatePackets();

    if (nextCwnd >= ssthresh) {
        cwnd = ssthresh;
    } else {
        cwnd = nextCwnd;
    }

    history.push(cwnd);

    updateStats();
    drawGraph();
    explainStep(previousCwnd, cwnd);

    networkMessage.textContent =
        "Data packets transmitted and acknowledgements received.";

    if (cwnd >= ssthresh) {
        completeSimulation();
    } else {
        phaseStatus.textContent = "SLOW START";
        phaseMessage.textContent =
            "CWND is increasing exponentially.";
    }
}


// PREDICT NEXT CWND

function openPrediction() {
    if (finished || running || predictionOpen) return;

    predictionOpen = true;
    selectedPrediction = null;

    expectedPrediction = Math.min(cwnd * 2, ssthresh);

    predictionQuestion.textContent =
        "Current CWND is " + cwnd +
        " MSS. What will CWND become after the next RTT?";

    predictionFeedback.textContent =
        "Choose your predicted CWND value.";

    checkPrediction.disabled = true;

    const options = new Set([
        expectedPrediction,
        Math.max(1, cwnd),
        cwnd + 1,
        Math.min(cwnd * 4, ssthresh)
    ]);

    // Ensure four different choices.
    let extra = expectedPrediction + 1;

    while (options.size < 4) {
        options.add(extra);
        extra++;
    }

    const choices = [...options].sort(() => Math.random() - 0.5);

    predictionOptions.innerHTML = "";

    choices.forEach(value => {
        const button = document.createElement("button");

        button.className = "prediction-option";
        button.textContent = value + " MSS";

        button.addEventListener("click", () => {
            selectedPrediction = value;

            document.querySelectorAll(".prediction-option")
                .forEach(option => option.classList.remove("selected"));

            button.classList.add("selected");
            checkPrediction.disabled = false;

            predictionFeedback.textContent =
                "You selected " + value + " MSS. Now check your prediction.";
        });

        predictionOptions.appendChild(button);
    });
}


// CHECK PREDICTION

checkPrediction.addEventListener("click", () => {
    if (selectedPrediction === null || !predictionOpen) return;

    if (selectedPrediction === expectedPrediction) {
        predictionFeedback.textContent =
            "Correct! You predicted the next CWND value.";

        predictionFeedback.style.color = "#70e0ae";

        const selectedButton = [...predictionOptions.children]
            .find(button =>
                button.textContent === selectedPrediction + " MSS"
            );

        if (selectedButton) {
            selectedButton.classList.add("correct-choice");
        }

        checkPrediction.disabled = true;
        predictionOpen = false;

        advanceRTT();

        if (!finished) {
            predictionQuestion.textContent =
                "Great! Predict the next value after the next RTT.";

            predictionOptions.innerHTML = "";
            predictionFeedback.textContent =
                "Click Next RTT to make another prediction.";
        }

    } else {
        predictionFeedback.textContent =
            "Try again! During Slow Start, CWND approximately doubles.";

        predictionFeedback.style.color = "#ff9da8";

        const selectedButton = [...predictionOptions.children]
            .find(button =>
                button.textContent === selectedPrediction + " MSS"
            );

        if (selectedButton) {
            selectedButton.classList.add("wrong-choice");
        }

        selectedPrediction = null;
        checkPrediction.disabled = true;

        setTimeout(() => {
            document.querySelectorAll(".prediction-option")
                .forEach(option => {
                    option.classList.remove("wrong-choice", "selected");
                });
        }, 500);
    }
});


// AUTOMATIC SIMULATION

function startSimulation() {
    if (running || finished || predictionOpen) return;

    running = true;

    document.getElementById("startBtn").disabled = true;
    document.getElementById("stepBtn").disabled = true;

    phaseStatus.textContent = "SLOW START RUNNING";
    phaseMessage.textContent =
        "CWND is increasing with every RTT.";

    networkMessage.textContent =
        "Data packets and ACKs are being exchanged.";

    timer = setInterval(() => {
        advanceRTT();
    }, getSpeed());
}


// PAUSE

function stopTimer() {
    clearInterval(timer);
    timer = null;
    running = false;
}

function pauseSimulation() {
    stopTimer();

    if (!finished) {
        document.getElementById("startBtn").disabled = false;
        document.getElementById("stepBtn").disabled = false;

        networkMessage.textContent = "Simulation paused.";
    }
}


// RESET

function resetSimulation() {
    stopTimer();

    cwnd = initialCwnd;
    rtt = 0;
    ackCount = 0;

    history = [cwnd];

    finished = false;
    predictionOpen = false;
    selectedPrediction = null;
    expectedPrediction = null;

    document.getElementById("startBtn").disabled = false;
    document.getElementById("stepBtn").disabled = false;

    phaseStatus.textContent = "SLOW START";
    phaseMessage.textContent =
        "Ready to begin exponential CWND growth.";

    networkMessage.textContent =
        "Press Start to begin transmission.";

    stepLabel.textContent = "READY";
    stepTitle.textContent = "Simulation not started";

    stepExplanation.textContent =
        "Press Start for automatic simulation or Next RTT to predict the next CWND manually.";

    predictionQuestion.textContent =
        "Start the simulation, then predict the next CWND value.";

    predictionOptions.innerHTML =
        '<button class="prediction-option" disabled>Waiting...</button>';

    predictionFeedback.textContent =
        "Use the exponential growth pattern to predict the next value.";

    predictionFeedback.style.color = "#9bcfff";

    checkPrediction.disabled = true;

    completionPanel.classList.remove("completed");

    completionTitle.textContent = "Slow Start in Progress";
    completionMessage.textContent =
        "CWND will increase until it reaches SSTHRESH.";

    updateStats();
    drawGraph();
}


// BUTTON EVENTS

document.getElementById("startBtn")
    .addEventListener("click", startSimulation);

document.getElementById("pauseBtn")
    .addEventListener("click", pauseSimulation);

document.getElementById("stepBtn")
    .addEventListener("click", openPrediction);

document.getElementById("resetBtn")
    .addEventListener("click", resetSimulation);


// INITIALIZE

updateSettingsDisplay();
resetSimulation();

window.addEventListener("resize", drawGraph);
