'use strict';
const examples={"tasks":[{"id":"blackboard","label":"Blackboard wiping","force":{"video":"assets/force/blackboard-urdf-final.mp4","poster":"assets/force/blackboard-poster-final.jpg","caption":"Full sequence · 31.7 s"}},{"id":"unlock","label":"Unlocking","force":{"video":"assets/force/unlock-urdf-final.mp4","poster":"assets/force/unlock-poster-final.jpg","caption":"Full sequence · 42.8 s"}},{"id":"cucumber","label":"Cucumber peeling","force":{"video":"assets/force/cucumber-urdf-final.mp4","poster":"assets/force/cucumber-poster-final.jpg","caption":"Full sequence · 146.6 s"}},{"id":"bulb","label":"Bulb screwing","force":{"video":"assets/force/bulb-urdf-1783574121.mp4","poster":"assets/force/bulb-poster-1783574121.jpg","caption":"Full sequence · 56.0 s"}}],"pusht":{"caption":"","videos":[{"label":"Vision only","src":"assets/pusht/ep03-real-main-clean.mp4"},{"label":"ForceWorld","src":"assets/pusht/ep03-target-main-clean.mp4"}]}};
const forceVideo=document.querySelector('#force-video');
const forceCaption=document.querySelector('#force-caption');
const forceEmpty=document.querySelector('#force-empty');
function showForce(task){document.querySelector("#force-task-label").textContent=task.label;forceVideo.pause();const ready=Boolean(task.force);forceVideo.closest('figure').hidden=!ready;forceEmpty.hidden=ready;if(ready){forceVideo.src=task.force.video;forceVideo.poster=task.force.poster||'';forceVideo.setAttribute('aria-label',task.label+' prediction and URDF joint torque visualization');forceCaption.textContent=task.force.caption;forceVideo.play().catch(()=>{});}else{forceVideo.removeAttribute('src');forceVideo.load();document.querySelector('#force-empty-title').textContent=task.label;}}
function selectTask(button){if(!examples)return;const group=button.dataset.group;document.querySelectorAll(`[data-group="${group}"]`).forEach(t=>{const selected=t===button;t.setAttribute('aria-selected',String(selected));t.tabIndex=selected?0:-1;});document.querySelector('#'+group+'-panel').setAttribute('aria-labelledby',button.id);const task=examples.tasks.find(t=>t.id===button.dataset.task);showForce(task);}
for(const group of ['force']){const tabs=[...document.querySelectorAll(`[data-group="${group}"]`)];tabs.forEach((tab,i)=>{tab.addEventListener('click',()=>selectTask(tab));tab.addEventListener('keydown',e=>{let next;if(e.key==='ArrowRight')next=(i+1)%tabs.length;if(e.key==='ArrowLeft')next=(i+tabs.length-1)%tabs.length;if(e.key==='Home')next=0;if(e.key==='End')next=tabs.length-1;if(next!==undefined){e.preventDefault();tabs[next].focus();selectTask(tabs[next]);}});});}
const comparisonControllers=[];
function setupComparison(prefix,videoSelector){
 const videos=[...document.querySelectorAll(videoSelector)];
 if(!videos.length)return;
 const panel=videos[0].closest('[data-eval-panel]');
 const button=document.querySelector('#'+prefix+'-play');
 const status=document.querySelector('#'+prefix+'-status');
 const seek=document.querySelector('#'+prefix+'-seek');
 const output=document.querySelector('#'+prefix+'-time');
 let wanted=false,starting=false,generation=0;
 const active=()=>!panel||!panel.hidden;
 const duration=()=>videos.every(v=>Number.isFinite(v.duration)&&v.duration>0)?Math.min(...videos.map(v=>v.duration)):0;
 const clock=t=>Math.floor(t/60)+':'+String(Math.floor(t%60)).padStart(2,'0');
 function timeline(){const d=duration();seek.disabled=!d;seek.value=d?videos[0].currentTime/d*1000:0;output.textContent=clock(videos[0].currentTime)+' / '+clock(d);}
 function hold(){generation++;starting=false;videos.forEach(v=>v.pause());}
 function pause(){wanted=false;hold();button.textContent='Play together';status.textContent='';}
 function align(t){videos.forEach(v=>{if(v.readyState>=1&&Math.abs(v.currentTime-t)>.06)v.currentTime=t;});timeline();}
 async function resume(){
  if(!wanted||!active()||starting)return;
  if(videos.some(v=>v.readyState<3||v.seeking)){status.textContent='Loading both videos…';return;}
  if(videos.every(v=>!v.paused))return;
  starting=true;const request=++generation;
  const results=await Promise.allSettled(videos.map(v=>v.play()));
  if(request!==generation)return;
  starting=false;
  if(results.some(r=>r.status==='rejected')){pause();status.textContent='Tap Play together to start both videos.';return;}
  if(!wanted||!active()){pause();return;}
  button.textContent='Pause together';status.textContent='';
 }
 function play(restart=false){
  hold();wanted=true;button.textContent='Pause together';
  const d=duration();align(restart||(d&&videos[0].currentTime>=d-.1)?0:videos[0].currentTime);
  videos.forEach(v=>{v.preload='auto';});resume();
 }
 button.addEventListener('click',()=>wanted?pause():play());
 document.querySelector('#'+prefix+'-restart').addEventListener('click',()=>play(true));
 document.querySelector('#'+prefix+'-speed').addEventListener('change',e=>videos.forEach(v=>v.playbackRate=Number(e.target.value)));
 seek.addEventListener('input',()=>{const run=wanted;hold();align(Number(seek.value)/1000*duration());if(run)resume();});
 videos.forEach(v=>{
  // Shared controls prevent either side from playing independently.
  v.controls=false;v.muted=true;v.defaultMuted=true;v.playsInline=true;
  v.addEventListener('click',()=>wanted?pause():play());
  ['loadedmetadata','durationchange'].forEach(event=>v.addEventListener(event,timeline));
  ['canplay','seeked'].forEach(event=>v.addEventListener(event,resume));
  v.addEventListener('waiting',()=>{if(wanted&&v.readyState<3){hold();status.textContent='Loading both videos…';}});
  v.addEventListener('ended',()=>{if(wanted)play(true);});
  v.addEventListener('error',()=>{pause();status.textContent='A video could not load. Reload to retry.';});
 });
 videos[0].addEventListener('timeupdate',()=>{
  timeline();if(!wanted||videos[0].paused)return;
  const follower=videos[1];
  if(follower.paused){hold();resume();return;}
  const delta=videos[0].currentTime-follower.currentTime;
  if(Math.abs(delta)>.25){hold();align(videos[0].currentTime);resume();}
 });
 comparisonControllers.push({panel,play,pause});timeline();
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
 document.querySelectorAll('[data-eval-panel]').forEach(panel=>{const hide=panel.dataset.evalPanel!==evaluationTask+'-'+evaluationOutcome;if(hide)comparisonControllers.find(c=>c.panel===panel)?.pause();panel.hidden=hide;});
 comparisonControllers.filter(c=>c.panel&&!c.panel.hidden).forEach(c=>c.play());
 evalButtons.forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.evalTask?button.dataset.evalTask===evaluationTask:button.dataset.evalOutcome===evaluationOutcome)));
}
evalButtons.forEach(button=>button.addEventListener('click',()=>{if(button.dataset.evalTask)evaluationTask=button.dataset.evalTask;else evaluationOutcome=button.dataset.evalOutcome;refreshEvaluation();}));
document.querySelectorAll('[data-hero-task]').forEach(link=>link.addEventListener('click',()=>{const button=document.querySelector('#force-'+link.dataset.heroTask);selectTask(button);}));
refreshEvaluation();

forceVideo.muted=true;forceVideo.defaultMuted=true;forceVideo.autoplay=true;forceVideo.loop=true;forceVideo.play().catch(()=>{});
comparisonControllers.filter(c=>!c.panel).forEach(c=>c.play());
