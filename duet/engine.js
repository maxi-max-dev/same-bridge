(function(root){const dirs={R:[1,0],D:[0,1],L:[-1,0],U:[0,-1],W:[0,0]},eq=(a,b)=>a[0]===b[0]&&a[1]===b[1];
const levels=[{name:'接住上一拍',hint:'橙光现在走，蓝光晚一拍。最后试试「等一拍」。',map:['#######','......#','#######','......#','#######'],a:[0,1],b:[0,3],goals:[[5,1],[5,3]],gates:[]},{name:'你开门，我过桥',hint:'蓝光踩圆机关，替橙光开门；橙光再踩菱形机关，还它一条路。',map:['#######','.....##','####...','#######','######.','.......','#######'],a:[0,1],b:[0,5],goals:[[6,2],[6,4]],gates:[{at:[3,1],plate:[1,5],owner:1,shape:'circle'},{at:[4,5],plate:[4,1],owner:0,shape:'diamond'}]},{name:'借一面墙，等一个人',hint:'撞墙只会停住，不会失败，指令照样传出。用墙调整你们的位置。',map:['#######','....###','###....','#######','#####..','......#','#######'],a:[0,1],b:[0,5],goals:[[6,2],[6,4]],gates:[{at:[2,1],plate:[0,5],owner:1,shape:'circle'},{at:[4,5],plate:[3,2],owner:0,shape:'diamond'}]}];
levels.push(
{name:'把门留给你',short:'留门',hint:'标有「留门」的机关踩过一次就永久开门。先给伙伴留路，再回头找自己的出口。',map:['#######','.......','##.####','#######','######.','.......','#######'],a:[0,1],b:[0,5],goals:[[2,2],[6,4]],gates:[{at:[3,5],plate:[3,1],owner:0,shape:'diamond',kind:'latch'}]},
{name:'两盏灯，一把锁',short:'双灯',hint:'先分别点亮两个小灯座。两盏都亮了，两扇门才会一起打开；点亮会保留。',map:['#######','.....##','##.#...','##...##','######.','.......','#######'],a:[0,1],b:[0,5],goals:[[6,2],[6,4]],gates:[{at:[5,2],plate:[2,3],owner:0,shape:'diamond',kind:'pair'},{at:[4,5],plate:[2,5],owner:1,shape:'circle',kind:'pair'}]},
{name:'接力，不抢先',short:'接力',hint:'橙光先踩留门机关，放蓝光经过。蓝光绕去圆机关，才轮到橙光穿门。',map:['#######','.......','####.##','#######','##...#.','.......','#######'],a:[0,1],b:[0,5],goals:[[6,1],[6,4]],gates:[{at:[2,5],plate:[2,1],owner:0,shape:'diamond',kind:'latch'},{at:[5,1],plate:[4,4],owner:1,shape:'circle',kind:'latch'}]},
{name:'留下光，再借一拍',short:'合奏',hint:'留门机关会永久开启；圆机关的门只能多撑一拍。先分清哪条路能留下，再配合通过。',map:['#######','.....##','##.#...','##...##','######.','.......','#######'],a:[0,1],b:[0,5],goals:[[6,2],[6,4]],gates:[{at:[3,5],plate:[2,3],owner:0,shape:'diamond',kind:'latch'},{at:[5,2],plate:[4,5],owner:1,shape:'circle'}]}
);
// Chapter 2 uses the same rules; the challenge is in the arrangement.
levels.push(...[
  {
    "name": "你先走",
    "short": "借墙",
    "hint": "长闸门需要橙光照看。怎样让 A 留在机关上，却让 B 继续走？",
    "map": [
      "#######",
      "...####",
      ".######",
      "#######",
      "######.",
      ".......",
      "#######"
    ],
    "a": [
      0,
      1
    ],
    "b": [
      0,
      5
    ],
    "goals": [
      [
        0,
        2
      ],
      [
        6,
        4
      ]
    ],
    "gates": [
      {
        "at": [
          2,
          5
        ],
        "plate": [
          2,
          1
        ],
        "owner": 0,
        "shape": "diamond"
      },
      {
        "at": [
          3,
          5
        ],
        "plate": [
          2,
          1
        ],
        "owner": 0,
        "shape": "diamond"
      },
      {
        "at": [
          4,
          5
        ],
        "plate": [
          2,
          1
        ],
        "owner": 0,
        "shape": "diamond"
      }
    ],
    "walls": [
      {
        "at": [
          2,
          1
        ],
        "side": "R"
      }
    ],
    "lesson": "留在原地，也能帮忙",
    "intro": "橙光照着整段闸门。蓝光的路，需要你留住这束光。",
    "ideas": [
      "按「等一拍」会让方向队列停下来。还有什么动作能让 A 不换位置？",
      "观察橙光机关右侧的石墙：位置不变，方向仍然可以传出去。"
    ],
    "aha": "站着不动，也能把方向送给你。",
    "chapter": 2
  },
  {
    "name": "错开才对",
    "short": "错拍",
    "hint": "两扇门，由对方脚下的机关打开。不必让两盏灯做同一个方向。",
    "map": [
      "#######",
      ".....##",
      "####..#",
      "#######",
      "###.###",
      "....###",
      "#######"
    ],
    "a": [
      0,
      1
    ],
    "b": [
      0,
      5
    ],
    "goals": [
      [
        5,
        2
      ],
      [
        3,
        4
      ]
    ],
    "gates": [
      {
        "at": [
          4,
          2
        ],
        "plate": [
          3,
          5
        ],
        "owner": 1,
        "shape": "circle"
      },
      {
        "at": [
          3,
          4
        ],
        "plate": [
          4,
          1
        ],
        "owner": 0,
        "shape": "diamond"
      }
    ],
    "lesson": "一个向下，一个向上",
    "intro": "先找到彼此的机关。两扇出口，朝着不同的方向。",
    "ideas": [
      "配合一定意味着两个人同时朝同一个方向走吗？",
      "先看看两人脚下是否都亮了。留给 B 的方向，可以和 A 这一拍的方向不同。"
    ],
    "aha": "同一拍，不同方向，也能刚好成全彼此。",
    "walls": [
      {
        "at": [
          4,
          1
        ],
        "side": "U"
      },
      {
        "at": [
          3,
          5
        ],
        "side": "R"
      }
    ],
    "chapter": 2
  },
  {
    "name": "退一步接你",
    "short": "回身",
    "hint": "先去下方留下通路。回来的路，也许还能帮伙伴一次。",
    "map": [
      "#######",
      "###.###",
      "##..###",
      "#######",
      "######.",
      ".......",
      "#######"
    ],
    "a": [
      3,
      1
    ],
    "b": [
      0,
      5
    ],
    "goals": [
      [
        2,
        2
      ],
      [
        6,
        4
      ]
    ],
    "gates": [
      {
        "at": [
          2,
          5
        ],
        "plate": [
          3,
          2
        ],
        "owner": 0,
        "shape": "diamond",
        "kind": "latch"
      },
      {
        "at": [
          4,
          5
        ],
        "plate": [
          3,
          1
        ],
        "owner": 0,
        "shape": "diamond"
      },
      {
        "at": [
          5,
          5
        ],
        "plate": [
          3,
          1
        ],
        "owner": 0,
        "shape": "diamond"
      }
    ],
    "walls": [
      {
        "at": [
          3,
          1
        ],
        "side": "R"
      },
      {
        "at": [
          3,
          2
        ],
        "side": "R"
      }
    ],
    "lesson": "回头，让伙伴继续向前",
    "intro": "一处机关能留下光，另一处需要有人照看。先看清它们的区别。",
    "ideas": [
      "下方机关踩过就留下通路。上方机关熄灭以后，谁能回来照看它？",
      "先到下方留门，再回上方守住长闸门。回头的那一拍，B 还在执行你之前的方向。"
    ],
    "aha": "你回来的这一步，接住了它向前的一步。",
    "chapter": 2
  },
  {
    "name": "先把帮助送出去",
    "short": "交接",
    "hint": "橙光给蓝光放行，蓝光再开橙光的门。离开机关后，那一拍还在。",
    "map": [
      "#######",
      ".....##",
      "####.##",
      "######.",
      "###....",
      "....###",
      "#######"
    ],
    "a": [
      1,
      1
    ],
    "b": [
      0,
      5
    ],
    "goals": [
      [
        4,
        2
      ],
      [
        6,
        3
      ]
    ],
    "gates": [
      {
        "at": [
          1,
          5
        ],
        "plate": [
          0,
          1
        ],
        "owner": 0,
        "shape": "diamond"
      },
      {
        "at": [
          3,
          1
        ],
        "plate": [
          5,
          4
        ],
        "owner": 1,
        "shape": "circle"
      }
    ],
    "lesson": "把那一拍交给对方",
    "intro": "先为蓝光打开起点的门，再等它从另一边送来帮助。",
    "ideas": [
      "方向已经送出去了，橙光还需要一直站在原地吗？",
      "离开机关后，门会保留一拍。观察门上的「余 1 拍」，让 B 用已经收到的方向通过。"
    ],
    "aha": "你先转身，留下的一拍替你等到了它。",
    "chapter": 2
  }
]);
function initial(l){return{a:l.a.slice(),b:l.b.slice(),last:'W',steps:0,hold:l.gates.map(g=>eq(g.owner?l.b:l.a,g.plate)?1:0),lit:l.gates.map(g=>eq(g.owner?l.b:l.a,g.plate)),passed:l.gates.map(()=>false)}}
function dock(l,s,i){return eq(i?s.b:s.a,l.goals[i])}function won(l,s){return dock(l,s,0)&&dock(l,s,1)}
function gateOpen(l,s,j){const g=l.gates[j];return g.kind==='latch'?s.lit[j]:g.kind==='pair'?l.gates.every((g,k)=>g.kind!=='pair'||s.lit[k]):s.hold[j]>0}
function step(l,s,d){if(!dirs[d]||won(l,s))return null;const ps=[s.a,s.b],ds=[d,s.last],open=l.gates.map((g,j)=>gateOpen(l,s,j));const blocked=[false,false],passed=s.passed.slice();const next=ps.map((p,i)=>{if(dock(l,s,i))return p.slice();const v=dirs[ds[i]],q=[p[0]+v[0],p[1]+v[1]];const g=l.gates.findIndex(g=>eq(g.at,q));if(l.map[q[1]]?.[q[0]]!=='.'||(g>=0&&!open[g])){blocked[i]=ds[i]!=='W';return p.slice()}if(g>=0)passed[g]=true;return q});const hold=l.gates.map(g=>eq(next[g.owner],g.plate)||eq(ps[g.owner],g.plate)?1:0);const lit=l.gates.map((g,j)=>s.lit[j]||eq(next[g.owner],g.plate));return{lit,a:next[0],b:next[1],last:d,steps:s.steps+1,hold,passed,blocked}}
function solve(l,start=initial(l)){let q=[[start,'']],seen=new Set();for(let i=0;i<q.length&&i<100000;i++){const[s,p]=q[i];if(won(l,s))return p;for(const d of Object.keys(dirs)){const n=step(l,s,d);if(!n)continue;const k=JSON.stringify([n.a,n.b,n.last,n.hold,n.lit]);if(!seen.has(k)){seen.add(k);q.push([n,p+d])}}}return null}
const api={dirs,eq,levels,initial,dock,won,step,solve,gateOpen};if(typeof module!=='undefined')module.exports=api;else root.Duet=api})(globalThis);
