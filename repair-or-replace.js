'use strict';
const $=id=>document.getElementById(id);
const dollars=n=>new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',minimumFractionDigits:0,maximumFractionDigits:0}).format(Math.round(n/10)*10);
const models={"air2015":{"name":"2015 Intel Air","screen":399,"cable":null,"board":300,"value":[75,150]},"air2017":{"name":"2017 Intel Air","screen":399,"cable":null,"board":300,"value":[100,225]},"a1932-2018":{"name":"2018 Intel Air","screen":399,"cable":18.99,"board":350,"value":[175,300]},"a1932-2019":{"name":"2019 Intel Air","screen":399,"cable":18.99,"board":350,"value":[175,300]},"a2179":{"name":"2020 Intel Air","screen":399,"cable":14.99,"board":350,"value":[200,550]},"a2337":{"name":"2020 M1 Air","screen":399,"cable":14.99,"board":500,"value":[350,650]},"a2681":{"name":"2022 M2 Air","screen":467,"cable":0,"board":500,"value":[550,900]},"air2024":{"name":"2024 M3 Air","screen":467,"cable":0,"board":500,"value":[700,1050]},"air2025":{"name":"2025 M4 Air","screen":null,"cable":0,"board":500,"value":[700,1100]},"air2026":{"name":"2026 M5 Air","screen":null,"cable":0,"board":500,"value":[1000,1450]}};
function estimate(part,hours){return [part+99*hours[0],part+99*hours[1]];}
function cost(part,hours){const a=estimate(part,hours);return `${dollars(a[0])}–${dollars(a[1])}`;}
function rowsFor(m){return [
 {name:'Keyboard connector / cable check',price:m&&Number.isFinite(m.cable)?`${dollars(99)}–${dollars(198+m.cable)}`:'Quote needed',likelihood:'Check first',concern:'moderate'},
 {name:'Keyboard-only replacement',price:'$130–$380',likelihood:'Leading suspect',concern:'moderate'},
 {name:'Top case (includes keyboard)',price:m?cost(229,[1.5,3]):'Quote needed',likelihood:'Repair alternative',concern:'unranked'},
 {name:'Liquid cleaning / corrosion treatment',price:'$200',likelihood:'If liquid exposure',concern:'unranked'},
 {name:'Logic-board repair benchmark',price:m?dollars(m.board):'Quote needed',likelihood:'Possible, untested',concern:'more'},
 {name:'Screen / display assembly',price:m&&Number.isFinite(m.screen)?cost(m.screen,[1,2]):'Quote needed',likelihood:'No failure reported',concern:'slight'},
 {name:'Battery / charging assessment',price:m?cost(159.99,[0.5,1.5]):'Quote needed',likelihood:'No failure reported',concern:'slight'},
 {name:'Data recovery, if needed',price:'$330–$600',likelihood:'Depends on backup',concern:'unranked'}
];}
const concernLabels={more:'More long-term concern if damage is present',moderate:'Moderate long-term concern if damage is present',slight:'Slight long-term concern based on reported working function; not a safety clearance',unranked:'Conditional option, concern not ranked'};
function update(){const m=models[$('model').value];$('model-value').textContent=m?.value?`≈ ${m.value.map(n=>new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:0}).format(n)).join('–')}`:($('model').value===''?'Select a model':'Assessment needed');$('repair-rows').replaceChildren(...rowsFor(m).map((r,index)=>({...r,index})).sort((a,b)=>({more:0,moderate:1,slight:2,unranked:3}[a.concern]-{more:0,moderate:1,slight:2,unranked:3}[b.concern])||a.index-b.index).map(r=>{const row=document.createElement('tr');row.className=`concern-${r.concern}`;for(const [title,main,kind] of [['Part or repair',r.name,'part'],['Rough cost',r.price,'cost'],['What the symptoms suggest',r.likelihood,'likelihood']]){const cell=document.createElement('td');cell.dataset.label=title;cell.className=kind;const lead=document.createElement('strong');lead.textContent=main;cell.append(lead);if(kind==='likelihood'){const accessible=document.createElement('span');accessible.className='sr-only';accessible.textContent=`. ${concernLabels[r.concern]}.`;cell.append(accessible);}row.append(cell);}return row;}));}
function openPanel(name){document.querySelectorAll('[role=tabpanel]').forEach(p=>p.hidden=p.id!==`${name}-panel`);document.querySelectorAll('[role=tab]').forEach(t=>{const selected=t.dataset.panel===name;t.setAttribute('aria-selected',String(selected));t.tabIndex=selected?0:-1;});}
$('model').addEventListener('change',update);$('model').addEventListener('input',update);document.querySelectorAll('[role=tab]').forEach(t=>{t.addEventListener('click',()=>openPanel(t.dataset.panel));t.addEventListener('keydown',e=>{if(['ArrowLeft','ArrowRight','Home','End'].includes(e.key)){e.preventDefault();const tabs=[...document.querySelectorAll('[role=tab]')],i=tabs.indexOf(t),next=e.key==='Home'?0:e.key==='End'?tabs.length-1:(i+(e.key==='ArrowRight'?1:-1)+tabs.length)%tabs.length;openPanel(tabs[next].dataset.panel);tabs[next].focus();}});});window.LaptopGuide={models,estimate,rowsFor};update();

// Use the standard website menu behavior.
(() => {
  const toggles = document.querySelectorAll(".nav-menu-toggle");

  toggles.forEach((toggle) => {
    const navigation = toggle.closest(".primary-site-nav");
    if (!navigation) return;

    const closeMenu = () => {
      navigation.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");
    };

    toggle.addEventListener("click", () => {
      const willOpen = !navigation.classList.contains("is-open");
      navigation.classList.toggle("is-open", willOpen);
      toggle.setAttribute("aria-expanded", String(willOpen));
    });

    navigation.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", closeMenu);
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        closeMenu();
        toggle.focus();
      }
    });

    window.addEventListener("resize", () => {
      if (window.innerWidth >= 820) closeMenu();
    });
  });

})();
