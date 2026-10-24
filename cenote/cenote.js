// TIF · Cenote intro (home landing). WebGL1 fragment shader in a sticky canvas: interactive
// water, a scroll-driven dive through the four days and an ember whale for Whale Tank.
(() => {
  const root = document.querySelector('[data-cenote]');
  if (!root) return;
  const canvas = root.querySelector('canvas');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Scene reveals (independent of WebGL)
  const io = new IntersectionObserver((es) => es.forEach((e) => e.isIntersecting && e.target.classList.add('is-in')), { threshold: 0.3 });
  root.querySelectorAll('.cx-scene').forEach((s) => io.observe(s));
  const meter = root.querySelector('.cx-meter'), bar = root.querySelector('.cx-meter-bar'), label = root.querySelector('.cx-meter-label');

  // Progress through the intro (0 → 1)
  let depth = 0, depthT = 0;
  const readScroll = () => {
    const r = root.getBoundingClientRect(); const span = r.height - innerHeight;
    depthT = span > 0 ? Math.min(1, Math.max(0, -r.top / span)) : 0;
    if (meter) meter.classList.toggle('is-on', r.top < innerHeight * 0.5 && r.bottom > innerHeight * 0.6);
  };
  addEventListener('scroll', readScroll, { passive: true }); readScroll();

  // Desktop cursor ring
  const ring = root.querySelector('.cx-cursor');
  if (ring && matchMedia('(pointer: fine)').matches) {
    root.addEventListener('pointermove', (e) => { ring.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`; ring.classList.add('is-on'); }, { passive: true });
    root.addEventListener('pointerleave', () => ring.classList.remove('is-on'));
    root.addEventListener('pointerdown', () => { ring.classList.remove('is-tap'); void ring.offsetWidth; ring.classList.add('is-tap'); });
  }

  const gl = !reduce && canvas.getContext('webgl', { antialias: false, alpha: false, powerPreference: 'high-performance' });
  const tick = () => { depth += (depthT - depth) * 0.14; if (bar) { bar.style.transform = `scaleY(${depth})`; label.textContent = `${Math.round(depth * 62)} m`; } };
  if (!gl) { root.classList.add('cx-static'); const loop = () => { tick(); requestAnimationFrame(loop); }; loop(); return; }

  const vert = `attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}`;
  const frag = `
precision highp float;
uniform vec2 R; uniform float T; uniform float D; uniform vec2 M; uniform vec2 TL;
uniform vec3 RP[8];
float h21(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}
float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h21(i),h21(i+vec2(1,0)),f.x),mix(h21(i+vec2(0,1)),h21(i+vec2(1,1)),f.x),f.y);}
float fbm(vec2 p){float v=0.,a=.5;for(int i=0;i<4;i++){v+=a*noise(p);p*=2.03;a*=.5;}return v;}
// interactive ripples: travelling rings from pointer / taps
float ripples(vec2 p){
  float h=0.;
  for(int i=0;i<8;i++){
    vec3 r=RP[i]; float age=T-r.z; if(age<0.||age>5.) continue;
    float d=length(p-r.xy); float front=age*.32;
    h+=sin((d-front)*38.)*exp(-age*.9)*exp(-abs(d-front)*9.)*.9;
  }
  h+=sin(length(p-M)*30.-T*4.)*exp(-length(p-M)*6.)*.12;
  return h;
}
float caustic(vec2 uv,float t){
  vec2 p=mod(uv*6.2831,6.2831)-250.; vec2 i=p; float c=1.,inten=.005;
  for(int n=0;n<4;n++){float tt=t*(1.-(3.5/float(n+1)));i=p+vec2(cos(tt-i.x)+sin(tt+i.y),sin(tt-i.y)+cos(tt+i.x));c+=1./length(vec2(p.x/(sin(i.x+tt)/inten),p.y/(cos(i.y+tt)/inten)));}
  c/=4.; c=1.17-pow(c,1.4); return pow(abs(c),8.);
}
float sdE(vec2 p,vec2 r){float k=length(p/r);return (k-1.)*min(r.x,r.y);}
// 2D whale silhouette (signed distance, <0 inside). Head at +x, tail at -x.
float whale(vec2 p){
  float th=mix(.06,.19,smoothstep(-.7,.25,p.x))*mix(1.,.75,smoothstep(.3,.66,p.x));
  float body=max(abs(p.y-.02*p.x)-th, abs(p.x+.04)-.68);
  float head=sdE(p-vec2(.4,.0),vec2(.3,.18));
  body=min(body,head);
  vec2 f=p-vec2(-.74,.0); f.y=abs(f.y);
  float fl=sdE(mat2(.8,.6,-.6,.8)*(f-vec2(-.06,.1)),vec2(.16,.045)); body=min(body,fl);
  vec2 pf=p-vec2(.12,-.16); pf=mat2(.85,-.53,.53,.85)*pf; body=min(body,sdE(pf,vec2(.22,.04)));
  return body;
}
void main(){
  vec2 uv=gl_FragCoord.xy/R; vec2 p=(gl_FragCoord.xy-.5*R)/R.y; p+=TL*.04*(1.-D*.5);
  float t=T;
  // ---------- surface ----------
  float e=.003; float h=ripples(p); vec2 n=vec2(ripples(p+vec2(e,0))-h,ripples(p+vec2(0,e))-h)/e;
  vec2 wp=p+n*.004+vec2(fbm(p*3.+t*.05),fbm(p*3.-t*.04))*.02;
  vec3 deep=vec3(.008,.07,.085), shallow=vec3(.03,.24,.27);
  float r=length(p*vec2(1.,1.15));
  vec3 surf=mix(shallow,deep,smoothstep(.0,.9,r));
  float cs=caustic(wp*.7,t*.35); surf+=vec3(.25,.75,.7)*cs*.55*(1.-smoothstep(.3,1.,r));
  vec2 moon=vec2(.18,.22); float md=length(wp-moon+n*.02);
  surf+=vec3(1.,.82,.6)*(exp(-md*28.)*1.2+exp(-md*6.)*.12);
  surf+=vec3(.9,.95,1.)*pow(max(0.,dot(normalize(vec3(-n*.04,1.)),normalize(vec3(.3,.4,1.)))),40.)*.2;
  float rim=smoothstep(.62,1.05,r+fbm(vec2(atan(p.y,p.x)*3.,r*2.))*.22-.1);
  vec3 rock=vec3(.01,.025,.02)+vec3(.02,.05,.03)*fbm(p*8.);
  surf=mix(surf,rock,rim);
  // ---------- underwater ----------
  float dd=D;
  vec3 top=vec3(.02,.2,.22), mid=vec3(.005,.06,.08), bottom=vec3(.002,.012,.016);
  vec3 under=mix(top,mid,smoothstep(0.,.5,dd+(.5-uv.y)*.25));
  under=mix(under,bottom,smoothstep(.45,.95,dd));
  float a=atan(p.x,p.y+1.6);
  float rays=pow(.5+.5*sin(a*26.+t*.25+fbm(vec2(a*6.,t*.1))*4.),5.)*smoothstep(-.6,.6,p.y)*(1.-smoothstep(.2,.8,dd));
  under+=vec3(.35,.8,.75)*rays*.16;
  under+=vec3(.25,.75,.7)*caustic(wp*.5+vec2(0.,dd),t*.25)*.12*(1.-smoothstep(.1,.6,dd));
  // bubbles rising
  vec2 bq=p*vec2(9.,6.)+vec2(0.,t*.7+dd*10.); vec2 bi=floor(bq),bf=fract(bq)-.5;
  float bh=h21(bi); bf+=vec2(h21(bi+11.)-.5,h21(bi+5.)-.5)*.6; bf.x+=sin(t*2.+bh*20.)*.1;
  float bub=smoothstep(.08,.03,length(bf))*step(.86,bh)*(1.-smoothstep(.6,1.,dd));
  under+=vec3(.6,.9,.9)*bub*.35;
  // ember glow from the bottom
  float glow=smoothstep(.45,1.,dd);
  under+=vec3(.95,.35,.12)*glow*exp(-length(p-vec2(0.,-.65))*2.2)*.7;
  // whale of ember particles: enters with the Whale Tank scene, then glides away
  float wv=smoothstep(.74,.88,dd);
  if(wv>0.){
    float wx=mix(1.5,.42,smoothstep(.74,.92,dd));
    vec2 wq=p-vec2(wx+sin(t*.35)*.02,-.04+sin(t*.6)*.015);
    wq/=.48; wq.x=-wq.x; wq.y+=sin(wq.x*3.5-t*1.4)*.03*smoothstep(.2,-.9,wq.x);
    float wd=whale(wq);
    vec2 g=p*150.; vec2 gi=floor(g),gf=fract(g)-.5; float gh=h21(gi); gf+=vec2(h21(gi+7.),h21(gi+3.))*.5-.25;
    float dot_=smoothstep(.3,.08,length(gf))*step(.35,gh)*(.5+.5*sin(t*3.+gh*30.));
    float inside=smoothstep(.02,-.03,wd);
    vec3 em=vec3(1.,.48,.18);
    under+=em*dot_*inside*wv*1.1;
    under+=em*exp(-abs(wd)*60.)*.55*wv;
    under+=em*exp(-max(wd,0.)*14.)*.12*wv;
    under+=vec3(1.,.85,.6)*smoothstep(.03,.012,length(wq-vec2(.45,.02)))*wv;
  }
  vec3 col=mix(surf,under,smoothstep(.04,.2,dd));
  col*=1.-smoothstep(.55,1.35,length(uv-.5)*1.3)*.75;
  col=pow(col,vec3(.92));
  gl_FragColor=vec4(col,1.);
}`;
  const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)); return s; };
  let prog;
  try {
    prog = gl.createProgram();
    gl.attachShader(prog, sh(gl.VERTEX_SHADER, vert)); gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, frag)); gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog));
  } catch (err) { console.warn('[cenote]', err); root.classList.add('cx-static'); return; }
  gl.useProgram(prog);
  const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, 'p'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  const U = (n) => gl.getUniformLocation(prog, n);
  const uR = U('R'), uT = U('T'), uD = U('D'), uM = U('M'), uTL = U('TL'), uRP = U('RP');

  const mobile = matchMedia('(pointer: coarse)').matches;
  let scale = Math.min(devicePixelRatio || 1, 1.5) * (mobile ? 0.55 : 0.7);
  function resize() {
    const w = Math.max(1, Math.floor(innerWidth * scale)), h = Math.max(1, Math.floor(innerHeight * scale));
    if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; gl.viewport(0, 0, w, h); }
  }
  addEventListener('resize', resize); resize();

  const toP = (x, y) => [(x - innerWidth / 2) / innerHeight, (innerHeight / 2 - y) / innerHeight];
  const ripples = new Float32Array(24).fill(-99); let ri = 0, last = 0;
  let mouse = [0.2, -0.1], target = [0.2, -0.1];
  const start = performance.now(); const now = () => (performance.now() - start) / 1000;
  const drop = (x, y, force) => { const [px, py] = toP(x, y); ripples[ri * 3] = px; ripples[ri * 3 + 1] = py; ripples[ri * 3 + 2] = now() - (force ? 0 : 0.6); ri = (ri + 1) % 8; };
  const hint = root.querySelector('.cx-hint'); const hideHint = () => hint && hint.classList.add('gone');
  root.addEventListener('pointermove', (e) => { target = toP(e.clientX, e.clientY); const t = now(); if (t - last > 0.35 && e.pointerType === 'mouse') { drop(e.clientX, e.clientY, false); last = t; hideHint(); } }, { passive: true });
  root.addEventListener('pointerdown', (e) => { if (!e.target.closest('a,button')) { drop(e.clientX, e.clientY, true); last = now(); hideHint(); } }, { passive: true });
  setInterval(() => { if (running && now() - last > 2.5) drop(innerWidth * (0.3 + Math.random() * 0.4), innerHeight * (0.35 + Math.random() * 0.3), false); }, 2600);

  let tilt = [0, 0], tiltT = [0, 0];
  const onTilt = (e) => { if (e.gamma == null) return; tiltT = [Math.max(-1, Math.min(1, e.gamma / 30)), Math.max(-1, Math.min(1, (e.beta - 45) / 30))]; };
  if (mobile) root.addEventListener('touchend', () => { const DO = window.DeviceOrientationEvent; if (DO && typeof DO.requestPermission === 'function') DO.requestPermission().then((s) => s === 'granted' && addEventListener('deviceorientation', onTilt)).catch(() => {}); else addEventListener('deviceorientation', onTilt); }, { once: true });

  // Only render while the intro is on screen
  let running = false, frames = 0, t0 = 0;
  new IntersectionObserver(([e]) => { const was = running; running = e.isIntersecting && !document.hidden; if (running && !was) { t0 = performance.now(); frames = 0; requestAnimationFrame(frame); } }, { threshold: 0 }).observe(root);
  document.addEventListener('visibilitychange', () => { if (document.hidden) running = false; else { readScroll(); const r = root.getBoundingClientRect(); if (r.bottom > 0 && r.top < innerHeight && !running) { running = true; requestAnimationFrame(frame); } } });
  function frame() {
    if (!running) return;
    tick();
    mouse[0] += (target[0] - mouse[0]) * 0.08; mouse[1] += (target[1] - mouse[1]) * 0.08;
    tilt[0] += (tiltT[0] - tilt[0]) * 0.06; tilt[1] += (tiltT[1] - tilt[1]) * 0.06;
    gl.uniform2f(uR, canvas.width, canvas.height); gl.uniform1f(uT, now()); gl.uniform1f(uD, depth);
    gl.uniform2f(uM, mouse[0], mouse[1]); gl.uniform2f(uTL, tilt[0], tilt[1]); gl.uniform3fv(uRP, ripples);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    frames++; if (frames === 120) { const fps = 120 / ((performance.now() - t0) / 1000); if (fps < 40 && scale > 0.35) { scale *= 0.7; resize(); } }
    requestAnimationFrame(frame);
  }
})();
