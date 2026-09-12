const sceneNames = ["The premise", "The KPI", "Expansion economics", "The audience", "The narrative", "Two rooms", "The method"];
const sceneTrack = document.getElementById("sceneTrack"), experienceEl = document.getElementById("experience"), scenes = [...document.querySelectorAll(".scene")];
let sceneIndex = 0, selectedAudience = "capital", selectedScenario = "current", beatIndex = 0;
const els = {
  progressFill: document.getElementById("progressFill"), progressCurrent: document.getElementById("progressCurrent"), progressLabel: document.getElementById("progressLabel"), sceneBack: document.getElementById("sceneBack"),
  deploymentVolume: document.getElementById("deploymentVolume"), systemsPerExpansion: document.getElementById("systemsPerExpansion"), currentExpansion: document.getElementById("currentExpansion"), targetExpansion: document.getElementById("targetExpansion")
};

experienceEl.addEventListener("scroll", () => { if (experienceEl.scrollLeft !== 0) experienceEl.scrollLeft = 0; }, { passive: true });
function clamp(value, min, max) { return Math.min(max, Math.max(min, value)); }
function model() {
  const deployments = clamp(Number(els.deploymentVolume.value) || 1, 1, 1000);
  const systems = clamp(Number(els.systemsPerExpansion.value) || 1, 1, 1000);
  const currentRate = clamp(Number(els.currentExpansion.value) || 0, 0, 100) / 100;
  const targetRate = clamp(Number(els.targetExpansion.value) || 0, 0, 100) / 100;
  return { deployments, systems, currentRate, targetRate, currentCustomers: deployments * currentRate, targetCustomers: deployments * targetRate, currentSystems: deployments * currentRate * systems, targetSystems: deployments * targetRate * systems, systemsGap: deployments * (targetRate - currentRate) * systems };
}
function linePath(points) { return points.map((point, index) => `${index ? "L" : "M"}${point[0].toFixed(1)} ${point[1].toFixed(1)}`).join(" "); }
function renderChart(m) {
  const left = 58, right = 742, top = 24, bottom = 242;
  const maxDeployments = Math.max(5, Math.ceil(m.deployments * 1.15 / 5) * 5);
  const maxSystems = Math.max(1, maxDeployments * Math.max(m.currentRate, m.targetRate) * m.systems * 1.08);
  const x = count => left + (count / maxDeployments) * (right - left), y = systems => bottom - (systems / maxSystems) * (bottom - top);
  const current = count => count * m.currentRate * m.systems, target = count => count * m.targetRate * m.systems;
  document.getElementById("currentLine").setAttribute("d", linePath([[x(0),y(0)],[x(maxDeployments),y(current(maxDeployments))]]));
  document.getElementById("targetLine").setAttribute("d", linePath([[x(0),y(0)],[x(maxDeployments),y(target(maxDeployments))]]));
  document.getElementById("profitArea").setAttribute("d", `M${x(0)} ${y(0)} L${x(maxDeployments)} ${y(target(maxDeployments))} L${x(maxDeployments)} ${y(current(maxDeployments))} Z`);
  const activeRate = selectedScenario === "current" ? m.currentRate : m.targetRate;
  const dot = document.getElementById("scenarioDot"); dot.setAttribute("cx", x(m.deployments)); dot.setAttribute("cy", y(m.deployments * activeRate * m.systems));
  const label = document.getElementById("profitLabel"); label.setAttribute("x", x(maxDeployments * .58)); label.setAttribute("y", y(target(maxDeployments * .58)) + 23); label.textContent = "ADDITIONAL SYSTEMS GAP";
  const grid = document.getElementById("chartGrid"); grid.innerHTML = "";
  [0,.25,.5,.75,1].forEach(ratio => { const count = maxDeployments * ratio; const line = document.createElementNS("http://www.w3.org/2000/svg","line"); line.setAttribute("x1",x(count)); line.setAttribute("x2",x(count)); line.setAttribute("y1",top); line.setAttribute("y2",bottom); grid.appendChild(line); const text = document.createElementNS("http://www.w3.org/2000/svg","text"); text.setAttribute("x",x(count)); text.setAttribute("y",263); text.setAttribute("text-anchor",ratio === 0 ? "start" : ratio === 1 ? "end" : "middle"); text.textContent = ratio === 0 ? "0 DEPLOYMENTS" : `${Math.round(count)} DEPLOYMENTS`; grid.appendChild(text); });
  [0,.5,1].forEach(ratio => { const systems = maxSystems * ratio; const line = document.createElementNS("http://www.w3.org/2000/svg","line"); line.setAttribute("x1",left); line.setAttribute("x2",right); line.setAttribute("y1",y(systems)); line.setAttribute("y2",y(systems)); grid.appendChild(line); if (ratio > 0) { const text = document.createElementNS("http://www.w3.org/2000/svg","text"); text.setAttribute("x",left - 7); text.setAttribute("y",y(systems) + 3); text.setAttribute("text-anchor","end"); text.textContent = `${Math.round(systems)} SYSTEMS`; grid.appendChild(text); } });
}
function updateModel() {
  const m = model(), target = selectedScenario === "target";
  document.getElementById("chartScenario").textContent = target ? "Target fleet-expansion path" : "Current expansion path";
  document.getElementById("expansionResult").textContent = `${Math.round((target ? m.targetRate : m.currentRate) * 100)}%`;
  document.getElementById("expandedCustomers").textContent = (target ? m.targetCustomers : m.currentCustomers).toFixed(1).replace(".0","");
  document.getElementById("additionalSystems").textContent = Math.round(target ? m.targetSystems : m.currentSystems);
  document.getElementById("compareExpansion").textContent = `${Math.round(m.targetRate * 100)}%`;
  document.getElementById("capitalImpact").textContent = `The target path creates ${Math.round(m.targetSystems)} additional live systems, ${Math.round(m.systemsGap)} above the current path.`;
  renderChart(m);
}
[els.deploymentVolume,els.systemsPerExpansion,els.currentExpansion,els.targetExpansion].forEach(input => input.addEventListener("input",updateModel));
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
document.getElementById("resetExperience").addEventListener("click",() => { els.deploymentVolume.value = 10; els.systemsPerExpansion.value = 6; els.currentExpansion.value = 30; els.targetExpansion.value = 60; selectedAudience = "capital"; selectedScenario = "current"; document.querySelector('input[value="capital"]').checked = true; document.querySelectorAll("[data-scenario]").forEach(item => item.classList.toggle("is-active",item.dataset.scenario === "current")); syncAudienceCards(); updateModel(); goToScene(0); });
function syncAudienceCards() { document.querySelectorAll(".audience-card").forEach(card => card.classList.toggle("is-selected",card.querySelector("input").checked)); }
document.querySelectorAll('input[name="audience"]').forEach(input => input.addEventListener("change",() => { selectedAudience = input.value; syncAudienceCards(); }));
document.getElementById("audienceForm").addEventListener("submit",event => { event.preventDefault(); selectedAudience = new FormData(event.currentTarget).get("audience") || "capital"; goToScene(4); });
document.querySelectorAll("[data-replay-room]").forEach(panel => panel.addEventListener("click",event => { event.preventDefault(); selectedAudience = panel.dataset.replayRoom; document.querySelector(`input[value="${selectedAudience}"]`).checked = true; syncAudienceCards(); goToScene(4); }));

