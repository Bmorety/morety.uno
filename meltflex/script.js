const sceneNames = ["The premise", "The KPI", "Partner economics", "The audience", "The narrative", "Two rooms", "The method"];
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
  monthlyRevenue: document.getElementById("monthlyRevenue"),
  monthlyCost: document.getElementById("monthlyCost"),
  currentSetup: document.getElementById("currentSetup"),
  targetSetup: document.getElementById("targetSetup"),
  partnerCount: document.getElementById("partnerCount")
};

experienceEl.addEventListener("scroll", () => {
  if (experienceEl.scrollLeft !== 0) experienceEl.scrollLeft = 0;
}, { passive: true });

function clamp(value, min, max) { return Math.min(max, Math.max(min, value)); }

function money(value) {
  const abs = Math.abs(value);
  const sign = value < 0 ? "−" : "";
  if (abs >= 1000000) return `${sign}€${(abs / 1000000).toFixed(abs % 1000000 ? 1 : 0)}m`;
  if (abs >= 1000) return `${sign}€${Math.round(abs / 1000)}k`;
  return `${sign}€${Math.round(abs)}`;
}

function model() {
  const monthlyRevenue = clamp(Number(els.monthlyRevenue.value) || 6000, 500, 1000000);
  const monthlyCost = clamp(Number(els.monthlyCost.value) || 0, 0, 1000000);
  const currentSetup = clamp(Number(els.currentSetup.value) || 0, 0, 1000000);
  const targetSetup = clamp(Number(els.targetSetup.value) || 0, 0, 1000000);
  const partners = clamp(Number(els.partnerCount.value) || 1, 1, 20);
  const monthlyContribution = monthlyRevenue - monthlyCost;
  const payback = setup => monthlyContribution > 0 ? setup / monthlyContribution : Infinity;
  const annualProfit = setup => (monthlyContribution * 12) - setup;
  return {
    monthlyRevenue, monthlyCost, currentSetup, targetSetup, partners, monthlyContribution,
    currentPayback: payback(currentSetup), targetPayback: payback(targetSetup),
    currentProfit: annualProfit(currentSetup), targetProfit: annualProfit(targetSetup),
    portfolioGain: (annualProfit(targetSetup) - annualProfit(currentSetup)) * partners
  };
}

function paybackText(value) {
  return Number.isFinite(value) ? `${value.toFixed(1)} months` : "No payback";
}

function linePath(points) {
  return points.map((point, index) => `${index ? "L" : "M"}${point[0].toFixed(1)} ${point[1].toFixed(1)}`).join(" ");
}

