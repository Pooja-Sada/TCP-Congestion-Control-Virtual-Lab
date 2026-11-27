
const tabs = document.querySelectorAll(".tab");
const title = document.getElementById("topic-title");
const description = document.getElementById("topic-description");
const explanation = document.getElementById("explanation");
const status = document.getElementById("phase-status");
const track = document.getElementById("packet-track");

const startBtn = document.getElementById("start-btn");
const pauseBtn = document.getElementById("pause-btn");
const resetBtn = document.getElementById("reset-btn");

const topics = {
    "slow-start": {
        title: "Slow Start",
        description: "TCP increases its congestion window exponentially during Slow Start.",
        initial: "Start with a congestion window of 1 MSS.",
        explain: "Slow Start: cwnd doubles approximately every RTT.",
        status: "SLOW START"
    },

    "congestion-avoidance": {
        title: "Congestion Avoidance",
        description: "TCP increases its congestion window linearly to avoid overloading the network.",
        initial: "The congestion window grows gradually.",
        explain: "Congestion Avoidance: cwnd increases by approximately 1 MSS per RTT.",
        status: "CONGESTION AVOIDANCE"
    },

    "loss-recovery": {
        title: "Loss & Recovery",
        description: "Observe how TCP reacts when packet loss occurs.",
        initial: "Packets are transmitted normally until packet loss is detected.",
        explain: "Packet loss detected! TCP reduces its congestion window and recovers.",
        status: "LOSS & RECOVERY"
    },

    "fast-retransmit": {
        title: "Fast Retransmit",
        description: "TCP retransmits a lost packet after receiving three duplicate ACKs.",
        initial: "The sender transmits packets and waits for acknowledgements.",
        explain: "Three duplicate ACKs received! TCP retransmits the missing packet without waiting for a timeout.",
        status: "FAST RETRANSMIT"
    },

    "fast-recovery": {
        title: "Fast Recovery",
        description: "TCP temporarily adjusts its congestion window after detecting packet loss through duplicate ACKs.",
        initial: "TCP is operating normally before loss is detected.",
        explain: "TCP enters Fast Recovery, adjusts cwnd, and continues transmission.",
        status: "FAST RECOVERY"
    },

    "timeout": {
        title: "Timeout",
        description: "When an ACK does not arrive before the retransmission timer expires, TCP performs a timeout response.",
        initial: "TCP sends packets and waits for acknowledgements.",
        explain: "Timeout occurred! TCP resets cwnd to 1 MSS and returns to Slow Start.",
        status: "TIMEOUT"
    }
};

let currentTopic = "slow-start";
let cwnd = 1;
let round = 0;
let running = false;
let simulationTimer = null;
let movementTimer = null;
let packets = [];

function clearPackets() {
    packets.forEach(packet => packet.element.remove());
    packets = [];
}

function resetSimulation() {
    stopAnimation();
    clearPackets();

    cwnd = 1;
    round = 0;

    const topic = topics[currentTopic];

    title.textContent = topic.title;
    description.textContent = topic.description;
    explanation.textContent = topic.initial;
    status.textContent = "READY";
}

function stopAnimation() {
    running = false;

    clearInterval(simulationTimer);
    clearInterval(movementTimer);

    simulationTimer = null;
    movementTimer = null;
}

function createPacket(color = "#42c8ff", label = "Data packet") {
    const packet = document.createElement("div");

    packet.className = "packet";
    packet.style.background = color;
    packet.style.boxShadow = `0 0 12px ${color}`;
    packet.title = label;

    track.appendChild(packet);

    packets.push({
        element: packet,
        position: 0
    });
}

function sendPackets(count) {
    // Keep the display readable.
    const visibleCount = Math.min(count, 8);

    for (let i = 0; i < visibleCount; i++) {
        setTimeout(() => {
            if (running) {
                createPacket();
            }
        }, i * 130);
    }
}

function movePackets() {
    packets.forEach((packet, index) => {
        packet.position += 1.5;
        packet.element.style.left = packet.position + "%";

        if (packet.position >= 100) {
            packet.element.remove();
            packets.splice(index, 1);
        }
    });
}

