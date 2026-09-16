const sceneNames = ["The premise", "The KPI", "Conversion economics", "The audience", "The narrative", "Two rooms", "The method"];
const sceneTrack = document.getElementById("sceneTrack");
const experienceEl = document.getElementById("experience");
const scenes = [...document.querySelectorAll(".scene")];
let sceneIndex = 0;
let selectedAudience = "capital";
let selectedScenario = "current";
let beatIndex = 0;

const els = {
  progressFill: document.getElementById("progressFill"), progressCurrent: document.getElementById("progressCurrent"), progressLabel: document.getElementById("progressLabel"), sceneBack: document.getElementById("sceneBack"),
  teamVolume: document.getElementById("teamVolume"), averageAcv: document.getElementById("averageAcv"), currentConversion: document.getElementById("currentConversion"), targetConversion: document.getElementById("targetConversion")
};

experienceEl.addEventListener("scroll", () => { if (experienceEl.scrollLeft !== 0) experienceEl.scrollLeft = 0; }, { passive: true });
function clamp(value, min, max) { return Math.min(max, Math.max(min, value)); }
function money(value) {
  const abs = Math.abs(value), sign = value < 0 ? "−" : "";
  if (abs >= 1000000) return `${sign}€${(abs / 1000000).toFixed(abs % 1000000 ? 1 : 0)}m`;
  if (abs >= 1000) return `${sign}€${Math.round(abs / 1000)}k`;
  return `${sign}€${Math.round(abs)}`;
}

function model() {
  const teams = clamp(Number(els.teamVolume.value) || 1, 1, 100000);
  const acv = clamp(Number(els.averageAcv.value) || 1000, 1000, 1000000);
  const currentRate = clamp(Number(els.currentConversion.value) || 0, 0, 100) / 100;
  const targetRate = clamp(Number(els.targetConversion.value) || 0, 0, 100) / 100;
  return {
    teams, acv, currentRate, targetRate,
    currentPaid: teams * currentRate, targetPaid: teams * targetRate,
    currentArr: teams * currentRate * acv, targetArr: teams * targetRate * acv,
    arrGap: teams * (targetRate - currentRate) * acv
  };
}

function linePath(points) { return points.map((point, index) => `${index ? "L" : "M"}${point[0].toFixed(1)} ${point[1].toFixed(1)}`).join(" "); }

function renderChart(m) {
  const left = 58, right = 742, top = 24, bottom = 242;
  const maxTeams = Math.max(10, Math.ceil(m.teams * 1.15 / 20) * 20);
  const maxValue = Math.max(1, maxTeams * Math.max(m.currentRate, m.targetRate) * m.acv * 1.08);
  const x = teams => left + (teams / maxTeams) * (right - left);
  const y = value => bottom - (value / maxValue) * (bottom - top);
  const currentValue = teams => teams * m.currentRate * m.acv;
  const targetValue = teams => teams * m.targetRate * m.acv;

  document.getElementById("currentLine").setAttribute("d", linePath([[x(0), y(0)], [x(maxTeams), y(currentValue(maxTeams))]]));
  document.getElementById("targetLine").setAttribute("d", linePath([[x(0), y(0)], [x(maxTeams), y(targetValue(maxTeams))]]));
  document.getElementById("profitArea").setAttribute("d", `M${x(0)} ${y(0)} L${x(maxTeams)} ${y(targetValue(maxTeams))} L${x(maxTeams)} ${y(currentValue(maxTeams))} Z`);

  const activeRate = selectedScenario === "current" ? m.currentRate : m.targetRate;
  const dot = document.getElementById("scenarioDot");
  dot.setAttribute("cx", x(m.teams)); dot.setAttribute("cy", y(m.teams * activeRate * m.acv));
  const label = document.getElementById("profitLabel");
  label.setAttribute("x", x(maxTeams * .61)); label.setAttribute("y", y(targetValue(maxTeams * .61)) + 23); label.textContent = "ARR OPPORTUNITY GAP";

  const grid = document.getElementById("chartGrid"); grid.innerHTML = "";
  [0, .25, .5, .75, 1].forEach(ratio => {
    const amount = maxTeams * ratio;
    const line = document.createElementNS("http://www.w3.org/2000/svg", "line"); line.setAttribute("x1", x(amount)); line.setAttribute("x2", x(amount)); line.setAttribute("y1", top); line.setAttribute("y2", bottom); grid.appendChild(line);
    const text = document.createElementNS("http://www.w3.org/2000/svg", "text"); text.setAttribute("x", x(amount)); text.setAttribute("y", 263); text.setAttribute("text-anchor", ratio === 0 ? "start" : ratio === 1 ? "end" : "middle"); text.textContent = ratio === 0 ? "0 TEAMS" : `${Math.round(amount)} TEAMS`; grid.appendChild(text);
  });
  [0, .5, 1].forEach(ratio => {
    const value = maxValue * ratio;
    const line = document.createElementNS("http://www.w3.org/2000/svg", "line"); line.setAttribute("x1", left); line.setAttribute("x2", right); line.setAttribute("y1", y(value)); line.setAttribute("y2", y(value)); grid.appendChild(line);
    if (ratio > 0) { const text = document.createElementNS("http://www.w3.org/2000/svg", "text"); text.setAttribute("x", left - 7); text.setAttribute("y", y(value) + 3); text.setAttribute("text-anchor", "end"); text.textContent = money(value); grid.appendChild(text); }
  });
}