function renderChart(m) {
  const setup = selectedScenario === "current" ? m.currentSetup : m.targetSetup;
  const payback = selectedScenario === "current" ? m.currentPayback : m.targetPayback;
  const left = 54, right = 742, top = 22, bottom = 242;
  const maxValue = Math.max(m.monthlyRevenue * 12, setup + m.monthlyCost * 12, 1) * 1.08;
  const x = month => left + (month / 12) * (right - left);
  const y = value => bottom - (value / maxValue) * (bottom - top);
  const months = Array.from({ length: 13 }, (_, index) => index);
  const revenuePoints = months.map(month => [x(month), y(m.monthlyRevenue * month)]);
  const costPoints = months.map(month => [x(month), y(setup + m.monthlyCost * month)]);

  document.getElementById("revenueLine").setAttribute("d", linePath(revenuePoints));
  document.getElementById("costLine").setAttribute("d", linePath(costPoints));

  const area = document.getElementById("profitArea");
  if (Number.isFinite(payback) && payback < 12) {
    const start = clamp(payback, 0, 12);
    const areaMonths = [start, ...months.filter(month => month > start)];
    const upper = areaMonths.map(month => [x(month), y(m.monthlyRevenue * month)]);
    const lower = [...areaMonths].reverse().map(month => [x(month), y(setup + m.monthlyCost * month)]);
    area.setAttribute("d", `${linePath(upper)} ${linePath(lower).replace(/^M/, "L")} Z`);
  } else {
    area.setAttribute("d", "");
  }

  const markerMonth = Number.isFinite(payback) ? clamp(payback, 0, 12) : 12;
  const markerX = x(markerMonth);
  const markerY = y(m.monthlyRevenue * markerMonth);
  const paybackLine = document.getElementById("paybackLine");
  paybackLine.setAttribute("x1", markerX); paybackLine.setAttribute("x2", markerX);
  const paybackDot = document.getElementById("paybackDot");
  paybackDot.setAttribute("cx", markerX); paybackDot.setAttribute("cy", markerY);
  const label = document.getElementById("paybackLabel");
  label.setAttribute("x", markerX); label.setAttribute("y", 14);
  label.textContent = Number.isFinite(payback) && payback <= 12 ? `PAYBACK · ${payback.toFixed(1)} MONTHS` : "PAYBACK BEYOND YEAR ONE";
  const profitLabel = document.getElementById("profitLabel");
  profitLabel.setAttribute("x", x(9.4)); profitLabel.setAttribute("y", y(m.monthlyRevenue * 9.4) + 26);
  profitLabel.textContent = Number.isFinite(payback) && payback < 12 ? "CUMULATIVE PROFIT" : "";

  const grid = document.getElementById("chartGrid");
  grid.innerHTML = "";
  [0, 3, 6, 9, 12].forEach(month => {
    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    line.setAttribute("x1", x(month)); line.setAttribute("x2", x(month)); line.setAttribute("y1", top); line.setAttribute("y2", bottom);
    grid.appendChild(line);
    const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
    text.setAttribute("x", x(month)); text.setAttribute("y", 263); text.setAttribute("text-anchor", month === 0 ? "start" : month === 12 ? "end" : "middle");
    text.textContent = month === 0 ? "SIGNING" : `MONTH ${month}`;
    grid.appendChild(text);
  });
  [0, .5, 1].forEach(ratio => {
    const value = maxValue * ratio;
    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    line.setAttribute("x1", left); line.setAttribute("x2", right); line.setAttribute("y1", y(value)); line.setAttribute("y2", y(value));
    grid.appendChild(line);
    if (ratio > 0) {
      const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
      text.setAttribute("x", left - 7); text.setAttribute("y", y(value) + 3); text.setAttribute("text-anchor", "end"); text.textContent = money(value);
      grid.appendChild(text);
    }
  });
}

function updateModel() {
  const m = model();
  const activePayback = selectedScenario === "current" ? m.currentPayback : m.targetPayback;
  const activeProfit = selectedScenario === "current" ? m.currentProfit : m.targetProfit;
  document.getElementById("partnerCountOut").textContent = String(m.partners);
  document.getElementById("chartScenario").textContent = selectedScenario === "current" ? "Current integration model" : "More productized integration model";
  document.getElementById("paybackResult").textContent = paybackText(activePayback);
  document.getElementById("partnerProfit").textContent = money(activeProfit);
  document.getElementById("portfolioProfit").textContent = money(activeProfit * m.partners);
  document.getElementById("comparePayback").textContent = Number.isFinite(m.targetPayback) ? m.targetPayback.toFixed(1) : "n/a";
  document.getElementById("boardImpact").textContent = `${m.partners} partners generate ${money(m.portfolioGain)} more first-year contribution profit.`;
  renderChart(m);
}

[els.monthlyRevenue, els.monthlyCost, els.currentSetup, els.targetSetup, els.partnerCount].forEach(input => input.addEventListener("input", updateModel));
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
  sceneTrack.style.transform = `translate3d(-${sceneIndex * 100}vw, 0, 0)`;
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
  els.monthlyRevenue.value = 6000; els.monthlyCost.value = 2000; els.currentSetup.value = 18000; els.targetSetup.value = 10000; els.partnerCount.value = 6;
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
  event.preventDefault(); selectedAudience = panel.dataset.replayRoom;
  document.querySelector(`input[value="${selectedAudience}"]`).checked = true;
  syncAudienceCards(); goToScene(4);
}));

