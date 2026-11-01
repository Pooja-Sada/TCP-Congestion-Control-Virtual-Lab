
// TCP Slow Start Simulation

// Initial values
let cwnd = 1;
let ssthresh = 16;
let rtt = 0;

let timer = null;
let isRunning = false;
let isCompleted = false;

// Graph data
let graphData = [1];

// HTML elements
const cwndDisplay = document.getElementById("cwnd");
const ssthreshDisplay = document.getElementById("ssthresh");
const rttDisplay = document.getElementById("rtt");
const phaseDisplay = document.getElementById("phase");
const historyDisplay = document.getElementById("rttHistory");

const startBtn = document.getElementById("startBtn");
const pauseBtn = document.getElementById("pauseBtn");
const resetBtn = document.getElementById("resetBtn");

const canvas = document.getElementById("growthChart");
const ctx = canvas.getContext("2d");

// Update dashboard values
function updateDashboard() {
    cwndDisplay.textContent = cwnd + " MSS";
    ssthreshDisplay.textContent = ssthresh + " MSS";
    rttDisplay.textContent = rtt;
}

// Draw congestion window graph
function drawGraph() {

    const width = canvas.clientWidth;
    const height = canvas.clientHeight;

    const dpr = window.devicePixelRatio || 1;

    canvas.width = width * dpr;
    canvas.height = height * dpr;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    ctx.clearRect(0, 0, width, height);

    const left = 45;
    const right = width - 15;
    const top = 20;
    const bottom = height - 40;

    const maxValue = Math.max(ssthresh, ...graphData) * 1.2;

    // Draw grid
    ctx.strokeStyle = "#263650";
    ctx.lineWidth = 1;

    for (let i = 0; i <= 4; i++) {
        const y = bottom - (i / 4) * (bottom - top);

        ctx.beginPath();
        ctx.moveTo(left, y);
        ctx.lineTo(right, y);
        ctx.stroke();
    }

    // Draw threshold line
    const thresholdY = bottom - (ssthresh / maxValue) * (bottom - top);

    ctx.strokeStyle = "#facc15";
    ctx.setLineDash([6, 5]);

    ctx.beginPath();
    ctx.moveTo(left, thresholdY);
    ctx.lineTo(right, thresholdY);
    ctx.stroke();

    ctx.setLineDash([]);

    // Draw growth line
    ctx.strokeStyle = "#38bdf8";
    ctx.lineWidth = 3;

    ctx.beginPath();

    graphData.forEach((value, index) => {

        const x = left + (index / Math.max(graphData.length - 1, 1)) * (right - left);
        const y = bottom - (value / maxValue) * (bottom - top);

        if (index === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }

    });

    ctx.stroke();

    // Draw points
    graphData.forEach((value, index) => {

        const x = left + (index / Math.max(graphData.length - 1, 1)) * (right - left);
        const y = bottom - (value / maxValue) * (bottom - top);

        ctx.fillStyle = "#38bdf8";

        ctx.beginPath();
        ctx.arc(x, y, 5, 0, Math.PI * 2);
        ctx.fill();

    });

    // Axis labels
    ctx.fillStyle = "#cbd5e1";
    ctx.font = "12px Arial";

    ctx.fillText("CWND (MSS)", 5, 14);
    ctx.fillText("RTT", right - 20, height - 8);
    ctx.fillText("SSTHRESH = " + ssthresh, left + 5, Math.max(12, thresholdY - 8));

    // Y-axis values
    ctx.fillText("0", 20, bottom + 4);
    ctx.fillText(maxValue.toFixed(0), 10, top + 4);
}

// Add RTT history
function addHistory() {

    if (rtt === 0) {
        historyDisplay.innerHTML = "";
    }

    const entry = document.createElement("div");

    entry.className = "rtt-entry";

    entry.textContent =
        "RTT " + rtt + " : CWND = " + cwnd + " MSS";

    historyDisplay.appendChild(entry);
}

// One RTT simulation step
function simulateStep() {

    // Check if threshold is reached
    if (cwnd >= ssthresh) {

        clearInterval(timer);
        timer = null;
        isRunning = false;
        isCompleted = true;

        phaseDisplay.textContent = "Congestion Avoidance";
        startBtn.disabled = true;

        return;
    }

    // Increase CWND exponentially
    cwnd = cwnd * 2;

    rtt++;

    graphData.push(cwnd);

    updateDashboard();
    drawGraph();
    addHistory();

    // Stop when threshold is reached
    if (cwnd >= ssthresh) {

        clearInterval(timer);
        timer = null;
        isRunning = false;
        isCompleted = true;

        phaseDisplay.textContent = "Congestion Avoidance";
        startBtn.disabled = true;

    }
}

// Start button
startBtn.addEventListener("click", function () {

    if (isRunning || isCompleted) {
        return;
    }

    isRunning = true;

    phaseDisplay.textContent = "Slow Start Running";

    timer = setInterval(simulateStep, 1000);

});

// Pause button
pauseBtn.addEventListener("click", function () {

    if (timer !== null) {

        clearInterval(timer);

        timer = null;
        isRunning = false;

        phaseDisplay.textContent = "Paused";

    }

});

// Reset button
resetBtn.addEventListener("click", function () {

    clearInterval(timer);

    timer = null;

    cwnd = 1;
    ssthresh = 16;
    rtt = 0;

    isRunning = false;
    isCompleted = false;

    graphData = [1];

    startBtn.disabled = false;

    phaseDisplay.textContent = "Ready to Start";

    historyDisplay.innerHTML =
        "<p>Simulation has not started yet.</p>";

    updateDashboard();
    drawGraph();

});

// Initial display
updateDashboard();
drawGraph();

// Redraw graph when window size changes
window.addEventListener("resize", drawGraph);
