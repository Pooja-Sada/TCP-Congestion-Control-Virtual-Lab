const startBtn = document.getElementById("startSimulation");
const lossBtn = document.getElementById("simulateLoss");
const resetBtn = document.getElementById("resetSimulation");

const packetContainer = document.getElementById("packetContainer");
const ackContainer = document.getElementById("ackContainer");
const duplicateAckCount = document.getElementById("duplicateAckCount");

const retransmitStatus = document.getElementById("retransmitStatus");
const simulationStatus = document.getElementById("simulationStatus");

const cwndInput = document.getElementById("initialCwnd");
const ssthreshInput = document.getElementById("initialSsthresh");
const lostPacketInput = document.getElementById("lostPacket");

const cwndValue = document.getElementById("cwndValue");
const ssthreshValue = document.getElementById("ssthreshValue");
const tcpPhase = document.getElementById("tcpPhase");

const eventLog = document.getElementById("eventLog");

let cwnd = 8;
let ssthresh = 16;
let lostPacket = 2;
let duplicateACKs = 0;

let simulationStarted = false;
let simulationRunning = false;
let simulationCompleted = false;

let chartData = [];
let chartLabels = [];
let congestionChart = null;

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function updateMetrics() {
    cwndValue.textContent = cwnd;
    ssthreshValue.textContent = ssthresh;
}

function addLog(message) {
    const entry = document.createElement("div");

    entry.className = "log-entry";
    entry.textContent = message;

    eventLog.appendChild(entry);
    eventLog.scrollTop = eventLog.scrollHeight;
}

function updateChart(label) {
    chartLabels.push(label);
    chartData.push(cwnd);

    drawChart();
}