function storyBeats() {
  const m = model();
  const currentPayback = paybackText(m.currentPayback);
  const targetPayback = paybackText(m.targetPayback);
  if (selectedAudience === "team") return [
    ["CURRENT ECONOMICS", "Each B2B launch begins with catalogue ingestion, product mapping, branding and QA before recurring margin can build.", "The partner sees one experience. We carry all the work behind it."],
    ["FINANCIAL OPPORTUNITY", `Imagine bringing partner payback forward from ${currentPayback} to ${targetPayback} without reducing contract value. Across ${m.partners} new partners, that could add ${money(m.portfolioGain)} in first-year contribution.`, "Same client value. Less repeated work."],
    ["TARGET ECONOMICS", `Reducing integration cost from ${money(m.currentSetup)} to ${money(m.targetSetup)} adds ${money(m.targetProfit - m.currentProfit)} of first-year profit per partner.`, "The fastest route to margin is work we only do once."],
    ["CURRENT CONSTRAINT", "Partner-specific exceptions can quietly turn the reusable product back into a custom implementation.", "Every exception needs an economic reason."],
    ["TARGET ECONOMICS", "Standard catalogue intake, reusable mappings and a fixed QA gate shorten launch time while preserving the branded experience.", "Custom on the outside. Repeatable underneath."],
    ["DECISION REQUIRED", "I need us to map the integration workflow, name an owner for each delay and track hours, exceptions and payback on every launch.", "The next integration should cost less because this one happened."],
    ["EXPECTED BUSINESS IMPACT", `At ${m.partners} new partners, this path adds ${money(m.portfolioGain)} in first-year contribution. Let us commit to the integration work now.`, "The process becomes an asset we can reuse."]
  ];
  return [
    ["CURRENT ECONOMICS", "Each new B2B partner starts with a tailored catalogue integration before recurring economics can compound.", "The contracts can be attractive. The margin arrives later."],
    ["FINANCIAL OPPORTUNITY", `Imagine moving partner payback from ${currentPayback} to ${targetPayback} while keeping contract value. Across ${m.partners} new partners, that could add ${money(m.portfolioGain)} in first-year contribution.`, "Growth can reach profit sooner."],
    ["TARGET ECONOMICS", `Reusing catalogue intake, mapping and QA would cut integration cost by ${money(m.currentSetup - m.targetSetup)} per partner.`, "The tailored experience stays. The repeated work goes."],
    ["CURRENT CONSTRAINT", "White-glove implementation helps close partners, but unmanaged exceptions can reset the economics on every deal.", "B2B growth is not enough if delivery cost follows it."],
    ["TARGET ECONOMICS", `After payback, each partner produces ${money(m.monthlyContribution)} of recurring monthly contribution before central overhead.`, "This is where partner revenue starts compounding into profit."],
    ["DECISION REQUIRED", "I am asking you to back a six-month catalogue-integration program with a payback target below three months, and help us secure the next anchor retail partners.", "Give the team a financial target and enough volume to prove it."],
    ["EXPECTED BUSINESS IMPACT", `At ${m.partners} new partners, this path adds ${money(m.portfolioGain)} in first-year contribution. Please back the program that makes this repeatable.`, "More partners reach recurring margin sooner."]
  ];
}

const pathProgress = [.101, .19, .29, .46, .64, .765, 1];
const contourPath = document.getElementById("contourLive");
const contourLength = contourPath.getTotalLength();
contourPath.style.strokeDasharray = String(contourLength);
contourPath.style.strokeDashoffset = String(contourLength);

function renderBeat() {
  const beats = storyBeats();
  const beat = beats[beatIndex];
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
  document.getElementById("roomName").textContent = isBoard ? "Board" : "Integration team";
  document.getElementById("roomFocus").textContent = isBoard ? "Investment · risk · direction" : "Process · ownership · economics";
  document.getElementById("beatAudience").textContent = isBoard ? "BOARD" : "INTEGRATION TEAM";
  document.querySelectorAll("[data-room-panel]").forEach(panel => panel.classList.toggle("chosen-first", panel.dataset.roomPanel === selectedAudience));
  const dots = document.getElementById("beatDots");
  dots.innerHTML = "";
  storyBeats().forEach((_, index) => {
    const dot = document.createElement("button");
    dot.type = "button"; dot.className = "beat-dot"; dot.setAttribute("aria-label", `Show narrative step ${index + 1}`);
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