function updateModel() {
  const m = model();
  const target = selectedScenario === "target";
  const rate = target ? m.targetRate : m.currentRate;
  const paid = target ? m.targetPaid : m.currentPaid;
  const arr = target ? m.targetArr : m.currentArr;
  document.getElementById("chartScenario").textContent = target ? "Shared control plane path" : "Current conversion path";
  document.getElementById("conversionResult").textContent = `${Math.round(rate * 100)}%`;
  document.getElementById("paidTeamsResult").textContent = String(Math.round(paid));
  document.getElementById("arrResult").textContent = money(arr);
  document.getElementById("compareConversion").textContent = `${Math.round(m.targetRate * 100)}%`;
  document.getElementById("capitalImpact").textContent = `The target production cohort creates ${money(m.targetArr)} in new ARR, ${money(m.arrGap)} above the current path.`;
  renderChart(m);
}

[els.teamVolume, els.averageAcv, els.currentConversion, els.targetConversion].forEach(input => input.addEventListener("input", updateModel));
document.querySelectorAll("[data-scenario]").forEach(button => button.addEventListener("click", () => {
  selectedScenario = button.dataset.scenario;
  document.querySelectorAll("[data-scenario]").forEach(item => item.classList.toggle("is-active", item === button));
  updateModel();
}));

function goToScene(nextIndex) {
  const bounded = clamp(nextIndex, 0, scenes.length - 1); if (bounded === sceneIndex && bounded !== 0) return;
  const previous = sceneIndex; sceneIndex = bounded; sceneTrack.style.transform = `translate3d(-${sceneIndex * 100}vw, 0, 0)`;
  scenes.forEach((scene, index) => { const active = index === sceneIndex; scene.classList.toggle("is-active", active); scene.inert = !active; scene.setAttribute("aria-hidden", String(!active)); if (active) scene.scrollTop = 0; });
  els.progressFill.style.width = `${((sceneIndex + 1) / scenes.length) * 100}%`; els.progressCurrent.textContent = String(sceneIndex + 1).padStart(2, "0"); els.progressLabel.textContent = sceneNames[sceneIndex]; els.sceneBack.classList.toggle("is-visible", sceneIndex > 0);
  if (sceneIndex === 2) updateModel(); if (sceneIndex === 4 && previous !== 4) startStory();
}
document.querySelectorAll("[data-next]").forEach(button => button.addEventListener("click", () => goToScene(sceneIndex + 1)));
els.sceneBack.addEventListener("click", () => goToScene(sceneIndex - 1));
document.getElementById("resetExperience").addEventListener("click", () => {
  els.teamVolume.value = 120; els.averageAcv.value = 18000; els.currentConversion.value = 10; els.targetConversion.value = 20;
  selectedAudience = "capital"; selectedScenario = "current"; document.querySelector('input[value="capital"]').checked = true;
  document.querySelectorAll("[data-scenario]").forEach(item => item.classList.toggle("is-active", item.dataset.scenario === "current")); syncAudienceCards(); updateModel(); goToScene(0);
});

