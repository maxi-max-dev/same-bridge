/* Original SVG characters; presentation only, never changes game state. */
const DuetSpirits = (() => {
  function markup(i) {
    const blue = i === 1, coat = blue ? '#72aeb3' : '#dc9a61', dark = blue ? '#397680' : '#a66436';
    return `<g id="actor${i}" class="actor spirit" data-pose="idle"><ellipse class="spirit-shadow" cy="20" rx="19" ry="6" fill="#42656a" opacity=".19"/><g class="spirit-bob"><g class="spirit-turn"><path class="spirit-scarf" d="M-11-3Q-26-9-29 2L-22 5-29 12Q-16 12-7 5" fill="${dark}"/><g class="spirit-feet" fill="${dark}"><ellipse class="foot-left" cx="-8" cy="17" rx="6" ry="4"/><ellipse class="foot-right" cx="8" cy="17" rx="6" ry="4"/></g><path d="M-15-9Q-23 2-17 15Q0 24 17 15Q23 2 15-9Z" fill="${coat}" stroke="${dark}" stroke-width=".7"/><path d="M-8 4Q0 0 8 4L10 15Q0 20-10 15Z" fill="#fff1ce" opacity=".65"/><g class="spirit-arm left"><path d="M-15 1l-8 8" stroke="${dark}" stroke-width="7" stroke-linecap="round"/><circle cx="-23" cy="9" r="4" fill="#fff1d9"/></g><g class="spirit-arm right"><path d="M15 1l8 8" stroke="${dark}" stroke-width="7" stroke-linecap="round"/><circle cx="23" cy="9" r="4" fill="#fff1d9"/></g><g class="spirit-head">${blue ? `<path d="M-20-11Q-28-34-12-34Q-10-49 1-39Q19-43 20-25Q27-10 13-5Z" fill="${coat}" stroke="${dark}" stroke-width="1"/><path d="M-8-34Q-10-45 0-44Q5-35-8-34" fill="#b9d8ae"/>` : `<path d="M-21-11Q-26-30-13-34Q-1-42 12-33Q26-26 21-11Z" fill="${coat}" stroke="${dark}" stroke-width="1"/><path d="M0-34Q-6-49 9-47Q18-39 0-34" fill="#7f9b65"/><path d="M-22-19Q0-30 22-19" fill="none" stroke="${dark}" stroke-width="3"/>`}<ellipse cy="-13" rx="16" ry="14" fill="#fff0d5"/><g class="spirit-face"><g class="eyes-open" fill="#364e53"><ellipse cx="-6" cy="-15" rx="2" ry="3"/><ellipse cx="6" cy="-15" rx="2" ry="3"/></g><path class="eyes-happy" d="M-9-14q3-5 6 0m6 0q3-5 6 0" fill="none" stroke="#364e53" stroke-width="2" stroke-linecap="round"/><ellipse cx="-10" cy="-9" rx="3" ry="1.7" fill="#dba084" opacity=".6"/><ellipse cx="10" cy="-9" rx="3" ry="1.7" fill="#dba084" opacity=".6"/><path d="M-3-7q3 4 6 0" fill="none" stroke="#755a46" stroke-width="1.5" stroke-linecap="round"/></g></g><path d="M7 3q7-7 10-2q-1 7-10 2" fill="#d5e2b2" stroke="#6e956d" stroke-width=".7"/></g></g><g class="spirit-bubble"><rect x="-33" y="-72" width="66" height="23" rx="11" fill="#fffaf0" stroke="${blue ? '#93bdbd' : '#ddb68a'}"/><path d="M-3-49l4 5 4-5" fill="#fffaf0"/><text id="spirit-cue${i}" y="-56" text-anchor="middle" font-size="14" font-weight="600" fill="${dark}"></text></g></g>`;
  }
  function pose(step, i) {
    const poses = [
      [{ mode:'idle', cue:'我带路', look:[3,0] }, { mode:'watch', cue:'我学你', look:[3,-3] }],
      [{ mode:'invite', cue:'轮到你啦', look:[-2,3] }, { mode:'remember', cue:'记住 →', look:[3,-2] }],
      [{ mode:'thanks', cue:'门开啦', look:[-3,3] }, { mode:'help', cue:'我帮你', look:[3,-3] }],
      [{ mode:'help', cue:'换我帮你', look:[-2,3] }, { mode:'remember', cue:'收到 →', look:[3,-2] }],
      [{ mode:'waiting', cue:'等你一起', look:[3,3], turn:-1 }, { mode:'follow', cue:'我来啦 →', look:[3,-2] }],
      [{ mode:'joy', cue:'一起到家', look:[0,2] }, { mode:'joy', cue:'跟上你啦', look:[0,-2] }]
    ];
    return poses[Math.min(step,5)][i];
  }
  function render(state) {
    for (let i=0;i<2;i++) {
      const el=document.getElementById('actor'+i), p=pose(state.steps,i);
      el.dataset.pose=p.mode; el.classList.remove('walking');
      el.style.setProperty('--turn',p.turn||1);
      el.style.setProperty('--look-x',p.look[0]+'px');el.style.setProperty('--look-y',p.look[1]+'px');
      document.getElementById('spirit-cue'+i).textContent=p.cue;
    }
  }
  function walk(i, from, to, direction) {
    const el=document.getElementById('actor'+i);
    if(from[0]===to[0]&&from[1]===to[1])return;
    el.dataset.pose='walking';el.classList.add('walking');el.style.setProperty('--turn',direction==='L'?-1:1);
    el.style.setProperty('--look-x','3px');el.style.setProperty('--look-y','0px');
    document.getElementById('spirit-cue'+i).textContent=i?'学你 →':'先走 →';
  }
  const api={markup,pose,render,walk};
  if(typeof module!=='undefined')module.exports=api;
  return api;
})();
