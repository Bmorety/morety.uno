const sceneNames = ["The premise", "The KPI", "The business gap", "The audience", "The narrative", "Two rooms"];
const sceneTrack = document.getElementById("sceneTrack");
const experienceEl = document.getElementById("experience");
const scenes = [...document.querySelectorAll(".scene")];
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
let sceneIndex = 0;
let selectedAudience = "board";
let beatIndex = 0;

const els = {
  progressFill: document.getElementById("progressFill"), progressCurrent: document.getElementById("progressCurrent"), progressLabel: document.getElementById("progressLabel"),
  sceneBack: document.getElementById("sceneBack"), revenue: document.getElementById("annualRevenue"), currentShare: document.getElementById("currentShare"), targetShare: document.getElementById("targetShare"),
  customMargin: document.getElementById("customMargin"), productMargin: document.getElementById("productMargin")
};

experienceEl.addEventListener("scroll", () => { if (experienceEl.scrollLeft !== 0) experienceEl.scrollLeft = 0; }, { passive: true });

function clamp(value, min, max) { return Math.min(max, Math.max(min, value)); }
function money(value) {
  const abs = Math.abs(value);
  if (abs >= 1000000) return `${value < 0 ? "−" : ""}€${(abs / 1000000).toFixed(abs % 1000000 ? 1 : 0)}m`;
  if (abs >= 1000) return `${value < 0 ? "−" : ""}€${Math.round(abs / 1000)}k`;
  return `${value < 0 ? "−" : ""}€${Math.round(abs)}`;
}

function model() {
  const revenue = clamp(Number(els.revenue.value) || 1000000, 100000, 100000000);
  const currentShare = clamp(Number(els.currentShare.value), 0, 90);
  let targetShare = clamp(Number(els.targetShare.value), 5, 100);
  if (targetShare <= currentShare) { targetShare = Math.min(100, currentShare + 5); els.targetShare.value = targetShare; }
  const customMargin = clamp(Number(els.customMargin.value) || 0, 0, 95);
  const productMargin = clamp(Number(els.productMargin.value) || 0, 0, 95);
  const blended = share => ((share / 100) * productMargin) + ((1 - share / 100) * customMargin);
  const currentMargin = blended(currentShare), targetMargin = blended(targetShare);
  const currentContribution = revenue * currentMargin / 100, targetContribution = revenue * targetMargin / 100;
  return { revenue, currentShare, targetShare, currentMargin, targetMargin, currentContribution, targetContribution, currentCost: revenue - currentContribution, targetCost: revenue - targetContribution, shifted: revenue * (targetShare - currentShare) / 100, gain: targetContribution - currentContribution, marginGain: targetMargin - currentMargin };
}

function updateModel() {
  const m = model();
  document.getElementById("currentShareOut").textContent = `${m.currentShare}%`;
  document.getElementById("targetShareOut").textContent = `${m.targetShare}%`;
  document.getElementById("currentShareLabel").textContent = `${m.currentShare}%`;
  document.getElementById("targetShareLabel").textContent = `${m.targetShare}%`;
  document.querySelectorAll("[data-revenue]").forEach(el => el.textContent = money(m.revenue));
  document.getElementById("currentContribution").textContent = money(m.currentContribution);
  document.getElementById("targetContribution").textContent = money(m.targetContribution);
  document.getElementById("currentCost").textContent = money(m.currentCost);
  document.getElementById("targetCost").textContent = money(m.targetCost);
  document.getElementById("currentBlendedMargin").textContent = `${m.currentMargin.toFixed(1)}%`;
  document.getElementById("targetBlendedMargin").textContent = `${m.targetMargin.toFixed(1)}%`;
  document.getElementById("revenueShift").textContent = money(m.shifted);
  document.getElementById("contributionGain").textContent = `${m.gain >= 0 ? "+" : "−"}${money(Math.abs(m.gain))}`;
  document.getElementById("marginGain").textContent = `${m.marginGain >= 0 ? "+" : ""}${m.marginGain.toFixed(1)} pts`;
  document.getElementById("gapDirection").textContent = m.gain >= 0 ? "THE GAP OPENS" : "THE GAP CLOSES";
  document.getElementById("compareShare").textContent = `${m.targetShare}%`;
  document.querySelector("#currentBar .contribution-area").style.height = `${m.currentMargin}%`;
  document.querySelector("#currentBar .cost-area").style.height = `${100 - m.currentMargin}%`;
  document.querySelector("#targetBar .contribution-area").style.height = `${m.targetMargin}%`;
  document.querySelector("#targetBar .cost-area").style.height = `${100 - m.targetMargin}%`;
}