function updateSimulation() {
    round++;

    let message = "";
    let color = "#42c8ff";

    switch (currentTopic) {

        case "slow-start":
            cwnd = Math.min(cwnd * 2, 16);

            message = `RTT ${round}: Congestion window grows exponentially. Current cwnd = ${cwnd} MSS.`;
            break;

        case "congestion-avoidance":
            cwnd += 1;

            message = `RTT ${round}: Congestion window increases linearly by 1 MSS. Current cwnd = ${cwnd} MSS.`;
            break;

        case "loss-recovery":
            if (round % 4 === 0) {
                cwnd = Math.max(2, Math.floor(cwnd / 2));
                color = "#ff6464";

                message = `Packet loss detected! TCP reduces its congestion window. New cwnd = ${cwnd} MSS.`;
                status.textContent = "PACKET LOSS DETECTED";
            } else {
                cwnd += 1;

                message = `RTT ${round}: Packets are transmitted. Current cwnd = ${cwnd} MSS.`;
            }
            break;

        case "fast-retransmit":
            if (round === 3) {
                color = "#ffbd59";
                cwnd = Math.max(2, Math.floor(cwnd / 2));

                message = "Three duplicate ACKs received! The sender immediately retransmits the missing packet.";
                status.textContent = "RETRANSMITTING";
            } else {
                cwnd += 1;

                message = `RTT ${round}: Sender transmits data and receives acknowledgements.`;
            }
            break;

        case "fast-recovery":
            if (round === 3) {
                cwnd = 5;
                color = "#ffbd59";

                message = "Three duplicate ACKs received! TCP enters Fast Recovery and temporarily inflates cwnd.";
                status.textContent = "FAST RECOVERY";
            } else if (round === 4) {
                cwnd = 2;

                message = "New ACK received! TCP exits Fast Recovery and continues with Congestion Avoidance.";
                status.textContent = "CONGESTION AVOIDANCE";
            } else {
                cwnd += 1;

                message = `RTT ${round}: Data transmission continues. Current cwnd = ${cwnd} MSS.`;
            }
            break;

        case "timeout":
            if (round === 4) {
                cwnd = 1;
                color = "#ff6464";

                message = "Retransmission timer expired! TCP resets cwnd to 1 MSS and enters Slow Start.";
                status.textContent = "TIMEOUT OCCURRED";
            } else {
                cwnd = Math.min(cwnd * 2, 16);

                message = `RTT ${round}: Data is transmitted. TCP is waiting for acknowledgements.`;
            }
            break;
    }

    explanation.textContent = message;
    sendPackets(cwnd);

    if (
        currentTopic === "slow-start" ||
        currentTopic === "congestion-avoidance"
    ) {
        status.textContent = topics[currentTopic].status;
    }

    if (
        currentTopic === "loss-recovery" ||
        currentTopic === "fast-retransmit" ||
        currentTopic === "fast-recovery" ||
        currentTopic === "timeout"
    ) {
        if (color !== "#42c8ff") {
            createPacket(color, "Retransmitted or recovery packet");
        }
    }
}

function startAnimation() {
    if (running) return;

    running = true;
    status.textContent = "RUNNING";

    if (round === 0) {
        sendPackets(1);
    }

    simulationTimer = setInterval(updateSimulation, 2000);
    movementTimer = setInterval(movePackets, 30);
}

function selectTopic(topic) {
    if (!topics[topic]) return;

    currentTopic = topic;

    tabs.forEach(tab => {
        tab.classList.toggle(
            "active",
            tab.dataset.topic === topic
        );
    });

    resetSimulation();
}

tabs.forEach(tab => {
    tab.addEventListener("click", () => {
        selectTopic(tab.dataset.topic);
    });
});

startBtn.addEventListener("click", startAnimation);

pauseBtn.addEventListener("click", () => {
    stopAnimation();
    status.textContent = "PAUSED";
});

resetBtn.addEventListener("click", resetSimulation);

resetSimulation();
