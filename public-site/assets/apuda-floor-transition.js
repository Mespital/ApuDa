(function (global) {
  'use strict';
  var ROOMS = {
    1: { x: 525, y: 741, w: 647, h: 143 },
    2: { x: 525, y: 602, w: 647, h: 131 },
    3: { x: 525, y: 461, w: 647, h: 128 },
    4: { x: 525, y: 306, w: 647, h: 138 },
    5: { x: 525, y: 157, w: 647, h: 139 }
  };
  function projectFloors(size) {
    var sourceWidth = size.mobile ? 775 : 1672;
    var scale = (size.mobile ? Math.min : Math.max)(size.width / sourceWidth, size.height / 941);
    var ox = (size.width - sourceWidth * scale) / 2;
    var oy = (size.height - 941 * scale) / 2;
    var floors = {};
    Object.keys(ROOMS).forEach(function (floor) {
      var room = ROOMS[floor];
      floors[floor] = {
        x: ((room.x - (size.mobile ? 444 : 0)) * scale + ox) / size.width * 100,
        y: (room.y * scale + oy) / size.height * 100,
        w: room.w * scale / size.width * 100,
        h: room.h * scale / size.height * 100
      };
    });
    return floors;
  }
  function cameraPose(size, room) {
    var scale = size.mobile ? 1.92 : 2.12;
    var targetX = size.viewportWidth * (size.mobile ? .5 : .36);
    var targetY = size.viewportHeight * (size.mobile ? .42 : .5);
    return {
      scale: scale,
      x: targetX - size.left - size.width / 2 - ((room.x + room.w / 2) / 100 - .5) * size.width * scale,
      y: targetY - size.top - size.height / 2 - ((room.y + room.h / 2) / 100 - .5) * size.height * scale
    };
  }
  function mount(options) {
    var frame = options.frame, panel = options.panel, gsap = global.gsap;
    var timeline = null, generation = 0, lastSettings = null;
    function readPose(room) {
      return cameraPose({ mobile: matchMedia('(max-width:860px)').matches,
        width: frame.clientWidth, height: frame.clientHeight, left: frame.offsetLeft, top: frame.offsetTop,
        viewportWidth: innerWidth, viewportHeight: innerHeight }, room);
    }
    function begin() {
      ++generation;
      if (timeline) timeline.kill();
      gsap.killTweensOf([frame, panel, options.spot, options.sweep, options.guide, options.hint, options.footer].concat(options.controls));
      return generation;
    }
    function guard(token, callback) {
      return function () { if (generation === token && callback) callback(); };
    }
    function open(settings) {
      lastSettings = settings;
      var token = begin(), quiet = matchMedia('(prefers-reduced-motion: reduce)').matches || !!(global.ApuDaPreferences && global.ApuDaPreferences.isQuiet());
      var mobile = matchMedia('(max-width:860px)').matches;
      var pose = readPose(settings.room);
      var revealAt = quiet ? 0 : (settings.first ? .58 : .4);
      document.body.classList.add('floor-entering');
      frame.dataset.floorTransition = 'entering';
      panel.inert = true; panel.setAttribute('aria-hidden', 'true'); panel.classList.remove('live');
      gsap.set(frame, { transformOrigin: '50% 50%', xPercent: 0, yPercent: 0, filter: 'none' });
      timeline = gsap.timeline();
      timeline.to(frame, { x: pose.x, y: pose.y, scale: pose.scale, rotationX: 0, rotationY: 0,
        duration: quiet ? 0 : .72, ease: 'power3.inOut' }, 0)
        .to(options.spot, { opacity: .85, duration: quiet ? 0 : .22 }, 0)
        .to(options.guide, { opacity: 0, x: -28, pointerEvents: 'none', duration: quiet ? 0 : .2 }, 0)
        .to([options.hint, options.footer], { opacity: 0, duration: quiet ? 0 : .18 }, 0);
      if (!quiet) timeline.fromTo(options.sweep, { xPercent: -60, opacity: 0 },
        { xPercent: 24, opacity: .27, duration: .38, ease: 'power2.inOut' }, .08)
        .to(options.sweep, { opacity: 0, duration: .14 }, .46);
      if (!settings.first) timeline.to(panel, { opacity: 0, scale: .975, duration: quiet ? 0 : .12 }, 0);
      timeline.fromTo(panel, { x: 0, y: 24, xPercent: mobile ? -50 : 0, yPercent: -50, opacity: 0, scale: .955 },
        { x: 0, y: 0, xPercent: mobile ? -50 : 0, yPercent: -50, opacity: 1, scale: 1,
          duration: quiet ? 0 : .36, ease: 'power2.out', immediateRender: false,
          onStart: guard(token, function () {
            panel.inert = false; panel.setAttribute('aria-hidden', 'false'); panel.classList.add('live');
            if (settings.onReveal) settings.onReveal();
          }),
          onComplete: guard(token, function () {
            document.body.classList.remove('floor-entering'); frame.dataset.floorTransition = 'open';
            if (settings.onComplete) settings.onComplete();
          }) }, revealAt)
        .to(options.controls, { opacity: 1, duration: quiet ? 0 : .18 }, revealAt);
      if (quiet) timeline.progress(1);
    }
    function close(settings) {
      var token = begin(), quiet = matchMedia('(prefers-reduced-motion: reduce)').matches || !!(global.ApuDaPreferences && global.ApuDaPreferences.isQuiet());
      document.body.classList.remove('floor-entering'); frame.dataset.floorTransition = 'leaving';
      panel.inert = true; panel.setAttribute('aria-hidden', 'true'); panel.classList.remove('live');
      timeline = gsap.timeline({ onComplete: guard(token, function () {
        frame.dataset.floorTransition = 'idle'; if (settings.onComplete) settings.onComplete();
      }) });
      timeline.to(panel, { y: 18, opacity: 0, scale: .975, duration: quiet ? 0 : .2, ease: 'power2.in' }, 0)
        .to(options.controls, { opacity: 0, duration: quiet ? 0 : .18 }, 0)
        .to([options.spot, options.sweep], { opacity: 0, duration: quiet ? 0 : .2 }, 0)
        .to(frame, { x: 0, xPercent: 0, y: 0, yPercent: 0, scale: 1, rotationX: 0, rotationY: 0,
          duration: quiet ? 0 : .55, ease: 'power3.inOut' }, 0)
        .to(options.guide, { opacity: 1, x: 0, pointerEvents: 'auto', duration: quiet ? 0 : .3 }, quiet ? 0 : .18)
        .to([options.hint, options.footer], { opacity: 1, duration: quiet ? 0 : .3 }, quiet ? 0 : .18);
      if (quiet) timeline.progress(1);
    }
    function reflow(room) {
      if (frame.dataset.floorTransition === 'entering' && lastSettings) {
        open(Object.assign({}, lastSettings, { room: room }));
      } else if (frame.dataset.floorTransition === 'open') {
        var pose = readPose(room);
        gsap.set(frame, { x: pose.x, y: pose.y, scale: pose.scale });
        gsap.set(panel, { x: 0, y: 0, xPercent: matchMedia('(max-width:860px)').matches ? -50 : 0, yPercent: -50 });
      }
    }
    return Object.freeze({ open: open, close: close, reflow: reflow });
  }
  global.ApuDaFloorTransition = Object.freeze({ mount: mount, projectFloors: projectFloors, cameraPose: cameraPose });
})(window);