[els.revenue, els.currentShare, els.targetShare, els.customMargin, els.productMargin].forEach(input => input.addEventListener("input", updateModel));

function goToScene(nextIndex) {
  const bounded = clamp(nextIndex, 0, scenes.length - 1);
  if (bounded === sceneIndex && bounded !== 0) return;
  const previous = sceneIndex; sceneIndex = bounded;
  sceneTrack.style.transform = `translate3d(-${sceneIndex * 100}vw, 0, 0)`;
  scenes.forEach((scene, index) => { const active = index === sceneIndex; scene.classList.toggle("is-active", active); scene.inert = !active; scene.setAttribute("aria-hidden", String(!active)); if (active) scene.scrollTop = 0; });
  els.progressFill.style.width = `${((sceneIndex + 1) / scenes.length) * 100}%`;
  els.progressCurrent.textContent = String(sceneIndex + 1).padStart(2, "0"); els.progressLabel.textContent = sceneNames[sceneIndex]; els.sceneBack.classList.toggle("is-visible", sceneIndex > 0);
  if (sceneIndex === 4 && previous !== 4) startStory();
}

document.querySelectorAll("[data-next]").forEach(button => button.addEventListener("click", () => goToScene(sceneIndex + 1)));
els.sceneBack.addEventListener("click", () => goToScene(sceneIndex - 1));
document.getElementById("resetExperience").addEventListener("click", () => {
  els.revenue.value = 1000000; els.currentShare.value = 20; els.targetShare.value = 40; els.customMargin.value = 40; els.productMargin.value = 65; selectedAudience = "board";
  document.querySelector('input[value="board"]').checked = true; syncAudienceCards(); updateModel(); goToScene(0);
});

function syncAudienceCards() { document.querySelectorAll(".audience-card").forEach(card => card.classList.toggle("is-selected", card.querySelector("input").checked)); }
document.querySelectorAll('input[name="audience"]').forEach(input => input.addEventListener("change", () => { selectedAudience = input.value; syncAudienceCards(); }));
document.getElementById("audienceForm").addEventListener("submit", event => { event.preventDefault(); selectedAudience = new FormData(event.currentTarget).get("audience") || "board"; goToScene(4); });
document.querySelectorAll("[data-replay-room]").forEach(panel => panel.addEventListener("click", event => { event.preventDefault(); selectedAudience = panel.dataset.replayRoom; document.querySelector(`input[value="${selectedAudience}"]`).checked = true; syncAudienceCards(); goToScene(4); }));

function storyBeats() {
  const m = model();
  const gainPerMillion = m.revenue ? (m.gain / m.revenue) * 1000000 : 0;
  if (selectedAudience === "team") return [
    ["WHAT IS", "Mapular delivers ready-to-use solutions and custom projects through the same small, expert team.", "The range is a strength. It can also make repeatable delivery harder."],
    ["THE BUSINESS GAP · CALL TO ADVENTURE", "Imagine the next Opportunity Mapping project leaving behind a reusable asset, so the following project earns more without repeating the same work.", "One delivery can make the next one more profitable."],
    ["WHAT IT COULD BE", "Split every step into three groups: automate, template or expert-only.", "Reuse what already works. Keep the team focused on the judgement calls."],
    ["WHAT IS", "Small exceptions can turn a repeatable offer back into a custom project.", "One ‘small request’ at a time, the margin disappears."],
    ["WHAT IT COULD BE", "Track delivery hours and gross margin for each offer. Then the team can see which exceptions are worth it.", "Some custom work pays. Some just adds work."],
    ["THE DECISION · CALL TO ACTION", "I need us to map one delivery end to end, track the hours, agree which exceptions we accept and save one reusable asset from every project.", "Make the next job easier because this one happened."],
    ["BUSINESS OUTCOME · WHAT IT COULD BE", "If we do this consistently, the same team can support more revenue without rebuilding each solution. Let us start with the next project.", "Our expertise should grow in value each time we use it."]
  ];
  return [
    ["WHAT IS", "Mapular already combines tailored project work with products, fixed-price packages and reusable data.", "The strategic shift has started."],
    ["THE BUSINESS GAP · CALL TO ADVENTURE", `Imagine moving reusable-IP revenue from ${m.currentShare}% to ${m.targetShare}% while keeping the value of our custom work.`, "The same knowledge could earn more than once."],
    ["WHAT IT COULD BE", `Moving productized share from ${m.currentShare}% to ${m.targetShare}% lifts gross contribution by ${money(m.gain)}. That is ${money(gainPerMillion)} for every €1m of revenue.`, "The gap widens before adding another euro of sales."],
    ["WHAT IS", "Calling an offer productized does not make it scalable. Custom requests can push delivery cost straight back up.", "Recurring work can still be custom work."],
    ["WHAT IT COULD BE", "Standard methods, shared data pipelines and clear limits on exceptions let revenue grow faster than delivery cost.", "Use what Mapular has already learned."],
    ["THE DECISION · CALL TO ACTION", "I am asking you to approve a 90-day test for one proven offer, with a margin floor and clear limits on exceptions.", "Give us a focused test we can measure."],
    ["BUSINESS OUTCOME · WHAT IT COULD BE", `At ${m.targetShare}% reusable-IP revenue, the same sales mix could add ${money(m.gain)} in gross contribution. Please back the 90-day test.`, "Our expertise no longer resets after every project."]
  ];
}

