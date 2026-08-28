const header=document.querySelector('.site-header');
const menuToggle=document.querySelector('.menu-toggle');
const navLinks=document.querySelectorAll('.nav-links a');
const heroSection=document.querySelector('.hero-scroll');
const heroVideo=document.getElementById('hero-video');
const progressBar=document.getElementById('hero-progress-bar');
const prefersReduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const updateHeader=()=>header.classList.toggle('scrolled',window.scrollY>28);
updateHeader();
window.addEventListener('scroll',updateHeader,{passive:true});

menuToggle?.addEventListener('click',()=>{
  const open=header.classList.toggle('menu-open');
  menuToggle.setAttribute('aria-expanded',String(open));
});
navLinks.forEach(link=>link.addEventListener('click',()=>header.classList.remove('menu-open')));

function clamp(n,min,max){return Math.min(max,Math.max(min,n));}

let heroTargetProgress=0;
let heroVisualProgress=0;
let heroTargetTime=0;
let heroVirtualTime=0;
let heroDuration=0;
let heroRaf=0;
let lastHeroSeek=0;

function measureHeroProgress(){
  if(!heroSection) return 0;
  const rect=heroSection.getBoundingClientRect();
  const total=Math.max(heroSection.offsetHeight-window.innerHeight,1);
  return clamp((-rect.top)/total,0,1);
}

function updateHeroTarget(){
  heroTargetProgress=measureHeroProgress();
  if(heroDuration){
    heroTargetTime=heroTargetProgress*heroDuration;
  }
  if(!heroRaf){
    heroRaf=requestAnimationFrame(animateHeroScrub);
  }
}

function animateHeroScrub(now){
  // Smooth the visual progress and the video time independently.
  heroVisualProgress += (heroTargetProgress-heroVisualProgress)*0.08;
  document.documentElement.style.setProperty('--hero-progress',heroVisualProgress.toFixed(4));
  if(progressBar) progressBar.style.height=`${heroVisualProgress*100}%`;

  if(heroVideo && heroDuration && !prefersReduced){
    heroVirtualTime += (heroTargetTime-heroVirtualTime)*0.10;

    // Limit currentTime writes to about 30 fps to avoid browser seek thrashing.
    if(now-lastHeroSeek>30){
      const nextTime=clamp(heroVirtualTime,0,Math.max(heroDuration-.015,0));
      if(Math.abs(heroVideo.currentTime-nextTime)>.012){
        heroVideo.currentTime=nextTime;
      }
      lastHeroSeek=now;
    }
  }

  const progressMoving=Math.abs(heroTargetProgress-heroVisualProgress)>.0007;
  const timeMoving=heroDuration && Math.abs(heroTargetTime-heroVirtualTime)>.006;

  if(progressMoving || timeMoving){
    heroRaf=requestAnimationFrame(animateHeroScrub);
  }else{
    heroVisualProgress=heroTargetProgress;
    heroVirtualTime=heroTargetTime;
    document.documentElement.style.setProperty('--hero-progress',heroVisualProgress.toFixed(4));
    if(progressBar) progressBar.style.height=`${heroVisualProgress*100}%`;
    heroRaf=0;
  }
}

if(heroVideo){
  heroVideo.pause();
  heroVideo.muted=true;
  heroVideo.addEventListener('loadedmetadata',()=>{
    heroDuration=heroVideo.duration||0;
    heroTargetProgress=measureHeroProgress();
    heroVisualProgress=heroTargetProgress;
    heroTargetTime=heroTargetProgress*heroDuration;
    heroVirtualTime=heroTargetTime;
    heroVideo.currentTime=heroVirtualTime;
    document.documentElement.style.setProperty('--hero-progress',heroVisualProgress.toFixed(4));
    if(progressBar) progressBar.style.height=`${heroVisualProgress*100}%`;
  },{once:true});
}

updateHeroTarget();
window.addEventListener('scroll',updateHeroTarget,{passive:true});
window.addEventListener('resize',updateHeroTarget);

