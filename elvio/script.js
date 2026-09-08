/*
  Reusable prospect configuration.
  Future versions only need new copy/data here; the interaction stays intact.
*/
const EXPERIENCE = {
  prospect: "Marco Brizzolara",
  company: "Elvio Robotics",
  defaultCurrent: 90,
  defaultTarget: 60,
  bookingUrl: "https://calls.morety.uno/elvio"
};

const sceneNames = ["The premise", "The signal", "The business gap", "The audience", "The narrative", "Two rooms"];
const sceneTrack = document.getElementById("sceneTrack");
const experienceEl = document.getElementById("experience");
const scenes = [...document.querySelectorAll(".scene")];
const progressFill = document.getElementById("progressFill");
const progressCurrent = document.getElementById("progressCurrent");
const progressLabel = document.getElementById("progressLabel");
const sceneBack = document.getElementById("sceneBack");
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

let sceneIndex = 0;
let selectedAudience = "board";
let currentDays = EXPERIENCE.defaultCurrent;
let targetDays = EXPERIENCE.defaultTarget;
let beatIndex = 0;

// Focused controls live far along the untransformed flex track. Prevent the
// browser from horizontally scrolling the clipped viewport to reveal them.
experienceEl.addEventListener("scroll", () => {
  if (experienceEl.scrollLeft !== 0) experienceEl.scrollLeft = 0;
}, { passive: true });

document.querySelectorAll("[data-prospect]").forEach(el => el.textContent = EXPERIENCE.prospect.toUpperCase());
document.querySelectorAll("[data-company]").forEach(el => el.textContent = EXPERIENCE.company.toUpperCase());
document.querySelectorAll(".closing-cta").forEach(el => el.href = EXPERIENCE.bookingUrl);

function metrics() {
  const saved = Math.max(0, currentDays - targetDays);
  const reduction = currentDays > 0 ? Math.round((saved / currentDays) * 100) : 0;
  const currentCapacity = 365 / currentDays;
  const targetCapacity = 365 / targetDays;
  const capacityGain = Math.max(0, targetCapacity - currentCapacity);
  const additional = capacityGain >= 1 ? `about ${Math.round(capacityGain)}` : "up to 1";
  return { saved, reduction, currentCapacity, targetCapacity, additional };
}

function updateMetrics() {
  const { saved, reduction, currentCapacity, targetCapacity, additional } = metrics();
  document.querySelectorAll("[data-current]").forEach(el => el.textContent = currentDays);
  document.querySelectorAll("[data-target]").forEach(el => el.textContent = targetDays);
  document.querySelectorAll("[data-saved]").forEach(el => el.textContent = saved);
  document.querySelectorAll("[data-reduction]").forEach(el => el.textContent = reduction);
  document.querySelectorAll("[data-current-capacity]").forEach(el => el.textContent = currentCapacity.toFixed(1));
  document.querySelectorAll("[data-target-capacity]").forEach(el => el.textContent = targetCapacity.toFixed(1));
  document.querySelectorAll("[data-additional]").forEach(el => el.textContent = additional);
}

function goToScene(nextIndex) {
  const bounded = Math.max(0, Math.min(scenes.length - 1, nextIndex));
  if (bounded === sceneIndex && bounded !== 0) return;
  const previous = sceneIndex;
  sceneIndex = bounded;
  sceneTrack.style.transform = `translate3d(-${sceneIndex * 100}vw, 0, 0)`;
  experienceEl.scrollLeft = 0;
  scenes.forEach((scene, index) => {
    const active = index === sceneIndex;
    scene.classList.toggle("is-active", active);
    scene.inert = !active;
    scene.setAttribute("aria-hidden", String(!active));
    if (active) scene.scrollTop = 0;
  });
  progressFill.style.width = `${((sceneIndex + 1) / scenes.length) * 100}%`;
  progressCurrent.textContent = String(sceneIndex + 1).padStart(2, "0");
  progressLabel.textContent = sceneNames[sceneIndex];
  sceneBack.classList.toggle("is-visible", sceneIndex > 0);
  if (sceneIndex === 4 && previous !== 4) startStory();
  window.setTimeout(() => {
    const heading = scenes[sceneIndex].querySelector("h1, h2");
    if (heading && !reducedMotion) heading.setAttribute("tabindex", "-1");
  }, reducedMotion ? 0 : 800);
}

document.querySelectorAll("[data-next]").forEach(button => button.addEventListener("click", () => goToScene(sceneIndex + 1)));
sceneBack.addEventListener("click", () => goToScene(sceneIndex - 1));
document.getElementById("resetExperience").addEventListener("click", () => {
  currentDays = EXPERIENCE.defaultCurrent;
  targetDays = EXPERIENCE.defaultTarget;
  selectedAudience = "board";
  document.getElementById("currentDays").value = currentDays;
  document.getElementById("targetDays").value = targetDays;
  document.querySelector('input[value="board"]').checked = true;
  syncAudienceCards();
  updateMetrics();
  goToScene(0);
});

