import { MOTOR_MODES } from "./data.js";

const TAU = Math.PI * 2;

function cssColor(name, fallback) {
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return value || fallback;
}

function roundedRect(ctx, x, y, width, height, radius) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.roundRect(x, y, width, height, r);
}

function arrow(ctx, x, y, length, angle, color, label) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(length, 0);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(length, 0);
  ctx.lineTo(length - 11, -7);
  ctx.lineTo(length - 11, 7);
  ctx.closePath();
  ctx.fill();
  ctx.font = "500 11px 'JetBrains Mono'";
  ctx.textAlign = "left";
  ctx.fillText(label, length + 8, 4);
  ctx.restore();
}

export class MotorLab {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.mode = "pmsm";
    this.torque = 54;
    this.speed = 52;
    this.paused = matchMedia("(prefers-reduced-motion: reduce)").matches;
    this.dragging = false;
    this.statorAngle = 0;
    this.rotorAngle = -.12;
    this.last = performance.now();
    this.frame = 0;
    this.elements = {
      rotor: document.getElementById("rotorReadout"),
      slip: document.getElementById("slipReadout"),
      penalty: document.getElementById("penaltyReadout"),
      name: document.getElementById("motorName"),
      explanation: document.getElementById("motorExplanation"),
      torque: document.getElementById("torqueRange"),
      torqueOutput: document.getElementById("torqueOutput"),
      speed: document.getElementById("speedRange"),
      speedOutput: document.getElementById("speedOutput"),
      copperBar: document.getElementById("copperLossBar"),
      ironBar: document.getElementById("ironLossBar"),
      rotorBar: document.getElementById("rotorLossBar"),
      copperValue: document.getElementById("copperLossValue"),
      ironValue: document.getElementById("ironLossValue"),
      rotorValue: document.getElementById("rotorLossValue")
    };

