const sceneNames = ["The premise", "The KPI", "Retail economics", "The audience", "The narrative", "Two rooms", "The method"];
const sceneTrack = document.getElementById("sceneTrack");
const experienceEl = document.getElementById("experience");
const scenes = [...document.querySelectorAll(".scene")];
let sceneIndex = 0;
let selectedAudience = "board";
let selectedScenario = "current";
let beatIndex = 0;

const els = {
  progressFill: document.getElementById("progressFill"),
  progressCurrent: document.getElementById("progressCurrent"),
  progressLabel: document.getElementById("progressLabel"),
  sceneBack: document.getElementById("sceneBack"),
  distributionPoints: document.getElementById("distributionPoints"),
  unitContribution: document.getElementById("unitContribution"),
  currentVelocity: document.getElementById("currentVelocity"),
  targetVelocity: document.getElementById("targetVelocity")
};

experienceEl.addEventListener("scroll", () => {
  if (experienceEl.scrollLeft !== 0) experienceEl.scrollLeft = 0;
}, { passive: true });

function clamp(value, min, max) { return Math.min(max, Math.max(min, value)); }
function compact(value) {
  return new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 }).format(value);
}
function money(value) {
  return `€${new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 }).format(value)}`;
}
function model() {
  const points = clamp(Number(els.distributionPoints.value) || 1, 1, 50000);
  const contribution = clamp(Number(els.unitContribution.value) || 0, 0, 20);
  const currentVelocity = clamp(Number(els.currentVelocity.value) || 0, 0, 200);
  const targetVelocity = clamp(Number(els.targetVelocity.value) || 0, 0, 200);
  const currentUnits = points * currentVelocity * 52;
  const targetUnits = points * targetVelocity * 52;
  return {
    points, contribution, currentVelocity, targetVelocity,
    currentUnits, targetUnits,
    unitGap: targetUnits - currentUnits,
    currentContribution: currentUnits * contribution,
    targetContribution: targetUnits * contribution,
    contributionGap: (targetUnits - currentUnits) * contribution
  };
}

function linePath(points) {
  return points.map((point, index) => `${index ? "L" : "M"}${point[0].toFixed(1)} ${point[1].toFixed(1)}`).join(" ");
}
function renderChart(m) {
  const left = 58, right = 742, top = 24, bottom = 242;
  const maxPoints = Math.max(250, Math.ceil(m.points * 1.15 / 250) * 250);
  const maxUnits = Math.max(1, maxPoints * Math.max(m.currentVelocity, m.targetVelocity) * 52 * 1.08);
  const x = count => left + (count / maxPoints) * (right - left);
  const y = units => bottom - (units / maxUnits) * (bottom - top);
  const current = count => count * m.currentVelocity * 52;
  const target = count => count * m.targetVelocity * 52;
  document.getElementById("currentLine").setAttribute("d", linePath([[x(0), y(0)], [x(maxPoints), y(current(maxPoints))]]));
  document.getElementById("targetLine").setAttribute("d", linePath([[x(0), y(0)], [x(maxPoints), y(target(maxPoints))]]));
  document.getElementById("profitArea").setAttribute("d", `M${x(0)} ${y(0)} L${x(maxPoints)} ${y(target(maxPoints))} L${x(maxPoints)} ${y(current(maxPoints))} Z`);
  const activeVelocity = selectedScenario === "current" ? m.currentVelocity : m.targetVelocity;
  const dot = document.getElementById("scenarioDot");
  dot.setAttribute("cx", x(m.points));
  dot.setAttribute("cy", y(m.points * activeVelocity * 52));
  const label = document.getElementById("profitLabel");
  label.setAttribute("x", x(maxPoints * .55));
  label.setAttribute("y", y(target(maxPoints * .55)) + 23);
  label.textContent = "PRODUCTIVE DISTRIBUTION GAP";
  const grid = document.getElementById("chartGrid");
  grid.innerHTML = "";
  [0, .25, .5, .75, 1].forEach(ratio => {
    const count = maxPoints * ratio;
    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    line.setAttribute("x1", x(count)); line.setAttribute("x2", x(count)); line.setAttribute("y1", top); line.setAttribute("y2", bottom); grid.appendChild(line);
    const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
    text.setAttribute("x", x(count)); text.setAttribute("y", 263); text.setAttribute("text-anchor", ratio === 0 ? "start" : ratio === 1 ? "end" : "middle");
    text.textContent = ratio === 0 ? "0 POINTS" : `${Math.round(count)} POINTS`; grid.appendChild(text);
  });
  [0, .5, 1].forEach(ratio => {
    const units = maxUnits * ratio;
    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    line.setAttribute("x1", left); line.setAttribute("x2", right); line.setAttribute("y1", y(units)); line.setAttribute("y2", y(units)); grid.appendChild(line);
    if (ratio > 0) {
      const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
      text.setAttribute("x", left - 7); text.setAttribute("y", y(units) + 3); text.setAttribute("text-anchor", "end"); text.textContent = compact(units); grid.appendChild(text);
    }
  });
}