document.getElementById("numberForm").addEventListener("submit", event => {
  event.preventDefault();
  const current = Number(document.getElementById("currentDays").value);
  const target = Number(document.getElementById("targetDays").value);
  const error = document.getElementById("formError");
  if (!Number.isFinite(current) || !Number.isFinite(target) || current < 2 || target < 1) {
    error.textContent = "Enter two positive day values.";
    return;
  }
  if (target >= current) {
    error.textContent = "For this exercise, the target must be lower than the current cycle.";
    return;
  }
  error.textContent = "";
  currentDays = Math.round(current);
  targetDays = Math.round(target);
  updateMetrics();
  goToScene(2);
});

function syncAudienceCards() {
  document.querySelectorAll(".audience-card").forEach(card => {
    const input = card.querySelector("input");
    card.classList.toggle("is-selected", input.checked);
  });
}

document.querySelectorAll('input[name="audience"]').forEach(input => {
  input.addEventListener("change", () => {
    selectedAudience = input.value;
    syncAudienceCards();
  });
});

document.getElementById("audienceForm").addEventListener("submit", event => {
  event.preventDefault();
  selectedAudience = new FormData(event.currentTarget).get("audience") || "board";
  goToScene(4);
});

document.querySelectorAll("[data-replay-room]").forEach(panel => {
  panel.addEventListener("click", event => {
    event.preventDefault();
    selectedAudience = panel.dataset.replayRoom;
    const audienceInput = document.querySelector(`input[name="audience"][value="${selectedAudience}"]`);
    if (audienceInput) audienceInput.checked = true;
    syncAudienceCards();
    goToScene(4);
  });
});

function storyBeats() {
  const { saved, reduction, currentCapacity, targetCapacity, additional } = metrics();
  if (selectedAudience === "team") {
    return [
      ["WHAT IS", `Every day before reliable operation keeps the deployment team tied to the same site—today, ${currentDays} days.`, "We’re spending too long getting each site over the line."],
      ["THE BUSINESS GAP · CALL TO ADVENTURE", `What if we run a 30-day sprint to dissect every handoff from installation to acceptance—and rebuild the process around ${targetDays} days?`, "Let’s take one month and rebuild this properly."],
      ["WHAT IT COULD BE", `A shared protocol makes the ${saved}-day opportunity concrete: fewer waits, clearer ownership and earlier billing.`, "Less waiting. Clearer owners. Faster go-live."],
      ["WHAT IS", "Site-specific integrations, acceptance criteria and handovers keep pulling the work back into today’s cycle.", "The robot isn’t the only problem. The handoffs are."],
      ["WHAT IT COULD BE", "Standardize what repeats. Isolate the exceptions. Prove reliable operation against the same acceptance protocol every time.", "Repeat what works. Surface what doesn’t."],
      ["THE DECISION · CALL TO ACTION", "Map every handoff, rebuild the protocol, assign each delay an owner and test it on the next deployment.", "Find where the days disappear. Put a name next to each one."],
      ["BUSINESS OUTCOME · WHAT IT COULD BE", "Reliable operation becomes repeatable—and the same team creates capacity to activate more hospitals.", "Get good at this once. Then do it faster every time."]
    ];
  }
  return [
    ["WHAT IS", `Elvio carries deployment cost for ${currentDays} days before rental revenue begins.`, "We’re spending money. We’re not earning yet."],
    ["THE BUSINESS GAP · CALL TO ADVENTURE", `What if Elvio runs a 30-day sprint to dissect the full deployment process—and rebuilds its protocols around a ${targetDays}-day target?`, `${currentDays} days is too long. We can do better.`],
    ["WHAT IT COULD BE", `The exposure window becomes ${reduction}% shorter. Billing begins ${saved} days earlier on every deployment.`, `${saved} days back. Every deployment.`],
    ["WHAT IS", "Until acceptance, capital is committed while revenue and operational proof are still waiting.", "Every delay traps cash in a site that isn’t live."],
    ["WHAT IT COULD BE", `On a simple sequential basis, the same capacity moves from ${currentCapacity.toFixed(1)} to ${targetCapacity.toFixed(1)} deployment cycles a year.`, `Same team. Same capital. ${additional.charAt(0).toUpperCase() + additional.slice(1)} more deployments a year.`],
    ["THE DECISION · CALL TO ACTION", "Protect the sprint. Introduce hospital, integration and financing partners who can remove constraints.", "Give us the month—and help us clear the road."],
    ["BUSINESS OUTCOME · WHAT IT COULD BE", `If the new cycle holds, the same deployment capacity could unlock ${additional} additional deployments a year.`, "This is how we scale before adding more cost."]
  ];
}

