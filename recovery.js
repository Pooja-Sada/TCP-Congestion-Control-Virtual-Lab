// TCP FAST RECOVERY AND TIMEOUT SIMULATOR
// TCP Reno congestion control demonstration

const initialCwnd = 16;
const initialSsthresh = 16;

let cwnd = initialCwnd;
let ssthresh = initialSsthresh;
let duplicateAcks = 0;
let tcpState = "Congestion Avoidance";
let inFastRecovery = false;

let history = [cwnd];
let historyLabels = ["Start"];

// HTML elements
const cwndElement = document.getElementById("cwnd");
const ssthreshElement = document.getElementById("ssthresh");
const duplicateElement = document.getElementById("duplicateAcks");
const ackCountElement = document.getElementById("ackCount");
const tcpStateElement = document.getElementById("tcpState");
const stateDescription = document.getElementById("stateDescription");
const ackProgress = document.getElementById("ackProgress");
const eventLog = document.getElementById("eventLog");

const duplicateBtn = document.getElementById("duplicateBtn");
const newAckBtn = document.getElementById("newAckBtn");
const timeoutBtn = document.getElementById("timeoutBtn");
const resetBtn = document.getElementById("resetBtn");

// Create a Slow Start / Congestion Avoidance ACK button.
const slowStartBtn = document.createElement("button");
slowStartBtn.id = "slowStartBtn";
slowStartBtn.className = "btn btn-secondary";
slowStartBtn.textContent = "Receive ACK (Increase cwnd)";
slowStartBtn.disabled = true;
timeoutBtn.insertAdjacentElement("afterend", slowStartBtn);

// Update the dashboard
function updateDashboard() {
    cwndElement.textContent = cwnd + " MSS";
    ssthreshElement.textContent = ssthresh + " MSS";

    duplicateElement.textContent = duplicateAcks + " / 3";
    ackCountElement.textContent = duplicateAcks + " / 3";

    tcpStateElement.textContent = tcpState;

    ackProgress.style.width =
        Math.min(duplicateAcks / 3, 1) * 100 + "%";

    if (tcpState === "Fast Recovery") {
        stateDescription.textContent =
            "Three duplicate ACKs detected. TCP is retransmitting the lost packet.";
        tcpStateElement.style.color = "#2563eb";
    } else if (tcpState === "Slow Start") {
        stateDescription.textContent =
            "After timeout, TCP starts again with a small congestion window.";
        tcpStateElement.style.color = "#dc2626";
    } else {
        stateDescription.textContent =
            "TCP is increasing its congestion window gradually.";
        tcpStateElement.style.color = "#16a34a";
    }

    duplicateBtn.disabled = inFastRecovery;
    newAckBtn.disabled = !inFastRecovery;
    slowStartBtn.disabled = tcpState === "Fast Recovery";
}

// Add an event to the log
function addLog(message, type = "normal") {
    const entry = document.createElement("p");
    entry.className = "log-entry";

    if (type === "fast") {
        entry.style.borderLeft = "4px solid #2563eb";
    } else if (type === "timeout") {
        entry.style.borderLeft = "4px solid #dc2626";
    } else {
        entry.style.borderLeft = "4px solid #16a34a";
    }

    entry.textContent = new Date().toLocaleTimeString() + " - " + message;

    eventLog.prepend(entry);
}

// Save congestion window history
function saveHistory(label) {
    history.push(cwnd);
    historyLabels.push(label);

    drawChart();
}

// Draw the congestion window chart without an external library
function drawChart() {
    const canvas = document.getElementById("cwndChart");
    const ctx = canvas.getContext("2d");

    const rect = canvas.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const ratio = window.devicePixelRatio || 1;

    canvas.width = width * ratio;
    canvas.height = height * ratio;

    ctx.scale(ratio, ratio);
    ctx.clearRect(0, 0, width, height);

    const left = 42;
    const right = 15;
    const top = 15;
    const bottom = 40;

    const chartWidth = width - left - right;
    const chartHeight = height - top - bottom;

    const maxValue = Math.max(20, ...history) + 2;
    const count = history.length;

    // Draw horizontal grid lines and labels
    ctx.font = "11px Arial";
    ctx.fillStyle = "#91a8c6";
    ctx.strokeStyle = "#28415e";
    ctx.lineWidth = 1;

    for (let i = 0; i <= 4; i++) {
        const value = Math.round(maxValue * i / 4);
        const y = top + chartHeight - (value / maxValue) * chartHeight;

        ctx.beginPath();
        ctx.moveTo(left, y);
        ctx.lineTo(width - right, y);
        ctx.stroke();

        ctx.fillText(value, 5, y + 4);
    }

    if (count === 0) return;

    const points = history.map((value, index) => ({
        x: count === 1
            ? left
            : left + (index / (count - 1)) * chartWidth,
        y: top + chartHeight - (value / maxValue) * chartHeight
    }));

    // Draw the congestion window line
    ctx.beginPath();
    ctx.strokeStyle = "#70b8ff";
    ctx.lineWidth = 3;

    points.forEach((point, index) => {
        if (index === 0) {
            ctx.moveTo(point.x, point.y);
        } else {
            ctx.lineTo(point.x, point.y);
        }
    });

    ctx.stroke();

    // Draw points
    points.forEach(point => {
        ctx.beginPath();
        ctx.arc(point.x, point.y, 4, 0, Math.PI * 2);
        ctx.fillStyle = "#70b8ff";
        ctx.fill();
    });

    ctx.fillStyle = "#64748b";
    ctx.textAlign = "center";
    ctx.fillText("Simulation Events", width / 2, height - 8);
    ctx.textAlign = "left";
}