function syncAudienceCards() { document.querySelectorAll(".audience-card").forEach(card => card.classList.toggle("is-selected", card.querySelector("input").checked)); }
document.querySelectorAll('input[name="audience"]').forEach(input => input.addEventListener("change", () => { selectedAudience = input.value; syncAudienceCards(); }));
document.getElementById("audienceForm").addEventListener("submit", event => { event.preventDefault(); selectedAudience = new FormData(event.currentTarget).get("audience") || "capital"; goToScene(4); });
document.querySelectorAll("[data-replay-room]").forEach(panel => panel.addEventListener("click", event => { event.preventDefault(); selectedAudience = panel.dataset.replayRoom; document.querySelector(`input[value="${selectedAudience}"]`).checked = true; syncAudienceCards(); goToScene(4); }));

function storyBeats() {
  const m = model();
  const currentRate = `${Math.round(m.currentRate * 100)}%`, targetRate = `${Math.round(m.targetRate * 100)}%`;
  if (selectedAudience === "team") return [
    ["WHAT IS", "Teams already evaluate agents, but many still rely on spreadsheets, Slack channels and manual replay.", "The problem is real. The workflow is still improvised."],
    ["OPERATING OPPORTUNITY", `Imagine moving Production-to-Pro conversion from ${currentRate} to ${targetRate}. The same production cohort could create ${money(m.targetArr)} in new ARR.`, "Every successful replay can open a clear next step."],
    ["THE GAP", "That move is hard. A team can get value from its first replay without being ready to buy Pro.", "Technical success still needs a commercial moment."],
    ["WHAT IS", "A successful first replay does not automatically create a repeatable workflow or a Pro buying moment.", "Product value can appear before commercial intent is visible."],
    ["WHAT COULD BE", "One activation event tells Product and GTM when a production team is ready for Pro.", "We can make the buying moment visible and repeatable."],
    ["TEAM ACTION", "I need us to define the activation event, connect it to a Pro buying moment, give every qualified cohort an owner and track conversion each month.", "We are the team that can connect adoption to revenue."],
    ["BUSINESS OUTCOME", `At ${targetRate} conversion, the cohort creates ${money(m.targetArr)} in new ARR, ${money(m.arrGap)} above the ${currentRate} path. Let us agree the activation test today.`, "Two products can become one growth engine."]
  ];
  return [
    ["WHAT IS", "Hundreds of customer calls show the same pain: agent evaluation exists, but it is fragmented and manual.", "Adam has already found the problem. Now the business must capture it."],
    ["FINANCIAL OPPORTUNITY", `Imagine moving Production-to-Pro conversion from ${currentRate} to ${targetRate}. The same cohort could create ${money(m.targetArr)} in new ARR, without a second commercial engine.`, "Every production success can strengthen the paid platform."],
    ["THE GAP", "That is not automatic. Product value can appear long before the customer is ready to buy Pro.", "Kitaru still has to prove it can open the paid path."],
    ["WHAT IS", "Kitaru is early: the SDK is functional, while integrations and product primitives are still taking shape.", "A second product can expand the market or divide the focus."],
    ["WHAT COULD BE", "A shared control plane lets ZenML and Kitaru create two routes into one commercial relationship.", "Kitaru becomes expansion, not distraction."],
    ["BOARD DECISION", "I am asking you to back a two-quarter conversion test, give the team the resources to prove it and require one clear Production-to-Pro milestone before we scale further.", "Your focus can keep the second product on a path to revenue."],
    ["BUSINESS OUTCOME", `At ${targetRate} conversion, this cohort creates ${money(m.targetArr)} in new ARR, ${money(m.arrGap)} above the ${currentRate} path. Please back the test that can prove it.`, "The second product can compound the first."]
  ];
}