const reveals=document.querySelectorAll('.reveal');
const observer=new IntersectionObserver((entries)=>{
  entries.forEach(entry=>{
    if(entry.isIntersecting){
      entry.target.classList.add('in');
      observer.unobserve(entry.target);
    }
  });
},{threshold:.14});
reveals.forEach(el=>observer.observe(el));

const range=document.querySelector('[data-range]');
const after=document.querySelector('[data-after]');
const line=document.querySelector('[data-line]');
const updateCompare=(value)=>{
  const v=clamp(+value,0,100);
  const clip=100-v;
  if(after) after.style.clipPath=`inset(0 ${clip}% 0 0)`;
  if(line) line.style.left=`${v}%`;
};
range?.addEventListener('input',e=>updateCompare(e.target.value));
if(range) updateCompare(range.value);

document.getElementById('year').textContent=new Date().getFullYear();

const form=document.getElementById('whatsapp-form');
form?.addEventListener('submit',(e)=>{
  e.preventDefault();
  const fd=new FormData(form);
  const nome=(fd.get('nome')||'').toString().trim();
  const imovel=(fd.get('imovel')||'').toString().trim();
  const mensagem=(fd.get('mensagem')||'').toString().trim();
  const text=`Olá RENOVA CAMP!%0A%0A`+
    `Nome: ${encodeURIComponent(nome)}%0A`+
    `Tipo de imóvel: ${encodeURIComponent(imovel)}%0A`+
    `Necessidade: ${encodeURIComponent(mensagem)}`;
  window.open(`https://wa.me/5519971111058?text=${text}`,'_blank');
});


// =========================================================
// SERVIÇOS — vídeo + descrições controlados por scroll
// =========================================================
const servicesSection=document.querySelector('.services-scroll');
const servicesVideo=document.getElementById('services-video');
const servicesCopies=[...document.querySelectorAll('[data-service-copy]')];
const servicesProgressBar=document.getElementById('services-progress-bar');

let servicesTargetProgress=0;
let servicesVisualProgress=0;
let servicesTargetTime=0;
let servicesVirtualTime=0;
let servicesDuration=0;
let servicesRaf=0;
let lastServicesSeek=0;
let activeServiceIndex=-999;

function measureServicesProgress(){
  if(!servicesSection) return 0;
  const rect=servicesSection.getBoundingClientRect();
  const total=Math.max(servicesSection.offsetHeight-window.innerHeight,1);
  return clamp((-rect.top)/total,0,1);
}

// The video intentionally moves faster during the folder/page transitions
// and much slower while each group of six services is visible.
function servicesTimeFromProgress(progress){
  const p=clamp(progress,0,1);
  if(!servicesDuration) return 0;

  const end=Math.max(servicesDuration-.02,0);

  // 0–14%: pasta fechada → primeira página aberta
  if(p<=.14){
    return (p/.14)*Math.min(5.5,end);
  }

  // 14–54%: primeiros 6 serviços visíveis
  if(p<=.54){
    const start=Math.min(5.5,end);
    const finish=Math.min(9.7,end);
    return start+((p-.14)/.40)*(finish-start);
  }

  // 54–70%: virada da página
  if(p<=.70){
    const start=Math.min(9.7,end);
    const finish=Math.min(13.5,end);
    return start+((p-.54)/.16)*(finish-start);
  }

  // 70–94%: últimos 6 serviços visíveis
  if(p<=.94){
    const start=Math.min(13.5,end);
    const finish=Math.max(end-.20,start);
    return start+((p-.70)/.24)*(finish-start);
  }

  // 94–100%: segura praticamente o último frame para o CTA final
  const holdStart=Math.max(end-.20,0);
  return holdStart+((p-.94)/.06)*(end-holdStart);
}

