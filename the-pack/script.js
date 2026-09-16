const sceneNames = ["The premise", "The KPI", "France payback", "The audience", "The narrative", "Two rooms", "The method"];
const sceneTrack = document.getElementById("sceneTrack"), experienceEl = document.getElementById("experience"), scenes = [...document.querySelectorAll(".scene")];
let sceneIndex = 0, selectedAudience = "capital", selectedScenario = "current", beatIndex = 0;
const els = {
  progressFill: document.getElementById("progressFill"), progressCurrent: document.getElementById("progressCurrent"), progressLabel: document.getElementById("progressLabel"), sceneBack: document.getElementById("sceneBack"),
  franceInvestment: document.getElementById("franceInvestment"), currentArr: document.getElementById("currentArr"), targetArr: document.getElementById("targetArr"), grossMargin: document.getElementById("grossMargin")
};

experienceEl.addEventListener("scroll", () => { if (experienceEl.scrollLeft !== 0) experienceEl.scrollLeft = 0; }, { passive: true });
function clamp(value, min, max) { return Math.min(max, Math.max(min, value)); }
function formatEuroK(value) { return `€${Math.round(value).toLocaleString("en-US")}k`; }
function formatMonths(value) { return Number.isFinite(value) ? `${Math.ceil(value)} months` : "Not reached"; }
function model() {
  const investment = clamp(Number(els.franceInvestment.value) || 1, 1, 100000);
  const currentArr = clamp(Number(els.currentArr.value) || 1, 1, 100000);
  const targetArr = clamp(Number(els.targetArr.value) || 1, 1, 100000);
  const margin = clamp(Number(els.grossMargin.value) || 1, 1, 100) / 100;
  const currentMonthlyGrossProfit = currentArr * margin / 12;
  const targetMonthlyGrossProfit = targetArr * margin / 12;
  const currentPayback = investment / currentMonthlyGrossProfit;
  const targetPayback = investment / targetMonthlyGrossProfit;
  const requiredArr = investment / margin;
  return { investment, currentArr, targetArr, margin, currentMonthlyGrossProfit, targetMonthlyGrossProfit, currentPayback, targetPayback, requiredArr, monthsGained: currentPayback - targetPayback };
}
function linePath(points) { return points.map((point, index) => `${index ? "L" : "M"}${point[0].toFixed(1)} ${point[1].toFixed(1)}`).join(" "); }
function renderChart(m) {
  const left = 58, right = 742, top = 24, bottom = 242, horizon = 36;
  const activeMonthly = selectedScenario === "target" ? m.targetMonthlyGrossProfit : m.currentMonthlyGrossProfit;
  const activePayback = selectedScenario === "target" ? m.targetPayback : m.currentPayback;
  const maxValue = Math.max(m.investment * 1.15, m.targetMonthlyGrossProfit * horizon * 1.08);
  const x = month => left + (month / horizon) * (right - left), y = value => bottom - (value / maxValue) * (bottom - top);
  document.getElementById("grossProfitLine").setAttribute("d", linePath([[x(0), y(0)], [x(horizon), y(activeMonthly * horizon)]]));
  document.getElementById("investmentLine").setAttribute("d", linePath([[x(0), y(m.investment)], [x(horizon), y(m.investment)]]));
  const area = document.getElementById("profitArea");
  area.setAttribute("d", activePayback < horizon ? `M${x(activePayback)} ${y(m.investment)} L${x(horizon)} ${y(activeMonthly * horizon)} L${x(horizon)} ${y(m.investment)} Z` : "");
  const dotMonth = Math.min(activePayback, horizon), dot = document.getElementById("scenarioDot");
  dot.setAttribute("cx", x(dotMonth)); dot.setAttribute("cy", y(activeMonthly * dotMonth));
  const label = document.getElementById("profitLabel"); label.setAttribute("x", x(Math.min(activePayback + 1, 29))); label.setAttribute("y", y(m.investment) - 9); label.textContent = activePayback <= horizon ? `PAYBACK · ${Math.ceil(activePayback)} MONTHS` : "PAYBACK BEYOND 36 MONTHS";
  const grid = document.getElementById("chartGrid"); grid.innerHTML = "";
  [0, 6, 12, 18, 24, 30, 36].forEach(month => { const line = document.createElementNS("http://www.w3.org/2000/svg", "line"); line.setAttribute("x1", x(month)); line.setAttribute("x2", x(month)); line.setAttribute("y1", top); line.setAttribute("y2", bottom); grid.appendChild(line); const text = document.createElementNS("http://www.w3.org/2000/svg", "text"); text.setAttribute("x", x(month)); text.setAttribute("y", 263); text.setAttribute("text-anchor", month === 0 ? "start" : month === 36 ? "end" : "middle"); text.textContent = `${month}M`; grid.appendChild(text); });
  [0, .5, 1].forEach(ratio => { const value = maxValue * ratio; const line = document.createElementNS("http://www.w3.org/2000/svg", "line"); line.setAttribute("x1", left); line.setAttribute("x2", right); line.setAttribute("y1", y(value)); line.setAttribute("y2", y(value)); grid.appendChild(line); if (ratio > 0) { const text = document.createElementNS("http://www.w3.org/2000/svg", "text"); text.setAttribute("x", left - 7); text.setAttribute("y", y(value) + 3); text.setAttribute("text-anchor", "end"); text.textContent = formatEuroK(value); grid.appendChild(text); } });
}
function updateModel() {
  const m = model(), target = selectedScenario === "target", activeArr = target ? m.targetArr : m.currentArr, activePayback = target ? m.targetPayback : m.currentPayback;
  document.getElementById("chartScenario").textContent = target ? "Target ARR path" : "Current ARR path";
  document.getElementById("paybackResult").textContent = formatMonths(activePayback);
  document.getElementById("efficiencyResult").textContent = `${(activeArr / m.investment).toFixed(2)}×`;
  document.getElementById("requiredArr").textContent = formatEuroK(m.requiredArr);
  document.getElementById("comparePayback").textContent = String(Math.ceil(m.targetPayback));
  document.getElementById("capitalImpact").textContent = `The target path reaches gross-profit payback in ${Math.ceil(m.targetPayback)} months, ${Math.max(0, Math.round(m.monthsGained))} months earlier than the current path.`;
  renderChart(m);
}
[els.franceInvestment, els.currentArr, els.targetArr, els.grossMargin].forEach(input => input.addEventListener("input", updateModel));
document.querySelectorAll("[data-scenario]").forEach(button => button.addEventListener("click", () => { selectedScenario = button.dataset.scenario; document.querySelectorAll("[data-scenario]").forEach(item => item.classList.toggle("is-active", item === button)); updateModel(); }));

