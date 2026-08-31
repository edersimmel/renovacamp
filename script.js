const header=document.querySelector('.site-header');
const menuToggle=document.querySelector('.menu-toggle');
const navLinks=document.querySelectorAll('.nav-links a');

const heroSection=document.querySelector('.hero-scroll');
const heroVideo=document.getElementById('hero-video');
const heroDesktopCanvas=document.getElementById('hero-desktop-canvas');
const heroDesktopCtx=heroDesktopCanvas?.getContext('2d',{alpha:false});
const heroMobileCanvas=document.getElementById('hero-mobile-canvas');
const heroMobileCtx=heroMobileCanvas?.getContext('2d',{alpha:false});
const progressBar=document.getElementById('hero-progress-bar');

const prefersReduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const isMobileViewport=window.matchMedia('(max-width: 900px)');

const HERO_DESKTOP_FRAME_COUNT=90;
const HERO_DESKTOP_FRAME_PATH=(n)=>`assets/hero-desktop-frames/frame-${String(n).padStart(3,'0')}.webp`;
const heroDesktopFrames=new Array(HERO_DESKTOP_FRAME_COUNT+1);
let heroDesktopFramesStarted=false;
let heroCurrentDesktopFrame=-1;

const HERO_MOBILE_FRAME_COUNT=60;
const HERO_MOBILE_FRAME_PATH=(n)=>`assets/hero-mobile-frames/frame-${String(n).padStart(3,'0')}.webp`;
const heroMobileFrames=new Array(HERO_MOBILE_FRAME_COUNT+1);
let heroMobileFramesStarted=false;
let heroCurrentMobileFrame=-1;

// O Hero agora usa canvas frame a frame nos dois formatos.
// Evita currentTime/seek do MP4, que pode engasgar dependendo do PC/navegador.
if(heroVideo){
  heroVideo.removeAttribute('src');
  heroVideo.preload='none';
}

const updateHeader=()=>header?.classList.toggle('scrolled',window.scrollY>28);
updateHeader();
window.addEventListener('scroll',updateHeader,{passive:true});

menuToggle?.addEventListener('click',()=>{
  const open=header.classList.toggle('menu-open');
  menuToggle.setAttribute('aria-expanded',String(open));
});
navLinks.forEach(link=>link.addEventListener('click',()=>header?.classList.remove('menu-open')));

function clamp(n,min,max){return Math.min(max,Math.max(min,n));}

let heroTargetProgress=0;
let heroVisualProgress=0;
let heroRaf=0;

function measureHeroProgress(){
  if(!heroSection) return 0;
  const rect=heroSection.getBoundingClientRect();
  const total=Math.max(heroSection.offsetHeight-window.innerHeight,1);
  return clamp((-rect.top)/total,0,1);
}

function drawCover(ctx,img,w,h){
  const iw=img.naturalWidth||img.width;
  const ih=img.naturalHeight||img.height;
  if(!iw || !ih) return;
  const scale=Math.max(w/iw,h/ih);
  const sw=w/scale;
  const sh=h/scale;
  const sx=(iw-sw)/2;
  const sy=(ih-sh)/2;
  ctx.drawImage(img,sx,sy,sw,sh,0,0,w,h);
}

function resizeHeroDesktopCanvas(){
  if(!heroDesktopCanvas || isMobileViewport.matches) return;
  const rect=heroDesktopCanvas.getBoundingClientRect();
  if(!rect.width || !rect.height) return;
  const dpr=Math.min(window.devicePixelRatio||1,1.35);
  const w=Math.max(1,Math.min(1920,Math.round(rect.width*dpr)));
  const h=Math.max(1,Math.min(1080,Math.round(rect.height*dpr)));
  if(heroDesktopCanvas.width!==w || heroDesktopCanvas.height!==h){
    heroDesktopCanvas.width=w;
    heroDesktopCanvas.height=h;
    heroCurrentDesktopFrame=-1;
  }
}

function resizeHeroMobileCanvas(){
  if(!heroMobileCanvas || !isMobileViewport.matches) return;
  const rect=heroMobileCanvas.getBoundingClientRect();
  if(!rect.width || !rect.height) return;
  const dpr=Math.min(window.devicePixelRatio||1,2);
  const w=Math.max(1,Math.round(rect.width*dpr));
  const h=Math.max(1,Math.round(rect.height*dpr));
  if(heroMobileCanvas.width!==w || heroMobileCanvas.height!==h){
    heroMobileCanvas.width=w;
    heroMobileCanvas.height=h;
    heroCurrentMobileFrame=-1;
  }
}

