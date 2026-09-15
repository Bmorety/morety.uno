const sceneNames = ["The premise", "The KPI", "Portfolio value", "The audience", "The narrative", "Two rooms", "The method"];
const sceneTrack = document.getElementById("sceneTrack"), experienceEl = document.getElementById("experience"), scenes = [...document.querySelectorAll(".scene")];
let sceneIndex = 0, selectedAudience = "customer", selectedScenario = "current", beatIndex = 0;
const els = {
  progressFill: document.getElementById("progressFill"), progressCurrent: document.getElementById("progressCurrent"), progressLabel: document.getElementById("progressLabel"), sceneBack: document.getElementById("sceneBack"),
  portfolioMw: document.getElementById("portfolioMw"), yieldPerMw: document.getElementById("yieldPerMw"), currentError: document.getElementById("currentError"), targetError: document.getElementById("targetError"), valuePerMwh: document.getElementById("valuePerMwh")
};

experienceEl.addEventListener("scroll", () => { if (experienceEl.scrollLeft !== 0) experienceEl.scrollLeft = 0; }, { passive: true });
function clamp(value, min, max) { return Math.min(max, Math.max(min, value)); }
function formatNumber(value, digits = 0) { return new Intl.NumberFormat("en-GB", { maximumFractionDigits: digits }).format(value); }
function formatMoney(value) {
  if (Math.abs(value) >= 1000000) return `€${(value / 1000000).toFixed(value >= 10000000 ? 0 : 1).replace(".0", "")}m`;
  if (Math.abs(value) >= 1000) return `€${(value / 1000).toFixed(value >= 100000 ? 0 : 1).replace(".0", "")}k`;
  return `€${formatNumber(value)}`;
}
function model() {
  const mw = clamp(Number(els.portfolioMw.value) || 1, 1, 100000);
  const yieldPerMw = clamp(Number(els.yieldPerMw.value) || 1, 1, 5000);
  const currentRate = clamp(Number(els.currentError.value) || 0, 0, 100) / 100;
  const targetRate = clamp(Number(els.targetError.value) || 0, 0, 100) / 100;
  const valueRate = clamp(Number(els.valuePerMwh.value) || 0, 0, 10000);
  const generation = mw * yieldPerMw;
  const currentVolume = generation * currentRate, targetVolume = generation * targetRate;
  const avoidedVolume = Math.max(0, currentVolume - targetVolume);
  const annualValue = avoidedVolume * valueRate;
  return { mw, yieldPerMw, currentRate, targetRate, valueRate, currentVolume, targetVolume, avoidedVolume, annualValue, valuePerMw: annualValue / mw };
}
function linePath(points) { return points.map((point, index) => `${index ? "L" : "M"}${point[0].toFixed(1)} ${point[1].toFixed(1)}`).join(" "); }
function renderChart(m) {
  const left = 62, right = 742, top = 24, bottom = 242;
  const maxMw = Math.max(100, Math.ceil(m.mw * 1.2 / 100) * 100);
  const maxVolume = Math.max(1, maxMw * m.yieldPerMw * Math.max(m.currentRate, m.targetRate, .01) * 1.08);
  const x = mw => left + (mw / maxMw) * (right - left), y = volume => bottom - (volume / maxVolume) * (bottom - top);
  const current = mw => mw * m.yieldPerMw * m.currentRate, target = mw => mw * m.yieldPerMw * m.targetRate;
  document.getElementById("currentLine").setAttribute("d", linePath([[x(0),y(0)],[x(maxMw),y(current(maxMw))]]));
  document.getElementById("targetLine").setAttribute("d", linePath([[x(0),y(0)],[x(maxMw),y(target(maxMw))]]));
  document.getElementById("profitArea").setAttribute("d", `M${x(0)} ${y(0)} L${x(maxMw)} ${y(current(maxMw))} L${x(maxMw)} ${y(target(maxMw))} Z`);
  const activeVolume = selectedScenario === "current" ? m.currentVolume : m.targetVolume;
  const dot = document.getElementById("scenarioDot"); dot.setAttribute("cx", x(m.mw)); dot.setAttribute("cy", y(activeVolume));
  const label = document.getElementById("profitLabel"); label.setAttribute("x", x(maxMw * .55)); label.setAttribute("y", y(current(maxMw * .55)) + 22); label.textContent = "AVOIDABLE FORECAST VOLUME";
  const grid = document.getElementById("chartGrid"); grid.innerHTML = "";
  [0,.25,.5,.75,1].forEach(ratio => { const mw = maxMw * ratio; const line = document.createElementNS("http://www.w3.org/2000/svg","line"); line.setAttribute("x1",x(mw)); line.setAttribute("x2",x(mw)); line.setAttribute("y1",top); line.setAttribute("y2",bottom); grid.appendChild(line); const text = document.createElementNS("http://www.w3.org/2000/svg","text"); text.setAttribute("x",x(mw)); text.setAttribute("y",263); text.setAttribute("text-anchor",ratio === 0 ? "start" : ratio === 1 ? "end" : "middle"); text.textContent = ratio === 0 ? "0 MW" : `${formatNumber(mw)} MW`; grid.appendChild(text); });
  [0,.5,1].forEach(ratio => { const volume = maxVolume * ratio; const line = document.createElementNS("http://www.w3.org/2000/svg","line"); line.setAttribute("x1",left); line.setAttribute("x2",right); line.setAttribute("y1",y(volume)); line.setAttribute("y2",y(volume)); grid.appendChild(line); if (ratio > 0) { const text = document.createElementNS("http://www.w3.org/2000/svg","text"); text.setAttribute("x",left - 7); text.setAttribute("y",y(volume) + 3); text.setAttribute("text-anchor","end"); text.textContent = `${formatNumber(volume)} MWh`; grid.appendChild(text); } });
}
function updateModel() {
  const m = model(), target = selectedScenario === "target";
  document.getElementById("chartScenario").textContent = target ? "Nuno forecast path" : "Current forecast path";
  document.getElementById("costlyVolume").textContent = `${formatNumber(target ? m.targetVolume : m.currentVolume)} MWh`;
  document.getElementById("annualValue").textContent = formatMoney(m.annualValue);
  document.getElementById("valuePerMw").textContent = formatMoney(m.valuePerMw);
  document.getElementById("compareValue").textContent = formatMoney(m.valuePerMw);
  document.getElementById("customerOpportunity").textContent = `Create ${formatMoney(m.annualValue)} in annual portfolio value by correcting ${formatNumber(m.avoidedVolume)} MWh of costly forecast volume.`;
  document.getElementById("customerImpact").textContent = `${formatMoney(m.valuePerMw)} of illustrative annual value per MW, with a rollout the customer can verify.`;
  renderChart(m);
}
[els.portfolioMw,els.yieldPerMw,els.currentError,els.targetError,els.valuePerMwh].forEach(input => input.addEventListener("input",updateModel));
document.querySelectorAll("[data-scenario]").forEach(button => button.addEventListener("click",() => { selectedScenario = button.dataset.scenario; document.querySelectorAll("[data-scenario]").forEach(item => item.classList.toggle("is-active",item === button)); updateModel(); }));