function goToScene(nextIndex) {
  const bounded = clamp(nextIndex, 0, scenes.length - 1); if (bounded === sceneIndex && bounded !== 0) return;
  const previous = sceneIndex; sceneIndex = bounded; sceneTrack.style.transform = `translate3d(-${sceneIndex * 100}vw,0,0)`;
  scenes.forEach((scene, index) => { const active = index === sceneIndex; scene.classList.toggle("is-active", active); scene.inert = !active; scene.setAttribute("aria-hidden", String(!active)); if (active) scene.scrollTop = 0; });
  els.progressFill.style.width = `${((sceneIndex + 1) / scenes.length) * 100}%`; els.progressCurrent.textContent = String(sceneIndex + 1).padStart(2, "0"); els.progressLabel.textContent = sceneNames[sceneIndex]; els.sceneBack.classList.toggle("is-visible", sceneIndex > 0);
  if (sceneIndex === 2) updateModel(); if (sceneIndex === 4 && previous !== 4) startStory();
}
document.querySelectorAll("[data-next]").forEach(button => button.addEventListener("click", () => goToScene(sceneIndex + 1)));
els.sceneBack.addEventListener("click", () => goToScene(sceneIndex - 1));
document.getElementById("resetExperience").addEventListener("click", () => { els.franceInvestment.value = 600; els.currentArr.value = 300; els.targetArr.value = 750; els.grossMargin.value = 80; selectedAudience = "capital"; selectedScenario = "current"; document.querySelector('input[value="capital"]').checked = true; document.querySelectorAll("[data-scenario]").forEach(item => item.classList.toggle("is-active", item.dataset.scenario === "current")); syncAudienceCards(); updateModel(); goToScene(0); });
function syncAudienceCards() { document.querySelectorAll(".audience-card").forEach(card => card.classList.toggle("is-selected", card.querySelector("input").checked)); }
document.querySelectorAll('input[name="audience"]').forEach(input => input.addEventListener("change", () => { selectedAudience = input.value; syncAudienceCards(); }));
document.getElementById("audienceForm").addEventListener("submit", event => { event.preventDefault(); selectedAudience = new FormData(event.currentTarget).get("audience") || "capital"; goToScene(4); });
document.querySelectorAll("[data-replay-room]").forEach(panel => panel.addEventListener("click", event => { event.preventDefault(); selectedAudience = panel.dataset.replayRoom; document.querySelector(`input[value="${selectedAudience}"]`).checked = true; syncAudienceCards(); goToScene(4); }));

