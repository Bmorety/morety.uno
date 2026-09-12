const sceneNames = ["The premise", "The KPI", "Factory economics", "The audience", "The narrative", "Two rooms", "The method"];
const sceneTrack = document.getElementById("sceneTrack");
const experienceEl = document.getElementById("experience");
const scenes = [...document.querySelectorAll(".scene")];
let sceneIndex = 0;
let selectedAudience = "capital";
let selectedScenario = "current";
let beatIndex = 0;

const els = {
  progressFill: document.getElementById("progressFill"), progressCurrent: document.getElementById("progressCurrent"), progressLabel: document.getElementById("progressLabel"), sceneBack: document.getElementById("sceneBack"),
  currentVolume: document.getElementById("currentVolume"), targetVolume: document.getElementById("targetVolume"), unitContribution: document.getElementById("unitContribution"), factoryCost: document.getElementById("factoryCost")
};

experienceEl.addEventListener("scroll", () => { if (experienceEl.scrollLeft !== 0) experienceEl.scrollLeft = 0; }, { passive: true });
function clamp(value, min, max) { return Math.min(max, Math.max(min, value)); }
function money(value) {
  const abs = Math.abs(value), sign = value < 0 ? "−" : "";
  if (abs >= 1000000) return `${sign}€${(abs / 1000000).toFixed(abs % 1000000 ? 1 : 0)}m`;
  if (abs >= 1000) return `${sign}€${Math.round(abs / 1000)}k`;
  return `${sign}€${Math.round(abs)}`;
}
function parts(value) {
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}m`;
  if (value >= 1000) return `${(value / 1000).toFixed(value % 1000 ? 1 : 0)}k`;
  return String(Math.round(value));
}

function model() {
  const currentVolume = clamp(Number(els.currentVolume.value) || 0, 0, 1000000);
  const targetVolume = clamp(Number(els.targetVolume.value) || 0, 0, 1000000);
  const unitContribution = clamp(Number(els.unitContribution.value) || 1, 1, 100000);
  const factoryCost = clamp(Number(els.factoryCost.value) || 10000, 10000, 100000000);
  const contribution = volume => volume * unitContribution;
  const coverage = volume => contribution(volume) / factoryCost * 100;
  const profit = volume => contribution(volume) - factoryCost;
  return { currentVolume, targetVolume, unitContribution, factoryCost, breakEven: factoryCost / unitContribution, currentCoverage: coverage(currentVolume), targetCoverage: coverage(targetVolume), currentProfit: profit(currentVolume), targetProfit: profit(targetVolume) };
}

function linePath(points) { return points.map((point, index) => `${index ? "L" : "M"}${point[0].toFixed(1)} ${point[1].toFixed(1)}`).join(" "); }

function renderChart(m) {
  const activeVolume = selectedScenario === "current" ? m.currentVolume : m.targetVolume;
  const left = 58, right = 742, top = 24, bottom = 242;
  const rawMax = Math.max(m.currentVolume, m.targetVolume, m.breakEven, 10000) * 1.2;
  const increment = rawMax > 200000 ? 50000 : rawMax > 80000 ? 20000 : 10000;
  const maxVolume = Math.ceil(rawMax / increment) * increment;
  const maxValue = Math.max(maxVolume * m.unitContribution, m.factoryCost) * 1.08;
  const x = volume => left + (volume / maxVolume) * (right - left);
  const y = value => bottom - (value / maxValue) * (bottom - top);

  document.getElementById("contributionLine").setAttribute("d", linePath([[x(0), y(0)], [x(maxVolume), y(maxVolume * m.unitContribution)]]));
  document.getElementById("factoryLine").setAttribute("d", linePath([[x(0), y(m.factoryCost)], [x(maxVolume), y(m.factoryCost)]]));

  const area = document.getElementById("profitArea");
  if (m.breakEven < maxVolume) area.setAttribute("d", `M${x(m.breakEven)} ${y(m.factoryCost)} L${x(maxVolume)} ${y(maxVolume * m.unitContribution)} L${x(maxVolume)} ${y(m.factoryCost)} Z`);
  else area.setAttribute("d", "");

  const breakEvenX = x(clamp(m.breakEven, 0, maxVolume));
  const breakEvenLine = document.getElementById("breakEvenLine");
  breakEvenLine.setAttribute("x1", breakEvenX); breakEvenLine.setAttribute("x2", breakEvenX);
  const label = document.getElementById("breakEvenLabel");
  label.setAttribute("x", breakEvenX); label.setAttribute("y", 15); label.textContent = `BREAK-EVEN · ${parts(m.breakEven)} PARTS`;
  const dot = document.getElementById("scenarioDot");
  dot.setAttribute("cx", x(clamp(activeVolume, 0, maxVolume))); dot.setAttribute("cy", y(activeVolume * m.unitContribution));
  const profitLabel = document.getElementById("profitLabel");
  profitLabel.setAttribute("x", x(m.breakEven + (maxVolume - m.breakEven) * .48)); profitLabel.setAttribute("y", y(m.factoryCost) - 18); profitLabel.textContent = m.breakEven < maxVolume ? "PROFITABLE SCALE" : "";

  const grid = document.getElementById("chartGrid"); grid.innerHTML = "";
  [0, .25, .5, .75, 1].forEach(ratio => {
    const volume = maxVolume * ratio;
    const line = document.createElementNS("http://www.w3.org/2000/svg", "line"); line.setAttribute("x1", x(volume)); line.setAttribute("x2", x(volume)); line.setAttribute("y1", top); line.setAttribute("y2", bottom); grid.appendChild(line);
    const text = document.createElementNS("http://www.w3.org/2000/svg", "text"); text.setAttribute("x", x(volume)); text.setAttribute("y", 263); text.setAttribute("text-anchor", ratio === 0 ? "start" : ratio === 1 ? "end" : "middle"); text.textContent = ratio === 0 ? "0 PARTS" : `${parts(volume)} PARTS`; grid.appendChild(text);
  });
  [0, .5, 1].forEach(ratio => {
    const value = maxValue * ratio;
    const line = document.createElementNS("http://www.w3.org/2000/svg", "line"); line.setAttribute("x1", left); line.setAttribute("x2", right); line.setAttribute("y1", y(value)); line.setAttribute("y2", y(value)); grid.appendChild(line);
    if (ratio > 0) { const text = document.createElementNS("http://www.w3.org/2000/svg", "text"); text.setAttribute("x", left - 7); text.setAttribute("y", y(value) + 3); text.setAttribute("text-anchor", "end"); text.textContent = money(value); grid.appendChild(text); }
  });
}

function updateModel() {
  const m = model();
  const current = selectedScenario === "current";
  const coverage = current ? m.currentCoverage : m.targetCoverage;
  const profit = current ? m.currentProfit : m.targetProfit;
  document.getElementById("chartScenario").textContent = current ? "Current committed volume" : "Target committed volume";
  document.getElementById("coverageResult").textContent = `${Math.round(coverage)}%`;
  document.getElementById("profitResult").textContent = money(profit);
  document.getElementById("breakEvenResult").textContent = `${parts(m.breakEven)} parts`;
  document.getElementById("compareCoverage").textContent = `${Math.round(m.targetCoverage)}%`;
  document.getElementById("capitalImpact").textContent = `Target volume covers ${Math.round(m.targetCoverage)}% of annual factory cost and leaves ${money(m.targetProfit)} after it.`;
  renderChart(m);
}

[els.currentVolume, els.targetVolume, els.unitContribution, els.factoryCost].forEach(input => input.addEventListener("input", updateModel));
document.querySelectorAll("[data-scenario]").forEach(button => button.addEventListener("click", () => { selectedScenario = button.dataset.scenario; document.querySelectorAll("[data-scenario]").forEach(item => item.classList.toggle("is-active", item === button)); updateModel(); }));

function goToScene(nextIndex) {
  const bounded = clamp(nextIndex, 0, scenes.length - 1); if (bounded === sceneIndex && bounded !== 0) return;
  const previous = sceneIndex; sceneIndex = bounded; sceneTrack.style.transform = `translate3d(-${sceneIndex * 100}vw, 0, 0)`;
  scenes.forEach((scene, index) => { const active = index === sceneIndex; scene.classList.toggle("is-active", active); scene.inert = !active; scene.setAttribute("aria-hidden", String(!active)); if (active) scene.scrollTop = 0; });
  els.progressFill.style.width = `${((sceneIndex + 1) / scenes.length) * 100}%`; els.progressCurrent.textContent = String(sceneIndex + 1).padStart(2, "0"); els.progressLabel.textContent = sceneNames[sceneIndex]; els.sceneBack.classList.toggle("is-visible", sceneIndex > 0);
  if (sceneIndex === 2) updateModel(); if (sceneIndex === 4 && previous !== 4) startStory();
}
document.querySelectorAll("[data-next]").forEach(button => button.addEventListener("click", () => goToScene(sceneIndex + 1)));
els.sceneBack.addEventListener("click", () => goToScene(sceneIndex - 1));
document.getElementById("resetExperience").addEventListener("click", () => { els.currentVolume.value = 20000; els.targetVolume.value = 50000; els.unitContribution.value = 35; els.factoryCost.value = 1200000; selectedAudience = "capital"; selectedScenario = "current"; document.querySelector('input[value="capital"]').checked = true; document.querySelectorAll("[data-scenario]").forEach(item => item.classList.toggle("is-active", item.dataset.scenario === "current")); syncAudienceCards(); updateModel(); goToScene(0); });

function syncAudienceCards() { document.querySelectorAll(".audience-card").forEach(card => card.classList.toggle("is-selected", card.querySelector("input").checked)); }
document.querySelectorAll('input[name="audience"]').forEach(input => input.addEventListener("change", () => { selectedAudience = input.value; syncAudienceCards(); }));
document.getElementById("audienceForm").addEventListener("submit", event => { event.preventDefault(); selectedAudience = new FormData(event.currentTarget).get("audience") || "capital"; goToScene(4); });
document.querySelectorAll("[data-replay-room]").forEach(panel => panel.addEventListener("click", event => { event.preventDefault(); selectedAudience = panel.dataset.replayRoom; document.querySelector(`input[value="${selectedAudience}"]`).checked = true; syncAudienceCards(); goToScene(4); }));

function storyBeats() {
  const m = model();
  const currentCoverage = `${Math.round(m.currentCoverage)}%`, targetCoverage = `${Math.round(m.targetCoverage)}%`;
  if (selectedAudience === "team") return [
    ["CURRENT ECONOMICS", "Holy has moved twelve customer components into serial production, but programs differ in volume, contribution and production readiness.", "A full pipeline is not the same as a covered factory."],
    ["FINANCIAL OPPORTUNITY", `Move serial production coverage from ${currentCoverage} to ${targetCoverage} by converting the right programs into contracted volume.`, "Focus on the volume that actually closes the gap."],
    ["TARGET ECONOMICS", `At ${parts(m.targetVolume)} contracted parts and ${money(m.unitContribution)} contribution per part, serial programs generate ${money(m.targetVolume * m.unitContribution)} before factory cost.`, "Now every program has a visible job in the model."],
    ["CURRENT CONSTRAINT", "Low-volume complexity can consume engineering and production capacity without moving the factory materially toward break-even.", "Busy is not the same as profitable."],
    ["TARGET ECONOMICS", "One coverage model connects quotations, production planning and delivery priorities to the same financial outcome.", "Commercial and production can finally pull in the same direction."],
    ["DECISION REQUIRED", "Rank every program by annual contribution, readiness and conversion probability. Assign one owner and next milestone to each priority program.", "Move the programs that close the gap fastest."],
    ["EXPECTED BUSINESS IMPACT", `At target volume, the factory reaches ${targetCoverage} coverage and leaves ${money(m.targetProfit)} after annual factory cost.`, "The team knows which work creates profitable scale."]
  ];
  return [
    ["CURRENT ECONOMICS", "Holy has proven IFP in serial production. The new factory creates an operating cost base before contracted volume fully absorbs it.", "The technology risk is falling. The scale economics still need to be demonstrated."],
    ["FINANCIAL OPPORTUNITY", `Move contracted serial contribution from ${currentCoverage} to ${targetCoverage} of annual factory cost.`, "Turn capacity into visible financial leverage."],
    ["TARGET ECONOMICS", `At ${parts(m.targetVolume)} contracted parts, the example produces ${money(m.targetVolume * m.unitContribution)} of annual serial contribution.`, "The factory crosses break-even before another layer of capacity is added."],
    ["CURRENT CONSTRAINT", "More volume can still destroy value when pricing, complexity or customer-specific work consumes too much contribution.", "A busy factory can still be a bad business."],
    ["TARGET ECONOMICS", "Contracted contribution coverage creates a shared guardrail for customer selection, capacity investment and the timing of the next raise.", "Capital follows evidence, not activity."],
    ["DECISION REQUIRED", "Back a two-quarter serial-conversion plan. Release future capacity investment against coverage milestones and help secure anchor customers or financing partners.", "Give the team focus, guardrails and access to the right rooms."],
    ["EXPECTED BUSINESS IMPACT", `At target volume, serial production covers ${targetCoverage} of factory cost and leaves ${money(m.targetProfit)} after it.`, "The next unit of volume widens the profit gap instead of only filling capacity."]
  ];
}

const pathProgress = [.101, .19, .29, .46, .64, .765, 1];
const contourPath = document.getElementById("contourLive"), contourLength = contourPath.getTotalLength();
contourPath.style.strokeDasharray = String(contourLength); contourPath.style.strokeDashoffset = String(contourLength);
function renderBeat() {
  const beat = storyBeats()[beatIndex]; document.getElementById("beatNumber").textContent = `${String(beatIndex + 1).padStart(2, "0")} / 07`; document.getElementById("beatFramework").textContent = beat[0]; document.getElementById("beatText").textContent = beat[1]; document.getElementById("beatThought").textContent = beat[2]; contourPath.style.strokeDashoffset = String(contourLength * (1 - pathProgress[beatIndex])); document.querySelector(".outcome-dot").style.opacity = beatIndex === 6 ? "1" : "0"; document.getElementById("beatBack").disabled = beatIndex === 0; document.getElementById("beatNext").innerHTML = beatIndex === 6 ? 'Compare the rooms <span>→</span>' : 'Next contrast <span>→</span>'; [...document.getElementById("beatDots").children].forEach((dot, index) => dot.classList.toggle("is-active", index === beatIndex));
}
function startStory() {
  beatIndex = 0; const isCapital = selectedAudience === "capital"; document.getElementById("roomBadge").dataset.audience = selectedAudience; document.getElementById("roomName").textContent = isCapital ? "Capital room" : "Commercial & Production"; document.getElementById("roomFocus").textContent = isCapital ? "Investment · risk · direction" : "Pipeline · priority · execution"; document.getElementById("beatAudience").textContent = isCapital ? "CAPITAL ROOM" : "COMMERCIAL & PRODUCTION"; document.querySelectorAll("[data-room-panel]").forEach(panel => panel.classList.toggle("chosen-first", panel.dataset.roomPanel === selectedAudience));
  const dots = document.getElementById("beatDots"); dots.innerHTML = ""; storyBeats().forEach((_, index) => { const dot = document.createElement("button"); dot.type = "button"; dot.className = "beat-dot"; dot.setAttribute("aria-label", `Show narrative step ${index + 1}`); dot.addEventListener("click", () => { beatIndex = index; renderBeat(); }); dots.appendChild(dot); }); contourPath.style.strokeDashoffset = String(contourLength); requestAnimationFrame(() => requestAnimationFrame(renderBeat));
}
document.getElementById("beatBack").addEventListener("click", () => { beatIndex = Math.max(0, beatIndex - 1); renderBeat(); });
document.getElementById("beatNext").addEventListener("click", () => { if (beatIndex < 6) { beatIndex++; renderBeat(); } else goToScene(5); });
document.addEventListener("keydown", event => { if (event.key === "ArrowLeft" && sceneIndex !== 4) goToScene(sceneIndex - 1); if (event.key === "ArrowRight" && ![2,3,4].includes(sceneIndex)) goToScene(sceneIndex + 1); });
let touchStartX = null; document.addEventListener("touchstart", event => { touchStartX = event.touches[0].clientX; }, { passive: true }); document.addEventListener("touchend", event => { if (touchStartX === null || [2,3,4].includes(sceneIndex)) return; const delta = event.changedTouches[0].clientX - touchStartX; if (Math.abs(delta) > 70) goToScene(sceneIndex + (delta < 0 ? 1 : -1)); touchStartX = null; }, { passive: true });

updateModel(); syncAudienceCards(); goToScene(0);
