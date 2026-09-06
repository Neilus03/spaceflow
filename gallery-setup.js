'use strict';
const params = new URLSearchParams(location.search);
if (params.get('embed') === '1') {
  document.documentElement.classList.add('embedded');
  const selected = window.__GALLERY_PAYLOAD__.cards.find(card => card.id === params.get('scene')) || window.__GALLERY_PAYLOAD__.cards.find(card => card.id === 'scene-009');
  window.__GALLERY_PAYLOAD__.cards = [selected];
  window.__GALLERY_PAYLOAD__.sceneCount = 1;
  window.__GALLERY_PAYLOAD__.assets = Object.fromEntries([selected.inputKey, selected.outputKey].map(key => [key, window.__GALLERY_PAYLOAD__.assets[key]]));
}
