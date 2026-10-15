if(window.HAS_GL){
 import('three').then(init).catch(()=>{document.documentElement.classList.add('no-webgl');document.getElementById('orbit-hint').textContent='Choose a point below to open it.'});
}
function init(THREE){
  const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const mobile=innerWidth<720;
  const S=window.SERMON;
  const light=()=>document.documentElement.dataset.theme==='light';
  // ---------- HERO BACKGROUND ----------
  const cv=document.getElementById('bg');
  const r=new THREE.WebGLRenderer({canvas:cv,antialias:!mobile,alpha:true,powerPreference:'high-performance'});
  r.setPixelRatio(Math.min(devicePixelRatio,mobile?1.5:2));
  const scene=new THREE.Scene();scene.fog=new THREE.FogExp2(0x05070f,0.035);
  const cam=new THREE.PerspectiveCamera(60,1,0.1,200);cam.position.set(0,0,18);
  // particles
  const N=mobile?1400:3500,pos=new Float32Array(N*3);
  for(let i=0;i<N;i++){pos[i*3]=(Math.random()-.5)*60;pos[i*3+1]=(Math.random()-.5)*40;pos[i*3+2]=(Math.random()-.5)*50}
  const pg=new THREE.BufferGeometry();pg.setAttribute('position',new THREE.BufferAttribute(pos,3));
  const pm=new THREE.PointsMaterial({size:.07,color:0x8fdcff,transparent:true,opacity:.8,depthWrite:false,blending:THREE.AdditiveBlending});
  const pts=new THREE.Points(pg,pm);scene.add(pts);
  // neural network
  const nodes=[],NN=mobile?50:90;
  for(let i=0;i<NN;i++){const a=Math.random()*Math.PI*2,b=Math.acos(2*Math.random()-1),rr=6+Math.random()*4;nodes.push(new THREE.Vector3(rr*Math.sin(b)*Math.cos(a),rr*Math.sin(b)*Math.sin(a)*.7,rr*Math.cos(b)))}
  const lp=[];for(let i=0;i<NN;i++)for(let j=i+1;j<NN;j++)if(nodes[i].distanceTo(nodes[j])<3.2)lp.push(nodes[i].x,nodes[i].y,nodes[i].z,nodes[j].x,nodes[j].y,nodes[j].z);
  const lg=new THREE.BufferGeometry();lg.setAttribute('position',new THREE.Float32BufferAttribute(lp,3));
  const lm=new THREE.LineBasicMaterial({color:0x4df0ff,transparent:true,opacity:.28,blending:THREE.AdditiveBlending,depthWrite:false});
  const net=new THREE.Group();net.add(new THREE.LineSegments(lg,lm));
  const ng=new THREE.BufferGeometry().setFromPoints(nodes);const nm=new THREE.PointsMaterial({size:.22,color:0xc49bff,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false});
  net.add(new THREE.Points(ng,nm));scene.add(net);
  // glowing sacred text: open book + cross of light
  const glowTex=(()=>{const c=document.createElement('canvas');c.width=c.height=128;const g=c.getContext('2d');const gr=g.createRadialGradient(64,64,0,64,64,64);gr.addColorStop(0,'rgba(255,230,160,1)');gr.addColorStop(.3,'rgba(255,200,100,.5)');gr.addColorStop(1,'rgba(255,200,100,0)');g.fillStyle=gr;g.fillRect(0,0,128,128);return new THREE.CanvasTexture(c)})();
  const book=new THREE.Group();
  const pageTex=(side)=>{const c=document.createElement('canvas');c.width=256;c.height=320;const g=c.getContext('2d');g.fillStyle='rgba(255,240,200,0.14)';g.fillRect(0,0,256,320);g.strokeStyle='rgba(255,215,130,.9)';g.lineWidth=2;g.strokeRect(6,6,244,308);g.fillStyle='rgba(255,220,150,.85)';g.font='bold 22px serif';g.textAlign='center';g.fillText(side?'2 COR 10:4':'ΟΠΛΑ',128,44);g.fillStyle='rgba(255,220,150,.45)';for(let y=70;y<300;y+=16){const w=150+Math.random()*60;g.fillRect(128-w/2,y,w,3)}return new THREE.CanvasTexture(c)};
  [-1,1].forEach((s,i)=>{const m=new THREE.Mesh(new THREE.PlaneGeometry(2.2,2.75),new THREE.MeshBasicMaterial({map:pageTex(i),transparent:true,side:THREE.DoubleSide,blending:THREE.AdditiveBlending,depthWrite:false}));m.position.x=s*1.12;m.rotation.y=-s*.35;m.position.z=-s*0.2*s;book.add(m)});
  const halo=new THREE.Sprite(new THREE.SpriteMaterial({map:glowTex,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false}));halo.scale.set(9,9,1);halo.position.z=-.5;book.add(halo);
  const crossMat=new THREE.MeshBasicMaterial({color:0xffe1a0,transparent:true,opacity:.9,blending:THREE.AdditiveBlending});
  const cross=new THREE.Group();cross.add(new THREE.Mesh(new THREE.BoxGeometry(.12,1.6,.05),crossMat));const bar=new THREE.Mesh(new THREE.BoxGeometry(.9,.12,.05),crossMat);bar.position.y=.3;cross.add(bar);cross.position.set(0,2.4,0);book.add(cross);
  scene.add(book);
  function size(){r.setSize(innerWidth,innerHeight,false);cam.aspect=innerWidth/innerHeight;cam.updateProjectionMatrix()}
  addEventListener('resize',size);size();
  let mx=0,my=0;addEventListener('pointermove',e=>{mx=e.clientX/innerWidth-.5;my=e.clientY/innerHeight-.5},{passive:true});
  function theme(){const l=light();pm.color.set(l?0x3a6bd1:0x8fdcff);lm.color.set(l?0x0077b6:0x4df0ff);nm.color.set(l?0x6a3fd1:0xc49bff);scene.fog.color.set(l?0xf4f6fc:0x05070f);pm.blending=lm.blending=nm.blending=l?THREE.NormalBlending:THREE.AdditiveBlending;pm.needsUpdate=lm.needsUpdate=nm.needsUpdate=true;lm.opacity=l?.35:.28}
  theme();addEventListener('themechange',theme);

  // ---------- ORBIT ----------
  const oc=document.getElementById('orbit-canvas'),stage=document.getElementById('orbit-stage'),labels=document.getElementById('orbit-labels');
  const or=new THREE.WebGLRenderer({canvas:oc,antialias:true,alpha:true});or.setPixelRatio(Math.min(devicePixelRatio,2));
  const os=new THREE.Scene(),ocam=new THREE.PerspectiveCamera(50,1,.1,100);ocam.position.set(0,4.5,11);ocam.lookAt(0,0,0);
  const core=new THREE.Mesh(new THREE.IcosahedronGeometry(1.1,1),new THREE.MeshBasicMaterial({color:0xffd166,wireframe:true,transparent:true,opacity:.7}));os.add(core);
  const coreGlow=new THREE.Sprite(new THREE.SpriteMaterial({map:glowTex,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false}));coreGlow.scale.set(5,5,1);os.add(coreGlow);
  const orbitG=new THREE.Group();os.add(orbitG);
  const R=4.6,ring=new THREE.Mesh(new THREE.TorusGeometry(R,.015,8,160),new THREE.MeshBasicMaterial({color:0x4df0ff,transparent:true,opacity:.4}));ring.rotation.x=Math.PI/2;orbitG.add(ring);
  const pick=[],labelEls=[];
  S.sections.forEach((s,i)=>{const a=i/S.sections.length*Math.PI*2;const g=new THREE.Group();g.position.set(Math.cos(a)*R,Math.sin(a*2)*.6,Math.sin(a)*R);
    const sph=new THREE.Mesh(new THREE.SphereGeometry(.42,24,24),new THREE.MeshBasicMaterial({color:s.color}));sph.userData.id=s.id;g.add(sph);pick.push(sph);
    const gl=new THREE.Sprite(new THREE.SpriteMaterial({map:glowTex,color:s.color,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false}));gl.scale.set(2.4,2.4,1);g.add(gl);
    const line=new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(),g.position.clone().multiplyScalar(-1)]),new THREE.LineBasicMaterial({color:s.color,transparent:true,opacity:.35}));g.add(line);
    orbitG.add(g);const el=document.createElement('div');el.className='olabel';el.textContent=(i+1)+'. '+s.short;el.style.color=s.color;el.onclick=()=>openPoint(s.id);labels.appendChild(el);labelEls.push([el,g])});
  function osize(){const w=stage.clientWidth,h=stage.clientHeight;or.setSize(w,h,false);ocam.aspect=w/h;ocam.position.z=w<500?14:11;ocam.updateProjectionMatrix()}
  addEventListener('resize',osize);osize();
  let rotY=0,vel=reduce?0:.003,drag=false,lx=0,moved=0;
  oc.addEventListener('pointerdown',e=>{drag=true;lx=e.clientX;moved=0;oc.style.cursor='grabbing'});
  addEventListener('pointerup',()=>{drag=false;oc.style.cursor='grab'});
  addEventListener('pointermove',e=>{if(!drag)return;const dx=e.clientX-lx;lx=e.clientX;moved+=Math.abs(dx);rotY+=dx*.008;vel=dx*.0008});
  const ray=new THREE.Raycaster(),v2=new THREE.Vector2();let hover=null;
  function hit(e){const b=oc.getBoundingClientRect();v2.set((e.clientX-b.left)/b.width*2-1,-(e.clientY-b.top)/b.height*2+1);ray.setFromCamera(v2,ocam);return ray.intersectObjects(pick)[0]}
  oc.addEventListener('click',e=>{if(moved>6)return;const h=hit(e);if(h)openPoint(h.object.userData.id)});
  oc.addEventListener('pointermove',e=>{const h=hit(e);hover=h?h.object:null;oc.style.cursor=h?'pointer':(drag?'grabbing':'grab')});

  // ---------- LOOP ----------
  let orbVis=false,scrollP=0,heroP=0;
  new IntersectionObserver(es=>es.forEach(e=>orbVis=e.isIntersecting)).observe(stage);
  const onScroll=()=>{scrollP=scrollY/(document.body.scrollHeight-innerHeight||1);heroP=Math.min(1,scrollY/(innerHeight*.75))};onScroll();addEventListener('scroll',onScroll,{passive:true});
  const tmp=new THREE.Vector3();const clock=new THREE.Clock();
  function loop(){requestAnimationFrame(loop);if(document.hidden)return;const t=clock.getElapsedTime(),sp=reduce?0:1;
    // scroll-driven: camera dives through the network, book recedes
    cam.position.z=18-scrollP*14;cam.position.y=-scrollP*6;
    cam.position.x+=(mx*3-cam.position.x)*.04;cam.lookAt(0,-scrollP*6+(-my*2),0);
    net.rotation.y=t*.05*sp+scrollP*2;net.rotation.x=Math.sin(t*.1)*.1*sp;
    pts.rotation.y=t*.01*sp;book.position.y=Math.sin(t*.8)*.15*sp;book.rotation.y=Math.sin(t*.3)*.2*sp;
    const hf=1-heroP;book.visible=hf>0.01;book.scale.setScalar(Math.max(.01,.6+.4*hf));book.children.forEach(c=>{if(c.material){c.material.transparent=true;c.material.opacity=(c===halo?(.6+Math.sin(t*1.5)*.2):(c.isGroup?1:.95))*hf}});crossMat.opacity=.9*hf;
    lm.opacity=(light()?.35:.22)+Math.sin(t*2)*.08*sp;
    r.render(scene,cam);
    if(orbVis){if(!drag){rotY+=vel;vel+=((reduce?0:.003)-vel)*.02}orbitG.rotation.y=rotY;core.rotation.y=t*.3*sp;core.rotation.x=t*.2*sp;
      pick.forEach(p=>{const s=p===hover?1.35:1;p.scale.lerp(tmp.set(s,s,s),.2)});
      const w=stage.clientWidth,h=stage.clientHeight;labelEls.forEach(([el,g])=>{g.getWorldPosition(tmp);tmp.project(ocam);el.style.left=((tmp.x+1)/2*w)+'px';el.style.top=((1-tmp.y)/2*h)+'px';el.style.opacity=tmp.z<1?1:0});
      or.render(os,ocam)}
  }
  loop();
  initModels(THREE);
}

