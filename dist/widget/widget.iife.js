(function(){"use strict";const C={apiUrl:"https://api.ahaget.ai",idleThreshold:3e4,primaryColor:"#6366f1",gradFrom:"#6366f1",gradTo:"#8b5cf6",position:"bottom-right"};function ye(){const e=Array.from(document.querySelectorAll("script[src]")).find(a=>a.src.includes("ahaget")||a.dataset.ahagetKey!=null);if(!e)return{};const t=e.dataset,o={};t.ahagetKey&&(o.apiKey=t.ahagetKey),t.ahagetUserId&&(o.userId=t.ahagetUserId),t.ahagetApiUrl&&(o.apiUrl=t.ahagetApiUrl);const n={};t.ahagetPlan&&(n.plan=t.ahagetPlan),t.ahagetRole&&(n.role=t.ahagetRole),t.ahagetSegment&&(n.segment=t.ahagetSegment),t.ahagetAccountAge&&(n.accountAge=t.ahagetAccountAge);try{if(t.ahagetMetadata){const a=JSON.parse(t.ahagetMetadata);Object.assign(n,a)}}catch{}return Object.keys(n).length>0&&(o.metadata=n),o}class we{constructor(e,t,o){this.idleTimer=null,this.triggered=!1,this.resetIdleTimer=()=>{this.idleTimer&&clearTimeout(this.idleTimer),this.idleTimer=setTimeout(()=>this.fire("idle"),this.idleThreshold)},this.handleActivity=()=>{this.triggered||this.resetIdleTimer()},this.handleMouseLeave=n=>{n.clientY<=0&&!this.triggered&&this.fire("exit_intent")},this.idleThreshold=e,this.onTrigger=t,this.rageClickDetector=new Ee(n=>{o==null||o("rage_click",{target:n}),this.fire("rage_click",{target:n})}),this.scrollDepthTracker=new Te(n=>{o==null||o("scroll_depth",{depth:n})}),this.formAbandonDetector=new Ce(n=>{o==null||o("form_abandon",{formId:n}),this.fire("form_abandon",{formId:n})})}start(){this.resetIdleTimer(),["mousemove","keydown","scroll","click","touchstart"].forEach(t=>document.addEventListener(t,this.handleActivity,{passive:!0})),document.addEventListener("mouseleave",this.handleMouseLeave),this.rageClickDetector.start(),this.scrollDepthTracker.start(),this.formAbandonDetector.start()}stop(){this.idleTimer&&clearTimeout(this.idleTimer),["mousemove","keydown","scroll","click","touchstart"].forEach(t=>document.removeEventListener(t,this.handleActivity)),document.removeEventListener("mouseleave",this.handleMouseLeave),this.rageClickDetector.stop(),this.scrollDepthTracker.stop(),this.formAbandonDetector.stop()}fire(e,t){this.triggered||(this.triggered=!0,this.stop(),this.onTrigger(e,t))}}const J=3,ve=600,Se=30;class Ee{constructor(e){this.clicks=[],this.handleClick=t=>{var n,a,s,r;const o=Date.now();if(this.clicks.push({x:t.clientX,y:t.clientY,t:o}),this.clicks=this.clicks.filter(l=>o-l.t<=ve),this.clicks.length>=J){const l=this.clicks.slice(-J),p=l[0];if(l.every(c=>Math.hypot(c.x-p.x,c.y-p.y)<=Se)){this.clicks=[];const c=((a=(n=t.target)==null?void 0:n.getAttribute)==null?void 0:a.call(n,"id"))||((r=(s=t.target)==null?void 0:s.tagName)==null?void 0:r.toLowerCase())||"unknown";this.onRageClick(c)}}},this.onRageClick=e}start(){document.addEventListener("click",this.handleClick,{passive:!0})}stop(){document.removeEventListener("click",this.handleClick)}}class Te{constructor(e){this.milestones=[25,50,75,100],this.fired=new Set,this.handleScroll=()=>{const t=window.scrollY+window.innerHeight,o=document.documentElement.scrollHeight;if(o===0)return;const n=Math.round(t/o*100);for(const a of this.milestones)n>=a&&!this.fired.has(a)&&(this.fired.add(a),this.onMilestone(a))},this.onMilestone=e}start(){window.addEventListener("scroll",this.handleScroll,{passive:!0})}stop(){window.removeEventListener("scroll",this.handleScroll)}}class Ce{constructor(e){this.touchedForms=new Set,this.submittedForms=new Set,this.handleFocusIn=t=>{const o=t.target;if(!["INPUT","TEXTAREA","SELECT"].includes(o.tagName))return;const n=o.closest("form"),a=(n==null?void 0:n.id)||(n==null?void 0:n.getAttribute("name"))||"form_"+this.getFormIndex(n);this.touchedForms.add(a)},this.handleSubmit=t=>{const o=t.target,n=(o==null?void 0:o.id)||(o==null?void 0:o.getAttribute("name"))||"unknown";this.submittedForms.add(n)},this.handleBeforeUnload=()=>{this.touchedForms.forEach(t=>{this.submittedForms.has(t)||this.onAbandon(t)})},this.onAbandon=e}start(){document.addEventListener("focusin",this.handleFocusIn,{passive:!0}),document.addEventListener("submit",this.handleSubmit,{passive:!0}),window.addEventListener("beforeunload",this.handleBeforeUnload),window.addEventListener("pagehide",this.handleBeforeUnload)}stop(){document.removeEventListener("focusin",this.handleFocusIn),document.removeEventListener("submit",this.handleSubmit),window.removeEventListener("beforeunload",this.handleBeforeUnload),window.removeEventListener("pagehide",this.handleBeforeUnload)}getFormIndex(e){if(!e)return"unknown";const t=Array.from(document.querySelectorAll("form"));return String(t.indexOf(e))}}async function W(i,e,t,o={}){fetch(`${i.apiUrl}/api/v1/events`,{method:"POST",headers:{"Content-Type":"application/json","X-API-Key":i.apiKey},body:JSON.stringify({endUserId:e,eventType:t,properties:o})}).catch(()=>{})}async function ke(i,e,t,o,n){try{const a=new URLSearchParams({userId:e,page:t});o&&a.set("metadata",JSON.stringify(o));const s=await fetch(`${i.apiUrl}/api/v1/triggers/evaluate?${a}`,{headers:{"X-API-Key":i.apiKey}});return s.ok?(await s.json()).match:null}catch{return null}}async function $e(i){try{const e=await fetch(`${i.apiUrl}/api/v1/config/branding`,{headers:{"X-API-Key":i.apiKey}});return e.ok?e.json():null}catch{return null}}async function _e(i,e){try{const t=await fetch(`${i.apiUrl}/api/v1/proactive/pending?userId=${encodeURIComponent(e)}`,{headers:{"X-API-Key":i.apiKey}});return t.ok?(await t.json()).message:null}catch{return null}}function Ae(i,e,t){const o=`${i.apiUrl}/api/v1/session/abandon`,n=JSON.stringify({sessionId:e,stepId:t,reason:"user_closed"});try{navigator.sendBeacon(o+"?key="+encodeURIComponent(i.apiKey),new Blob([n],{type:"application/json"}))}catch{}}async function G(i,e,t){fetch(`${i.apiUrl}/api/v1/proactive/${t}`,{method:"POST",headers:{"Content-Type":"application/json","X-API-Key":i.apiKey},body:JSON.stringify({messageId:e})}).catch(()=>{})}const q=360,V=40;function Ie(i){const{primaryColor:e,gradFrom:t,gradTo:o}=i,n=`
    /* ── Host-page nudge ───────────────────────────────────────────────────── */
    body.__ahaget-open {
      margin-right: ${q}px !important;
      transition: margin-right 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }
    body.__ahaget-collapsed {
      margin-right: ${V}px !important;
      transition: margin-right 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }

    /* ── Root container ────────────────────────────────────────────────────── */
    #oai-root * { box-sizing: border-box; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif; }

    /* ── Side panel ────────────────────────────────────────────────────────── */
    #oai-window {
      position: fixed;
      top: 0;
      right: 0;
      width: ${q}px;
      height: 100vh;
      background: #ffffff;
      border-left: 1px solid #e2e8f0;
      box-shadow: -4px 0 24px rgba(0, 0, 0, 0.08);
      display: flex;
      flex-direction: column;
      z-index: 2147483640;
      overflow: hidden;
      transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }
    #oai-window.oai-hidden {
      transform: translateX(100%);
    }
    #oai-window.oai-collapsed {
      transform: translateX(${q-V}px);
    }

    /* ── Collapse toggle tab (on left edge of panel) ───────────────────────── */
    #oai-toggle {
      position: absolute;
      left: -1px;
      top: 50%;
      transform: translateY(-50%);
      width: 20px;
      height: 56px;
      background: white;
      border: 1px solid #e2e8f0;
      border-right: none;
      border-radius: 8px 0 0 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      z-index: 1;
      box-shadow: -3px 0 10px rgba(0,0,0,0.06);
      transition: background 0.15s;
    }
    #oai-toggle:hover { background: #f8fafc; }
    #oai-toggle svg {
      width: 12px;
      height: 12px;
      color: #94a3b8;
      transition: transform 0.2s ease;
    }
    #oai-window.oai-collapsed #oai-toggle svg {
      transform: rotate(180deg);
    }

    /* ── Header ────────────────────────────────────────────────────────────── */
    #oai-header {
      background: linear-gradient(160deg, ${t} 0%, ${o} 100%);
      padding: 16px 16px 14px;
      flex-shrink: 0;
    }
    #oai-header-top {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 14px;
    }
    #oai-avatar {
      width: 34px;
      height: 34px;
      background: rgba(255,255,255,0.25);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 17px;
      flex-shrink: 0;
      position: relative;
    }
    #oai-avatar::after {
      content: '';
      position: absolute;
      bottom: 0;
      right: 0;
      width: 9px;
      height: 9px;
      background: #22c55e;
      border-radius: 50%;
      border: 2px solid white;
    }
    #oai-header-text { flex: 1; min-width: 0; }
    #oai-header-title { font-weight: 700; font-size: 14px; color: white; margin: 0; line-height: 1.2; }
    #oai-header-sub { font-size: 11px; color: rgba(255,255,255,0.75); margin: 2px 0 0; }

    /* ── Step progress nav ─────────────────────────────────────────────────── */
    #oai-steps-nav {
      display: flex;
      align-items: center;
      gap: 0;
    }
    .oai-step-node {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
      flex: 1;
      position: relative;
    }
    .oai-step-node:not(:last-child)::after {
      content: '';
      position: absolute;
      top: 11px;
      left: 50%;
      width: 100%;
      height: 2px;
      background: rgba(255,255,255,0.25);
    }
    .oai-step-node.done::after { background: rgba(255,255,255,0.7); }
    .oai-step-circle {
      width: 22px;
      height: 22px;
      border-radius: 50%;
      background: rgba(255,255,255,0.2);
      border: 2px solid rgba(255,255,255,0.4);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 10px;
      font-weight: 700;
      color: white;
      z-index: 1;
      transition: all 0.3s ease;
      position: relative;
    }
    .oai-step-node.active .oai-step-circle {
      background: white;
      color: ${e};
      border-color: white;
      box-shadow: 0 0 0 3px rgba(255,255,255,0.3);
    }
    .oai-step-node.done .oai-step-circle {
      background: rgba(255,255,255,0.9);
      color: ${e};
      border-color: white;
    }
    .oai-step-label {
      font-size: 9px;
      color: rgba(255,255,255,0.6);
      text-align: center;
      max-width: 60px;
      line-height: 1.2;
      overflow: hidden;
      display: -webkit-box;
      -webkit-line-clamp: 1;
      -webkit-box-orient: vertical;
    }
    .oai-step-node.active .oai-step-label { color: rgba(255,255,255,0.95); font-weight: 600; }
    .oai-step-node.done .oai-step-label { color: rgba(255,255,255,0.8); }

    /* ── Progress bar strip (below header) ────────────────────────────────── */
    #oai-progress-wrap {
      padding: 8px 14px 6px;
      border-bottom: 1px solid #f1f5f9;
      flex-shrink: 0;
      background: white;
    }
    #oai-step-title {
      font-size: 11px;
      color: ${e};
      font-weight: 600;
      margin-bottom: 4px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    #oai-progress-track {
      background: #e2e8f0;
      border-radius: 999px;
      height: 4px;
      overflow: hidden;
    }
    #oai-progress-bar {
      height: 100%;
      background: ${e};
      border-radius: 999px;
      transition: width 0.4s ease;
      width: 0%;
    }
    #oai-progress-text {
      font-size: 10px;
      color: #94a3b8;
      margin-top: 3px;
    }

    /* ── Messages area ─────────────────────────────────────────────────────── */
    #oai-messages {
      flex: 1;
      overflow-y: auto;
      padding: 16px 14px;
      display: flex;
      flex-direction: column;
      gap: 12px;
      background: #f8fafc;
    }
    #oai-messages::-webkit-scrollbar { width: 4px; }
    #oai-messages::-webkit-scrollbar-track { background: transparent; }
    #oai-messages::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }

    /* AI message */
    .oai-msg-ai {
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 14px 14px 14px 4px;
      padding: 11px 13px;
      font-size: 13px;
      line-height: 1.55;
      color: #1e293b;
      max-width: 92%;
      align-self: flex-start;
      box-shadow: 0 1px 4px rgba(0,0,0,0.05);
      animation: oai-msg-in 0.2s ease both;
    }

    /* User message */
    .oai-msg-user {
      background: linear-gradient(135deg, ${t}, ${o});
      border-radius: 14px 14px 4px 14px;
      padding: 10px 13px;
      font-size: 13px;
      line-height: 1.55;
      color: white;
      max-width: 85%;
      align-self: flex-end;
      box-shadow: 0 2px 8px rgba(99,102,241,0.28);
      animation: oai-msg-in 0.2s ease both;
    }

    /* Step label pill */
    .oai-step-pill {
      align-self: center;
      background: ${e};
      color: white;
      font-size: 10px;
      font-weight: 600;
      padding: 3px 11px;
      border-radius: 999px;
      letter-spacing: 0.02em;
      margin-bottom: -4px;
    }

    /* ── Quick-reply chips ──────────────────────────────────────────────────── */
    .oai-chips {
      display: flex;
      flex-wrap: wrap;
      gap: 7px;
      margin-top: 8px;
    }
    .oai-chip {
      border: 1.5px solid ${e};
      color: ${e};
      background: rgba(99,102,241,0.05);
      border-radius: 20px;
      padding: 6px 13px;
      font-size: 12px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.15s ease;
      animation: oai-chip-in 0.25s ease both;
    }
    .oai-chip:hover {
      background: ${e};
      color: white;
      transform: translateY(-1px);
    }

    /* ── Feedback buttons ───────────────────────────────────────────────────── */
    .oai-feedback {
      display: flex;
      gap: 4px;
      margin-top: 6px;
    }
    .oai-feedback-btn {
      background: none;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      font-size: 12px;
      padding: 2px 6px;
      cursor: pointer;
      opacity: 0.5;
      transition: opacity 0.15s, border-color 0.15s;
    }
    .oai-feedback-btn:hover:not(:disabled) { opacity: 1; border-color: #94a3b8; }
    .oai-feedback-btn.oai-feedback-active  { opacity: 1; border-color: ${e}; }
    .oai-feedback-btn:disabled             { cursor: default; }

    /* ── Action toast ───────────────────────────────────────────────────────── */
    .oai-action-toast {
      background: #f0fdf4;
      border: 1px solid #bbf7d0;
      border-radius: 10px;
      padding: 9px 12px;
      font-size: 12px;
      color: #15803d;
      display: flex;
      align-items: center;
      gap: 7px;
      align-self: flex-start;
      max-width: 92%;
      animation: oai-msg-in 0.2s ease both;
    }
    .oai-action-toast .oai-toast-icon { font-size: 13px; flex-shrink: 0; }

    /* ── Streaming / typing ─────────────────────────────────────────────────── */
    .oai-streaming::after {
      content: '▋';
      display: inline-block;
      animation: oai-cursor 0.7s steps(1) infinite;
      margin-left: 2px;
      color: ${e};
    }
    .oai-typing {
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 14px 14px 14px 4px;
      padding: 12px 16px;
      align-self: flex-start;
      display: flex;
      gap: 5px;
      align-items: center;
    }
    .oai-dot-bounce {
      width: 6px;
      height: 6px;
      background: #94a3b8;
      border-radius: 50%;
      animation: oai-bounce 1.2s infinite ease-in-out;
    }
    .oai-dot-bounce:nth-child(1) { animation-delay: 0s; }
    .oai-dot-bounce:nth-child(2) { animation-delay: 0.18s; }
    .oai-dot-bounce:nth-child(3) { animation-delay: 0.36s; }

    /* ── Celebration ────────────────────────────────────────────────────────── */
    .oai-celebration {
      background: linear-gradient(135deg, #6366f1, #8b5cf6, #ec4899);
      border-radius: 14px;
      padding: 18px 16px;
      color: white;
      text-align: center;
      align-self: stretch;
      animation: oai-celebrate 0.5s cubic-bezier(.34,1.56,.64,1) both;
    }
    .oai-celebration-emoji { font-size: 32px; margin-bottom: 8px; display: block; }
    .oai-celebration-headline { font-size: 15px; font-weight: 700; margin-bottom: 5px; }
    .oai-celebration-insight { font-size: 12.5px; opacity: 0.9; line-height: 1.5; }

    /* ── Input area ─────────────────────────────────────────────────────────── */
    #oai-input-row {
      display: flex;
      align-items: flex-end;
      gap: 8px;
      padding: 11px 13px;
      border-top: 1px solid #e2e8f0;
      background: white;
      flex-shrink: 0;
    }
    #oai-input {
      flex: 1;
      border: 1.5px solid #e2e8f0;
      border-radius: 11px;
      padding: 8px 12px;
      font-size: 13px;
      outline: none;
      resize: none;
      color: #1e293b;
      background: #f8fafc;
      transition: border-color 0.15s, background 0.15s;
      line-height: 1.4;
      max-height: 90px;
    }
    #oai-input:focus { border-color: ${e}; background: white; }
    #oai-input::placeholder { color: #94a3b8; }
    #oai-input:disabled { opacity: 0.5; cursor: not-allowed; }
    #oai-send {
      width: 36px;
      height: 36px;
      border-radius: 10px;
      background: ${e};
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      transition: opacity 0.15s, transform 0.15s;
    }
    #oai-send:hover:not(:disabled) { transform: scale(1.05); }
    #oai-send:disabled { opacity: 0.4; cursor: not-allowed; }
    #oai-send svg { width: 15px; height: 15px; fill: white; }

    /* ── Footer ─────────────────────────────────────────────────────────────── */
    #oai-footer {
      text-align: center;
      font-size: 10px;
      color: #94a3b8;
      padding: 5px 0 7px;
      background: white;
      flex-shrink: 0;
    }
    #oai-footer a { color: #6366f1; text-decoration: none; }

    /* ── Animations ─────────────────────────────────────────────────────────── */
    @keyframes oai-msg-in {
      from { opacity: 0; transform: translateY(5px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    @keyframes oai-chip-in {
      from { opacity: 0; transform: scale(0.9); }
      to   { opacity: 1; transform: scale(1); }
    }
    @keyframes oai-celebrate {
      from { opacity: 0; transform: scale(0.85); }
      to   { opacity: 1; transform: scale(1); }
    }
    @keyframes oai-bounce {
      0%, 80%, 100% { transform: translateY(0); }
      40%           { transform: translateY(-5px); }
    }
    @keyframes oai-cursor {
      0%, 100% { opacity: 1; }
      50%       { opacity: 0; }
    }
    @keyframes oai-pulse {
      0%, 100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(239,68,68,0.5); }
      50%       { transform: scale(1.15); box-shadow: 0 0 0 5px rgba(239,68,68,0); }
    }

    /* ── Upgrade card (suggest_upgrade action) ─────────────────────────────── */
    .oai-upgrade-card {
      background: linear-gradient(135deg, #fdf4ff, #fff1f2);
      border: 1.5px solid #f0abfc;
      border-radius: 14px;
      padding: 16px 16px 14px;
      align-self: stretch;
      animation: oai-msg-in 0.25s ease both;
      box-shadow: 0 4px 16px rgba(217,70,239,0.1);
    }
    .oai-upgrade-badge {
      display: inline-block;
      background: linear-gradient(135deg, #d946ef, #ec4899);
      color: white;
      font-size: 10px;
      font-weight: 700;
      padding: 3px 9px;
      border-radius: 999px;
      letter-spacing: 0.04em;
      margin-bottom: 9px;
      text-transform: uppercase;
    }
    .oai-upgrade-headline {
      font-size: 14px;
      font-weight: 700;
      color: #1e293b;
      margin-bottom: 6px;
      line-height: 1.3;
    }
    .oai-upgrade-pitch {
      font-size: 12.5px;
      color: #475569;
      line-height: 1.55;
      margin-bottom: 14px;
    }
    .oai-upgrade-actions {
      display: flex;
      gap: 8px;
      align-items: center;
    }
    .oai-upgrade-cta {
      display: inline-block;
      background: linear-gradient(135deg, #d946ef, #ec4899);
      color: white;
      text-decoration: none;
      padding: 8px 16px;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 700;
      transition: opacity 0.15s, transform 0.15s;
    }
    .oai-upgrade-cta:hover { opacity: 0.88; transform: translateY(-1px); }
    .oai-upgrade-dismiss {
      background: none;
      border: none;
      font-size: 12px;
      color: #94a3b8;
      cursor: pointer;
      padding: 0 4px;
      transition: color 0.15s;
    }
    .oai-upgrade-dismiss:hover { color: #64748b; }

    /* ── Mobile: full-width bottom sheet ────────────────────────────────────── */
    @media (max-width: 640px) {
      body.__ahaget-open, body.__ahaget-collapsed {
        margin-right: 0 !important;
        /* Prevent content shifting behind the sheet */
        padding-bottom: 55vh !important;
      }
      #oai-window {
        width: 100vw;
        top: auto;
        right: 0;
        left: 0;
        bottom: 0;
        height: 55vh;
        min-height: 320px;
        border-left: none;
        border-top: 1px solid #e2e8f0;
        border-radius: 16px 16px 0 0;
        box-shadow: 0 -8px 32px rgba(0,0,0,0.12);
        /* Slide up from the bottom */
        transform: translateY(0);
        transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      }
      #oai-window.oai-hidden {
        transform: translateY(100%);
      }
      #oai-window.oai-collapsed {
        transform: translateY(calc(55vh - 48px));
      }
      /* Drag handle instead of arrow toggle on mobile */
      #oai-toggle {
        position: absolute;
        left: 50%;
        top: 8px;
        transform: translateX(-50%);
        width: 40px;
        height: 5px;
        background: #cbd5e1;
        border-radius: 999px;
        border: none;
        box-shadow: none;
        cursor: grab;
      }
      #oai-toggle svg { display: none; }
      /* Larger tap targets on mobile */
      .oai-chip { padding: 9px 16px; font-size: 14px; }
      #oai-input { font-size: 16px; } /* prevent iOS zoom on focus */
      .oai-msg-ai, .oai-msg-user { font-size: 14px; }
      /* Cursor animation: skip movement on mobile (too small to be meaningful) */
      #__ahaget_cursor__ { display: none !important; }
    }

    /* ── Degradation card ──────────────────────────────────────────────────── */
    .oai-degrade-card {
      background: #fff8e1;
      border: 1.5px solid #f59e0b;
      border-radius: 10px;
      padding: 14px 16px;
      margin: 8px 0;
      font-size: 13px;
    }
    .oai-degrade-header {
      font-weight: 700;
      color: #92400e;
      margin-bottom: 8px;
    }
    .oai-degrade-instruction {
      color: #1a1a1a;
      margin-bottom: 6px;
      line-height: 1.5;
    }
    .oai-degrade-reason {
      color: #6b7280;
      font-size: 11px;
      margin-bottom: 12px;
    }
    .oai-degrade-actions { display: flex; gap: 8px; }
    .oai-degrade-done {
      background: #f59e0b;
      color: white;
      border: none;
      border-radius: 6px;
      padding: 6px 14px;
      cursor: pointer;
      font-size: 12px;
      font-weight: 600;
    }
    .oai-degrade-escalate {
      background: transparent;
      color: #6b7280;
      border: 1px solid #d1d5db;
      border-radius: 6px;
      padding: 6px 14px;
      cursor: pointer;
      font-size: 12px;
    }

    /* ── Plan checklist card ────────────────────────────────────────────────── */
    .oai-plan-card {
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 14px 14px 10px;
      align-self: stretch;
      animation: oai-msg-in 0.25s ease both;
      box-shadow: 0 1px 4px rgba(0,0,0,0.05);
    }
    .oai-plan-header {
      font-size: 11px;
      font-weight: 700;
      color: ${e};
      text-transform: uppercase;
      letter-spacing: 0.06em;
      margin-bottom: 10px;
    }
    .oai-plan-list {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .oai-plan-phase {
      display: flex;
      align-items: flex-start;
      gap: 10px;
      padding: 8px 10px;
      border-radius: 8px;
      transition: background 0.2s ease;
    }
    .oai-plan-phase.oai-plan-pending {
      opacity: 0.55;
    }
    .oai-plan-phase.oai-plan-active {
      background: rgba(99,102,241,0.07);
    }
    .oai-plan-phase.oai-plan-done {
      opacity: 0.75;
    }
    .oai-plan-phase-circle {
      width: 22px;
      height: 22px;
      border-radius: 50%;
      border: 2px solid #cbd5e1;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 10px;
      font-weight: 700;
      color: #94a3b8;
      flex-shrink: 0;
      margin-top: 1px;
      transition: all 0.3s ease;
    }
    .oai-plan-phase.oai-plan-active .oai-plan-phase-circle {
      border-color: ${e};
      color: ${e};
      background: rgba(99,102,241,0.1);
    }
    .oai-plan-phase.oai-plan-done .oai-plan-phase-circle {
      border-color: #22c55e;
      background: #22c55e;
      color: white;
    }
    .oai-plan-phase-title {
      font-size: 12.5px;
      font-weight: 600;
      color: #1e293b;
      line-height: 1.3;
    }
    .oai-plan-phase.oai-plan-done .oai-plan-phase-title {
      text-decoration: line-through;
      color: #94a3b8;
    }
    .oai-plan-phase-desc {
      font-size: 11px;
      color: #64748b;
      margin-top: 2px;
      line-height: 1.4;
    }
  `,a=document.createElement("style");a.id="oai-styles",a.textContent=n,document.head.appendChild(a)}let Z=new Map;function Le(){return Z}let U=[];const Pe=10;function Me(){const i=[...U];return U=[],i}function Ue(i){U.length<Pe&&U.push(i)}function Ne(i){var o;if(i.closest&&i.closest("#oai-root"))return null;const e=i.getAttribute("role"),t=((o=i.innerText)==null?void 0:o.trim().slice(0,80))??"";return t?e==="alert"?`[ALERT] ${t}`:e==="dialog"?`[DIALOG OPENED] ${t.slice(0,40)}`:e==="status"?`[STATUS] ${t}`:/\b(error|toast|notification|snackbar|alert)/i.test(i.className)?`[DYNAMIC] ${t}`:null:null}function ze(){if(typeof MutationObserver>"u")return;new MutationObserver(e=>{for(const t of e)for(const o of Array.from(t.addedNodes)){if(!(o instanceof HTMLElement))continue;const n=Ne(o);n&&Ue(n)}}).observe(document.body,{childList:!0,subtree:!0})}function Re(i){if(i.id&&!i.id.startsWith("oai-"))return`#${i.id}`;const e=i.getAttribute("name");if(e)return`[name="${e}"]`;const t=i.getAttribute("data-testid")||i.getAttribute("data-cy");if(t)return`[data-testid="${t}"]`;const o=i.getAttribute("aria-label");if(o)return`[aria-label="${o}"]`;const n=Array.from(i.classList).filter(a=>!a.startsWith("oai-")).slice(0,2).join(".");return n?`${i.tagName.toLowerCase()}.${n}`:i.tagName.toLowerCase()}function Oe(i){const e=i.id;if(e){const o=document.querySelector(`label[for="${e}"]`);if(o)return o.innerText.trim()}const t=i.closest("label");return t?t.innerText.replace(i.value??"","").trim():""}function Be(i){const e=i.tagName.toLowerCase(),t={button:"button",a:"link",input:"textbox",select:"combobox",textarea:"textbox",h1:"heading",h2:"heading",h3:"heading",nav:"navigation"};return i.getAttribute("role")||t[e]||e}function De(i){const e=i.getBoundingClientRect();return{x:Math.round(e.left),y:Math.round(e.top),w:Math.round(e.width),h:Math.round(e.height)}}function $(i,e,t,o){return{tag:e,selector:Re(i),text:t,type:o,ariaLabel:i.getAttribute("aria-label")||void 0,placeholder:i.getAttribute("placeholder")||void 0,name:i.getAttribute("name")||void 0,dataTestId:i.getAttribute("data-testid")||i.getAttribute("data-cy")||void 0,role:Be(i),classes:Array.from(i.classList).filter(n=>!n.startsWith("oai-")),rect:De(i)}}function Q(){return document.querySelector('[role="dialog"]:not([hidden]), [aria-modal="true"]:not([hidden]), .modal:not([hidden]):not(.oai-modal)')}function ee(i){var o,n;const e=i.getAttribute("aria-labelledby");if(e){const a=document.getElementById(e);if(a)return((o=a.innerText)==null?void 0:o.trim().slice(0,60))??""}const t=i.querySelector('h1, h2, h3, h4, [class*="modal-title"], [class*="dialog-title"]');return t?((n=t.innerText)==null?void 0:n.trim().slice(0,60))??"":i.getAttribute("aria-label")??""}function N(){const i=[],e=new Set,t=c=>{e.has(c.selector)||(e.add(c.selector),i.push(c))};document.querySelectorAll('button:not([disabled]), [role="button"], input[type="submit"], input[type="button"]').forEach(c=>{var u;if(c.closest("#oai-root"))return;const d=((u=c.innerText)==null?void 0:u.trim())||c.getAttribute("aria-label")||c.value||"";d&&t($(c,"button",d))});const o=new Set(["current-password","new-password","cc-number","cc-csc","cc-exp","cc-exp-month","cc-exp-year","cc-name"]);document.querySelectorAll('input:not([type="hidden"]):not([type="password"]):not([disabled]), textarea:not([disabled]), select:not([disabled])').forEach(c=>{if(c.closest("#oai-root"))return;const d=c.getAttribute("autocomplete")??"";if(o.has(d))return;const u=(c.getAttribute("name")??"").toLowerCase(),h=(c.getAttribute("id")??"").toLowerCase(),m=u+" "+h;if(/password|passwd|secret|ssn|social.?security|credit.?card|card.?number|cvv|cvc|pin\b/.test(m))return;const x=Oe(c)||c.getAttribute("placeholder")||c.getAttribute("aria-label")||c.getAttribute("name")||"",b=$(c,c.tagName.toLowerCase(),x,c.type||void 0),y=c.type,w=y==="checkbox"||y==="radio"?c.checked:void 0,f=c.tagName.toLowerCase()==="select"?(()=>{var E,S;const v=c;return((S=(E=v.options[v.selectedIndex])==null?void 0:E.text)==null?void 0:S.trim())||void 0})():void 0;t({...b,checked:w,selectedText:f})}),document.querySelectorAll("a[href]").forEach(c=>{var u;if(c.closest("#oai-root"))return;const d=(u=c.innerText)==null?void 0:u.trim();!d||d.length>50||t($(c,"a",d))}),document.querySelectorAll('button[disabled]:not([type="hidden"]), input[disabled]:not([type="hidden"]):not([type="password"]), select[disabled], textarea[disabled], [role="button"][aria-disabled="true"]').forEach(c=>{var h;if(c.closest("#oai-root"))return;const d=((h=c.innerText)==null?void 0:h.trim())||c.getAttribute("aria-label")||c.value||c.getAttribute("placeholder")||"";if(!d)return;const u=$(c,c.tagName.toLowerCase(),d,c.type||void 0);t({...u,disabled:!0})}),document.querySelectorAll('[role="switch"], [role="combobox"]:not(select), [role="listbox"], [contenteditable="true"]').forEach(c=>{var h;if(c.closest("#oai-root"))return;const d=c.getAttribute("aria-label")||((h=c.innerText)==null?void 0:h.trim().slice(0,60))||"";if(!d)return;const u=c.getAttribute("role")??"contenteditable";t($(c,u,d))});const n=Q();let a=null;const s=new Set;if(n){const c=[];n.querySelectorAll('button:not([disabled]), [role="button"], input:not([type="hidden"]):not([type="password"]):not([disabled]), select:not([disabled]), textarea:not([disabled]), a[href]').forEach(d=>{var x;const u=((x=d.innerText)==null?void 0:x.trim())||d.getAttribute("aria-label")||d.value||d.getAttribute("placeholder")||"";if(!u)return;const h=$(d,d.tagName.toLowerCase(),u,d.type||void 0);s.add(h.selector);const m=d.type;c.push({tag:h.tag,selector:h.selector,text:h.text,type:h.type,checked:m==="checkbox"||m==="radio"?d.checked:void 0,disabled:d.disabled||void 0})}),a={title:ee(n),elements:c.slice(0,15)}}const r=Me();Z=new Map(i.map(c=>[c.selector,c]));const l=Array.from(document.querySelectorAll("h1, h2, h3")).map(c=>{var d;return(d=c.innerText)==null?void 0:d.trim()}).filter(Boolean).slice(0,6),p=i.slice(0,50).filter(c=>!s.has(c.selector)).slice(0,40).map(c=>{const d=document.querySelector(c.selector),u=d&&d.value?d.value:void 0;return{tag:c.tag,selector:c.selector,text:c.text,type:c.type,...u?{value:u}:{},...c.checked!==void 0?{checked:c.checked}:{},...c.disabled?{disabled:!0}:{},...c.selectedText?{selectedText:c.selectedText}:{}}}),g=Fe();return{url:window.location.pathname,title:document.title,headings:l,elements:p,...a?{modalContext:a}:{},...r.length?{recentDomEvents:r}:{},...g.length?{validationErrors:g}:{}}}function Fe(){const i=['[role="alert"]','[aria-live="polite"]','[aria-live="assertive"]',".error",".error-message","[data-error]","input:invalid + *",'input[aria-invalid="true"] + *'],e=[];for(const t of i)try{document.querySelectorAll(t).forEach(o=>{var a;if(o.closest("#oai-root"))return;const n=(a=o.innerText)==null?void 0:a.trim();n&&n.length>0&&n.length<200&&e.push(n)})}catch{}return[...new Set(e)].slice(0,5)}function qe(){var o,n;if(document.querySelector('[class*="wizard"], [class*="stepper"], [class*="step-indicator"], [role="tablist"]'))return"Multi-step wizard";const i=document.title.toLowerCase(),e=((n=(o=document.querySelector("h1"))==null?void 0:o.textContent)==null?void 0:n.toLowerCase())??"";return i.includes("setting")||e.includes("setting")||e.includes("config")?"Settings page":i.includes("dashboard")||e.includes("dashboard")||document.querySelectorAll('[class*="card"], [class*="metric"], [class*="stat"]').length>3?"Dashboard":document.querySelectorAll('input:not([type="hidden"]):not([type="search"]), textarea, select').length>=3?"Form":"Page"}function Ke(){var a;const i=Array.from(document.querySelectorAll('[class*="step"]:not([class*="complete"]):not([class*="done"])')),e=i.find(s=>s.classList.toString().match(/active|current|selected/)||s.getAttribute("aria-current")==="step");if(!e)return null;const t=i.length;if(t<2)return null;const o=i.indexOf(e)+1,n=((a=e.innerText)==null?void 0:a.trim().slice(0,50))??"";return{current:o,total:t,stepTitle:n}}function He(){const i=[];return document.querySelectorAll("fieldset > legend").forEach(e=>{var o;const t=(o=e.innerText)==null?void 0:o.trim();t&&i.push(t)}),document.querySelectorAll("h2, h3, h4").forEach(e=>{var o;const t=e.nextElementSibling;if(t&&(t.tagName==="FORM"||t.querySelector("input, select, textarea"))){const n=(o=e.innerText)==null?void 0:o.trim();n&&i.push(n)}}),i.slice(0,3)}function je(){const i=[],e=[],t=[];return document.querySelectorAll('input:not([type="hidden"]):not([type="password"]):not([type="submit"]):not([type="button"]):not([disabled]), textarea:not([disabled]), select:not([disabled])').forEach(o=>{var r;if(o.closest("#oai-root"))return;const n=Xe(o);if(!n)return;const a=(r=o.value)==null?void 0:r.trim(),s=o.required||o.getAttribute("aria-required")==="true"||!!o.closest("[data-required]");a?t.push(`${n}="${a.slice(0,30)}"`):s?i.push(n):e.push(n)}),{required:i.slice(0,8),optional:e.slice(0,5),filled:t.slice(0,8)}}function Xe(i){const e=i.id;if(e){const o=document.querySelector(`label[for="${e}"]`);if(o)return o.innerText.trim().replace(/[*:]/g,"").trim()}const t=i.closest("label");return t?t.innerText.replace(i.value??"","").trim().replace(/[*:]/g,"").trim():i.getAttribute("aria-label")||i.getAttribute("placeholder")||i.getAttribute("name")||""}function Ye(){var o;const i=Array.from(document.querySelectorAll('button[type="submit"], input[type="submit"], button.primary, button[class*="primary"], button[class*="submit"], button[class*="save"], button[class*="continue"], button[class*="next"]')).filter(n=>!n.closest("#oai-root"));if(i.length===0)return null;const e=i[0];return{label:(((o=e.innerText)==null?void 0:o.trim())||e.value||e.getAttribute("aria-label")||"Submit").slice(0,40),disabled:e.disabled}}function Je(){const i=[];return document.querySelectorAll('[role="alert"], [class*="error"]:not([class*="oai"]), [class*="invalid"]:not([class*="oai"]), .field-error, [aria-invalid="true"] + *, [data-error]').forEach(e=>{var o;if(e.closest("#oai-root"))return;const t=(o=e.innerText)==null?void 0:o.trim();t&&t.length<120&&i.push(t)}),[...new Set(i)].slice(0,5)}function te(){const i=[],e=qe();i.push(`PAGE TYPE: ${e}`);const t=Q();if(t){const d=ee(t);i.push(`MODAL OPEN${d?`: "${d}"`:""}`)}!!(document.querySelector('[aria-busy="true"]')||document.querySelector('[class*="skeleton"], [class*="loading"], [class*="spinner"]'))&&i.push("LOADING: true — page may still be rendering, avoid interactions");const n=[];document.querySelectorAll('[aria-live]:not([aria-live="off"]), [role="status"], [role="log"]').forEach(d=>{var h;if(d.closest("#oai-root"))return;const u=(h=d.innerText)==null?void 0:h.trim();u&&u.length<100&&n.push(u)}),n.length>0&&i.push(`LIVE REGION: "${n[0]}"`);const a=Ke();a&&i.push(`WIZARD: Step ${a.current} of ${a.total} — "${a.stepTitle}"`);const s=He();s.length>0&&i.push(`ACTIVE SECTION: "${s[0]}"`);const{required:r,optional:l,filled:p}=je();r.length>0&&i.push(`REQUIRED (empty): ${r.join(", ")}`),p.length>0&&i.push(`FILLED: ${p.join(", ")}`),l.length>0&&l.length<=5&&i.push(`OPTIONAL: ${l.join(", ")}`);const g=Ye();g&&i.push(`PRIMARY ACTION: "${g.label}" (${g.disabled?"disabled":"enabled"})`);const c=Je();return c.length>0?i.push(`ERRORS: ${c.slice(0,3).join("; ")}`):i.push("ERRORS: None"),i.join(`
`)}function z(i){return i.toLowerCase().replace(/\s+/g," ").trim()}function We(i,e){const t=new Set(z(i).split(" ").filter(Boolean)),o=new Set(z(e).split(" ").filter(Boolean));if(t.size===0||o.size===0)return 0;let n=0;return t.forEach(a=>{o.has(a)&&n++}),n/Math.max(t.size,o.size)}function Ge(i,e){if(i.length===0||e.length===0)return 0;const t=new Set(i),o=new Set(e);let n=0;return t.forEach(a=>{o.has(a)&&n++}),n/(t.size+o.size-n)}function Ve(i){var t;const e=((t=i.tag)==null?void 0:t.toLowerCase())??"";return e==="button"?'button, [role="button"], input[type="submit"], input[type="button"]':e==="a"?"a[href]":e==="input"?`input[type="${i.type??"text"}"]`:e==="select"?"select":e==="textarea"?"textarea":"*"}function Ze(i){return Array.from(document.querySelectorAll(Ve(i))).filter(e=>!e.closest("#oai-root"))}function Qe(i,e){const t=document.querySelector(i);if(t)return{el:t,strategy:"primary",healed:!1,originalSelector:i};if(!e)return null;if(e.dataTestId){const n=CSS.escape(e.dataTestId),a=document.querySelector(`[data-testid="${n}"]`)??document.querySelector(`[data-cy="${n}"]`);if(a)return{el:a,strategy:"data-testid",healed:!0,originalSelector:i,usedSelector:`[data-testid="${e.dataTestId}"]`}}if(e.name){const n=document.querySelector(`[name="${CSS.escape(e.name)}"]`);if(n)return{el:n,strategy:"name",healed:!0,originalSelector:i,usedSelector:`[name="${e.name}"]`}}if(e.ariaLabel){const n=document.querySelector(`[aria-label="${CSS.escape(e.ariaLabel)}"]`);if(n)return{el:n,strategy:"aria-label",healed:!0,originalSelector:i,usedSelector:`[aria-label="${e.ariaLabel}"]`}}if(e.placeholder){const n=document.querySelector(`[placeholder="${CSS.escape(e.placeholder)}"]`);if(n)return{el:n,strategy:"placeholder",healed:!0,originalSelector:i,usedSelector:`[placeholder="${e.placeholder}"]`}}const o=Ze(e);if(e.text){const n=z(e.text),a=o.find(s=>z(s.innerText??s.getAttribute("aria-label")??"")===n);if(a)return{el:a,strategy:"exact-text",healed:!0,originalSelector:i,usedSelector:`[text="${e.text}"]`}}if(e.classes&&e.classes.length>0){let n=null;for(const a of o){const s=Ge(e.classes,Array.from(a.classList));s>=.7&&(!n||s>n.score)&&(n={el:a,score:s})}if(n)return{el:n.el,strategy:"fuzzy-class",healed:!0,originalSelector:i}}if(e.text){let n=null;for(const a of o){const s=a.innerText??a.getAttribute("aria-label")??a.getAttribute("placeholder")??"",r=We(e.text,s);r>=.8&&(!n||r>n.score)&&(n={el:a,score:r})}if(n)return{el:n.el,strategy:"fuzzy-text",healed:!0,originalSelector:i}}return null}function _(i){const e=Le().get(i);return Qe(i,e)}const ie="oai-spotlight-overlay",L="oai-spotlight-ring",oe="oai-spotlight-tip",ne="oai-beacon",ae="oai-beacon-tip",R="oai-arrow-callout",O="oai-multi-",se="oai-spotlight-style";function A(){if(document.getElementById(se))return;const i=document.createElement("style");i.id=se,i.textContent=`
    @keyframes oai-ring-pulse {
      0%   { box-shadow: 0 0 0 0 rgba(99,102,241,0.55), 0 0 16px rgba(99,102,241,0.3); }
      70%  { box-shadow: 0 0 0 10px rgba(99,102,241,0), 0 0 20px rgba(99,102,241,0.15); }
      100% { box-shadow: 0 0 0 0 rgba(99,102,241,0), 0 0 16px rgba(99,102,241,0.3); }
    }
    @keyframes oai-beacon-pulse {
      0%   { transform: scale(1);   box-shadow: 0 0 0 0 rgba(99,102,241,0.7); }
      60%  { transform: scale(1.1); box-shadow: 0 0 0 10px rgba(99,102,241,0); }
      100% { transform: scale(1);   box-shadow: 0 0 0 0 rgba(99,102,241,0); }
    }
    @keyframes oai-overlay-in {
      from { opacity: 0; } to { opacity: 1; }
    }
    @keyframes oai-tip-in {
      from { opacity: 0; transform: translateY(6px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    @keyframes oai-arrow-in {
      from { opacity: 0; transform: scale(0.92) translateY(4px); }
      to   { opacity: 1; transform: scale(1) translateY(0); }
    }
    @keyframes oai-badge-in {
      from { opacity: 0; transform: scale(0.5); }
      to   { opacity: 1; transform: scale(1); }
    }
  `,document.head.appendChild(i)}function I(){var i,e,t;(i=document.getElementById(ie))==null||i.remove(),(e=document.getElementById(L))==null||e.remove(),(t=document.getElementById(oe))==null||t.remove()}function K(){var i,e;(i=document.getElementById(ne))==null||i.remove(),(e=document.getElementById(ae))==null||e.remove()}function H(){var i;(i=document.getElementById(R))==null||i.remove()}function j(){document.querySelectorAll(`[id^="${O}"]`).forEach(i=>i.remove())}function P(i){let e=!0,t=i.map(({el:n})=>n.getBoundingClientRect());function o(){e&&(i.forEach(({el:n,update:a},s)=>{const r=n.getBoundingClientRect();(Math.abs(r.top-t[s].top)>1||Math.abs(r.left-t[s].left)>1)&&(a(r),t[s]=r)}),requestAnimationFrame(o))}return requestAnimationFrame(o),()=>{e=!1}}function re(i,e="👆 Click here",t=4e3,o="#6366f1"){A(),I();const n=document.querySelector(i);if(!n)return()=>{};n.scrollIntoView({behavior:"smooth",block:"center"});let a=null;const s=setTimeout(()=>{const l=n.getBoundingClientRect(),p=10,g=document.createElement("div");g.id=ie,g.style.cssText=`
      position: fixed; inset: 0; z-index: 2147483640;
      background: rgba(0,0,0,0.38);
      pointer-events: none;
      animation: oai-overlay-in 0.2s ease;
    `;const c=l.left-p,d=l.top-p,u=l.width+p*2,h=l.height+p*2;g.style.clipPath=`polygon(0% 0%, 0% 100%, ${c}px 100%, ${c}px ${d}px, ${c+u}px ${d}px, ${c+u}px ${d+h}px, ${c}px ${d+h}px, ${c}px 100%, 100% 100%, 100% 0%)`;const m=document.createElement("div");m.id=L,m.style.cssText=`
      position: fixed; z-index: 2147483641; pointer-events: none;
      left: ${c}px; top: ${d}px; width: ${u}px; height: ${h}px;
      border-radius: 10px; border: 2px solid ${o};
      animation: oai-ring-pulse 1.1s ease infinite;
    `;const x=document.createElement("div");x.id=oe;const b=d-38<8?d+h+6:d-38;x.style.cssText=`
      position: fixed; z-index: 2147483642; pointer-events: none;
      left: ${c}px; top: ${b}px;
      background: ${o}; color: #fff;
      font-size: 12px; font-weight: 600;
      padding: 5px 12px; border-radius: 8px;
      white-space: nowrap;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      box-shadow: 0 4px 12px rgba(99,102,241,0.4);
      animation: oai-tip-in 0.25s ease;
    `,x.textContent=e,document.body.appendChild(g),document.body.appendChild(m),document.body.appendChild(x),a=P([{el:n,update:y=>{const w=y.left-p,f=y.top-p,v=y.width+p*2,E=y.height+p*2;g.style.clipPath=`polygon(0% 0%, 0% 100%, ${w}px 100%, ${w}px ${f}px, ${w+v}px ${f}px, ${w+v}px ${f+E}px, ${w}px ${f+E}px, ${w}px 100%, 100% 100%, 100% 0%)`,m.style.left=`${w}px`,m.style.top=`${f}px`,m.style.width=`${v}px`,m.style.height=`${E}px`;const S=f-38<8?f+E+6:f-38;x.style.left=`${w}px`,x.style.top=`${S}px`}}])},300),r=setTimeout(()=>{a==null||a(),I()},t);return()=>{clearTimeout(s),clearTimeout(r),a==null||a(),I()}}function et(i,e="👆 Here",t=5e3){A(),K();const o=document.querySelector(i);if(!o)return()=>{};o.scrollIntoView({behavior:"smooth",block:"center"});let n=null;const a=setTimeout(()=>{const l=o.getBoundingClientRect(),p=document.createElement("div");p.id=ne,p.style.cssText=`
      position: fixed; z-index: 2147483641; pointer-events: none;
      left: ${l.right-9}px; top: ${l.top-9}px;
      width: 18px; height: 18px; border-radius: 50%;
      background: #6366f1; border: 2px solid #fff;
      box-shadow: 0 2px 8px rgba(99,102,241,0.5);
      animation: oai-beacon-pulse 1.4s ease infinite;
    `;const g=document.createElement("div");g.id=ae;const c=Math.max(8,Math.min(l.left,window.innerWidth-200)),d=l.top-44<8?l.bottom+8:l.top-44;g.style.cssText=`
      position: fixed; z-index: 2147483642; pointer-events: none;
      left: ${c}px; top: ${d}px;
      background: #1e293b; color: #f8fafc;
      font-size: 12px; font-weight: 500;
      padding: 5px 10px; border-radius: 6px;
      white-space: nowrap;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      box-shadow: 0 4px 12px rgba(0,0,0,0.25);
      animation: oai-tip-in 0.25s ease;
    `,g.textContent=e,document.body.appendChild(p),document.body.appendChild(g),n=P([{el:o,update:u=>{p.style.left=`${u.right-9}px`,p.style.top=`${u.top-9}px`;const h=Math.max(8,Math.min(u.left,window.innerWidth-200)),m=u.top-44<8?u.bottom+8:u.top-44;g.style.left=`${h}px`,g.style.top=`${m}px`}}])},250),s=()=>{clearTimeout(a),clearTimeout(r),n==null||n(),K()},r=setTimeout(s,t);return s}function tt(i,e="👆 Here",t=5e3,o="#6366f1"){A(),H();const n=document.querySelector(i);if(!n)return()=>{};n.scrollIntoView({behavior:"smooth",block:"center"});const a=44,s=8,r=6;let l=null;const p=setTimeout(()=>{const d=n.getBoundingClientRect(),u=d.top-a-s-r>8,h=u?d.top-a-s-r:d.bottom+r,m=document.createElement("div");m.id=R;const x=u?`border-left:8px solid transparent;border-right:8px solid transparent;border-top:8px solid ${o};`:`border-left:8px solid transparent;border-right:8px solid transparent;border-bottom:8px solid ${o};`,b=u?"bottom:-8px; top:auto;":"top:-8px; bottom:auto;",y=Math.max(8,Math.min(d.left+d.width/2-90,window.innerWidth-188)),w=Math.max(8,d.left+d.width/2-y-8);m.style.cssText=`
      position: fixed; z-index: 2147483642; pointer-events: none;
      left: ${y}px; top: ${h}px;
      background: ${o}; color: #fff;
      font-size: 12px; font-weight: 600;
      padding: 8px 14px; border-radius: 10px;
      max-width: 240px; width: max-content;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      box-shadow: 0 6px 20px rgba(99,102,241,0.4);
      animation: oai-arrow-in 0.25s cubic-bezier(0.34,1.56,0.64,1);
      line-height: 1.4;
    `,m.textContent=e;const f=document.createElement("div");f.style.cssText=`
      position: absolute; left: ${w}px; ${b}
      width: 0; height: 0; ${x}
    `,m.appendChild(f);const v=6,E=document.createElement("div");E.id=R+"-ring",E.style.cssText=`
      position: fixed; z-index: 2147483641; pointer-events: none;
      left: ${d.left-v}px; top: ${d.top-v}px;
      width: ${d.width+v*2}px; height: ${d.height+v*2}px;
      border-radius: 8px; border: 2px solid ${o};
      animation: oai-ring-pulse 1.1s ease infinite;
    `,document.body.appendChild(E),document.body.appendChild(m),l=P([{el:n,update:S=>{const be=S.top-a-s-r>8,Ut=be?S.top-a-s-r:S.bottom+r,xe=Math.max(8,Math.min(S.left+S.width/2-90,window.innerWidth-188)),Nt=Math.max(8,S.left+S.width/2-xe-8);m.style.left=`${xe}px`,m.style.top=`${Ut}px`,f.style.left=`${Nt}px`,be?(f.style.bottom="-8px",f.style.top="auto"):(f.style.top="-8px",f.style.bottom="auto"),E.style.left=`${S.left-v}px`,E.style.top=`${S.top-v}px`,E.style.width=`${S.width+v*2}px`,E.style.height=`${S.height+v*2}px`}}])},250),g=()=>{var d;clearTimeout(p),clearTimeout(c),l==null||l(),H(),(d=document.getElementById(R+"-ring"))==null||d.remove()},c=setTimeout(g,t);return g}function it(i,e=[],t=6e3,o="#6366f1"){A(),j();const n=i.map((p,g)=>({sel:p,el:document.querySelector(p),i:g})).filter(p=>p.el!==null);if(n.length===0)return()=>{};n[0].el.scrollIntoView({behavior:"smooth",block:"center"});let a=null;const s=setTimeout(()=>{const p=[],g=[],c=[];n.forEach(({el:d,i:u})=>{const h=d.getBoundingClientRect(),m=8,x=u+1,b=e[u]??`Step ${x}`,y=document.createElement("div");y.id=`${O}ring-${u}`,y.style.cssText=`
        position: fixed; z-index: 2147483641; pointer-events: none;
        left: ${h.left-m}px; top: ${h.top-m}px;
        width: ${h.width+m*2}px; height: ${h.height+m*2}px;
        border-radius: 10px; border: 2px solid ${o};
        animation: oai-ring-pulse 1.1s ease infinite;
        animation-delay: ${u*.15}s;
      `;const w=document.createElement("div");w.id=`${O}badge-${u}`,w.style.cssText=`
        position: fixed; z-index: 2147483642; pointer-events: none;
        left: ${h.left-m-4}px; top: ${h.top-m-4}px;
        width: 20px; height: 20px; border-radius: 50%;
        background: ${o}; color: #fff;
        font-size: 11px; font-weight: 700;
        display: flex; align-items: center; justify-content: center;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        box-shadow: 0 2px 6px rgba(99,102,241,0.5);
        animation: oai-badge-in 0.3s cubic-bezier(0.34,1.56,0.64,1) both;
        animation-delay: ${u*.1}s;
      `,w.textContent=String(x);const f=document.createElement("div");f.id=`${O}tip-${u}`;const v=h.top-m-32<8?h.bottom+m+4:h.top-m-28;f.style.cssText=`
        position: fixed; z-index: 2147483642; pointer-events: none;
        left: ${h.left-m+20}px; top: ${v}px;
        background: #1e293b; color: #f8fafc;
        font-size: 11px; font-weight: 500;
        padding: 3px 8px; border-radius: 5px;
        white-space: nowrap;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        box-shadow: 0 2px 8px rgba(0,0,0,0.2);
        animation: oai-tip-in 0.25s ease both;
        animation-delay: ${u*.12}s;
      `,f.textContent=b,document.body.appendChild(y),document.body.appendChild(w),document.body.appendChild(f),p.push(y),g.push(w),c.push(f)}),a=P(n.map(({el:d},u)=>({el:d,update:h=>{p[u].style.left=`${h.left-8}px`,p[u].style.top=`${h.top-8}px`,p[u].style.width=`${h.width+8*2}px`,p[u].style.height=`${h.height+8*2}px`,g[u].style.left=`${h.left-8-4}px`,g[u].style.top=`${h.top-8-4}px`;const x=h.top-8-32<8?h.bottom+8+4:h.top-8-28;c[u].style.left=`${h.left-8+20}px`,c[u].style.top=`${x}px`}})))},300),r=()=>{clearTimeout(s),clearTimeout(l),a==null||a(),j()},l=setTimeout(r,t);return r}function ot(i,e=3e3){A();const t=document.querySelector(i);if(!t)return()=>{};t.scrollIntoView({behavior:"smooth",block:"center"});let o=null,n=null;const a=setTimeout(()=>{var p;const s=t.getBoundingClientRect(),r=6,l=document.createElement("div");l.id=L,l.style.cssText=`
      position: fixed; z-index: 2147483641; pointer-events: none;
      left: ${s.left-r}px; top: ${s.top-r}px;
      width: ${s.width+r*2}px; height: ${s.height+r*2}px;
      border-radius: 8px; border: 2px solid #6366f1;
      animation: oai-ring-pulse 1.1s ease infinite;
    `,(p=document.getElementById(L))==null||p.remove(),document.body.appendChild(l),o=P([{el:t,update:g=>{l.style.left=`${g.left-r}px`,l.style.top=`${g.top-r}px`,l.style.width=`${g.width+r*2}px`,l.style.height=`${g.height+r*2}px`}}]),n=setTimeout(()=>{o==null||o(),l.remove()},e)},200);return()=>{var s;clearTimeout(a),n&&clearTimeout(n),o==null||o(),(s=document.getElementById(L))==null||s.remove()}}const le="oai-htip-";function nt(i,e,t="#6366f1"){A();const o=document.querySelector(i);if(!o||o.closest("#oai-root"))return null;const n=le+Math.random().toString(36).slice(2,8),a=document.createElement("div");a.id=n+"-badge",a.style.cssText=`
    position: fixed; z-index: 2147483641; pointer-events: none;
    width: 16px; height: 16px; border-radius: 50%;
    background: ${t}; color: white;
    font-size: 10px; font-weight: 700; font-family: system-ui, sans-serif;
    display: flex; align-items: center; justify-content: center;
    box-shadow: 0 1px 4px rgba(0,0,0,0.2);
    animation: oai-badge-in 0.2s ease both;
  `,a.textContent="i";const s=document.createElement("div");s.id=n+"-tip",s.style.cssText=`
    position: fixed; z-index: 2147483642; pointer-events: none;
    background: #1e293b; color: #f8fafc;
    font-size: 12px; font-family: system-ui, sans-serif; line-height: 1.45;
    padding: 7px 11px; border-radius: 8px; max-width: 220px;
    box-shadow: 0 4px 16px rgba(0,0,0,0.22);
    opacity: 0; transition: opacity 0.15s ease;
    white-space: normal; word-break: break-word;
  `,s.textContent=e;function r(){const g=o.getBoundingClientRect();a.style.left=`${g.right-8}px`,a.style.top=`${g.top-8}px`;const c=g.top-8<40?g.bottom+6:g.top-42;s.style.left=`${Math.min(g.left,window.innerWidth-240)}px`,s.style.top=`${c}px`}r(),document.body.appendChild(a),document.body.appendChild(s);const l=()=>{r(),s.style.opacity="1"},p=()=>{s.style.opacity="0"};return o.addEventListener("mouseenter",l),o.addEventListener("mouseleave",p),window.addEventListener("scroll",r,{passive:!0}),()=>{a.remove(),s.remove(),o.removeEventListener("mouseenter",l),o.removeEventListener("mouseleave",p),window.removeEventListener("scroll",r)}}function at(){document.querySelectorAll(`[id^="${le}"]`).forEach(i=>i.remove())}const ce="__ahaget_cursor__",B=28,st=`<svg xmlns="http://www.w3.org/2000/svg" width="${B}" height="${B}" viewBox="0 0 24 24" fill="none">
  <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
    <feDropShadow dx="1" dy="2" stdDeviation="2" flood-color="rgba(0,0,0,0.35)"/>
  </filter>
  <path filter="url(#shadow)" d="M4 2L4 18L7.5 14.5L10.5 21L12.5 20L9.5 13.5L14 13.5L4 2Z" fill="#6366f1" stroke="white" stroke-width="1.2" stroke-linejoin="round"/>
</svg>`;function de(){return document.getElementById(ce)}function rt(){const i=document.createElement("div");return i.id=ce,i.innerHTML=st,Object.assign(i.style,{position:"fixed",top:"0",left:"0",zIndex:"2147483647",pointerEvents:"none",width:`${B}px`,height:`${B}px`,transform:`translate(${window.innerWidth/2}px, ${window.innerHeight/2}px)`,transition:"transform 0.55s cubic-bezier(0.4, 0, 0.2, 1)",willChange:"transform"}),document.body.appendChild(i),i}function lt(){var i;(i=de())==null||i.remove()}function ct(i,e){return new Promise(t=>{const o=i.getBoundingClientRect(),n=o.left+12,a=o.top+o.height/2-4;e.style.transform=`translate(${n}px, ${a}px)`,setTimeout(t,850)})}function dt(i){const e=i.style.outline,t=i.style.transition;i.style.transition="outline 0.15s ease",i.style.outline="2px solid #6366f1",setTimeout(()=>{i.style.outline=e,i.style.transition=t},700)}function pt(i){return i.getAttribute("role")==="combobox"||i.getAttribute("data-radix-select-trigger")!==null||i.closest("[data-radix-select-root]")!==null||i.getAttribute("aria-haspopup")==="listbox"}async function ut(i,e){var o;i.click(),i.dispatchEvent(new MouseEvent("mousedown",{bubbles:!0})),await new Promise(n=>setTimeout(n,150));const t=document.querySelectorAll('[role="option"]');for(const n of Array.from(t))if((o=n.textContent)!=null&&o.trim().toLowerCase().includes(e.toLowerCase()))return n.click(),!0;return!1}function ht(i,e){return new Promise(t=>{if(pt(i)){ut(i,e).then(()=>setTimeout(t,150));return}if(i.tagName==="SELECT"){i.value=e,i.dispatchEvent(new Event("input",{bubbles:!0})),i.dispatchEvent(new Event("change",{bubbles:!0})),setTimeout(t,150);return}const o=i;o.focus(),o.value="";const n=e.split("");let a=0;const s=55;function r(){if(a>=n.length){o.dispatchEvent(new Event("input",{bubbles:!0})),o.dispatchEvent(new Event("change",{bubbles:!0})),setTimeout(t,120);return}o.value+=n[a++],o.dispatchEvent(new Event("input",{bubbles:!0}));const l=Math.random()*30-15;setTimeout(r,s+l)}r()})}async function gt(i,e){let t=de();t||(t=rt()),await new Promise(o=>setTimeout(o,80));for(const[o,n]of Object.entries(i)){const a=e(o);a&&(await ct(a,t),dt(a),await ht(a,n),await new Promise(s=>setTimeout(s,220)))}t.style.transition="opacity 0.3s ease",t.style.opacity="0",setTimeout(lt,320)}function mt(i,e=window.location.pathname){return!i||i.trim()===""?!0:i.split(",").map(t=>t.trim()).some(t=>t?new RegExp("^"+t.replace(/[.+?^${}()|[\]\\]/g,"\\$&").replace(/\*/g,".*")+"$").test(e):!1)}class ft{constructor(e,t){this.userId=null,this.session=null,this.triggerConfig={delayMs:3e4,urlPattern:"",maxTriggersPerUser:0},this.agentName="AI Assistant",this.onActionCallbacks=[],this.onSessionUpdateCallbacks=[],this._hoverTipCleanups=[],this.apiKey=e,this.apiUrl=t,this.scheduleWarmup()}clearHoverTips(){this._hoverTipCleanups.forEach(e=>e()),this._hoverTipCleanups=[],at()}cacheKey(e){return`_oai_s_${this.apiKey.slice(0,8)}_${e}`}getCachedSession(e){try{const t=localStorage.getItem(this.cacheKey(e));if(!t)return null;const o=JSON.parse(t);return o._ts&&Date.now()-o._ts>7*24*60*60*1e3?(localStorage.removeItem(this.cacheKey(e)),null):o}catch{return null}}saveToCache(e,t){try{localStorage.setItem(this.cacheKey(e),JSON.stringify({...t,_ts:Date.now()}))}catch{}}evictCache(e){localStorage.removeItem(this.cacheKey(e))}reportHeal(e){var t;this.session&&fetch(`${this.apiUrl}/api/v1/session/heal`,{method:"POST",headers:{"Content-Type":"application/json","X-API-Key":this.apiKey},body:JSON.stringify({sessionId:this.session.id,stepId:(t=this.session.currentStep)==null?void 0:t.id,originalSelector:e.originalSelector,usedSelector:e.usedSelector,strategy:e.strategy,actionType:e.actionType,page:window.location.pathname})}).catch(()=>{})}reportSoftFailure(e){var t;this.session&&fetch(`${this.apiUrl}/api/v1/session/heal`,{method:"POST",headers:{"Content-Type":"application/json","X-API-Key":this.apiKey},body:JSON.stringify({sessionId:this.session.id,stepId:((t=this.session.currentStep)==null?void 0:t.id)??null,originalSelector:e.selector??"unknown",usedSelector:null,strategy:"failed",actionType:e.actionType,page:window.location.pathname,reason:"dom_unchanged_after_action"})}).catch(()=>{})}scheduleWarmup(){const e=()=>{fetch(`${this.apiUrl}/api/v1/session/warmup`,{method:"POST",headers:{"Content-Type":"application/json","X-API-Key":this.apiKey},body:"{}"}).catch(()=>{})};typeof window<"u"&&"requestIdleCallback"in window?window.requestIdleCallback(e,{timeout:3e3}):setTimeout(e,2e3)}onAction(e){this.onActionCallbacks.push(e)}onSessionUpdate(e){this.onSessionUpdateCallbacks.push(e)}emit(e){this.onActionCallbacks.forEach(t=>t(e))}emitSessionUpdate(e){this.onSessionUpdateCallbacks.forEach(t=>t(e))}getSession(){return this.session}getTriggerConfig(){return this.triggerConfig}shouldTriggerOnCurrentPage(){return mt(this.triggerConfig.urlPattern)}getAgentName(){return this.agentName}getProgress(){if(!this.session)return{completed:0,total:0,percent:0};const e=this.session.completedStepIds.length,t=this.session.totalSteps;return{completed:e,total:t,percent:t>0?Math.round(e/t*100):0}}async start(e,t,o={}){this.userId=e;const n=this.getCachedSession(e);n&&n.status!=="completed"&&(this.session=n,this.emitSessionUpdate(n));try{const s=await(await fetch(`${this.apiUrl}/api/v1/session/start`,{method:"POST",headers:{"Content-Type":"application/json","X-API-Key":this.apiKey},body:JSON.stringify({userId:e,page:t,metadata:o})})).json();if(s.trigger&&(this.triggerConfig=s.trigger),s.agentName&&(this.agentName=s.agentName),s.session){const r={...s.session,isReturning:s.isReturning??!1};return this.session=r,r.status==="completed"?this.evictCache(e):this.saveToCache(e,r),this.emitSessionUpdate(this.session),r}else return this.evictCache(e),null}catch{return this.session}}async startFlow(e,t,o,n={}){this.userId=e;try{const s=await(await fetch(`${this.apiUrl}/api/v1/session/start`,{method:"POST",headers:{"Content-Type":"application/json","X-API-Key":this.apiKey},body:JSON.stringify({userId:e,page:o,metadata:n,flowId:t})})).json();if(s.trigger&&(this.triggerConfig=s.trigger),s.agentName&&(this.agentName=s.agentName),s.session){const r={...s.session,isReturning:s.isReturning??!1};return this.session=r,this.saveToCache(e,r),this.emitSessionUpdate(r),r}return null}catch{return null}}async sendMessage(e,t){if(!this.session)return null;const o={...N(),semanticSummary:te()};try{const n=await fetch(`${this.apiUrl}/api/v1/session/act/stream`,{method:"POST",headers:{"Content-Type":"application/json","X-API-Key":this.apiKey},body:JSON.stringify({sessionId:this.session.id,userMessage:e,pageContext:o})});if(n.ok&&n.body){const a=n.body.getReader(),s=new TextDecoder;let r="";for(;;){const{done:l,value:p}=await a.read();if(l)break;r+=s.decode(p,{stream:!0});const g=r.split(`
`);r=g.pop()??"";for(const c of g)if(c.startsWith("data: "))try{const d=JSON.parse(c.slice(6));if(d.word&&t){t(d.word);continue}if(d.action){const u=d.action,h=d.messageId??null;return(u.type==="complete_step"||u.type==="celebrate_milestone")&&(this.clearHoverTips(),await this.refreshSession()),this.emit(u),{action:u,messageId:h}}}catch{}}}}catch{}try{const n=await fetch(`${this.apiUrl}/api/v1/session/act`,{method:"POST",headers:{"Content-Type":"application/json","X-API-Key":this.apiKey},body:JSON.stringify({sessionId:this.session.id,userMessage:e,pageContext:o})});if(!n.ok)return null;const a=await n.json(),s=a.action;return(s.type==="complete_step"||s.type==="celebrate_milestone")&&await this.refreshSession(),this.emit(s),{action:s,messageId:a.messageId??null}}catch{return null}}async sendFeedback(e,t){try{await fetch(`${this.apiUrl}/api/v1/session/feedback`,{method:"POST",headers:{"Content-Type":"application/json","X-API-Key":this.apiKey},body:JSON.stringify({messageId:e,value:t})})}catch{}}async notifyPageChange(e){if(!(!this.session||!this.userId))try{(await(await fetch(`${this.apiUrl}/api/v1/session/page-change`,{method:"POST",headers:{"Content-Type":"application/json","X-API-Key":this.apiKey},body:JSON.stringify({sessionId:this.session.id,page:e})})).json()).advanced&&await this.refreshSession()}catch{}}watchNavigation(){const e=n=>this.notifyPageChange(n),t=history.pushState.bind(history);history.pushState=function(...n){t(...n),e(window.location.pathname)};const o=history.replaceState.bind(history);history.replaceState=function(...n){o(...n),e(window.location.pathname)},window.addEventListener("popstate",()=>e(window.location.pathname))}scheduleVerify(){this.session&&setTimeout(async()=>{const e=await this.sendMessage("__verify__");e&&this.emit(e.action)},2e3)}async fireEvent(e){if(this.session)try{const o=await(await fetch(`${this.apiUrl}/api/v1/session/event`,{method:"POST",headers:{"Content-Type":"application/json","X-API-Key":this.apiKey},body:JSON.stringify({sessionId:this.session.id,eventType:e})})).json();o.advanced&&(await this.refreshSession(),o.milestone&&this.emit({type:"celebrate_milestone",headline:"First value unlocked!",insight:"You have reached your first successful outcome."}))}catch{}}async refreshSession(){if(!(!this.session||!this.userId))try{const t=await(await fetch(`${this.apiUrl}/api/v1/session?userId=${encodeURIComponent(this.userId)}&flowId=${this.session.flow.id}`,{headers:{"X-API-Key":this.apiKey}})).json();t.session&&(this.session=t.session,this.session.status==="completed"?this.evictCache(this.userId):this.saveToCache(this.userId,this.session),this.emitSessionUpdate(this.session))}catch{}}getSessionId(){var e;return((e=this.session)==null?void 0:e.id)??null}async sendPlanRequest(e){var o;const t=N();try{const n=await fetch(`${this.apiUrl}/api/v1/session/act/plan`,{method:"POST",headers:{"Content-Type":"application/json","X-API-Key":this.apiKey},body:JSON.stringify({sessionId:((o=this.session)==null?void 0:o.id)??"plan_session",goal:e,pageContext:t})});return n.ok?(await n.json()).phases:null}catch{return null}}async sendGoalMessage(e){var l;const{goal:t,turnHistory:o,turnCount:n,failedSelectors:a}=e,r={...N(),semanticSummary:te()};try{const p=await fetch(`${this.apiUrl}/api/v1/session/act/goal`,{method:"POST",headers:{"Content-Type":"application/json","X-API-Key":this.apiKey},body:JSON.stringify({sessionId:((l=this.session)==null?void 0:l.id)??"goal_session",goal:t,pageContext:r,turnHistory:o,turnCount:n,failedSelectors:a??[]})});if(!p.ok)return null;const g=await p.json();return this.emit(g.action),g}catch{return null}}executePageAction(e){var n;const{actionType:t,payload:o}=e;if(t==="fill_form"){const a=o.fields??{},s={};for(const[r,l]of Object.entries(a)){const p=_(r);if(!p){this.reportHeal({originalSelector:r,strategy:"failed",actionType:t});continue}p.healed&&this.reportHeal({originalSelector:r,usedSelector:p.usedSelector,strategy:p.strategy,actionType:t}),s[p.usedSelector??r]=l}gt(s,r=>{const l=document.querySelector(r);return l||null}).catch(()=>{for(const[r,l]of Object.entries(s)){const p=document.querySelector(r);p&&(p.value=l,p.dispatchEvent(new Event("input",{bubbles:!0})),p.dispatchEvent(new Event("change",{bubbles:!0})))}})}if(t==="click"){const a=o.selector,s=_(a);if(!s){this.reportHeal({originalSelector:a,strategy:"failed",actionType:t});return}s.healed&&this.reportHeal({originalSelector:a,usedSelector:s.usedSelector,strategy:s.strategy,actionType:t});const r=s.usedSelector??a,l=re(r,"👆 Clicking for you…",2200);setTimeout(()=>{l(),I(),s.el.click()},1800)}if(t==="navigate"){const a=o.url;a&&this.session&&(this.clearHoverTips(),I(),localStorage.setItem("_oai_resume",JSON.stringify({sessionId:this.session.id,flowId:this.session.flow.id,userId:this.userId})),localStorage.setItem("_oai_nav_resume",JSON.stringify({from:window.location.pathname,to:a,stepTitle:((n=this.session.currentStep)==null?void 0:n.title)??"",sessionId:this.session.id})),window.location.href=a)}if(t==="expand_panel"){const a=o.selector,s=o.waitForSelector;if(a){const r=_(a);if(!r){this.reportHeal({originalSelector:a,strategy:"failed",actionType:t});return}if(r.healed&&this.reportHeal({originalSelector:a,usedSelector:r.usedSelector,strategy:r.strategy,actionType:t}),r.el.click(),s){const l=Date.now()+1500,p=()=>{document.querySelector(s)||Date.now()<l&&setTimeout(p,80)};setTimeout(p,80)}}}if(t==="highlight"){const a=o.selector,s=o.mode||"spotlight",r=o.label||void 0,l=o.duration||4e3,p=o.color||void 0;if(s!=="multi"){const u=_(a);if(!u){this.reportHeal({originalSelector:a,strategy:"failed",actionType:t});return}u.healed&&this.reportHeal({originalSelector:a,usedSelector:u.usedSelector,strategy:u.strategy,actionType:t});const h=u.usedSelector??a;s==="beacon"?et(h,r??"👆 Here",l):s==="arrow"?tt(h,r??"👆 Here",l,p):s==="ring"?ot(h,l):re(h,r??"👆 Here!",l,p);return}const g=o.selectors??(a?[a]:[]),c=o.labels??[],d=[];for(const u of g){const h=_(u);if(!h){this.reportHeal({originalSelector:u,strategy:"failed",actionType:t});continue}h.healed&&this.reportHeal({originalSelector:u,usedSelector:h.usedSelector,strategy:h.strategy,actionType:t}),d.push(h.usedSelector??u)}d.length>0&&it(d,c,l,p)}if(t==="hover_tip"){const a=o.selector,s=o.text,r=o.color||void 0;if(a&&s){const l=_(a);if(l){l.healed&&this.reportHeal({originalSelector:a,usedSelector:l.usedSelector,strategy:l.strategy,actionType:t});const p=nt(l.usedSelector??a,s,r);p&&this._hoverTipCleanups.push(p)}}}t==="clear_highlight"&&(I(),K(),H(),j(),this.clearHoverTips())}}function bt(i){const e=i.trim();if(!e.startsWith("{"))return null;try{const t=JSON.parse(e);if(t.type==="steps"&&Array.isArray(t.items))return t}catch{}return null}function xt(){const i=document.createElement("div");return i.id="oai-root",document.body.appendChild(i),i}function yt(i){const e=document.createElement("div");return e.id="oai-window",e.className="oai-hidden",e.setAttribute("role","complementary"),e.setAttribute("aria-label","Ahaget AI assistant"),e.innerHTML=`
    <!-- Collapse/expand tab on the left edge -->
    <button id="oai-toggle" aria-label="Collapse panel">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="9 18 15 12 9 6"/>
      </svg>
    </button>

    <div id="oai-header">
      <div id="oai-header-top">
        <div id="oai-avatar">?</div>
        <div id="oai-header-text">
          <p id="oai-header-title">Ahaget</p>
          <p id="oai-header-sub">Your AI employee · Ahaget</p>
        </div>
      </div>
      <div id="oai-steps-nav"></div>
    </div>

    <div id="oai-messages" role="log" aria-live="polite"></div>

    <div id="oai-input-row">
      <textarea
        id="oai-input"
        rows="1"
        placeholder="Type a message�"
        aria-label="Message input"
      ></textarea>
      <button id="oai-send" aria-label="Send" disabled>
        <svg viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
      </button>
    </div>

    <div id="oai-footer">AI employee by <a href="https://ahaget.ai" target="_blank" rel="noopener">Ahaget</a></div>
  `,i.appendChild(e),e}function wt(i,e,t){const o=document.getElementById("oai-steps-nav");o&&(o.innerHTML="",i.forEach((n,a)=>{const s=t.includes(n.id),r=n.id===e&&!s,l=document.createElement("div");l.className=`oai-step-node${s?" done":""}${r?" active":""}`;const p=document.createElement("div");p.className="oai-step-circle",p.textContent=s?"?":String(a+1);const g=document.createElement("div");g.className="oai-step-label",g.textContent=n.title,l.appendChild(p),l.appendChild(g),o.appendChild(l)}))}function T(i,e,t){const o=document.createElement("div");return o.className=t==="assistant"?"oai-msg-ai":"oai-msg-user",o.textContent=e,i.appendChild(o),i.scrollTop=i.scrollHeight,o}function pe(i,e){const t=document.createElement("div");t.className="oai-feedback";const o=document.createElement("button"),n=document.createElement("button");o.className="oai-feedback-btn",n.className="oai-feedback-btn",o.setAttribute("aria-label","Helpful"),n.setAttribute("aria-label","Not helpful"),o.textContent="??",n.textContent="??";const a=(s,r,l)=>{r.classList.add("oai-feedback-active"),l.disabled=!0,r.disabled=!0,e(s)};return o.addEventListener("click",()=>a(1,o,n)),n.addEventListener("click",()=>a(-1,n,o)),t.appendChild(o),t.appendChild(n),i.appendChild(t),t}function ue(i,e){const t=document.createElement("div");t.className="oai-step-pill",t.textContent=e,i.appendChild(t)}function vt(i,e){const t=document.createElement("div");t.className="oai-action-toast";const o=document.createElement("span");o.className="oai-toast-icon",o.textContent="?";const n=document.createElement("span");return n.textContent=e,t.appendChild(o),t.appendChild(n),i.appendChild(t),i.scrollTop=i.scrollHeight,t}function he(i,e,t,o){const n=document.createElement("div");if(n.className="oai-msg-ai",e){const s=document.createElement("div");s.style.marginBottom="10px",s.textContent=e,n.appendChild(s)}const a=document.createElement("div");return a.className="oai-chips",t.forEach((s,r)=>{const l=document.createElement("button");l.className="oai-chip",l.textContent=s,l.style.animationDelay=`${r*.06}s`,l.addEventListener("click",()=>{n.querySelectorAll(".oai-chip").forEach(p=>p.disabled=!0),o(s)}),a.appendChild(l)}),n.appendChild(a),i.appendChild(n),i.scrollTop=i.scrollHeight,n}function X(i,e,t){const o=document.createElement("div");o.className="oai-celebration";const n=document.createElement("span");n.className="oai-celebration-emoji",n.textContent="??";const a=document.createElement("div");a.className="oai-celebration-headline",a.textContent=e;const s=document.createElement("div");return s.className="oai-celebration-insight",s.textContent=t,o.append(n,a,s),i.appendChild(o),i.scrollTop=i.scrollHeight,o}function D(i){const e=document.createElement("div");return e.className="oai-msg-ai oai-streaming",i.appendChild(e),i.scrollTop=i.scrollHeight,e}function St(i,e){const t=document.createElement("div");t.className="oai-plan-card";const o=document.createElement("div");o.className="oai-plan-header",o.textContent="Here's the plan:",t.appendChild(o);const n=document.createElement("ol");return n.className="oai-plan-list",e.forEach((a,s)=>{const r=document.createElement("li");r.id=`oai-plan-phase-${a.id}`,r.className="oai-plan-phase oai-plan-pending",r.innerHTML=`<div class="oai-plan-phase-circle">${s+1}</div><div class="oai-plan-phase-content"><div class="oai-plan-phase-title">${a.title}</div><div class="oai-plan-phase-desc">${a.description}</div></div>`,n.appendChild(r)}),t.appendChild(n),i.appendChild(t),i.scrollTop=i.scrollHeight,t}function ge(i,e){const t=document.getElementById(`oai-plan-phase-${i}`);if(t&&(t.className=`oai-plan-phase oai-plan-${e}`,e==="done")){const o=t.querySelector(".oai-plan-phase-circle");o&&(o.textContent="?")}}function Et(i,e){const t=document.createElement("div");t.className="oai-msg-ai";const o=document.createElement("div");o.style.cssText="font-weight:600;margin-bottom:8px;font-size:13px;",o.textContent=e.title,t.appendChild(o);const n=document.createElement("ol");return n.style.cssText="margin:0;padding-left:18px;display:flex;flex-direction:column;gap:6px;",e.items.forEach(a=>{const s=document.createElement("li");s.style.cssText="font-size:12px;color:#475569;line-height:1.45;",s.textContent=a,n.appendChild(s)}),t.appendChild(n),i.appendChild(t),i.scrollTop=i.scrollHeight,t}class Tt{constructor(e){this.isVisible=!1,this.isCollapsed=!1,this.isSending=!1,this.detector=null,this.goalMode=!1,this.goalText="",this.goalTurnHistory=[],this.goalTurnCount=0,this.goalRunning=!1,this.goalFailureCount=0,this.goalFailedSelectors=new Set,this.planActive=!1,this.planPhases=[],this.planCurrentPhaseIdx=0,this.config={...C,...e},this.copilot=new ft(e.apiKey,e.apiUrl??C.apiUrl)}getCopilot(){return this.copilot}init(){document.readyState==="loading"?document.addEventListener("DOMContentLoaded",()=>this.mount()):this.mount()}async mount(){const e={apiKey:this.config.apiKey,apiUrl:this.config.apiUrl??C.apiUrl},t=await $e(e);t&&(this.config.gradFrom||(this.config.gradFrom=t.gradFrom),this.config.gradTo||(this.config.gradTo=t.gradTo),this.config.position||(this.config.position=t.position),this.config.primaryColor===C.primaryColor&&t.primaryColor!==C.primaryColor&&(this.config.primaryColor=t.primaryColor),this.config.idleThreshold===C.idleThreshold&&(this.config.idleThreshold=t.idleThreshold)),Ie({primaryColor:this.config.primaryColor,gradFrom:this.config.gradFrom??this.config.primaryColor,gradTo:this.config.gradTo??C.gradTo}),ze();const o=xt();this.panelEl=yt(o),this.messagesEl=document.getElementById("oai-messages"),this.inputEl=document.getElementById("oai-input"),this.sendBtn=document.getElementById("oai-send"),this.injectProgressBar(),this.bindEvents(),this.trackPageView(),this.startDetection(),this.copilot.watchNavigation();const n=this.config.userId??"anonymous_"+this.getOrCreateAnonId(),a={apiKey:this.config.apiKey,apiUrl:this.config.apiUrl??C.apiUrl},s=new URLSearchParams(window.location.search),r=s.get("ahaget_resume");if(r){localStorage.setItem("_oai_resume",r);const b=window.location.pathname+(s.toString().replace(`ahaget_resume=${r}`,"").replace(/^&|&$/,"")?"?"+s.toString().replace(`ahaget_resume=${r}`,"").replace(/^&|&$/,""):"");window.history.replaceState({},"",b)}this.copilot.onSessionUpdate(b=>this.updateProgressUI(b));let p=await this.copilot.start(n,window.location.pathname,this.config.metadata??{})??this.copilot.getSession();const g=this.copilot.getAgentName(),c=document.getElementById("oai-header-title"),d=document.getElementById("oai-header-sub");if(c&&(c.textContent=g),d&&(d.textContent=`Your AI employee · ${g}`),!p){const b=await ke(a,n,window.location.pathname,this.config.metadata);b&&await this.copilot.startFlow(n,b.flow.id,window.location.pathname,this.config.metadata??{})&&(p=this.copilot.getSession())}if(!p)return;const u=this.copilot.getTriggerConfig();if(!this.copilot.shouldTriggerOnCurrentPage())return;if(u.maxTriggersPerUser>0){const b=`_ahaget_tc_${this.config.apiKey.slice(0,8)}_${n}`,y=parseInt(localStorage.getItem(b)??"0",10);if(y>=u.maxTriggersPerUser)return;localStorage.setItem(b,String(y+1))}const h=this.consumeResumeToken(),m=!!this.copilot.getCachedSession(n),x=h||m?0:u.delayMs;setTimeout(()=>this.openPanel(),x),_e(a,n).then(b=>{b&&this.showProactiveBadge(b.id,b.bodySnippet??b.subject??"Your AI employee has a message for you",a)}).catch(()=>{})}showProactiveBadge(e,t,o){G(o,e,"open");const n=document.getElementById("oai-fab");if(!n)return;const a=document.createElement("span");a.id="oai-proactive-dot",a.style.cssText=`
      position: absolute; top: -4px; right: -4px;
      width: 12px; height: 12px; border-radius: 50%;
      background: #ef4444; border: 2px solid white;
      animation: oai-pulse 1.6s ease-in-out infinite;
      z-index: 9999;
    `,n.style.position="relative",n.appendChild(a);const s=document.createElement("div");s.id="oai-proactive-tooltip",s.style.cssText=`
      position: fixed; bottom: 80px; right: 20px;
      background: #1e293b; color: #f1f5f9;
      padding: 10px 14px; border-radius: 10px;
      font-size: 13px; max-width: 260px; line-height: 1.5;
      box-shadow: 0 8px 24px rgba(0,0,0,0.3);
      z-index: 9998; cursor: pointer;
      border: 1px solid rgba(255,255,255,0.08);
    `,s.textContent=`💬 ${t.length>80?t.slice(0,80)+"…":t}`,document.body.appendChild(s),s.addEventListener("click",()=>{G(o,e,"click"),s.remove(),a.remove(),this.openPanel()}),setTimeout(()=>s.remove(),8e3)}injectProgressBar(){const e=document.getElementById("oai-header");if(!e)return;const t=document.createElement("div");t.id="oai-progress-wrap",t.innerHTML=`
      <div id="oai-step-title"></div>
      <div id="oai-progress-track">
        <div id="oai-progress-bar"></div>
      </div>
      <div id="oai-progress-text"></div>
    `,e.insertAdjacentElement("afterend",t),this.progressBarEl=document.getElementById("oai-progress-bar"),this.stepTitleEl=document.getElementById("oai-step-title"),this.progressTextEl=document.getElementById("oai-progress-text")}updateProgressUI(e){const{completed:t,total:o,percent:n}=this.copilot.getProgress();this.progressBarEl&&(this.progressBarEl.style.width=`${n}%`),this.stepTitleEl&&(this.stepTitleEl.textContent=e.status==="completed"?"Flow complete!":`Step ${e.currentStep.order+1}: ${e.currentStep.title}`),this.progressTextEl&&(this.progressTextEl.textContent=`${t} of ${o} steps done`);const a=e.flow.steps.filter((s,r)=>r<e.currentStep.order).map(s=>s.id);wt(e.flow.steps,e.currentStep.id,a)}get isMobile(){return window.innerWidth<=640}openPanel(){this.isVisible=!0,this.isCollapsed=!1,this.panelEl.classList.remove("oai-hidden","oai-collapsed"),this.isMobile||(document.body.classList.add("__ahaget-open"),document.body.classList.remove("__ahaget-collapsed")),this.startSession()}collapsePanel(){this.isCollapsed=!0,this.panelEl.classList.add("oai-collapsed"),this.isMobile||(document.body.classList.remove("__ahaget-open"),document.body.classList.add("__ahaget-collapsed"))}expandPanel(){this.isCollapsed=!1,this.panelEl.classList.remove("oai-collapsed"),this.isMobile||(document.body.classList.add("__ahaget-open"),document.body.classList.remove("__ahaget-collapsed"))}hidePanel(){this.isVisible=!1,this.panelEl.classList.add("oai-hidden"),document.body.classList.remove("__ahaget-open","__ahaget-collapsed")}async startSession(){const e=this.copilot.getSession();if(!e)return;if(e.status==="completed"){T(this.messagesEl,"🎉 You've completed this flow! Great work.","assistant"),this.inputEl.disabled=!0,this.inputEl.placeholder="Flow complete",this.sendBtn.disabled=!0;return}const t=e.currentStep,{total:o}=this.copilot.getProgress();if(ue(this.messagesEl,`Step ${t.order+1} of ${o}`),T(this.messagesEl,e.isReturning?`Welcome back! Continuing: ${t.title}`:t.title,"assistant"),t.targetUrl&&!this.isOnTargetPage(t.targetUrl)){T(this.messagesEl,"This step happens on a different page. Want me to take you there?","assistant"),he(this.messagesEl,"",[`Go to ${this.shortUrl(t.targetUrl)}`],()=>{this.copilot.executePageAction({type:"execute_page_action",actionType:"navigate",payload:{url:t.targetUrl},message:`Navigating to ${t.targetUrl}…`})}),this.enableInput(),this.isSending=!1,this.sendBtn.disabled=!1;return}const n=localStorage.getItem("_oai_nav_resume");localStorage.removeItem("_oai_nav_resume");let a="__init__";if(n)try{const r=JSON.parse(n);a=`__navigated__:${JSON.stringify({from:r.from,to:r.to??window.location.pathname,stepTitle:r.stepTitle??t.title})}`}catch{}this.enableInput(),this.isSending=!0,this.sendBtn.disabled=!0;const s=D(this.messagesEl);try{const r=await this.copilot.sendMessage(a);r?this.handleAgentAction(r.action,s,r.messageId):(s.textContent="Having trouble connecting. Type a message to try again.",s.classList.remove("oai-streaming"),this.isSending=!1,this.sendBtn.disabled=!1)}catch{s.textContent="Connection error. Please refresh and try again.",s.classList.remove("oai-streaming"),this.isSending=!1,this.sendBtn.disabled=!1}}startDetection(){this.detector=new we(this.config.idleThreshold,(e,t)=>{this.isVisible&&this.isCollapsed&&this.expandPanel()},(e,t)=>{const o=this.config.userId??"anonymous_"+this.getOrCreateAnonId();W({apiKey:this.config.apiKey,apiUrl:this.config.apiUrl},o,e,t),this.copilot.fireEvent(e)}),this.detector.start()}trackPageView(){const e=this.config.userId??"anonymous_"+this.getOrCreateAnonId();W({apiKey:this.config.apiKey,apiUrl:this.config.apiUrl},e,"page_view",{path:window.location.pathname,referrer:document.referrer})}async submitMessage(){const e=this.inputEl.value.trim();if(!e||this.isSending)return;if(this.inputEl.value="",this.inputEl.style.height="auto",this.goalMode&&!this.goalRunning){this.goalTurnHistory.push({role:"user",content:e}),this.goalRunning=!0,T(this.messagesEl,e,"user"),await this.runGoalTurn();return}if(this.isSending=!0,this.sendBtn.disabled=!0,!this.copilot.getSession()){this.startGoalMode(e);return}T(this.messagesEl,e,"user");const o=D(this.messagesEl),n=await this.copilot.sendMessage(e,a=>{o.classList.remove("oai-streaming"),o.textContent=(o.textContent??"")+a,this.messagesEl.scrollTop=this.messagesEl.scrollHeight});n?this.handleAgentAction(n.action,o,n.messageId):(o.textContent="Sorry, I had trouble responding. Please try again.",this.finishStreaming(o))}async startGoalMode(e){if(this.goalRunning)return;this.goalMode=!0,this.goalText=e,this.goalTurnHistory=[],this.goalTurnCount=0,this.goalRunning=!0,this.goalFailureCount=0,this.goalFailedSelectors=new Set,T(this.messagesEl,e,"user");const t=D(this.messagesEl);t.textContent="Planning your steps…",t.classList.remove("oai-streaming");const o=await this.copilot.sendPlanRequest(e);t.remove(),o&&o.length>1?(this.planPhases=o,this.planCurrentPhaseIdx=0,this.planActive=!0,St(this.messagesEl,o),await this.startNextPlanPhase()):await this.runGoalTurn()}async startNextPlanPhase(){const e=this.planPhases[this.planCurrentPhaseIdx];if(!e){X(this.messagesEl,"✅ All done!",`Completed all ${this.planPhases.length} phases.`),this.goalRunning=!1,this.goalMode=!1,this.planActive=!1;return}ge(e.id,"active"),ue(this.messagesEl,`Phase ${this.planCurrentPhaseIdx+1} of ${this.planPhases.length}: ${e.title}`),this.goalText=`${e.title}: ${e.description}`,this.goalTurnHistory=[],this.goalTurnCount=0,this.goalFailureCount=0,this.goalFailedSelectors=new Set,this.goalRunning=!0,await this.runGoalTurn()}domFingerprint(){const e=Array.from(document.querySelectorAll("input, select, textarea")).slice(0,8).map(o=>`${o.name??o.id}=${o.value??""}`).join("|");return`${document.querySelectorAll("button, a, input, select, textarea").length}::${e}`}waitForDomChange(e,t){return new Promise(o=>{const n=Date.now()+t,a=()=>{if(this.domFingerprint()!==e){o(!0);return}if(Date.now()>=n){o(!1);return}setTimeout(a,100)};setTimeout(a,100)})}async runGoalTurn(){if(!this.goalRunning)return;const e=D(this.messagesEl);this.isSending=!0,this.sendBtn.disabled=!0;const t=await this.copilot.sendGoalMessage({goal:this.goalText,turnHistory:this.goalTurnHistory,turnCount:this.goalTurnCount,failedSelectors:Array.from(this.goalFailedSelectors)});if(e.remove(),this.isSending=!1,this.sendBtn.disabled=!1,!t){T(this.messagesEl,"Something went wrong. Please try again.","assistant"),this.goalRunning=!1;return}const{action:o,done:n,turnCount:a}=t;this.goalTurnCount=a;const s=this.describeAction(o);if(this.goalTurnHistory.push({role:"assistant",content:s}),o.type==="execute_page_action"){const r=this.domFingerprint();if(this.handleAgentAction(o,document.createElement("div"),null),await this.waitForDomChange(r,1500))this.goalFailureCount=0,this.goalFailedSelectors.size>0&&this.goalTurnCount>0&&this.goalFailedSelectors.clear();else{const p=o.actionType==="fill_form"?Object.keys(o.payload.fields??{})[0]??null:o.payload.selector??null;p&&this.goalFailedSelectors.add(p);const g=p?`"${p}"`:'"unknown"';if(this.goalTurnHistory.push({role:"observe",content:`Action ${o.actionType} attempted on selector ${g} but page did not change. Selector may be stale.`}),this.goalFailureCount++,this.copilot.reportSoftFailure({selector:p,actionType:o.actionType}),!n){setTimeout(()=>this.runGoalTurn(),200);return}}}else this.handleAgentAction(o,document.createElement("div"),null);if(n){this.planActive?(ge(this.planPhases[this.planCurrentPhaseIdx].id,"done"),this.planCurrentPhaseIdx++,this.goalRunning=!1,setTimeout(()=>this.startNextPlanPhase(),800)):(this.goalRunning=!1,this.goalMode=!1);return}setTimeout(()=>this.runGoalTurn(),500)}describeAction(e){switch(e.type){case"execute_page_action":return`Executed ${e.actionType} action: ${e.message}`;case"ask_clarification":return`Asked user: "${e.question}"`;case"complete_step":return`Completed: ${e.message}`;case"goal_complete":return`Goal achieved: ${e.summary}`;case"escalate_to_human":return`Escalated: ${e.reason}`;case"degrade_to_manual":return`Manual step required: ${e.instruction}`;default:return`Action: ${e.type}`}}handleAgentAction(e,t,o=null){var n,a;switch(t.remove(),e.type){case"ask_clarification":{const s=he(this.messagesEl,e.question,e.options??[],r=>{this.inputEl.value=r,this.submitMessage()});o&&pe(s,r=>this.copilot.sendFeedback(o,r));break}case"execute_page_action":{this.copilot.executePageAction(e),vt(this.messagesEl,e.message),e.shouldVerify&&this.copilot.scheduleVerify();break}case"complete_step":{T(this.messagesEl,e.message,"assistant");const s=this.copilot.getSession();s&&setTimeout(()=>{const r=s.flow.steps.find(l=>l.order>s.currentStep.order);r&&T(this.messagesEl,`Next up: ${r.title} — ${r.description||"ready when you are!"}`,"assistant")},800);break}case"celebrate_milestone":{X(this.messagesEl,e.headline,e.insight);break}case"verify_integration":{const s=e.success?"✅":"❌";T(this.messagesEl,`${s} ${e.message}`,"assistant");break}case"escalate_to_human":{T(this.messagesEl,e.message,"assistant"),this.inputEl.disabled=!0,this.inputEl.placeholder="Waiting for a team member…",this.sendBtn.disabled=!0;const s=document.createElement("div");s.style.cssText="margin:8px 12px;padding:8px 12px;background:#fef3c7;border:1px solid #fde68a;border-radius:8px;font-size:11px;color:#92400e;display:flex;align-items:center;gap:6px;",s.innerHTML='<span style="width:7px;height:7px;border-radius:50%;background:#f59e0b;flex-shrink:0;"></span>Support ticket created — a team member will reach out soon.',this.messagesEl.appendChild(s),this.messagesEl.scrollTop=this.messagesEl.scrollHeight;break}case"degrade_to_manual":{const s=document.createElement("div");s.className="oai-degrade-card",s.innerHTML=`
          <div class="oai-degrade-header">⚠ Manual step required</div>
          <div class="oai-degrade-instruction">${e.instruction}</div>
          <div class="oai-degrade-reason">Why: ${e.reason}</div>
          <div class="oai-degrade-actions">
            <button class="oai-degrade-done">✓ Done, continue</button>
            <button class="oai-degrade-escalate">Get human help</button>
          </div>
        `,this.messagesEl.appendChild(s),this.messagesEl.scrollTop=this.messagesEl.scrollHeight,(n=s.querySelector(".oai-degrade-done"))==null||n.addEventListener("click",()=>{s.remove(),this.goalFailureCount=0,this.goalTurnHistory.push({role:"user",content:"Manual step completed. Please continue."}),this.goalRunning=!0,this.runGoalTurn()}),(a=s.querySelector(".oai-degrade-escalate"))==null||a.addEventListener("click",()=>{s.remove(),this.goalRunning=!1,this.goalMode=!1,T(this.messagesEl,"Connecting you with the team…","assistant"),this.copilot.sendMessage("__escalate__")});break}case"chat":{const s=bt(e.content),r=s?Et(this.messagesEl,s):T(this.messagesEl,e.content,"assistant");o&&pe(r,l=>this.copilot.sendFeedback(o,l));break}case"goal_complete":{X(this.messagesEl,"✅ Done!",e.summary);break}case"suggest_upgrade":{const s=this.copilot.getSession(),r={apiKey:this.config.apiKey,apiUrl:this.config.apiUrl??C.apiUrl};fetch(`${r.apiUrl}/api/v1/expansion/suggest`,{method:"POST",headers:{"Content-Type":"application/json","X-API-Key":r.apiKey},body:JSON.stringify({userId:this.config.userId??"",flowId:e.flowId,sessionId:s==null?void 0:s.id})}).catch(()=>{});const l=document.createElement("div");l.className="oai-upgrade-card";const p=document.createElement("div");p.className="oai-upgrade-badge",p.textContent=`✨ ${e.plan} Plan`;const g=document.createElement("div");g.className="oai-upgrade-headline",g.textContent=e.headline;const c=document.createElement("div");c.className="oai-upgrade-pitch",c.textContent=e.pitch;const d=document.createElement("a");d.className="oai-upgrade-cta",d.href=e.upgradeUrl,d.target="_blank",d.rel="noopener noreferrer",d.dataset.msgid=o??"",d.textContent="Upgrade now →";const u=document.createElement("button");u.className="oai-upgrade-dismiss",u.textContent="Maybe later";const h=document.createElement("div");h.className="oai-upgrade-actions",h.appendChild(d),h.appendChild(u),l.appendChild(p),l.appendChild(g),l.appendChild(c),l.appendChild(h),this.messagesEl.appendChild(l),this.messagesEl.scrollTop=this.messagesEl.scrollHeight,d.addEventListener("click",()=>{fetch(`${r.apiUrl}/api/v1/expansion/confirm`,{method:"POST",headers:{"Content-Type":"application/json","X-API-Key":r.apiKey},body:JSON.stringify({userId:this.config.userId??"",plan:e.plan})}).catch(()=>{})}),u.addEventListener("click",()=>{l.style.opacity="0.5",l.style.pointerEvents="none"});break}}this.isSending=!1,this.sendBtn.disabled=!1,this.inputEl.focus()}finishStreaming(e){e.classList.remove("oai-streaming"),this.isSending=!1,this.sendBtn.disabled=!1,this.inputEl.focus()}bindEvents(){document.getElementById("oai-toggle").addEventListener("click",()=>{this.isCollapsed?this.expandPanel():this.collapsePanel()}),this.sendBtn.addEventListener("click",()=>this.submitMessage()),this.inputEl.addEventListener("keydown",t=>{t.key==="Enter"&&!t.shiftKey&&(t.preventDefault(),this.submitMessage())}),this.inputEl.addEventListener("input",()=>{this.sendBtn.disabled=this.inputEl.value.trim().length===0,this.inputEl.style.height="auto",this.inputEl.style.height=Math.min(this.inputEl.scrollHeight,90)+"px"});const e=()=>{const t=this.copilot.getSession();if(!t)return;const o={apiKey:this.config.apiKey,apiUrl:this.config.apiUrl??C.apiUrl};Ae(o,t.id)};document.addEventListener("visibilitychange",()=>{document.visibilityState==="hidden"&&e()}),window.addEventListener("beforeunload",e)}enableInput(){this.inputEl.disabled=!1,this.inputEl.placeholder="Type a message…"}consumeResumeToken(){return localStorage.getItem("_oai_resume")?(localStorage.removeItem("_oai_resume"),!0):!1}isOnTargetPage(e){try{const t=new URL(e,window.location.origin);return t.origin===window.location.origin&&window.location.pathname===t.pathname}catch{return!1}}shortUrl(e){try{const t=new URL(e,window.location.origin);return t.origin!==window.location.origin?t.hostname+t.pathname:t.pathname}catch{return e}}getOrCreateAnonId(){const e="__oai_uid";let t=localStorage.getItem(e);return t||(t=Math.random().toString(36).slice(2)+Date.now().toString(36),localStorage.setItem(e,t)),t}}function Ct(){return window.__REACT_DEVTOOLS_GLOBAL_HOOK__?"react":window.Vue||document.querySelector("[data-v-]")?"vue":window.ng||document.querySelector("[ng-version]")?"angular":document.querySelectorAll("script[src]").length===0?"server":"vanilla"}const k=new Map;function kt(){const i=document.createElement("style");i.id="ahaget-inspector-styles",i.textContent=`
    .ahaget-highlight {
      outline: 2px solid rgba(99,102,241,0.7) !important;
      outline-offset: 2px !important;
      cursor: pointer !important;
      position: relative !important;
      transition: outline-color 0.15s !important;
    }
    .ahaget-highlight:hover {
      outline-color: rgba(99,102,241,1) !important;
      background: rgba(99,102,241,0.05) !important;
    }
    .ahaget-highlight.annotated {
      outline-color: rgba(16,185,129,0.8) !important;
    }
    #ahaget-inspector-toolbar {
      position: fixed;
      top: 16px;
      right: 16px;
      z-index: 2147483647;
      background: #1a1a2e;
      border: 1px solid rgba(99,102,241,0.3);
      border-radius: 12px;
      padding: 12px 16px;
      display: flex;
      align-items: center;
      gap: 12px;
      font-family: -apple-system, BlinkMacSystemFont, 'Inter', sans-serif;
      font-size: 12px;
      color: #e2e2ef;
      box-shadow: 0 8px 32px rgba(0,0,0,0.4);
      user-select: none;
    }
    #ahaget-inspector-toolbar .dot {
      width: 8px; height: 8px; border-radius: 50%;
      background: #10b981; animation: pulse-dot 2s infinite;
    }
    @keyframes pulse-dot {
      0%, 100% { opacity: 1; } 50% { opacity: 0.4; }
    }
    #ahaget-inspector-toolbar .stat {
      font-weight: 700; color: #6366f1;
    }
    #ahaget-save-btn {
      background: linear-gradient(135deg,#6366f1,#8b5cf6);
      color: #fff; border: none; border-radius: 8px;
      padding: 7px 14px; font-size: 12px; font-weight: 700;
      cursor: pointer; transition: opacity 0.15s;
    }
    #ahaget-save-btn:hover { opacity: 0.85; }
    #ahaget-save-btn:disabled { opacity: 0.4; cursor: not-allowed; }

    #ahaget-annotation-panel {
      position: fixed;
      top: 0; right: 0;
      width: 360px; height: 100vh;
      background: #1a1a2e;
      border-left: 1px solid rgba(99,102,241,0.25);
      z-index: 2147483646;
      display: flex; flex-direction: column;
      font-family: -apple-system, BlinkMacSystemFont, 'Inter', sans-serif;
      box-shadow: -8px 0 32px rgba(0,0,0,0.3);
      transform: translateX(100%);
      transition: transform 0.2s ease;
    }
    #ahaget-annotation-panel.open { transform: translateX(0); }
    .ahaget-panel-header {
      padding: 16px 20px;
      border-bottom: 1px solid rgba(99,102,241,0.15);
      display: flex; align-items: center; justify-content: space-between;
    }
    .ahaget-panel-title { font-size: 13px; font-weight: 700; color: #e2e2ef; }
    .ahaget-panel-close {
      background: none; border: none; color: #6b7280; font-size: 18px;
      cursor: pointer; padding: 0 4px; line-height: 1;
    }
    .ahaget-panel-close:hover { color: #e2e2ef; }
    .ahaget-panel-body { flex: 1; overflow-y: auto; padding: 16px 20px; }
    .ahaget-field { margin-bottom: 14px; }
    .ahaget-field label {
      display: block; font-size: 10px; font-weight: 700;
      color: #6b7280; text-transform: uppercase; letter-spacing: 0.06em;
      margin-bottom: 5px;
    }
    .ahaget-field input, .ahaget-field textarea, .ahaget-field select {
      width: 100%; padding: 8px 10px; border-radius: 7px; font-size: 12px;
      background: #0f0f23; border: 1px solid rgba(99,102,241,0.2);
      color: #e2e2ef; outline: none; box-sizing: border-box; font-family: inherit;
      transition: border-color 0.15s;
    }
    .ahaget-field input:focus, .ahaget-field textarea:focus, .ahaget-field select:focus {
      border-color: rgba(99,102,241,0.6);
    }
    .ahaget-field textarea { min-height: 72px; resize: vertical; line-height: 1.5; }
    .ahaget-toggle {
      display: flex; align-items: center; gap: 10px;
      font-size: 12px; color: #9ca3af; cursor: pointer; margin-bottom: 14px;
    }
    .ahaget-toggle input { width: auto; }
    .ahaget-el-meta {
      background: #0f0f23; border-radius: 7px;
      padding: 8px 10px; margin-bottom: 14px;
      font-size: 11px; color: #6b7280; font-family: monospace;
      word-break: break-all;
    }
    .ahaget-panel-footer {
      padding: 14px 20px;
      border-top: 1px solid rgba(99,102,241,0.15);
      display: flex; gap: 10px;
    }
    .ahaget-btn-primary {
      flex: 1; background: linear-gradient(135deg,#6366f1,#8b5cf6);
      color: #fff; border: none; border-radius: 8px;
      padding: 9px; font-size: 12px; font-weight: 700; cursor: pointer;
    }
    .ahaget-btn-primary:hover { opacity: 0.85; }
    .ahaget-btn-secondary {
      background: rgba(99,102,241,0.1); color: #9ca3af;
      border: 1px solid rgba(99,102,241,0.2); border-radius: 8px;
      padding: 9px 14px; font-size: 12px; cursor: pointer;
    }
    .ahaget-btn-secondary:hover { color: #e2e2ef; }
    .ahaget-toast {
      position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%);
      background: #1a1a2e; border: 1px solid rgba(99,102,241,0.3);
      border-radius: 10px; padding: 10px 20px;
      font-family: -apple-system, BlinkMacSystemFont, 'Inter', sans-serif;
      font-size: 12px; font-weight: 600; color: #e2e2ef;
      box-shadow: 0 4px 20px rgba(0,0,0,0.3);
      z-index: 2147483647; white-space: nowrap;
      animation: slideUp 0.2s ease;
    }
    @keyframes slideUp {
      from { transform: translateX(-50%) translateY(10px); opacity: 0; }
      to   { transform: translateX(-50%) translateY(0);    opacity: 1; }
    }
  `,document.head.appendChild(i)}function F(i,e=3e3){const t=document.getElementById("ahaget-inspector-toast");t&&t.remove();const o=document.createElement("div");o.id="ahaget-inspector-toast",o.className="ahaget-toast",o.textContent=i,document.body.appendChild(o),setTimeout(()=>o.remove(),e)}function $t(){const i=document.createElement("div");return i.id="ahaget-inspector-toolbar",i.innerHTML=`
    <div class="dot"></div>
    <span>Ahaget Inspector</span>
    <span><span class="stat" id="ahaget-el-count">0</span> elements</span>
    <span><span class="stat" id="ahaget-ann-count">0</span> annotated</span>
    <input id="ahaget-state-label" placeholder="State label (e.g. Modal open)"
      style="padding:5px 10px;border-radius:6px;font-size:11px;border:1px solid rgba(99,102,241,0.3);background:#0f0f23;color:#e2e2ef;outline:none;width:190px;" />
    <button id="ahaget-save-btn">Save Capture</button>
  `,document.body.appendChild(i),document.getElementById("ahaget-save-btn").addEventListener("click",Pt),i}function me(){const i=document.getElementById("ahaget-el-count"),e=document.getElementById("ahaget-ann-count");if(i&&(i.textContent=String(k.size)),e){const t=Array.from(k.values()).filter(o=>o.annotation.customLabel||o.annotation.customDescription||o.annotation.businessRule);e.textContent=String(t.length)}}let M=null;function _t(){const i=document.createElement("div");return i.id="ahaget-annotation-panel",i.innerHTML=`
    <div class="ahaget-panel-header">
      <span class="ahaget-panel-title">Annotate Element</span>
      <button class="ahaget-panel-close" id="ahaget-panel-close">✕</button>
    </div>
    <div class="ahaget-panel-body">
      <div class="ahaget-el-meta" id="ahaget-el-meta"></div>
      <div class="ahaget-field">
        <label>Label</label>
        <input id="ahaget-ann-label" placeholder='e.g. "Billing entity selector"' />
      </div>
      <div class="ahaget-field">
        <label>Description</label>
        <textarea id="ahaget-ann-desc" placeholder="What does this element do?"></textarea>
      </div>
      <div class="ahaget-field">
        <label>Business Rule</label>
        <textarea id="ahaget-ann-rule" placeholder='e.g. "Selecting Personal blocks payment for unverified accounts"'></textarea>
      </div>
      <div class="ahaget-field">
        <label>Element Type Override</label>
        <select id="ahaget-ann-type">
          <option value="">Auto-detected</option>
          <option value="button">Button</option>
          <option value="input">Input</option>
          <option value="select">Select / Dropdown</option>
          <option value="textarea">Textarea</option>
          <option value="link">Link</option>
          <option value="modal_trigger">Modal Trigger</option>
          <option value="error_indicator">Error Indicator</option>
        </select>
      </div>
      <label class="ahaget-toggle">
        <input type="checkbox" id="ahaget-ann-sensitive" />
        Mark as sensitive (agent won't read or log this field's value)
      </label>
    </div>
    <div class="ahaget-panel-footer">
      <button class="ahaget-btn-primary" id="ahaget-ann-save">Save Annotation</button>
      <button class="ahaget-btn-secondary" id="ahaget-ann-cancel">Cancel</button>
    </div>
  `,document.body.appendChild(i),document.getElementById("ahaget-panel-close").addEventListener("click",Y),document.getElementById("ahaget-ann-cancel").addEventListener("click",Y),document.getElementById("ahaget-ann-save").addEventListener("click",It),i}function At(i){M=i.selector;const e=document.getElementById("ahaget-annotation-panel"),t=k.get(i.selector),o=(t==null?void 0:t.annotation)??{customLabel:"",customDescription:"",businessRule:"",isSensitive:!1,elementType:""};document.getElementById("ahaget-el-meta").textContent=`<${i.tag}> ${i.selector}${i.text?` — "${i.text.slice(0,40)}"`:""}`,document.getElementById("ahaget-ann-label").value=o.customLabel,document.getElementById("ahaget-ann-desc").value=o.customDescription,document.getElementById("ahaget-ann-rule").value=o.businessRule,document.getElementById("ahaget-ann-type").value=o.elementType,document.getElementById("ahaget-ann-sensitive").checked=o.isSensitive,e.classList.add("open")}function Y(){const i=document.getElementById("ahaget-annotation-panel");i==null||i.classList.remove("open"),M=null}function It(){if(!M)return;const i=k.get(M);if(!i)return;i.annotation={customLabel:document.getElementById("ahaget-ann-label").value.trim(),customDescription:document.getElementById("ahaget-ann-desc").value.trim(),businessRule:document.getElementById("ahaget-ann-rule").value.trim(),isSensitive:document.getElementById("ahaget-ann-sensitive").checked,elementType:document.getElementById("ahaget-ann-type").value};const e=document.querySelector(M);if(e){const t=!!(i.annotation.customLabel||i.annotation.customDescription||i.annotation.businessRule);e.classList.toggle("annotated",t)}me(),Y(),F("✅ Annotation saved")}function Lt(i){document.querySelectorAll(".ahaget-highlight").forEach(e=>{e.classList.remove("ahaget-highlight","annotated")}),i.forEach(e=>{var o;const t=document.querySelector(e.selector);t&&(t.closest("#ahaget-inspector-toolbar")||t.closest("#ahaget-annotation-panel")||(t.classList.add("ahaget-highlight"),k.set(e.selector,{el:e,annotation:((o=k.get(e.selector))==null?void 0:o.annotation)??{customLabel:"",customDescription:"",businessRule:"",isSensitive:!1,elementType:""}}),t.addEventListener("click",n=>{n.preventDefault(),n.stopPropagation(),At(e)},{capture:!0})))}),me()}async function Pt(){var n,a,s;const i=document.getElementById("ahaget-save-btn");if(!i)return;i.disabled=!0,i.textContent="Saving…";const e=window.__ahaget_inspector_config,t=Ct(),o=Array.from(k.values()).map(({el:r,annotation:l})=>({tag:r.tag,selector:r.selector,text:r.text,elementType:l.elementType||void 0,inputType:r.type,ariaLabel:r.ariaLabel,placeholder:r.placeholder,name:r.name,dataTestId:r.dataTestId,role:r.role,classes:r.classes,rect:r.rect,customLabel:l.customLabel||void 0,customDescription:l.customDescription||void 0,businessRule:l.businessRule||void 0,isSensitive:l.isSensitive||void 0}));try{const r=await fetch(`${e.apiUrl}/api/v1/interface-map/capture`,{method:"POST",headers:{"Content-Type":"application/json","X-API-Key":e.apiKey},body:JSON.stringify({url:window.location.pathname,title:document.title,stateLabel:((n=document.getElementById("ahaget-state-label"))==null?void 0:n.value.trim())||"Default",framework:t,elements:o})});if(!r.ok)throw new Error(`HTTP ${r.status}`);const l=await r.json();F(`✅ Capture saved — ${((s=(a=l.snapshot)==null?void 0:a.elements)==null?void 0:s.length)??o.length} elements stored`),i.textContent="✅ Saved",setTimeout(()=>{i.disabled=!1,i.textContent="Save Capture"},3e3)}catch(r){console.error("[ahaget-inspector] save failed:",r),F("❌ Save failed — check console"),i.disabled=!1,i.textContent="Save Capture"}}function Mt(i){let e=window.location.href;const t=history.pushState.bind(history);history.pushState=(...o)=>{t(...o),window.location.href!==e&&(e=window.location.href,i())},window.addEventListener("popstate",()=>{window.location.href!==e&&(e=window.location.href,i())})}function fe(i){window.__ahaget_inspector_config=i,kt(),$t(),_t();function e(){k.clear();const o=N();Lt(o.elements)}setTimeout(e,300),Mt(()=>setTimeout(e,300)),new MutationObserver(()=>{clearTimeout(window.__ahaget_rescan_timeout),window.__ahaget_rescan_timeout=setTimeout(e,500)}).observe(document.body,{childList:!0,subtree:!0}),F("🔍 Ahaget Inspector active — click any element to annotate")}(function(){const e=new URLSearchParams(window.location.search);if(e.get("ahaget_inspect")!=="1")return;const t=e.get("ahaget_key");if(t){const n=e.get("ahaget_api_url")??C.apiUrl;fe({apiKey:t,apiUrl:n});return}const o=window.Ahaget;window.__ahaget_inspector_pending=!0,window.Ahaget=function(n,a){if(n==="init"&&window.__ahaget_inspector_pending){window.__ahaget_inspector_pending=!1;const s=a;fe({apiKey:s.apiKey,apiUrl:s.apiUrl??C.apiUrl});return}o&&o(n,a)}})(),window.__ahaget_inspector_pending||(window.Ahaget=function(i,e){var t;if(i==="init"){if(window.__oai_widget)return;const o=ye(),n={...o,...e};o.metadata&&e.metadata&&(n.metadata={...o.metadata,...e.metadata});const a=new Tt(n);a.init(),window.__oai_widget=a;return}if(i==="event"){const o=e;(t=window.__oai_widget)==null||t.getCopilot().fireEvent(o);return}}),Array.isArray(window.__oai_q)&&window.__oai_q.forEach(([i,e])=>window.Ahaget(i,e))})();
