'use strict';
const examples={"tasks":[{"id":"blackboard","label":"Blackboard wiping","force":{"video":"assets/force/blackboard-urdf-final.mp4","poster":"assets/force/blackboard-poster-final.jpg","caption":"Full sequence · 31.7 s"}},{"id":"unlock","label":"Unlocking","force":{"video":"assets/force/unlock-urdf-final.mp4","poster":"assets/force/unlock-poster-final.jpg","caption":"Full sequence · 42.8 s"}},{"id":"cucumber","label":"Cucumber peeling","force":{"video":"assets/force/cucumber-urdf-final.mp4","poster":"assets/force/cucumber-poster-final.jpg","caption":"Full sequence · 146.6 s"}},{"id":"bulb","label":"Bulb screwing","force":{"video":"assets/force/bulb-urdf-1783574121.mp4","poster":"assets/force/bulb-poster-1783574121.jpg","caption":"Full sequence · 56.0 s"}}],"pusht":{"caption":"","videos":[{"label":"Vision only","src":"assets/pusht/ep03-real-main-clean.mp4"},{"label":"ForceWorld","src":"assets/pusht/ep03-target-main-clean.mp4"}]}};
const forceVideo=document.querySelector('#force-video');
const forceCaption=document.querySelector('#force-caption');
const forceEmpty=document.querySelector('#force-empty');
function showForce(task){document.querySelector("#force-task-label").textContent=task.label;forceVideo.pause();const ready=Boolean(task.force);forceVideo.closest('figure').hidden=!ready;forceEmpty.hidden=ready;if(ready){forceVideo.src=task.force.video;forceVideo.poster=task.force.poster||'';forceVideo.setAttribute('aria-label',task.label+' prediction and URDF joint torque visualization');forceCaption.textContent=task.force.caption;}else{forceVideo.removeAttribute('src');forceVideo.load();document.querySelector('#force-empty-title').textContent=task.label;}}
function selectTask(button){if(!examples)return;const group=button.dataset.group;document.querySelectorAll(`[data-group="${group}"]`).forEach(t=>{const selected=t===button;t.setAttribute('aria-selected',String(selected));t.tabIndex=selected?0:-1;});document.querySelector('#'+group+'-panel').setAttribute('aria-labelledby',button.id);const task=examples.tasks.find(t=>t.id===button.dataset.task);showForce(task);}
for(const group of ['force']){const tabs=[...document.querySelectorAll(`[data-group="${group}"]`)];tabs.forEach((tab,i)=>{tab.addEventListener('click',()=>selectTask(tab));tab.addEventListener('keydown',e=>{let next;if(e.key==='ArrowRight')next=(i+1)%tabs.length;if(e.key==='ArrowLeft')next=(i+tabs.length-1)%tabs.length;if(e.key==='Home')next=0;if(e.key==='End')next=tabs.length-1;if(next!==undefined){e.preventDefault();tabs[next].focus();selectTask(tabs[next]);}});});}
function setupComparison(prefix,videoSelector){
const pushtVideos=[...document.querySelectorAll(videoSelector)];
const playButton=document.querySelector('#'+prefix+'-play');
const playbackStatus=document.querySelector('#'+prefix+'-status');
const seek=document.querySelector('#'+prefix+'-seek');
const timeOutput=document.querySelector('#'+prefix+'-time');
let playRequest=0;
const duration=()=>pushtVideos.every(v=>Number.isFinite(v.duration)&&v.duration>0)?Math.min(...pushtVideos.map(v=>v.duration)):0;
const clock=t=>Math.floor(t/60)+':'+String(Math.floor(t%60)).padStart(2,'0');
function updateTimeline(){const d=duration();seek.disabled=!d;seek.value=d?Math.min(1000,pushtVideos[0].currentTime/d*1000):0;timeOutput.textContent=clock(pushtVideos[0].currentTime)+' / '+clock(d);}
function pauseAll(){playRequest++;pushtVideos.forEach(v=>v.pause());playButton.textContent='Play together';}
function seekAll(t){pushtVideos.forEach(v=>{if(v.readyState>=1)v.currentTime=t;});updateTimeline();}
async function playAll(restart=false){const request=++playRequest;pushtVideos.forEach(v=>v.pause());const d=duration();const t=restart||(d&&pushtVideos[0].currentTime>=d-.08)?0:pushtVideos[0].currentTime;seekAll(t);try{await Promise.all(pushtVideos.map(v=>v.play()));if(request!==playRequest)return;playButton.textContent='Pause together';playbackStatus.textContent='';}catch{if(request!==playRequest)return;pauseAll();playbackStatus.textContent='Playback could not start. Try Play together again.';}}
playButton.addEventListener('click',()=>pushtVideos.some(v=>!v.paused)?pauseAll():playAll());
document.querySelector('#'+prefix+'-restart').addEventListener('click',()=>playAll(true));
document.querySelector('#'+prefix+'-speed').addEventListener('change',e=>pushtVideos.forEach(v=>v.playbackRate=Number(e.target.value)));
seek.addEventListener('input',()=>{pauseAll();seekAll(Number(seek.value)/1000*duration());});
pushtVideos.forEach(v=>{v.addEventListener('loadedmetadata',updateTimeline);v.addEventListener('durationchange',updateTimeline);v.addEventListener('ended',pauseAll);v.addEventListener('error',()=>{pauseAll();playbackStatus.textContent='A comparison video could not load. Please reload the page.';});});
pushtVideos[0].addEventListener('timeupdate',()=>{const leader=pushtVideos[0];updateTimeline();if(!leader.paused){const d=duration();if(d&&leader.currentTime>=d-.04){pauseAll();return;}pushtVideos.slice(1).forEach(v=>{if(v.readyState>=2&&!v.paused&&Math.abs(v.currentTime-leader.currentTime)>.15)v.currentTime=leader.currentTime;});}});
updateTimeline();
}
setupComparison("pusht",".pusht-video");
setupComparison("policy",".policy-video");
setupComparison("policy-success",".policy-success-video");
setupComparison("policy-unlock-failure",".policy-unlock-failure-video");
setupComparison("policy-cucumber-failure",".policy-cucumber-failure-video");
setupComparison("policy-cucumber-success",".policy-cucumber-success-video");
setupComparison("policy-unlock-success",".policy-unlock-success-video");
const navLinks=[...document.querySelectorAll('.section-nav div a[href^="#"]')];
const sections=navLinks.map(a=>document.querySelector(a.getAttribute('href'))).filter(Boolean);
let scrollQueued=false;
function updateNavigation(){scrollQueued=false;let current=null;for(const section of sections){if(section.getBoundingClientRect().top<=150)current=section.id;}navLinks.forEach(a=>{if(a.hash==='#'+current)a.setAttribute('aria-current','location');else a.removeAttribute('aria-current');});}
window.addEventListener('scroll',()=>{if(!scrollQueued){scrollQueued=true;requestAnimationFrame(updateNavigation);}},{passive:true});updateNavigation();

