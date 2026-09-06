'use strict';
const scenes = window.__FEATURED_SCENES__;
const viewer = document.getElementById('hero-viewer');
let selectedScene='scene-009';
function showSceneLabels(id) {
 const scene=scenes[id];if(!scene)return;
 document.querySelectorAll('[data-scene]').forEach(item=>{const active=item.dataset.scene===id;item.classList.toggle('active',active);item.setAttribute('aria-pressed',String(active));});
 document.getElementById('shape-prompt').textContent='“'+scene.shape+'”';
 viewer.title='Synchronized 3D comparison: '+scene.title+' input and generated result';
}
document.querySelectorAll('[data-scene]').forEach(button=>button.addEventListener('click',()=>{
 const id=button.dataset.scene;if(id===selectedScene)return;selectedScene=id;
 showSceneLabels(id);viewer.style.visibility='hidden';document.getElementById('featured-loading').hidden=false;
 // Replace iframe history: Back/Forward must not restore a model without its labels.
 viewer.contentWindow.location.replace('gallery.html?v=20260906-4&embed=1&scene='+encodeURIComponent(id));
}));
window.addEventListener('message',event=>{
 if(event.origin!==location.origin||event.source!==viewer.contentWindow||event.data?.type!=='spaceflow-featured-ready')return;
 const id=event.data.scene;if(!scenes[id]||viewer.contentWindow.__GALLERY_PAYLOAD__?.cards[0]?.id!==id)return;
 // The rendered card is the source of truth, including browser history restoration.
 selectedScene=id;showSceneLabels(id);viewer.style.visibility='';document.getElementById('featured-loading').hidden=true;
 document.getElementById('scene-announcement').textContent='Showing '+scenes[id].title+'. Local appearance labels follow the input parts.';
});
document.getElementById('reset-view').addEventListener('click', () => {
  try {viewer.contentDocument.getElementById('resetButton').click();} catch {document.getElementById('scene-announcement').textContent='The viewer is still loading. Please try again in a moment.';}
});
const steps = [
 ['THE INPUT','The input consists of editable geometric parts, each with a local control level and an optional text or image appearance cue. Deformable superquadrics provide a compact representation for specifying these parts.'],
 ['LOCAL GEOMETRIC GUIDANCE','During structure generation, conditioned flow preserves stronger geometric constraints in designated regions while allowing the generative prior to complete weakly constrained regions. This makes the fidelity–freedom trade-off local rather than uniform across the object.'],
 ['PART-SPECIFIC APPEARANCE','PartField features segment the generated structure into semantic regions, which are matched to the input primitives. Routed cross-attention sends each part only its assigned text or image cue; part-aware guidance encourages coherent appearance within each region.']
];
document.querySelectorAll('[data-step]').forEach(button => button.addEventListener('click', () => {
 document.querySelectorAll('[data-step]').forEach(item => {const active=item===button;item.classList.toggle('active',active);item.setAttribute('aria-pressed',String(active));});
 const [label,description]=steps[Number(button.dataset.step)];document.getElementById('method-label').textContent=label;document.getElementById('method-description').textContent=description;
}));
const metrics = {
 overall:{values:[75.9,68.7],ci:['65.7, 83.8','58.1, 77.6'],description:'Overall preference balances fidelity to the input and realism.'},
 pgf:{values:[78.3,66.3],ci:['68.3, 85.8','55.6, 75.5'],description:'Prompt and geometric fidelity measures high-control shape adherence together with prompt-driven completion in low-control regions.'},
 realism:{values:[43.4,85.5],ci:['33.2, 54.1','76.4, 91.5'],description:'Realism measures how plausible the object looks, independently of input adherence. Against low uniform guidance, the confidence interval includes 50%; there is no clear preference on this criterion.'}
};
document.getElementById('metric-select').addEventListener('change', event => {
 const m=metrics[event.target.value];['low','high'].forEach((key,index)=>{document.getElementById('value-'+key).textContent=m.values[index]+'%';document.getElementById('bar-'+key).style.width=m.values[index]+'%';document.getElementById('ci-'+key).textContent='95% CI ['+m.ci[index]+']';});
 document.querySelector('.bar-chart').setAttribute('aria-label',event.target.selectedOptions[0].text+': SpaceFlow wins '+m.values[0]+' percent against low uniform guidance and '+m.values[1]+' percent against high uniform guidance.');
 document.getElementById('metric-note').textContent=m.description+' These are VLM-judge results over 83 assets, aggregated by majority vote across three passes; intervals are 95% Wilson confidence intervals.';
});
document.getElementById('copy-citation').addEventListener('click', async () => {
 const status=document.getElementById('copy-status'), text=document.getElementById('bibtex').textContent;
 try {await navigator.clipboard.writeText(text);status.textContent='BibTeX copied to clipboard.';}
 catch {const range=document.createRange();range.selectNodeContents(document.getElementById('bibtex'));const selection=window.getSelection();selection.removeAllRanges();selection.addRange(range);status.textContent='Citation selected. Press Ctrl+C or ⌘C to copy.';}
});
// Pausing after scrolling away saves work without starting media unexpectedly.
const video=document.getElementById('demo-video');
new IntersectionObserver(entries=>{if(!entries[0].isIntersecting)video.pause();},{threshold:0}).observe(video);
document.addEventListener('visibilitychange',()=>{if(document.hidden)video.pause();});