function loadHeroDesktopFrame(n,priority=false){
  n=clamp(Math.round(n),1,HERO_DESKTOP_FRAME_COUNT);
  if(heroDesktopFrames[n]) return;
  const img=new Image();
  heroDesktopFrames[n]=img;
  img.decoding='async';
  img.src=HERO_DESKTOP_FRAME_PATH(n);
  img.onload=()=>{
    const target=1+Math.round(heroVisualProgress*(HERO_DESKTOP_FRAME_COUNT-1));
    if(priority || n===target) drawHeroDesktopFrame(target);
  };
}

function drawHeroDesktopFrame(frameNumber){
  if(!heroDesktopCanvas || !heroDesktopCtx || isMobileViewport.matches) return;
  resizeHeroDesktopCanvas();
  const n=clamp(Math.round(frameNumber),1,HERO_DESKTOP_FRAME_COUNT);
  const img=heroDesktopFrames[n];
  if(img?.complete && img.naturalWidth){
    if(heroCurrentDesktopFrame===n) return;
    heroCurrentDesktopFrame=n;
    heroDesktopCtx.clearRect(0,0,heroDesktopCanvas.width,heroDesktopCanvas.height);
    drawCover(heroDesktopCtx,img,heroDesktopCanvas.width,heroDesktopCanvas.height);
    return;
  }
  loadHeroDesktopFrame(n,true);
  loadHeroDesktopFrame(n+1);
  loadHeroDesktopFrame(n-1);
}

function preloadHeroDesktopFrames(){
  if(heroDesktopFramesStarted || isMobileViewport.matches) return;
  heroDesktopFramesStarted=true;

  for(let n=1;n<=18;n++) loadHeroDesktopFrame(n);

  let n=19;
  const batch=()=>{
    const end=Math.min(n+10,HERO_DESKTOP_FRAME_COUNT+1);
    for(;n<end;n++) loadHeroDesktopFrame(n);
    if(n<=HERO_DESKTOP_FRAME_COUNT) setTimeout(batch,55);
  };
  setTimeout(batch,70);
}

function loadHeroMobileFrame(n,priority=false){
  n=clamp(Math.round(n),1,HERO_MOBILE_FRAME_COUNT);
  if(heroMobileFrames[n]) return;
  const img=new Image();
  heroMobileFrames[n]=img;
  img.decoding='async';
  img.src=HERO_MOBILE_FRAME_PATH(n);
  img.onload=()=>{
    const target=1+Math.round(heroVisualProgress*(HERO_MOBILE_FRAME_COUNT-1));
    if(priority || n===target) drawHeroMobileFrame(target);
  };
}

function drawHeroMobileFrame(frameNumber){
  if(!heroMobileCanvas || !heroMobileCtx || !isMobileViewport.matches) return;
  resizeHeroMobileCanvas();
  const n=clamp(Math.round(frameNumber),1,HERO_MOBILE_FRAME_COUNT);
  const img=heroMobileFrames[n];
  if(img?.complete && img.naturalWidth){
    if(heroCurrentMobileFrame===n) return;
    heroCurrentMobileFrame=n;
    heroMobileCtx.clearRect(0,0,heroMobileCanvas.width,heroMobileCanvas.height);
    drawCover(heroMobileCtx,img,heroMobileCanvas.width,heroMobileCanvas.height);
    return;
  }
  loadHeroMobileFrame(n,true);
  loadHeroMobileFrame(n+1);
  loadHeroMobileFrame(n-1);
}

function preloadHeroMobileFrames(){
  if(heroMobileFramesStarted || !isMobileViewport.matches) return;
  heroMobileFramesStarted=true;

  for(let n=1;n<=12;n++) loadHeroMobileFrame(n);

  let n=13;
  const batch=()=>{
    const end=Math.min(n+7,HERO_MOBILE_FRAME_COUNT+1);
    for(;n<end;n++) loadHeroMobileFrame(n);
    if(n<=HERO_MOBILE_FRAME_COUNT) setTimeout(batch,70);
  };
  setTimeout(batch,90);
}

function updateHeroTarget(){
  heroTargetProgress=measureHeroProgress();
  if(!heroRaf) heroRaf=requestAnimationFrame(animateHeroScrub);
}

