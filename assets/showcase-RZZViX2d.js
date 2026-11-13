const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["./keys-3vTU1xbp.js","./skin-CCTSjShy.js","./icons-_4vGlapu.js","./icons-DJYZV5kl.js"])))=>i.map(i=>d[i]);
import"./modulepreload-polyfill-P2Xu9kJm.js";import{t as e}from"./preload-helper-DclECHGd.js";var t=`@layer base.theme, base.preset, base.preferences;

/*
 * Usher tokens (design/spec.md §3, §4, §5, §11). They sit in \`base.preset\`, like the other theme files, so they win
 * over the stock defaults in \`base.theme\`, and \`base.preferences\` still wins over them.
 *
 * One unit \`u\` = \`--media-spacing\` (4px at the default 16px \`--media-scale-unit\`), so \`--media-scale-unit\` and the
 * fullscreen \`--media-scale\` steps keep scaling every size below.
 */
@layer base.preset {
  .media-skin[data-theme="usher"] {
    /*
     * Print: marks set straight on the picture, over the shade band (§6). The band peaks at 60% black, so over a pure
     * white frame the ground under the glyphs is rgb(102): print 5.7:1, muted print at 85% 4.7:1, unplayed line at 60%
     * 3.2:1. (72% muted print and a 50% line would fall to 3.9:1 and 2.7:1 there.)
     */
    --usher-print: rgb(255 255 255);
    --usher-print-muted: rgb(255 255 255 / 0.85);
    --usher-line-unplayed: rgb(255 255 255 / 0.6);
    /* Drawn over the unplayed line: 0.6 + 0.4 × 0.44 ≈ 0.78, a step brighter, over any picture. */
    --usher-line-buffered: rgb(255 255 255 / 0.44);
    --usher-hover: rgb(255 255 255 / 0.16);

    /* Signal: the only colour. A fill behind text, never a line, never text, never the ring. */
    --usher-accent: var(--media-accent-color, #ffd23f);
    --usher-accent-ink: var(--media-accent-text-color, #000);

    /* Solid: sheets for values and choices. Video controls stay dark in both colour schemes. */
    --usher-sheet: #1c1c1e;
    --usher-sheet-text: rgb(255 255 255);
    --usher-sheet-secondary: rgb(255 255 255 / 0.64);
    --usher-sheet-edge: 0 0 0 1px rgb(255 255 255 / 0.1);
    --usher-sheet-shadow: 0 8px 24px rgb(0 0 0 / 0.35);
    --usher-hollow-fill: rgb(28 28 30 / 0.72);
    --usher-disc: rgb(0 0 0 / 0.55);

    /* Focus ring: a white band between two dark edges, readable on white and on black. */
    --media-ring: rgb(255 255 255);
    --usher-ring-edge: rgb(0 0 0);

    /* Shade band (§6): a smoothstep scrim of this colour, at this opacity where the glyphs sit. */
    --usher-scrim-color: 0 0 0;
    --usher-scrim-peak: 0.6;

    /* Shape (§4). Every radius follows --media-border-radius and reaches 0 with it. */
    --usher-frame-radius: var(--media-border-radius, 12px);
    --usher-radius: min(calc(var(--usher-frame-radius) * 2 / 3), 16px);
    --usher-sheet-pad: var(--media-spacing);
    --usher-sheet-radius: min(calc(var(--usher-radius) * 1.5), calc(var(--usher-radius) + var(--usher-sheet-pad)));
    /* The hollow marker is 3/4 the marker's height, so its corner is 3/4 of R: the two shapes are similar. */
    --usher-hollow-radius: calc(var(--usher-radius) * 0.75);
    /* The start and replay marker is 56/32 the marker's height. */
    --usher-hero-radius: calc(var(--usher-radius) * 1.75);

    /* Size. */
    --usher-line: var(--media-spacing);
    --usher-chapter-gap: calc(var(--media-spacing) * 0.5);
    --usher-icon: calc(var(--media-spacing) * 4.5);
    /* The icons' live area inside their 18px grid (§12): glyph edges sit 2px inside the box. */
    --usher-icon-live: calc(var(--media-spacing) * 3.5);
    --usher-marker: calc(var(--media-spacing) * 8);
    --usher-marker-pad: calc(var(--media-spacing) * 2);
    --usher-hollow: calc(var(--media-spacing) * 6);
    --usher-bead: calc(var(--media-spacing) * 3);
    --usher-hero: calc(var(--media-spacing) * 14);
    --usher-volume-line: calc(var(--media-spacing) * 16);

    /* Type (§5). Numbers are tabular and lining everywhere. */
    --usher-font: var(
      --media-font-family,
      system-ui,
      -apple-system,
      "Segoe UI Variable Text",
      "Segoe UI",
      Roboto,
      "Helvetica Neue",
      sans-serif
    );
    --usher-text-marker: calc(var(--media-spacing) * 4);
    --usher-text-hero: calc(var(--media-spacing) * 5);
    --usher-text-title: calc(var(--media-spacing) * 3.75);
    --usher-text-label: calc(var(--media-spacing) * 3.25);
    --usher-text-menu: calc(var(--media-spacing) * 3.5);
    --usher-text-small: calc(var(--media-spacing) * 3);
    --usher-text-dialog-title: calc(var(--media-spacing) * 4.25);

    /* Motion (§11). Durations come from the stock tokens, which the preferences layer collapses. */
    --usher-ease-enter: cubic-bezier(0.2, 0, 0, 1);
    --usher-ease-exit: cubic-bezier(0.4, 0, 1, 1);

    /* Stock tokens, mapped so stock rules and public properties keep meaning the same thing. */
    --media-foreground: var(--usher-print);
    --media-accent: var(--usher-accent);
    --media-accent-foreground: var(--usher-accent-ink);
    --media-primary: var(--usher-accent);
    --media-primary-foreground: var(--usher-accent-ink);
    --media-popover: var(--usher-sheet);
    --media-popover-foreground: var(--usher-sheet-text);
    --media-video-border-radius: var(--usher-frame-radius);
    --media-popover-side-offset: calc(var(--media-spacing) * 2);
    --media-tooltip-side-offset: calc(var(--media-spacing) * 2);
    --media-popover-boundary-offset: calc(var(--media-spacing) * 2);
    --media-tooltip-boundary-offset: calc(var(--media-spacing) * 2);
    --media-shadow-surface: none;
    --media-shadow-surface-inset: none;
    --media-backdrop-filter-surface: none;
    --media-backdrop-filter-indicator: none;
    --media-backdrop-filter-dialog: none;
    --media-hidden-popup-scale: 0.96;
  }

  /* Text on the accent follows the accent: black on light accents, white on dark ones. */
  @supports (color: contrast-color(red)) {
    .media-skin[data-theme="usher"] {
      --usher-accent-ink: var(--media-accent-text-color, contrast-color(var(--usher-accent)));
    }
  }

  /* A stronger, near-solid band and brighter print tones: the controls read the same over any frame. */
  @media (prefers-reduced-transparency: reduce), (prefers-contrast: more) {
    .media-skin[data-theme="usher"] {
      --usher-scrim-peak: 0.9;
      --usher-line-unplayed: rgb(255 255 255 / 0.7);
      --usher-line-buffered: rgb(255 255 255 / 0.5);
      --usher-print-muted: var(--usher-print);
      --usher-hollow-fill: var(--usher-sheet);
      --usher-disc: rgb(0 0 0 / 0.85);
    }
  }

  @media (forced-colors: active) {
    .media-skin[data-theme="usher"] {
      --usher-print: CanvasText;
      --usher-print-muted: CanvasText;
      --usher-line-unplayed: GrayText;
      --usher-line-buffered: GrayText;
      --usher-hover: Highlight;
      --usher-accent: Highlight;
      --usher-accent-ink: HighlightText;
      --usher-sheet: Canvas;
      --usher-sheet-text: CanvasText;
      --usher-sheet-secondary: CanvasText;
      --usher-sheet-edge: 0 0 0 1px CanvasText;
      --usher-hollow-fill: Canvas;
      --usher-disc: Canvas;
      --media-ring: Highlight;
      --usher-ring-edge: Canvas;
    }
  }
}
`;function n(e){return t.match(RegExp(`${e}\\s*:\\s*([^;]+);`))?.[1]?.trim()}function r(e){if(!e)return;if(/^rgb\(255 255 255\)$/.test(e))return 1;let t=e.match(/rgb\(255 255 255 \/ ([\d.]+)\)/);return t?Number(t[1]):void 0}function i(e){let t=e/255;return t<=.04045?t/12.92:((t+.055)/1.055)**2.4}function a(e,t){let[n,r]=[Math.max(e,t),Math.min(e,t)];return(n+.05)/(r+.05)}var o=Number(n(`--usher-scrim-peak`)),s=r(n(`--usher-print-muted`)),c=r(n(`--usher-line-unplayed`));function l(e,t){return e+(255-e)*t}var u=Number.isFinite(o)?(()=>{let e=Math.round(255*(1-o)),t=i(e);return{peak:o,ground:e,print:a(1,t),muted:s===void 0?void 0:a(i(l(e,s)),t),line:c===void 0?void 0:a(i(l(e,c)),t)}})():void 0;function d(e){return e===void 0?`TODO`:`${e.toFixed(1)}:1`}function f(e){return`${Math.round(e*100)}%`}var p=[{name:`Yellow`,value:`#ffd23f`},{name:`White`,value:`#ffffff`},{name:`Black`,value:`#000000`},{name:`Navy`,value:`#1b2a52`},{name:`Pink`,value:`#ff7eb6`}],m=[{id:`system`,label:`System`,family:``},{id:`serif`,label:`Serif`,family:`ui-serif, "New York", "Iowan Old Style", "Apple Garamond", Georgia, Cambria, "Times New Roman", serif`},{id:`rounded`,label:`Rounded`,family:`ui-rounded, "SF Pro Rounded", "Arial Rounded MT Bold", "Varela Round", "Nunito", system-ui, sans-serif`}],h=`<svg viewBox="0 0 18 18" aria-hidden="true"><path fill="currentColor" d="M3.707 8.293L7 11.586L14.293 4.293A1 1 0 0 1 15.707 5.707L7.707 13.707A1 1 0 0 1 6.293 13.707L2.293 9.707A1 1 0 0 1 3.707 8.293Z"/></svg>`;function g(e,t){let n=parseInt(e.slice(1+t*2,3+t*2),16)/255;return n<=.04045?n/12.92:((n+.055)/1.055)**2.4}function _(e){return .2126*g(e,0)+.7152*g(e,1)+.0722*g(e,2)}function v(e){let t=_(e);return(t+.05)/.05>=1.05/(t+.05)?`#000`:`#fff`}function y(e){let t=document.querySelector(`[data-yours]`),n=t?.querySelector(`[data-swatches]`),r=t?.querySelector(`[data-fonts]`),i=t?.querySelector(`[data-radius]`),a=t?.querySelector(`[data-range]`),o=t?.querySelector(`[data-radius-out]`),s=t?.querySelector(`[data-css]`);if(!t||!n||!r||!i||!a||!o||!s)return;let c={accent:p[0].value,radius:12,font:`system`},l=Number(i.max);t.addEventListener(`submit`,e=>e.preventDefault());let u=(e,t,n,r=!1)=>{let i=document.createElement(`label`),a=document.createElement(`span`),o=document.createElement(`span`);return i.className=r?`swatch swatch-any`:`swatch`,i.style.setProperty(`--c`,t),i.style.setProperty(`--c-ink`,v(t)),a.className=`swatch-chip`,a.innerHTML=h,o.className=`visually-hidden`,o.textContent=e,i.append(n,a,o),i},d=p.map((e,t)=>{let n=document.createElement(`input`);return n.type=`radio`,n.name=`accent`,n.value=e.value,n.checked=t===0,{input:n,label:u(e.name,e.value,n)}}),f=document.createElement(`input`);f.type=`color`,f.value=`#e4572e`;let g=u(`Any colour`,f.value,f,!0);n.append(...d.map(e=>e.label),g);let _=()=>{for(let e of d)e.label.toggleAttribute(`data-checked`,e.input.checked);g.toggleAttribute(`data-checked`,!d.some(e=>e.input.checked))};for(let e of d)e.input.addEventListener(`change`,()=>{c.accent=e.input.value,_(),S()});f.addEventListener(`input`,()=>{for(let e of d)e.input.checked=!1;g.setAttribute(`data-picked`,``),g.style.setProperty(`--c`,f.value),g.style.setProperty(`--c-ink`,v(f.value)),c.accent=f.value,_(),S()}),_();for(let e of m){let t=document.createElement(`label`),n=document.createElement(`input`),i=document.createElement(`span`);t.className=`option`,n.type=`radio`,n.name=`font`,n.value=e.id,n.checked=e.id===c.font,i.textContent=e.label,t.append(n,i),r.append(t),n.addEventListener(`change`,()=>{c.font=e.id,S()})}let y=()=>{let e=Number(i.value);c.radius=e>=l?`full`:e,o.textContent=c.radius===`full`?`Full`:String(e),i.setAttribute(`aria-valuetext`,c.radius===`full`?`Full`:`${e} pixels`),a.style.setProperty(`--at`,`${e/l*100}%`)};i.addEventListener(`input`,()=>{y(),S()}),y();function b(){return c.radius===`full`?`9999px`:`${c.radius}px`}function x(){let e=v(c.accent),t=[`  --media-accent-color: ${c.accent};`];return e===`#fff`&&t.push(`  --media-accent-text-color: #fff;`),t.push(`  --media-border-radius: ${b()};`),c.font!==`system`&&t.push(`  --media-font-family: inherit; /* your page’s font */`),`media-container {\n${t.join(`
`)}\n}`}function S(){s.textContent=x(),e.root.style.setProperty(`--player-radius`,c.radius===`full`?`9999px`:`${c.radius}px`),e.ready.then(({container:e,doc:t})=>{let n=e.style,r=m.find(e=>e.id===c.font);n.setProperty(`--media-accent-color`,c.accent),n.setProperty(`--media-accent-text-color`,v(c.accent)),n.setProperty(`--media-border-radius`,b()),r.family?(n.setProperty(`--media-font-family`,`inherit`),t.body.style.fontFamily=r.family):(n.removeProperty(`--media-font-family`),t.body.style.removeProperty(`font-family`))})}S()}var b=`
html, body { height: 100%; margin: 0; overflow: hidden; background: transparent !important; }
.preview-page { display: block !important; height: 100%; min-height: 0 !important; padding: 0 !important; }
.preview-player { height: 100%; max-width: none !important; }
.preview-player .media-skin { height: 100% !important; aspect-ratio: auto !important; }
`,x={reel:`./media/poster.jpg`,"reel-9x16":`./media/poster-9x16.jpg`,usher:`./media/poster.jpg`},S=new Set;function C(e,t){return`./preview.html#${new URLSearchParams({media:e,ratio:t,scheme:`light`})}`}function w(e){for(let t of e.querySelectorAll(`*`))if(!t.localName.startsWith(`media-`)&&`paused`in t&&`play`in t&&typeof t.play==`function`)return t}function T(e,t=2e4){return new Promise((n,r)=>{let i=performance.now(),a=()=>{let o;try{o=e()}catch{o=void 0}o?n(o):performance.now()-i>t?r(Error(`Timed out waiting for the player`)):setTimeout(a,50)};a()})}var E=class{root;media;ratio;iframe;#e;#t;constructor(e,t={}){this.root=e,this.media=e.dataset.media??`reel`,this.ratio=e.dataset.ratio??`16:9`,this.#t=e.querySelector(`.player-poster`),this.#t||(this.#t=document.createElement(`img`),this.#t.className=`player-poster`,this.#t.alt=``,this.#t.decoding=`async`,t.eager||(this.#t.loading=`lazy`),this.#t.src=x[this.media],e.append(this.#t));let n=this.#t;n.addEventListener(`error`,()=>n.hidden=!0),n.complete&&n.naturalWidth===0&&n.src&&(n.hidden=!0);let r=e.querySelector(`iframe`);r||(r=document.createElement(`iframe`),r.className=`player-frame`,r.title=t.title??`Usher player`,r.allow=`autoplay; fullscreen; picture-in-picture`,t.eager||(r.loading=`lazy`),r.src=C(this.media,this.ratio),e.append(r)),this.iframe=r,this.#n(r),S.add(this)}get ready(){return this.#e}load(e,t){this.media=e,this.ratio=t,this.root.dataset.media=e,this.root.dataset.ratio=t,this.root.removeAttribute(`data-ready`),this.#t&&(this.#t.hidden=!1,this.#t.src=x[e]);let n=document.createElement(`iframe`);return n.className=`player-frame`,n.title=this.iframe.title,n.allow=this.iframe.allow,n.src=C(e,t),this.iframe.replaceWith(n),this.iframe=n,this.#n(n),this.#e}#n(e){this.#e=new Promise((t,n)=>{let r=()=>{let i=e.contentWindow,a=e.contentDocument;if(i&&a&&a.URL!==`about:blank`){if(e.removeEventListener(`load`,r),!a.getElementById(`showcase-frame-css`)){let e=a.createElement(`style`);e.id=`showcase-frame-css`,e.textContent=b,a.head.append(e)}this.root.setAttribute(`data-ready`,``),T(()=>{let e=a.querySelector(`video-player`),t=a.querySelector(`media-container`),n=w(a);return e?.store?.target&&t&&n?{win:i,doc:a,player:e,container:t,media:n}:void 0}).then(e=>{e.media.addEventListener(`play`,()=>{for(let e of S)e!==this&&e.pause()}),t(e)},n)}};e.addEventListener(`load`,r),e.contentDocument?.readyState===`complete`&&r()}),this.#e.catch(()=>void 0)}async pause(){let e=this.iframe.contentDocument,t=e?w(e):void 0;t&&!t.paused&&t.pause()}};async function D(e,t){let{media:n,player:r}=e,i=r.store,a=e=>Math.abs(n.currentTime-e)<.05?Promise.resolve():Promise.race([i.seek(e),new Promise(e=>setTimeout(e,1500))]);if(n.paused||n.pause(),await a(t),!i.state.started){let e=n.muted;n.muted=!0;try{await n.play(),n.pause(),await a(t)}catch{}finally{n.muted=e}}}async function O(e){let t=e=>e.map(e=>({start:e.startTime,end:e.endTime,title:e.text.trim()}));try{return t(await T(()=>{let t=e.player.store.state.chaptersCues;return t?.length?t:void 0},4e3))}catch{}for(let n of e.media.textTracks??[])if(n.kind===`chapters`){n.mode===`disabled`&&(n.mode=`hidden`);try{return t([...await T(()=>n.cues?.length?n.cues:void 0,3e3)])}catch{}}try{let e=await fetch(`./media/chapters.vtt`),t=e.ok?await e.text():``;if(/^\uFEFF?WEBVTT/.test(t))return ee(t)}catch{}return[]}function k(e){return e.trim().split(`:`).map(Number).reduce((e,t)=>e*60+t,0)}function ee(e){let t=[],n=e.replace(/\r/g,``).split(/\n\n+/);for(let e of n){let n=e.split(`
`),r=n.findIndex(e=>e.includes(`-->`));if(r<0)continue;let[i,a]=n[r].split(`-->`).map(e=>k(e.trim().split(/\s+/)[0])),o=n.slice(r+1).join(` `).trim();o&&Number.isFinite(i)&&Number.isFinite(a)&&t.push({start:i,end:a,title:o})}return t}function A(e){if(/busy/i.test(e))return`busy`;if(/black|dark|night|low light|dim/i.test(e))return`dark`;if(/white|bright|snow|sky|sun|day/i.test(e))return`bright`}function j(e,t){let n=e.find(e=>A(e.title)===t);if(n)return{chapter:n,time:n.start+Math.min(4,(n.end-n.start)/3)}}function M(e){let t=Math.max(0,Math.floor(e)),n=Math.floor(t/3600),r=Math.floor(t%3600/60),i=String(t%60).padStart(2,`0`);return n?`${n}:${String(r).padStart(2,`0`)}:${i}`:`${r}:${i}`}var N;function P(e){return N??=e.ready.then(O).catch(()=>[]),N}function te(e){let t=[...document.querySelectorAll(`[data-jump]`)];t.length&&Promise.all([e.ready,P(e)]).then(([e,n])=>{if(!n.some(e=>A(e.title))){for(let e of t)e.disabled=!0,e.title=`This media has no chapters to jump to`;return}let r=()=>{let r=e.media.currentTime,i=n.find(e=>r>=e.start&&r<e.end),a=e.player.store.state.started&&i?A(i.title):void 0;for(let e of t)e.setAttribute(`aria-current`,String(e.dataset.jump===a))};for(let t of[`timeupdate`,`seeked`,`emptied`])e.media.addEventListener(t,r);r();for(let i of t){let t=j(n,i.dataset.jump);t?i.addEventListener(`click`,()=>void D(e,t.time).then(r)):i.disabled=!0}})}function ne(e){for(let t of e){let e=t.root.dataset.park,n=t.root.closest(`figure`)?.querySelector(`[data-park-caption]`);Promise.all([t.ready,P(t)]).then(async([t,r])=>{let i=j(r,e);i?(n&&(n.textContent=`${i.chapter.title}, ${M(i.time)}`),await D(t,i.time)):n&&(n.textContent=`The reel’s chapters are not available.`)})}}var F=(e,t=0,n=1)=>Math.min(n,Math.max(t,e));function re(){let e=document.querySelector(`[data-masthead]`),t=document.querySelector(`[data-nav]`),n=t?.querySelector(`[data-nav-list]`),r=t?.querySelector(`.nav-track`),i=t?.querySelector(`[data-nav-toggle]`);if(!e||!t||!n||!r||!i)return;let a=[...n.querySelectorAll(`a`)],o=a.map(e=>document.getElementById(e.hash.slice(1))),s=[...t.querySelectorAll(`[data-nav-name]`)],c=a.length,l=a.map(()=>{let e=document.createElement(`span`);return e.className=`nav-stretch`,e.append(document.createElement(`i`)),e});r.prepend(...l);let u=-1,d=0,f=e=>{if(e!==u){u=e,a.forEach((t,n)=>{n===e?t.setAttribute(`aria-current`,`location`):t.removeAttribute(`aria-current`)});for(let t of s)t.textContent=a[e].textContent}},p=()=>{d=0;let n=e.offsetHeight,r=Math.max(1,document.documentElement.scrollHeight-innerHeight),a=F(scrollY,0,r),s=[];o.forEach((e,t)=>{let r=e?e.getBoundingClientRect().top+scrollY:0;s.push(t===0?0:Math.max(r-n-innerHeight*.25,s[t-1]+1))});let u=0;for(let e=0;e<c;e++)s[e]<=a&&(u=e);let p;if(a>=r-1)u=c-1,p=1;else{let e=s[u],t=u+1<c?Math.max(s[u+1],e+1):r;p=F((a-e)/(t-e))}let m=(u+p)/c;t.style.setProperty(`--p`,`${(m*100).toFixed(3)}%`),l.forEach((e,t)=>e.style.setProperty(`--fill`,`${(F(m*c-t)*100).toFixed(2)}%`)),f(u),e.toggleAttribute(`data-stuck`,scrollY>1);let h=t.clientWidth,g=i.offsetWidth;t.style.setProperty(`--toggle-x`,`${(m*(h-g)+g/2).toFixed(1)}px`)},m=()=>{d||=requestAnimationFrame(p)};addEventListener(`scroll`,m,{passive:!0}),addEventListener(`resize`,()=>{g(!1),m()}),new ResizeObserver(m).observe(document.body),p();let h=()=>{t.setAttribute(`data-open`,``),i.setAttribute(`aria-expanded`,`true`)};function g(e){t.hasAttribute(`data-open`)&&(t.removeAttribute(`data-open`),i.setAttribute(`aria-expanded`,`false`),e&&i.focus())}i.addEventListener(`click`,()=>t.hasAttribute(`data-open`)?g(!1):h()),t.addEventListener(`keydown`,e=>{e.key===`Escape`&&t.hasAttribute(`data-open`)&&(e.preventDefault(),g(!0))}),n.addEventListener(`click`,e=>{e.target.closest(`a`)&&g(!1)}),document.addEventListener(`pointerdown`,e=>{t.contains(e.target)||g(!1)}),t.addEventListener(`focusout`,e=>{e.relatedTarget&&!t.contains(e.relatedTarget)&&g(!1)})}var I=e=>({id:String(e),label:String(e),hidden:` pixels wide`,width:e,height:Math.round(e*9/16),media:`usher`,ratio:`16:9`}),L=[I(1360),I(896),I(512),I(384),I(320),I(240),{id:`9:16`,label:`9:16`,hidden:` portrait, 360 by 640`,width:360,height:640,media:`reel-9x16`,ratio:`9:16`},{id:`1:1`,label:`1:1`,hidden:` square, 512 by 512`,width:512,height:512,media:`usher`,ratio:`1:1`}];function R(e){let t=document.querySelector(`[data-sizes]`),n=document.querySelector(`[data-stage]`),r=document.querySelector(`[data-stage-player]`),i=document.querySelector(`[data-ruler]`),a=document.querySelector(`[data-stage-note]`);if(!t||!n||!r||!i||!a)return;let o=n.clientWidth,s=L.find(e=>e.ratio===`16:9`&&e.width<=Math.min(896,o))??L[5];for(let e of L){let n=document.createElement(`label`),r=document.createElement(`input`),i=document.createElement(`span`);if(n.className=e.id===`9:16`?`option option-break`:`option`,r.type=`radio`,r.name=`size`,r.value=e.id,r.checked=e===s,i.textContent=e.label,e.hidden){let t=document.createElement(`span`);t.className=`visually-hidden`,t.textContent=e.hidden,i.append(t)}n.append(r,i),t.append(n)}let c=()=>{let t=n.clientWidth,r=Math.min(1,t/s.width);e.root.style.setProperty(`--w`,`${s.width}px`),e.root.style.setProperty(`--h`,`${s.height}px`),e.root.style.setProperty(`--scale`,String(r)),n.style.setProperty(`--shown-w`,`${s.width*r}px`),n.style.setProperty(`--shown-h`,`${s.height*r}px`),i.textContent=`${s.width} × ${s.height}`,a.textContent=r<1?`Shown at ${Math.floor(r*100)}% so it fits this window.`:``},l=()=>void e.ready.then(({container:e})=>{s.ratio===`1:1`?e.style.setProperty(`--media-object-fit`,`cover`):e.style.removeProperty(`--media-object-fit`)});t.addEventListener(`change`,t=>{let n=t.target,r=L.find(e=>e.id===n.value);if(!r||r===s)return;let i=r.media!==e.media;s=r,c(),i?e.load(r.media,r.ratio):(e.ratio=r.ratio,e.root.dataset.ratio=r.ratio),l()}),new ResizeObserver(c).observe(n),c()}function z(e){return e.replace(/&/g,`&amp;`).replace(/</g,`&lt;`).replace(/>/g,`&gt;`).replace(/"/g,`&quot;`)}function B(e){return z(e).replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g,`<a href="$2">$1</a>`).replace(/(^|[\s(])(https?:\/\/[^\s<)]+)/g,`$1<a href="$2">$2</a>`).replace(/\*\*([^*]+)\*\*/g,`<strong>$1</strong>`).replace(/(^|[^*])\*([^*]+)\*/g,`$1<em>$2</em>`).replace(/`([^`]+)`/g,`<code>$1</code>`)}function V(e){let t=[],n=null,r=[],i=()=>{r.length&&t.push(`<p>${B(r.join(` `))}</p>`),r=[],n&&t.push(`<ul>${n.map(e=>`<li>${B(e)}</li>`).join(``)}</ul>`),n=null};for(let a of e.replace(/\r/g,``).split(`
`)){let e=a.trim();if(!e){i();continue}let o=e.match(/^#{1,6}\s+(.*)$/),s=e.match(/^[-*+]\s+(.*)$/);o?(i(),/^#\s/.test(e)||t.push(`<h3>${B(o[1])}</h3>`)):s?(r.length&&i(),(n??=[]).push(s[1])):n&&/^\s{2,}/.test(a)?n[n.length-1]+=` ${e}`:(n&&i(),r.push(e))}return i(),t.join(``)}async function H(e){try{let t=await fetch(`./media/ATTRIBUTION.md`),n=t.headers.get(`content-type`)??``;if(!t.ok||n.includes(`html`))return;let r=await t.text();if(!r.trim()||/^\s*<!doctype/i.test(r))return;e.innerHTML=V(r)}catch{}}var U=e=>document.querySelector(e);function ie(e,t,n=`100% 0px`){if(!e)return;let r=new IntersectionObserver(e=>{e.some(e=>e.isIntersecting)&&(r.disconnect(),t())},{rootMargin:n});r.observe(e)}var W=U(`[data-player="hero"]`);if(W){let e=new E(W,{eager:!0,title:`Usher player with the demo reel`}),t=!0;te(e),new IntersectionObserver(([e])=>t=!!e?.isIntersecting,{threshold:.5}).observe(W),document.addEventListener(`keydown`,n=>{!t||n.altKey||n.ctrlKey||n.metaKey||n.key!==`g`&&n.key!==`?`||n.target.closest(`input, textarea, select, [contenteditable]`)||(e.ready.then(async e=>{e.player.store.state.started||await D(e,Math.min(4,(e.media.duration||0)/3)),requestAnimationFrame(()=>e.container.dispatchEvent(new e.win.KeyboardEvent(`keydown`,{key:n.key,bubbles:!0,cancelable:!0})))}),n.preventDefault())})}var ae=e(async()=>{let{containerTag:e,features:t,mediaComment:n,renderShortcuts:r,touchNotes:i}=await import(`./keys-3vTU1xbp.js`);return{containerTag:e,features:t,mediaComment:n,renderShortcuts:r,touchNotes:i}},__vite__mapDeps([0,1]),import.meta.url).then(({containerTag:e,features:t,mediaComment:n,renderShortcuts:r,touchNotes:i})=>{let a=U(`[data-hint]`);if(a&&(t.typeTime||t.shortcutSheet)){let e=[];t.typeTime&&e.push(`Press <kbd>G</kbd> to type a time.`),t.shortcutSheet&&e.push(`Press <kbd>?</kbd> for shortcuts.`),a.innerHTML=e.join(` `),a.hidden=!1}let o=U(`[data-job-typed]`);o&&t.typeTime&&(o.textContent=`Press G, or Enter on it, or double-click it, then type a time to go there.`);let s=U(`[data-shortcuts]`);s&&r(s);let c=U(`[data-touch]`);c&&c.replaceChildren(...i().map(e=>{let t=document.createElement(`li`),n=document.createElement(`strong`);return n.textContent=e.title,t.append(n,` ${e.text}`),t}));let l=U(`[data-markup]`);if(l){let[t,...r]=e.slice(1,-1).split(/\s+(?=[\w-]+=")/);l.textContent=[`<video-player>`,r.length>1?[`  <${t}`,...r.map(e=>`    ${e}`)].join(`
`)+`>`:`  ${e}`,`    ${n}`,`    <video src="movie.mp4" playsinline></video>`,`    <!-- …the rest of skin.html… -->`,`  </media-container>`,`</video-player>`].join(`
`)}});re();var G=U(`[data-strip-list]`),K=U(`[data-strip="prev"]`),q=U(`[data-strip="next"]`);if(G&&K&&q){let e=()=>{let e=G.querySelector(`li`);return e?e.getBoundingClientRect().width+24:G.clientWidth*.8},t=()=>{K.disabled=G.scrollLeft<=1,q.disabled=G.scrollLeft>=G.scrollWidth-G.clientWidth-1},n=matchMedia(`(prefers-reduced-motion: reduce)`),r=t=>G.scrollBy({left:t*e(),behavior:n.matches?`auto`:`smooth`});K.addEventListener(`click`,()=>r(-1)),q.addEventListener(`click`,()=>r(1)),G.addEventListener(`scroll`,t,{passive:!0}),new ResizeObserver(t).observe(G),t()}ne([...document.querySelectorAll(`[data-player="footage"]`)].map(e=>new E(e,{title:`Usher player paused on ${e.dataset.park} footage`})));var J=U(`[data-contrast]`),Y=U(`[data-scrim-note]`);if(u){let e=`Over pure white, the worst case, the scrim peaks at ${f(u.peak)} black, so white print reads at ${d(u.print)}, the duration at ${d(u.muted)} and the unplayed line at ${d(u.line)}.`;J&&(J.textContent=e),Y&&(Y.textContent=`One smoothstep scrim, nine eased stops in oklab, darkens the picture behind the line and the row without flattening it. It peaks at ${f(u.peak)} black where the glyphs sit, enough for white print to reach ${d(u.print)} over pure white; more contrast or reduced transparency raises it further.`)}else J&&(J.textContent=`TODO: contrast over bright, dark and busy frames.`),Y&&(Y.textContent=`TODO: the scrim and its contrast.`);var X=U(`[data-player="sizes"]`);X&&R(new E(X,{title:`Usher player at the chosen size`}));var Z=U(`[data-player="yours"]`);Z&&y(new E(Z,{title:`Usher player with your settings`}));var Q=U(`[data-icons]`),oe=e(async()=>{let{renderIcons:e}=await import(`./icons-_4vGlapu.js`);return{renderIcons:e}},__vite__mapDeps([2,3]),import.meta.url).then(({renderIcons:e})=>{Q&&e(Q)});for(let e of document.querySelectorAll(`[data-copy]`)){let t=document.createElement(`span`);t.className=`visually-hidden`,t.setAttribute(`aria-live`,`polite`),e.after(t),e.addEventListener(`click`,async()=>{let n=document.getElementById(e.dataset.copy);if(n){try{await navigator.clipboard.writeText(n.textContent??``),e.textContent=`Copied`,t.textContent=`Copied to the clipboard`}catch{let r=document.createRange();r.selectNodeContents(n),getSelection()?.removeAllRanges(),getSelection()?.addRange(r),e.textContent=`Selected`,t.textContent=`Selected. Press Command or Control C to copy.`}setTimeout(()=>{e.textContent=`Copy`,t.textContent=``},2e3)}})}var $=U(`[data-attribution]`);if(ie($,()=>{$&&H($)}),location.hash.length>1){let e=document.getElementById(decodeURIComponent(location.hash.slice(1))),t=!1;for(let e of[`wheel`,`touchstart`,`keydown`,`pointerdown`])addEventListener(e,()=>t=!0,{once:!0,passive:!0});Promise.all([ae,oe]).then(()=>requestAnimationFrame(()=>{t||e?.scrollIntoView({behavior:`instant`})}))}