function updateModel() {
  const m = model();
  const target = selectedScenario === "target";
  document.getElementById("chartScenario").textContent = target ? "Productive sell-through path" : "Current sell-through path";
  document.getElementById("velocityResult").textContent = `${target ? m.targetVelocity : m.currentVelocity} units`;
  document.getElementById("annualUnits").textContent = compact(target ? m.targetUnits : m.currentUnits);
  document.getElementById("annualContribution").textContent = money(target ? m.targetContribution : m.currentContribution);
  document.getElementById("compareVelocity").textContent = m.targetVelocity;
  document.getElementById("boardImpact").textContent = `The productive path creates ${compact(m.unitGap)} additional annual units and ${money(m.contributionGap)} illustrative contribution.`;
  renderChart(m);
}

[els.distributionPoints, els.unitContribution, els.currentVelocity, els.targetVelocity].forEach(input => input.addEventListener("input", updateModel));
document.querySelectorAll("[data-scenario]").forEach(button => button.addEventListener("click", () => {
  selectedScenario = button.dataset.scenario;
  document.querySelectorAll("[data-scenario]").forEach(item => item.classList.toggle("is-active", item === button));
  updateModel();
}));

function goToScene(nextIndex) {
  const bounded = clamp(nextIndex, 0, scenes.length - 1);
  if (bounded === sceneIndex && bounded !== 0) return;
  const previous = sceneIndex;
  sceneIndex = bounded;
  sceneTrack.style.transform = `translate3d(-${sceneIndex * 100}vw,0,0)`;
  scenes.forEach((scene, index) => {
    const active = index === sceneIndex;
    scene.classList.toggle("is-active", active);
    scene.inert = !active;
    scene.setAttribute("aria-hidden", String(!active));
    if (active) scene.scrollTop = 0;
  });
  els.progressFill.style.width = `${((sceneIndex + 1) / scenes.length) * 100}%`;
  els.progressCurrent.textContent = String(sceneIndex + 1).padStart(2, "0");
  els.progressLabel.textContent = sceneNames[sceneIndex];
  els.sceneBack.classList.toggle("is-visible", sceneIndex > 0);
  if (sceneIndex === 2) updateModel();
  if (sceneIndex === 4 && previous !== 4) startStory();
}

document.querySelectorAll("[data-next]").forEach(button => button.addEventListener("click", () => goToScene(sceneIndex + 1)));
els.sceneBack.addEventListener("click", () => goToScene(sceneIndex - 1));
document.getElementById("resetExperience").addEventListener("click", () => {
  els.distributionPoints.value = 1000; els.unitContribution.value = 1; els.currentVelocity.value = 8; els.targetVelocity.value = 12;
  selectedAudience = "board"; selectedScenario = "current";
  document.querySelector('input[value="board"]').checked = true;
  document.querySelectorAll("[data-scenario]").forEach(item => item.classList.toggle("is-active", item.dataset.scenario === "current"));
  syncAudienceCards(); updateModel(); goToScene(0);
});
function syncAudienceCards() {
  document.querySelectorAll(".audience-card").forEach(card => card.classList.toggle("is-selected", card.querySelector("input").checked));
}
document.querySelectorAll('input[name="audience"]').forEach(input => input.addEventListener("change", () => {
  selectedAudience = input.value; syncAudienceCards();
}));
document.getElementById("audienceForm").addEventListener("submit", event => {
  event.preventDefault(); selectedAudience = new FormData(event.currentTarget).get("audience") || "board"; goToScene(4);
});
document.querySelectorAll("[data-replay-room]").forEach(panel => panel.addEventListener("click", event => {
  event.preventDefault(); selectedAudience = panel.dataset.replayRoom; document.querySelector(`input[value="${selectedAudience}"]`).checked = true; syncAudienceCards(); goToScene(4);
}));