function animateHeroScrub(){
  const visualEase=isMobileViewport.matches ? 0.045 : 0.065;

  heroVisualProgress += (heroTargetProgress-heroVisualProgress)*visualEase;
  document.documentElement.style.setProperty('--hero-progress',heroVisualProgress.toFixed(4));
  if(progressBar) progressBar.style.height=`${heroVisualProgress*100}%`;

  if(isMobileViewport.matches){
    preloadHeroMobileFrames();
    drawHeroMobileFrame(1+heroVisualProgress*(HERO_MOBILE_FRAME_COUNT-1));
  }else{
    preloadHeroDesktopFrames();
    drawHeroDesktopFrame(1+heroVisualProgress*(HERO_DESKTOP_FRAME_COUNT-1));
  }

  if(Math.abs(heroTargetProgress-heroVisualProgress)>.0007){
    heroRaf=requestAnimationFrame(animateHeroScrub);
  }else{
    heroVisualProgress=heroTargetProgress;
    document.documentElement.style.setProperty('--hero-progress',heroVisualProgress.toFixed(4));
    if(progressBar) progressBar.style.height=`${heroVisualProgress*100}%`;

    if(isMobileViewport.matches){
      drawHeroMobileFrame(1+heroVisualProgress*(HERO_MOBILE_FRAME_COUNT-1));
    }else{
      drawHeroDesktopFrame(1+heroVisualProgress*(HERO_DESKTOP_FRAME_COUNT-1));
    }
    heroRaf=0;
  }
}

heroTargetProgress=measureHeroProgress();
heroVisualProgress=heroTargetProgress;

if(isMobileViewport.matches){
  preloadHeroMobileFrames();
  resizeHeroMobileCanvas();
  loadHeroMobileFrame(1+heroVisualProgress*(HERO_MOBILE_FRAME_COUNT-1),true);
  drawHeroMobileFrame(1+heroVisualProgress*(HERO_MOBILE_FRAME_COUNT-1));
}else{
  preloadHeroDesktopFrames();
  resizeHeroDesktopCanvas();
  loadHeroDesktopFrame(1+heroVisualProgress*(HERO_DESKTOP_FRAME_COUNT-1),true);
  drawHeroDesktopFrame(1+heroVisualProgress*(HERO_DESKTOP_FRAME_COUNT-1));
}

document.documentElement.style.setProperty('--hero-progress',heroVisualProgress.toFixed(4));
if(progressBar) progressBar.style.height=`${heroVisualProgress*100}%`;

window.addEventListener('scroll',updateHeroTarget,{passive:true});
window.addEventListener('resize',()=>{
  resizeHeroDesktopCanvas();
  resizeHeroMobileCanvas();
  heroCurrentDesktopFrame=-1;
  heroCurrentMobileFrame=-1;
  updateHeroTarget();
});

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
// SERVIÇOS — desktop e mobile por sequência de frames
// =========================================================
const servicesSection=document.querySelector('.services-scroll');
const servicesVideo=document.getElementById('services-video');
const servicesDesktopCanvas=document.getElementById('services-desktop-canvas');
const servicesDesktopCtx=servicesDesktopCanvas?.getContext('2d',{alpha:false});
const servicesMobileCanvas=document.getElementById('services-mobile-canvas');
const servicesMobileCtx=servicesMobileCanvas?.getContext('2d',{alpha:false});
const servicesCopies=[...document.querySelectorAll('[data-service-copy]')];
const servicesProgressBar=document.getElementById('services-progress-bar');
const isMobileServices=window.matchMedia('(max-width: 900px)');

const SERVICES_DURATION=16;
const SERVICES_DESKTOP_FRAME_COUNT=96;
const SERVICES_DESKTOP_FRAME_PATH=(n)=>`assets/services-desktop-frames/frame-${String(n).padStart(3,'0')}.webp`;
const SERVICES_MOBILE_FRAME_COUNT=96;
const SERVICES_MOBILE_FRAME_PATH=(n)=>`assets/services-mobile-frames/frame-${String(n).padStart(3,'0')}.webp`;

const servicesDesktopFrames=new Array(SERVICES_DESKTOP_FRAME_COUNT+1);
const servicesMobileFrames=new Array(SERVICES_MOBILE_FRAME_COUNT+1);
let servicesProgress=0;
let servicesRaf=0;
let activeServiceIndex=-999;
let servicesDesktopFramesStarted=false;
let servicesMobileFramesStarted=false;
let currentServicesDesktopFrame=-1;
let currentServicesMobileFrame=-1;