const pathProgress = [.101, .19, .29, .46, .64, .765, 1];
const contourPath = document.getElementById("contourLive"), contourLength = contourPath.getTotalLength();
contourPath.style.strokeDasharray = String(contourLength); contourPath.style.strokeDashoffset = String(contourLength);
function renderBeat() {
  const beat = storyBeats()[beatIndex]; document.getElementById("beatNumber").textContent = `${String(beatIndex + 1).padStart(2, "0")} / 07`; document.getElementById("beatFramework").textContent = beat[0]; document.getElementById("beatText").textContent = beat[1]; document.getElementById("beatThought").textContent = beat[2]; contourPath.style.strokeDashoffset = String(contourLength * (1 - pathProgress[beatIndex])); document.querySelector(".outcome-dot").style.opacity = beatIndex === 6 ? "1" : "0"; document.getElementById("beatBack").disabled = beatIndex === 0; document.getElementById("beatNext").innerHTML = beatIndex === 6 ? 'Compare the rooms <span>→</span>' : 'Next contrast <span>→</span>'; [...document.getElementById("beatDots").children].forEach((dot, index) => dot.classList.toggle("is-active", index === beatIndex));
}
function startStory() {
  beatIndex = 0; const isBoard = selectedAudience === "capital"; document.getElementById("roomBadge").dataset.audience = selectedAudience; document.getElementById("roomName").textContent = isBoard ? "Board update" : "Product & GTM planning"; document.getElementById("roomFocus").textContent = isBoard ? "Focus · investment · proof" : "Activation · ownership · conversion"; document.getElementById("beatAudience").textContent = isBoard ? "BOARD UPDATE" : "PRODUCT & GTM PLANNING"; document.querySelectorAll("[data-room-panel]").forEach(panel => panel.classList.toggle("chosen-first", panel.dataset.roomPanel === selectedAudience));
  const dots = document.getElementById("beatDots"); dots.innerHTML = ""; storyBeats().forEach((_, index) => { const dot = document.createElement("button"); dot.type = "button"; dot.className = "beat-dot"; dot.setAttribute("aria-label", `Show narrative step ${index + 1}`); dot.addEventListener("click", () => { beatIndex = index; renderBeat(); }); dots.appendChild(dot); }); contourPath.style.strokeDashoffset = String(contourLength); requestAnimationFrame(() => requestAnimationFrame(renderBeat));
}
document.getElementById("beatBack").addEventListener("click", () => { beatIndex = Math.max(0, beatIndex - 1); renderBeat(); });
document.getElementById("beatNext").addEventListener("click", () => { if (beatIndex < 6) { beatIndex++; renderBeat(); } else goToScene(5); });
document.addEventListener("keydown", event => { if (event.key === "ArrowLeft" && sceneIndex !== 4) goToScene(sceneIndex - 1); if (event.key === "ArrowRight" && ![2,3,4].includes(sceneIndex)) goToScene(sceneIndex + 1); });
let touchStartX = null; document.addEventListener("touchstart", event => { touchStartX = event.touches[0].clientX; }, { passive: true }); document.addEventListener("touchend", event => { if (touchStartX === null || [2,3,4].includes(sceneIndex)) return; const delta = event.changedTouches[0].clientX - touchStartX; if (Math.abs(delta) > 70) goToScene(sceneIndex + (delta < 0 ? 1 : -1)); touchStartX = null; }, { passive: true });

updateModel(); syncAudienceCards(); goToScene(0);
