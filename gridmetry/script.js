const sceneNames = ["The premise","Operating proof","Repayment model","The capital partner","The narrative","The decision","The method"];
const track = document.getElementById("sceneTrack");
const scenes = [...document.querySelectorAll(".scene")];
const fields = Object.fromEntries(["mw","cost","cash","debtShare","interest","term"].map(id => [id,document.getElementById(id)]));
const defaults = {mw:10,cost:450000,cash:130000,debtShare:70,interest:9,term:5};
let sceneIndex = 0, beatIndex = 0, selectedScenario = "base";
const clamp = (n,min,max) => Math.min(max,Math.max(min,n));
const euro = n => {const abs=Math.abs(n), sign=n<0?"−":"";return `${sign}€${(abs>=1000000?(abs/1000000).toFixed(2)+"m":abs>=1000?(abs/1000).toFixed(0)+"k":abs.toFixed(0))}`;};
const decimal = n => new Intl.NumberFormat("en",{minimumFractionDigits:2,maximumFractionDigits:2}).format(n);

function readModel(){
  const mw=clamp(Number(fields.mw.value)||0,1,1000),cost=clamp(Number(fields.cost.value)||0,1,10000000),cash=clamp(Number(fields.cash.value)||0,0,10000000),share=clamp(Number(fields.debtShare.value)||0,1,100)/100,rate=clamp(Number(fields.interest.value)||0,0,50)/100,term=clamp(Number(fields.term.value)||0,1,30);
  const capex=mw*cost,loan=capex*share,annualPayment=rate===0?loan/term:loan*rate/(1-Math.pow(1+rate,-term)),baseCash=mw*cash,available=baseCash*(selectedScenario==="downside"?.75:1),coverage=available/annualPayment,headroom=available-annualPayment;
  return {mw,cost,cash,share,rate,term,capex,loan,annualPayment,baseCash,available,coverage,headroom};
}
function renderModel(){
  const m=readModel();
  document.getElementById("coverageValue").textContent=`${decimal(m.coverage)}×`;
  document.getElementById("coverageExplanation").textContent=`€${decimal(m.coverage)} available for each €1 due.`;
  document.getElementById("cashTotal").textContent=euro(m.available);
  document.getElementById("annualPayment").textContent=euro(m.annualPayment);
  document.getElementById("loanAmount").textContent=euro(m.loan);
  document.getElementById("headroom").textContent=euro(m.headroom);
  const scale=Math.max(m.available,m.annualPayment,1);
  document.getElementById("cashBar").style.width=`${m.available/scale*100}%`;
  document.getElementById("debtBar").style.width=`${m.annualPayment/scale*100}%`;
  document.getElementById("modelTakeaway").textContent=m.coverage>=1?`The ${selectedScenario==="downside"?"lower-income":"base"} case covers the annual payment, subject to real contracts and verified project costs.`:`The ${selectedScenario==="downside"?"lower-income":"base"} case does not cover the annual payment. The terms or project economics would need to change.`;
}
function showScene(index){
  const next=clamp(index,0,scenes.length-1);if(next===sceneIndex&&next!==0)return;
  const previous=sceneIndex;sceneIndex=next;track.style.transform=`translate3d(-${sceneIndex*100}vw,0,0)`;
  scenes.forEach((scene,i)=>{const active=i===sceneIndex;scene.classList.toggle("is-active",active);scene.inert=!active;scene.setAttribute("aria-hidden",String(!active));if(active)scene.scrollTop=0;});
  document.getElementById("progressFill").style.width=`${(sceneIndex+1)/scenes.length*100}%`;
  document.getElementById("progressCurrent").textContent=String(sceneIndex+1).padStart(2,"0");
  document.getElementById("progressLabel").textContent=sceneNames[sceneIndex];
  document.getElementById("sceneBack").classList.toggle("is-visible",sceneIndex>0);
  if(sceneIndex===2)renderModel();if(sceneIndex===4&&previous!==4)startStory();
}
document.querySelectorAll("[data-next]").forEach(button=>button.addEventListener("click",()=>showScene(sceneIndex+1)));
document.getElementById("sceneBack").addEventListener("click",()=>showScene(sceneIndex-1));
document.getElementById("resetExperience").addEventListener("click",()=>{Object.entries(defaults).forEach(([id,value])=>fields[id].value=value);selectedScenario="base";document.querySelectorAll("[data-scenario]").forEach(button=>button.classList.toggle("is-active",button.dataset.scenario==="base"));renderModel();showScene(0);});
Object.values(fields).forEach(field=>field.addEventListener("input",renderModel));
document.querySelectorAll("[data-scenario]").forEach(button=>button.addEventListener("click",()=>{selectedScenario=button.dataset.scenario;document.querySelectorAll("[data-scenario]").forEach(item=>item.classList.toggle("is-active",item===button));renderModel();}));