if(servicesVideo){
  servicesVideo.muted=true;
  servicesVideo.playsInline=true;
  servicesVideo.setAttribute('playsinline','');
  servicesVideo.setAttribute('webkit-playsinline','');
  servicesVideo.preload='none';
  try{ servicesVideo.pause(); }catch(e){}
}

function measureServicesProgress(){
  if(!servicesSection) return 0;
  const rect=servicesSection.getBoundingClientRect();
  const total=Math.max(servicesSection.offsetHeight-window.innerHeight,1);
  return clamp((-rect.top)/total,0,1);
}

function servicesTimeFromProgress(progress){
  const p=clamp(progress,0,1);
  const duration=Math.max(SERVICES_DURATION,0);
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

function resizeServicesDesktopCanvas(){
  if(!servicesDesktopCanvas || isMobileServices.matches) return;
  const rect=servicesDesktopCanvas.getBoundingClientRect();
  if(!rect.width || !rect.height) return;
  const dpr=Math.min(window.devicePixelRatio||1,1.35);
  const w=Math.max(1,Math.min(1920,Math.round(rect.width*dpr)));
  const h=Math.max(1,Math.min(1080,Math.round(rect.height*dpr)));
  if(servicesDesktopCanvas.width!==w || servicesDesktopCanvas.height!==h){
    servicesDesktopCanvas.width=w;
    servicesDesktopCanvas.height=h;
    currentServicesDesktopFrame=-1;
  }
}

function resizeServicesMobileCanvas(){
  if(!servicesMobileCanvas || !isMobileServices.matches) return;
  const rect=servicesMobileCanvas.getBoundingClientRect();
  if(!rect.width || !rect.height) return;
  const dpr=Math.min(window.devicePixelRatio||1,2);
  const w=Math.max(1,Math.round(rect.width*dpr));
  const h=Math.max(1,Math.round(rect.height*dpr));
  if(servicesMobileCanvas.width!==w || servicesMobileCanvas.height!==h){
    servicesMobileCanvas.width=w;
    servicesMobileCanvas.height=h;
    currentServicesMobileFrame=-1;
  }
}

function loadServicesDesktopFrame(n,priority=false){
  n=clamp(Math.round(n),1,SERVICES_DESKTOP_FRAME_COUNT);
  if(servicesDesktopFrames[n]) return;
  const img=new Image();
  servicesDesktopFrames[n]=img;
  img.decoding='async';
  img.src=SERVICES_DESKTOP_FRAME_PATH(n);
  img.onload=()=>{
    const targetTime=servicesTimeFromProgress(servicesProgress);
    const target=1+Math.round((targetTime/SERVICES_DURATION)*(SERVICES_DESKTOP_FRAME_COUNT-1));
    if(priority || n===target) drawServicesDesktopFrame(target);
  };
}

function drawServicesDesktopFrame(frameNumber){
  if(!servicesDesktopCanvas || !servicesDesktopCtx || isMobileServices.matches) return;
  resizeServicesDesktopCanvas();
  const n=clamp(Math.round(frameNumber),1,SERVICES_DESKTOP_FRAME_COUNT);
  const img=servicesDesktopFrames[n];
  if(img?.complete && img.naturalWidth){
    if(currentServicesDesktopFrame===n) return;
    currentServicesDesktopFrame=n;
    servicesDesktopCtx.clearRect(0,0,servicesDesktopCanvas.width,servicesDesktopCanvas.height);
    drawCover(servicesDesktopCtx,img,servicesDesktopCanvas.width,servicesDesktopCanvas.height);
    return;
  }
  loadServicesDesktopFrame(n,true);
  loadServicesDesktopFrame(n+1);
  loadServicesDesktopFrame(n-1);
}

function preloadServicesDesktopFrames(){
  if(servicesDesktopFramesStarted || isMobileServices.matches) return;
  servicesDesktopFramesStarted=true;

  for(let n=1;n<=16;n++) loadServicesDesktopFrame(n);

  let n=17;
  const batch=()=>{
    const end=Math.min(n+10,SERVICES_DESKTOP_FRAME_COUNT+1);
    for(;n<end;n++) loadServicesDesktopFrame(n);
    if(n<=SERVICES_DESKTOP_FRAME_COUNT) setTimeout(batch,55);
  };
  setTimeout(batch,70);
}

function loadServicesMobileFrame(n,priority=false){
  n=clamp(Math.round(n),1,SERVICES_MOBILE_FRAME_COUNT);
  if(servicesMobileFrames[n]) return;
  const img=new Image();
  servicesMobileFrames[n]=img;
  img.decoding='async';
  img.src=SERVICES_MOBILE_FRAME_PATH(n);
  img.onload=()=>{
    const targetTime=servicesTimeFromProgress(servicesProgress);
    const target=1+Math.round((targetTime/SERVICES_DURATION)*(SERVICES_MOBILE_FRAME_COUNT-1));
    if(priority || n===target) drawServicesMobileFrame(target);
  };
}

function drawServicesMobileFrame(frameNumber){
  if(!servicesMobileCanvas || !servicesMobileCtx || !isMobileServices.matches) return;
  resizeServicesMobileCanvas();
  const n=clamp(Math.round(frameNumber),1,SERVICES_MOBILE_FRAME_COUNT);
  const img=servicesMobileFrames[n];
  if(img?.complete && img.naturalWidth){
    if(currentServicesMobileFrame===n) return;
    currentServicesMobileFrame=n;
    servicesMobileCtx.clearRect(0,0,servicesMobileCanvas.width,servicesMobileCanvas.height);
    servicesMobileCtx.drawImage(img,0,0,servicesMobileCanvas.width,servicesMobileCanvas.height);
    return;
  }
  loadServicesMobileFrame(n,true);
  loadServicesMobileFrame(n+1);
  loadServicesMobileFrame(n-1);
}

function preloadServicesMobileFrames(){
  if(servicesMobileFramesStarted || !isMobileServices.matches) return;
  servicesMobileFramesStarted=true;

  for(let n=1;n<=12;n++) loadServicesMobileFrame(n);

  let n=13;
  const batch=()=>{
    const end=Math.min(n+9,SERVICES_MOBILE_FRAME_COUNT+1);
    for(;n<end;n++) loadServicesMobileFrame(n);
    if(n<=SERVICES_MOBILE_FRAME_COUNT) setTimeout(batch,70);
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

  const targetTime=servicesTimeFromProgress(servicesProgress);

  if(isMobileServices.matches){
    preloadServicesMobileFrames();
    const frame=1+(targetTime/SERVICES_DURATION)*(SERVICES_MOBILE_FRAME_COUNT-1);
    drawServicesMobileFrame(frame);
  }else{
    preloadServicesDesktopFrames();
    const frame=1+(targetTime/SERVICES_DURATION)*(SERVICES_DESKTOP_FRAME_COUNT-1);
    drawServicesDesktopFrame(frame);
  }
}

function updateServicesTarget(){
  if(!servicesRaf){
    servicesRaf=requestAnimationFrame(renderServicesScroll);
  }
}

if(servicesSection && 'IntersectionObserver' in window){
  const servicesWarmup=new IntersectionObserver((entries)=>{
    if(entries.some(entry=>entry.isIntersecting)){
      if(isMobileServices.matches){
        preloadServicesMobileFrames();
      }else{
        preloadServicesDesktopFrames();
      }
      servicesWarmup.disconnect();
    }
  },{rootMargin:'160% 0px'});
  servicesWarmup.observe(servicesSection);
}

servicesProgress=measureServicesProgress();
if(isMobileServices.matches){
  preloadServicesMobileFrames();
  resizeServicesMobileCanvas();
  loadServicesMobileFrame(1,true);
  drawServicesMobileFrame(1);
}else{
  preloadServicesDesktopFrames();
  resizeServicesDesktopCanvas();
  loadServicesDesktopFrame(1,true);
  drawServicesDesktopFrame(1);
}

renderServicesScroll();
window.addEventListener('scroll',updateServicesTarget,{passive:true});
window.addEventListener('resize',()=>{
  resizeServicesDesktopCanvas();
  resizeServicesMobileCanvas();
  currentServicesDesktopFrame=-1;
  currentServicesMobileFrame=-1;
  updateServicesTarget();
});

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

  if(isMobileViewport.matches){
    preloadHeroMobileFrames();
    updateHeroTarget();
    return;
  }

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
    resizeHeroMobileCanvas();
    heroCurrentMobileFrame=-1;
    updateHeroTarget();
    updateServicesTarget();
  },180);
});


// Reativa os alvos quando a página volta do cache do navegador (bfcache).
window.addEventListener('pageshow',()=>{
  if(isMobileViewport.matches){
    preloadHeroMobileFrames();
  }else{
    preloadHeroDesktopFrames();
  }

  if(isMobileServices.matches){
    preloadServicesMobileFrames();
  }else{
    preloadServicesDesktopFrames();
  }

  updateHeroTarget();
  updateServicesTarget();
});