function storyBeats() {
  const m = model(), currentRate = `${Math.round(m.currentRate * 100)}%`, targetRate = `${Math.round(m.targetRate * 100)}%`;
  if (selectedAudience === "team") return [
    ["WHAT IS","Sereact can make robots perform in production. But every new US site still has to earn customer trust.","A successful go-live is the beginning, not the commercial finish."],
    ["OPERATING OPPORTUNITY",`What if every first site proves the business case for the next fleet? At ${targetRate} expansion, the example cohort creates ${Math.round(m.targetSystems)} additional live systems.`,"Design the first deployment to make the next decision easy."],
    ["THE GAP",`The example moves from ${currentRate} to ${targetRate} deployment expansion.`,"Technical performance still needs to become a rollout decision."],
    ["WHAT IS","Throughput, uptime and autonomy can look strong without giving the customer a clear trigger for the next site.","Good KPIs do not automatically create the next order."],
    ["WHAT COULD BE","One 90-day scorecard connects operational performance to customer savings and a pre-agreed expansion trigger.","The proof, timing and next move are visible before go-live."],
    ["TEAM ACTION","Agree the scorecard and rollout trigger before go-live. Give every account one commercial and deployment owner.","You turn the first installation into an expansion motion."],
    ["BUSINESS OUTCOME",`The target path adds ${Math.round(m.systemsGap)} live systems above the current path. Add Sereact’s license economics to translate that fleet gap into contracted value.`,"Every successful deployment creates the next fleet opportunity."]
  ];
  return [
    ["WHAT IS","Sereact has proven Cortex across hundreds of live systems and billions of real production picks.","The technology risk is falling. The scale decision is here."],
    ["FINANCIAL OPPORTUNITY",`What if every successful first deployment becomes the entry point to a much larger fleet? At ${targetRate} expansion, the example cohort creates ${Math.round(m.targetSystems)} additional live systems.`,"Imagine US growth compounding from each customer already won."],
    ["THE GAP",`The example moves from ${currentRate} to ${targetRate} deployment expansion.`,"This is the commercial proof the next phase of investment must create."],
    ["WHAT IS","US expansion adds commercial and deployment cost before every first site proves it can scale.","More deployments alone do not yet prove a repeatable growth engine."],
    ["WHAT COULD BE","Expansion milestones connect capital deployment to larger customer fleets, more live data and a stronger Cortex moat.","The same outcome strengthens revenue and the model."],
    ["BOARD DECISION","Tie the next phase of US investment to deployment-expansion milestones and help secure multi-site anchor partners.","This is where we need your discipline, capital and access."],
    ["BUSINESS OUTCOME",`The target path adds ${Math.round(m.systemsGap)} live systems above the current path. Add Sereact’s license economics to translate that fleet gap into contracted value.`,"You turn a successful US entry into a repeatable fleet-expansion engine."]
  ];
}
const pathProgress = [.101,.19,.29,.46,.64,.765,1], contourPath = document.getElementById("contourLive"), contourLength = contourPath.getTotalLength();
contourPath.style.strokeDasharray = String(contourLength); contourPath.style.strokeDashoffset = String(contourLength);
function renderBeat() { const beat = storyBeats()[beatIndex]; document.getElementById("beatNumber").textContent = `${String(beatIndex + 1).padStart(2,"0")} / 07`; document.getElementById("beatFramework").textContent = beat[0]; document.getElementById("beatText").textContent = beat[1]; document.getElementById("beatThought").textContent = beat[2]; contourPath.style.strokeDashoffset = String(contourLength * (1 - pathProgress[beatIndex])); document.querySelector(".outcome-dot").style.opacity = beatIndex === 6 ? "1" : "0"; document.getElementById("beatBack").disabled = beatIndex === 0; document.getElementById("beatNext").innerHTML = beatIndex === 6 ? 'Compare the rooms <span>→</span>' : 'Next contrast <span>→</span>'; [...document.getElementById("beatDots").children].forEach((dot,index) => dot.classList.toggle("is-active",index === beatIndex)); }
function startStory() { beatIndex = 0; const isBoard = selectedAudience === "capital"; document.getElementById("roomBadge").dataset.audience = selectedAudience; document.getElementById("roomName").textContent = isBoard ? "Board update" : "US Commercial & Deployment"; document.getElementById("roomFocus").textContent = isBoard ? "US investment · evidence · direction" : "Business case · rollout · ownership"; document.getElementById("beatAudience").textContent = isBoard ? "BOARD UPDATE" : "US COMMERCIAL & DEPLOYMENT"; document.querySelectorAll("[data-room-panel]").forEach(panel => panel.classList.toggle("chosen-first",panel.dataset.roomPanel === selectedAudience)); const dots = document.getElementById("beatDots"); dots.innerHTML = ""; storyBeats().forEach((_,index) => { const dot = document.createElement("button"); dot.type = "button"; dot.className = "beat-dot"; dot.setAttribute("aria-label",`Show narrative step ${index + 1}`); dot.addEventListener("click",() => { beatIndex = index; renderBeat(); }); dots.appendChild(dot); }); contourPath.style.strokeDashoffset = String(contourLength); requestAnimationFrame(() => requestAnimationFrame(renderBeat)); }
document.getElementById("beatBack").addEventListener("click",() => { beatIndex = Math.max(0,beatIndex - 1); renderBeat(); });
document.getElementById("beatNext").addEventListener("click",() => { if (beatIndex < 6) { beatIndex++; renderBeat(); } else goToScene(5); });
document.addEventListener("keydown",event => { if (event.key === "ArrowLeft" && sceneIndex !== 4) goToScene(sceneIndex - 1); if (event.key === "ArrowRight" && ![2,3,4].includes(sceneIndex)) goToScene(sceneIndex + 1); });
let touchStartX = null; document.addEventListener("touchstart",event => { touchStartX = event.touches[0].clientX; },{ passive:true }); document.addEventListener("touchend",event => { if (touchStartX === null || [2,3,4].includes(sceneIndex)) return; const delta = event.changedTouches[0].clientX - touchStartX; if (Math.abs(delta) > 70) goToScene(sceneIndex + (delta < 0 ? 1 : -1)); touchStartX = null; },{ passive:true });
updateModel(); syncAudienceCards(); goToScene(0);
