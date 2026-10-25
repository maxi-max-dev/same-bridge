(function (root) {
  const G = typeof module !== 'undefined' ? require('./engine.js') : root.Duet;
  // A separate practice room: learning never writes a challenge score.
  const level = {
    name: '先一起开两扇门',
    map: ['#######', '#....##', '#######', '#....##', '#######'],
    a: [1, 1], b: [1, 3], goals: [[4, 1], [4, 3]],
    gates: [
      { at: [3, 1], plate: [2, 3], owner: 1, shape: 'circle' },
      { at: [3, 3], plate: [3, 1], owner: 0, shape: 'diamond' }
    ]
  };
  const steps = [
    { action: 'R', title: '先点一次 →', text: '这一下只有橙灯走。下一次操作时，蓝灯才会跟着向右。' },
    { action: 'W', title: '再点「等一下」', text: '橙灯刚才向右了。现在让橙灯停住，看蓝灯做刚才的「向右」。' },
    { action: 'R', title: '蓝灯帮你开门了，点 →', text: '蓝灯踩住圆机关，橙灯前面的栅门打开了。蓝灯这次会重复你的「等待」。' },
    { action: 'R', title: '轮到你帮它了，再点 →', text: '橙灯踩到菱形机关，蓝灯前面的栅门也开了。两盏灯现在都能向右走。' },
    { action: 'W', title: '最后，点「等一下」接它到家', text: '橙灯到终点就会停住。蓝灯还差一步，正好执行你刚才的「向右」。' }
  ];
  function step(state, direction) {
    const cue = steps[state.steps];
    return cue && direction === cue.action ? G.step(level, state, direction) : null;
  }
  function shouldStart(search, seen, hasProgress) {
    const learn = new URLSearchParams(search).get('learn');
    if (learn === '1') return true;
    if (learn === '0') return false;
    return !['done', 'skipped'].includes(seen) && !hasProgress;
  }
  function roomFrom(search) {
    const room = Number(new URLSearchParams(search).get('room'));
    return Number.isInteger(room) && room >= 1 ? Math.min(room, G.levels.length) - 1 : 0;
  }
  const api = { level, steps, step, shouldStart, roomFrom };
  if (typeof module !== 'undefined') module.exports = api; else root.DuetLearn = api;
})(globalThis);