async function initModels(THREE){
  const boxes=[...document.querySelectorAll('.model-box')];if(!boxes.length)return;
  let libs=null;const getLibs=()=>libs||(libs=Promise.all([import('three/addons/loaders/GLTFLoader.js'),import('three/addons/loaders/RGBELoader.js')]).then(([g,r])=>{
    const hdr=new Promise(res=>new r.RGBELoader().load(window.HDRI.url,t=>{t.mapping=THREE.EquirectangularReflectionMapping;res(t)},undefined,()=>res(null)));
    return {GLTFLoader:g.GLTFLoader,hdr}}));
  const io=new IntersectionObserver(es=>es.forEach(e=>{const b=e.target;b._vis=e.isIntersecting;if(e.isIntersecting&&!b._init&&b.offsetParent){b._init=true;mount(b)}}),{rootMargin:'200px'});
  boxes.forEach(b=>io.observe(b));
  // <details> hides content until opened: re-check when toggled
  document.querySelectorAll('details.sec').forEach(d=>d.addEventListener('toggle',()=>{d.querySelectorAll('.model-box').forEach(b=>{io.unobserve(b);io.observe(b)})}));
  async function mount(box){
    const key=box.dataset.model,m=window.MODELS[key],stat=box.querySelector('.mstat');
    try{
      const {GLTFLoader,hdr}=await getLibs();
      const r=new THREE.WebGLRenderer({antialias:true,alpha:true});r.setPixelRatio(Math.min(devicePixelRatio,1.75));r.toneMapping=THREE.ACESFilmicToneMapping;r.toneMappingExposure=1.15;r.outputColorSpace=THREE.SRGBColorSpace;
      box.prepend(r.domElement);
      const sc=new THREE.Scene(),cam=new THREE.PerspectiveCamera(35,1,.01,100);
      sc.add(new THREE.HemisphereLight(0xffffff,0x334466,1.2));const dl=new THREE.DirectionalLight(0xfff1d6,2.2);dl.position.set(2,3,2);sc.add(dl);
      hdr.then(t=>{if(t){sc.environment=t}});
      const mf=window.MODEL_FILES[m.id];const mgr=new THREE.LoadingManager();mgr.setURLModifier(u=>{for(const k in mf.files){if(u.endsWith(k))return mf.files[k]}return u});
      const gltf=await new Promise((res,rej)=>new GLTFLoader(mgr).load(window.MODEL_URL(m.id),res,undefined,rej));
      const obj=gltf.scene;const bb=new THREE.Box3().setFromObject(obj),sz=bb.getSize(new THREE.Vector3()),c=bb.getCenter(new THREE.Vector3());
      const s=1.6/Math.max(sz.x,sz.y,sz.z);obj.scale.setScalar(s);obj.position.sub(c.multiplyScalar(s));
      const piv=new THREE.Group();piv.add(obj);sc.add(piv);cam.position.set(0,.35,2.6);cam.lookAt(0,0,0);
      stat.remove();
      const size=()=>{const w=box.clientWidth,h=box.clientHeight;r.setSize(w,h,false);cam.aspect=w/h;cam.updateProjectionMatrix()};size();new ResizeObserver(size).observe(box);
      let drag=false,lx=0,ly=0,ry=0,rx=0,auto=true;
      r.domElement.addEventListener('pointerdown',e=>{drag=true;auto=false;lx=e.clientX;ly=e.clientY;r.domElement.setPointerCapture(e.pointerId)});
      r.domElement.addEventListener('pointerup',()=>{drag=false;setTimeout(()=>auto=true,2500)});
      r.domElement.addEventListener('pointermove',e=>{if(!drag)return;ry+=(e.clientX-lx)*.01;rx=Math.max(-.6,Math.min(.6,rx+(e.clientY-ly)*.01));lx=e.clientX;ly=e.clientY});
      r.domElement.style.touchAction='pan-y';
      const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
      (function loop(){requestAnimationFrame(loop);if(!box._vis||document.hidden)return;if(auto&&!reduce)ry+=.008;piv.rotation.y=ry;piv.rotation.x=rx;r.render(sc,cam)})();
    }catch(err){stat.textContent='3D model unavailable right now';console.warn('model load failed',m&&m.id,err)}
  }
}