    this.resize = this.resize.bind(this);
    this.animate = this.animate.bind(this);
    this.bind();
    this.resize();
    this.updateCopy();
    this.frame = requestAnimationFrame(this.animate);
  }

  bind() {
    document.getElementById("motorTabs").addEventListener("click", (event) => {
      const button = event.target.closest("[data-motor]");
      if (!button) return;
      this.mode = button.dataset.motor;
      document.querySelectorAll("#motorTabs [role='tab']").forEach((tab) => {
        tab.setAttribute("aria-selected", String(tab === button));
      });
      this.updateCopy();
    });

    this.elements.torque.addEventListener("input", () => {
      this.torque = Number(this.elements.torque.value);
      this.updateLosses();
    });

    this.elements.speed.addEventListener("input", () => {
      this.speed = Number(this.elements.speed.value);
      this.updateLosses();
    });

    const motionButton = document.getElementById("motionToggle");
    motionButton.addEventListener("click", () => {
      this.paused = !this.paused;
      motionButton.setAttribute("aria-pressed", String(this.paused));
      document.getElementById("motionLabel").textContent = this.paused ? "Play" : "Pause";
    });

    const pointerAngle = (event) => {
      const rect = this.canvas.getBoundingClientRect();
      const x = event.clientX - rect.left - rect.width / 2;
      const y = event.clientY - rect.top - rect.height / 2;
      return Math.atan2(y, x);
    };

    this.canvas.addEventListener("pointerdown", (event) => {
      this.dragging = true;
      this.canvas.setPointerCapture(event.pointerId);
      this.rotorAngle = pointerAngle(event);
    });

    this.canvas.addEventListener("pointermove", (event) => {
      if (!this.dragging) return;
      this.rotorAngle = pointerAngle(event);
    });

    this.canvas.addEventListener("pointerup", () => {
      this.dragging = false;
    });

    this.canvas.addEventListener("pointercancel", () => {
      this.dragging = false;
    });

    new ResizeObserver(this.resize).observe(this.canvas);
  }

  resize() {
    const rect = this.canvas.getBoundingClientRect();
    const dpr = Math.min(devicePixelRatio || 1, 2);
    const width = Math.max(320, Math.round(rect.width * dpr));
    const height = Math.max(420, Math.round(rect.height * dpr));
    if (this.canvas.width !== width || this.canvas.height !== height) {
      this.canvas.width = width;
      this.canvas.height = height;
    }
  }

  updateCopy() {
    const motor = MOTOR_MODES[this.mode];
    this.elements.rotor.textContent = motor.rotor;
    this.elements.penalty.textContent = motor.penalty;
    this.elements.name.textContent = motor.name;
    this.elements.explanation.textContent = motor.explanation;
    this.updateLosses();
    window.dispatchEvent(new CustomEvent("motorchange", { detail: { mode: this.mode } }));
  }

  updateLosses() {
    const motor = MOTOR_MODES[this.mode];
    const load = this.torque / 100;
    const speed = this.speed / 100;
    const copper = motor.baseLoss.copper + motor.lossSlope.copper * load * load;
    const iron = motor.baseLoss.iron + motor.lossSlope.iron * speed * speed;
    const rotor = motor.baseLoss.rotor + motor.lossSlope.rotor * load * (this.mode === "induction" ? .8 + speed * .35 : 1);
    const liveSlip = motor.slip * (.42 + load * .75);

    this.elements.torqueOutput.value = `${this.torque}%`;
    this.elements.speedOutput.value = `${Math.round(350 + this.speed * 28.3).toLocaleString()} rpm`;
    this.elements.slip.textContent = `${liveSlip.toFixed(0)}°`;
    this.elements.copperValue.value = `${copper.toFixed(1)}%`;
    this.elements.ironValue.value = `${iron.toFixed(1)}%`;
    this.elements.rotorValue.value = `${rotor.toFixed(1)}%`;
    this.elements.copperBar.style.width = `${Math.min(100, copper * 11)}%`;
    this.elements.ironBar.style.width = `${Math.min(100, iron * 16)}%`;
    this.elements.rotorBar.style.width = `${Math.min(100, rotor * 19)}%`;
  }

  drawStator(ctx, cx, cy, radius, time) {
    const teeth = this.mode === "srm" ? 12 : 18;
    const activeStep = Math.floor((this.statorAngle / TAU * teeth + teeth * 3) % teeth);
    ctx.save();
    ctx.translate(cx, cy);

    ctx.strokeStyle = "rgba(255,255,255,.15)";
    ctx.lineWidth = radius * .12;
    ctx.beginPath();
    ctx.arc(0, 0, radius * .88, 0, TAU);
    ctx.stroke();

    for (let i = 0; i < teeth; i += 1) {
      const angle = (i / teeth) * TAU;
      const phase = Math.cos(angle * 3 - this.statorAngle * 3);
      const glow = Math.max(0, phase);
      ctx.save();
      ctx.rotate(angle);
      ctx.translate(0, -radius * .83);
      roundedRect(ctx, -radius * .055, -radius * .13, radius * .11, radius * .28, radius * .02);
      ctx.fillStyle = `rgba(173, 177, 182, ${.38 + glow * .2})`;
      ctx.fill();
      ctx.shadowColor = phase > .35 ? "#f1a222" : "#7b234e";
      ctx.shadowBlur = phase > .35 ? 18 : 5;
      roundedRect(ctx, -radius * .067, -radius * .02, radius * .134, radius * .095, radius * .03);
      ctx.fillStyle = phase > 0 ? `rgba(241, 162, 34, ${.36 + glow * .6})` : `rgba(174, 63, 111, ${.35 + Math.abs(phase) * .46})`;
      ctx.fill();
      ctx.restore();
    }

    const ringGradient = ctx.createRadialGradient(0, 0, radius * .47, 0, 0, radius * .72);
    ringGradient.addColorStop(0, "rgba(0,0,0,0)");
    ringGradient.addColorStop(.8, "rgba(255,255,255,.025)");
    ringGradient.addColorStop(1, "rgba(255,255,255,.09)");
    ctx.fillStyle = ringGradient;
    ctx.beginPath();
    ctx.arc(0, 0, radius * .74, 0, TAU);
    ctx.fill();

    ctx.fillStyle = "rgba(255,255,255,.23)";
    ctx.beginPath();
    ctx.arc(
      Math.cos((activeStep / teeth) * TAU) * radius * .82,
      Math.sin((activeStep / teeth) * TAU) * radius * .82,
      2.5,
      0,
      TAU
    );
    ctx.fill();
    ctx.restore();
  }

  drawFlux(ctx, cx, cy, radius) {
    const color = MOTOR_MODES[this.mode].color;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(this.statorAngle);
    ctx.globalCompositeOperation = "screen";
    for (let i = 0; i < 8; i += 1) {
      const offset = (i - 3.5) * radius * .105;
      const alpha = .12 + (1 - Math.abs(i - 3.5) / 4) * .16;
      ctx.strokeStyle = color.replace(")", "");
      ctx.strokeStyle = `rgba(${this.hexToRgb(color)}, ${alpha})`;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(-radius * .72, offset);
      ctx.bezierCurveTo(-radius * .25, offset - radius * .38, radius * .25, offset - radius * .38, radius * .72, offset);
      ctx.bezierCurveTo(radius * .25, offset + radius * .38, -radius * .25, offset + radius * .38, -radius * .72, offset);
      ctx.stroke();
    }
    ctx.restore();
  }

  hexToRgb(hex) {
    const value = hex.replace("#", "");
    const number = Number.parseInt(value, 16);
    return `${(number >> 16) & 255}, ${(number >> 8) & 255}, ${number & 255}`;
  }

  drawRotor(ctx, cx, cy, radius) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(this.rotorAngle);

    ctx.shadowColor = "rgba(0,0,0,.45)";
    ctx.shadowBlur = 22;
    ctx.fillStyle = "#3c3d41";
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, TAU);
    ctx.fill();
    ctx.shadowBlur = 0;

    if (this.mode === "pmsm") this.drawPmsmRotor(ctx, radius);
    if (this.mode === "eesm") this.drawEesmRotor(ctx, radius);
    if (this.mode === "induction") this.drawInductionRotor(ctx, radius);
    if (this.mode === "synrm") this.drawSynrmRotor(ctx, radius);
    if (this.mode === "srm") this.drawSrmRotor(ctx, radius);

    ctx.fillStyle = "#151519";
    ctx.beginPath();
    ctx.arc(0, 0, radius * .16, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,.2)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, radius * .08, 0, TAU);
    ctx.stroke();
    ctx.restore();
  }

  drawPmsmRotor(ctx, radius) {
    for (let i = 0; i < 4; i += 1) {
      ctx.save();
      ctx.rotate(i * Math.PI / 2);
      roundedRect(ctx, -radius * .12, -radius * .78, radius * .24, radius * .44, radius * .035);
      ctx.fillStyle = i % 2 ? "#77234b" : "#e6a02d";
      ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,.82)";
      ctx.font = `600 ${Math.max(9, radius * .1)}px 'JetBrains Mono'`;
      ctx.textAlign = "center";
      ctx.fillText(i % 2 ? "S" : "N", 0, -radius * .52);
      ctx.restore();
    }
  }

  drawEesmRotor(ctx, radius) {
    ctx.strokeStyle = "#cf7d34";
    ctx.lineWidth = radius * .12;
    for (let i = -2; i <= 2; i += 1) {
      ctx.beginPath();
      ctx.ellipse(0, i * radius * .13, radius * .65, radius * .25, 0, 0, TAU);
      ctx.stroke();
    }
    ctx.fillStyle = "#6c2148";
    ctx.beginPath();
    ctx.arc(-radius * .61, 0, radius * .11, 0, TAU);
    ctx.arc(radius * .61, 0, radius * .11, 0, TAU);
    ctx.fill();
  }

  drawInductionRotor(ctx, radius) {
    ctx.strokeStyle = "#b6a075";
    ctx.lineWidth = radius * .07;
    ctx.beginPath();
    ctx.arc(0, 0, radius * .73, 0, TAU);
    ctx.stroke();
    for (let i = 0; i < 20; i += 1) {
      const angle = (i / 20) * TAU;
      const x = Math.cos(angle) * radius * .68;
      const y = Math.sin(angle) * radius * .68;
      ctx.fillStyle = "#c38239";
      ctx.beginPath();
      ctx.arc(x, y, radius * .04, 0, TAU);
      ctx.fill();
    }
  }

  drawSynrmRotor(ctx, radius) {
    ctx.save();
    ctx.strokeStyle = "#151519";
    ctx.lineWidth = radius * .11;
    ctx.lineCap = "round";
    for (const y of [-.42, -.19, .19, .42]) {
      ctx.beginPath();
      ctx.moveTo(-radius * .63, radius * y);
      ctx.quadraticCurveTo(0, radius * (y + (y < 0 ? .17 : -.17)), radius * .63, radius * y);
      ctx.stroke();
    }
    ctx.restore();
  }

  drawSrmRotor(ctx, radius) {
    ctx.fillStyle = "#676971";
    ctx.beginPath();
    for (let i = 0; i < 12; i += 1) {
      const angle = i * Math.PI / 6;
      const r = i % 2 === 0 ? radius * .92 : radius * .48;
      const x = Math.cos(angle) * r;
      const y = Math.sin(angle) * r;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();
  }

  draw(dt) {
    const ctx = this.ctx;
    const width = this.canvas.width;
    const height = this.canvas.height;
    const scale = Math.min(width / 860, height / 660);
    const cx = width * .5;
    const cy = height * .46;
    const radius = Math.min(width, height) * .36;
    const motor = MOTOR_MODES[this.mode];
    const liveSlip = motor.slip * (.42 + this.torque / 100 * .75) * Math.PI / 180;

    ctx.clearRect(0, 0, width, height);
    const background = ctx.createRadialGradient(cx, cy, radius * .2, cx, cy, radius * 1.5);
    background.addColorStop(0, "#2a1823");
    background.addColorStop(.56, "#171016");
    background.addColorStop(1, "#0e0b0d");
    ctx.fillStyle = background;
    ctx.fillRect(0, 0, width, height);

    if (!this.paused && !this.dragging) {
      const velocity = (.00035 + this.speed * .00001) * dt;
      this.statorAngle = (this.statorAngle + velocity) % TAU;
      const target = this.statorAngle - liveSlip;
      let delta = ((target - this.rotorAngle + Math.PI) % TAU) - Math.PI;
      this.rotorAngle += delta * Math.min(1, dt * .006);
    }

    this.drawStator(ctx, cx, cy, radius, performance.now());
    this.drawFlux(ctx, cx, cy, radius);
    this.drawRotor(ctx, cx, cy, radius * .43);

    const labelY = Math.max(34 * scale, cy - radius - 23 * scale);
    arrow(ctx, cx - radius * .36, labelY, radius * .35, this.statorAngle, "#f1a222", "STATOR FIELD");
    arrow(ctx, cx + radius * .22, labelY, radius * .24, this.rotorAngle, motor.color, "ROTOR FIELD");

    ctx.fillStyle = "rgba(255,255,255,.42)";
    ctx.font = `${Math.max(9, 10 * scale)}px 'JetBrains Mono'`;
    ctx.textAlign = "center";
    ctx.fillText("Drag the rotor", cx, cy + radius + 28 * scale);
  }

  animate(now) {
    const dt = Math.min(50, now - this.last);
    this.last = now;
    this.draw(dt);
    this.frame = requestAnimationFrame(this.animate);
  }
}