let viewerVisible = true;
const sendViewerVisibility = () => viewer.contentWindow?.postMessage({type:'spaceflow-visibility',visible:viewerVisible && !document.hidden},location.origin);
new IntersectionObserver(entries=>{viewerVisible=entries[0].isIntersecting;sendViewerVisibility();},{rootMargin:'100px'}).observe(viewer);
viewer.addEventListener('load',sendViewerVisibility);
document.addEventListener('visibilitychange',sendViewerVisibility);

// Keep the image usable while the two exact GLBs and the 3D renderer load.
const animatedTeaser = document.getElementById('animated-teaser');
if (animatedTeaser) {
 const teaserObserver = new IntersectionObserver(entries => {
  if (!entries[0].isIntersecting) return;
  teaserObserver.disconnect();
  import('./assets/teaser/viewer.js?v=20260906-4').then(module => module.mountTeaser(animatedTeaser)).catch(error => {
   document.getElementById('teaser-status').textContent = 'Original figure · 3D unavailable';
   console.error('Unable to initialize the elephant teaser:', error);
  });
 }, {rootMargin:'200px'});
 teaserObserver.observe(animatedTeaser);
}

// Mirror the gallery's rotation control without restarting its models.
const heroRotate = document.getElementById('hero-rotate');
let rotationObserver;
function syncRotationControl() {
 const control = viewer.contentDocument?.getElementById('autoRotateButton');
 if (!control) return;
 const rotating = control.getAttribute('aria-pressed') === 'true';
 heroRotate.setAttribute('aria-pressed', String(rotating));
 heroRotate.textContent = rotating ? 'Pause rotation' : 'Resume rotation';
}
viewer.addEventListener('load', () => {
 rotationObserver?.disconnect();
 const control = viewer.contentDocument?.getElementById('autoRotateButton');
 if (!control) return;
 rotationObserver = new MutationObserver(syncRotationControl);
 rotationObserver.observe(control, {attributes:true, attributeFilter:['aria-pressed']});
 syncRotationControl();
});
heroRotate.addEventListener('click', () => viewer.contentDocument?.getElementById('autoRotateButton')?.click());
syncRotationControl();

function reconcileFeaturedScene() {
 const id=viewer.contentWindow?.__GALLERY_PAYLOAD__?.cards[0]?.id;
 if(!scenes[id])return;
 selectedScene=id;showSceneLabels(id);viewer.style.visibility='';document.getElementById('featured-loading').hidden=true;
}
viewer.addEventListener('load',reconcileFeaturedScene);
window.addEventListener('pageshow',reconcileFeaturedScene);