function goToScene(nextIndex) {
  const bounded = clamp(nextIndex,0,scenes.length - 1); if (bounded === sceneIndex && bounded !== 0) return;
  const previous = sceneIndex; sceneIndex = bounded; sceneTrack.style.transform = `translate3d(-${sceneIndex * 100}vw,0,0)`;
  scenes.forEach((scene,index) => { const active = index === sceneIndex; scene.classList.toggle("is-active",active); scene.inert = !active; scene.setAttribute("aria-hidden",String(!active)); if (active) scene.scrollTop = 0; });
  els.progressFill.style.width = `${((sceneIndex + 1) / scenes.length) * 100}%`; els.progressCurrent.textContent = String(sceneIndex + 1).padStart(2,"0"); els.progressLabel.textContent = sceneNames[sceneIndex]; els.sceneBack.classList.toggle("is-visible",sceneIndex > 0);
  if (sceneIndex === 2) updateModel(); if (sceneIndex === 4 && previous !== 4) startStory();
}
document.querySelectorAll("[data-next]").forEach(button => button.addEventListener("click",() => goToScene(sceneIndex + 1)));
els.sceneBack.addEventListener("click",() => goToScene(sceneIndex - 1));
document.getElementById("resetExperience").addEventListener("click",() => { els.portfolioMw.value = 500; els.yieldPerMw.value = 1000; els.currentError.value = 6; els.targetError.value = 4; els.valuePerMwh.value = 50; selectedAudience = "customer"; selectedScenario = "current"; document.querySelector('input[value="customer"]').checked = true; document.querySelectorAll("[data-scenario]").forEach(item => item.classList.toggle("is-active",item.dataset.scenario === "current")); syncAudienceCards(); updateModel(); goToScene(0); });
function syncAudienceCards() { document.querySelectorAll(".audience-card").forEach(card => card.classList.toggle("is-selected",card.querySelector("input").checked)); }
document.querySelectorAll('input[name="audience"]').forEach(input => input.addEventListener("change",() => { selectedAudience = input.value; syncAudienceCards(); }));
document.getElementById("audienceForm").addEventListener("submit",event => { event.preventDefault(); selectedAudience = new FormData(event.currentTarget).get("audience") || "customer"; goToScene(4); });
document.querySelectorAll("[data-replay-room]").forEach(panel => panel.addEventListener("click",event => { event.preventDefault(); selectedAudience = panel.dataset.replayRoom; document.querySelector(`input[value="${selectedAudience}"]`).checked = true; syncAudienceCards(); goToScene(4); }));

