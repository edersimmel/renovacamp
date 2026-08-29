const header=document.querySelector('.site-header');
const menuToggle=document.querySelector('.menu-toggle');
const navLinks=document.querySelectorAll('.nav-links a');
const heroSection=document.querySelector('.hero-scroll');
const heroVideo=document.getElementById('hero-video');
const progressBar=document.getElementById('hero-progress-bar');
const prefersReduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const isMobileViewport=window.matchMedia('(max-width: 900px)');

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
  const rawProgress=measureHeroProgress();

  // Mobile agora usa progresso linear. A velocidade é controlada pela
  // distância maior da seção, evitando aceleração no fim do gesto.
  heroTargetProgress=rawProgress;

  if(heroDuration){
    heroTargetTime=heroTargetProgress*heroDuration;
  }
  if(!heroRaf){
    heroRaf=requestAnimationFrame(animateHeroScrub);
  }
}

function animateHeroScrub(now){
  // Mobile usa uma interpolação bem mais lenta para impedir que
  // um único swipe avance vários segundos do vídeo.
  const visualEase=isMobileViewport.matches ? 0.045 : 0.08;
  const videoEase=isMobileViewport.matches ? 0.055 : 0.10;

  heroVisualProgress += (heroTargetProgress-heroVisualProgress)*visualEase;
  document.documentElement.style.setProperty('--hero-progress',heroVisualProgress.toFixed(4));
  if(progressBar) progressBar.style.height=`${heroVisualProgress*100}%`;

  if(heroVideo && heroDuration){
    heroVirtualTime += (heroTargetTime-heroVirtualTime)*videoEase;

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

function initHeroVideo(){
  if(!heroVideo) return;

  const duration=Number(heroVideo.duration);
  if(!Number.isFinite(duration) || duration<=0) return;

  heroDuration=duration;
  heroTargetProgress=measureHeroProgress();
  heroVisualProgress=heroTargetProgress;
  heroTargetTime=heroTargetProgress*heroDuration;
  heroVirtualTime=heroTargetTime;

  try{
    heroVideo.currentTime=clamp(heroVirtualTime,0,Math.max(heroDuration-.015,0));
  }catch(e){}

  document.documentElement.style.setProperty('--hero-progress',heroVisualProgress.toFixed(4));
  if(progressBar) progressBar.style.height=`${heroVisualProgress*100}%`;

  // Garante que o scrub seja retomado mesmo se loadedmetadata
  // tiver ocorrido antes do script ser executado.
  updateHeroTarget();
}

if(heroVideo){
  heroVideo.pause();
  heroVideo.muted=true;
  heroVideo.playsInline=true;

  if(heroVideo.readyState>=1 && Number.isFinite(heroVideo.duration) && heroVideo.duration>0){
    initHeroVideo();
  }else{
    heroVideo.addEventListener('loadedmetadata',initHeroVideo,{once:true});
    heroVideo.addEventListener('durationchange',initHeroVideo,{once:true});
    try{ heroVideo.load(); }catch(e){}
  }
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
// SERVIÇOS — desktop por vídeo / mobile por sequência de frames
// =========================================================
const servicesSection=document.querySelector('.services-scroll');
const servicesVideo=document.getElementById('services-video');
const servicesCanvas=document.getElementById('services-mobile-canvas');
const servicesCanvasCtx=servicesCanvas?.getContext('2d');
const servicesCopies=[...document.querySelectorAll('[data-service-copy]')];
const servicesProgressBar=document.getElementById('services-progress-bar');
const isMobileServices=window.matchMedia('(max-width: 900px)');

const SERVICES_MOBILE_FRAME_COUNT=96;
const SERVICES_MOBILE_FRAME_PATH=(n)=>`assets/services-mobile-frames/frame-${String(n).padStart(3,'0')}.webp`;

let servicesDuration=16;
let servicesProgress=0;
let servicesRaf=0;
let activeServiceIndex=-999;
let servicesFramesStarted=false;
let currentServicesFrame=-1;
const servicesFrames=new Array(SERVICES_MOBILE_FRAME_COUNT+1);

function measureServicesProgress(){
  if(!servicesSection) return 0;
  const rect=servicesSection.getBoundingClientRect();
  const total=Math.max(servicesSection.offsetHeight-window.innerHeight,1);
  return clamp((-rect.top)/total,0,1);
}

function servicesTimeFromProgress(progress){
  const p=clamp(progress,0,1);
  const duration=Math.max(servicesDuration||16,0);
  const end=Math.max(duration-.04,0);

  if(p<=.14) return (p/.14)*Math.min(5.5,end);

  if(p<=.54){
    const a=Math.min(5.5,end);
    const b=Math.min(9.7,end);
    return a+((p-.14)/.40)*(b-a);
  }

  if(p<=.70){
    const a=Math.min(9.7,end);
    const b=Math.min(13.5,end);
    return a+((p-.54)/.16)*(b-a);
  }

  if(p<=.94){
    const a=Math.min(13.5,end);
    const b=Math.max(end-.20,a);
    return a+((p-.70)/.24)*(b-a);
  }

  const hold=Math.max(end-.20,0);
  return hold+((p-.94)/.06)*(end-hold);
}

function serviceIndexFromProgress(progress){
  const p=clamp(progress,0,1);
  if(p<.14) return -1;
  if(p<.54) return Math.min(5,Math.floor(((p-.14)/.40)*6));
  if(p<.70) return 5;
  if(p<.94) return Math.min(11,6+Math.floor(((p-.70)/.24)*6));
  return 12;
}

function setActiveService(index){
  if(index===activeServiceIndex) return;
  activeServiceIndex=index;

  servicesCopies.forEach(item=>{
    item.classList.toggle('active',Number(item.dataset.serviceCopy)===index);
  });
}

function drawServicesFrame(frameNumber){
  if(!servicesCanvasCtx || !servicesCanvas) return;

  const n=clamp(Math.round(frameNumber),1,SERVICES_MOBILE_FRAME_COUNT);
  const img=servicesFrames[n];

  if(img?.complete && img.naturalWidth){
    if(currentServicesFrame===n) return;
    currentServicesFrame=n;

    servicesCanvasCtx.clearRect(0,0,servicesCanvas.width,servicesCanvas.height);
    servicesCanvasCtx.drawImage(img,0,0,servicesCanvas.width,servicesCanvas.height);
    return;
  }

  // Garante que o frame solicitado tenha prioridade.
  loadServicesFrame(n,true);
}

function loadServicesFrame(n,priority=false){
  if(n<1 || n>SERVICES_MOBILE_FRAME_COUNT) return;
  if(servicesFrames[n]) return;

  const img=new Image();
  servicesFrames[n]=img;
  img.decoding='async';
  img.src=SERVICES_MOBILE_FRAME_PATH(n);

  img.onload=()=>{
    const target=1+Math.round(servicesProgress*(SERVICES_MOBILE_FRAME_COUNT-1));
    if(n===target || priority){
      drawServicesFrame(target);
    }
  };
}

function preloadServicesFrames(){
  if(servicesFramesStarted || !isMobileServices.matches) return;
  servicesFramesStarted=true;

  // Primeiros frames imediatos para a entrada da seção.
  for(let n=1;n<=12;n++) loadServicesFrame(n);

  // O restante entra gradualmente para não travar a rede do celular.
  let n=13;
  const batch=()=>{
    const end=Math.min(n+9,SERVICES_MOBILE_FRAME_COUNT+1);
    for(;n<end;n++) loadServicesFrame(n);
    if(n<=SERVICES_MOBILE_FRAME_COUNT){
      setTimeout(batch,70);
    }
  };
  setTimeout(batch,80);
}

function renderServicesScroll(){
  servicesRaf=0;
  if(!servicesSection) return;

  servicesProgress=measureServicesProgress();

  if(servicesProgressBar){
    servicesProgressBar.style.height=`${servicesProgress*100}%`;
  }

  setActiveService(serviceIndexFromProgress(servicesProgress));

  if(isMobileServices.matches){
    preloadServicesFrames();
    const frame=1+servicesProgress*(SERVICES_MOBILE_FRAME_COUNT-1);
    drawServicesFrame(frame);
    return;
  }

  // Desktop continua usando o MP4 porque já está funcionando corretamente.
  if(servicesVideo && servicesVideo.readyState>=1){
    const t=servicesTimeFromProgress(servicesProgress);
    try{
      if(Math.abs(servicesVideo.currentTime-t)>.01){
        servicesVideo.currentTime=t;
      }
    }catch(e){}
  }
}

function updateServicesTarget(){
  if(!servicesRaf){
    servicesRaf=requestAnimationFrame(renderServicesScroll);
  }
}

function initServicesVideo(){
  if(!servicesVideo || isMobileServices.matches) return;

  servicesVideo.muted=true;
  servicesVideo.playsInline=true;
  servicesVideo.pause();

  const d=Number(servicesVideo.duration);
  if(Number.isFinite(d) && d>0){
    servicesDuration=d;
  }

  renderServicesScroll();
}

if(servicesVideo){
  servicesVideo.muted=true;
  servicesVideo.playsInline=true;
  servicesVideo.setAttribute('playsinline','');
  servicesVideo.setAttribute('webkit-playsinline','');
  servicesVideo.preload=isMobileServices.matches ? 'none' : 'metadata';

  if(!isMobileServices.matches){
    servicesVideo.addEventListener('loadedmetadata',initServicesVideo);
    servicesVideo.addEventListener('canplay',initServicesVideo,{once:true});

    if(servicesVideo.readyState>=1){
      initServicesVideo();
    }else{
      try{ servicesVideo.load(); }catch(e){}
    }
  }
}

if(servicesSection && 'IntersectionObserver' in window){
  const servicesWarmup=new IntersectionObserver((entries)=>{
    if(entries.some(entry=>entry.isIntersecting)){
      if(isMobileServices.matches){
        preloadServicesFrames();
      }else if(servicesVideo && servicesVideo.readyState===0){
        try{ servicesVideo.load(); }catch(e){}
      }
      servicesWarmup.disconnect();
    }
  },{rootMargin:'160% 0px'});
  servicesWarmup.observe(servicesSection);
}

renderServicesScroll();
window.addEventListener('scroll',updateServicesTarget,{passive:true});
window.addEventListener('resize',updateServicesTarget);

// Hero: muda o indicador ANTES/DEPOIS quando 40% da transformação já foi percorrida
const heroPhaseLabel=document.getElementById('hero-phase-label');

function updateHeroPhaseLabel(){
  if(!heroPhaseLabel) return;
  const p=typeof heroTargetProgress==='number' ? heroTargetProgress : 0;
  heroPhaseLabel.textContent=p>=0.40?'DEPOIS':'ANTES';
}

window.addEventListener('scroll',updateHeroPhaseLabel,{passive:true});
window.addEventListener('resize',updateHeroPhaseLabel);
updateHeroPhaseLabel();


// =========================================================
// MOBILE — desbloqueio dos vídeos controlados por scroll
// iOS/Safari pode bloquear seek de vídeo até a primeira interação.
// =========================================================
let scrollVideosUnlocked=false;

function unlockScrollVideos(){
  if(scrollVideosUnlocked) return;
  scrollVideosUnlocked=true;

  [heroVideo].forEach(video=>{
    if(!video) return;

    video.muted=true;
    video.playsInline=true;
    video.setAttribute('playsinline','');
    video.setAttribute('webkit-playsinline','');
    video.preload='auto';

    // Em alguns celulares o preload é adiado até interação.
    if(video.readyState===0){
      try{ video.load(); }catch(e){}
    }

    // "Prime" o elemento de mídia para liberar currentTime/seek no iOS.
    try{
      const playPromise=video.play();
      if(playPromise && typeof playPromise.then==='function'){
        playPromise
          .then(()=>{
            video.pause();
            updateHeroTarget();
            updateServicesTarget();
          })
          .catch(()=>{
            video.pause();
            updateHeroTarget();
            updateServicesTarget();
          });
      }else{
        video.pause();
      }
    }catch(e){
      try{ video.pause(); }catch(_){}
    }
  });
}

window.addEventListener('touchstart',unlockScrollVideos,{once:true,passive:true});
window.addEventListener('pointerdown',unlockScrollVideos,{once:true,passive:true});

// Em mobile, touchmove ajuda a manter o scrub sincronizado enquanto o dedo está na tela.
window.addEventListener('touchmove',()=>{
  updateHeroTarget();
  updateServicesTarget();
},{passive:true});

// Recalcula quando a página volta do background / troca de orientação.
document.addEventListener('visibilitychange',()=>{
  if(!document.hidden){
    updateHeroTarget();
    updateServicesTarget();
  }
});
window.addEventListener('orientationchange',()=>{
  setTimeout(()=>{
    updateHeroTarget();
    updateServicesTarget();
  },180);
});


// Reativa os alvos quando a página volta do cache do navegador (bfcache).
window.addEventListener('pageshow',()=>{
  if(heroVideo && !heroDuration) initHeroVideo();
  if(servicesVideo && !isMobileServices.matches) initServicesVideo();
  updateHeroTarget();
  updateServicesTarget();
});