function drawChart() {
    const canvas = document.getElementById("congestionChart");

    if (!canvas) return;

    const ctx = canvas.getContext("2d");

    const rect = canvas.getBoundingClientRect();

    const width = rect.width;
    const height = rect.height;

    const dpr = window.devicePixelRatio || 1;

    canvas.width = width * dpr;
    canvas.height = height * dpr;

    ctx.scale(dpr, dpr);

    ctx.clearRect(0, 0, width, height);

    const left = 48;
    const right = 15;
    const top = 20;
    const bottom = 45;

    const graphWidth = width - left - right;
    const graphHeight = height - top - bottom;

    const maxValue = Math.max(20, ...chartData, ssthresh + 3);

    ctx.font = "12px Arial";
    ctx.fillStyle = "#475569";
    ctx.strokeStyle = "#cbd5e1";
    ctx.lineWidth = 1;

    for (let i = 0; i <= 4; i++) {
        const y = top + graphHeight - (i / 4) * graphHeight;

        ctx.beginPath();
        ctx.moveTo(left, y);
        ctx.lineTo(width - right, y);
        ctx.stroke();

        ctx.fillText(
            Math.round((i / 4) * maxValue),
            8,
            y + 4
        );
    }

    ctx.fillStyle = "#475569";
    ctx.fillText("Transmission Events", width / 2 - 55, height - 8);

    if (chartData.length === 0) return;

    const xPosition = index => {
        if (chartData.length === 1) return left;

        return left + (index / (chartData.length - 1)) * graphWidth;
    };

    const yPosition = value => {
        return top + graphHeight - (value / maxValue) * graphHeight;
    };

    ctx.strokeStyle = "#dc6b36";
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    ctx.moveTo(left, yPosition(ssthresh));
    ctx.lineTo(width - right, yPosition(ssthresh));
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.strokeStyle = "#2563eb";
    ctx.lineWidth = 3;
    ctx.beginPath();

    chartData.forEach((value, index) => {
        const x = xPosition(index);
        const y = yPosition(value);

        if (index === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
    });

    ctx.stroke();

    chartData.forEach((value, index) => {
        const x = xPosition(index);
        const y = yPosition(value);

        ctx.beginPath();
        ctx.arc(x, y, 4, 0, Math.PI * 2);
        ctx.fillStyle = "#2563eb";
        ctx.fill();
    });

    ctx.fillStyle = "#475569";

    chartLabels.forEach((label, index) => {
        ctx.fillText(
            label,
            xPosition(index) - 12,
            height - 25
        );
    });
}

function initializeSimulation() {
    cwnd = Number(cwndInput.value);
    ssthresh = Number(ssthreshInput.value);
    lostPacket = Number(lostPacketInput.value);

    if (
        !Number.isInteger(cwnd) ||
        !Number.isInteger(ssthresh) ||
        cwnd < 4 ||
        cwnd > 20 ||
        ssthresh < 2 ||
        ssthresh > 100
    ) {
        simulationStatus.textContent = "Enter valid congestion window and threshold values.";
        return false;
    }

    if (lostPacket > cwnd) {
        simulationStatus.textContent = "Selected packet must be within the congestion window.";
        return false;
    }

    duplicateACKs = 0;
    simulationCompleted = false;

    packetContainer.innerHTML = "";
    ackContainer.innerHTML = "";
    eventLog.innerHTML = "";

    duplicateAckCount.textContent = "0";

    retransmitStatus.innerHTML =
        "<p>Waiting for three duplicate ACKs...</p>";

    tcpPhase.textContent = "Slow Start";

    updateMetrics();

    chartData = [];
    chartLabels = [];

    updateChart("Start");

    simulationStarted = true;

    addLog("Simulation initialized.");
    addLog("Initial cwnd = " + cwnd + " MSS.");
    addLog("Initial ssthresh = " + ssthresh + " MSS.");
    addLog("Selected packet for loss: " + lostPacket + ".");

    return true;
}

function createPackets() {
    packetContainer.innerHTML = "";

    for (let i = 1; i <= cwnd; i++) {
        const packet = document.createElement("div");

        packet.className = "packet";
        packet.id = "packet-" + i;

        packet.innerHTML = `
            <span>P${i}</span>
            <small>Sent</small>
        `;

        packetContainer.appendChild(packet);
    }
}

async function startSimulation() {
    if (simulationRunning) return;

    if (!initializeSimulation()) return;

    simulationRunning = true;

    simulationStatus.textContent = "Transmitting packets...";

    createPackets();

    for (let i = 1; i <= cwnd; i++) {
        await delay(250);

        addLog("Packet " + i + " sent from sender.");

    }

    simulationStatus.textContent =
        "Packets transmitted. Ready to simulate packet loss.";

    addLog("Initial packet transmission completed.");

    simulationRunning = false;
}

async function simulatePacketLoss() {
    if (simulationRunning || simulationCompleted) return;

    if (!simulationStarted) {
        simulationStatus.textContent =
            "Click Start Simulation first.";
        return;
    }

    simulationRunning = true;

    simulationStatus.textContent =
        "Packet " + lostPacket + " is lost!";

    const lostElement = document.getElementById(
        "packet-" + lostPacket
    );

    if (lostElement) {
        lostElement.classList.add("lost");
        lostElement.innerHTML =
            `<span>P${lostPacket}</span><small>LOST</small>`;
    }

    addLog("Packet " + lostPacket + " lost during transmission.");

    const expectedACK = lostPacket;

    for (let i = 1; i <= 3; i++) {
        await delay(1000);

        duplicateACKs++;

        duplicateAckCount.textContent = duplicateACKs;

        const ack = document.createElement("div");

        ack.className = "ack-event";

        ack.textContent =
            "Duplicate ACK " + i +
            " received: ACK " + expectedACK;

        ackContainer.appendChild(ack);

        addLog(
            "Duplicate ACK " + i +
            " received. Receiver expects packet " +
            expectedACK + "."
        );

        simulationStatus.textContent =
            duplicateACKs + " of 3 duplicate ACKs received.";
    }

    await delay(700);

    addLog("Three duplicate ACKs received.");

    fastRetransmit();

    await delay(1500);

    const packet = document.getElementById(
        "packet-" + lostPacket
    );

    if (packet) {
        packet.classList.remove("lost");
        packet.classList.add("retransmitted");

        packet.innerHTML =
            `<span>P${lostPacket}</span><small>RE-SENT</small>`;
    }

    addLog(
        "Packet " + lostPacket +
        " successfully retransmitted and acknowledged."
    );

    cwnd = ssthresh;

    tcpPhase.textContent = "Congestion Avoidance";

    updateMetrics();
    updateChart("Recovery");

    retransmitStatus.innerHTML = `
        <div class="retransmit-event">
            <h3>Fast Retransmit Successful!</h3>
            <p>Lost Packet: ${lostPacket}</p>
            <p>Three Duplicate ACKs received.</p>
            <p>Packet ${lostPacket} retransmitted successfully.</p>
            <p>TCP Reno entered Congestion Avoidance.</p>
            <p>Updated cwnd: ${cwnd} MSS</p>
            <p>Updated ssthresh: ${ssthresh} MSS</p>
        </div>
    `;

    simulationStatus.textContent =
        "Simulation completed successfully.";

    simulationCompleted = true;
    simulationRunning = false;
}

function fastRetransmit() {
    ssthresh = Math.max(2, Math.floor(cwnd / 2));

    cwnd = ssthresh + 3;

    tcpPhase.textContent = "Fast Recovery";

    updateMetrics();
    updateChart("Fast Recovery");

    retransmitStatus.innerHTML = `
        <div class="retransmit-event">
            <h3>Fast Retransmit Triggered!</h3>
            <p>Three duplicate ACKs detected.</p>
            <p>ssthresh = ${ssthresh} MSS</p>
            <p>cwnd = ssthresh + 3 = ${cwnd} MSS</p>
            <p>Retransmitting packet ${lostPacket}...</p>
        </div>
    `;

    addLog("FAST RETRANSMIT triggered.");
    addLog("ssthresh reduced to " + ssthresh + " MSS.");
    addLog("cwnd temporarily increased to " + cwnd + " MSS.");
    addLog("TCP Reno entered Fast Recovery.");
}

function resetSimulation() {
    simulationRunning = false;
    simulationStarted = false;
    simulationCompleted = false;

    duplicateACKs = 0;

    cwnd = Number(cwndInput.value) || 8;
    ssthresh = Number(ssthreshInput.value) || 16;
    lostPacket = Number(lostPacketInput.value) || 2;

    packetContainer.innerHTML =
        "<p>Packets will appear here when the simulation starts.</p>";

    ackContainer.innerHTML =
        "<p>No duplicate ACKs received yet.</p>";

    duplicateAckCount.textContent = "0";

    retransmitStatus.innerHTML =
        "<p>Waiting for three duplicate ACKs...</p>";

    simulationStatus.textContent =
        "Ready to start the simulation.";

    tcpPhase.textContent = "Slow Start";

    updateMetrics();

    chartData = [];
    chartLabels = [];

    drawChart();

    eventLog.innerHTML =
        "<p>Simulation events will appear here.</p>";
}

startBtn.addEventListener("click", startSimulation);

lossBtn.addEventListener("click", simulatePacketLoss);

resetBtn.addEventListener("click", resetSimulation);

window.addEventListener("resize", drawChart);

updateMetrics();
drawChart();