function storyBeats() {
  const m = model(), value = formatMoney(m.annualValue), valuePerMw = formatMoney(m.valuePerMw), avoided = formatNumber(m.avoidedVolume);
  if (selectedAudience === "investor") return [
    ["WHAT IS","Nuno has more than 25 projects in Germany, live operating proof and fresh investor capital.","The technology has left the lab. The commercial system now matters."],
    ["FINANCIAL OPPORTUNITY",`What if each successful park becomes the evidence for a wider portfolio? The illustration creates ${valuePerMw} of annual customer value per MW.`,"One verified number can make the next rollout easier to fund."],
    ["THE GAP","Public proof shows better forecasts, but not yet the recurring value created by each productive MW.","Investors can see activity. They still need to see the growth engine."],
    ["WHAT IS","Hardware, installation and data integration require capacity before every portfolio produces recurring revenue.","More projects can still consume cash faster than they prove scale."],
    ["WHAT COULD BE","A standard value-verification and deployment model connects productive MW to customer value, revenue quality and data advantage.","The same proof can improve growth and capital efficiency."],
    ["INVESTOR DECISION","Fund the installation and integration capacity required for contracted MW, released against productive-MW and verified-value milestones.","Capital now has a clear job and a measurable release point."],
    ["BUSINESS OUTCOME",`Nuno converts pilot evidence into repeatable portfolio expansion. In this illustration, every 500 MW rollout carries ${value} of annual customer value.`,"The business scales because the customer economics are visible and repeatable."]
  ];
  return [
    ["WHAT IS","Nuno’s Sensor Hubs already create more accurate short-term forecasts in operating solar parks.","The pilot has done its first job: prove the signal."],
    ["FINANCIAL OPPORTUNITY",`What if the next rollout decision starts with ${valuePerMw} of annual value per forecasted MW?`,"Now the customer can compare the value with the cost of expansion."],
    ["THE GAP",`In this illustration, Nuno corrects ${avoided} MWh of costly forecast volume and creates ${value} per year.`,"The real settlement and trading data will turn the illustration into evidence."],
    ["WHAT IS","Forecast accuracy alone does not tell trading, asset management and operations how many parks to approve.","A better model still needs a decision rule."],
    ["WHAT COULD BE","One shared verification method links forecast improvement to settlement, intraday and operating outcomes across the portfolio.","Every function can see the same economic result."],
    ["CUSTOMER DECISION","Approve the next MW tranche, share the data needed to verify value and agree the threshold that triggers further expansion.","The customer becomes the partner who proves and scales the value."],
    ["BUSINESS OUTCOME",`More value from the same solar assets, a defensible rollout and a repeatable path from one successful park to the next.`,"The forecast becomes infrastructure for a portfolio decision."]
  ];
}
const pathProgress = [.101,.19,.29,.46,.64,.765,1], contourPath = document.getElementById("contourLive"), contourLength = contourPath.getTotalLength();
contourPath.style.strokeDasharray = String(contourLength); contourPath.style.strokeDashoffset = String(contourLength);
function renderBeat() { const beat = storyBeats()[beatIndex]; document.getElementById("beatNumber").textContent = `${String(beatIndex + 1).padStart(2,"0")} / 07`; document.getElementById("beatFramework").textContent = beat[0]; document.getElementById("beatText").textContent = beat[1]; document.getElementById("beatThought").textContent = beat[2]; contourPath.style.strokeDashoffset = String(contourLength * (1 - pathProgress[beatIndex])); document.querySelector(".outcome-dot").style.opacity = beatIndex === 6 ? "1" : "0"; document.getElementById("beatBack").disabled = beatIndex === 0; document.getElementById("beatNext").innerHTML = beatIndex === 6 ? 'Compare the rooms <span>→</span>' : 'Next contrast <span>→</span>'; [...document.getElementById("beatDots").children].forEach((dot,index) => dot.classList.toggle("is-active",index === beatIndex)); }
function startStory() { beatIndex = 0; const isCustomer = selectedAudience === "customer"; document.getElementById("roomBadge").dataset.audience = selectedAudience; document.getElementById("roomName").textContent = isCustomer ? "Portfolio customer" : "Growth investors"; document.getElementById("roomFocus").textContent = isCustomer ? "Trading · asset management · operations" : "Scale · recurring value · capital efficiency"; document.getElementById("beatAudience").textContent = isCustomer ? "PORTFOLIO CUSTOMER" : "GROWTH INVESTORS"; document.querySelectorAll("[data-room-panel]").forEach(panel => panel.classList.toggle("chosen-first",panel.dataset.roomPanel === selectedAudience)); const dots = document.getElementById("beatDots"); dots.innerHTML = ""; storyBeats().forEach((_,index) => { const dot = document.createElement("button"); dot.type = "button"; dot.className = "beat-dot"; dot.setAttribute("aria-label",`Show narrative step ${index + 1}`); dot.addEventListener("click",() => { beatIndex = index; renderBeat(); }); dots.appendChild(dot); }); contourPath.style.strokeDashoffset = String(contourLength); requestAnimationFrame(() => requestAnimationFrame(renderBeat)); }
document.getElementById("beatBack").addEventListener("click",() => { beatIndex = Math.max(0,beatIndex - 1); renderBeat(); });
document.getElementById("beatNext").addEventListener("click",() => { if (beatIndex < 6) { beatIndex++; renderBeat(); } else goToScene(5); });
document.addEventListener("keydown",event => { if (event.key === "ArrowLeft" && sceneIndex !== 4) goToScene(sceneIndex - 1); if (event.key === "ArrowRight" && ![2,3,4].includes(sceneIndex)) goToScene(sceneIndex + 1); });
let touchStartX = null; document.addEventListener("touchstart",event => { touchStartX = event.touches[0].clientX; },{ passive:true }); document.addEventListener("touchend",event => { if (touchStartX === null || [2,3,4].includes(sceneIndex)) return; const delta = event.changedTouches[0].clientX - touchStartX; if (Math.abs(delta) > 70) goToScene(sceneIndex + (delta < 0 ? 1 : -1)); touchStartX = null; },{ passive:true });
updateModel(); syncAudienceCards(); goToScene(0);
