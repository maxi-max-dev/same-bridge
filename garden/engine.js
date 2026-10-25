(function(root){
const N=6, MOVES=20;
function rng(seed){return function(){seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
function group(b,i){const c=b[i],out=[],seen=new Set(),q=[i];while(q.length){let j=q.pop();if(seen.has(j)||b[j]!==c)continue;seen.add(j);out.push(j);let x=j%N,y=Math.floor(j/N);if(x)q.push(j-1);if(x<N-1)q.push(j+1);if(y)q.push(j-N);if(y<N-1)q.push(j+N)}return out}
function cross(i){return [i,...(i%N?[i-1]:[]),...(i%N<N-1?[i+1]:[]),...(i>=N?[i-N]:[]),...(i<N*(N-1)?[i+N]:[])]}
function possible(b){return b.some((_,i)=>group(b,i).length>=2)}
function initial(seed,mode){let r=rng(seed);let board=Array.from({length:N*N},()=>Math.floor(r()*4));if(!possible(board))board[1]=board[0];return{board,seed,mode,turn:0,score:0,pending:null,serial:0}}
function fill(board,ids,state){let b=board.slice(),drops=[];ids.forEach(i=>b[i]=null);let r=rng(state.seed+Math.imul(state.turn+1,1009)+Math.imul(state.serial+1,7919));for(let x=0;x<N;x++){const a=[];for(let y=N-1;y>=0;y--)if(b[y*N+x]!==null)a.push(b[y*N+x]);for(let y=N-1;y>=0;y--){const j=y*N+x; b[j]=a[N-1-y]??Math.floor(r()*4);if(b[j]!==board[j]||ids.includes(j))drops.push(j)}}let shuffled=false;if(!possible(b)){b[1]=b[0];shuffled=true}return {board:b,drops,shuffled}}
function step(s,i){if(s.turn>=MOVES||!Number.isInteger(i)||i<0||i>=N*N)return null;const g=group(s.board,i);if(g.length<2)return null;const big=g.length>=5;const clear=big?s.board.map((c,j)=>c===s.board[i]?j:-1).filter(j=>j>=0):g;const a=fill(s.board,clear,s);const echo=s.mode==='echo'&&s.pending!==null?cross(s.pending):[];const b=echo.length?fill(a.board,echo,{...s,serial:1}):a;const gain=clear.length*10+(big?30:0)+echo.length*10;return{state:{...s,board:b.board,turn:s.turn+1,score:s.score+gain,pending:s.mode==='echo'&&s.turn+1<MOVES?i:null},clear,echo,intermediate:a.board,gain,big,shuffled:a.shuffled||b.shuffled}}
const api={N,MOVES,group,cross,possible,initial,step};if(typeof module!=='undefined')module.exports=api;else root.Garden=api;
})(typeof window!=='undefined'?window:globalThis);
