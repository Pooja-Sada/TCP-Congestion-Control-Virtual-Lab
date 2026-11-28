const $=id=>document.getElementById(id);
const state={running:false,loopActive:false,cwnd:1,threshold:8,rtt:0,losses:0,phase:'Ready',points:[],packetNo:1,pendingLossRemaining:0,lossMode:'duplicate',activeAnimations:new Set(),timerWaits:new Set(),runToken:0,pendingLossIds:[]};
const graph=$('cwndGraph'),ctx=graph.getContext('2d');
const BASE_PACKET_MS=3600;
function log(t){const li=document.createElement('li');li.textContent=`RTT ${state.rtt}: ${t}`;$('eventLog').prepend(li)}
function message(t){$('eventMessage').textContent=t;$('flowStatus').textContent=t}
function updateStats(){$('cwndValue').textContent=Number(state.cwnd.toFixed(1));$('ssthreshValue').textContent=state.threshold;$('rttValue').textContent=state.rtt;$('lossValue').textContent=state.losses;$('phaseBadge').textContent=state.phase.toUpperCase()}
function addGraphPoint(eventLabel=''){state.points.push({x:state.rtt,y:state.cwnd,event:eventLabel});drawGraph();updateStats()}
function drawGraph(){const w=graph.clientWidth||600,h=270,dpr=window.devicePixelRatio||1;graph.width=w*dpr;graph.height=h*dpr;ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,w,h);const pad={l:42,r:18,t:22,b:34};const maxPointX=Math.max(0,...state.points.map(p=>p.x));const maxX=Math.max(4,maxPointX+1),maxY=Math.max(state.threshold+2,8,...state.points.map(p=>p.y))+2;const X=x=>pad.l+x/maxX*(w-pad.l-pad.r),Y=y=>h-pad.b-y/maxY*(h-pad.t-pad.b);ctx.strokeStyle='#29425d';ctx.lineWidth=1;ctx.fillStyle='#91a7c1';ctx.font='11px Arial';for(let i=0;i<=4;i++){const val=i*maxY/4;ctx.beginPath();ctx.moveTo(pad.l,Y(val));ctx.lineTo(w-pad.r,Y(val));ctx.stroke();ctx.fillText(String(Math.round(val)),6,Y(val)+3)}for(let i=0;i<=Math.min(maxX,10);i++)ctx.fillText(String(i),X(i)-3,h-12);ctx.fillText('RTT',w-35,h-3);ctx.setLineDash([5,4]);ctx.strokeStyle='#ffb454';ctx.beginPath();ctx.moveTo(pad.l,Y(state.threshold));ctx.lineTo(w-pad.r,Y(state.threshold));ctx.stroke();ctx.setLineDash([]);if(state.points.length){ctx.strokeStyle='#70b8ff';ctx.lineWidth=2.7;ctx.beginPath();state.points.forEach((p,i)=>i?ctx.lineTo(X(p.x),Y(p.y)):ctx.moveTo(X(p.x),Y(p.y)));ctx.stroke();state.points.forEach(p=>{ctx.fillStyle=p.event?'#ff7187':'#70b8ff';ctx.beginPath();ctx.arc(X(p.x),Y(p.y),4,0,Math.PI*2);ctx.fill();if(p.event){ctx.strokeStyle='#ff7187';ctx.setLineDash([3,3]);ctx.beginPath();ctx.moveTo(X(p.x),pad.t);ctx.lineTo(X(p.x),Y(p.y));ctx.stroke();ctx.setLineDash([]);ctx.fillStyle='#ff9cab';ctx.font='10px Arial';ctx.fillText(p.event,X(p.x)+5,Math.max(12,Y(p.y)-9))}})}}
function wait(ms,token=state.runToken){return new Promise(resolve=>{let remaining=ms,last=performance.now();const tick=()=>{if(token!==state.runToken){resolve();return}if(!state.running){last=performance.now();setTimeout(tick,50);return}const now=performance.now(),speed=Number($('speed').value)||1;remaining-=(now-last)*speed;last=now;if(remaining<=0)resolve();else setTimeout(tick,25)};setTimeout(tick,25)})}
function animateBlock(el,from,to,duration){const speed=Number($('speed').value)||1;const anim=el.animate([{left:from,opacity:0,transform:'scale(.92)'},{left:from,opacity:1,transform:'scale(1)',offset:.08},{left:to,opacity:1,transform:'scale(1)'}],{duration:duration,easing:'linear',fill:'forwards'});state.activeAnimations.add(anim);anim.playbackRate=speed;if(!state.running)anim.pause();return anim}
function addBlock(label,type,track,duration=BASE_PACKET_MS){const el=document.createElement('div');el.className=`packet ${type}`;el.textContent=label;$(track).appendChild(el);const lane=$(track);const end=Math.max(0,lane.clientWidth-el.offsetWidth);const from=type==='ack'||type==='duplicate'?`${end}px`:'0px',to=type==='ack'||type==='duplicate'?'0px':`${end}px`;return {el,animation:animateBlock(el,from,to,duration),duration}}
async function moveBlock(label,type='data',track='dataTrack',duration=BASE_PACKET_MS){const b=addBlock(label,type,track,duration);await wait(duration);b.animation.cancel();state.activeAnimations.delete(b.animation);b.el.remove()}
async function showEventBlock(label,type='event-block',duration=2600){const el=document.createElement('div');el.className=`packet ${type}`;el.textContent=label;$('dataTrack').appendChild(el);const a=el.animate([{left:'38%',opacity:0,transform:'scale(.85)'},{left:'38%',opacity:1,transform:'scale(1)',offset:.15},{left:'38%',opacity:1,transform:'scale(1)',offset:.8},{left:'38%',opacity:0,transform:'scale(1)'}],{duration:duration,fill:'forwards'});state.activeAnimations.add(a);a.playbackRate=Number($('speed').value)||1;if(!state.running)a.pause();await wait(duration);a.cancel();state.activeAnimations.delete(a);el.remove()}
async function sendDataAndAck(id,isLost=false){await moveBlock(isLost?`P${id} · LOST`:`P${id}`,isLost?'lost':'data','dataTrack');if(!isLost)await moveBlock(`ACK ${id}`,'ack','ackTrack',BASE_PACKET_MS*.82)}
async function transmitNormalRound(token){if(token!==state.runToken||!state.running)return;state.rtt++;const count=Math.max(1,Math.ceil(state.cwnd)),round=[];message(`RTT ${state.rtt}: sending ${count} packet(s), one by one.`);
// Phase 1: launch data packets one by one. Each packet stays visible until its
// own animation really finishes; ACKs are not created during this phase.
const inFlight=[];
for(let i=0;i<count;i++){
  if(!state.running)return;
  const id=state.packetNo++;
  const willLose=state.pendingLossIds.length?state.pendingLossIds.includes(id):state.pendingLossRemaining>0;
  if(willLose){
    if(state.pendingLossIds.length)state.pendingLossIds=state.pendingLossIds.filter(n=>n!==id);
    else state.pendingLossRemaining--;
  }
  const packet={id,lost:willLose};round.push(packet);
  const label=willLose?`P${id} · LOST`:`P${id}`;
  const block=addBlock(label,willLose?'lost':'data','dataTrack',BASE_PACKET_MS);
  const journey=block.animation.finished.then(()=>{
    state.activeAnimations.delete(block.animation);
    block.el.remove();
  }).catch(()=>{});
  inFlight.push(journey);
  await wait(220,token);
  if(token!==state.runToken||!state.running)return;
}
message(`RTT ${state.rtt}: data packets sent. Waiting for all packets to reach the receiver.`);
await Promise.all(inFlight);
if(!state.running||token!==state.runToken)return;
message(`RTT ${state.rtt}: data packets reached the receiver. Sending acknowledgements back.`);

// Phase 2: ACKs travel as a staggered, overlapping group, just like the data packets.
const ackJourneys=[];
for(const packet of round){
  if(!state.running)return;
  if(!packet.lost){
    const ack=addBlock(`ACK ${packet.id}`,'ack','ackTrack',BASE_PACKET_MS*.82);
    const journey=ack.animation.finished.then(()=>{
      state.activeAnimations.delete(ack.animation);
      ack.el.remove();
    }).catch(()=>{});
    ackJourneys.push(journey);
    await wait(220,token);
    if(!state.running||token!==state.runToken)return;
  }
}
await Promise.all(ackJourneys);
if(!state.running||token!==state.runToken)return;
const lost=round.filter(packet=>packet.lost).map(packet=>packet.id);if(lost.length){message(`${lost.length} packet(s) lost in RTT ${state.rtt}. Recovery begins.`);for(const id of lost){if(!state.running||token!==state.runToken)return;await handleLoss(id,token)}return}if(state.cwnd<state.threshold){state.phase='Slow Start';state.cwnd=Math.min(state.cwnd*2,state.threshold)}else{state.phase='Congestion Avoidance';state.cwnd+=1}log(`${count} packet(s) sent one by one; all ${count} ACKs received. ${state.phase}; CWND = ${state.cwnd} MSS.`);addGraphPoint();await wait(450)}
async function handleLoss(id,token){state.losses++;const mode=$('lossMode').value;state.threshold=Math.max(2,Math.floor(state.cwnd/2));if(mode==='duplicate'){state.phase='3 Duplicate ACKs';message(`P${id} lost. Simulating 3 duplicate ACKs.`);log(`P${id} lost; 3 duplicate ACKs.`);addGraphPoint('3 dup ACKs');for(let n=1;n<=3;n++){await moveBlock(`DUP ACK ${n}`,'duplicate','ackTrack',BASE_PACKET_MS*.72);await wait(120)}state.phase='Fast Retransmit';await showEventBlock('FAST RETRANSMIT','event-block',1500);await moveBlock(`RETX P${id}`,'retransmit','dataTrack',BASE_PACKET_MS);await moveBlock(`ACK P${id} RECOVERED`,'ack','ackTrack',BASE_PACKET_MS*.85);state.phase='Fast Recovery';state.cwnd=state.threshold+3;message(`P${id} recovered. Fast Recovery: CWND = SSThresh + 3.`);addGraphPoint('Fast Recovery');await wait(800);state.cwnd=state.threshold;state.phase='Congestion Avoidance';message('Fast Recovery complete; Congestion Avoidance resumes.');addGraphPoint()}else{state.phase='TIMEOUT';const rto=Number($('rto').value);message(`Waiting ${rto}s for the retransmission timeout.`);log(`P${id} lost; waiting ${rto}s timeout.`);await wait(rto*1000);await showEventBlock('RETRANSMISSION TIMEOUT','event-block',1200);state.cwnd=1;addGraphPoint('TIMEOUT');message(`Timeout: CWND reset to 1 MSS. Retransmitting P${id}.`);await moveBlock(`RETX P${id}`,'retransmit','dataTrack',BASE_PACKET_MS);await moveBlock(`ACK P${id} RECOVERED`,'ack','ackTrack',BASE_PACKET_MS*.85);state.phase='Slow Start';message(`P${id} recovered. Slow Start resumes at CWND = 1 MSS.`);addGraphPoint()}await wait(500)}
async function runLoop(token){if(token!==state.runToken)return;state.loopActive=true;while(state.running&&token===state.runToken)await transmitNormalRound(token);if(token===state.runToken)state.loopActive=false}
function start(){if(state.running)return;state.running=true;const token=state.runToken;document.body.classList.remove('paused');state.activeAnimations.forEach(a=>a.play());$('startBtn').textContent='▶ Start';$('phaseBadge').textContent='RUNNING';message('Simulation running.');runLoop(token)}
function pause(){if(!state.running)return;state.running=false;document.body.classList.add('paused');state.activeAnimations.forEach(a=>a.pause());$('startBtn').textContent='▶ Resume';$('phaseBadge').textContent='PAUSED';message('Paused in place. Press Resume to continue.')}
function scheduleSpecificLoss(){
  const raw=$('lossPacketIds').value.trim();
  if(!raw){message('Enter packet numbers first, for example 50, 55.');return}
  if(!state.running){message('Press Start before scheduling packet loss.');return}
  if(state.pendingLossRemaining||state.pendingLossIds.length){message('Packet loss is already scheduled.');return}
  const parts=raw.split(',').map(v=>v.trim());
  const ids=[...new Set(parts.map(Number))];
  if(parts.some(v=>!/^\d+$/.test(v))||ids.some(n=>!Number.isInteger(n)||n<state.packetNo)){message(`Enter valid future packet numbers starting from P${state.packetNo}.`);return}
  state.pendingLossIds=ids.sort((a,b)=>a-b);
  message(`Scheduled P${state.pendingLossIds.join(', P')} for loss. They will be dropped automatically when those packet numbers are sent.`);
  log(`Scheduled specific packet loss: ${state.pendingLossIds.join(', ')}.`);
}
function reset(){state.runToken++;pause();state.running=false;$('startBtn').textContent='▶ Start';state.activeAnimations.forEach(a=>{try{a.cancel()}catch(e){}});state.cwnd=1;state.threshold=Number($('initialThreshold').value);state.rtt=0;state.losses=0;state.phase='Ready';state.points=[];state.packetNo=1;state.pendingLossRemaining=0;state.pendingLossIds=[];state.activeAnimations.clear();$('dataTrack').innerHTML='';$('ackTrack').innerHTML='';$('eventLog').innerHTML='<li>Simulation reset. Initial CWND = 1 MSS.</li>';message('Ready. Initial CWND = 1 MSS. Press Start.');addGraphPoint()}
$('startBtn').addEventListener('click',start);$('pauseBtn').addEventListener('click',pause);$('resetBtn').addEventListener('click',reset);$('lossBtn').addEventListener('click',()=>{
  if($('lossPacketIds').value.trim()){scheduleSpecificLoss();return}
  if(!state.running){message('Press Start first, then trigger packet loss.');return}
  if(state.pendingLossRemaining||state.pendingLossIds.length){message('Packet loss is already scheduled.');return}
  state.pendingLossRemaining=Number($('lossCount').value);
  message(`${state.pendingLossRemaining} packet(s) scheduled to be dropped in the next outgoing round.`);
  log(`Scheduled ${state.pendingLossRemaining} packet loss(es).`);
});
$('lossPacketIds').addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();scheduleSpecificLoss()}});
$('initialThreshold').addEventListener('input',e=>{$('thresholdOut').textContent=`${e.target.value} MSS`;if(!state.running)reset()});$('speed').addEventListener('input',e=>{$('speedOut').textContent=`${e.target.value}×`;const s=Number(e.target.value)||1;state.activeAnimations.forEach(a=>{if(a.playState!=='finished')a.playbackRate=s})});$('rto').addEventListener('input',e=>{$('rtoOut').textContent=`${e.target.value} s`});$('lossCount').addEventListener('input',e=>{const n=Number(e.target.value);$('lossCountOut').textContent=`${n} packet${n===1?'':'s'}`});window.addEventListener('resize',drawGraph);$('thresholdOut').textContent=`${$('initialThreshold').value} MSS`;$('speedOut').textContent=`${$('speed').value}×`;$('rtoOut').textContent=`${$('rto').value} s`;$('lossCountOut').textContent=`${$('lossCount').value} packet(s)`;reset();
