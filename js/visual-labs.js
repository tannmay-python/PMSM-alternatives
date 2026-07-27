import { DRIVE_CYCLES, FIELD_OPTIONS, MOTOR_MODES } from "./data.js";

function getVar(name, fallback) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;
}

function fitCanvas(canvas, minHeight = 1) {
  const rect = canvas.getBoundingClientRect();
  const dpr = Math.min(devicePixelRatio || 1, 2);
  const width = Math.max(320, Math.round(rect.width * dpr));
  const height = Math.max(minHeight, Math.round(rect.height * dpr));
  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
  }
  return { width, height, dpr };
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function interpolate(values, progress) {
  const exact = progress * (values.length - 1);
  const left = Math.floor(exact);
  const right = Math.min(values.length - 1, left + 1);
  return lerp(values[left], values[right], exact - left);
}

function roundedRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.roundRect(x, y, width, height, radius);
}

export class DriveLab {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.cycle = "city";
    this.progress = .36;
    this.motorMode = "pmsm";
    this.phase = 0;
    this.reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
    this.elements = {
      speed: document.getElementById("driveSpeed"),
      power: document.getElementById("drivePower"),
      efficiency: document.getElementById("driveEfficiency"),
      battery: document.getElementById("batteryPower"),
      wheel: document.getElementById("wheelPower"),
      inverter: document.getElementById("inverterLoss"),
      motor: document.getElementById("motorLoss"),
      gear: document.getElementById("gearLoss"),
      time: document.getElementById("timeOutput"),
      slider: document.getElementById("timeRange"),
      interpretation: document.getElementById("cycleInterpretation")
    };

