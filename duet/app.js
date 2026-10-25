const G = Duet;
const C = DuetChallenge;
const L = DuetLearn;
const $ = id => document.getElementById(id);
const icons = { R: '→', L: '←', U: '↑', D: '↓', W: 'Ⅱ' };
const words = { R: '向右', L: '向左', U: '向上', D: '向下', W: '等待' };
let level = 0, s, history = [], busy = false, sound = false, ctx, hintStage = 0, discovered = false;
let learning = false, returnRoom = L.roomFrom(location.search), lessonSeen = null;
let completed = [];
let bests = {}, canSave = true;
try { const value = JSON.parse(localStorage.getItem('duet-completed') || '[]'); if (Array.isArray(value)) completed = value.filter(i => Number.isInteger(i) && i >= 0 && i < G.levels.length); } catch {}
try { bests = C.readBests(localStorage.getItem('duet-bests-v1')); } catch { canSave = false; }
try { lessonSeen = localStorage.getItem('duet-learn-v1'); } catch {}
const l = () => learning ? L.level : G.levels[level];
const outcome = () => learning ? G.won(l(), s) ? 'won' : 'playing' : C.outcome(l(), s);
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
function statusOfGate(g, j, short = false) {
  if (g.kind === 'latch') return s.lit[j] ? '已常开' : short ? '常开' : '踩一次常开';
  if (g.kind === 'pair') return G.gateOpen(l(), s, j) ? '门已开' : short ? '双灯' : s.lit[j] ? '还差另一个机关' : '两处都踩过才开';
  return G.eq(g.owner ? s.b : s.a, g.plate) ? '门已开' : s.hold[j] ? '再开1步' : short ? '门已关' : '踩住就开门';
}
function renderChallenge() {
  if (learning) return;
  const t = C.targets(l()), left = Math.max(0, t.limit - s.steps);
  $('count').textContent = `${s.steps} / ${t.limit} 步`;
  $('remaining').textContent = G.won(l(), s) ? '两个都到家了' : `还能走 ${left} 步`;
  $('count').classList.toggle('low', left <= 2 && !G.won(l(), s));
  $('optimal').textContent = `最优 ${t.optimal} 步`;
  $('best').textContent = bests[level] ? `${canSave ? '个人' : '本次'}最佳 ${bests[level]} 步` : completed.includes(level) ? '已通关 · 再试试拿星' : '首次挑战';
  const labels = [[3, t.optimal, 'target-three'], [2, t.silver, 'target-two'], [1, t.limit, 'target-one']];
  labels.forEach(([stars, max, id]) => {
    $(id).textContent = `${'★'.repeat(stars)} ${stars === 3 ? '' : '≤ '}${max} 步`;
    $(id).classList.toggle('missed', s.steps > max);
  });
  $('beat-track').innerHTML = Array.from({ length: t.limit }, (_, i) => `<i class="${i < s.steps ? 'used ' : ''}${i >= t.optimal ? 'extra ' : ''}${i === t.optimal - 1 || i === t.silver - 1 ? 'milestone' : ''}"></i>`).join('');
}
function render() {
  move(0, s.a); move(1, s.b);
  if (learning) DuetSpirits.render(s);
  const dockA = G.dock(l(), s, 0), dockB = G.dock(l(), s, 1);
  $('current').textContent = dockA ? '已到家 · 会停住' : '按方向就走';
  $('pending').textContent = dockB ? '已到家 · 会停住' : s.steps === 0 ? '第一次先不动' : `下次 ${icons[s.last]} ${words[s.last]}`;
  $('arrivals').textContent = `${Number(dockA) + Number(dockB)} / 2 到达`;
  $('world').setAttribute('aria-label', `地图。${learning ? '橙精灵' : '橙灯'}在第${s.a[0] + 1}列第${s.a[1] + 1}行${dockA ? '，已到终点' : ''}；${learning ? '蓝精灵' : '蓝灯'}在第${s.b[0] + 1}列第${s.b[1] + 1}行${dockB ? '，已到终点' : ''}。`);
  renderChallenge();
  l().gates.forEach((g, j) => {
    const occupied = G.eq(s.a, g.at) || G.eq(s.b, g.at);
    $('gate' + j).style.opacity = G.gateOpen(l(), s, j) || occupied ? '.08' : '1';
    $('lit' + j).setAttribute('opacity', (g.kind ? s.lit[j] : s.hold[j]) ? '.8' : '0');
    if ($('gate-state' + j)) $('gate-state' + j).textContent = statusOfGate(g, j, true);
    if ($('wire' + j)) $('wire' + j).classList.toggle('wire-on', G.gateOpen(l(), s, j));
  });
  if (!learning) {
    const seen = new Set();
    $('legend').innerHTML = l().gates.map((g, j) => {
      const key = g.plate.join(','); if (seen.has(key)) return ''; seen.add(key);
      return `<span class="circuit-status ${s.hold[j] && !G.eq(g.owner ? s.b : s.a, g.plate) && !g.kind ? 'grace' : ''}">${g.owner ? '蓝' : '橙'} ${g.shape === 'circle' ? '●' : '◆'} · ${statusOfGate(g, j)}</span>`;
    }).join('');
  }
  const n = G.step(l(), s, 'W');
  if (n && !G.dock(l(), s, 1) && !(learning && s.last === 'W')) {
    const [x, y] = xy(n.b);
    $('ghost').innerHTML = `<circle class="ghost" cx="${x}" cy="${y}" r="22" fill="none" stroke="#377e8e" stroke-width="2"/><text x="${x + 24}" y="${y - 14}" fill="#377e8e" font-size="13">${icons[s.last]}</text>`;
  } else $('ghost').innerHTML = '';
  const ended = outcome() !== 'playing';
  document.querySelector('.world-wrap').classList.toggle('has-result', ended);
  const cue = learning ? L.steps[s.steps] : null;
  document.querySelectorAll('[data-d]').forEach(b => {
    b.disabled = busy || ended || (learning && b.dataset.d !== cue?.action);
    b.classList.toggle('suggested', learning && !ended && b.dataset.d === cue?.action);
  });
  $('undo').disabled = busy || !history.length;
  ['hint', 'restart', 'hint-more'].forEach(id => $(id).disabled = busy || (id !== 'restart' && ended));
  document.querySelectorAll('[data-l], [data-chapter]').forEach(b => b.disabled = busy);
  ['learn-start', 'learn-skip', 'levels-toggle'].forEach(id => $(id).disabled = busy);
  if (learning && cue) {
    $('learn-title').textContent = cue.title;
    $('message').textContent = cue.text;
    $('learn-progress').textContent = `跟着试一试 · ${s.steps + 1} / ${L.steps.length}`;
  }
}
function drawNavigation() {
  const chapter = level < 7 ? 1 : 2;
  const total = G.levels.reduce((sum, a, i) => sum + (bests[i] ? C.stars(a, bests[i]) : 0), 0);
  $('star-total').textContent = `${total} / ${G.levels.length * 3} 星`;
  document.querySelectorAll('[data-chapter]').forEach(b => { b.classList.toggle('active', Number(b.dataset.chapter) === chapter); b.setAttribute('aria-pressed', Number(b.dataset.chapter) === chapter); });
  $('levels').innerHTML = G.levels.map((a, j) => {
    if ((j < 7 ? 1 : 2) !== chapter) return '';
    const stars = bests[j] ? C.stars(a, bests[j]) : 0;
    const record = stars ? ` ${stars}星 最佳${bests[j]}步` : completed.includes(j) ? ' 已完成' : '';
    return `<button data-l="${j}" class="${j === level ? 'active' : ''}" aria-current="${j === level ? 'step' : 'false'}" aria-label="房间 ${j + 1} ${a.name}${record}"><span>${!stars && completed.includes(j) ? '<span class="done">✓</span> ' : ''}${j + 1} · ${a.short || ['跟上', '搭桥', '默契'][j]}</span><small class="nav-stars" aria-hidden="true">${'★'.repeat(stars)}${'☆'.repeat(3 - stars)}</small></button>`;
  }).join('');
  document.querySelectorAll('[data-l]').forEach(b => b.onclick = () => load(+b.dataset.l));
}
function hideHint() { $('hint-panel').hidden = true; $('hint').setAttribute('aria-expanded', 'false'); $('world').classList.remove('hint-focus'); }
function setLearning(active) {
  learning = active;
  document.querySelector('.queue').setAttribute('aria-label', active ? '两个精灵分别怎么走' : '两盏灯分别怎么走');
  document.querySelector('.intro p').textContent = active ? '橙精灵带路，蓝精灵晚一步学着做。' : '你控制橙灯，蓝灯重复你上一次的操作。';
  document.querySelector('#role-orange span').innerHTML = '<i class="orange"></i>' + (active ? '橙精灵 · 你带路' : '橙灯 · 你来控制');
  document.querySelector('#role-blue span').innerHTML = '<i class="blue"></i>' + (active ? '蓝精灵 · 跟你学' : '蓝灯 · 慢一步');
  document.querySelector('.objective>span').innerHTML = active ? '目标：带两个精灵回到<strong>同色终点</strong>' : '目标：把两盏灯送到<strong>同色终点</strong>';
  document.querySelector('.wait small').textContent = active ? '你停一下，它做上一步' : '橙灯停，蓝灯做上一步';

  $('selection').hidden = true; $('levels-toggle').setAttribute('aria-expanded', 'false');
  document.body.classList.toggle('learning', active);
  ['learn-skip', 'learn-progress', 'learn-title'].forEach(id => $(id).hidden = !active);
  $('hint').hidden = active;
}
function rememberLesson(value) {
  lessonSeen = value;
  try { localStorage.setItem('duet-learn-v1', value); } catch {}
}
function startLearning() {
  if (busy) return;
  returnRoom = level;
  setLearning(true);
  const u = new URL(location.href); u.searchParams.set('learn', '1'); window.history.replaceState(null, '', u);
  s = G.initial(l()); history = []; $('ending').hidden = true; hideHint();
  $('message').classList.remove('insight');
  $('chapter').textContent = '新手练习 · 不计步数和星级';
  $('name').textContent = l().name; $('legend').hidden = true;
  draw(); render();
}
function load(i) {
  if (busy) return;
  setLearning(false);
  level = i; const u = new URL(location.href); u.searchParams.set('room', i + 1); u.searchParams.delete('learn'); window.history.replaceState(null, '', u);
  s = G.initial(l()); history = []; hintStage = 0; discovered = false; $('message').classList.remove('insight');
  $('ending').hidden = true; hideHint();
  $('chapter').textContent = `${level < 7 ? '初遇' : '默契'} · 房间 ${String(i + 1).padStart(2, '0')} / ${G.levels.length}`;
  $('name').textContent = l().name; $('message').textContent = DuetCopy[level].intro;
  $('legend').hidden = !l().gates.length;
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
function finish(result) {
  if (learning) {
    rememberLesson('done');
    $('ending').hidden = false; $('ending').classList.remove('chase');
    $('result-label').textContent = '两个精灵，互相帮了一次';
    $('end-stars').hidden = true;
    $('end-title').textContent = '一起到家了';
    $('end-score').textContent = '你走现在这步，它走你上一次的操作。';
    $('endtext').textContent = '踩机关能替对方开门；先到家也能继续帮它。接下来，自己试试。';
    $('recover').hidden = true; $('next').hidden = false;
    $('next').textContent = '从第 1 关开始 →';
    $('replay').textContent = returnRoom ? `回到第 ${returnRoom + 1} 关` : '再练一遍';
    $('learn-title').textContent = '已经一起开门、一起到家';
    $('learn-progress').textContent = '练习完成 · 5 / 5';
    $('message').textContent = '接下来的正式关卡仍是灯的造型，操作相同。先试试你能不能独立配合。';
    $('next').focus(); return;
  }
  const t = C.targets(l()), won = result === 'won', stars = won ? C.stars(l(), s.steps) : 0;
  if (won) {
    if (!completed.includes(level)) completed.push(level);
    bests = C.recordBest(bests, level, s);
    try { localStorage.setItem('duet-completed', JSON.stringify(completed)); localStorage.setItem('duet-bests-v1', JSON.stringify(bests)); } catch { canSave = false; }
    drawNavigation(); renderChallenge();
  }
  $('ending').hidden = false;
  $('ending').classList.toggle('chase', won && stars < 3);
  $('result-label').textContent = won ? '一起到家' : '换个走法，再试一次';
  $('end-stars').hidden = !won;
  $('end-stars').innerHTML = Array.from({ length: 3 }, (_, i) => `<span class="${i < stars ? 'lit-star' : ''}">${i < stars ? '★' : '☆'}</span>`).join('');
  $('end-stars').setAttribute('aria-label', `${stars} 星`);
  $('end-title').textContent = !won ? '这轮的步数用完了' : stars === 3 ? '两盏灯到家，刚好三星！' : '两盏灯都到家了';
  $('end-score').textContent = won ? `${s.steps} 步通关 · 最优 ${t.optimal} 步` : `已用 ${s.steps} / ${t.limit} 步`;
  $('endtext').textContent = won ? l().aha || oldEndings[level] : '可以退几步调整，也可以重玩。不用赶时间。';
  $('recover').hidden = won; $('next').hidden = !won;
  $('next').textContent = level === G.levels.length - 1 ? '回到第八关，再试一次' : '下一关 →';
  $('replay').textContent = !won ? '重新挑战' : stars < 3 ? `再少 ${s.steps - (stars === 2 ? t.optimal : t.silver)} 步，拿${stars === 2 ? '三' : '二'}星` : '再试一次';
  $(won ? stars === 3 ? 'next' : 'replay' : 'recover').focus();
}
async function act(d) {
  if (busy) return; const n = learning ? L.step(s, d) : C.step(l(), s, d); if (!n) return;
  history.push(s); busy = true; hideHint(); render();
  $('message').textContent = `${learning ? '橙精灵' : '橙灯'}${G.dock(l(), s, 0) ? '已到家，停住' : words[d]}；${learning ? '蓝精灵' : '蓝灯'}${s.steps ? `做上一次的「${words[s.last]}」` : '第一次先不动'}。`;
  $('current').textContent = G.dock(l(), s, 0) ? '已到家 · 会停住' : `这次 ${icons[d]} ${words[d]}`;
  $('pending').textContent = G.dock(l(), s, 1) ? '已到家 · 会停住' : s.steps ? `这次 ${icons[s.last]} ${words[s.last]}` : '第一次先不动';
  $('role-orange').classList.add('acting'); if (learning) DuetSpirits.walk(0, s.a, n.a, d); move(0, n.a); note(0); await delay(learning ? 420 : 180);
  $('role-orange').classList.remove('acting'); $('role-blue').classList.add('acting'); if (learning) { $('actor0').classList.remove('walking'); DuetSpirits.walk(1, s.b, n.b, s.last); } move(1, n.b); note(1); await delay(learning ? 420 : 240);
  $('role-blue').classList.remove('acting');
  const prev = s; s = n; busy = false; render();
  const result = outcome();
  if (result !== 'playing') {
    if (learning) { busy = true; render(); await delay(1000); busy = false; render(); }
    finish(result);
  }
  else if (learning) return;
  else if (!discovered && insight(prev, n, d)) {
    discovered = true; $('message').textContent = l().aha; $('message').classList.add('insight');
  } else {
    $('message').classList.remove('insight');
    if (s.lit.some((v, j) => v && !prev.lit[j] && l().gates[j].kind)) $('message').textContent = l().gates.some(g => g.kind === 'pair') ? '灯光已经留下。两盏都亮，门才会打开。' : '机关已锁定开启，不必再站着守门。';
    else if (s.passed.some((v, j) => v && !prev.passed[j])) $('message').textContent = '借着伙伴打开的门，过去了！';
    else if (G.dock(l(), s, 0)) $('message').textContent = '橙灯已经到家，会停住。继续按方向或等待，帮蓝灯走到蓝色终点。';
    else if (n.blocked.some(Boolean)) $('message').textContent = '碰到墙或关着的栅门，会留在原地。你按的方向仍会传给蓝灯。';
  }
}
function showHint() {
  $('hint-panel').hidden = false; $('hint').setAttribute('aria-expanded', 'true');
  const docked = G.dock(l(), s, 0) || G.dock(l(), s, 1);
  const ideas = docked ? ['一盏灯已经到家，不会再移动。看看另一盏还需要哪个方向。', '看蓝灯「下次」后面的箭头。如果这个方向能让它到终点，点「等一下」就能让它走。'] : DuetCopy[level].ideas;
  $('hint-label').textContent = ['先给一点思路', '再看这里', '下一步可以这样走'][Math.min(hintStage, 2)];
  if (hintStage < 2) {
    $('hint-text').textContent = ideas[hintStage]; $('hint-more').textContent = hintStage === 0 ? '再给一点线索' : '告诉我下一步';
  } else {
    const path = G.solve(l(), s);
    const remaining = C.targets(l()).limit - s.steps;
    $('hint-text').textContent = !path ? '这个位置已经走不通了。退几步，让还需要踩机关的灯先别进终点。' : path.length > remaining ? `从这里至少还要 ${path.length} 步，本轮只剩 ${remaining} 步。先退几步，再换一种配合。` : `下一步试试「${path[0] === 'W' ? '等一下' : words[path[0]]}」。橙灯做这次的操作，蓝灯做上一次的「${words[s.last]}」。`;
    $('hint-more').textContent = '收起，自己试试';
  }
  $('world').classList.toggle('hint-focus', hintStage === 1);
}
document.querySelectorAll('[data-d]').forEach(b => b.onclick = () => act(b.dataset.d));
document.querySelectorAll('[data-chapter]').forEach(b => b.onclick = () => { load(Number(b.dataset.chapter) === 1 ? 0 : 7); $('selection').hidden = false; $('levels-toggle').setAttribute('aria-expanded', 'true'); });
$('levels-toggle').onclick = () => { $('selection').hidden = !$('selection').hidden; $('levels-toggle').setAttribute('aria-expanded', !$('selection').hidden); };
$('undo').onclick = $('recover').onclick = () => { if (busy || !history.length) return; s = history.pop(); discovered = false; $('ending').hidden = true; hideHint(); render(); $('message').classList.remove('insight'); if (!learning) $('message').textContent = '已退一步。位置、机关、蓝灯下次的动作和步数都恢复了。'; };
$('restart').onclick = () => learning ? startLearning() : load(level);
$('replay').onclick = () => learning ? returnRoom ? load(returnRoom) : startLearning() : load(level);
$('next').onclick = () => load(learning ? 0 : level === G.levels.length - 1 ? 7 : level + 1);
$('learn-start').onclick = startLearning;
$('learn-skip').onclick = () => { if (busy) return; rememberLesson('skipped'); load(returnRoom); };
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
const openLesson = L.shouldStart(location.search, lessonSeen, completed.length > 0 || Object.keys(bests).length > 0);
load(returnRoom);
if (openLesson) startLearning();
