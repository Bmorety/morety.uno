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
    ["WHAT IS", `Today’s committed volume covers about ${currentCoverage} of the factory cost.`, "We are producing. But the factory is not paying for itself yet."],
    ["WHAT COULD BE", `At ${parts(m.targetVolume)} contracted parts, coverage rises to ${targetCoverage}.`, "Imagine every additional serial program adding profit, not just activity."],
    ["THE GAP", `We still need enough profitable serial volume to move from ${currentCoverage} to ${targetCoverage}.`, "This is the distance we have to close together."],
    ["WHAT IS", "Some programs use scarce engineering and production time without closing that gap fast enough.", "Being busy can hide the work that really matters."],
    ["WHAT COULD BE", "Commercial and production focus on the programs with the strongest contribution and clearest path to volume.", "If we choose together, the same effort moves the business further."],
    ["DECISION REQUIRED", "Prioritize the programs that close the gap, give each one an owner and remove its next constraint.", "This only happens if you make the priorities real."],
    ["BUSINESS OUTCOME", `The factory reaches ${targetCoverage} coverage and leaves ${money(m.targetProfit)} after annual factory cost.`, "You turn a promising factory into a repeatable, profitable operation."]
  ];
  return [
    ["WHAT IS", `Today’s committed volume covers about ${currentCoverage} of the factory cost.`, "We have built the capacity. The revenue still needs to catch up."],
    ["WHAT COULD BE", `At ${parts(m.targetVolume)} contracted parts, coverage rises to ${targetCoverage}.`, "Imagine the factory beyond break-even, with every new program widening profit."],
    ["THE GAP", `We still need enough profitable serial volume to move from ${currentCoverage} to ${targetCoverage}.`, "This is the value still waiting to be unlocked."],
    ["WHAT IS", "Without focus, new capacity and complex programs can add cost faster than contribution.", "Growth alone will not save the economics."],
    ["WHAT COULD BE", "A focused conversion plan secures anchor programs before the next layer of capacity is added.", "We can make scale fund the next step."],
    ["DECISION REQUIRED", "Back the conversion plan, tie new investment to coverage milestones and help open the right customer and financing doors.", "This is where we need you."],
    ["BUSINESS OUTCOME", `The factory reaches ${targetCoverage} coverage and leaves ${money(m.targetProfit)} after annual factory cost.`, "Your support turns proven technology into profitable scale."]
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
