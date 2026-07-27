(() => {
  "use strict";

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  const menuButton = $("#menuButton");
  const mobileNav = $("#mobileNav");

  function closeMenu() {
    menuButton?.setAttribute("aria-expanded", "false");
    mobileNav?.classList.remove("active");
    mobileNav?.setAttribute("aria-hidden", "true");
    document.body.classList.remove("menu-open");
  }

  menuButton?.addEventListener("click", () => {
    const open = menuButton.getAttribute("aria-expanded") === "true";
    menuButton.setAttribute("aria-expanded", String(!open));
    mobileNav.classList.toggle("active", !open);
    mobileNav.setAttribute("aria-hidden", String(open));
    document.body.classList.toggle("menu-open", !open);
  });

  $$("#mobileNav a").forEach((link) => link.addEventListener("click", closeMenu));
  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeMenu();
  });

  const progress = $(".reading-progress i");
  function updateProgress() {
    if (!progress) return;
    const available = document.documentElement.scrollHeight - window.innerHeight;
    const value = available > 0 ? window.scrollY / available : 0;
    progress.style.transform = `scaleX(${Math.min(1, Math.max(0, value))})`;
  }
  window.addEventListener("scroll", updateProgress, { passive: true });
  updateProgress();

  const assemblyFrame = $(".assembly-frame");
  const assemblySteps = $$(".assembly-step");
  const assemblyLabel = $("#assemblyLabel");
  const assemblyNote = $("#assemblyNote");
  const assemblyCopy = [
    ["Housing and bearings", "The housing carries structural and cooling loads. Bearings support the shaft while allowing it to rotate."],
    ["Stator laminations", "Thin sheets of electrical steel guide magnetic flux. Laminations reduce currents that would otherwise heat the core."],
    ["Three-phase windings", "The inverter sends timed current through copper windings. Their combined magnetic field turns around the stator."],
    ["Rotor and air gap", "The rotor turns with the shaft. The narrow air gap is mechanically empty but magnetically important."],
    ["NdFeB magnets", "Neodymium-iron-boron magnets sit inside the rotor. Their field is present before the motor draws current."],
    ["Rotating magnetic field", "The stator field rotates and the permanent-magnet rotor turns synchronously. The shaft delivers mechanical power."]
  ];

  function setAssemblyStage(stage) {
    const safeStage = Math.max(0, Math.min(assemblyCopy.length - 1, Number(stage)));
    assemblyFrame?.setAttribute("data-stage", String(safeStage));
    assemblySteps.forEach((step) => {
      const active = Number(step.dataset.stage) === safeStage;
      step.classList.toggle("is-active", active);
      $("button", step)?.setAttribute("aria-current", active ? "step" : "false");
    });
    if (assemblyLabel) assemblyLabel.textContent = assemblyCopy[safeStage][0];
    if (assemblyNote) assemblyNote.textContent = assemblyCopy[safeStage][1];
  }

  assemblySteps.forEach((step) => {
    $("button", step)?.addEventListener("click", () => setAssemblyStage(step.dataset.stage));
  });

  if ("IntersectionObserver" in window) {
    const stepObserver = new IntersectionObserver((entries) => {
      const visible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (visible) setAssemblyStage(visible.target.dataset.stage);
    }, {
      rootMargin: "-28% 0px -42% 0px",
      threshold: [0.2, 0.45, 0.7]
    });
    assemblySteps.forEach((step) => stepObserver.observe(step));

    const supplySection = $(".supply-section");
    if (supplySection) {
      const supplyObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => entry.target.classList.toggle("in-view", entry.isIntersecting));
      }, { threshold: 0.24 });
      supplyObserver.observe(supplySection);
    }
  } else {
    $(".supply-section")?.classList.add("in-view");
  }

  const angleRange = $("#angleRange");
  const loadRange = $("#loadRange");
  const angleOutput = $("#angleOutput");
  const loadOutput = $("#loadOutput");
  const rotorAxis = $("#rotorAxis");
  const statorAxis = $("#statorAxis");
  const torqueArc = $("#torqueArc");
  const fieldPlay = $("#fieldPlay");
  const fieldStep = $("#fieldStep");
  const phaseElements = {
    a: $$(".phase-a"),
    b: $$(".phase-b"),
    c: $$(".phase-c")
  };
  const phaseBars = {
    a: $("#phaseA"),
    b: $("#phaseB"),
    c: $("#phaseC")
  };
  const phaseValues = {
    a: $("#phaseAValue"),
    b: $("#phaseBValue"),
    c: $("#phaseCValue")
  };
  let fieldAnimation = 0;

  function polar(angle, radius) {
    const radians = angle * Math.PI / 180;
    return {
      x: 310 + radius * Math.sin(radians),
      y: 310 - radius * Math.cos(radians)
    };
  }

  function setPhaseVisual(name, value) {
    const strength = Math.abs(value);
    phaseElements[name].forEach((element, index) => {
      const effective = index === 0 ? value : -value;
      const colour = effective >= 0 ? "#620d3c" : "#f1a222";
      element.style.fill = colour;
      element.style.opacity = String(0.25 + strength * 0.75);
    });
    const bar = phaseBars[name];
    if (bar) {
      const colour = value >= 0 ? "#620d3c" : "#f1a222";
      bar.style.background = colour;
      bar.style.left = value >= 0 ? "50%" : "0";
      bar.style.transformOrigin = value >= 0 ? "left center" : "right center";
      bar.style.transform = `scaleX(${strength})`;
    }
    if (phaseValues[name]) {
      phaseValues[name].textContent = value.toFixed(2).replace("-", "−");
    }
  }

  function updateField() {
    if (!angleRange || !loadRange) return;
    const angle = Number(angleRange.value);
    const torqueAngle = Number(loadRange.value) * 0.36;
    const rotorAngle = angle - torqueAngle;
    const radians = angle * Math.PI / 180;
    const phases = {
      a: Math.cos(radians),
      b: Math.cos(radians - 2 * Math.PI / 3),
      c: Math.cos(radians + 2 * Math.PI / 3)
    };

    setPhaseVisual("a", phases.a);
    setPhaseVisual("b", phases.b);
    setPhaseVisual("c", phases.c);
    statorAxis?.setAttribute("transform", `rotate(${angle} 310 310)`);
    rotorAxis?.setAttribute("transform", `rotate(${rotorAngle} 310 310)`);

    if (torqueArc) {
      if (torqueAngle < 1) {
        torqueArc.setAttribute("d", "");
      } else {
        const start = polar(rotorAngle, 152);
        const end = polar(angle, 152);
        torqueArc.setAttribute("d", `M${start.x.toFixed(1)} ${start.y.toFixed(1)}A152 152 0 0 1 ${end.x.toFixed(1)} ${end.y.toFixed(1)}`);
      }
    }
    if (angleOutput) angleOutput.textContent = `${Math.round(angle)}°`;
    if (loadOutput) loadOutput.textContent = `${loadRange.value}%`;
  }

  function stopFieldAnimation() {
    if (fieldAnimation) cancelAnimationFrame(fieldAnimation);
    fieldAnimation = 0;
    if (fieldPlay) {
      fieldPlay.disabled = false;
      fieldPlay.textContent = "Play one cycle";
    }
  }

  function playFieldCycle() {
    if (!angleRange || fieldAnimation) return;
    if (reduceMotion.matches) {
      angleRange.value = String((Number(angleRange.value) + 30) % 361);
      updateField();
      return;
    }
    const startAngle = Number(angleRange.value);
    const duration = 3600;
    const startTime = performance.now();
    if (fieldPlay) {
      fieldPlay.disabled = true;
      fieldPlay.textContent = "Playing…";
    }

    function frame(now) {
      const elapsed = now - startTime;
      const progressValue = Math.min(1, elapsed / duration);
      angleRange.value = String((startAngle + progressValue * 360) % 360);
      updateField();
      if (progressValue < 1 && !document.hidden) {
        fieldAnimation = requestAnimationFrame(frame);
      } else {
        angleRange.value = String(startAngle);
        updateField();
        stopFieldAnimation();
      }
    }
    fieldAnimation = requestAnimationFrame(frame);
  }

  angleRange?.addEventListener("input", () => {
    stopFieldAnimation();
    updateField();
  });
  loadRange?.addEventListener("input", updateField);
  fieldPlay?.addEventListener("click", playFieldCycle);
  fieldStep?.addEventListener("click", () => {
    stopFieldAnimation();
    angleRange.value = String((Number(angleRange.value) + 30) % 361);
    updateField();
  });
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) stopFieldAnimation();
  });
  updateField();

  const architectureData = {
    pmsm: {
      type: "Permanent field",
      name: "Permanent-magnet synchronous motor",
      description: "Permanent magnets create the rotor field without rotor current. This supports compact design and low rotor losses.",
      field: "NdFeB magnets",
      change: "Magnet pockets in a laminated rotor",
      cost: "Magnet supply and high-speed field weakening",
      evidence: "Widely deployed in electric vehicles",
      legend: "NdFeB magnets in rotor"
    },
    wound: {
      type: "Electrically supplied field",
      name: "Wound-field synchronous motor",
      description: "Direct current in a rotor winding creates the magnetic field. The controller can reduce that field at high speed.",
      field: "Current in a rotor coil",
      change: "Rotor winding and an exciter or contact system",
      cost: "Excitation loss, heat and added hardware",
      evidence: "Used in current Renault and BMW vehicles",
      legend: "Copper rotor winding"
    },
    induction: {
      type: "Induced field",
      name: "Induction motor",
      description: "The stator field induces current in conductive rotor bars. The rotor must turn slightly slower than the field for induction to continue.",
      field: "Current induced in a rotor cage",
      change: "Conductive bars joined by end rings",
      cost: "Rotor heat and lower part-load efficiency in some designs",
      evidence: "Used in production electric vehicles",
      legend: "Conductive rotor cage"
    },
    synrm: {
      type: "Reluctance torque",
      name: "Synchronous reluctance motor",
      description: "Flux barriers make one rotor axis magnetically easier than the other. The rotor aligns with the rotating stator field.",
      field: "No separate rotor field",
      change: "Precisely shaped flux barriers in electrical steel",
      cost: "Power factor, torque ripple and control demands",
      evidence: "Commercial in industry; traction designs developing",
      legend: "Flux barriers"
    },
    srm: {
      type: "Switched reluctance torque",
      name: "Switched reluctance motor",
      description: "The controller energises stator pole pairs in sequence. A toothed steel rotor moves towards the active poles.",
      field: "Sequential stator excitation",
      change: "Salient rotor and stator poles",
      cost: "Acoustic noise, torque ripple and control",
      evidence: "Commercial in some uses; vehicle programmes developing",
      legend: "Salient steel rotor"
    }
  };

  const architectureFields = {
    type: $("#architectureType"),
    name: $("#architectureName"),
    description: $("#architectureDescription"),
    field: $("#architectureField"),
    change: $("#architectureChange"),
    cost: $("#architectureCost"),
    evidence: $("#architectureEvidence"),
    legend: $("#architectureLegend")
  };

  function setArchitecture(key) {
    const data = architectureData[key];
    if (!data) return;
    $$(".architecture-tabs button").forEach((button) => {
      const selected = button.dataset.architecture === key;
      button.setAttribute("aria-selected", String(selected));
      button.tabIndex = selected ? 0 : -1;
    });
    $$(".rotor-option").forEach((rotor) => {
      rotor.classList.toggle("is-active", rotor.dataset.rotor === key);
    });
    Object.entries(architectureFields).forEach(([field, element]) => {
      if (!element) return;
      if (field === "legend") {
        element.innerHTML = `<i></i>${data[field]}`;
      } else {
        element.textContent = data[field];
      }
    });
  }

  $$(".architecture-tabs button").forEach((button) => {
    button.addEventListener("click", () => setArchitecture(button.dataset.architecture));
  });

  function enableTabKeys(tablistSelector, dataKey, activate) {
    const tablist = $(tablistSelector);
    if (!tablist) return;
    tablist.addEventListener("keydown", (event) => {
      const tabs = $$('[role="tab"]', tablist);
      const current = tabs.indexOf(document.activeElement);
      if (current < 0) return;
      let next = current;
      if (event.key === "ArrowRight") next = (current + 1) % tabs.length;
      else if (event.key === "ArrowLeft") next = (current - 1 + tabs.length) % tabs.length;
      else if (event.key === "Home") next = 0;
      else if (event.key === "End") next = tabs.length - 1;
      else return;
      event.preventDefault();
      tabs[next].focus();
      activate(tabs[next].dataset[dataKey]);
    });
  }

  enableTabKeys(".architecture-tabs", "architecture", setArchitecture);
  setArchitecture("pmsm");

  const lossGrid = $("#lossGrid");
  if (lossGrid) {
    for (let row = 0; row < 6; row += 1) {
      for (let column = 0; column < 8; column += 1) {
        const torque = 1 - row / 5;
        const speed = column / 7;
        const loss = 0.68 * torque * torque + 0.48 * Math.pow(speed, 1.5) + 0.14 * torque * speed;
        const cell = document.createElement("span");
        cell.className = "loss-cell";
        if (loss > 0.85) cell.classList.add("very-high");
        else if (loss > 0.58) cell.classList.add("high");
        else if (loss > 0.30) cell.classList.add("mid");
        cell.setAttribute("aria-hidden", "true");
        lossGrid.appendChild(cell);
      }
    }
  }

  const lossArchitecture = $("#lossArchitecture");
  const lossSpeed = $("#lossSpeed");
  const lossTorque = $("#lossTorque");
  const lossSpeedOutput = $("#lossSpeedOutput");
  const lossTorqueOutput = $("#lossTorqueOutput");
  const mapMarker = $("#mapMarker");
  const copperHeat = $("#copperHeat");
  const ironHeat = $("#ironHeat");
  const rotorHeat = $("#rotorHeat");
  const lossConcern = $("#lossConcern");

  function heatBand(value) {
    if (value >= 0.68) return "High";
    if (value >= 0.32) return "Moderate";
    return "Low";
  }

  function updateMarker() {
    if (!lossGrid || !mapMarker || !lossSpeed || !lossTorque) return;
    const gridBox = lossGrid.getBoundingClientRect();
    const mapBox = lossGrid.parentElement.getBoundingClientRect();
    const x = gridBox.left - mapBox.left + (Number(lossSpeed.value) / 100) * gridBox.width;
    const y = gridBox.top - mapBox.top + (1 - Number(lossTorque.value) / 100) * gridBox.height;
    mapMarker.style.left = `${x}px`;
    mapMarker.style.top = `${y}px`;
  }

  function updateLosses() {
    if (!lossSpeed || !lossTorque) return;
    const speed = Number(lossSpeed.value) / 100;
    const torque = Number(lossTorque.value) / 100;
    const architecture = lossArchitecture?.value || "pmsm";
    const architectureRotor = {
      pmsm: 0.08 + 0.08 * speed,
      wound: 0.28 + 0.34 * torque + 0.12 * speed,
      induction: 0.30 + 0.46 * torque,
      synrm: 0.06 + 0.08 * speed,
      srm: 0.10 + 0.20 * torque
    };
    const copper = 0.10 + 0.82 * torque * torque + (architecture === "synrm" ? 0.12 : 0);
    const iron = 0.06 + 0.72 * speed * speed;
    const rotor = architectureRotor[architecture];

    if (lossSpeedOutput) lossSpeedOutput.textContent = `${Math.round(speed * 8000).toLocaleString("en-IN")} rpm`;
    if (lossTorqueOutput) lossTorqueOutput.textContent = `${Math.round(torque * 100)}%`;
    if (copperHeat) copperHeat.textContent = heatBand(copper);
    if (ironHeat) ironHeat.textContent = heatBand(iron);
    if (rotorHeat) rotorHeat.textContent = heatBand(rotor);

    const concerns = [
      { value: copper, text: "Stator copper heating" },
      { value: iron, text: "Electrical-steel loss at speed" },
      { value: rotor, text: architecture === "wound" ? "Rotor excitation heating" : architecture === "induction" ? "Induction-rotor heating" : "Rotor-related loss" }
    ].sort((a, b) => b.value - a.value);
    if (lossConcern) lossConcern.textContent = concerns[0].text;
    updateMarker();
  }

  const presets = {
    city: { speed: 18, torque: 70 },
    cruise: { speed: 66, torque: 22 },
    grade: { speed: 46, torque: 84 }
  };

  $$(".preset-row button").forEach((button) => {
    button.addEventListener("click", () => {
      const preset = presets[button.dataset.preset];
      if (!preset || !lossSpeed || !lossTorque) return;
      lossSpeed.value = String(preset.speed);
      lossTorque.value = String(preset.torque);
      $$(".preset-row button").forEach((item) => item.classList.toggle("active", item === button));
      updateLosses();
    });
  });

  [lossSpeed, lossTorque].forEach((input) => input?.addEventListener("input", () => {
    $$(".preset-row button").forEach((button) => button.classList.remove("active"));
    updateLosses();
  }));
  lossArchitecture?.addEventListener("change", updateLosses);
  window.addEventListener("resize", updateMarker);
  updateLosses();

  const applicationData = {
    twoWheeler: {
      requirements: "Low cost, compact packaging, stop-start operation and serviceability.",
      routes: "Ferrite PM, switched reluctance and synchronous reluctance can be relevant where cost and material security outweigh strict passenger-car refinement targets.",
      evidence: "Drive-cycle efficiency, low-speed torque, controller cost, acoustic performance and thermal limits in Indian ambient conditions."
    },
    passenger: {
      requirements: "High torque density, refinement, broad speed range, crash packaging and strong drive-cycle efficiency.",
      routes: "Wound-field and induction motors have production evidence. Ferrite PM and reluctance designs remain more dependent on the vehicle target and the supplier’s validated design.",
      evidence: "Vehicle-level efficiency, continuous power, cooling demand, inverter rating, noise and production cost at the intended volume."
    },
    heavy: {
      requirements: "Continuous power, thermal durability, long grades, predictable service intervals and high uptime.",
      routes: "Wound-field and induction machines can suit sustained operation. The final choice depends on cooling, rotor loss and the required speed range.",
      evidence: "Continuous ratings at temperature, grade cycles, insulation life, bearing loads, inverter redundancy and field-service data."
    },
    industrial: {
      requirements: "Reliability, long operating hours, system efficiency, controllability and total cost of ownership.",
      routes: "Induction and synchronous reluctance are established commercial choices. Permanent-magnet motors remain useful where compactness and low-speed efficiency justify their cost.",
      evidence: "IEC efficiency class, operating-point profile, drive compatibility, maintenance record and measured payback against the incumbent system."
    }
  };

  function setApplication(key) {
    const data = applicationData[key];
    if (!data) return;
    $$(".application-tabs button").forEach((button) => {
      const selected = button.dataset.application === key;
      button.setAttribute("aria-selected", String(selected));
      button.tabIndex = selected ? 0 : -1;
    });
    $("#applicationRequirements").textContent = data.requirements;
    $("#applicationRoutes").textContent = data.routes;
    $("#applicationEvidence").textContent = data.evidence;
  }

  $$(".application-tabs button").forEach((button) => {
    button.addEventListener("click", () => setApplication(button.dataset.application));
  });
  enableTabKeys(".application-tabs", "application", setApplication);
  setApplication("twoWheeler");
})();