const pathProgress = [.101, .19, .29, .46, .64, .765, 1];
const contourPath = document.getElementById("contourLive"), contourLength = contourPath.getTotalLength();
contourPath.style.strokeDasharray = String(contourLength); contourPath.style.strokeDashoffset = String(contourLength);

function renderBeat() {
  const beats = storyBeats(), beat = beats[beatIndex];
  document.getElementById("beatNumber").textContent = `${String(beatIndex + 1).padStart(2,"0")} / 07`;
  document.getElementById("beatFramework").textContent = beat[0]; document.getElementById("beatText").textContent = beat[1]; document.getElementById("beatThought").textContent = beat[2];
  contourPath.style.strokeDashoffset = String(contourLength * (1 - pathProgress[beatIndex])); document.querySelector(".outcome-dot").style.opacity = beatIndex === 6 ? "1" : "0";
  document.getElementById("beatBack").disabled = beatIndex === 0; document.getElementById("beatNext").innerHTML = beatIndex === 6 ? 'Compare the rooms <span>→</span>' : 'Next contrast <span>→</span>';
  [...document.getElementById("beatDots").children].forEach((dot, index) => dot.classList.toggle("is-active", index === beatIndex));
}

function startStory() {
  beatIndex = 0; const isBoard = selectedAudience === "board";
  document.getElementById("roomBadge").dataset.audience = selectedAudience; document.getElementById("roomName").textContent = isBoard ? "Board" : "Delivery team";
  document.getElementById("roomFocus").textContent = isBoard ? "Risk · direction · trade-offs" : "Ownership · process · action"; document.getElementById("beatAudience").textContent = isBoard ? "BOARD" : "DELIVERY TEAM";
  document.querySelectorAll("[data-room-panel]").forEach(panel => panel.classList.toggle("chosen-first", panel.dataset.roomPanel === selectedAudience));
  const dots = document.getElementById("beatDots"); dots.innerHTML = "";
  storyBeats().forEach((_, index) => { const dot = document.createElement("button"); dot.type = "button"; dot.className = "beat-dot"; dot.setAttribute("aria-label", `Show story beat ${index + 1}`); dot.addEventListener("click", () => { beatIndex = index; renderBeat(); }); dots.appendChild(dot); });
  contourPath.style.strokeDashoffset = String(contourLength); requestAnimationFrame(() => requestAnimationFrame(renderBeat));
}

document.getElementById("beatBack").addEventListener("click", () => { beatIndex = Math.max(0, beatIndex - 1); renderBeat(); });
document.getElementById("beatNext").addEventListener("click", () => { if (beatIndex < 6) { beatIndex++; renderBeat(); } else goToScene(5); });
document.addEventListener("keydown", event => { if (event.key === "ArrowLeft" && sceneIndex !== 4) goToScene(sceneIndex - 1); if (event.key === "ArrowRight" && ![2,3,4].includes(sceneIndex)) goToScene(sceneIndex + 1); });
let touchStartX = null; document.addEventListener("touchstart", event => { touchStartX = event.touches[0].clientX; }, { passive: true });
document.addEventListener("touchend", event => { if (touchStartX === null || [2,3,4].includes(sceneIndex)) return; const delta = event.changedTouches[0].clientX - touchStartX; if (Math.abs(delta) > 70) goToScene(sceneIndex + (delta < 0 ? 1 : -1)); touchStartX = null; }, { passive: true });

updateModel(); syncAudienceCards(); goToScene(0);