function storyBeats() {
  const m = model(), currentMonths = Math.ceil(m.currentPayback), targetMonths = Math.ceil(m.targetPayback), gained = Math.max(0, Math.round(m.monthsGained));
  if (selectedAudience === "team") return [
    ["WHAT IS", "France now has customers, pipeline, local hiring and visible market activity.", "The signals are real, but they still sit in different parts of the update."],
    ["FINANCIAL OPPORTUNITY", `Imagine France ARR at ${formatEuroK(m.targetArr)}. At the selected margin, gross-profit payback moves from ${currentMonths} to ${targetMonths} months.`, "The next update can show a future worth working towards."],
    ["THE GAP", `That is ${gained} months of capital recovery to earn. Every customer win needs to show how much it moves us along that path.`, "The room should see what each win changes."],
    ["WHAT IS", "We could report investment, signed ARR and margin correctly and still leave the Board unsure what to support next.", "Correct numbers need a decision story."],
    ["WHAT COULD BE", "One definition connects every customer win to cumulative gross profit, payback and the next resource decision.", "The monthly update finally shows what changed and why it matters."],
    ["LEADERSHIP DECISION", "I need us to agree one payback definition, one data owner and a monthly bridge from France investment to ARR, margin and payback.", "Let us put the same financial story in every update."],
    ["BUSINESS OUTCOME", `With that shared view, we can show the Board how ${formatEuroK(m.targetArr)} in France ARR could bring gross-profit payback to ${targetMonths} months. Let us agree the bridge before the next update.`, "The room can see both the opportunity and the decision."],
  ];
  return [
    ["WHAT IS", "Pack enters France with funding, European momentum, local leadership and an established enterprise product.", "The market-entry case is credible. The capital question comes next."],
    ["FINANCIAL OPPORTUNITY", `Imagine France reaching ${formatEuroK(m.targetArr)} in ARR. At the selected margin, gross-profit payback falls from ${currentMonths} to ${targetMonths} months.`, "France could prove more than growth. It could prove repeatability."],
    ["THE GAP", `That is ${gained} months of capital recovery to earn. It will not happen just because we add customers and hire locally.`, "The next investment needs clear economic proof."],
    ["WHAT IS", "Customers, pipeline and hiring show movement, but market investment arrives before recurring gross profit.", "Activity alone does not show when growth begins to fund itself."],
    ["WHAT COULD BE", "One payback curve connects France ARR to margin, capital recovery and runway visibility.", "Now the room can see the economic future behind each win."],
    ["BOARD DECISION", "I am asking you to release the next resources against a clear payback threshold and help us meet qualified senior CHRO buyers.", "Your capital and access can move the next customer wins."],
    ["BUSINESS OUTCOME", `At ${formatEuroK(m.targetArr)} in France ARR, gross-profit payback reaches ${targetMonths} months, ${gained} months earlier than the ${formatEuroK(m.currentArr)} path. Please back the next measured step.`, "France can become a model for the next market."],
  ];
}
const pathProgress = [.101, .19, .29, .46, .64, .765, 1], contourPath = document.getElementById("contourLive"), contourLength = contourPath.getTotalLength();
contourPath.style.strokeDasharray = String(contourLength); contourPath.style.strokeDashoffset = String(contourLength);
function renderBeat() { const beat = storyBeats()[beatIndex]; document.getElementById("beatNumber").textContent = `${String(beatIndex + 1).padStart(2, "0")} / 07`; document.getElementById("beatFramework").textContent = beat[0]; document.getElementById("beatText").textContent = beat[1]; document.getElementById("beatThought").textContent = beat[2]; contourPath.style.strokeDashoffset = String(contourLength * (1 - pathProgress[beatIndex])); document.querySelector(".outcome-dot").style.opacity = beatIndex === 6 ? "1" : "0"; document.getElementById("beatBack").disabled = beatIndex === 0; document.getElementById("beatNext").innerHTML = beatIndex === 6 ? 'Compare the rooms <span>→</span>' : 'Next contrast <span>→</span>'; [...document.getElementById("beatDots").children].forEach((dot, index) => dot.classList.toggle("is-active", index === beatIndex)); }
function startStory() { beatIndex = 0; const isBoard = selectedAudience === "capital"; document.getElementById("roomBadge").dataset.audience = selectedAudience; document.getElementById("roomName").textContent = isBoard ? "Board & existing investors" : "Executive & France Growth"; document.getElementById("roomFocus").textContent = isBoard ? "Capital · evidence · market access" : "Definition · reporting · ownership"; document.getElementById("beatAudience").textContent = isBoard ? "BOARD & EXISTING INVESTORS" : "EXECUTIVE & FRANCE GROWTH"; document.querySelectorAll("[data-room-panel]").forEach(panel => panel.classList.toggle("chosen-first", panel.dataset.roomPanel === selectedAudience)); const dots = document.getElementById("beatDots"); dots.innerHTML = ""; storyBeats().forEach((_, index) => { const dot = document.createElement("button"); dot.type = "button"; dot.className = "beat-dot"; dot.setAttribute("aria-label", `Show narrative step ${index + 1}`); dot.addEventListener("click", () => { beatIndex = index; renderBeat(); }); dots.appendChild(dot); }); contourPath.style.strokeDashoffset = String(contourLength); requestAnimationFrame(() => requestAnimationFrame(renderBeat)); }
document.getElementById("beatBack").addEventListener("click", () => { beatIndex = Math.max(0, beatIndex - 1); renderBeat(); });
document.getElementById("beatNext").addEventListener("click", () => { if (beatIndex < 6) { beatIndex++; renderBeat(); } else goToScene(5); });
document.addEventListener("keydown", event => { if (event.key === "ArrowLeft" && sceneIndex !== 4) goToScene(sceneIndex - 1); if (event.key === "ArrowRight" && ![2, 3, 4].includes(sceneIndex)) goToScene(sceneIndex + 1); });
let touchStartX = null; document.addEventListener("touchstart", event => { touchStartX = event.touches[0].clientX; }, { passive: true }); document.addEventListener("touchend", event => { if (touchStartX === null || [2, 3, 4].includes(sceneIndex)) return; const delta = event.changedTouches[0].clientX - touchStartX; if (Math.abs(delta) > 70) goToScene(sceneIndex + (delta < 0 ? 1 : -1)); touchStartX = null; }, { passive: true });
updateModel(); syncAudienceCards(); goToScene(0);
