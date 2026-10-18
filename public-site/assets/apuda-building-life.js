(function (global) {
  'use strict';
  var NS = 'http://www.w3.org/2000/svg';
  var VIDEO = '/assets/video/building-life-91eb77cdc84a.mp4';
  // Coordinates refer to the unchanged 1672 x 941 master image.
  var rooms = [
    { floor: 1, room: '525,742 1086,741 1172,752 1172,883 1086,879 525,832', ceiling: '541,745 1075,746', screen: [847,761,129,68] },
    { floor: 2, room: '526,602 1086,607 1171,619 1171,730 1086,715 526,702', ceiling: '541,606 1075,611', screen: [889,638,140,65] },
    { floor: 3, room: '526,461 1086,467 1171,481 1171,586 1086,576 526,580', ceiling: '541,466 1075,471', screen: [905,489,112,60] },
    { floor: 4, room: '526,321 1086,306 1171,327 1171,439 1086,428 526,443', ceiling: '541,327 1075,313', screen: [856,346,156,62] },
    { floor: 5, room: '526,184 1086,157 1171,179 1171,283 1086,273 526,295', ceiling: '541,189 1075,164', screen: [883,201,132,63] }
  ];
  function node(name, attrs) {
    var element = document.createElementNS(NS, name);
    Object.keys(attrs || {}).forEach(function (key) { element.setAttribute(key, attrs[key]); });
    return element;
  }
  function mount(options) {
    var frame = options && options.frame;
    if (!frame || frame.querySelector('.building-life-scene')) return null;
    var motion = matchMedia('(prefers-reduced-motion: reduce)');
    var mobile = matchMedia('(max-width:860px)');
    var lowData = !!(navigator.connection && navigator.connection.saveData);
    var reduced = motion.matches, userPaused=!!(global.ApuDaPreferences&&global.ApuDaPreferences.isQuiet()), videoOverlay=false;
    var started = false, complete = false, suspended = false, playPending = false;
    var generation = 0, animations = [], shades = [], ceiling = [], monitors = null;
    frame.classList.toggle('life-reduced', reduced);
    frame.classList.toggle('life-low-data', lowData);

    var video = document.createElement('video');
    video.className = 'building-life-media'; video.id = 'buildingLifeVideo';
    video.muted = true; video.defaultMuted = true; video.loop = true; video.playsInline = true;
    video.preload = 'none'; video.tabIndex = -1; video.disablePictureInPicture = true;
    video.setAttribute('muted', ''); video.setAttribute('playsinline', '');
    video.setAttribute('aria-hidden', 'true');
    frame.appendChild(video);

    var scene = node('svg', { 'class': 'building-life-scene', 'aria-hidden': 'true', 'focusable': 'false', 'preserveAspectRatio': 'xMidYMid slice' });
    var definitions = node('defs');
    var softLight = node('filter', { id: 'apuda-life-softlight', x: '-8%', y: '-160%', width: '116%', height: '420%' });
    softLight.appendChild(node('feGaussianBlur', { stdDeviation: '2.5' })); definitions.appendChild(softLight);
    var nightTint = node('filter', { id: 'apuda-life-night-tint', 'color-interpolation-filters': 'sRGB' });
    nightTint.appendChild(node('feColorMatrix', { type: 'saturate', values: '.68' }));
    var transfer = node('feComponentTransfer');
    transfer.appendChild(node('feFuncR', { type: 'linear', slope: '.23' }));
    transfer.appendChild(node('feFuncG', { type: 'linear', slope: '.28' }));
    transfer.appendChild(node('feFuncB', { type: 'linear', slope: '.35' }));
    nightTint.appendChild(transfer); definitions.appendChild(nightTint);
    var roomMask = node('mask', { id: 'apuda-life-room-mask', maskUnits: 'userSpaceOnUse', maskContentUnits: 'userSpaceOnUse', x: '0', y: '0', width: '1672', height: '941' });
    definitions.appendChild(roomMask); scene.appendChild(definitions);
    var nightPhoto = node('image', { 'class': 'life-night-photo', y: '0', height: '941', filter: 'url(#apuda-life-night-tint)', mask: 'url(#apuda-life-room-mask)' });
    scene.appendChild(nightPhoto);
    rooms.forEach(function (room) {
      var shade = node('polygon', { 'class': 'life-room-shade', points: room.room, 'data-life-floor': room.floor });
      var light = node('polyline', { 'class': 'life-ceiling-light', points: room.ceiling });
      var screen = node('rect', { 'class': 'life-screen-light', x: room.screen[0], y: room.screen[1], width: room.screen[2], height: room.screen[3], rx: '3', style: '--screen-delay:' + (-room.floor * .83) + 's' });
      roomMask.appendChild(shade); scene.appendChild(light); scene.appendChild(screen);
      shades.push(shade); ceiling.push(light);
    });
    frame.appendChild(scene);
    // The two-line wordmark is real text, independent of the photo/video lettering.
    var sign = node('svg', { 'class': 'apuda-rooftop-sign', role: 'img', 'aria-label': 'ApuDa — 아프지만, 다행이다.', focusable: 'false', preserveAspectRatio: 'xMidYMid slice' });
    var signDefs = node('defs');
    var panelFinish = node('linearGradient', { id: 'apuda-sign-ivory', x1: '0', y1: '0', x2: '0', y2: '1' });
    panelFinish.appendChild(node('stop', { offset: '0', 'stop-color': '#fefefd' }));
    panelFinish.appendChild(node('stop', { offset: '1', 'stop-color': '#efefeb' }));
    signDefs.appendChild(panelFinish); sign.appendChild(signDefs);
    sign.appendChild(node('polygon', { points: '956,7 1033,32 1033,46 956,21', fill: '#f7f8f5', stroke: '#d8dfdf', 'stroke-width': '1' }));
    var face = node('g', { transform: 'matrix(1,-.092,0,1,758,25)' });
    face.appendChild(node('rect', { x: '0', y: '0', width: '198', height: '94', fill: 'url(#apuda-sign-ivory)', stroke: '#d1d7d9', 'stroke-width': '1.3' }));
    face.appendChild(node('path', { d: 'M2 92V2H196', fill: 'none', stroke: '#fff', 'stroke-width': '2' }));
    'ApuDa'.split('').forEach(function (letter, index) {
      var position = node('g', { transform: 'translate(' + [23,57,84,112,146][index] + ',0)' });
      var moving = node('g', { 'class': 'apuda-roof-letter', style: '--letter-delay:' + (index * .16) + 's' });
      var text = node('text', { x: '0', y: '49', 'class': 'apuda-roof-brand' });
      text.textContent = letter; moving.appendChild(text); position.appendChild(moving); face.appendChild(position);
    });
    var tagline = node('text', { x: '99', y: '73', 'text-anchor': 'middle', 'class': 'apuda-roof-tagline' });
    tagline.textContent = '아프지만, 다행이다.'; face.appendChild(tagline);
    sign.appendChild(face); frame.appendChild(sign);

    function syncViewport() {
      scene.setAttribute('viewBox', mobile.matches ? '444 0 775 941' : '0 0 1672 941');
      sign.setAttribute('viewBox', mobile.matches ? '444 0 775 941' : '0 0 1672 941');
      nightPhoto.setAttribute('x', mobile.matches ? '444' : '0');
      nightPhoto.setAttribute('width', mobile.matches ? '775' : '1672');
      nightPhoto.setAttribute('href', mobile.matches ? '/assets/image/building-mobile-home-v2.png' : '/assets/image/building-master.png');
    }
    syncViewport(); mobile.addEventListener('change', syncViewport);
    if(global.ApuDaBuildingMonitors)monitors=global.ApuDaBuildingMonitors.mount({frame:frame});
    frame.dataset.buildingLightPhase = reduced ? 'ready' : 'dark';
    frame.dataset.buildingLife = 'still';

    function play() {
      if (!complete || suspended || reduced || userPaused || videoOverlay || lowData || document.hidden || playPending) return;
      if (!monitors && global.ApuDaBuildingMonitors) monitors = global.ApuDaBuildingMonitors.mount({ frame: frame });
      if (monitors) monitors.resume();
      var token = ++generation;
      if (!video.getAttribute('src')) { video.src = VIDEO; video.load(); }
      playPending = true;
      var promise;
      try { promise = video.play(); } catch (error) { playPending = false; return; }
      Promise.resolve(promise).then(function () {
        if (token !== generation) return;
        playPending = false;
        if (suspended || reduced || userPaused || videoOverlay || document.hidden) { video.pause(); return; }
        frame.classList.remove('life-paused');
        frame.classList.add('life-playing'); frame.dataset.buildingLife = 'playing';
      }).catch(function () {
        if (token !== generation) return;
        playPending = false;
        frame.classList.remove('life-playing'); frame.dataset.buildingLife = 'still';
      });
    }
    function pause() {
      ++generation; playPending = false; video.pause();
      if (monitors) monitors.suspend();
      frame.classList.add('life-paused');
      frame.dataset.buildingLife = 'paused';
    }
    function finish(allowPlay) {
      animations.forEach(function (animation) { animation.cancel(); }); animations = [];
      shades.forEach(function (shade) { shade.style.opacity = '0'; });
      ceiling.forEach(function (light) { light.style.opacity = reduced ? '0' : '.065'; });
      complete = true; frame.classList.add('life-lit'); frame.dataset.buildingLightPhase = 'ready';
      if (allowPlay !== false) play();
    }
    function start() {
      if (started || suspended) return;
      started = true;
      if (reduced || userPaused || !shades[0].animate) { finish(); return; }
      frame.dataset.buildingLightPhase = 'warming';
      var sequence = shades.map(function (shade, index) {
        var delay = 180 + index * 550;
        var light = shade.animate([{ opacity: .94 }, { opacity: .66, offset: .35 }, { opacity: 0 }], { delay: delay, duration: 1450, easing: 'cubic-bezier(.22,.61,.36,1)', fill: 'forwards' });
        var glow = ceiling[index].animate([{ opacity: 0 }, { opacity: .48, offset: .5 }, { opacity: .065 }], { delay: delay, duration: 1600, easing: 'ease-in-out', fill: 'forwards' });
        animations.push(light, glow);
        return glow.finished;
      });
      if (document.hidden) animations.forEach(function (animation) { animation.pause(); });
      Promise.allSettled(sequence).then(function () { if (!complete && !suspended) finish(); });
    }
    function suspend() { suspended = true; started = true; finish(false); pause(); }
    function resume() { suspended = false; syncViewport(); if (!document.hidden && !userPaused && !videoOverlay) frame.classList.remove('life-paused'); if (!started) start(); else play(); }
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) { animations.forEach(function (animation) { animation.pause(); }); pause(); }
      else { if (!suspended && !userPaused && !videoOverlay) { frame.classList.remove('life-paused'); animations.forEach(function (animation) { if (animation.playState === 'paused') animation.play(); }); } play(); }
    });
    motion.addEventListener('change', function (event) {
      reduced = event.matches;
      frame.classList.toggle('life-reduced', reduced);
      if (reduced) { finish(false); pause(); } else { finish(); }
    });
    video.addEventListener('error', function () {
      ++generation; playPending = false; video.pause();
      frame.classList.remove('life-playing'); frame.dataset.buildingLife = 'still';
      if (!suspended && !reduced && !document.hidden) frame.classList.remove('life-paused');
    });
    if(global.addEventListener){
      global.addEventListener('apuda:video-state',function(e){videoOverlay=!!(e.detail&&e.detail.open);if(videoOverlay)pause();else play();});
      global.addEventListener('apuda:preferences-change',function(e){userPaused=!!(e.detail&&e.detail.quiet);if(userPaused){finish(false);pause();}else play();});
    }
    if (reduced || userPaused) finish(false);
    return Object.freeze({ start: start, suspend: suspend, resume: resume });
  }
  global.ApuDaBuildingLife = Object.freeze({ mount: mount });
})(window);




