const sceneNames = ["The premise", "The KPI", "Euro scenario", "The audience", "The narrative", "Two rooms", "The method"];
const sceneTrack = document.getElementById("sceneTrack"), experienceEl = document.getElementById("experience"), scenes = [...document.querySelectorAll(".scene")];
let sceneIndex = 0, selectedAudience = "commercial", selectedScenario = "current", beatIndex = 0;
const els = {
  progressFill: document.getElementById("progressFill"), progressCurrent: document.getElementById("progressCurrent"), progressLabel: document.getElementById("progressLabel"), sceneBack: document.getElementById("sceneBack"),
  orderBook: document.getElementById("orderBook"), currentCoverage: document.getElementById("currentCoverage"), targetCoverage: document.getElementById("targetCoverage"), realizationRate: document.getElementById("realizationRate")
};
experienceEl.addEventListener("scroll", () => { if (experienceEl.scrollLeft !== 0) experienceEl.scrollLeft = 0; }, { passive: true });
function clamp(value, min, max) { return Math.min(max, Math.max(min, value)); }
function formatEuro(value, signed = false) { const sign = signed && value > 0 ? "+" : ""; return `${sign}€${(Math.round((value + Math.sign(value) * 1e-9) * 10) / 10).toLocaleString("en-GB", {maximumFractionDigits:1})}m`; }
function model() {
  const orders = clamp(Number(els.orderBook.value) || 0, 1, 100000);
  const currentRate = clamp(Number(els.currentCoverage.value) || 0, 0, 100) / 100;
  const targetRate = clamp(Number(els.targetCoverage.value) || 0, 0, 100) / 100;
  const realizationRate = clamp(Number(els.realizationRate.value) || 0, 0, 100) / 100;
  return { orders, currentRate, targetRate, realizationRate, currentValue: orders * currentRate, targetValue: orders * targetRate, gap: orders * (targetRate - currentRate), currentRevenue: orders * currentRate * realizationRate, targetRevenue: orders * targetRate * realizationRate, revenueGap: orders * (targetRate - currentRate) * realizationRate };
}
function linePath(points) { return points.map((point, index) => `${index ? "L" : "M"}${point[0].toFixed(1)} ${point[1].toFixed(1)}`).join(" "); }
function renderChart(m) {
  const left = 65, right = 735, top = 24, bottom = 240, maxOrders = Math.max(100, Math.ceil(m.orders * 1.12 / 50) * 50);
  const maxValue = Math.max(1, maxOrders * Math.max(m.currentRate, m.targetRate) * 1.08);
  const x = value => left + (value / maxOrders) * (right - left), y = value => bottom - (value / maxValue) * (bottom - top);
  const current = value => value * m.currentRate, target = value => value * m.targetRate;
  document.getElementById("currentLine").setAttribute("d", linePath([[x(0), y(0)], [x(maxOrders), y(current(maxOrders))]]));
  document.getElementById("targetLine").setAttribute("d", linePath([[x(0), y(0)], [x(maxOrders), y(target(maxOrders))]]));
  document.getElementById("profitArea").setAttribute("d", `M${x(0)} ${y(0)} L${x(maxOrders)} ${y(target(maxOrders))} L${x(maxOrders)} ${y(current(maxOrders))} Z`);
  const activeRate = selectedScenario === "current" ? m.currentRate : m.targetRate;
  const dot = document.getElementById("scenarioDot"); dot.setAttribute("cx", x(m.orders)); dot.setAttribute("cy", y(m.orders * activeRate));
  const label = document.getElementById("profitLabel"); label.setAttribute("x", x(maxOrders * .55)); label.setAttribute("y", y(target(maxOrders * .55)) + 22); label.textContent = m.gap >= 0 ? "VALUE GAP" : "TARGET BELOW CURRENT";
  const grid = document.getElementById("chartGrid"); grid.innerHTML = "";
  [0,.25,.5,.75,1].forEach(ratio => { const value = maxOrders * ratio; const line = document.createElementNS("http://www.w3.org/2000/svg","line"); line.setAttribute("x1",x(value)); line.setAttribute("x2",x(value)); line.setAttribute("y1",top); line.setAttribute("y2",bottom); grid.appendChild(line); const label = document.createElementNS("http://www.w3.org/2000/svg","text"); label.setAttribute("x",x(value)); label.setAttribute("y",262); label.setAttribute("text-anchor",ratio === 0 ? "start" : ratio === 1 ? "end" : "middle"); label.textContent = ratio === 0 ? "€0 ORDER BOOK" : `€${Math.round(value)}m`; grid.appendChild(label); });
  [0,.5,1].forEach(ratio => { const value = maxValue * ratio; const line = document.createElementNS("http://www.w3.org/2000/svg","line"); line.setAttribute("x1",left); line.setAttribute("x2",right); line.setAttribute("y1",y(value)); line.setAttribute("y2",y(value)); grid.appendChild(line); if (ratio > 0) { const label = document.createElementNS("http://www.w3.org/2000/svg","text"); label.setAttribute("x",left - 7); label.setAttribute("y",y(value) + 3); label.setAttribute("text-anchor","end"); label.textContent = `€${Math.round(value)}m`; grid.appendChild(label); } });
}
function updateModel() {
  const m = model(), target = selectedScenario === "target";
  const pointChange = Math.round((m.targetRate - m.currentRate) * 100);
  const pointPhrase = `${Math.abs(pointChange)} ${Math.abs(pointChange) === 1 ? "point" : "points"}`;
  document.getElementById("forecastDelta").textContent = `${pointPhrase} ${pointChange >= 0 ? "more" : "fewer"}`;
  document.getElementById("storyDelta").textContent = pointPhrase;
  document.getElementById("forecastOpportunity").innerHTML = `<strong>What if?</strong> Moving from ${Math.round(m.currentRate * 100)}% to ${Math.round(m.targetRate * 100)}% changes order value with a launch window by ${formatEuro(m.gap, true)} and the illustrative revenue scenario by ${formatEuro(m.revenueGap, true)}. Delivery and actual contracts determine the result.`;
  document.getElementById("chartScenario").textContent = target ? "Target coverage example" : "Current coverage example";
  document.getElementById("coverageResult").textContent = `${Math.round((target ? m.targetRate : m.currentRate) * 100)}%`;
  document.getElementById("windowValue").textContent = formatEuro(target ? m.targetValue : m.currentValue);
  document.getElementById("revenueValue").textContent = formatEuro(target ? m.targetRevenue : m.currentRevenue);
  document.getElementById("compareCoverage").textContent = `${Math.round(m.targetRate * 100)}%`;
  document.getElementById("commercialOpportunity").textContent = `Imagine ${formatEuro(m.targetValue)} tied to launch windows. If ${Math.round(m.realizationRate * 100)}% is delivered and recorded as revenue, that is ${formatEuro(m.targetRevenue)} over 24 months.`;
  document.getElementById("investorOpportunity").textContent = `Moving to ${Math.round(m.targetRate * 100)}% coverage puts ${formatEuro(Math.abs(m.gap))} ${m.gap >= 0 ? "more" : "less"} order value on a delivery path and changes the revenue scenario by ${formatEuro(m.revenueGap, true)}.`;
  renderChart(m);
  if (sceneIndex === 4) renderBeat();
}
[els.orderBook, els.currentCoverage, els.targetCoverage, els.realizationRate].forEach(input => input.addEventListener("input", updateModel));
document.querySelectorAll("[data-scenario]").forEach(button => button.addEventListener("click", () => { selectedScenario = button.dataset.scenario; document.querySelectorAll("[data-scenario]").forEach(item => item.classList.toggle("is-active", item === button)); updateModel(); }));
function goToScene(nextIndex) {
  const bounded = clamp(nextIndex,0,scenes.length - 1); if (bounded === sceneIndex && bounded !== 0) return;
  const previous = sceneIndex; sceneIndex = bounded; sceneTrack.style.transform = `translate3d(-${sceneIndex * 100}vw,0,0)`;
  scenes.forEach((scene,index) => { const active = index === sceneIndex; scene.classList.toggle("is-active",active); scene.inert = !active; scene.setAttribute("aria-hidden",String(!active)); if (active) scene.scrollTop = 0; });
  els.progressFill.style.width = `${((sceneIndex + 1) / scenes.length) * 100}%`; els.progressCurrent.textContent = String(sceneIndex + 1).padStart(2,"0"); els.progressLabel.textContent = sceneNames[sceneIndex]; els.sceneBack.classList.toggle("is-visible",sceneIndex > 0);
  if (sceneIndex === 2) updateModel(); if (sceneIndex === 4 && previous !== 4) startStory();
}
document.querySelectorAll("[data-next]").forEach(button => button.addEventListener("click",() => goToScene(sceneIndex + 1)));
els.sceneBack.addEventListener("click",() => goToScene(sceneIndex - 1));
function syncAudienceCards() { document.querySelectorAll(".audience-card").forEach(card => card.classList.toggle("is-selected",card.querySelector("input").checked)); }
document.getElementById("resetExperience").addEventListener("click",() => { els.orderBook.value = 350; els.currentCoverage.value = 20; els.targetCoverage.value = 30; els.realizationRate.value = 70; selectedAudience = "commercial"; selectedScenario = "current"; document.querySelector('input[value="commercial"]').checked = true; document.querySelectorAll("[data-scenario]").forEach(item => item.classList.toggle("is-active",item.dataset.scenario === "current")); syncAudienceCards(); updateModel(); goToScene(0); });
document.querySelectorAll('input[name="audience"]').forEach(input => input.addEventListener("change",() => { selectedAudience = input.value; syncAudienceCards(); }));
document.getElementById("audienceForm").addEventListener("submit",event => { event.preventDefault(); selectedAudience = new FormData(event.currentTarget).get("audience") || "commercial"; goToScene(4); });
document.querySelectorAll("[data-replay-room]").forEach(panel => panel.addEventListener("click",event => { event.preventDefault(); selectedAudience = panel.dataset.replayRoom; document.querySelector(`input[value="${selectedAudience}"]`).checked = true; syncAudienceCards(); goToScene(4); }));
function storyBeats() {
  const m = model(), current = `${Math.round(m.currentRate * 100)}%`, target = `${Math.round(m.targetRate * 100)}%`, targetEuro = formatEuro(m.targetValue), uplift = formatEuro(Math.abs(m.gap)), revenue = formatEuro(m.targetRevenue), revenueUplift = formatEuro(Math.abs(m.revenueGap)), delivery = `${Math.round(m.realizationRate * 100)}%`, direction = m.gap >= 0 ? "more" : "less", outcomeDirection = m.revenueGap >= 0 ? "above" : "below";
  const pointChange = Math.abs(Math.round((m.targetRate - m.currentRate) * 100));
  const change = `${pointChange} percentage ${pointChange === 1 ? "point" : "points"}`;
  const smallStep = pointChange <= 10 ? "just " : "";
  if (selectedAudience === "investors") return [
    ["WHAT IS","We have reported more than €350m in orders and raised new capital to scale launch operations. Now we need to turn that demand into missions.","You have backed the ambition. Let me show you the next step."],
    ["FINANCIAL OPPORTUNITY",`Imagine moving launch-window coverage from ${current} to ${target}. That puts ${uplift} ${direction} order value on a delivery path. If we deliver and record ${delivery} of that value as revenue, it means ${revenueUplift} ${direction} revenue over 24 months.`,"A modest shift could move millions of euros."],
    ["WHAT IS","I know that is difficult. A customer commitment, rocket readiness and launch access must come together. An order is not yet a completed mission.","The work between a signed order and a launch is real."],
    ["WHAT COULD BE","We have one number that can keep us focused: order value with a customer, a credible launch window and a clear next milestone.","You can see whether our capital is moving demand closer to delivery."],
    ["WHAT IS","Production and tests use cash before missions are delivered. Each delay moves the related revenue further into the future.","That is why the sequence matters."],
    ["DECISION REQUIRED","I am asking you to back how we put the new capital to work over the next 90 days: production and launch steps tied to customer milestones. Help us reach the customers and launch partners who can move those missions forward.","Your support gives the next steps a real chance."],
    ["BUSINESS OUTCOME",`At ${target} coverage, ${targetEuro} of orders would have launch windows. If we deliver and record ${delivery} of that value as revenue within 24 months, that is ${revenue}, ${revenueUplift} ${outcomeDirection} the ${current} path. Please back the 90-day plan.`,"This is the future I am asking you to help build."]
  ];
  return [
    ["WHAT IS","We have reported more than €350m in orders. We are meeting customers across the industry. Now we need to turn the best conversations into missions.","What happens after each meeting?"],
    ["FINANCIAL OPPORTUNITY",`Imagine moving launch-window coverage from ${current} to ${target}, ${smallStep}${change}. That puts ${uplift} ${direction} order value on a delivery path. If we deliver and record ${delivery} of that value as revenue, it means ${revenueUplift} ${direction} revenue over 24 months.`,"A small shift could mean a very different business."],
    ["WHAT IS","That is hard. Customers need a date they can rely on. Our vehicles and launch sites must be ready for it. A good conversation is not yet a mission.","We know how much work sits between interest and launch."],
    ["WHAT COULD BE","We have one number to move: order value with a customer, a credible launch window and a clear next milestone.","We can see whether our work is getting closer to delivery."],
    ["WHAT IS","We cannot give every opportunity the same time and capacity. If we try, the missions closest to a decision may wait.","Focus is part of making this real."],
    ["DECISION REQUIRED","For the next 90 days, I need us to choose which opportunities to advance, agree what each customer needs to decide and name one owner for every next step.","Let us leave this room with clear priorities."],
    ["BUSINESS OUTCOME",`At ${target} coverage, ${targetEuro} of orders would have launch windows. If we deliver and record ${delivery} of that value as revenue within 24 months, that is ${revenue}, ${revenueUplift} ${outcomeDirection} the ${current} path. Let us commit to the 90-day plan today.`,"This is the future we can work towards together."]
  ];
}
const pathProgress = [.101,.19,.29,.46,.64,.765,1], contourPath = document.getElementById("contourLive"), contourLength = contourPath.getTotalLength();
contourPath.style.strokeDasharray = String(contourLength); contourPath.style.strokeDashoffset = String(contourLength);
function renderBeat() { const beat = storyBeats()[beatIndex]; document.getElementById("beatNumber").textContent = `${String(beatIndex + 1).padStart(2,"0")} / 07`; document.getElementById("beatFramework").textContent = beat[0]; document.getElementById("beatText").textContent = beat[1]; document.getElementById("beatThought").textContent = beat[2]; contourPath.style.strokeDashoffset = String(contourLength * (1 - pathProgress[beatIndex])); document.querySelector(".outcome-dot").style.opacity = beatIndex === 6 ? "1" : "0"; document.getElementById("beatBack").disabled = beatIndex === 0; document.getElementById("beatNext").innerHTML = beatIndex === 6 ? 'Compare the rooms <span>→</span>' : 'Next contrast <span>→</span>'; [...document.getElementById("beatDots").children].forEach((dot,index) => dot.classList.toggle("is-active",index === beatIndex)); }
function startStory() { beatIndex = 0; const isCommercial = selectedAudience === "commercial"; document.getElementById("roomBadge").dataset.audience = selectedAudience; document.getElementById("roomName").textContent = isCommercial ? "Commercial leadership" : "Existing investors"; document.getElementById("roomFocus").textContent = isCommercial ? "Customers · windows · ownership" : "Capital · milestones · execution"; document.getElementById("beatAudience").textContent = isCommercial ? "COMMERCIAL LEADERSHIP" : "EXISTING INVESTORS"; document.querySelectorAll("[data-room-panel]").forEach(panel => panel.classList.toggle("chosen-first",panel.dataset.roomPanel === selectedAudience)); const dots = document.getElementById("beatDots"); dots.innerHTML = ""; storyBeats().forEach((_,index) => { const dot = document.createElement("button"); dot.type = "button"; dot.className = "beat-dot"; dot.setAttribute("aria-label",`Show narrative step ${index + 1}`); dot.addEventListener("click",() => { beatIndex = index; renderBeat(); }); dots.appendChild(dot); }); contourPath.style.strokeDashoffset = String(contourLength); requestAnimationFrame(() => requestAnimationFrame(renderBeat)); }
document.getElementById("beatBack").addEventListener("click",() => { beatIndex = Math.max(0,beatIndex - 1); renderBeat(); });
document.getElementById("beatNext").addEventListener("click",() => { if (beatIndex < 6) { beatIndex++; renderBeat(); } else goToScene(5); });
document.addEventListener("keydown",event => { if (["INPUT","TEXTAREA"].includes(document.activeElement.tagName)) return; if (event.key === "ArrowLeft" && sceneIndex !== 4) goToScene(sceneIndex - 1); if (event.key === "ArrowRight" && ![2,3,4].includes(sceneIndex)) goToScene(sceneIndex + 1); });
let touchStartX = null; document.addEventListener("touchstart",event => { touchStartX = event.touches[0].clientX; },{ passive:true }); document.addEventListener("touchend",event => { if (touchStartX === null || [2,3,4].includes(sceneIndex)) return; const delta = event.changedTouches[0].clientX - touchStartX; if (Math.abs(delta) > 70) goToScene(sceneIndex + (delta < 0 ? 1 : -1)); touchStartX = null; },{ passive:true });
updateModel(); syncAudienceCards(); goToScene(0);
