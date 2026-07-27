import { APPLICATION_PRESETS, DECISION_MOTORS } from "./data.js";
import { MotorLab } from "./motor-lab.js";
import { DriveLab, FieldMap, MaterialsFlow } from "./visual-labs.js";

const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
let currentApplication = "city";

function initTheme() {
  const button = document.getElementById("themeToggle");

  const update = () => {
    const dark = document.documentElement.dataset.theme === "dark";
    button.setAttribute("aria-pressed", String(dark));
    button.setAttribute("aria-label", dark ? "Use light theme" : "Use dark theme");
  };

  button.addEventListener("click", () => {
    const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem("pmsm-theme", next);
    } catch (_) {}
    update();
    window.dispatchEvent(new CustomEvent("themechange"));
  });

  update();
}

function initReveals() {
  const elements = [...document.querySelectorAll(".reveal")];
  if (reducedMotion || !("IntersectionObserver" in window)) {
    elements.forEach((element) => element.classList.add("in"));
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("in");
      observer.unobserve(entry.target);
    });
  }, { threshold: .1, rootMargin: "0px 0px -7% 0px" });

  elements.forEach((element) => observer.observe(element));
}

function initNavState() {
  const links = [...document.querySelectorAll(".nav-links a")];
  const targets = links
    .map((link) => ({ link, target: document.querySelector(link.getAttribute("href")) }))
    .filter((item) => item.target);

  const observer = new IntersectionObserver((entries) => {
    const visible = entries
      .filter((entry) => entry.isIntersecting)
      .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
    if (!visible) return;
    links.forEach((link) => {
      const active = link.getAttribute("href") === `#${visible.target.id}`;
      link.classList.toggle("active", active);
      if (active) link.setAttribute("aria-current", "location");
      else link.removeAttribute("aria-current");
    });
  }, { threshold: [.2, .45], rootMargin: "-20% 0px -55% 0px" });

  targets.forEach(({ target }) => observer.observe(target));
}

function scoreMotors() {
  const weights = {};
  document.querySelectorAll("[data-weight]").forEach((input) => {
    weights[input.dataset.weight] = Number(input.value);
  });
  const totalWeight = Object.values(weights).reduce((sum, value) => sum + value, 0);

  return DECISION_MOTORS.map((motor) => {
    const weighted = Object.entries(weights).reduce((sum, [key, weight]) => {
      return sum + motor.scores[key] * weight;
    }, 0) / totalWeight;
    return {
      ...motor,
      total: Math.min(10, weighted * motor.fit[currentApplication])
    };
  }).sort((a, b) => b.total - a.total);
}

function renderRanking() {
  const list = document.getElementById("rankingList");
  const ranking = scoreMotors();
  list.innerHTML = ranking.map((motor, index) => `
    <li class="ranking-item" data-motor="${motor.id}">
      <span class="rank">${String(index + 1).padStart(2, "0")}</span>
      <span class="rank-name">${motor.name}</span>
      <span class="rank-bar" aria-hidden="true"><i style="width:${motor.total * 10}%"></i></span>
      <span class="rank-score">${motor.total.toFixed(1)}</span>
    </li>
  `).join("");

  const preset = APPLICATION_PRESETS[currentApplication];
  const leader = ranking[0];
  const runnerUp = ranking[1];
  const article = /^[aeiou]/i.test(preset.label) ? "an" : "a";
  document.getElementById("choiceReading").innerHTML = `<b>For ${article} ${preset.label},</b> ${preset.reading} With these weights, ${leader.name} leads ${runnerUp.name} by ${(leader.total - runnerUp.total).toFixed(1)} points.`;
}

function applyPreset(application) {
  currentApplication = application;
  const preset = APPLICATION_PRESETS[application];
  document.querySelectorAll("#applicationChoices button").forEach((button) => {
    button.classList.toggle("active", button.dataset.application === application);
  });
  Object.entries(preset.weights).forEach(([key, value]) => {
    const input = document.querySelector(`[data-weight="${key}"]`);
    input.value = value;
    document.getElementById(`weight${key[0].toUpperCase()}${key.slice(1)}Out`).value = value;
  });
  renderRanking();
}

function initDecisionTool() {
  document.getElementById("applicationChoices").addEventListener("click", (event) => {
    const button = event.target.closest("[data-application]");
    if (!button) return;
    applyPreset(button.dataset.application);
  });

  document.querySelectorAll("[data-weight]").forEach((input) => {
    input.addEventListener("input", () => {
      const key = input.dataset.weight;
      document.getElementById(`weight${key[0].toUpperCase()}${key.slice(1)}Out`).value = input.value;
      renderRanking();
    });
  });

  document.getElementById("resetChoices").addEventListener("click", () => {
    applyPreset(currentApplication);
  });

  applyPreset("city");
}

function initPipelineReveal() {
  const pipeline = document.querySelector(".supply-pipeline");
  const bars = [...pipeline.querySelectorAll(".pipeline-track i")];
  bars.forEach((bar) => {
    bar.style.transform = "scaleX(0)";
    bar.style.transition = "transform 1s cubic-bezier(.2,.8,.2,1)";
  });

  const observer = new IntersectionObserver((entries) => {
    if (!entries.some((entry) => entry.isIntersecting)) return;
    bars.forEach((bar, index) => {
      bar.style.transitionDelay = `${index * 140}ms`;
      bar.style.transform = "scaleX(1)";
    });
    observer.disconnect();
  }, { threshold: .35 });
  observer.observe(pipeline);
}

function init() {
  initTheme();
  initReveals();
  initNavState();
  initDecisionTool();
  initPipelineReveal();

  const motorLab = new MotorLab(document.getElementById("motorCanvas"));
  const driveLab = new DriveLab(document.getElementById("driveCanvas"));
  const fieldMap = new FieldMap(document.getElementById("fieldCanvas"));
  const materialsFlow = new MaterialsFlow(document.getElementById("materialsCanvas"));

  window.addEventListener("themechange", () => {
    fieldMap.draw();
    driveLab.draw();
    materialsFlow.draw();
    motorLab.draw(0);
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init, { once: true });
} else {
  init();
}
