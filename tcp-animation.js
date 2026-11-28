
const $ = id => document.getElementById(id);

const tabs = [...document.querySelectorAll(".tab")];

const topics = {
  "slow-start": {
    name: "Slow Start",
    desc: "TCP begins with a small congestion window and increases it exponentially until it reaches ssthresh.",
    visual: "Exponential packet growth",
    kicker: "TCP MECHANISM 01"
  },

  "congestion-avoidance": {
    name: "Congestion Avoidance",
    desc: "After reaching ssthresh, TCP grows its congestion window slowly and linearly to reduce the risk of congestion.",
    visual: "Linear packet growth",
    kicker: "TCP MECHANISM 02"
  },

  "loss-recovery": {
    name: "Loss & Recovery",
    desc: "A packet is lost. TCP detects the loss, reduces its sending rate, and resumes transmission.",
    visual: "Packet loss and recovery",
    kicker: "TCP MECHANISM 03"
  },

  "fast-retransmit": {
    name: "Fast Retransmit",
    desc: "Three duplicate ACKs indicate a missing segment. TCP retransmits it immediately instead of waiting for a timeout.",
    visual: "Three duplicate ACKs",
    kicker: "TCP MECHANISM 04"
  },

  "fast-recovery": {
    name: "Fast Recovery",
    desc: "After triple duplicate ACKs, TCP Reno reduces its congestion window threshold, temporarily inflates cwnd, then exits recovery when a new ACK arrives.",
    visual: "Window adjustment during recovery",
    kicker: "TCP MECHANISM 05"
  },

  "timeout": {
    name: "Timeout",
    desc: "If the retransmission timer expires before an ACK arrives, TCP treats it as severe congestion and restarts with a small window.",
    visual: "Retransmission timer expiry",
    kicker: "TCP MECHANISM 06"
  }
};

let topic = "slow-start";
let rtt = 0;
let cwnd = 1;
let ssthresh = 8;
let running = false;
let timer = null;
let history = [1];
let events = [];
let speed = 1;

const chart = $("cwnd-chart");
const ctx = chart.getContext("2d");

function setText(id, value) {
  $(id).textContent = value;
}

function log(message) {
  events.unshift({ rtt, message });
  events = events.slice(0, 7);

  $("event-log").innerHTML = events.map(e =>
    `<div class="log-entry"><b>RTT ${e.rtt}</b> · ${e.message}</div>`
  ).join("");
}

function clearPackets() {
  document.querySelectorAll(".packet").forEach(p => p.remove());
}

function packet(kind = "data", delay = 0) {
  const lane = kind === "ack" ? $("ack-lane") : $("data-lane");

  const p = document.createElement("span");

  p.className =
    "packet" +
    (kind === "ack" ? " ack" :
    kind === "lost" ? " lost" :
    kind === "retransmit" ? " retransmit" : "");

  lane.appendChild(p);

  p.style.animationDuration = (1.35 * speed) + "s";
  p.style.animationDelay = delay + "ms";

  p.addEventListener("animationend", () => p.remove());
}

function send(count, mode = "normal") {
  clearPackets();

  const n = Math.max(1, Math.min(12, count));

  for (let i = 0; i < n; i++) {
    packet(
      mode === "loss" && i === Math.floor(n / 2)
        ? "lost"
        : mode === "retransmit" && i === n - 1
        ? "retransmit"
        : "data",
      i * 90
    );
  }

  if (mode !== "noack") {
    setTimeout(() => {
      if (topic !== "timeout") {
        for (let i = 0; i < Math.min(n, 6); i++) {
          packet("ack", i * 100);
        }
      }
    }, Math.max(450, 700 * speed));
  }
}

function updateMetrics() {
  setText("rtt-value", rtt);
  setText("cwnd-value", cwnd);
  setText("ssthresh-value", ssthresh);
  setText("flight-value", Math.min(cwnd, 12));
}