function storyBeats() {
  const m = model();
  const current = `${m.currentVelocity} units`;
  const target = `${m.targetVelocity} units`;
  if (selectedAudience === "buyer") return [
    ["WHAT IS", "Freda earned attention through restaurant-quality frozen food and now reaches more than 1,000 retail points.", "The product has earned a place in the freezer."],
    ["CATEGORY OPPORTUNITY", `What if Freda reaches ${target} per point each week while staying reliably available?`, "Better food can also be productive shelf space."],
    ["THE GAP", `The illustrative sell-through gap is ${current} to ${target} per point per week.`, "The listing is real. The wider rollout still needs proof."],
    ["WHAT IS", "Frozen space is scarce. More SKUs only help when each one turns quickly and arrives consistently.", "A great product still has to earn every facing."],
    ["WHAT COULD BE", "A measured rollout links stores, SKUs, facings and availability to one weekly velocity threshold.", "Make the next decision visible before the test starts."],
    ["BUYER DECISION", "Approve a wider rollout with agreed points, range, facings and review date.", "Give Freda the space and a fair test to prove the category value."],
    ["BUSINESS OUTCOME", `At the target path, the example footprint sells ${compact(m.targetUnits)} units a year while quality and availability remain protected.`, "The quality story becomes productive distribution."]
  ];
  return [
    ["WHAT IS", "Freda has raised €2.319m after proving demand, quality and an initial retail footprint of more than 1,000 points.", "The capital is in. The operating proof comes next."],
    ["FINANCIAL OPPORTUNITY", `What if the current footprint moves from ${current} to ${target} per point per week? The example adds ${compact(m.unitGap)} annual units.`, "Improve the value of the footprint before complexity compounds."],
    ["THE GAP", `The illustrative path creates ${money(m.contributionGap)} more annual contribution, before funding more doors.`, "This is what productive distribution can finance."],
    ["WHAT IS", "Every rollout adds inventory, production load and trade investment. In-house quality makes that pace a deliberate choice.", "Growth can run ahead of the system that protects the product."],
    ["WHAT COULD BE", "One scorecard joins sell-through with on-shelf availability and quality complaints.", "Growth, service and product promise move together."],
    ["BOARD DECISION", "Release capacity, inventory and trade investment against shared quarterly thresholds.", "Fund the expansion when the operating evidence says accelerate."],
    ["BUSINESS OUTCOME", `The target path produces ${compact(m.targetUnits)} annual units and ${money(m.targetContribution)} illustrative contribution without lowering the quality guardrails.`, "Scale the shelf without scaling away what earned it."]
  ];
}

const pathProgress = [.101, .19, .29, .46, .64, .765, 1];
const contourPath = document.getElementById("contourLive");
const contourLength = contourPath.getTotalLength();
contourPath.style.strokeDasharray = String(contourLength);
contourPath.style.strokeDashoffset = String(contourLength);
function renderBeat() {
  const beat = storyBeats()[beatIndex];
  document.getElementById("beatNumber").textContent = `${String(beatIndex + 1).padStart(2, "0")} / 07`;
  document.getElementById("beatFramework").textContent = beat[0];
  document.getElementById("beatText").textContent = beat[1];
  document.getElementById("beatThought").textContent = beat[2];
  contourPath.style.strokeDashoffset = String(contourLength * (1 - pathProgress[beatIndex]));
  document.querySelector(".outcome-dot").style.opacity = beatIndex === 6 ? "1" : "0";
  document.getElementById("beatBack").disabled = beatIndex === 0;
  document.getElementById("beatNext").innerHTML = beatIndex === 6 ? 'Compare the rooms <span>→</span>' : 'Next contrast <span>→</span>';
  [...document.getElementById("beatDots").children].forEach((dot, index) => dot.classList.toggle("is-active", index === beatIndex));
}
function startStory() {
  beatIndex = 0;
  const isBoard = selectedAudience === "board";
  document.getElementById("roomBadge").dataset.audience = selectedAudience;
  document.getElementById("roomName").textContent = isBoard ? "Board review" : "National retail buyer";
  document.getElementById("roomFocus").textContent = isBoard ? "Capital · capacity · milestones" : "Category value · rollout · shelf space";
  document.getElementById("beatAudience").textContent = isBoard ? "BOARD REVIEW" : "NATIONAL RETAIL BUYER";
  document.querySelectorAll("[data-room-panel]").forEach(panel => panel.classList.toggle("chosen-first", panel.dataset.roomPanel === selectedAudience));
  const dots = document.getElementById("beatDots"); dots.innerHTML = "";
  storyBeats().forEach((_, index) => {
    const dot = document.createElement("button"); dot.type = "button"; dot.className = "beat-dot"; dot.setAttribute("aria-label", `Show narrative step ${index + 1}`);
    dot.addEventListener("click", () => { beatIndex = index; renderBeat(); }); dots.appendChild(dot);
  });
  contourPath.style.strokeDashoffset = String(contourLength);
  requestAnimationFrame(() => requestAnimationFrame(renderBeat));
}
document.getElementById("beatBack").addEventListener("click", () => { beatIndex = Math.max(0, beatIndex - 1); renderBeat(); });
document.getElementById("beatNext").addEventListener("click", () => { if (beatIndex < 6) { beatIndex++; renderBeat(); } else goToScene(5); });
document.addEventListener("keydown", event => {
  if (event.key === "ArrowLeft" && sceneIndex !== 4) goToScene(sceneIndex - 1);
  if (event.key === "ArrowRight" && ![2, 3, 4].includes(sceneIndex)) goToScene(sceneIndex + 1);
});
let touchStartX = null;
document.addEventListener("touchstart", event => { touchStartX = event.touches[0].clientX; }, { passive: true });
document.addEventListener("touchend", event => {
  if (touchStartX === null || [2, 3, 4].includes(sceneIndex)) return;
  const delta = event.changedTouches[0].clientX - touchStartX;
  if (Math.abs(delta) > 70) goToScene(sceneIndex + (delta < 0 ? 1 : -1));
  touchStartX = null;
}, { passive: true });

updateModel(); syncAudienceCards(); goToScene(0);