function storyBeats(){
  const m=readModel(),weak=m.baseCash*.75,weakCoverage=weak/m.annualPayment;
  return [
    ["WHAT IS","Gridmetry reports 62 MW of Gridboxes live in Sweden. We can show real settlements, costs and operating performance.","We have more than a technical concept."],
    ["FINANCIAL OPPORTUNITY",`If ${m.mw} more MW produced ${euro(m.cash)} of annual cash available for debt per MW, the portfolio could provide ${euro(m.baseCash)} each year to support expansion and repayment.`,"Now the next deployments have an economic purpose."],
    ["THE GAP","Those deployments need capital before they can earn. Live results from one market do not guarantee the same cash in another site or year.","This is the risk the financing case must answer."],
    ["WHAT IS",`At these terms, ${euro(m.loan)} of debt needs about ${euro(m.annualPayment)} in annual principal and interest. We must test the cash after energy, operations and every contractual share.`,"Project cash, not gross market revenue, pays the lender."],
    ["WHAT COULD BE",`At the base assumption, coverage is ${decimal(m.baseCash/m.annualPayment)}×. If cash falls 25%, it is ${decimal(weakCoverage)}×. Our real project data can show where that margin holds and where it does not.`,"A weaker case makes the financing limits visible."],
    ["DECISION REQUIRED","I am asking you to define financing criteria with us, review the first eligible projects and agree terms for the capacity that passes those tests.","Your capital and discipline can make the next MW possible."],
    ["BUSINESS OUTCOME",`If verified projects can support ${euro(m.annualPayment)} of annual debt payments at the agreed downside threshold, we could finance ${m.mw} more MW without treating projected market income as certain. Let us start with the project review.`,"A clear decision turns operating proof into a fundable portfolio."]
  ];
}
const contour=document.getElementById("contourLive"),contourLength=contour.getTotalLength(),pathProgress=[.1,.19,.29,.46,.64,.765,1];
contour.style.strokeDasharray=String(contourLength);contour.style.strokeDashoffset=String(contourLength);
function renderBeat(){
  const beat=storyBeats()[beatIndex];document.getElementById("beatNumber").textContent=`${String(beatIndex+1).padStart(2,"0")} / 07`;document.getElementById("beatFramework").textContent=beat[0];document.getElementById("beatText").textContent=beat[1];document.getElementById("beatThought").textContent=beat[2];contour.style.strokeDashoffset=String(contourLength*(1-pathProgress[beatIndex]));document.querySelector(".outcome-dot").style.opacity=beatIndex===6?"1":"0";document.getElementById("beatBack").disabled=beatIndex===0;document.getElementById("beatNext").innerHTML=beatIndex===6?'See the decision <span>→</span>':'Next contrast <span>→</span>';[...document.getElementById("beatDots").children].forEach((dot,i)=>dot.classList.toggle("is-active",i===beatIndex));
}
function startStory(){beatIndex=0;const dots=document.getElementById("beatDots");dots.innerHTML="";storyBeats().forEach((_,i)=>{const dot=document.createElement("button");dot.type="button";dot.className="beat-dot";dot.setAttribute("aria-label",`Show narrative step ${i+1}`);dot.addEventListener("click",()=>{beatIndex=i;renderBeat();});dots.appendChild(dot);});contour.style.strokeDashoffset=String(contourLength);requestAnimationFrame(()=>requestAnimationFrame(renderBeat));}
document.getElementById("beatBack").addEventListener("click",()=>{beatIndex=Math.max(0,beatIndex-1);renderBeat();});
document.getElementById("beatNext").addEventListener("click",()=>{if(beatIndex<6){beatIndex++;renderBeat();}else showScene(5);});
document.getElementById("replayNarrative").addEventListener("click",()=>showScene(4));
document.addEventListener("keydown",event=>{if(event.key==="ArrowLeft"&&sceneIndex!==4)showScene(sceneIndex-1);if(event.key==="ArrowRight"&&![2,4].includes(sceneIndex))showScene(sceneIndex+1);});
let touchX=null;document.addEventListener("touchstart",event=>{touchX=event.touches[0].clientX;},{passive:true});document.addEventListener("touchend",event=>{if(touchX===null||[2,4].includes(sceneIndex))return;const delta=event.changedTouches[0].clientX-touchX;if(Math.abs(delta)>70)showScene(sceneIndex+(delta<0?1:-1));touchX=null;},{passive:true});
renderModel();showScene(0);
