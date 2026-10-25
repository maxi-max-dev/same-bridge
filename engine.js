(function(root){
const dirs={U:[0,-1],R:[1,0],D:[0,1],L:[-1,0],W:[0,0]};
const same=(a,b)=>a[0]===b[0]&&a[1]===b[1];
const initial=l=>({a:[...l.a],b:[...l.b],lead:l.lead||0,last:null,moves:0,swaps:0});
const adjacent=s=>Math.abs(s.a[0]-s.b[0])+Math.abs(s.a[1]-s.b[1])===1;
const won=(l,s)=>same(s.a,l.ga)&&same(s.b,l.gb);
function step(l,s,d){let n=JSON.parse(JSON.stringify(s));if(d==='X'){if(!l.swap||!adjacent(s))return null;n.lead=1-s.lead;n.swaps++;return n;}if(!dirs[d])return null;
const move=(p,d)=>{if(!d)return [...p];const v=dirs[d],q=[p[0]+v[0],p[1]+v[1]];return l.map[q[1]]?.[q[0]]==='.'?q:[...p];};
let a=move(s.a,s.lead===0?d:s.last),b=move(s.b,s.lead===1?d:s.last);
// A blocked direction does not advance the beat: waiting is an explicit choice.
if(d!=='W'&&same(s.lead===0?a:b,s.lead===0?s.a:s.b))return null;
if(same(a,b)||(same(a,s.b)&&same(b,s.a))){a=[...s.a];b=[...s.b];}
n.a=a;n.b=b;n.last=d;n.moves++;return n;}
const key=s=>[s.a,s.b,s.lead,s.last].join('|');
function solve(l,start=initial(l),opts={}){let q=[[start,[]]],seen=new Set([key(start)]);let acts=['U','R','D','L',...(opts.wait===false?[]:['W']),...(l.swap&&opts.swap!==false?['X']:[])];for(let i=0;i<q.length;i++){const [s,p]=q[i];if(won(l,s))return p;for(const d of acts){const n=step(l,s,d);if(n&&!seen.has(key(n))){seen.add(key(n));q.push([n,[...p,d]]);}}}return null;}
const api={dirs,same,initial,adjacent,won,step,key,solve};if(typeof module!=='undefined')module.exports=api;else root.BridgeEngine=api;
})(globalThis);