setupComparison("policy-bulb-success",".policy-bulb-success-video");


setupComparison("policy-bulb-failure-selected",".policy-bulb-failure-selected-video");

const evalButtons=[...document.querySelectorAll('[data-eval-task],[data-eval-outcome]')];
let evaluationTask='blackboard',evaluationOutcome='success';
function refreshEvaluation(){
 document.querySelectorAll('[data-eval-panel]').forEach(panel=>{const hide=panel.dataset.evalPanel!==evaluationTask+'-'+evaluationOutcome;if(hide){panel.querySelectorAll('video').forEach(video=>video.pause());const button=panel.querySelector('[id$="-play"]');if(button)button.textContent='Play together';}panel.hidden=hide;});
 evalButtons.forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.evalTask?button.dataset.evalTask===evaluationTask:button.dataset.evalOutcome===evaluationOutcome)));
}
evalButtons.forEach(button=>button.addEventListener('click',()=>{if(button.dataset.evalTask)evaluationTask=button.dataset.evalTask;else evaluationOutcome=button.dataset.evalOutcome;refreshEvaluation();}));
document.querySelectorAll('[data-hero-task]').forEach(link=>link.addEventListener('click',()=>{const button=document.querySelector('#force-'+link.dataset.heroTask);selectTask(button);}));
refreshEvaluation();
