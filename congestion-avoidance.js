// TCP CONGESTION AVOIDANCE SIMULATION

const canvas = document.getElementById("ca-graph");
const ctx = canvas.getContext("2d");

const startBtn = document.getElementById("ca-start");
const pauseBtn = document.getElementById("ca-pause");
const resetBtn = document.getElementById("ca-reset");

const threshold = 8;

let rtt = 0;
let cwnd = 1;
let timer = null;
let running = false;
let phase = "Slow Start";

let history = [
    { rtt: 0, cwnd: 1, phase: "Slow Start" }
];


// UPDATE DISPLAY

function updateDisplay() {

    document.getElementById("ca-rtt").textContent = rtt;

    document.getElementById("ca-cwnd").textContent =
        cwnd + " MSS";

    document.getElementById("ca-threshold").textContent =
        threshold + " MSS";

    document.getElementById("ca-phase").textContent =
        phase;
}


// UPDATE TABLE

function updateTable() {

    const tbody = document.getElementById("ca-table-body");

    tbody.innerHTML = "";

    history.forEach(item => {

        const row = tbody.insertRow();

        row.insertCell(0).textContent = item.rtt;
        row.insertCell(1).textContent = item.cwnd;
        row.insertCell(2).textContent = item.phase;

    });
}


// SIMULATION LOGIC

function nextRTT() {

    if (rtt >= 20) {

        stopSimulation();

        document.getElementById("ca-status").textContent =
            "Simulation completed!";

        return;
    }

    rtt++;

    if (cwnd < threshold) {

        // EXPONENTIAL GROWTH

        cwnd = Math.min(cwnd * 2, threshold);

        phase = "Slow Start";

    } else {

        // LINEAR GROWTH

        cwnd = cwnd + 1;

        phase = "Congestion Avoidance";

    }

    history.push({
        rtt: rtt,
        cwnd: cwnd,
        phase: phase
    });

    updateDisplay();
    updateTable();
    drawGraph();

    document.getElementById("ca-status").textContent =
        "Current phase: " + phase;
}


// START

function startSimulation() {

    if (running || rtt >= 20) return;

    running = true;

    document.getElementById("ca-status").textContent =
        "Simulation running...";

    timer = setInterval(nextRTT, 1000);
}


// PAUSE

function stopSimulation() {

    clearInterval(timer);

    timer = null;
    running = false;
}


// RESET

function resetSimulation() {

    stopSimulation();

    rtt = 0;
    cwnd = 1;
    phase = "Slow Start";

    history = [
        { rtt: 0, cwnd: 1, phase: "Slow Start" }
    ];

    updateDisplay();
    updateTable();
    drawGraph();

    document.getElementById("ca-status").textContent =
        "Simulation reset. Press Start to begin.";
}


// DRAW GRAPH

function drawGraph() {

    const width = canvas.clientWidth;
    const height = canvas.clientHeight;

    const dpr = window.devicePixelRatio || 1;

    canvas.width = width * dpr;
    canvas.height = height * dpr;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const left = 45;
    const top = 20;
    const right = 15;
    const bottom = 40;

    const graphWidth = width - left - right;
    const graphHeight = height - top - bottom;

    const x = n => left + (n / 20) * graphWidth;

    const y = n => top + graphHeight - (n / 32) * graphHeight;

    ctx.clearRect(0, 0, width, height);

    // GRID

    ctx.strokeStyle = "#dddddd";
    ctx.fillStyle = "#555555";
    ctx.font = "12px Arial";

    for (let i = 0; i <= 32; i += 4) {

        ctx.beginPath();
        ctx.moveTo(left, y(i));
        ctx.lineTo(width - right, y(i));
        ctx.stroke();

        ctx.fillText(i, 15, y(i) + 4);
    }

    for (let i = 0; i <= 20; i += 2) {

        ctx.beginPath();
        ctx.moveTo(x(i), top);
        ctx.lineTo(x(i), height - bottom);
        ctx.stroke();

        ctx.fillText(i, x(i) - 4, height - 15);
    }

    // AXIS LABELS

    ctx.fillStyle = "#172033";
    ctx.textAlign = "center";

    ctx.fillText(
        "RTT",
        left + graphWidth / 2,
        height - 2
    );

    ctx.save();

    ctx.translate(12, height / 2);
    ctx.rotate(-Math.PI / 2);

    ctx.fillText("Congestion Window (MSS)", 0, 0);

    ctx.restore();

    // DRAW GROWTH LINES

    for (let i = 1; i < history.length; i++) {

        const previous = history[i - 1];
        const current = history[i];

        const color =
            current.phase === "Slow Start"
                ? "#2563eb"
                : "#16a34a";

        ctx.beginPath();

        ctx.strokeStyle = color;
        ctx.lineWidth = 3;

        ctx.moveTo(x(previous.rtt), y(previous.cwnd));
        ctx.lineTo(x(current.rtt), y(current.cwnd));

        ctx.stroke();

        ctx.beginPath();

        ctx.arc(x(current.rtt), y(current.cwnd), 4, 0, Math.PI * 2);

        ctx.fillStyle = color;
        ctx.fill();
    }
}


// BUTTON EVENTS

startBtn.addEventListener("click", startSimulation);

pauseBtn.addEventListener("click", stopSimulation);

resetBtn.addEventListener("click", resetSimulation);


// INITIAL DISPLAY

updateDisplay();
updateTable();
drawGraph();

window.addEventListener("resize", drawGraph);