// Simulate duplicate ACKs
duplicateBtn.addEventListener("click", function () {
    if (inFastRecovery) return;

    duplicateAcks++;

    addLog("Duplicate ACK " + duplicateAcks + " received.");

    if (duplicateAcks === 3) {
        startFastRecovery();
    } else {
        updateDashboard();
    }
});

// Start Fast Recovery after three duplicate ACKs
function startFastRecovery() {
    const previousCwnd = cwnd;

    ssthresh = Math.max(2, Math.floor(previousCwnd / 2));

    // TCP Reno: inflate cwnd by 3 MSS
    cwnd = ssthresh + 3;

    tcpState = "Fast Recovery";
    inFastRecovery = true;

    addLog(
        "Three duplicate ACKs detected. Fast Retransmit triggered.",
        "fast"
    );

    addLog(
        "ssthresh reduced to " + ssthresh + " MSS and cwnd set to " +
        cwnd + " MSS (ssthresh + 3).",
        "fast"
    );

    saveHistory("Fast Recovery");
    updateDashboard();
}

// Receive a new ACK after Fast Recovery
newAckBtn.addEventListener("click", function () {
    if (!inFastRecovery) return;

    cwnd = ssthresh;
    duplicateAcks = 0;
    inFastRecovery = false;

    tcpState = "Congestion Avoidance";

    addLog(
        "New ACK received. Fast Recovery ends.",
        "fast"
    );

    addLog(
        "cwnd set to ssthresh (" + cwnd +
        " MSS). TCP enters Congestion Avoidance."
    );

    saveHistory("Recovery Complete");
    updateDashboard();
});

// Simulate a retransmission timeout
timeoutBtn.addEventListener("click", function () {
    const previousCwnd = cwnd;

    ssthresh = Math.max(2, Math.floor(previousCwnd / 2));
    cwnd = 1;

    duplicateAcks = 0;
    inFastRecovery = false;

    tcpState = "Slow Start";

    addLog(
        "TIMEOUT! No acknowledgement received before the timer expired.",
        "timeout"
    );

    addLog(
        "ssthresh reduced from " + previousCwnd +
        " MSS to " + ssthresh + " MSS.",
        "timeout"
    );

    addLog(
        "cwnd reset to 1 MSS. TCP returns to Slow Start.",
        "timeout"
    );

    saveHistory("Timeout");
    updateDashboard();
});

// Increase cwnd after receiving a new ACK
slowStartBtn.addEventListener("click", function () {
    if (tcpState === "Fast Recovery") return;

    if (tcpState === "Slow Start") {
        // Slow Start: exponential growth
        cwnd = cwnd * 2;

        if (cwnd >= ssthresh) {
            cwnd = ssthresh;
            tcpState = "Congestion Avoidance";

            addLog(
                "ssthresh reached. TCP transitions from Slow Start to Congestion Avoidance."
            );
        } else {
            addLog(
                "ACK received. Slow Start increases cwnd to " + cwnd + " MSS."
            );
        }
    } else {
        // Congestion Avoidance: additive growth
        cwnd += 1;

        addLog(
            "ACK received. Congestion Avoidance increases cwnd to " +
            cwnd + " MSS."
        );
    }

    saveHistory("ACK");
    updateDashboard();
});

// Reset the simulation
resetBtn.addEventListener("click", function () {
    cwnd = initialCwnd;
    ssthresh = initialSsthresh;
    duplicateAcks = 0;
    tcpState = "Congestion Avoidance";
    inFastRecovery = false;

    history = [cwnd];
    historyLabels = ["Start"];

    eventLog.innerHTML = "";

    addLog("Simulation reset. Initial TCP state restored.");

    updateDashboard();
    drawChart();
});

// Handle screen resizing
window.addEventListener("resize", drawChart);

// Initial setup
updateDashboard();
drawChart();
addLog("TCP Reno simulation initialized. Initial cwnd = 16 MSS.");