    this.bind();
    this.resize();
    this.update();
    this.animate = this.animate.bind(this);
    requestAnimationFrame(this.animate);
  }

  bind() {
    document.getElementById("cycleTabs").addEventListener("click", (event) => {
      const button = event.target.closest("[data-cycle]");
      if (!button) return;
      this.cycle = button.dataset.cycle;
      document.querySelectorAll("#cycleTabs button").forEach((item) => {
        item.classList.toggle("active", item === button);
      });
      this.elements.interpretation.textContent = DRIVE_CYCLES[this.cycle].interpretation;
      this.update();
    });

    this.elements.slider.addEventListener("input", () => {
      this.progress = Number(this.elements.slider.value) / 100;
      this.update();
    });

    window.addEventListener("motorchange", (event) => {
      this.motorMode = event.detail.mode;
      this.update();
    });

    new ResizeObserver(() => this.resize()).observe(this.canvas);
  }

  resize() {
    fitCanvas(this.canvas, 240);
  }

  calculate() {
    const cycle = DRIVE_CYCLES[this.cycle];
    const speed = interpolate(cycle.speed, this.progress);
    const grade = interpolate(cycle.grade, this.progress);
    const accelerationIndex = Math.min(1, Math.abs(interpolate(cycle.speed, Math.min(1, this.progress + .025)) - speed) / 12);
    const dragPower = .000035 * speed * speed * speed;
    const rollingPower = speed * .055;
    const gradePower = Math.max(-12, grade * speed * .105);
    const accelerationPower = accelerationIndex * (this.cycle === "city" ? 24 : 11);
    const wheelPower = Math.max(0.4, dragPower + rollingPower + gradePower + accelerationPower);
    const speedFactor = speed / 115;
    const loadFactor = Math.min(1, wheelPower / 78);
    const motor = MOTOR_MODES[this.motorMode];
    const copper = motor.baseLoss.copper + motor.lossSlope.copper * loadFactor * loadFactor;
    const iron = motor.baseLoss.iron + motor.lossSlope.iron * speedFactor * speedFactor;
    const rotor = motor.baseLoss.rotor + motor.lossSlope.rotor * loadFactor;
    const lowLoadPenalty = Math.max(0, .17 - loadFactor) * 13;
    const motorEfficiency = Math.max(76, Math.min(97.4, 100 - copper - iron - rotor - lowLoadPenalty));
    const gearEfficiency = 98.4;
    const inverterEfficiency = 97.7 - Math.max(0, .12 - loadFactor) * 7;
    const motorInput = wheelPower / (gearEfficiency / 100) / (motorEfficiency / 100);
    const batteryPower = motorInput / (inverterEfficiency / 100);
    return {
      speed,
      grade,
      wheelPower,
      motorEfficiency,
      batteryPower,
      inverterLoss: batteryPower - motorInput,
      motorLoss: motorInput - wheelPower / (gearEfficiency / 100),
      gearLoss: wheelPower / (gearEfficiency / 100) - wheelPower
    };
  }

  update() {
    const values = this.calculate();
    const seconds = Math.round(this.progress * (this.cycle === "city" ? 385 : this.cycle === "highway" ? 640 : 520));
    this.elements.speed.value = Math.round(values.speed);
    this.elements.power.value = Math.round(values.wheelPower);
    this.elements.efficiency.value = values.motorEfficiency.toFixed(1);
    this.elements.battery.value = values.batteryPower.toFixed(1);
    this.elements.wheel.value = values.wheelPower.toFixed(1);
    this.elements.inverter.textContent = `${values.inverterLoss.toFixed(1)} kW`;
    this.elements.motor.textContent = `${values.motorLoss.toFixed(1)} kW`;
    this.elements.gear.textContent = `${values.gearLoss.toFixed(1)} kW`;
    this.elements.time.value = `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
    const maxLoss = Math.max(.3, values.motorLoss);
    document.querySelector(".flow-segment.inverter").style.setProperty("--loss-height", `${Math.max(42, values.inverterLoss / maxLoss * 100)}%`);
    document.querySelector(".flow-segment.motor").style.setProperty("--loss-height", "100%");
    document.querySelector(".flow-segment.gear").style.setProperty("--loss-height", `${Math.max(42, values.gearLoss / maxLoss * 100)}%`);
  }

  drawCar(ctx, x, y, scale, wheelSpin, colors) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);
    ctx.fillStyle = colors.body;
    roundedRect(ctx, -102, -42, 204, 55, 16);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(-72, -42);
    ctx.lineTo(-40, -78);
    ctx.lineTo(42, -78);
    ctx.lineTo(78, -42);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = colors.glass;
    ctx.beginPath();
    ctx.moveTo(-56, -46);
    ctx.lineTo(-34, -70);
    ctx.lineTo(-4, -70);
    ctx.lineTo(-4, -46);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(4, -70);
    ctx.lineTo(35, -70);
    ctx.lineTo(59, -46);
    ctx.lineTo(4, -46);
    ctx.closePath();
    ctx.fill();

    for (const wheelX of [-65, 66]) {
      ctx.save();
      ctx.translate(wheelX, 11);
      ctx.rotate(wheelSpin);
      ctx.fillStyle = colors.wheel;
      ctx.beginPath();
      ctx.arc(0, 0, 22, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = colors.hub;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(-10, 0);
      ctx.lineTo(10, 0);
      ctx.moveTo(0, -10);
      ctx.lineTo(0, 10);
      ctx.stroke();
      ctx.restore();
    }
    ctx.restore();
  }

  draw() {
    const ctx = this.ctx;
    const { width, height } = fitCanvas(this.canvas, 240);
    const values = this.calculate();
    const sky = getVar("--scene-sky", "#eadbc8");
    const ground = getVar("--scene-ground", "#d8c3aa");
    const road = getVar("--scene-road", "#6a5e58");
    const ink = getVar("--ink", "#241d1b");
    const paper = getVar("--paper", "#fbf7ee");
    const colors = {
      body: getVar("--car-body", "#620d3c"),
      glass: getVar("--car-glass", "#dbc9b4"),
      wheel: getVar("--wheel", "#201c1a"),
      hub: getVar("--wheel-hub", "#b4a594")
    };

    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, sky);
    gradient.addColorStop(1, ground);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    const horizon = height * .61;
    ctx.fillStyle = getVar("--maroon", "#620d3c");
    ctx.globalAlpha = .12;
    const buildingWidth = width / 12;
    for (let i = 0; i < 14; i += 1) {
      const x = i * buildingWidth - (this.phase * 15 % buildingWidth);
      const buildingHeight = height * (.08 + ((i * 19) % 7) * .018);
      ctx.fillRect(x, horizon - buildingHeight, buildingWidth * .72, buildingHeight);
    }
    ctx.globalAlpha = 1;

    ctx.fillStyle = road;
    ctx.beginPath();
    ctx.moveTo(0, horizon);
    for (let x = 0; x <= width; x += width / 12) {
      const wave = Math.sin(x / width * Math.PI * 3 + this.progress * 5) * values.grade * height * .003;
      ctx.lineTo(x, horizon + wave);
    }
    ctx.lineTo(width, height);
    ctx.lineTo(0, height);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = "rgba(255,255,255,.5)";
    ctx.lineWidth = Math.max(2, width * .004);
    ctx.setLineDash([width * .05, width * .035]);
    ctx.lineDashOffset = -(this.phase * 90 % (width * .085));
    ctx.beginPath();
    ctx.moveTo(0, height * .82);
    ctx.lineTo(width, height * .82);
    ctx.stroke();
    ctx.setLineDash([]);

    const carScale = Math.min(width / 900, height / 400) * .92;
    const carX = width * .5;
    const carY = height * .68;
    this.drawCar(ctx, carX, carY, carScale, this.phase * values.speed * .12, colors);

    const pulseCount = Math.min(14, Math.max(3, Math.round(values.wheelPower / 4)));
    for (let i = 0; i < pulseCount; i += 1) {
      const phase = (this.phase * .6 + i / pulseCount) % 1;
      const x = carX - 115 * carScale - phase * width * .34;
      const y = carY - 25 * carScale + Math.sin(phase * Math.PI * 4 + i) * 7;
      ctx.fillStyle = i % 2 ? getVar("--gold", "#f1a222") : getVar("--maroon", "#620d3c");
      ctx.globalAlpha = .65 * (1 - phase);
      ctx.beginPath();
      ctx.arc(x, y, 2 + carScale * 2.5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    ctx.fillStyle = ink;
    ctx.font = `${Math.max(10, width * .013)}px 'JetBrains Mono'`;
    ctx.textAlign = "left";
    ctx.fillText(DRIVE_CYCLES[this.cycle].label.toUpperCase(), width * .035, height * .09);
    ctx.fillStyle = paper;
    ctx.globalAlpha = .7;
    ctx.fillText(`${values.grade.toFixed(1)}% GRADE`, width * .035, height * .15);
    ctx.globalAlpha = 1;
  }

  animate() {
    if (!this.reducedMotion) this.phase += .012;
    this.draw();
    requestAnimationFrame(() => this.animate());
  }
}

export class FieldMap {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.selected = 0;
    this.hovered = -1;
    this.points = [];
    this.bind();
    this.resize();
    this.renderDetail();
    this.draw();
  }

  bind() {
    const locate = (event) => {
      const rect = this.canvas.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width;
      const y = (event.clientY - rect.top) / rect.height;
      let nearest = -1;
      let distance = .09;
      this.points.forEach((point, index) => {
        const d = Math.hypot(x - point.x, y - point.y);
        if (d < distance) {
          distance = d;
          nearest = index;
        }
      });
      return nearest;
    };

    this.canvas.addEventListener("pointermove", (event) => {
      const next = locate(event);
      if (next !== this.hovered) {
        this.hovered = next;
        this.canvas.style.cursor = next >= 0 ? "pointer" : "crosshair";
        this.draw();
      }
    });

    this.canvas.addEventListener("pointerleave", () => {
      this.hovered = -1;
      this.draw();
    });

    this.canvas.addEventListener("click", (event) => {
      const next = locate(event);
      if (next < 0) return;
      this.selected = next;
      this.renderDetail();
      this.draw();
    });

    this.canvas.addEventListener("keydown", (event) => {
      if (!["ArrowRight", "ArrowLeft", "ArrowUp", "ArrowDown"].includes(event.key)) return;
      event.preventDefault();
      const direction = event.key === "ArrowRight" || event.key === "ArrowDown" ? 1 : -1;
      this.selected = (this.selected + direction + FIELD_OPTIONS.length) % FIELD_OPTIONS.length;
      this.renderDetail();
      this.draw();
    });

    this.canvas.tabIndex = 0;
    new ResizeObserver(() => {
      this.resize();
      this.draw();
    }).observe(this.canvas);
  }

  resize() {
    fitCanvas(this.canvas, 300);
  }

  renderDetail() {
    const item = FIELD_OPTIONS[this.selected];
    document.getElementById("fieldIndex").textContent = `${String(this.selected + 1).padStart(2, "0")} / ${String(FIELD_OPTIONS.length).padStart(2, "0")}`;
    document.getElementById("fieldStatus").textContent = item.status;
    document.getElementById("fieldName").textContent = item.name;
    document.getElementById("fieldPrinciple").textContent = item.principle;
    document.getElementById("fieldGain").textContent = item.gain;
    document.getElementById("fieldCost").textContent = item.cost;
    document.getElementById("fieldEvidence").textContent = item.evidence;
    document.getElementById("fieldCompanies").innerHTML = item.companies.map((company) => `<span>${company}</span>`).join("");
    document.getElementById("fieldSource").innerHTML = `<a href="${item.source}" target="_blank" rel="noopener">${item.sourceLabel} ↗</a>`;
  }

  draw() {
    const ctx = this.ctx;
    const { width, height } = fitCanvas(this.canvas, 300);
    const ink = getVar("--ink", "#241d1b");
    const ink3 = getVar("--ink-3", "#756a62");
    const line = getVar("--line", "#dcd1c1");
    const maroon = getVar("--maroon", "#620d3c");
    const gold = getVar("--gold", "#f1a222");
    const surface = getVar("--surface-2", "#f7f0e3");
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = surface;
    ctx.fillRect(0, 0, width, height);

    const margin = {
      left: width * .12,
      right: width * .06,
      top: height * .10,
      bottom: height * .14
    };
    const plotW = width - margin.left - margin.right;
    const plotH = height - margin.top - margin.bottom;

    ctx.strokeStyle = line;
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i += 1) {
      const x = margin.left + plotW * i / 4;
      const y = margin.top + plotH * i / 4;
      ctx.beginPath();
      ctx.moveTo(x, margin.top);
      ctx.lineTo(x, margin.top + plotH);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(margin.left, y);
      ctx.lineTo(margin.left + plotW, y);
      ctx.stroke();
    }

    ctx.fillStyle = ink3;
    ctx.font = `${Math.max(9, width * .012)}px 'JetBrains Mono'`;
    ctx.textAlign = "center";
    const xLabels = ["Lab", "Prototype", "Pilot", "Niche", "Mass"];
    xLabels.forEach((label, index) => {
      ctx.fillText(label, margin.left + plotW * index / 4, height - margin.bottom * .46);
    });
    ctx.fillText("COMMERCIAL MATURITY", margin.left + plotW / 2, height - 8);
    ctx.save();
    ctx.translate(width * .03, margin.top + plotH / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText("TRACTION POWER DENSITY", 0, 0);
    ctx.restore();

    this.points = [];
    FIELD_OPTIONS.forEach((item, index) => {
      const x = margin.left + plotW * item.maturity;
      const y = margin.top + plotH * (1 - item.density);
      const radius = Math.max(18, width * item.size / 760);
      const active = index === this.selected;
      const hover = index === this.hovered;
      this.points.push({ x: x / width, y: y / height });

      ctx.save();
      ctx.shadowColor = active ? maroon : "transparent";
      ctx.shadowBlur = active ? 22 : 0;
      ctx.fillStyle = item.magnetRoute ? surface : maroon;
      ctx.strokeStyle = active || hover ? gold : maroon;
      ctx.lineWidth = active ? 5 : hover ? 4 : 2.5;
      ctx.beginPath();
      ctx.arc(x, y, radius * (hover ? 1.08 : 1), 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.shadowBlur = 0;
      ctx.fillStyle = item.magnetRoute ? maroon : "#fff8e9";
      ctx.font = `600 ${Math.max(9, width * .014)}px 'DM Sans'`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      const lines = item.short.split(" ");
      if (lines.length > 1) {
        ctx.fillText(lines[0], x, y - 6);
        ctx.fillText(lines.slice(1).join(" "), x, y + 7);
      } else {
        ctx.fillText(item.short, x, y);
      }
      ctx.restore();
    });

    ctx.fillStyle = ink;
    ctx.globalAlpha = .36;
    ctx.font = `${Math.max(9, width * .011)}px 'JetBrains Mono'`;
    ctx.textAlign = "right";
    ctx.fillText("SELECT A ROUTE", width - margin.right, margin.top - 14);
    ctx.globalAlpha = 1;
  }
}

export class MaterialsFlow {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.phase = 0;
    this.pointer = { x: .5, y: .4, active: false };
    this.reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
    this.particles = Array.from({ length: 84 }, (_, index) => ({
      route: index % 4,
      material: index % 3,
      offset: ((index * 37) % 83) / 83,
      size: 2 + (index % 4)
    }));
    this.bind();
    this.resize();
    this.animate = this.animate.bind(this);
    requestAnimationFrame(this.animate);
  }

  bind() {
    this.canvas.addEventListener("pointermove", (event) => {
      const rect = this.canvas.getBoundingClientRect();
      this.pointer.x = (event.clientX - rect.left) / rect.width;
      this.pointer.y = (event.clientY - rect.top) / rect.height;
      this.pointer.active = true;
    });
    this.canvas.addEventListener("pointerleave", () => {
      this.pointer.active = false;
    });
    new ResizeObserver(() => this.resize()).observe(this.canvas);
  }

  resize() {
    fitCanvas(this.canvas, 420);
  }

  bezier(a, b, c, d, t) {
    const u = 1 - t;
    return u * u * u * a + 3 * u * u * t * b + 3 * u * t * t * c + t * t * t * d;
  }

  drawMotorGlyph(ctx, x, y, radius, index, label) {
    const maroon = "#8f2c5b";
    const gold = "#f1a222";
    ctx.save();
    ctx.translate(x, y);
    ctx.strokeStyle = "rgba(255,255,255,.22)";
    ctx.lineWidth = radius * .12;
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.stroke();
    for (let i = 0; i < 12; i += 1) {
      const angle = i / 12 * Math.PI * 2;
      ctx.fillStyle = i % 3 === index % 3 ? gold : maroon;
      ctx.beginPath();
      ctx.arc(Math.cos(angle) * radius, Math.sin(angle) * radius, radius * .09, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = index === 2 ? "rgba(255,255,255,.12)" : maroon;
    ctx.beginPath();
    if (index === 2) {
      for (let i = 0; i < 12; i += 1) {
        const angle = i * Math.PI / 6;
        const r = i % 2 ? radius * .31 : radius * .57;
        const px = Math.cos(angle) * r;
        const py = Math.sin(angle) * r;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
    } else {
      ctx.arc(0, 0, radius * .53, 0, Math.PI * 2);
    }
    ctx.fill();
    ctx.fillStyle = "rgba(255,248,233,.82)";
    ctx.font = `500 ${Math.max(11, radius * .22)}px 'JetBrains Mono'`;
    ctx.textAlign = "center";
    ctx.fillText(label, 0, radius + 28);
    ctx.restore();
  }

  draw() {
    const ctx = this.ctx;
    const { width, height } = fitCanvas(this.canvas, 420);
    const labels = ["WOUND FIELD", "INDUCTION", "RELUCTANCE", "FERRITE"];
    const materialLabels = ["COPPER", "ELECTRICAL STEEL", "CONTROL"];
    const colors = ["#dc873e", "#9ba0a7", "#f1a222"];
    ctx.clearRect(0, 0, width, height);

    const bg = ctx.createRadialGradient(width * .6, height * .3, 0, width * .6, height * .3, width * .85);
    bg.addColorStop(0, "#301522");
    bg.addColorStop(.55, "#181014");
    bg.addColorStop(1, "#0d0a0c");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, width, height);

    const materialX = width * .09;
    const destinations = labels.map((_, index) => ({
      x: width * (.38 + index * .17),
      y: height * (.30 + (index % 2) * .18)
    }));
    const sources = materialLabels.map((_, index) => ({
      x: materialX,
      y: height * (.18 + index * .18)
    }));

    ctx.font = `${Math.max(9, width * .008)}px 'JetBrains Mono'`;
    ctx.textAlign = "left";
    materialLabels.forEach((label, index) => {
      const source = sources[index];
      ctx.fillStyle = colors[index];
      ctx.globalAlpha = .9;
      ctx.beginPath();
      ctx.arc(source.x, source.y, Math.max(4, width * .006), 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "rgba(255,248,233,.62)";
      ctx.fillText(label, source.x + 15, source.y + 4);
    });
    ctx.globalAlpha = 1;

    this.particles.forEach((particle) => {
      const source = sources[particle.material];
      const end = destinations[particle.route];
      let t = (this.phase * (.15 + particle.material * .018) + particle.offset) % 1;
      if (this.reducedMotion) t = particle.offset;
      const bend = (particle.route - 1.5) * height * .09;
      const x = this.bezier(source.x, width * .25, width * .28, end.x, t);
      const y = this.bezier(source.y, source.y + bend, end.y - bend, end.y, t);
      const pointerDistance = Math.hypot(x / width - this.pointer.x, y / height - this.pointer.y);
      const scale = this.pointer.active && pointerDistance < .12 ? 2 : 1;
      ctx.fillStyle = colors[particle.material];
      ctx.globalAlpha = Math.sin(t * Math.PI) * .75;
      ctx.beginPath();
      ctx.arc(x, y, particle.size * scale * Math.min(1.6, width / 900), 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;

    destinations.forEach((point, index) => {
      this.drawMotorGlyph(ctx, point.x, point.y, Math.min(width, height) * .075, index, labels[index]);
    });

    ctx.fillStyle = "rgba(255,248,233,.32)";
    ctx.font = `${Math.max(9, width * .0075)}px 'JetBrains Mono'`;
    ctx.textAlign = "right";
    ctx.fillText("MOVE THROUGH THE MATERIAL STREAM", width * .94, height * .11);
  }

  animate() {
    if (!this.reducedMotion) this.phase += .013;
    this.draw();
    requestAnimationFrame(() => this.animate());
  }
}
