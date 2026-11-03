(() => {
  "use strict";

  const $ = id => document.getElementById(id);
  const canvas = $("ca-graph");
  const ctx = canvas.getContext("2d");

  const els = {
    rtt:$("ca-rtt"), cwnd:$("ca-cwnd"), threshold:$("ca-threshold"), phase:$("ca-phase"),
    phaseDetail:$("ca-phase-detail"), status:$("ca-status"), statusSub:$("ca-status-sub"),
    statusDot:$("ca-status-dot"), table:$("ca-table-body"), log:$("ca-event-log"),
    eventCount:$("ca-event-count"), note:$("ca-chart-note"), tooltip:$("ca-tooltip"),
    thresholdInput:$("ca-ssthresh"), thresholdOutput:$("ca-ssthresh-value"),
    speed:$("ca-speed"), speedOutput:$("ca-speed-value"), maxRtt:$("ca-max-rtt"),
    maxRttOutput:$("ca-max-rtt-value"), start:$("ca-start"), pause:$("ca-pause"),
    reset:$("ca-reset"), loss:$("ca-loss"), export:$("ca-export")
  };

  const state = {
    rtt:0, cwnd:1, ssthresh:8, initialThreshold:8,
    phase:"Slow Start", running:false, timer:null,
    interval:1000, maxRtt:30,
    history:[{rtt:0,cwnd:1,ssthresh:8,phase:"Slow Start",event:"Initial state"}],
    events:[], lossMarkers:[], hoverPoint:null
  };

  const COLORS = {
    slow:"#49a6ff", avoid:"#35d39a",
    threshold:"#f4bd55", loss:"#ff6b75",
    grid:"#20354d", text:"#8299b4"
  };

  function logEvent(type,title,detail) {
    const time = `RTT ${state.rtt}`;
    state.events.unshift({type,title,detail,time});
    if(state.events.length>30) state.events.pop();
    renderLog();
  }

  function renderLog() {
    els.eventCount.textContent =
      `${state.events.length} event${state.events.length===1?"":"s"}`;

    if(!state.events.length) {
      els.log.innerHTML =
        '<div class="empty-log">No events yet. Start the simulation to observe TCP behavior.</div>';
      return;
    }

    els.log.innerHTML = state.events.map(e =>
      `<div class="log-entry ${e.type}">
        <span class="log-time">${e.time}</span>
        <div><strong>${escapeHTML(e.title)}</strong><br>
        ${escapeHTML(e.detail)}</div>
      </div>`
    ).join("");
  }

  function escapeHTML(s) {
    return String(s).replace(/[&<>"']/g,c=>({
      "&":"&amp;","<":"&lt;",">":"&gt;",
      '"':"&quot;","'":"&#39;"
    }[c]));
  }

  function updateUI() {
    els.rtt.innerHTML = `${state.rtt} <small>RTTs</small>`;
    els.cwnd.innerHTML = `${state.cwnd.toFixed(2)} <small>MSS</small>`;
    els.threshold.innerHTML = `${state.ssthresh.toFixed(2)} <small>MSS</small>`;

    els.phase.textContent = state.phase;

    els.phaseDetail.textContent =
      state.phase==="Slow Start" ? "Exponential growth" :
      state.phase==="Congestion Avoidance" ? "Linear additive increase" :
      "Multiplicative decrease";

    $("ca-step-slow").classList.toggle("active",state.phase==="Slow Start");
    $("ca-step-avoid").classList.toggle("active",state.phase==="Congestion Avoidance");
    $("ca-step-loss").classList.toggle("active",state.phase==="Congestion Response");

    els.start.disabled = state.running || state.rtt>=state.maxRtt;
    els.pause.disabled = !state.running;
    els.loss.disabled = state.rtt===0 || state.rtt>=state.maxRtt;

    els.note.textContent = state.rtt===0 ?
      "Waiting for simulation…" :
      `${state.history.length-1} RTT observations · ${state.phase}`;
  }

  function setStatus(title,sub,mode="") {
    els.status.textContent=title;
    els.statusSub.textContent=sub;
    els.statusDot.className="status-indicator"+(mode?" "+mode:"");
  }

  function updateTable() {
    if(!state.history.length) return;

    els.table.innerHTML=state.history.slice().reverse().map(h =>
      `<tr>
        <td>${h.rtt}</td>
        <td>${h.cwnd.toFixed(2)}</td>
        <td>${h.ssthresh.toFixed(2)}</td>
        <td>${escapeHTML(h.phase)}</td>
        <td>${escapeHTML(h.event)}</td>
      </tr>`
    ).join("");
  }

  function record(event="") {
    state.history.push({
      rtt:state.rtt,
      cwnd:state.cwnd,
      ssthresh:state.ssthresh,
      phase:state.phase,
      event
    });

    updateUI();
    updateTable();
    drawGraph();
  }

  function explain(text) {
    $("ca-explanation").textContent=text;
  }

  function tick() {
    if(state.rtt>=state.maxRtt) {
      pause();
      setStatus("Experiment completed",`Recorded ${state.rtt} RTT rounds.`);
      return;
    }

    state.rtt++;
    let event="";

    if(state.cwnd < state.ssthresh - 1e-8) {
      const old=state.cwnd;
      state.cwnd=Math.min(state.cwnd*2,state.ssthresh);
      state.phase="Slow Start";
      event="Exponential increase";

      if(old < state.ssthresh && state.cwnd >= state.ssthresh-1e-8) {
        state.phase="Congestion Avoidance";
        event="ssthresh reached";

        logEvent("phase","Threshold reached",
          `cwnd reached ${state.ssthresh.toFixed(2)} MSS. TCP switches to linear growth.`);

        explain("The congestion window has reached ssthresh. TCP leaves Slow Start and enters Congestion Avoidance, increasing cwnd by approximately 1 MSS per RTT.");
      }
    } else {
      state.phase="Congestion Avoidance";
      state.cwnd += 1;
      event="Additive increase";
    }

    record(event);

    if(state.phase==="Slow Start") {
      setStatus("Slow Start active","cwnd is increasing exponentially.","running");
    } else {
      setStatus("Congestion Avoidance active","cwnd is increasing by approximately 1 MSS per RTT.","running");
    }

    if(state.rtt>=state.maxRtt) {
      pause();
      setStatus("Experiment completed",`Recorded ${state.rtt} RTT rounds.`);
    }
  }

  function start() {
    if(state.running || state.rtt>=state.maxRtt) return;

    state.running=true;
    updateUI();
    setStatus("Simulation running","Advancing one transmission round at a time.","running");

    state.timer=setInterval(tick,state.interval);

    if(state.rtt===0) {
      logEvent("phase","Transmission started",
        "Initial cwnd = 1 MSS. TCP begins in Slow Start.");
    }
  }

  function pause() {
    if(state.timer) clearInterval(state.timer);

    state.timer=null;
    state.running=false;
    updateUI();

    if(state.rtt>0 && state.rtt<state.maxRtt) {
      setStatus("Simulation paused","Press Resume to continue from the current RTT.");
    }
  }

  function reset() {
    pause();

    state.rtt=0;
    state.cwnd=1;
    state.ssthresh=Number(els.thresholdInput.value);
    state.initialThreshold=state.ssthresh;
    state.phase="Slow Start";

    state.history=[{
      rtt:0,cwnd:1,ssthresh:state.ssthresh,
      phase:state.phase,event:"Initial state"
    }];

    state.events=[];
    state.lossMarkers=[];
    state.hoverPoint=null;

    explain("In Slow Start, cwnd grows exponentially. When cwnd reaches ssthresh, TCP enters Congestion Avoidance, where cwnd increases approximately one MSS per RTT.");

    renderLog();
    updateTable();
    updateUI();
    drawGraph();

    setStatus("Ready to run","Press Start to begin the experiment.");
  }

  function triggerLoss() {
    if(state.rtt===0 || state.rtt>=state.maxRtt) return;

    pause();

    const before=state.cwnd;
    state.ssthresh=Math.max(2,Math.floor(before/2));
    state.cwnd=state.ssthresh;
    state.phase="Congestion Response";

    state.lossMarkers.push({
      rtt:state.rtt,cwnd:state.cwnd
    });

    logEvent("loss","Packet loss detected",
      `cwnd ${before.toFixed(2)} → ${state.cwnd.toFixed(2)} MSS; ssthresh set to half the previous cwnd (${state.ssthresh.toFixed(2)} MSS).`);

    explain("A packet loss is treated as a congestion signal. In this simplified TCP Reno-style model, ssthresh is set to half the previous cwnd and cwnd is reduced multiplicatively. TCP then continues with Congestion Avoidance.");

    record("Packet loss: multiplicative decrease");

    state.phase="Congestion Avoidance";
    updateUI();

    setStatus("Congestion response applied",
      "cwnd and ssthresh were reduced; press Resume to continue.");
  }

  function drawGraph() {
    const rect=canvas.getBoundingClientRect();
    const dpr=window.devicePixelRatio||1;

    if(!rect.width || !rect.height) return;

    canvas.width=Math.round(rect.width*dpr);
    canvas.height=Math.round(rect.height*dpr);

    ctx.setTransform(dpr,0,0,dpr,0,0);

    const w=rect.width,h=rect.height;
    const pad={l:58,r:22,t:24,b:46};
    const gw=w-pad.l-pad.r;
    const gh=h-pad.t-pad.b;

    const maxX=Math.max(state.maxRtt,12);
    const maxY=Math.max(16,Math.ceil(
      Math.max(state.ssthresh,...state.history.map(p=>p.cwnd))*1.25/4
    )*4);

    const X=v=>pad.l+(v/maxX)*gw;
    const Y=v=>pad.t+gh-(v/maxY)*gh;

    ctx.clearRect(0,0,w,h);
    ctx.font="10px 'DM Mono', monospace";
    ctx.textAlign="right";
    ctx.textBaseline="middle";

    const yStep=maxY<=20?2:4;

    for(let v=0;v<=maxY;v+=yStep) {
      const yy=Y(v);

      ctx.strokeStyle=COLORS.grid;
      ctx.lineWidth=1;
      ctx.setLineDash([]);

      ctx.beginPath();
      ctx.moveTo(pad.l,yy);
      ctx.lineTo(w-pad.r,yy);
      ctx.stroke();

      ctx.fillStyle=COLORS.text;
      ctx.fillText(v,pad.l-12,yy);
    }

    ctx.textAlign="center";
    ctx.textBaseline="top";

    const xStep=maxX<=16?2:5;

    for(let v=0;v<=maxX;v+=xStep) {
      const xx=X(v);

      ctx.strokeStyle="#172b40";
      ctx.beginPath();
      ctx.moveTo(xx,pad.t);
      ctx.lineTo(xx,h-pad.b);
      ctx.stroke();

      ctx.fillStyle=COLORS.text;
      ctx.fillText(v,xx,h-pad.b+12);
    }

    ctx.fillStyle="#a8bad0";
    ctx.font="10px 'DM Mono', monospace";
    ctx.fillText("ROUND TRIP TIME (RTT)",pad.l+gw/2,h-17);

    ctx.save();
    ctx.translate(16,pad.t+gh/2);
    ctx.rotate(-Math.PI/2);
    ctx.fillText("CONGESTION WINDOW (MSS)",0,0);
    ctx.restore();

    ctx.strokeStyle=COLORS.threshold;
    ctx.lineWidth=1.5;
    ctx.setLineDash([6,5]);

    ctx.beginPath();
    ctx.moveTo(pad.l,Y(state.ssthresh));
    ctx.lineTo(w-pad.r,Y(state.ssthresh));
    ctx.stroke();

    ctx.setLineDash([]);
    ctx.textAlign="right";
    ctx.fillStyle=COLORS.threshold;
    ctx.fillText(`ssthresh ${state.ssthresh.toFixed(1)} MSS`,
      w-pad.r-4,Y(state.ssthresh)-13);

    for(let i=1;i<state.history.length;i++) {
      const a=state.history[i-1];
      const b=state.history[i];

      const col=(b.event.includes("loss") ?
        COLORS.loss :
        (b.phase==="Slow Start" ? COLORS.slow : COLORS.avoid));

      ctx.beginPath();
      ctx.moveTo(X(a.rtt),Y(a.cwnd));
      ctx.lineTo(X(b.rtt),Y(b.cwnd));

      ctx.strokeStyle=col;
      ctx.lineWidth=2.8;
      ctx.shadowColor=col;
      ctx.shadowBlur=8;
      ctx.stroke();
      ctx.shadowBlur=0;

      ctx.beginPath();
      ctx.arc(X(b.rtt),Y(b.cwnd),3.2,0,Math.PI*2);
      ctx.fillStyle=col;
      ctx.fill();
    }

    const first=state.history[0];

    ctx.beginPath();
    ctx.arc(X(first.rtt),Y(first.cwnd),3.5,0,Math.PI*2);
    ctx.fillStyle=COLORS.slow;
    ctx.fill();

    state.lossMarkers.forEach(m=>{
      ctx.beginPath();
      ctx.arc(X(m.rtt),Y(m.cwnd),7,0,Math.PI*2);
      ctx.strokeStyle=COLORS.loss;
      ctx.lineWidth=2;
      ctx.stroke();
    });

    if(state.hoverPoint) {
      const p=state.hoverPoint;

      ctx.beginPath();
      ctx.arc(X(p.rtt),Y(p.cwnd),7,0,Math.PI*2);
      ctx.strokeStyle="#fff";
      ctx.lineWidth=1.5;
      ctx.stroke();
    }

    canvas._plot={X,Y,pad,maxX,maxY};
  }

  canvas.addEventListener("pointermove",e=>{
    if(!canvas._plot || !state.history.length) return;

    const r=canvas.getBoundingClientRect();
    const x=e.clientX-r.left;

    const target=canvas._plot.maxX*
      (x-canvas._plot.pad.l)/
      (r.width-canvas._plot.pad.l-canvas._plot.pad.r);

    const p=state.history.reduce((best,item)=>
      Math.abs(item.rtt-target)<Math.abs(best.rtt-target) ? item : best,
      state.history[0]
    );

    if(Math.abs(canvas._plot.X(p.rtt)-x)>22) {
      state.hoverPoint=null;
      els.tooltip.hidden=true;
      drawGraph();
      return;
    }

    state.hoverPoint=p;
    els.tooltip.hidden=false;

    els.tooltip.innerHTML=
      `RTT: ${p.rtt}<br>cwnd: ${p.cwnd.toFixed(2)} MSS<br>ssthresh: ${p.ssthresh.toFixed(2)} MSS<br>${escapeHTML(p.phase)}`;

    const left=Math.min(Math.max(8,x+12),r.width-150);
    const top=Math.max(8,e.clientY-r.top-54);

    els.tooltip.style.left=`${left}px`;
    els.tooltip.style.top=`${top}px`;

    drawGraph();
  });

  canvas.addEventListener("pointerleave",()=>{
    state.hoverPoint=null;
    els.tooltip.hidden=true;
    drawGraph();
  });

  els.start.addEventListener("click",start);
  els.pause.addEventListener("click",pause);
  els.reset.addEventListener("click",reset);
  els.loss.addEventListener("click",triggerLoss);

  els.thresholdInput.addEventListener("input",()=>{
    els.thresholdOutput.textContent=`${els.thresholdInput.value} MSS`;

    if(state.rtt===0) {
      state.ssthresh=Number(els.thresholdInput.value);
      state.initialThreshold=state.ssthresh;
      state.history[0].ssthresh=state.ssthresh;
      updateUI();
      drawGraph();
    }
  });

  els.speed.addEventListener("input",()=>{
    state.interval=Number(els.speed.value);
    els.speedOutput.textContent=`${(1000/state.interval).toFixed(1)}×`;

    if(state.running) {
      clearInterval(state.timer);
      state.timer=setInterval(tick,state.interval);
    }
  });

  els.maxRtt.addEventListener("input",()=>{
    state.maxRtt=Number(els.maxRtt.value);
    els.maxRttOutput.textContent=`${state.maxRtt} RTTs`;
    drawGraph();
    updateUI();
  });

  els.export.addEventListener("click",()=>{
    const rows=[
      ["RTT","cwnd_MSS","ssthresh_MSS","phase","event"],
      ...state.history.map(h=>[
        h.rtt,h.cwnd.toFixed(2),h.ssthresh.toFixed(2),h.phase,h.event
      ])
    ];

    const csv=rows.map(row=>
      row.map(v=>`"${String(v).replace(/"/g,'""')}"`).join(",")
    ).join("\n");

    const blob=new Blob([csv],{type:"text/csv;charset=utf-8;"});
    const url=URL.createObjectURL(blob);
    const a=document.createElement("a");

    a.href=url;
    a.download="tcp-congestion-observations.csv";
    a.click();

    URL.revokeObjectURL(url);
  });

  window.addEventListener("resize",drawGraph);

  els.thresholdOutput.textContent=`${state.ssthresh} MSS`;
  els.speedOutput.textContent="1.0×";
  els.maxRttOutput.textContent=`${state.maxRtt} RTTs`;

  reset();
})();