// Draw to the end of the relevant plateau/turn—not through the next narrative state.
const pathProgress = [0.101, 0.19, 0.29, 0.46, 0.64, 0.765, 1];
const contourPath = document.getElementById("contourLive");
const contourLength = contourPath.getTotalLength();
contourPath.style.strokeDasharray = String(contourLength);
contourPath.style.strokeDashoffset = String(contourLength);
const beatNumber = document.getElementById("beatNumber");
const beatAudience = document.getElementById("beatAudience");
const beatFramework = document.getElementById("beatFramework");
const beatText = document.getElementById("beatText");
const beatThought = document.getElementById("beatThought");
const beatBack = document.getElementById("beatBack");
const beatNext = document.getElementById("beatNext");
const beatDots = document.getElementById("beatDots");

function renderBeat() {
  const beats = storyBeats();
  const beat = beats[beatIndex];
  beatNumber.textContent = `${String(beatIndex + 1).padStart(2, "0")} / ${String(beats.length).padStart(2, "0")}`;
  beatFramework.textContent = beat[0];
  beatText.animate?.([{ opacity: .15, transform: "translateY(5px)" }, { opacity: 1, transform: "translateY(0)" }], { duration: 350, easing: "ease-out" });
  beatThought.animate?.([{ opacity: 0 }, { opacity: 1 }], { duration: 420, easing: "ease-out" });
  beatText.textContent = beat[1];
  beatThought.textContent = beat[2];
  contourPath.style.strokeDashoffset = String(contourLength * (1 - pathProgress[beatIndex]));
  document.querySelector(".outcome-dot").style.opacity = beatIndex === beats.length - 1 ? "1" : "0";
  beatBack.disabled = beatIndex === 0;
  beatNext.innerHTML = beatIndex === beats.length - 1 ? 'Compare the rooms <span>→</span>' : 'Next contrast <span>→</span>';
  [...beatDots.children].forEach((dot, index) => dot.classList.toggle("is-active", index === beatIndex));
  requestAnimationFrame(() => { experienceEl.scrollLeft = 0; });
}

function startStory() {
  beatIndex = 0;
  const isBoard = selectedAudience === "board";
  document.getElementById("roomBadge").dataset.audience = selectedAudience;
  document.getElementById("roomName").textContent = isBoard ? "Board" : "Operations team";
  document.getElementById("roomFocus").textContent = isBoard ? "Risk · direction · trade-offs" : "Ownership · constraints · action";
  beatAudience.textContent = isBoard ? "BOARD" : "OPERATIONS TEAM";
  document.querySelectorAll("[data-room-panel]").forEach(panel => panel.classList.toggle("chosen-first", panel.dataset.roomPanel === selectedAudience));
  beatDots.innerHTML = "";
  storyBeats().forEach((_, index) => {
    const dot = document.createElement("button");
    dot.type = "button";
    dot.className = "beat-dot";
    dot.setAttribute("aria-label", `Show story beat ${index + 1}`);
    dot.addEventListener("click", () => { beatIndex = index; renderBeat(); });
    beatDots.appendChild(dot);
  });
  contourPath.style.strokeDashoffset = String(contourLength);
  requestAnimationFrame(() => requestAnimationFrame(renderBeat));
}

beatBack.addEventListener("click", () => {
  beatIndex = Math.max(0, beatIndex - 1);
  renderBeat();
});
beatNext.addEventListener("click", () => {
  if (beatIndex < storyBeats().length - 1) {
    beatIndex += 1;
    renderBeat();
  } else {
    goToScene(5);
  }
});

document.addEventListener("keydown", event => {
  if (event.key === "ArrowLeft" && sceneIndex !== 4) goToScene(sceneIndex - 1);
  if (event.key === "ArrowRight" && sceneIndex !== 1 && sceneIndex !== 3 && sceneIndex !== 4) goToScene(sceneIndex + 1);
});

let touchStartX = null;
document.addEventListener("touchstart", event => { touchStartX = event.touches[0].clientX; }, { passive: true });
document.addEventListener("touchend", event => {
  if (touchStartX === null || sceneIndex === 1 || sceneIndex === 3 || sceneIndex === 4) return;
  const delta = event.changedTouches[0].clientX - touchStartX;
  if (Math.abs(delta) > 70) goToScene(sceneIndex + (delta < 0 ? 1 : -1));
  touchStartX = null;
}, { passive: true });

updateMetrics();
syncAudienceCards();
goToScene(0);
