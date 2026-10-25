const G = Duet;
const $ = id => document.getElementById(id);
const icons = { R: '→', L: '←', U: '↑', D: '↓', W: 'Ⅱ' };
const words = { R: '向右', L: '向左', U: '向上', D: '向下', W: '等一拍' };
let level = 0, s, history = [], busy = false, sound = false, ctx, hintStage = 0, discovered = false;
let completed = [];
try { const value = JSON.parse(localStorage.getItem('duet-completed') || '[]'); if (Array.isArray(value)) completed = value.filter(i => Number.isInteger(i) && i >= 0 && i < G.levels.length); } catch {}
const l = () => G.levels[level];
const xy = p => [70 + p[0] * 70, 65 + p[1] * 55];
const delay = ms => new Promise(resolve => setTimeout(resolve, matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : ms));

function note(i) {
  if (!sound) return;
  try {
    ctx ||= new (window.AudioContext || window.webkitAudioContext)(); ctx.resume();
    const o = ctx.createOscillator(), gain = ctx.createGain(); o.frequency.value = i ? 523 : 392;
    gain.gain.setValueAtTime(.045, ctx.currentTime); gain.gain.exponentialRampToValueAtTime(.001, ctx.currentTime + .25);
    o.connect(gain); gain.connect(ctx.destination); o.start(); o.stop(ctx.currentTime + .25);
  } catch {}
}
function shape(g, x, y, fill) {
  return g.shape === 'circle' ? `<circle cx="${x}" cy="${y}" r="12" fill="${fill}" stroke="#def1dc" stroke-width="2"/>` : `<path d="M${x} ${y - 15}l15 15-15 15-15-15Z" fill="${fill}" stroke="#def1dc" stroke-width="2"/>`;
}
function move(i, p) { const [x, y] = xy(p); $('actor' + i).style.transform = `translate(${x}px,${y}px)`; }
function statusOfGate(g, j) {
  if (g.kind === 'latch') return s.lit[j] ? '已留门' : '踩过留门';
  if (g.kind === 'pair') return G.gateOpen(l(), s, j) ? '双灯已亮' : s.lit[j] ? '等另一盏' : '双灯';
  return G.eq(g.owner ? s.b : s.a, g.plate) ? '照看中' : s.hold[j] ? '余 1 拍' : '未点亮';
}
function render() {
  move(0, s.a); move(1, s.b);
  $('pending').textContent = G.dock(l(), s, 1) ? '已到达' : icons[s.last] + ' ' + words[s.last];
  $('count').textContent = s.steps + ' 拍';
  l().gates.forEach((g, j) => {
    const occupied = G.eq(s.a, g.at) || G.eq(s.b, g.at);
    $('gate' + j).style.opacity = G.gateOpen(l(), s, j) || occupied ? '.08' : '1';
    $('lit' + j).setAttribute('opacity', (g.kind ? s.lit[j] : s.hold[j]) ? '.8' : '0');
    if ($('gate-state' + j)) $('gate-state' + j).textContent = statusOfGate(g, j);
    if ($('wire' + j)) $('wire' + j).classList.toggle('wire-on', G.gateOpen(l(), s, j));
  });
  if (level >= 7) {
    const seen = new Set();
    $('legend').innerHTML = l().gates.map((g, j) => {
      const key = g.plate.join(','); if (seen.has(key)) return ''; seen.add(key);
      return `<span class="circuit-status ${s.hold[j] && !G.eq(g.owner ? s.b : s.a, g.plate) && !g.kind ? 'grace' : ''}">${g.owner ? '蓝' : '橙'} ${g.shape === 'circle' ? '●' : '◆'} · ${statusOfGate(g, j)}</span>`;
    }).join('');
  }
  const n = G.step(l(), s, 'W');
  if (n && !G.dock(l(), s, 1)) {
    const [x, y] = xy(n.b);
    $('ghost').innerHTML = `<circle class="ghost" cx="${x}" cy="${y}" r="22" fill="none" stroke="#377e8e" stroke-width="2"/><text x="${x + 24}" y="${y - 14}" fill="#377e8e" font-size="13">${icons[s.last]}</text>`;
  } else $('ghost').innerHTML = '';
  document.querySelectorAll('[data-d]').forEach(b => b.disabled = busy || G.won(l(), s));
  $('undo').disabled = busy || !history.length;
  ['hint', 'restart', 'hint-more'].forEach(id => $(id).disabled = busy || (id !== 'restart' && G.won(l(), s)));
  document.querySelectorAll('[data-l], [data-chapter]').forEach(b => b.disabled = busy);
}
function drawNavigation() {
  const chapter = level < 7 ? 1 : 2;
  document.querySelectorAll('[data-chapter]').forEach(b => { b.classList.toggle('active', Number(b.dataset.chapter) === chapter); b.setAttribute('aria-pressed', Number(b.dataset.chapter) === chapter); });
  $('levels').innerHTML = G.levels.map((a, j) => {
    if ((j < 7 ? 1 : 2) !== chapter) return '';
    return `<button data-l="${j}" class="${j === level ? 'active' : ''}" aria-current="${j === level ? 'step' : 'false'}" aria-label="房间 ${j + 1} ${a.name}${completed.includes(j) ? ' 已完成' : ''}">${completed.includes(j) ? '<span class="done">✓</span> ' : ''}${j + 1} · ${a.short || ['跟上', '搭桥', '默契'][j]}</button>`;
  }).join('');
  document.querySelectorAll('[data-l]').forEach(b => b.onclick = () => load(+b.dataset.l));
}
function hideHint() { $('hint-panel').hidden = true; $('hint').setAttribute('aria-expanded', 'false'); $('world').classList.remove('hint-focus'); }
function load(i) {
  if (busy) return;
  level = i; const u = new URL(location.href); u.searchParams.set('room', i + 1); window.history.replaceState(null, '', u);
  s = G.initial(l()); history = []; hintStage = 0; discovered = false; $('message').classList.remove('insight');
  $('ending').hidden = true; hideHint();
  $('chapter').textContent = `${level < 7 ? '初遇' : '默契'} · 房间 ${String(i + 1).padStart(2, '0')} / ${G.levels.length}`;
  $('name').textContent = l().name; $('message').textContent = l().intro || l().hint;
  $('legend').hidden = level < 7;
  drawNavigation(); draw(); render();
}
function insight(old, next, d) {
  if (level === 7) return G.eq(old.a, [2, 1]) && next.blocked[0] && d === 'R' && !G.eq(old.b, next.b);
  if (level === 8) return !G.eq(old.a, next.a) && !G.eq(old.b, next.b) && d !== old.last && l().gates.every(g => G.eq(g.owner ? next.a : next.b, g.at));
  if (level === 9) return G.eq(old.a, [3, 2]) && G.eq(next.a, [3, 1]) && old.lit[0];
  if (level === 10) return !G.eq(old.a, l().gates[0].plate) && old.hold[0] > 0 && !G.eq(old.b, l().gates[0].at) && G.eq(next.b, l().gates[0].at);
  return false;
}
const oldEndings = ['会等待，也是一种配合。', '你替我开门，我替你铺路。', '墙没有挡住你们，它帮你们对上了节奏。', '留下的路，不必一直守着。', '两盏灯的光，合成一条路。', '先帮你过去，再接住你的帮助。', '有的帮助会留下，有的需要刚好一拍。'];
async function act(d) {
  if (busy) return; const n = G.step(l(), s, d); if (!n) return;
  history.push(s); busy = true; hideHint(); render();
  $('message').textContent = `A ${words[d]}；B 接住上一拍的「${words[s.last]}」。`;
  move(0, n.a); note(0); await delay(180); move(1, n.b); note(1); await delay(240);
  const prev = s; s = n; busy = false; render();
  if (G.won(l(), s)) {
    if (!completed.includes(level)) { completed.push(level); try { localStorage.setItem('duet-completed', JSON.stringify(completed)); } catch {} }
    drawNavigation(); $('ending').hidden = false;
    $('endtext').textContent = l().aha || oldEndings[level];
    $('next').textContent = level === G.levels.length - 1 ? '回到第八关，再试一次' : '下一个房间 →'; $('next').focus();
  } else if (!discovered && insight(prev, n, d)) {
    discovered = true; $('message').textContent = l().aha; $('message').classList.add('insight');
  } else {
    $('message').classList.remove('insight');
    if (s.lit.some((v, j) => v && !prev.lit[j] && l().gates[j].kind)) $('message').textContent = l().gates.some(g => g.kind === 'pair') ? '灯光已经留下。两盏都亮，门才会打开。' : '机关已锁定开启，不必再站着守门。';
    else if (s.passed.some((v, j) => v && !prev.passed[j])) $('message').textContent = '借着伙伴打开的门，过去了！';
    else if (G.dock(l(), s, 0)) $('message').textContent = 'A 在亭里等你。继续传方向，或等一拍让 B 跟上。';
    else if (n.blocked.some(Boolean)) $('message').textContent = '停下的是位置，方向仍然传给了下一拍。';
  }
}
function showHint() {
  $('hint-panel').hidden = false; $('hint').setAttribute('aria-expanded', 'true');
  const docked = G.dock(l(), s, 0) || G.dock(l(), s, 1);
  const ideas = docked ? ['一盏灯已经到达，留在亭里不会再移动。看看另一盏的路线。', '先看待执行的箭头。如果那一步已经能让它到达，就让这一拍过去。'] : l().ideas || [l().hint, '先看蓝光下一拍的虚线位置，再想橙光现在要走哪里。'];
  $('hint-label').textContent = ['想一想', '观察这里', '只看下一拍'][Math.min(hintStage, 2)];
  if (hintStage < 2) {
    $('hint-text').textContent = ideas[hintStage]; $('hint-more').textContent = hintStage === 0 ? '再给一点线索' : '告诉我下一拍';
  } else {
    const path = G.solve(l(), s);
    $('hint-text').textContent = path ? `下一拍可以试试「${words[path[0]]}」。A 现在执行；B 仍执行上面已排好的方向。` : '目前的站位走不通了。撤销几拍，回到两人都还没进亭的时候。';
    $('hint-more').textContent = '收起，自己试试';
  }
  $('world').classList.toggle('hint-focus', hintStage === 1);
}
document.querySelectorAll('[data-d]').forEach(b => b.onclick = () => act(b.dataset.d));
document.querySelectorAll('[data-chapter]').forEach(b => b.onclick = () => load(Number(b.dataset.chapter) === 1 ? 0 : 7));
$('undo').onclick = () => { if (busy || !history.length) return; s = history.pop(); discovered = false; $('ending').hidden = true; hideHint(); render(); $('message').textContent = '回到上一拍，位置、机关和待执行动作都恢复了。'; };
$('restart').onclick = $('replay').onclick = () => load(level);
$('next').onclick = () => load(level === G.levels.length - 1 ? 7 : level + 1);
$('hint').onclick = () => { hintStage = 0; showHint(); };
$('hint-more').onclick = () => { if (hintStage >= 2) hideHint(); else { hintStage++; showHint(); } };
$('hint-close').onclick = hideHint;
$('sound').onclick = () => { sound = !sound; $('sound').textContent = '声音 ' + (sound ? '开' : '关'); $('sound').setAttribute('aria-pressed', sound); note(0); };
document.addEventListener('keydown', e => {
  if (e.metaKey || e.ctrlKey || e.altKey || e.repeat || !e.target || ['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return;
  if (e.key.toLowerCase() === 'z') { e.preventDefault(); $('undo').click(); return; }
  if (!$('ending').hidden || (e.key === ' ' && e.target.tagName === 'BUTTON' && !e.target.dataset.d)) return;
  const d = { ArrowRight: 'R', ArrowLeft: 'L', ArrowUp: 'U', ArrowDown: 'D', ' ': 'W', w: 'U', a: 'L', s: 'D', d: 'R' }[e.key];
  if (d) { e.preventDefault(); act(d); }
});
load(Math.max(0, Math.min(G.levels.length - 1, (Number(new URLSearchParams(location.search).get('room')) || 1) - 1)));