function drawChart() {
  const w = chart.clientWidth || 600;
  const h = 220;
  const dpr = window.devicePixelRatio || 1;

  chart.width = w * dpr;
  chart.height = h * dpr;

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, w, h);

  const pad = { l: 35, r: 12, t: 14, b: 28 };
  const gw = w - pad.l - pad.r;
  const gh = h - pad.t - pad.b;

  const max = Math.max(10, ssthresh + 3, ...history) + 2;

  ctx.font = "10px DM Mono";
  ctx.fillStyle = "#7890aa";
  ctx.strokeStyle = "#263c57";
  ctx.lineWidth = 1;

  for (let i = 0; i <= 4; i++) {
    let y = pad.t + gh * i / 4;

    ctx.beginPath();
    ctx.moveTo(pad.l, y);
    ctx.lineTo(w - pad.r, y);
    ctx.stroke();

    ctx.fillText(Math.round(max * (4 - i) / 4), 5, y + 3);
  }

  const x = i =>
    pad.l + (history.length <= 1 ? 0 : i / Math.max(8, history.length - 1)) * gw;

  const y = v => pad.t + gh - (v / max) * gh;

  ctx.setLineDash([5, 5]);
  ctx.strokeStyle = "#ffbd59";

  ctx.beginPath();
  ctx.moveTo(pad.l, y(ssthresh));
  ctx.lineTo(w - pad.r, y(ssthresh));
  ctx.stroke();

  ctx.setLineDash([]);
  ctx.strokeStyle = "#48baff";
  ctx.lineWidth = 2.5;

  ctx.beginPath();

  history.forEach((v, i) => {
    if (i) {
      ctx.lineTo(x(i), y(v));
    } else {
      ctx.moveTo(x(i), y(v));
    }
  });

  ctx.stroke();

  history.forEach((v, i) => {
    ctx.fillStyle = "#48baff";
    ctx.beginPath();
    ctx.arc(x(i), y(v), 3, 0, Math.PI * 2);
    ctx.fill();
  });

  ctx.fillStyle = "#7890aa";
  ctx.fillText("RTT", w - 32, h - 5);
}

function explain(title, message, status = "RUNNING") {
  setText("event-title", title);
  setText("explanation", message);
  setText("phase-status", status);
}

function stop() {
  running = false;
  clearInterval(timer);
  timer = null;
}

function reset() {
  stop();
  clearPackets();

  rtt = 0;
  cwnd = 1;
  ssthresh = 8;
  history = [1];
  events = [];

  $("event-log").innerHTML =
    '<div class="log-empty">Your simulation events will appear here.</div>';

  setText("topic-kicker", topics[topic].kicker);
  setText("topic-title", topics[topic].name);
  setText("topic-description", topics[topic].desc);
  setText("visual-title", topics[topic].visual);
  setText("network-note", "Press Start to begin transmission");

  explain(
    "Ready to transmit",
    "Start the animation or use Next RTT to advance one step.",
    "READY"
  );

  updateMetrics();
  drawChart();
}

function record(title, message, status) {
  history.push(cwnd);

  updateMetrics();
  drawChart();

  explain(title, message, status);
  log(message);

  setText("network-note", title);
}