function serviceIndexFromProgress(progress){
  const p=clamp(progress,0,1);

  // Abertura da pasta: texto institucional.
  if(p<.14) return -1;

  // Primeiros 6 serviços.
  if(p<.54){
    return Math.min(5,Math.floor(((p-.14)/.40)*6));
  }

  // Durante a virada da página, mantém o sexto serviço.
  if(p<.70) return 5;

  // Últimos 6 serviços.
  if(p<.94){
    return Math.min(11,6+Math.floor(((p-.70)/.24)*6));
  }

  // Encerramento da seção: CTA final.
  return 12;
}

function setActiveService(index){
  if(index===activeServiceIndex) return;
  activeServiceIndex=index;

  servicesCopies.forEach(item=>{
    item.classList.toggle('active',Number(item.dataset.serviceCopy)===index);
  });
}

function updateServicesTarget(){
  if(!servicesSection) return;
  servicesTargetProgress=measureServicesProgress();
  servicesTargetTime=servicesTimeFromProgress(servicesTargetProgress);
  setActiveService(serviceIndexFromProgress(servicesTargetProgress));

  if(!servicesRaf){
    servicesRaf=requestAnimationFrame(animateServicesScrub);
  }
}

function animateServicesScrub(now){
  servicesVisualProgress+=(servicesTargetProgress-servicesVisualProgress)*.10;

  if(servicesProgressBar){
    servicesProgressBar.style.height=`${servicesVisualProgress*100}%`;
  }

  if(servicesVideo && servicesDuration && !prefersReduced){
    servicesVirtualTime+=(servicesTargetTime-servicesVirtualTime)*.14;

    if(now-lastServicesSeek>30){
      const nextTime=clamp(servicesVirtualTime,0,Math.max(servicesDuration-.02,0));
      if(Math.abs(servicesVideo.currentTime-nextTime)>.012){
        servicesVideo.currentTime=nextTime;
      }
      lastServicesSeek=now;
    }
  }

  const progressMoving=Math.abs(servicesTargetProgress-servicesVisualProgress)>.0007;
  const timeMoving=servicesDuration && Math.abs(servicesTargetTime-servicesVirtualTime)>.007;

  if(progressMoving || timeMoving){
    servicesRaf=requestAnimationFrame(animateServicesScrub);
  }else{
    servicesVisualProgress=servicesTargetProgress;
    servicesVirtualTime=servicesTargetTime;
    if(servicesProgressBar){
      servicesProgressBar.style.height=`${servicesVisualProgress*100}%`;
    }
    servicesRaf=0;
  }
}

if(servicesVideo){
  servicesVideo.pause();
  servicesVideo.muted=true;
  servicesVideo.addEventListener('loadedmetadata',()=>{
    servicesDuration=servicesVideo.duration||0;
    servicesTargetProgress=measureServicesProgress();
    servicesVisualProgress=servicesTargetProgress;
    servicesTargetTime=servicesTimeFromProgress(servicesTargetProgress);
    servicesVirtualTime=servicesTargetTime;
    servicesVideo.currentTime=servicesVirtualTime;
    setActiveService(serviceIndexFromProgress(servicesTargetProgress));
    if(servicesProgressBar){
      servicesProgressBar.style.height=`${servicesVisualProgress*100}%`;
    }
  },{once:true});
}

updateServicesTarget();
window.addEventListener('scroll',updateServicesTarget,{passive:true});
window.addEventListener('resize',updateServicesTarget);

// Hero: muda o indicador ANTES/DEPOIS quando 40% da transformação já foi percorrida
const heroPhaseLabel=document.getElementById('hero-phase-label');

function updateHeroPhaseLabel(){
  if(!heroPhaseLabel) return;
  const p=typeof heroTargetProgress==='number' ? heroTargetProgress : 0;
  heroPhaseLabel.textContent=p>=0.20?'DEPOIS':'ANTES';
}

window.addEventListener('scroll',updateHeroPhaseLabel,{passive:true});
window.addEventListener('resize',updateHeroPhaseLabel);
updateHeroPhaseLabel();
