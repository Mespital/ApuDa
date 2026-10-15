const fs = require('fs');
const vm = require('vm');
const assert = require('assert');
const source = fs.readFileSync(require('path').resolve(__dirname,'../../public-site/assets/apuda-building-life.js'), 'utf8');
const settle = () => new Promise(resolve => setImmediate(resolve));
function setup({ reduced = false, saveData = false, mobile = false, deferredPlay = false } = {}) {
  const allAnimations = [], plays = [], listeners = {}, queries = {};
  class Element {
    constructor(tag) {
      this.tag = tag; this.children = []; this.attrs = {}; this.style = {}; this.dataset = {};
      const classes = new Set();
      this.classList = { add: (...items) => items.forEach(x => classes.add(x)), remove: x => classes.delete(x), contains: x => classes.has(x), toggle: (x, on) => { if (on) classes.add(x); else classes.delete(x); } };
      this.paused = true; this.pauseCount = 0;
    }
    setAttribute(key, value) { this.attrs[key] = String(value); }
    getAttribute(key) { return this.attrs[key] || null; }
    appendChild(child) { this.children.push(child); return child; }
    querySelector(selector) { return this.children.find(x => (x.attrs.class || x.className || '').split(' ').includes(selector.slice(1))) || null; }
    addEventListener(type, handler) { this[type + 'Handler'] = handler; }
    load() { this.loaded = true; }
    set src(value) { this.attrs.src = value; }
    get src() { return this.attrs.src; }
    pause() { this.paused = true; this.pauseCount++; }
    play() {
      this.paused = false;
      let resolve, reject;
      const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
      plays.push({ resolve, reject });
      if (!deferredPlay) resolve();
      return promise;
    }
    animate(keyframes, options) {
      let resolve, reject;
      const finished = new Promise((yes, no) => { resolve = yes; reject = no; });
      finished.catch(() => {});
      const animation = { keyframes, options, finished, playState: 'running', resolve,
        cancel() { this.playState = 'idle'; reject(new Error('cancelled')); },
        pause() { this.playState = 'paused'; }, play() { this.playState = 'running'; } };
      allAnimations.push(animation); return animation;
    }
  }
  const frame = new Element('frame');
  const document = { hidden: false, createElement: tag => new Element(tag), createElementNS: (_, tag) => new Element(tag), addEventListener: (type, callback) => { listeners[type] = callback; } };
  const context = { window: {}, document, navigator: { connection: { saveData } }, Promise,
    matchMedia(query) { return queries[query] = { matches: query.includes('reduced-motion') ? reduced : mobile, addEventListener(_, callback) { this.change = callback; } }; } };
  vm.runInNewContext(source, context);
  const life = context.window.ApuDaBuildingLife.mount({ frame });
  const video = frame.children.find(x => x.tag === 'video');
  const scene = frame.children.find(x => x.tag === 'svg');
  return { frame, life, video, scene, allAnimations, plays, document, listeners, queries,
    async lightUp() { life.start(); allAnimations.forEach(x => x.resolve()); await settle(); await settle(); } };
}
(async () => {
  const normal = setup();
  normal.life.start();
  assert.equal(normal.frame.dataset.buildingLightPhase, 'warming');
  assert.equal(normal.plays.length, 0, 'Do not download/play before lights finish');
  assert.deepEqual(normal.allAnimations.filter((_, i) => i % 2 === 0).map(x => x.options.delay), [180, 730, 1280, 1830, 2380]);
  normal.allAnimations.forEach(x => x.resolve()); await settle(); await settle();
  assert.equal(normal.frame.dataset.buildingLightPhase, 'ready');
  assert.equal(normal.frame.dataset.buildingLife, 'playing');
  assert.equal(normal.video.muted, true); assert.equal(normal.video.loop, true); assert.equal(normal.video.preload, 'none');
  assert.equal(normal.frame.children.filter(x => x.tag === 'video').length, 1);
  normal.document.hidden = true; normal.listeners.visibilitychange();
  assert.equal(normal.video.paused, true);
  normal.document.hidden = false; normal.listeners.visibilitychange(); await settle();
  assert.equal(normal.frame.dataset.buildingLife, 'playing');
  normal.life.suspend(); assert.equal(normal.video.paused, true);
  normal.document.hidden = true; normal.listeners.visibilitychange();
  normal.document.hidden = false; normal.listeners.visibilitychange(); await settle();
  assert.equal(normal.frame.classList.contains('life-paused'), true, 'Returning to an open detail window must keep the building motion paused');
  assert.equal(normal.video.paused, true);
  normal.life.resume(); await settle(); assert.equal(normal.frame.dataset.buildingLife, 'playing');
  const quiet = setup({ reduced: true }); quiet.life.start(); await settle();
  assert.equal(quiet.frame.dataset.buildingLightPhase, 'ready'); assert.equal(quiet.allAnimations.length, 0); assert.equal(quiet.video.src, undefined);
  const saver = setup({ saveData: true }); await saver.lightUp();
  assert.equal(saver.frame.dataset.buildingLightPhase, 'ready'); assert.equal(saver.video.src, undefined);
  const portrait = setup({ mobile: true }); assert.equal(portrait.scene.getAttribute('viewBox'), '444 0 775 941');
  const denied = setup({ deferredPlay: true }); await denied.lightUp(); denied.plays[0].reject(new Error('NotAllowedError')); await settle();
  assert.equal(denied.frame.dataset.buildingLife, 'still'); assert.equal(denied.frame.classList.contains('life-playing'), false);
  const race = setup({ deferredPlay: true }); await race.lightUp();
  race.life.suspend(); race.life.resume(); const pauses = race.video.pauseCount;
  race.plays[1].resolve(); await settle(); race.plays[0].resolve(); await settle();
  assert.equal(race.video.pauseCount, pauses, 'An obsolete play promise must not pause resumed playback');
  assert.equal(race.frame.dataset.buildingLife, 'playing');
  assert.equal(normal.frame.classList.contains('life-playing'), true, 'Keep the exact last video frame while the detail window is open');
  function flatten(e) { return [e].concat(e.children.flatMap(flatten)); }
  const nodes=flatten(normal.frame);
  assert.equal(nodes.filter(e => /life-walker|life-resident/.test(e.attrs.class || '')).length,0, 'Keep only the original people in the building footage');
  assert.equal(nodes.filter(e => e.attrs.class === 'apuda-roof-letter').length,5);
  assert.equal(nodes.filter(e => e.attrs['data-walker-floor']).length,0, 'Do not add replacement people or chairs to any floor');
  assert(nodes.some(e => e.textContent === '아프지만, 다행이다.'));
  [normal,quiet,saver].forEach(state => {
    assert.equal(flatten(state.frame).filter(e => /apuda-(walk|sit)-cycle/.test(e.attrs.href || '')).length,0, 'Do not request the added-person sprite sheets');
  });
  assert.equal(normal.video.src, '/assets/video/building-life-91eb77cdc84a.mp4', 'Retain the original-building animation');
  console.log('PASS: original people only, no added chairs or sprite requests, 1F-to-5F timing, one decoder, reduced motion, data saver, visibility, detail navigation, rejected autoplay and playback races');
})().catch(error => { console.error(error); process.exitCode = 1; });