function nextStep() {
  rtt++;

  let msg = "";
  let title = "";
  let status = "RUNNING";

  switch (topic) {

    case "slow-start":
      cwnd = Math.min(cwnd * 2, ssthresh);
      send(cwnd);

      title = "Exponential growth";

      msg = `RTT ${rtt}: cwnd doubles to ${cwnd} MSS. TCP can send more segments in the next round.`;

      if (cwnd >= ssthresh) {
        status = "THRESHOLD REACHED";
        msg += ` ssthresh (${ssthresh} MSS) reached; next comes Congestion Avoidance.`;
      }
      break;

    case "congestion-avoidance":
      cwnd += 1;
      send(cwnd);

      title = "Linear growth";
      msg = `RTT ${rtt}: cwnd increases by approximately 1 MSS to ${cwnd} MSS.`;
      break;

    case "loss-recovery":
      if (rtt === 3) {
        ssthresh = Math.max(2, Math.floor(cwnd / 2));
        cwnd = 1;

        send(4, "loss");

        title = "Packet loss detected";
        status = "RECOVERY";

        msg = `A segment is lost. TCP reduces ssthresh to ${ssthresh} MSS and restarts with cwnd = 1 MSS (timeout-style recovery).`;
      } else {
        cwnd = Math.min(cwnd * 2, ssthresh);
        send(cwnd);

        title = "Transmission / recovery";
        msg = `RTT ${rtt}: TCP sends ${cwnd} segment(s) while rebuilding its congestion window.`;
      }
      break;

    case "fast-retransmit":
      if (rtt === 1) {
        cwnd = 4;
        send(4);

        title = "Segments sent";
        msg = "Sender transmits several segments. One segment is assumed lost; later segments still reach the receiver.";
      } else if (rtt === 2) {
        send(3, "noack");

        title = "Duplicate ACKs";
        status = "3 DUPLICATE ACKS";

        msg = "Receiver sends three duplicate ACKs for the missing segment.";
      } else if (rtt === 3) {
        ssthresh = 2;
        cwnd = 2;

        send(1, "retransmit");

        title = "Fast retransmit";
        status = "RETRANSMITTING";

        msg = "On the third duplicate ACK, TCP immediately retransmits the missing segment; it does not wait for the retransmission timeout.";
      } else {
        cwnd++;
        send(cwnd);

        title = "ACK received";
        status = "COMPLETE";

        msg = "The retransmitted segment is acknowledged and normal transmission continues.";
      }
      break;

    case "fast-recovery":
      if (rtt === 1) {
        cwnd = 8;
        send(8);

        title = "Data in flight";
        msg = "Several segments are sent. A segment is assumed lost while later segments reach the receiver.";
      } else if (rtt === 2) {
        ssthresh = 4;
        cwnd = ssthresh + 3;

        send(3, "noack");

        title = "Enter Fast Recovery";
        status = "FAST RECOVERY";

        msg = "Three duplicate ACKs arrive. ssthresh becomes half the flight size; cwnd is temporarily inflated by 3 MSS.";
      } else if (rtt === 3) {
        cwnd = ssthresh + 1;

        send(1, "retransmit");

        title = "Additional duplicate ACK";
        status = "FAST RECOVERY";

        msg = "Another duplicate ACK arrives, so cwnd is temporarily increased by 1 MSS and transmission can continue.";
      } else {
        cwnd = ssthresh;
        send(cwnd);

        title = "Exit Fast Recovery";
        status = "CONGESTION AVOIDANCE";

        msg = "A new ACK acknowledges the retransmission. TCP deflates cwnd to ssthresh and enters Congestion Avoidance.";
      }
      break;

    case "timeout":
      if (rtt < 3) {
        cwnd = Math.min(cwnd * 2, 16);
        send(cwnd, "noack");

        title = "Waiting for ACK";
        status = "TIMER RUNNING";

        msg = `RTT ${rtt}: Data sent, but no ACK arrives. Retransmission timer is still running.`;
      } else if (rtt === 3) {
        ssthresh = Math.max(2, Math.floor(cwnd / 2));
        cwnd = 1;

        send(1, "retransmit");

        title = "Retransmission timeout";
        status = "TIMEOUT";

        msg = `Timer expires. TCP sets ssthresh to ${ssthresh} MSS, resets cwnd to 1 MSS, and retransmits.`;
      } else {
        cwnd = Math.min(cwnd * 2, ssthresh);
        send(cwnd);

        title = "Slow Start resumes";
        status = "SLOW START";

        msg = `TCP starts Slow Start again. cwnd grows to ${cwnd} MSS.`;
      }
      break;
  }

  record(title, msg, status);
}

function start() {
  if (running) return;

  running = true;
  setText("phase-status", "RUNNING");

  if (rtt === 0) {
    send(topic === "slow-start" ? 1 : 2);
    setText("network-note", "Data segments travelling to receiver");
  }

  timer = setInterval(nextStep, Math.max(900, 2200 * speed));
}

function selectTopic(key) {
  topic = key;

  tabs.forEach(tab => {
    tab.classList.toggle("active", tab.dataset.topic === key);
  });

  reset();
}

tabs.forEach(tab => {
  tab.addEventListener("click", () => {
    selectTopic(tab.dataset.topic);
  });
});

$("start-btn").addEventListener("click", start);

$("pause-btn").addEventListener("click", () => {
  stop();
  setText("phase-status", "PAUSED");
});

$("step-btn").addEventListener("click", () => {
  stop();
  nextStep();
});

$("reset-btn").addEventListener("click", reset);

$("speed-select").addEventListener("change", e => {
  speed = Number(e.target.value);

  if (running) {
    stop();
    start();
  }
});

window.addEventListener("resize", drawChart);

reset();
