(function (global) {
  'use strict';
  var NS = 'http://www.w3.org/2000/svg';
  var SOURCE = '/assets/video/apuda-monitor-atlas-98ff1ff3beaa.mp4';
  var TOPICS = ['breast','lung','stomach','colorectal','thyroid','kidney','prostate','pancreas','biliary','liver','lymphoma','cervical'];
  // Inner screen corners and foreground silhouettes, in the original master artwork.
  var SCREENS = [
    { floor: 1, tl:[849,758], tr:[978,765], bl:[849,824], heads:[[899,811,17,18]], bodies:['885,823 916,823 926,847 880,847'] },
    { floor: 2, tl:[892,630], tr:[1025,638], bl:[892,693], heads:[[930,667,17,20],[990,674,16,19]], bodies:['916,681 947,681 959,711 909,711','975,686 1007,686 1019,719 969,719'] },
    { floor: 3, tl:[907,490], tr:[1016,490], bl:[907,545], heads:[[897,528,16,19],[1002,528,17,20]], bodies:['884,540 914,540 927,572 879,572','987,542 1019,542 1032,578 981,578'] },
    { floor: 4, tl:[859,346], tr:[1010,340], bl:[859,407], heads:[[844,386,16,19]], bodies:['831,398 861,398 879,432 825,432'] },
    { floor: 5, tl:[886,201], tr:[1013,194], bl:[886,261], heads:[[857,231,16,19],[964,235,18,20]], bodies:['844,245 873,245 887,279 836,279','949,249 982,249 994,282 942,282'] }
  ];
  function svg(name, attributes) {
    var element = document.createElementNS(NS, name);
    Object.keys(attributes || {}).forEach(function (key) { element.setAttribute(key, attributes[key]); });
    return element;
  }
  function mount(options) {
    var frame = options && options.frame;
    if (!frame || frame.querySelector('.building-monitor-scene')) return null;
    var mobile = matchMedia('(max-width:860px)');
    var motion = matchMedia('(prefers-reduced-motion: reduce)');
    var reduced = motion.matches, lowData = !!(navigator.connection && navigator.connection.saveData);
    var running = false, suspended = true, pending = false, generation = 0, callback = null, useVideoCallback = false;
    var lastDraw = -Infinity, drawCount = 0, surfaces = [], links = [];
    var scene = svg('svg', { 'class': 'building-monitor-scene', 'aria-hidden': 'true', focusable: 'false', preserveAspectRatio: 'xMidYMid slice' });
    var definitions = svg('defs'); scene.appendChild(definitions);
    var video = document.createElement('video');
    video.className = 'building-monitor-source'; video.id = 'buildingMonitorSource';
    video.muted = true; video.defaultMuted = true; video.loop = true; video.playsInline = true;
    video.preload = 'none'; video.tabIndex = -1; video.disablePictureInPicture = true;
    video.setAttribute('muted',''); video.setAttribute('playsinline',''); video.setAttribute('aria-hidden','true');
    SCREENS.forEach(function (screen, index) {
      var mask = svg('mask', { id: 'apuda-monitor-mask-' + screen.floor, maskUnits: 'userSpaceOnUse', x:'0', y:'0', width:'1672', height:'941' });
      mask.appendChild(svg('rect', { width:'1672', height:'941', fill:'white' }));
      screen.heads.forEach(function (head) { mask.appendChild(svg('ellipse', { cx:head[0], cy:head[1], rx:head[2], ry:head[3], fill:'black' })); });
      screen.bodies.forEach(function (points) { mask.appendChild(svg('polygon', { points:points, fill:'black' })); });
      definitions.appendChild(mask);
      var occluded = svg('g', { mask:'url(#apuda-monitor-mask-' + screen.floor + ')' });
      var a=(screen.tr[0]-screen.tl[0])/320, b=(screen.tr[1]-screen.tl[1])/320;
      var c=(screen.bl[0]-screen.tl[0])/180, d=(screen.bl[1]-screen.tl[1])/180;
      var plane = svg('g', { transform:'matrix(' + [a,b,c,d,screen.tl[0],screen.tl[1]].join(',') + ')' });
      var portal = svg('foreignObject', { width:'320', height:'180' });
      var canvas = document.createElement('canvas'); canvas.width=320; canvas.height=180;
      canvas.className='building-monitor-canvas'; canvas.dataset.monitorFloor=String(screen.floor);
      var context=canvas.getContext('2d', { alpha:false });
      if (context) { context.fillStyle='#153757'; context.fillRect(0,0,320,180); }
      portal.appendChild(canvas); plane.appendChild(portal);
      plane.appendChild(svg('rect', { width:'320', height:'180', fill:'#fff', opacity:'.04' }));
      occluded.appendChild(plane); scene.appendChild(occluded);
      surfaces.push({ context:context, tile:index });
      var link=document.createElement('a'); link.className='building-monitor-link';
      link.target='_blank'; link.rel='noopener noreferrer'; link.dataset.monitorFloor=String(screen.floor);
      link.addEventListener('click',function(event){event.stopPropagation();});
      frame.appendChild(link); links.push({ element:link, screen:screen, tile:index, slug:null });
    });
    frame.appendChild(video); frame.appendChild(scene);
    function updateTopics() {
      var seconds=isFinite(video.currentTime)?video.currentTime:0;
      links.forEach(function (item) {
        var slug=TOPICS[(Math.floor(seconds/2)+item.tile*2)%TOPICS.length];
        if (slug===item.slug) return;
        item.slug=slug;
        var list=global.ApuDaCancerVideos ? global.ApuDaCancerVideos.items(slug) : [];
        if (!list.length) return;
        item.element.href='https://youtu.be/'+list[0].id;
        item.element.setAttribute('aria-label',item.screen.floor+'층 모니터 · '+list[0].name+' 영상 크게 보기 · YouTube 새 창');
        item.element.setAttribute('title',list[0].name+' 영상 크게 보기 ↗');
        item.element.dataset.cancer=slug;
      });
    }
    function syncViewport() {
      scene.setAttribute('viewBox',mobile.matches?'444 0 775 941':'0 0 1672 941');
      var width=frame.clientWidth, height=frame.clientHeight, sourceWidth=mobile.matches?775:1672;
      if (!width || !height) return;
      var scale=(mobile.matches?Math.min:Math.max)(width/sourceWidth,height/941);
      var ox=(width-sourceWidth*scale)/2, oy=(height-941*scale)/2;
      links.forEach(function (item) {
        var s=item.screen, left=(s.tl[0]-(mobile.matches?444:0))*scale+ox;
        item.element.style.left=left+'px'; item.element.style.top=(Math.min(s.tl[1],s.tr[1])*scale+oy)+'px';
        item.element.style.width=((s.tr[0]-s.tl[0])*scale)+'px';
        item.element.style.height=((s.bl[1]-Math.min(s.tl[1],s.tr[1]))*scale)+'px';
      });
    }
    syncViewport(); updateTopics();
    mobile.addEventListener('change',syncViewport); global.addEventListener('resize',syncViewport);
    function allowed() { return !suspended && !reduced && !lowData && !document.hidden; }
    function cancelFrame() {
      if (callback===null) return;
      if (useVideoCallback) video.cancelVideoFrameCallback(callback); else global.cancelAnimationFrame(callback);
      callback=null;
    }
    function draw(timestamp) {
      callback=null;
      if (!running || !allowed()) return;
      if (video.readyState>=2 && timestamp-lastDraw>=75) {
        lastDraw=timestamp;
        try {
          surfaces.forEach(function (surface) { if(surface.context)surface.context.drawImage(video,surface.tile*320,0,320,180,0,0,320,180); });
          ++drawCount; frame.dataset.monitorFrames=String(drawCount); updateTopics();
          frame.classList.add('monitor-playing'); frame.dataset.buildingMonitors='playing';
        } catch (error) { frame.classList.remove('monitor-playing'); }
      }
      schedule();
    }
    function schedule() {
      if (!running || !allowed() || callback!==null) return;
      useVideoCallback=typeof video.requestVideoFrameCallback==='function' && typeof video.cancelVideoFrameCallback==='function';
      var token=generation;
      var tick=function(timestamp){if(token===generation)draw(timestamp);};
      callback=useVideoCallback?video.requestVideoFrameCallback(tick):global.requestAnimationFrame(tick);
    }
    function resume() {
      suspended=false;
      if (!allowed() || pending) return;
      if (running) { schedule(); return; }
      var token=++generation; pending=true;
      if (!video.getAttribute('src')) {video.src=SOURCE;video.load();}
      var promise;
      try { promise=video.play(); } catch(error) {pending=false;return;}
      Promise.resolve(promise).then(function(){
        if(token!==generation)return;
        pending=false;
        if(!allowed()){video.pause();return;}
        running=true;frame.dataset.buildingMonitors='playing';schedule();
      }).catch(function(){
        if(token!==generation)return;
        pending=false;running=false;frame.dataset.buildingMonitors='still';
      });
    }
    function suspend() {
      suspended=true;++generation;pending=false;running=false;cancelFrame();video.pause();
      frame.dataset.buildingMonitors='paused';
    }
    motion.addEventListener('change',function(event){reduced=event.matches;if(reduced)suspend();else if(!suspended)resume();});
    video.addEventListener('error',function(){suspend();frame.classList.remove('monitor-playing');frame.dataset.buildingMonitors='still';});
    frame.dataset.buildingMonitors='still';
    return Object.freeze({resume:resume,suspend:suspend});
  }
  global.ApuDaBuildingMonitors=Object.freeze({mount:mount});
})(window);
