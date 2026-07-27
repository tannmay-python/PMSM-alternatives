(() => {
  "use strict";

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  const menuButton = $("#menuButton");
  const mobileNav = $("#mobileNav");

  function closeMenu() {
    menuButton?.setAttribute("aria-expanded", "false");
    menuButton?.setAttribute("aria-label", "Open menu");
    mobileNav?.classList.remove("active");
    mobileNav?.setAttribute("aria-hidden", "true");
    document.body.classList.remove("menu-open");
  }

  menuButton?.addEventListener("click", () => {
    const willOpen = menuButton.getAttribute("aria-expanded") !== "true";
    menuButton.setAttribute("aria-expanded", String(willOpen));
    menuButton.setAttribute("aria-label", willOpen ? "Close menu" : "Open menu");
    mobileNav?.classList.toggle("active", willOpen);
    mobileNav?.setAttribute("aria-hidden", String(!willOpen));
    document.body.classList.toggle("menu-open", willOpen);
  });
  $$("#mobileNav a").forEach((link) => link.addEventListener("click", closeMenu));
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeMenu();
  });

  const progress = $(".reading-progress i");
  if (progress && CSS.supports("animation-timeline: scroll()")) {
    progress.style.animation = "readingProgress linear both";
    progress.style.animationTimeline = "scroll()";
  } else if (progress) {
    let progressFrame = 0;
    const setProgress = () => {
      progressFrame = 0;
      const available = document.documentElement.scrollHeight - window.innerHeight;
      const ratio = available > 0 ? window.scrollY / available : 0;
      progress.style.transform = `scaleX(${Math.min(1, Math.max(0, ratio))})`;
    };
    document.addEventListener("scroll", () => {
      if (!progressFrame) progressFrame = requestAnimationFrame(setProgress);
    }, { passive: true });
    setProgress();
  }

  const assemblyFrame = $("#assemblyFrame");
  const assemblySteps = $$(".assembly-step");
  const assemblyCount = $("#assemblyCount");
  const assemblyPrev = $("#assemblyPrev");
  const assemblyNext = $("#assemblyNext");
  const calloutText = $("#assemblyCalloutText");
  const calloutLine = $("#assemblyCalloutLine");
  const calloutDot = $("#assemblyCalloutDot");
  let assemblyStage = 0;

  const assemblyCallouts = [
    { text: "Housing and cooling jacket", x: 165, y: 164, path: "M165 178V212H212", dot: [212, 212] },
    { text: "Bearings support the shaft", x: 102, y: 246, path: "M152 254V292L169 312", dot: [169, 312] },
    { text: "Laminated electrical steel", x: 395, y: 164, path: "M395 178V212L352 247", dot: [352, 247] },
    { text: "Three-phase copper windings", x: 395, y: 164, path: "M395 178V212L403 240", dot: [403, 240] },
    { text: "Rotor crosses a narrow air gap", x: 690, y: 164, path: "M690 178V245L650 329", dot: [650, 329] },
    { text: "NdFeB magnets sit in rotor pockets", x: 690, y: 164, path: "M690 178V245L606 328", dot: [606, 328] },
    { text: "Timed current produces shaft torque", x: 668, y: 165, path: "M668 179V212L625 252", dot: [625, 252] }
  ];

  function setAssemblyStage(value, scrollIntoView = false) {
    assemblyStage = Math.max(0, Math.min(assemblySteps.length - 1, Number(value)));
    assemblyFrame?.setAttribute("data-stage", String(assemblyStage));
    assemblySteps.forEach((step, index) => {
      const active = index === assemblyStage;
      step.classList.toggle("is-active", active);
      $("button", step)?.setAttribute("aria-current", active ? "step" : "false");
    });
    if (assemblyCount) assemblyCount.textContent = `${assemblyStage + 1} / ${assemblySteps.length}`;
    if (assemblyPrev) assemblyPrev.disabled = assemblyStage === 0;
    if (assemblyNext) assemblyNext.textContent = assemblyStage === assemblySteps.length - 1 ? "Start again" : "Next part";
    const callout = assemblyCallouts[assemblyStage];
    if (calloutText && calloutLine && calloutDot && callout) {
      calloutText.textContent = callout.text;
      calloutText.setAttribute("x", callout.x);
      calloutText.setAttribute("y", callout.y);
      calloutLine.setAttribute("d", callout.path);
      calloutDot.setAttribute("cx", callout.dot[0]);
      calloutDot.setAttribute("cy", callout.dot[1]);
    }
    if (scrollIntoView) {
      assemblySteps[assemblyStage]?.scrollIntoView({ behavior: reduceMotion.matches ? "auto" : "smooth", block: "center" });
    }
  }

  assemblySteps.forEach((step, index) => {
    $("button", step)?.addEventListener("click", () => setAssemblyStage(index, true));
  });
  assemblyPrev?.addEventListener("click", () => setAssemblyStage(assemblyStage - 1, true));
  assemblyNext?.addEventListener("click", () => {
    const next = assemblyStage === assemblySteps.length - 1 ? 0 : assemblyStage + 1;
    setAssemblyStage(next, true);
  });

  if ("IntersectionObserver" in window) {
    const stepObserver = new IntersectionObserver((entries) => {
      const visible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (visible) setAssemblyStage(Number(visible.target.dataset.stage));
    }, { rootMargin: "-30% 0px -42% 0px", threshold: [0.2, 0.45, 0.72] });
    assemblySteps.forEach((step) => stepObserver.observe(step));

    const supplySection = $(".supply-section");
    if (supplySection) {
      const supplyObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => entry.target.classList.toggle("in-view", entry.isIntersecting));
      }, { threshold: 0.3 });
      supplyObserver.observe(supplySection);
    }
    const motionObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => entry.target.classList.toggle("is-visible", entry.isIntersecting));
    }, { threshold: .08 });
    $$(".cover, .motor-primer, .assembly-frame").forEach((element) => motionObserver.observe(element));
  } else {
    $(".supply-section")?.classList.add("in-view");
    $$(".cover, .motor-primer, .assembly-frame").forEach((element) => element.classList.add("is-visible"));
  }
  setAssemblyStage(0);

  const fieldWorkbench = $("#fieldWorkbench");
  const fieldStepButtons = $$("[data-field-step]");
  const fieldStepLabel = $("#fieldStepLabel");
  const fieldStepTitle = $("#fieldStepTitle");
  const fieldStepCopy = $("#fieldStepCopy");
  const fieldWatch = $("#fieldWatch");
  const angleRange = $("#angleRange");
  const loadRange = $("#loadRange");
  const angleOutput = $("#angleOutput");
  const loadOutput = $("#loadOutput");
  const fieldFlux = $("#fieldFlux");
  const fieldRotor = $("#fieldRotor");
  const torqueArc = $("#torqueArc");
  const torqueLabel = $("#torqueLabel");
  const fieldPlay = $("#fieldPlay");
  const fieldAdvance = $("#fieldStep");
  let fieldStepIndex = 0;
  let fieldAnimation = 0;

  const fieldLessons = [
    {
      title: "Phase A magnetises one pair of stator poles",
      copy: "Positive current in one side of the winding and return current in the opposite side create a north-south magnetic axis across the motor.",
      watch: "The phase A coil pair is strongest. Its opposite sides form the current path across the stator.",
      angle: 0
    },
    {
      title: "Current moves from one phase to the next",
      copy: "Phase A has not switched off before phase B begins to carry more current. Their fields add together, so the strongest magnetic direction sits between the two coil axes.",
      watch: "Advance the electrical angle. The coil colours change continuously because each current rises and falls as a wave.",
      angle: 45
    },
    {
      title: "The combined magnetic direction travels around the stator",
      copy: "At every instant, the three phase fields add to one dominant axis. Repeating the current sequence moves that axis through a full turn.",
      watch: "The gold vector is the combined result of all three phase currents, not a separate physical part.",
      angle: 100
    },
    {
      title: "Permanent magnets give the rotor its own poles",
      copy: "The embedded magnets supply a north-south rotor axis without electrical current on the rotor. The stator field pulls that axis around synchronously.",
      watch: "The maroon rotor direction remains tied to the magnets while the whole rotor turns with the stator field.",
      angle: 155
    },
    {
      title: "A controlled angle between the fields produces torque",
      copy: "Under load, the rotor axis trails the stator axis. The controller holds a useful torque angle while both continue to turn at the same speed.",
      watch: "Increase shaft load. The angular separation grows, but the rotor does not fall behind in rotational speed.",
      angle: 210
    }
  ];

  function polar(angle, radius) {
    const radians = angle * Math.PI / 180;
    return { x: 380 + radius * Math.cos(radians), y: 338 + radius * Math.sin(radians) };
  }

  function setPhase(name, value) {
    const colours = { a: "#6f0d43", b: "#d58a18", c: "#70a3a2" };
    const elements = $$(`.field-coil.phase-${name}`);
    elements.forEach((element, index) => {
      const signed = index === 0 ? value : -value;
      const path = $("path", element);
      if (!path) return;
      path.style.fill = signed >= 0 ? colours[name] : "#c8c0b7";
      path.style.opacity = String(.28 + Math.abs(value) * .72);
    });
    const bar = $(`#phase${name.toUpperCase()}Bar`);
    const output = $(`#phase${name.toUpperCase()}Value`);
    if (bar) {
      const strength = Math.abs(value);
      bar.style.left = value >= 0 ? "50%" : "0";
      bar.style.transformOrigin = value >= 0 ? "left center" : "right center";
      bar.style.transform = `scaleX(${strength})`;
    }
    if (output) output.textContent = value.toFixed(2).replace("-", "−");
  }

  function updateField() {
    if (!angleRange || !loadRange) return;
    const angle = Number(angleRange.value);
    const torqueAngle = fieldStepIndex === 4 ? 4 + Number(loadRange.value) * .36 : 4;
    const rotorAngle = angle - torqueAngle;
    const radians = angle * Math.PI / 180;
    setPhase("a", Math.cos(radians));
    setPhase("b", Math.cos(radians - 2 * Math.PI / 3));
    setPhase("c", Math.cos(radians + 2 * Math.PI / 3));
    if (fieldFlux) fieldFlux.style.transform = `rotate(${angle}deg)`;
    if (fieldRotor) {
      fieldRotor.style.transform = `rotate(${rotorAngle}deg)`;
      $$("text", fieldRotor).forEach((label) => {
        const x = label.getAttribute("x");
        const y = label.getAttribute("y");
        label.setAttribute("transform", `rotate(${-rotorAngle} ${x} ${y})`);
      });
    }
    if (torqueArc) {
      if (fieldStepIndex < 4) {
        torqueArc.setAttribute("d", "");
      } else {
        const start = polar(rotorAngle, 155);
        const end = polar(angle, 155);
        torqueArc.setAttribute("d", `M${start.x.toFixed(1)} ${start.y.toFixed(1)}A155 155 0 0 1 ${end.x.toFixed(1)} ${end.y.toFixed(1)}`);
        if (torqueLabel) {
          const mid = polar(rotorAngle + torqueAngle / 2, 178);
          torqueLabel.setAttribute("x", mid.x.toFixed(1));
          torqueLabel.setAttribute("y", mid.y.toFixed(1));
        }
      }
    }
    if (angleOutput) angleOutput.textContent = `${Math.round(angle)}°`;
    if (loadOutput) loadOutput.textContent = `${loadRange.value}%`;
  }

  function setFieldLesson(index) {
    fieldStepIndex = Math.max(0, Math.min(fieldLessons.length - 1, Number(index)));
    const lesson = fieldLessons[fieldStepIndex];
    fieldWorkbench?.setAttribute("data-step", String(fieldStepIndex));
    fieldStepButtons.forEach((button, buttonIndex) => {
      button.setAttribute("aria-selected", String(buttonIndex === fieldStepIndex));
      button.tabIndex = buttonIndex === fieldStepIndex ? 0 : -1;
    });
    if (fieldStepLabel) fieldStepLabel.textContent = `Step ${fieldStepIndex + 1} of ${fieldLessons.length}`;
    if (fieldStepTitle) fieldStepTitle.textContent = lesson.title;
    if (fieldStepCopy) fieldStepCopy.textContent = lesson.copy;
    if (fieldWatch) fieldWatch.textContent = lesson.watch;
    if (angleRange) angleRange.value = String(lesson.angle);
    $(".load-control")?.toggleAttribute("hidden", fieldStepIndex < 4);
    updateField();
  }

  function stopField() {
    if (fieldAnimation) cancelAnimationFrame(fieldAnimation);
    fieldAnimation = 0;
    if (fieldPlay) {
      fieldPlay.textContent = "Play cycle";
      fieldPlay.disabled = false;
    }
  }

  function playField() {
    if (!angleRange || fieldAnimation) return;
    if (fieldStepIndex < 2) setFieldLesson(2);
    if (reduceMotion.matches) {
      angleRange.value = String((Number(angleRange.value) + 30) % 360);
      updateField();
      return;
    }
    const start = Number(angleRange.value);
    const startedAt = performance.now();
    const duration = 4200;
    if (fieldPlay) {
      fieldPlay.textContent = "Playing";
      fieldPlay.disabled = true;
    }
    const frame = (now) => {
      const ratio = Math.min(1, (now - startedAt) / duration);
      angleRange.value = String((start + ratio * 360) % 360);
      updateField();
      if (ratio < 1 && !document.hidden) {
        fieldAnimation = requestAnimationFrame(frame);
      } else {
        stopField();
      }
    };
    fieldAnimation = requestAnimationFrame(frame);
  }

  fieldStepButtons.forEach((button, index) => button.addEventListener("click", () => {
    stopField();
    setFieldLesson(index);
  }));
  angleRange?.addEventListener("input", () => {
    stopField();
    if (fieldStepIndex < 2) setFieldLesson(2);
    updateField();
  });
  loadRange?.addEventListener("input", () => {
    if (fieldStepIndex < 4) setFieldLesson(4);
    updateField();
  });
  fieldPlay?.addEventListener("click", playField);
  fieldAdvance?.addEventListener("click", () => {
    stopField();
    if (fieldStepIndex < 2) setFieldLesson(2);
    if (angleRange) angleRange.value = String((Number(angleRange.value) + 30) % 360);
    updateField();
  });
  setFieldLesson(0);

  const architectureData = {
    pmsm: {
      principle: "Permanent field in the rotor",
      kicker: "Reference architecture",
      name: "Permanent-magnet synchronous motor",
      description: "The rotor contains permanent magnetic poles. The rotating stator field pulls those poles around at exactly the same speed. Because the rotor needs no electrical connection and produces little electrical loss, the machine can be compact and efficient.",
      replacement: "Nothing in the reference machine. NdFeB magnets create the rotor field.",
      heat: "Mostly in stator copper and steel. Field weakening can add stator current at high speed.",
      evidence: "Broad use in current electric vehicles.",
      watch: "The permanent poles rotate in step with the stator field. The small angular separation represents load.",
      relation: "Same speed",
      rotorRatio: 1,
      fieldRatio: 1
    },
    wound: {
      principle: "Direct current creates the rotor field",
      kicker: "Rare-earth-free, series production",
      name: "Wound-field synchronous motor",
      description: "Copper windings on the rotor become an electromagnet when supplied with direct current. The motor remains synchronous: its rotor and stator field turn at the same speed. The controller can vary the rotor field, which is useful at high speed, but the machine must deliver power to a moving winding.",
      replacement: "A copper rotor winding, supplied through contacts or a contactless exciter.",
      heat: "The rotor winding and excitation hardware add electrical loss and cooling demand.",
      evidence: "Renault and BMW use wound-field motors in production vehicles.",
      watch: "Gold current markers move through the rotor winding. The small concentric unit below represents contactless transfer, not a separate motor.",
      relation: "Same speed",
      rotorRatio: 1,
      fieldRatio: 1
    },
    induction: {
      principle: "The stator field induces rotor current",
      kicker: "Rare-earth-free, series production",
      name: "Induction motor",
      description: "The rotor contains conductive bars joined by end rings. A moving stator field cuts across those conductors and induces current in them. That current produces the rotor field. Induction requires a speed difference, so the mechanical rotor turns slightly slower than the stator field under load.",
      replacement: "A conductive cage, usually aluminium or copper, embedded in the rotor.",
      heat: "Induced current heats the rotor. Cooling that moving heat source is an important design task.",
      evidence: "Used in production EVs, including specified Tesla variants.",
      watch: "The gold field indicator moves ahead of the rotor. Pulses appear in cage bars as the relative motion induces current.",
      relation: "Rotor slips",
      rotorRatio: .91,
      fieldRatio: 1
    },
    synrm: {
      principle: "The rotor offers an easier magnetic path",
      kicker: "Mature in industry, developing in traction",
      name: "Synchronous reluctance motor",
      description: "Curved air barriers make the rotor conduct magnetic flux more easily along one axis than the other. The stator field pulls that preferred axis into alignment. There are no rotor magnets or electrical windings, and the rotor remains synchronous with the stator field.",
      replacement: "Shaped flux barriers in a laminated steel rotor.",
      heat: "Rotor electrical loss is low, but lower power factor can increase stator current and inverter demand.",
      evidence: "Commercial industrial systems are established. Traction programmes are less mature.",
      watch: "Teal flux paths bend through the solid steel between the barriers. The rotor rotates to keep that path aligned with the field.",
      relation: "Same speed",
      rotorRatio: 1,
      fieldRatio: 1
    },
    srm: {
      principle: "Stator poles switch in sequence",
      kicker: "Simple rotor, demanding acoustics",
      name: "Switched reluctance motor",
      description: "The controller energises one stator pole pair at a time. The toothed steel rotor moves towards the active poles because that position lowers magnetic reluctance. The next pair switches on before alignment, continuing the rotation. This architecture also changes the stator geometry.",
      replacement: "A salient steel rotor and a stator with separately switched pole windings.",
      heat: "The rotor carries little electrical heat. Pulsed stator current, torque ripple and acoustic noise need careful control.",
      evidence: "Commercial in some applications; vehicle programmes remain at development or pilot stages.",
      watch: "The active stator axis advances in steps. The rotor follows each new pole pair instead of carrying its own field.",
      relation: "Pole by pole",
      rotorRatio: 1,
      fieldRatio: 1
    }
  };

  const architectureTabs = $$(".architecture-tabs [data-architecture]");
  const architectureRotors = $$(".arch-rotor");
  const architecturePlay = $("#architecturePlay");
  const architectureWorkbench = $("#architectureWorkbench");
  const activePoleGlow = $("#activePoleGlow");
  const architectureFields = {
    principle: $("#architecturePrinciple"),
    kicker: $("#architectureKicker"),
    name: $("#architectureName"),
    description: $("#architectureDescription"),
    replacement: $("#architectureReplacement"),
    heat: $("#architectureHeat"),
    evidence: $("#architectureEvidence"),
    watch: $("#architectureWatch"),
    relation: $("#architectureRelation")
  };
  let architectureKey = "pmsm";
  let architectureRunning = true;
  let architectureVisible = false;
  let architectureFrame = 0;
  let architectureAngle = 0;
  let previousArchitectureTime = 0;

  function setArchitecture(key) {
    if (!architectureData[key]) return;
    architectureKey = key;
    const data = architectureData[key];
    architectureTabs.forEach((button) => {
      const selected = button.dataset.architecture === key;
      button.setAttribute("aria-selected", String(selected));
      button.tabIndex = selected ? 0 : -1;
    });
    architectureRotors.forEach((rotor) => rotor.classList.toggle("is-active", rotor.dataset.rotor === key));
    Object.entries(architectureFields).forEach(([field, element]) => {
      if (element) element.textContent = data[field];
    });
    architectureAngle = 0;
    renderArchitecture();
  }

  function renderArchitecture() {
    const data = architectureData[architectureKey];
    const fieldAngle = architectureAngle * data.fieldRatio;
    let rotorAngle = architectureAngle * data.rotorRatio - 10;
    if (architectureKey === "srm") {
      const step = 45;
      rotorAngle = Math.floor((architectureAngle + 12) / step) * step - 18;
    }
    if (activePoleGlow) {
      const statorAngle = architectureKey === "srm" ? Math.floor(architectureAngle / 45) * 45 : fieldAngle;
      activePoleGlow.style.transform = `rotate(${statorAngle}deg)`;
    }
    $$(".arch-coils rect").forEach((coil, index) => {
      if (architectureKey !== "srm") {
        coil.style.fill = "";
        coil.style.opacity = "";
        return;
      }
      const pair = Math.floor(architectureAngle / 60) % 3;
      const active = Math.floor(index / 2) === pair;
      coil.style.fill = active ? "#6f0d43" : "#d8d1c8";
      coil.style.opacity = active ? "1" : ".46";
    });
    const activeRotor = $(`.arch-rotor[data-rotor="${architectureKey}"]`);
    if (activeRotor) activeRotor.style.transform = `rotate(${rotorAngle}deg)`;
    const fieldDot = $("#fieldSpeedDot");
    const rotorDot = $("#rotorSpeedDot");
    if (fieldDot) fieldDot.setAttribute("cx", String(8 + ((fieldAngle % 360 + 360) % 360) / 360 * 114));
    if (rotorDot) rotorDot.setAttribute("cx", String(8 + ((rotorAngle % 360 + 360) % 360) / 360 * 114));
    const woundDots = $$(".rotor-current circle");
    woundDots.forEach((dot, index) => {
      const pulse = .35 + .65 * Math.abs(Math.sin((architectureAngle + index * 110) * Math.PI / 180));
      dot.style.opacity = String(pulse);
    });
    const induced = $$(".induced-current circle");
    induced.forEach((pulse, index) => {
      const phase = (architectureAngle * .08 + index * 1.9) % (Math.PI * 2);
      pulse.style.opacity = String(.15 + .7 * Math.abs(Math.sin(phase)));
      pulse.style.transformBox = "fill-box";
      pulse.style.transformOrigin = "center";
      pulse.style.transform = `scale(${.65 + .35 * Math.abs(Math.sin(phase))})`;
    });
  }

  function architectureLoop(now) {
    architectureFrame = 0;
    if (!architectureRunning || !architectureVisible || document.hidden || reduceMotion.matches) return;
    const delta = previousArchitectureTime ? Math.min(40, now - previousArchitectureTime) : 16;
    previousArchitectureTime = now;
    architectureAngle = (architectureAngle + delta * .018) % 360;
    renderArchitecture();
    architectureFrame = requestAnimationFrame(architectureLoop);
  }

  function ensureArchitectureLoop() {
    if (architectureRunning && architectureVisible && !architectureFrame && !reduceMotion.matches) {
      previousArchitectureTime = 0;
      architectureFrame = requestAnimationFrame(architectureLoop);
    }
  }

  architectureTabs.forEach((button) => button.addEventListener("click", () => setArchitecture(button.dataset.architecture)));
  architecturePlay?.addEventListener("click", () => {
    architectureRunning = !architectureRunning;
    architecturePlay.textContent = architectureRunning ? "Pause motion" : "Run slowly";
    if (!architectureRunning && architectureFrame) cancelAnimationFrame(architectureFrame);
    architectureFrame = 0;
    ensureArchitectureLoop();
  });
  if ("IntersectionObserver" in window && architectureWorkbench) {
    const architectureObserver = new IntersectionObserver((entries) => {
      architectureVisible = entries.some((entry) => entry.isIntersecting);
      if (!architectureVisible && architectureFrame) cancelAnimationFrame(architectureFrame);
      if (!architectureVisible) architectureFrame = 0;
      ensureArchitectureLoop();
    }, { threshold: .15 });
    architectureObserver.observe(architectureWorkbench);
  } else {
    architectureVisible = true;
  }
  setArchitecture("pmsm");
  ensureArchitectureLoop();

  const dutyPresets = {
    launch: { name: "Pulling away", speed: 20, torque: 82 },
    cruise: { name: "Steady cruise", speed: 48, torque: 24 },
    motorway: { name: "Motorway", speed: 84, torque: 30 },
    grade: { name: "Long climb", speed: 48, torque: 88 }
  };
  const lossArchitecture = $("#lossArchitecture");
  const lossSpeed = $("#lossSpeed");
  const lossTorque = $("#lossTorque");
  const lossSpeedOutput = $("#lossSpeedOutput");
  const lossTorqueOutput = $("#lossTorqueOutput");
  const copperHeat = $("#copperHeat");
  const ironHeat = $("#ironHeat");
  const rotorHeat = $("#rotorHeat");
  const hardwareHeat = $("#hardwareHeat");
  const lossConcern = $("#lossConcern");
  const dutyLabel = $("#dutyLabel");
  const lossMotionLabel = $("#lossMotionLabel");
  const lossHardware = $("#lossHardware");
  const mapMarker = $("#mapMarker");
  let activeDuty = "launch";

  function heatBand(value) {
    if (value < .18) return "Low";
    if (value < .5) return "Moderate";
    return "High";
  }

  function applyHeat(selector, value) {
    const element = $(selector);
    if (!element) return;
    element.classList.remove("heat-low", "heat-moderate", "heat-high");
    const band = heatBand(value).toLowerCase();
    element.classList.add(`heat-${band}`);
  }

  function updateLoss() {
    if (!lossArchitecture || !lossSpeed || !lossTorque) return;
    const key = lossArchitecture.value;
    const speed = Number(lossSpeed.value) / 100;
    const torque = Number(lossTorque.value) / 100;
    const copper = Math.min(1, torque * torque * 1.12 + speed * .08);
    const iron = Math.min(1, speed * speed * .9 + speed * .08);
    let rotor = .03;
    let hardware = 0;
    if (key === "induction") rotor = Math.min(1, .12 + torque * .58 + (1 - speed) * torque * .2);
    if (key === "wound") {
      rotor = Math.min(1, .2 + torque * .28);
      hardware = .28 + torque * .15;
    }
    if (key === "synrm") rotor = .06;
    if (key === "srm") rotor = .05;
    if (key === "pmsm" && speed > .72) hardware = (speed - .72) * 1.7;
    if (key === "synrm" || key === "srm") hardware = .12 + torque * .12;

    applyHeat(".heat-copper", copper);
    applyHeat(".heat-steel", iron);
    applyHeat(".heat-rotor", rotor);
    applyHeat(".heat-hardware", hardware);
    if (copperHeat) copperHeat.textContent = heatBand(copper);
    if (ironHeat) ironHeat.textContent = heatBand(iron);
    if (rotorHeat) rotorHeat.textContent = heatBand(rotor);
    if (hardwareHeat) hardwareHeat.textContent = hardware < .06 ? "None" : heatBand(hardware);
    if (lossSpeedOutput) lossSpeedOutput.textContent = `${Math.round(speed * 8000).toLocaleString("en-IN")} rpm`;
    if (lossTorqueOutput) lossTorqueOutput.textContent = `${Math.round(torque * 100)}%`;
    if (mapMarker) {
      mapMarker.style.left = `${Math.max(2, speed * 96)}%`;
      mapMarker.style.top = `${Math.max(2, (1 - torque) * 96)}%`;
    }
    if (lossHardware) lossHardware.style.opacity = hardware > .05 || key === "wound" ? "1" : ".28";
    $$(".loss-rotor-option").forEach((rotor) => {
      rotor.classList.toggle("is-active", rotor.dataset.lossRotor === key);
    });

    const motion = speed < .35
      ? "Low electrical frequency, high current demand"
      : speed > .72
        ? "High electrical frequency and rapid field rotation"
        : "Mid-range speed and field rotation";
    if (lossMotionLabel) lossMotionLabel.textContent = motion;

    let concern = "Copper and iron losses are both moderate at this operating point.";
    if (torque > .7 && speed < .35) concern = "High torque requires high stator current. Copper heating is the main concern during a hard launch.";
    else if (torque > .7) concern = "Sustained torque keeps current high for longer, so the cooling system must control copper temperature continuously.";
    else if (speed > .72 && key === "pmsm") concern = "High electrical frequency raises iron loss. The PMSM may also draw field-weakening current to limit back-EMF.";
    else if (speed > .72) concern = "High electrical frequency raises loss in the electrical steel even when shaft torque is modest.";
    else if (key === "induction") concern = "The rotor must carry induced current. Some of the input therefore becomes heat inside the moving cage.";
    else if (key === "wound") concern = "The rotor field is controllable, but excitation current adds heat in the moving winding and its supply hardware.";
    else if (key === "synrm") concern = "Rotor electrical loss stays low. Stator current and inverter sizing can become important because of power-factor limits.";
    else if (key === "srm") concern = "Rotor electrical loss stays low. Pulsed stator current, torque ripple and noise become the main system concerns.";
    if (lossConcern) lossConcern.textContent = concern;
  }

  $$("[data-duty]").forEach((button) => button.addEventListener("click", () => {
    const preset = dutyPresets[button.dataset.duty];
    if (!preset || !lossSpeed || !lossTorque) return;
    activeDuty = button.dataset.duty;
    $$("[data-duty]").forEach((item) => item.classList.toggle("is-active", item === button));
    lossSpeed.value = String(preset.speed);
    lossTorque.value = String(preset.torque);
    if (dutyLabel) dutyLabel.textContent = preset.name;
    updateLoss();
  }));
  lossArchitecture?.addEventListener("change", updateLoss);
  lossSpeed?.addEventListener("input", () => {
    activeDuty = "";
    $$("[data-duty]").forEach((button) => button.classList.remove("is-active"));
    if (dutyLabel) dutyLabel.textContent = "Custom operating point";
    updateLoss();
  });
  lossTorque?.addEventListener("input", () => {
    activeDuty = "";
    $$("[data-duty]").forEach((button) => button.classList.remove("is-active"));
    if (dutyLabel) dutyLabel.textContent = "Custom operating point";
    updateLoss();
  });
  updateLoss();

  const applications = {
    twoWheeler: {
      requirements: "Low cost, compact packaging, frequent stop-start operation and straightforward service.",
      routes: "Ferrite PM, switched reluctance and synchronous reluctance can be relevant when material security and cost matter more than passenger-car refinement.",
      evidence: "Drive-cycle efficiency, low-speed torque, controller cost, noise, vibration and thermal limits in Indian ambient conditions."
    },
    passenger: {
      requirements: "High torque density, broad speed range, cabin refinement, fast acceleration and low drive-cycle energy use.",
      routes: "Production wound-field and induction motors provide the clearest rare-earth-free evidence. Ferrite PM may fit when the package can absorb extra volume.",
      evidence: "Vehicle-level range, continuous output, high-speed efficiency, coolant demand, acoustic behaviour and manufacturing yield."
    },
    heavy: {
      requirements: "Sustained torque, continuous thermal performance, durability and efficient operation at high vehicle mass.",
      routes: "Wound-field and induction machines merit direct testing. Reluctance designs may become attractive where robust rotors and material security justify added control work.",
      evidence: "Long-grade thermal tests, continuous ratings, inverter loading, rotor temperature, service life and efficiency under payload."
    },
    industrial: {
      requirements: "Long operating hours, predictable load profiles, reliability, maintainability and whole-life electricity cost.",
      routes: "Synchronous reluctance is already commercial in industrial drive systems. Induction remains a well-established baseline.",
      evidence: "System efficiency at the actual load profile, power factor, drive compatibility, bearing life, maintenance intervals and payback."
    }
  };
  const applicationButtons = $$(".application-tabs [data-application]");

  function setApplication(key) {
    const data = applications[key];
    if (!data) return;
    applicationButtons.forEach((button) => {
      const selected = button.dataset.application === key;
      button.setAttribute("aria-selected", String(selected));
      button.tabIndex = selected ? 0 : -1;
    });
    if ($("#applicationRequirements")) $("#applicationRequirements").textContent = data.requirements;
    if ($("#applicationRoutes")) $("#applicationRoutes").textContent = data.routes;
    if ($("#applicationEvidence")) $("#applicationEvidence").textContent = data.evidence;
  }
  applicationButtons.forEach((button) => button.addEventListener("click", () => setApplication(button.dataset.application)));
  setApplication("twoWheeler");

  function enableTabKeyboard(buttons) {
    buttons.forEach((button, index) => {
      button.addEventListener("keydown", (event) => {
        if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
        event.preventDefault();
        let next = index;
        if (event.key === "ArrowLeft") next = (index - 1 + buttons.length) % buttons.length;
        if (event.key === "ArrowRight") next = (index + 1) % buttons.length;
        if (event.key === "Home") next = 0;
        if (event.key === "End") next = buttons.length - 1;
        buttons[next].focus();
        buttons[next].click();
      });
    });
  }
  enableTabKeyboard(fieldStepButtons);
  enableTabKeyboard(architectureTabs);
  enableTabKeyboard(applicationButtons);

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      stopField();
      if (architectureFrame) cancelAnimationFrame(architectureFrame);
      architectureFrame = 0;
    } else {
      ensureArchitectureLoop();
    }
  });
})();
