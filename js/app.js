/* ==========================================================================
   Alternatives to rare-earth permanent-magnet motors — interactive labs.

   One IIFE, one module per lab. Each module owns its slice of state and
   drives the DOM directly (setAttribute / textContent / style.left) the way
   the design's paint functions do. No framework, no build step.
   ========================================================================== */

(function () {
  'use strict';

  /* ------------------------------------------------------------ options -- */

  var OPTIONS = {
    animateLabs: true,
    showRealityLabels: true
  };

  /* --------------------------------------------------------------- data -- */

  var STEPS = [
    { kicker: 'M.01 · Structure', title: 'Housing and cooling jacket', body: 'The housing bolts into the vehicle and keeps the motor aligned. Channels in or around it carry coolant past the stator, where much of the heat is produced.' },
    { kicker: 'M.02 · Support', title: 'Bearings and shaft', body: 'Two bearings hold the shaft on a precise axis while allowing it to turn. The rotor is fixed to the shaft, so electromagnetic torque leaves the motor as mechanical rotation.' },
    { kicker: 'M.03 · Magnetic path', title: 'Laminated stator steel', body: 'The stator is built from thin sheets of electrical steel. Steel guides magnetic flux. Splitting the core into insulated laminations limits circulating currents that would otherwise become heat.' },
    { kicker: 'M.04 · Electrical input', title: 'Three groups of copper windings', body: 'The inverter does not send one steady current into the motor. It varies current through phases A, B and C in sequence. Each phase magnetises a different set of stator teeth.' },
    { kicker: 'M.05 · Moving core', title: 'Rotor and air gap', body: 'The rotor turns inside the stator. A very narrow air gap prevents contact while allowing magnetic flux to cross. A larger gap weakens magnetic coupling; a smaller one demands tighter manufacturing tolerances.' },
    { kicker: 'M.06 · Supply exposure', title: 'Permanent magnets inside the rotor', body: 'In an interior PMSM, shaped NdFeB magnets sit in pockets within the rotor steel. They create a strong rotor field without wires or current on the rotor. This helps the motor remain compact and limits rotor heating.' },
    { kicker: 'M.07 · Operation', title: 'The assembled machine', body: 'The inverter energises the stator, its field turns, and the magnetised rotor turns with it. The cooling jacket removes losses while the shaft carries useful torque to the gearbox or wheels.' }
  ];

  var LESSONS = [
    { title: 'Phase A magnetises one pair of stator poles', copy: 'Positive current in one side of the winding and return current in the opposite side create a north-south magnetic axis across the motor.', watch: 'The phase A coil pair is strongest. Its opposite sides form the current path across the stator.', angle: 0 },
    { title: 'Current moves from one phase to the next', copy: 'Phase A has not switched off before phase B begins to carry more current. Their fields add together, so the strongest magnetic direction sits between the two coil axes.', watch: 'Advance the electrical angle. The coil colours change continuously because each current rises and falls as a wave.', angle: 45 },
    { title: 'The combined magnetic direction travels around the stator', copy: 'At every instant, the three phase fields add to one dominant axis. Repeating the current sequence moves that axis through a full turn.', watch: 'The gold vector is the combined result of all three phase currents, not a separate physical part.', angle: 100 },
    { title: 'Permanent magnets give the rotor its own poles', copy: 'The embedded magnets supply a north-south rotor axis without electrical current on the rotor. The stator field pulls that axis around synchronously.', watch: 'The maroon rotor direction remains tied to the magnets while the whole rotor turns with the stator field.', angle: 155 },
    { title: 'A controlled angle between the fields produces torque', copy: 'Under load, the rotor axis trails the stator axis. The controller holds a useful torque angle while both continue to turn at the same speed.', watch: 'Increase shaft load. The angular separation grows, but the rotor does not fall behind in rotational speed.', angle: 210 }
  ];

  var ARCH_KEYS = ['pmsm', 'wound', 'induction', 'synrm', 'srm'];

  var ARCH = {
    pmsm: { principle: 'Permanent field in the rotor', kicker: 'Reference architecture', name: 'Permanent-magnet synchronous motor', description: 'The rotor contains permanent magnetic poles. The rotating stator field pulls those poles around at exactly the same speed. Because the rotor needs no electrical connection and produces little electrical loss, the machine can be compact and efficient.', replacement: 'Nothing in the reference machine. NdFeB magnets create the rotor field.', heat: 'Mostly in stator copper and steel. Field weakening can add stator current at high speed.', evidence: 'Broad use in current electric vehicles.', watch: 'The permanent poles rotate in step with the stator field. The small angular separation represents load.', relation: 'Same speed', rotorRatio: 1, fieldRatio: 1 },
    wound: { principle: 'Direct current creates the rotor field', kicker: 'Rare-earth-free, series production', name: 'Wound-field synchronous motor', description: 'Copper windings on the rotor become an electromagnet when supplied with direct current. The motor remains synchronous: its rotor and stator field turn at the same speed. The controller can vary the rotor field, which is useful at high speed, but the machine must deliver power to a moving winding.', replacement: 'A copper rotor winding, supplied through contacts or a contactless exciter.', heat: 'The rotor winding and excitation hardware add electrical loss and cooling demand.', evidence: 'Renault and BMW use wound-field motors in production vehicles.', watch: 'Gold current markers pulse through the rotor winding as the excitation current is supplied to a moving part.', relation: 'Same speed', rotorRatio: 1, fieldRatio: 1 },
    induction: { principle: 'The stator field induces rotor current', kicker: 'Rare-earth-free, series production', name: 'Induction motor', description: 'The rotor contains conductive bars joined by end rings. A moving stator field cuts across those conductors and induces current in them. That current produces the rotor field. Induction requires a speed difference, so the mechanical rotor turns slightly slower than the stator field under load.', replacement: 'A conductive cage, usually aluminium or copper, embedded in the rotor.', heat: 'Induced current heats the rotor. Cooling that moving heat source is an important design task.', evidence: 'Used in production EVs, including specified Tesla variants.', watch: 'The gold field indicator moves ahead of the rotor. Pulses appear in cage bars as the relative motion induces current.', relation: 'Rotor slips', rotorRatio: 0.91, fieldRatio: 1 },
    synrm: { principle: 'The rotor offers an easier magnetic path', kicker: 'Mature in industry, developing in traction', name: 'Synchronous reluctance motor', description: 'Curved air barriers make the rotor conduct magnetic flux more easily along one axis than the other. The stator field pulls that preferred axis into alignment. There are no rotor magnets or electrical windings, and the rotor remains synchronous with the stator field.', replacement: 'Shaped flux barriers in a laminated steel rotor.', heat: 'Rotor electrical loss is low, but lower power factor can increase stator current and inverter demand.', evidence: 'Commercial industrial systems are established. Traction programmes are less mature.', watch: 'Teal flux paths bend through the solid steel between the barriers. The rotor rotates to keep that path aligned with the field.', relation: 'Same speed', rotorRatio: 1, fieldRatio: 1 },
    srm: { principle: 'Stator poles switch in sequence', kicker: 'Simple rotor, demanding acoustics', name: 'Switched reluctance motor', description: 'The controller energises one stator pole pair at a time. The toothed steel rotor moves towards the active poles because that position lowers magnetic reluctance. The next pair switches on before alignment, continuing the rotation. This architecture also changes the stator geometry.', replacement: 'A salient steel rotor and a stator with separately switched pole windings.', heat: 'The rotor carries little electrical heat. Pulsed stator current, torque ripple and acoustic noise need careful control.', evidence: 'Commercial in some applications; vehicle programmes remain at development or pilot stages.', watch: 'The active stator axis advances in steps. The rotor follows each new pole pair instead of carrying its own field.', relation: 'Pole by pole', rotorRatio: 1, fieldRatio: 1 }
  };

  var DUTY = {
    launch: { name: 'Pulling away', speed: 20, torque: 82 },
    cruise: { name: 'Steady cruise', speed: 48, torque: 24 },
    motorway: { name: 'Motorway', speed: 84, torque: 30 },
    grade: { name: 'Long climb', speed: 48, torque: 88 }
  };

  var APPS = {
    twoWheeler: { requirements: 'Low cost, compact packaging, frequent stop-start operation and straightforward service.', routes: 'Ferrite PM, switched reluctance and synchronous reluctance can be relevant when material security and cost matter more than passenger-car refinement.', evidence: 'Drive-cycle efficiency, low-speed torque, controller cost, noise, vibration and thermal limits in Indian ambient conditions.' },
    passenger: { requirements: 'High torque density, broad speed range, cabin refinement, fast acceleration and low drive-cycle energy use.', routes: 'Production wound-field and induction motors provide the clearest rare-earth-free evidence. Ferrite PM may fit when the package can absorb extra volume.', evidence: 'Vehicle-level range, continuous output, high-speed efficiency, coolant demand, acoustic behaviour and manufacturing yield.' },
    heavy: { requirements: 'Sustained torque, continuous thermal performance, durability and efficient operation at high vehicle mass.', routes: 'Wound-field and induction machines merit direct testing. Reluctance designs may become attractive where robust rotors and material security justify added control work.', evidence: 'Long-grade thermal tests, continuous ratings, inverter loading, rotor temperature, service life and efficiency under payload.' },
    industrial: { requirements: 'Long operating hours, predictable load profiles, reliability, maintainability and whole-life electricity cost.', routes: 'Synchronous reluctance is already commercial in industrial drive systems. Induction remains a well-established baseline.', evidence: 'System efficiency at the actual load profile, power factor, drive compatibility, bearing life, maintenance intervals and payback.' }
  };

  /* ------------------------------------------------------------ helpers -- */

  function q(root, sel) { return root ? root.querySelector(sel) : null; }
  function qa(root, sel) { return root ? Array.prototype.slice.call(root.querySelectorAll(sel)) : []; }
  function text(el, value) { if (el) el.textContent = value; }

  function reduced() {
    return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  function animate() { return OPTIONS.animateLabs && !reduced(); }

  function polar(a, r) {
    var t = a * Math.PI / 180;
    return { x: 240 + r * Math.cos(t), y: 240 + r * Math.sin(t) };
  }

  var visibilityHandlers = [];
  function onVisibility(fn) { visibilityHandlers.push(fn); }

  /* ======================================================== L.01 assembly */

  function assemblyLab(root) {
    if (!root) return;

    var tabs = qa(root, '[data-step]');
    var parts = {};
    qa(root, '[data-part]').forEach(function (el) { parts[el.getAttribute('data-part')] = el; });

    var kicker = q(root, '[data-step-kicker]');
    var title = q(root, '[data-step-title]');
    var body = q(root, '[data-step-body]');
    var count = q(root, '[data-stage-count]');
    var prev = q(root, '[data-step-prev]');
    var next = q(root, '[data-step-next]');

    var stage = 0;

    function set(el, transform, opacity) {
      if (!el) return;
      el.style.transform = transform;
      el.setAttribute('opacity', String(opacity));
    }

    function fade(el, opacity) { if (el) el.setAttribute('opacity', String(opacity)); }

    function off(visible, t) { return visible ? 'none' : t; }
    function op(visible, dim) { return visible ? 1 : dim; }

    function paint() {
      var step = STEPS[stage];

      tabs.forEach(function (tab, i) {
        tab.classList.toggle('is-done', i <= stage);
        tab.classList.toggle('is-current', i === stage);
        tab.setAttribute('aria-pressed', i === stage ? 'true' : 'false');
      });

      text(count, (stage + 1) + ' / 7');
      text(kicker, step.kicker);
      text(title, step.title);
      text(body, step.body);
      text(next, stage === 6 ? 'Start again' : 'Next part');

      set(parts.housing, off(stage >= 0, 'translateX(-60px)'), op(stage >= 0, 0.16));
      fade(parts.cooling, stage === 6 ? 1 : 0.35);
      set(parts.shaft, off(stage >= 1, 'translateX(-140px)'), op(stage >= 1, 0.16));
      set(parts.bearL, off(stage >= 1, 'translateX(-200px)'), op(stage >= 1, 0.16));
      set(parts.bearR, off(stage >= 1, 'translateX(200px)'), op(stage >= 1, 0.16));
      set(parts.stator, off(stage >= 2, 'translateY(-130px)'), op(stage >= 2, 0.12));
      set(parts.wind, off(stage >= 3, 'translateY(120px)'), op(stage >= 3, 0.1));
      set(parts.rotor, off(stage >= 4, 'translateX(190px)'), op(stage >= 4, 0.1));
      set(parts.mag, off(stage >= 5, 'translateX(270px)'), op(stage >= 5, 0));
      set(parts.inv, off(stage >= 6, 'translateY(-90px)'), op(stage >= 6, 0));
      fade(parts.magEnd, op(stage >= 5, 0));
      fade(parts.field, stage === 6 ? 1 : 0);
    }

    function setStage(i) {
      stage = Math.max(0, Math.min(6, i));
      paint();
    }

    tabs.forEach(function (tab, i) {
      tab.addEventListener('click', function () { setStage(i); });
    });
    if (prev) prev.addEventListener('click', function () { setStage(stage - 1); });
    if (next) next.addEventListener('click', function () { setStage(stage === 6 ? 0 : stage + 1); });

    paint();
  }

  /* =================================================== L.02 rotating field */

  function fieldLab(root) {
    if (!root) return;

    var COLS = { a: '#620d3c', b: '#d58a18', c: '#70a3a2' };

    var tabs = qa(root, '[data-field]');
    var stepLabel = q(root, '[data-field-step-label]');
    var title = q(root, '[data-field-title]');
    var copy = q(root, '[data-field-copy]');
    var watch = q(root, '[data-field-watch]');
    var flux = q(root, '[data-field-flux]');
    var rotor = q(root, '[data-field-rotor]');
    var labels = qa(root, '[data-rotor-label]');
    var arc = q(root, '[data-torque]');
    var arcLabel = q(root, '[data-torque-label]');
    var angleOut = q(root, '[data-angle-out]');
    var angleRange = q(root, '[data-angle-range]');
    var loadOut = q(root, '[data-load-out]');
    var loadRange = q(root, '[data-load-range]');
    var loadControl = q(root, '[data-load-control]');
    var playBtn = q(root, '[data-field-play]');
    var advanceBtn = q(root, '[data-field-advance]');

    var step = 0;
    var angle = 0;
    var load = 30;
    var frame = 0;

    function paint(a, l, s) {
      ['a', 'b', 'c'].forEach(function (p, i) {
        var v = Math.cos((a - i * 120) * Math.PI / 180);

        qa(root, '[data-coil="' + p + '"]').forEach(function (el, idx) {
          var signed = idx === 0 ? v : -v;
          el.setAttribute('fill', signed >= 0 ? COLS[p] : '#cdc5bb');
          el.setAttribute('opacity', (0.32 + Math.abs(v) * 0.68).toFixed(3));
        });

        var bar = q(root, '[data-bar="' + p + '"]');
        if (bar) {
          bar.style.left = v >= 0 ? '50%' : '0';
          bar.style.transformOrigin = v >= 0 ? 'left center' : 'right center';
          bar.style.transform = 'scaleX(' + Math.abs(v).toFixed(3) + ')';
        }

        var out = q(root, '[data-val="' + p + '"]');
        if (out) out.textContent = v.toFixed(2).replace('-', '−');
      });

      var torqueAngle = s === 4 ? 4 + l * 0.36 : 4;
      var rotorAngle = a - torqueAngle;

      if (flux) flux.setAttribute('transform', 'rotate(' + a.toFixed(2) + ' 240 240)');
      if (rotor) rotor.setAttribute('transform', 'rotate(' + rotorAngle.toFixed(2) + ' 240 240)');

      labels.forEach(function (t) {
        t.setAttribute('transform', 'rotate(' + (-rotorAngle).toFixed(2) + ' ' + t.getAttribute('data-cx') + ' ' + t.getAttribute('data-cy') + ')');
      });

      if (arc) {
        if (s < 4) {
          arc.setAttribute('d', '');
        } else {
          var start = polar(rotorAngle, 170);
          var end = polar(a, 170);
          arc.setAttribute('d', 'M' + start.x.toFixed(1) + ' ' + start.y.toFixed(1) + 'A170 170 0 0 1 ' + end.x.toFixed(1) + ' ' + end.y.toFixed(1));
          if (arcLabel) {
            var mid = polar(rotorAngle + torqueAngle / 2, 190);
            arcLabel.setAttribute('x', mid.x.toFixed(1));
            arcLabel.setAttribute('y', mid.y.toFixed(1));
          }
        }
      }

      text(angleOut, Math.round(a) + '°');
      text(loadOut, l + '%');
      if (angleRange && Math.abs(Number(angleRange.value) - a) > 0.5) angleRange.value = String(Math.round(a));
    }

    function paintChrome() {
      var lesson = LESSONS[step];

      tabs.forEach(function (tab, i) {
        tab.classList.toggle('is-current', i === step);
        tab.setAttribute('aria-pressed', i === step ? 'true' : 'false');
      });

      text(stepLabel, 'Step ' + (step + 1) + ' of 5');
      text(title, lesson.title);
      text(copy, lesson.copy);
      text(watch, lesson.watch);

      if (loadControl) loadControl.hidden = step !== 4;
      if (flux) flux.setAttribute('opacity', step >= 2 ? '1' : '0');
      if (rotor) rotor.setAttribute('opacity', step >= 3 ? '1' : '0');
      if (arcLabel) arcLabel.setAttribute('opacity', step === 4 ? '1' : '0');
    }

    function render() {
      paintChrome();
      paint(angle, load, step);
    }

    function stopPlay() {
      if (frame) cancelAnimationFrame(frame);
      frame = 0;
      text(playBtn, 'Play cycle');
    }

    function promote(min) {
      if (step < min) { step = min; paintChrome(); }
    }

    function play() {
      if (frame) { stopPlay(); return; }

      promote(2);

      if (!animate()) {
        angle = (angle + 30) % 360;
        render();
        return;
      }

      var start = angle;
      var t0 = performance.now();
      text(playBtn, 'Playing');

      var tick = function (now) {
        var r = Math.min(1, (now - t0) / 4200);
        var a = (start + r * 360) % 360;
        paint(a, load, step);
        if (r < 1 && !document.hidden) {
          frame = requestAnimationFrame(tick);
        } else {
          frame = 0;
          angle = a;
          text(playBtn, 'Play cycle');
        }
      };

      frame = requestAnimationFrame(tick);
    }

    tabs.forEach(function (tab, i) {
      tab.addEventListener('click', function () {
        stopPlay();
        step = i;
        angle = LESSONS[i].angle;
        render();
      });
    });

    if (angleRange) {
      angleRange.addEventListener('input', function (e) {
        stopPlay();
        angle = Number(e.target.value);
        promote(2);
        paint(angle, load, step);
      });
    }

    if (loadRange) {
      loadRange.addEventListener('input', function (e) {
        load = Number(e.target.value);
        step = 4;
        render();
      });
    }

    if (playBtn) playBtn.addEventListener('click', play);

    if (advanceBtn) {
      advanceBtn.addEventListener('click', function () {
        stopPlay();
        angle = (angle + 30) % 360;
        promote(2);
        paint(angle, load, step);
      });
    }

    onVisibility(function (hidden) { if (hidden) stopPlay(); });

    render();
  }

  /* ============================================== L.03 architecture model */

  function archLab(root) {
    if (!root) return;

    var tabs = qa(root, '[data-arch]');
    var rotors = {};
    qa(root, '[data-arch-rotor]').forEach(function (el) { rotors[el.getAttribute('data-arch-rotor')] = el; });

    var pole = q(root, '[data-arch-pole]');
    var coils = qa(root, '[data-arch-coil]');
    var railField = q(root, '[data-rail="field"]');
    var railRotor = q(root, '[data-rail="rotor"]');
    var woundDots = qa(root, '[data-wound-current] circle');
    var inducedDots = qa(root, '[data-induced-current] circle');

    var principle = q(root, '[data-arch-principle]');
    var kicker = q(root, '[data-arch-kicker]');
    var name = q(root, '[data-arch-name]');
    var desc = q(root, '[data-arch-desc]');
    var replacement = q(root, '[data-arch-replacement]');
    var heat = q(root, '[data-arch-heat]');
    var evidence = q(root, '[data-arch-evidence]');
    var watch = q(root, '[data-arch-watch]');
    var relation = q(root, '[data-arch-relation]');
    var playBtn = q(root, '[data-arch-play]');

    var key = 'pmsm';
    var running = true;
    var archAngle = 0;
    var frame = 0;
    var prevTime = 0;

    function paint() {
      var d = ARCH[key];
      var a = archAngle || 0;
      var fieldA = a * d.fieldRatio;
      var rotorA = a * d.rotorRatio - 10;

      if (key === 'srm') rotorA = Math.floor((a + 12) / 45) * 45 - 18;

      if (pole) {
        pole.setAttribute('transform', 'rotate(' + (key === 'srm' ? Math.floor(a / 45) * 45 : fieldA).toFixed(2) + ' 240 240)');
      }

      var rotor = rotors[key];
      if (rotor) rotor.setAttribute('transform', 'rotate(' + rotorA.toFixed(2) + ' 240 240)');

      coils.forEach(function (coil, i) {
        if (key !== 'srm') {
          coil.setAttribute('fill', '#d88928');
          coil.setAttribute('opacity', '1');
          return;
        }
        var pair = Math.floor(a / 60) % 3;
        var on = i % 3 === pair;
        coil.setAttribute('fill', on ? '#620d3c' : '#d8d1c8');
        coil.setAttribute('opacity', on ? '1' : '0.5');
      });

      if (railField) railField.style.left = (((fieldA % 360) + 360) % 360) / 3.6 + '%';
      if (railRotor) railRotor.style.left = (((rotorA % 360) + 360) % 360) / 3.6 + '%';

      woundDots.forEach(function (dot, i) {
        dot.setAttribute('opacity', (0.35 + 0.65 * Math.abs(Math.sin((a + i * 110) * Math.PI / 180))).toFixed(3));
      });

      inducedDots.forEach(function (p, i) {
        var ph = (a * 0.08 + i * 1.9) % (Math.PI * 2);
        p.setAttribute('opacity', (0.15 + 0.7 * Math.abs(Math.sin(ph))).toFixed(3));
      });
    }

    function paintChrome() {
      var d = ARCH[key];

      tabs.forEach(function (tab) {
        var on = tab.getAttribute('data-arch') === key;
        tab.classList.toggle('is-current', on);
        tab.setAttribute('aria-pressed', on ? 'true' : 'false');
      });

      ARCH_KEYS.forEach(function (k) {
        if (rotors[k]) rotors[k].setAttribute('opacity', k === key ? '1' : '0');
      });

      text(principle, d.principle);
      text(kicker, d.kicker);
      text(name, d.name);
      text(desc, d.description);
      text(replacement, d.replacement);
      text(heat, d.heat);
      text(evidence, d.evidence);
      text(watch, d.watch);
      text(relation, d.relation);
      text(playBtn, running ? 'Pause motion' : 'Run slowly');
    }

    function stop() {
      if (frame) cancelAnimationFrame(frame);
      frame = 0;
      prevTime = 0;
    }

    function start() {
      if (frame || !running || !animate()) { paint(); return; }
      prevTime = 0;

      var loop = function (now) {
        frame = 0;
        if (!running || document.hidden || !animate()) return;
        var delta = prevTime ? Math.min(40, now - prevTime) : 16;
        prevTime = now;
        archAngle = (archAngle + delta * 0.018) % 360;
        paint();
        frame = requestAnimationFrame(loop);
      };

      frame = requestAnimationFrame(loop);
    }

    tabs.forEach(function (tab) {
      tab.addEventListener('click', function () {
        key = tab.getAttribute('data-arch');
        archAngle = 0;
        paintChrome();
        paint();
      });
    });

    if (playBtn) {
      playBtn.addEventListener('click', function () {
        running = !running;
        if (!running) stop();
        text(playBtn, running ? 'Pause motion' : 'Run slowly');
        if (running) start();
      });
    }

    onVisibility(function (hidden) {
      if (hidden) stop();
      else start();
    });

    paintChrome();
    start();
  }

  /* =============================================== L.04 heat / loss model */

  function lossLab(root) {
    if (!root) return;

    var tabs = qa(root, '[data-duty]');
    var dutyLabel = q(root, '[data-duty-label]');
    var select = q(root, '[data-loss-key]');
    var speedRange = q(root, '[data-speed-range]');
    var torqueRange = q(root, '[data-torque-range]');
    var speedOut = q(root, '[data-speed-out]');
    var torqueOut = q(root, '[data-torque-out]');
    var marker = q(root, '[data-map-marker]');
    var concern = q(root, '[data-concern]');
    var motionLabel = q(root, '[data-motion-label]');

    var heats = {};
    qa(root, '[data-heat]').forEach(function (el) { heats[el.getAttribute('data-heat')] = el; });

    var lossRotors = {};
    qa(root, '[data-loss-rotor]').forEach(function (el) { lossRotors[el.getAttribute('data-loss-rotor')] = el; });

    var bands = {};
    qa(root, '[data-band]').forEach(function (el) { bands[el.getAttribute('data-band')] = el; });

    var duty = 'launch';
    var lossKey = 'pmsm';
    var speed = 20;
    var torque = 82;

    function band(v) { return v < 0.18 ? 'Low' : v < 0.5 ? 'Moderate' : 'High'; }
    function bandOpacity(v) { return v < 0.18 ? 0.12 : v < 0.5 ? 0.3 : 0.5; }

    function losses() {
      var key = lossKey;
      var s = speed / 100;
      var t = torque / 100;
      var copper = Math.min(1, t * t * 1.12 + s * 0.08);
      var iron = Math.min(1, s * s * 0.9 + s * 0.08);
      var rotor = 0.03;
      var hardware = 0;

      if (key === 'induction') rotor = Math.min(1, 0.12 + t * 0.58 + (1 - s) * t * 0.2);
      if (key === 'wound') { rotor = Math.min(1, 0.2 + t * 0.28); hardware = 0.28 + t * 0.15; }
      if (key === 'synrm') rotor = 0.06;
      if (key === 'srm') rotor = 0.05;
      if (key === 'pmsm' && s > 0.72) hardware = (s - 0.72) * 1.7;
      if (key === 'synrm' || key === 'srm') hardware = 0.12 + t * 0.12;

      return { key: key, speed: s, torque: t, copper: copper, iron: iron, rotor: rotor, hardware: hardware };
    }

    function concernText(l) {
      if (l.torque > 0.7 && l.speed < 0.35) return 'High torque requires high stator current. Copper heating is the main concern during a hard launch.';
      if (l.torque > 0.7) return 'Sustained torque keeps current high for longer, so the cooling system must control copper temperature continuously.';
      if (l.speed > 0.72 && l.key === 'pmsm') return 'High electrical frequency raises iron loss. The PMSM may also draw field-weakening current to limit back-EMF.';
      if (l.speed > 0.72) return 'High electrical frequency raises loss in the electrical steel even when shaft torque is modest.';
      if (l.key === 'induction') return 'The rotor must carry induced current. Some of the input therefore becomes heat inside the moving cage.';
      if (l.key === 'wound') return 'The rotor field is controllable, but excitation current adds heat in the moving winding and its supply hardware.';
      if (l.key === 'synrm') return 'Rotor electrical loss stays low. Stator current and inverter sizing can become important because of power-factor limits.';
      if (l.key === 'srm') return 'Rotor electrical loss stays low. Pulsed stator current, torque ripple and noise become the main system concerns.';
      return 'Copper and iron losses are both moderate at this operating point.';
    }

    function paint() {
      var l = losses();

      tabs.forEach(function (tab) {
        var on = tab.getAttribute('data-duty') === duty;
        tab.classList.toggle('is-current', on);
        tab.setAttribute('aria-pressed', on ? 'true' : 'false');
      });

      text(dutyLabel, duty ? DUTY[duty].name : 'Custom operating point');

      if (speedRange) speedRange.value = String(speed);
      if (torqueRange) torqueRange.value = String(torque);
      if (select) select.value = lossKey;

      text(speedOut, Math.round(l.speed * 8000).toLocaleString('en-IN') + ' rpm');
      text(torqueOut, Math.round(l.torque * 100) + '%');

      text(bands.copper, band(l.copper));
      text(bands.iron, band(l.iron));
      text(bands.rotor, band(l.rotor));
      text(bands.hardware, l.hardware < 0.06 ? 'None' : band(l.hardware));

      if (heats.copper) heats.copper.setAttribute('opacity', String(bandOpacity(l.copper)));
      if (heats.iron) heats.iron.setAttribute('opacity', String(bandOpacity(l.iron)));
      if (heats.rotor) heats.rotor.setAttribute('opacity', String(bandOpacity(l.rotor)));

      ARCH_KEYS.forEach(function (k) {
        if (lossRotors[k]) lossRotors[k].setAttribute('opacity', k === lossKey ? '1' : '0');
      });

      if (marker) {
        marker.setAttribute('cx', (26 + l.speed * 168).toFixed(1));
        marker.setAttribute('cy', (6 + (1 - l.torque) * 102).toFixed(1));
      }

      text(concern, concernText(l));
      text(motionLabel, l.speed < 0.35
        ? 'Low electrical frequency, high current demand'
        : l.speed > 0.72
          ? 'High electrical frequency and rapid field rotation'
          : 'Mid-range speed and field rotation');
    }

    tabs.forEach(function (tab) {
      tab.addEventListener('click', function () {
        duty = tab.getAttribute('data-duty');
        var preset = DUTY[duty];
        speed = preset.speed;
        torque = preset.torque;
        paint();
      });
    });

    if (select) {
      select.addEventListener('change', function (e) {
        lossKey = e.target.value;
        paint();
      });
    }

    if (speedRange) {
      speedRange.addEventListener('input', function (e) {
        speed = Number(e.target.value);
        duty = '';
        paint();
      });
    }

    if (torqueRange) {
      torqueRange.addEventListener('input', function (e) {
        torque = Number(e.target.value);
        duty = '';
        paint();
      });
    }

    paint();
  }

  /* ============================================== L.05 application selector */

  function appSelector(scope) {
    if (!scope) return;

    var tabs = qa(scope, '[data-app]');
    var requirements = q(scope, '[data-app-requirements]');
    var routes = q(scope, '[data-app-routes]');
    var evidence = q(scope, '[data-app-evidence]');

    function paint(key) {
      var app = APPS[key];
      tabs.forEach(function (tab) {
        var on = tab.getAttribute('data-app') === key;
        tab.classList.toggle('is-current', on);
        tab.setAttribute('aria-selected', on ? 'true' : 'false');
      });
      text(requirements, app.requirements);
      text(routes, app.routes);
      text(evidence, app.evidence);
    }

    tabs.forEach(function (tab) {
      tab.addEventListener('click', function () { paint(tab.getAttribute('data-app')); });
    });

    paint('twoWheeler');
  }

  /* --------------------------------------------------------------- boot -- */

  function init() {
    if (!OPTIONS.showRealityLabels) {
      qa(document, '.lab-note').forEach(function (el) { el.style.display = 'none'; });
    }

    assemblyLab(document.getElementById('lab-assembly'));
    fieldLab(document.getElementById('lab-field'));
    archLab(document.getElementById('lab-arch'));
    lossLab(document.getElementById('lab-loss'));
    appSelector(document.querySelector('.section--apps'));

    document.addEventListener('visibilitychange', function () {
      visibilityHandlers.forEach(function (fn) { fn(document.hidden); });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
