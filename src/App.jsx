import { useState, useEffect, useRef, useCallback } from 'react';
import { CATS, TIME_DIFF, GS, STORAGE_USER, STORAGE_BEST } from './data';
import { buildCards, getResult } from './utils/helpers';
import { useAudio } from './hooks/useAudio';
import './styles/index.css';

function App() {
  /* ── USER / SCREENS ── */
  const[page,setPage]=useState('loading');
  const[user,setUser]=useState(null);

  /* ── LOBBY SELECTIONS ── */
  const[selTime,setSelTime]=useState(120);
  const[gsize,setGsize]=useState('s4');
  const[cat,setCat]=useState('Mix ⚡');

  /* ── GAME STATE ── */
  const[cards,setCards]=useState([]);
  const[flipped,setFlipped]=useState([]);
  const[matched,setMatched]=useState([]);
  const[moves,setMoves]=useState(0);
  const[score,setScore]=useState(0);
  const[combo,setCombo]=useState(0);
  const[maxCombo,setMaxCombo]=useState(0);
  const[timeLeft,setTimeLeft]=useState(0);
  const[pups,setPups]=useState({hint:2,shuf:1,frz:1});
  const[floats,setFloats]=useState([]);
  const[canFlip,setCanFlip]=useState(true);
  const[tickAnim,setTickAnim]=useState(false);
  const[muted,setMuted]=useState(false);
  const[bests,setBests]=useState({});
  const[winResult,setWinResult]=useState(null);

  /* ── REFS ── */
  const frozenRef=useRef(0);
  const timeLeftRef=useRef(0);
  const pageRef=useRef('loading');
  const timerRef=useRef(null);
  const matchedCountRef=useRef(0);
  const totalPairsRef=useRef(0);
  const scoreRef=useRef(0);
  const maxComboRef=useRef(0);
  const movesRef=useRef(0);
  const totalTimeRef=useRef(0);
  const userRef=useRef(null);
  const bestsRef=useRef({});
  const selTimeRef=useRef(120);
  const gsizeRef=useRef('s4');

  const audio=useAudio(muted);

  /* ── INIT ── */
  useEffect(()=>{
    try{const b=JSON.parse(localStorage.getItem(STORAGE_BEST)||'{}');setBests(b);bestsRef.current=b;}catch{}
    try{
      const u=JSON.parse(localStorage.getItem(STORAGE_USER)||'null');
      if(u&&u.name){setUser(u);userRef.current=u;setPage('lobby');}
      else setPage('login');
    }catch{setPage('login');}
  },[]);

  /* ── TIMER ── */
  useEffect(()=>{
    if(page!=='game'){clearInterval(timerRef.current);return;}
    pageRef.current='game';
    timerRef.current=setInterval(()=>{
      if(pageRef.current!=='game')return;
      if(frozenRef.current>0){frozenRef.current--;return;}
      const t=timeLeftRef.current-1;
      timeLeftRef.current=t;setTimeLeft(t);
      if(t<=10){audio.tick();setTickAnim(true);setTimeout(()=>setTickAnim(false),370);}
      if(t<=0){
        clearInterval(timerRef.current);pageRef.current='result';audio.lose();
        const res=getResult(0,totalTimeRef.current,matchedCountRef.current,totalPairsRef.current,userRef.current?.gender||'male');
        setWinResult({isWin:false,res,score:scoreRef.current,moves:movesRef.current,
          maxCombo:maxComboRef.current,timeLeft:0,totalPairs:totalPairsRef.current,matched:matchedCountRef.current});
        setPage('result');
      }
    },1000);
    return()=>clearInterval(timerRef.current);
  },[page]);

  /* ── LOGIN ── */
  const[loginName,setLoginName]=useState('');
  const[loginGender,setLoginGender]=useState('male');
  const[loginErr,setLoginErr]=useState('');

  function doLogin(){
    const n=loginName.trim();
    if(!n){setLoginErr('Enter your name, soldier! ⚠️');return;}
    audio.click();
    const u={name:n,gender:loginGender};
    try{localStorage.setItem(STORAGE_USER,JSON.stringify(u));}catch{}
    setUser(u);userRef.current=u;setPage('lobby');
  }

  function doLogout(){
    audio.click();
    try{localStorage.removeItem(STORAGE_USER);}catch{}
    setUser(null);userRef.current=null;setLoginName('');setLoginGender('male');setLoginErr('');setPage('login');
  }

  /* ── START GAME ── */
  function doStart(){
    audio.click();
    const d=TIME_DIFF[selTime];const gs=GS[gsize];const tp=(gs*gs)/2;
    const nc=buildCards(gs,cat);
    setCards(nc);setFlipped([]);setMatched([]);setMoves(0);setScore(0);setCombo(0);setMaxCombo(0);
    setTimeLeft(selTime);setPups({hint:d.hint,shuf:d.shuf,frz:d.frz});
    setCanFlip(true);setWinResult(null);
    frozenRef.current=0;timeLeftRef.current=selTime;totalTimeRef.current=selTime;
    matchedCountRef.current=0;totalPairsRef.current=tp;
    scoreRef.current=0;maxComboRef.current=0;movesRef.current=0;
    selTimeRef.current=selTime;gsizeRef.current=gsize;
    setPage('game');
  }

  /* ── CARD CLICK ── */
  function handleCard(idx,e){
    if(!canFlip||cards[idx].matched||cards[idx].flipped||flipped.length===2)return;
    audio.flip();
    const nc=cards.map((c,i)=>i===idx?{...c,flipped:true}:c);
    setCards(nc);const nf=[...flipped,idx];setFlipped(nf);
    if(nf.length===2){
      movesRef.current++;setMoves(m=>m+1);setCanFlip(false);
      const[a,b]=nf;
      if(nc[a].emoji===nc[b].emoji){
        audio.match();
        setCombo(prev=>{
          const nc2=prev+1;
          if(nc2>maxComboRef.current)maxComboRef.current=nc2;
          setMaxCombo(maxComboRef.current);
          const d=TIME_DIFF[selTimeRef.current];
          const cmb=nc2>1?Math.pow(d.mult,nc2-1):1;
          const pts=Math.floor(d.pts*cmb+timeLeftRef.current*0.4);
          scoreRef.current+=pts;setScore(scoreRef.current);
          if(nc2>1)audio.combo();
          const rect=e.target.getBoundingClientRect();
          const fid=Date.now()+Math.random();
          setFloats(f=>[...f,{id:fid,text:`+${pts}`,x:rect.left+rect.width/2-20,y:rect.top+window.scrollY-20}]);
          setTimeout(()=>setFloats(f=>f.filter(x=>x.id!==fid)),1100);
          return nc2;
        });
        setTimeout(()=>{
          setCards(c=>c.map((cd,i)=>(i===a||i===b)?{...cd,matched:true,flipped:true}:cd));
          setMatched(m=>{
            const nm=[...m,nc[a].emoji];
            matchedCountRef.current=nm.length;
            if(nm.length===totalPairsRef.current){
              clearInterval(timerRef.current);pageRef.current='result';audio.win();
              const key=`${selTimeRef.current}_${gsizeRef.current}`;
              const prev=bestsRef.current[key]||0;const fs=scoreRef.current;
              if(fs>prev){const nb={...bestsRef.current,[key]:fs};bestsRef.current=nb;setBests(nb);
                try{localStorage.setItem(STORAGE_BEST,JSON.stringify(nb));}catch{}}
              const res=getResult(timeLeftRef.current,totalTimeRef.current,nm.length,totalPairsRef.current,userRef.current?.gender||'male');
              setWinResult({isWin:true,res,score:fs,moves:movesRef.current,maxCombo:maxComboRef.current,
                timeLeft:timeLeftRef.current,totalPairs:totalPairsRef.current,matched:nm.length,newBest:fs>prev});
              setTimeout(()=>setPage('result'),480);
            }
            return nm;
          });
          setFlipped([]);setCanFlip(true);
        },360);
      }else{
        audio.miss();setCombo(0);
        setTimeout(()=>{
          setCards(c=>c.map((cd,i)=>(i===a||i===b)?{...cd,shk:true}:cd));
          setTimeout(()=>{
            setCards(c=>c.map((cd,i)=>(i===a||i===b)?{...cd,flipped:false,shk:false}:cd));
            setFlipped([]);setCanFlip(true);
          },370);
        },490);
      }
    }
  }

  /* ── POWER-UPS ── */
  function doHint(){
    if(pups.hint<=0||page!=='game')return;audio.pu();setPups(p=>({...p,hint:p.hint-1}));
    const um=cards.filter(c=>!c.matched);const emjs=[...new Set(um.map(c=>c.emoji))];
    const pick=emjs[Math.floor(Math.random()*emjs.length)];
    const idxs=cards.map((c,i)=>c.emoji===pick&&!c.matched?i:-1).filter(i=>i>=0);
    setCards(c=>c.map((cd,i)=>idxs.includes(i)?{...cd,flipped:true}:cd));
    setTimeout(()=>setCards(c=>c.map((cd,i)=>idxs.includes(i)&&!cd.matched?{...cd,flipped:false}:cd)),1500);
  }

  function doShuf(){
    if(pups.shuf<=0||page!=='game')return;audio.pu();setPups(p=>({...p,shuf:p.shuf-1}));
    setCards(c=>{
      const um=c.filter(cd=>!cd.matched).map(cd=>({...cd,flipped:false})).sort(()=>Math.random()-.5);
      let ui=0;return c.map(cd=>cd.matched?cd:um[ui++]);
    });
    setFlipped([]);setCanFlip(true);
  }

  function doFrz(){
    if(pups.frz<=0||page!=='game'||frozenRef.current>0)return;audio.pu();
    setPups(p=>({...p,frz:p.frz-1}));frozenRef.current=10;
  }

  function restart(){
    audio.click();
    const d=TIME_DIFF[selTime];const gs=GS[gsize];const tp=(gs*gs)/2;
    const nc=buildCards(gs,cat);
    setCards(nc);setFlipped([]);setMatched([]);setMoves(0);setScore(0);setCombo(0);setMaxCombo(0);
    setTimeLeft(selTime);setPups({hint:d.hint,shuf:d.shuf,frz:d.frz});
    setCanFlip(true);setWinResult(null);
    frozenRef.current=0;timeLeftRef.current=selTime;totalTimeRef.current=selTime;
    matchedCountRef.current=0;totalPairsRef.current=tp;
    scoreRef.current=0;maxComboRef.current=0;movesRef.current=0;
    selTimeRef.current=selTime;gsizeRef.current=gsize;
    setPage('game');
  }

  const gs=GS[gsize];const totalPairs=(gs*gs)/2;
  const prog=matched.length/totalPairs*100;
  const bk=`${selTime}_${gsize}`;const bs=bests[bk]||0;
  const isFrozen=frozenRef.current>0;

  /* ══ RENDER ══ */
  if(page==='loading') return(
    <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center'}}>
      <div style={{fontFamily:"'Russo One',sans-serif",color:'#333',letterSpacing:'3px',fontSize:'1.2rem'}}>LOADING...</div>
    </div>
  );

  if(page==='login') return(
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">FLIP<span>ZONE</span></div>
        <div className="login-tagline">Memory Combat</div>
        <div className="login-divider"/>
        <div style={{marginBottom:14,textAlign:'left'}}>
          <label className="flbl">Your Name</label>
          <input className="ginp" placeholder="Enter your callsign..." maxLength={20}
            value={loginName} onChange={e=>{setLoginName(e.target.value);setLoginErr('');}}
            onKeyDown={e=>e.key==='Enter'&&doLogin()}
            autoComplete="off" autoCorrect="off" spellCheck="false"/>
          {loginErr&&<div className="err">{loginErr}</div>}
        </div>
        <div style={{marginBottom:20,textAlign:'left'}}>
          <label className="flbl">I Am</label>
          <div className="grow">
            <button className={`gbtn${loginGender==='male'?' sel':''}`} onClick={()=>setLoginGender('male')}>
              <span className="gi">👦</span>Male
            </button>
            <button className={`gbtn${loginGender==='female'?' sel':''}`} onClick={()=>setLoginGender('female')}>
              <span className="gi">👧</span>Female
            </button>
          </div>
        </div>
        <button className="pbtn" onClick={doLogin}>▶ ENTER THE ZONE</button>
        <div style={{marginTop:16,fontSize:'.72rem',color:'#2a2a2a',fontFamily:"'Exo 2',sans-serif"}}>
          Your progress is saved locally on this device
        </div>
      </div>
    </div>
  );

  if(page==='lobby') return(
    <div className="lobby">
      <div className="lobby-card">
        <div className="lobby-header">
          <div className="lobby-title">FLIP<span style={{color:'var(--gold)'}}>ZONE</span></div>
          <div style={{display:'flex',alignItems:'center',gap:8}}>
            <div className="lobby-user">
              <span>{user?.gender==='male'?'👦':'👧'}</span>
              <span>{user?.name}</span>
            </div>
            <button className="logout-btn" onClick={doLogout}>LOGOUT</button>
          </div>
        </div>
        {bs>0&&<div className="bbadge" style={{display:'flex',marginBottom:16}}>🏅 Your Best — {bs.toLocaleString()} pts</div>}
        <div className="stitle" style={{marginBottom:10}}>Select Time Mode</div>
        <div className="time-grid">
          {Object.entries(TIME_DIFF).map(([t,d])=>(
            <div key={t} className={`time-card${selTime===+t?' sel':''}`} onClick={()=>{audio.click();setSelTime(+t);}}>
              <div className="tc-time">{t}s</div>
              <div className="tc-label">{d.label}</div>
              <div className="tc-diff">{d.tag}</div>
            </div>
          ))}
        </div>
        <hr className="sdiv"/>
        <div style={{marginBottom:14}}>
          <div className="stitle">Category</div>
          <div className="cscrl">
            {Object.keys(CATS).map(k=>(
              <button key={k} className={`cpill${cat===k?' sel':''}`} onClick={()=>{audio.click();setCat(k);}}>{k}</button>
            ))}
          </div>
        </div>
        <div className="stitle">Grid Size</div>
        <div className="szrow" style={{marginBottom:22}}>
          {Object.keys(GS).map(k=>(
            <button key={k} className={`szbtn${gsize===k?' sel':''}`} onClick={()=>{audio.click();setGsize(k);}}>
              {k.replace('s','')}×{k.replace('s','')}
            </button>
          ))}
        </div>
        <button className="pbtn" onClick={doStart}>▶ START BATTLE</button>
      </div>
    </div>
  );

  return(
    <div className="gw">
      <header className="hdr">
        <div className="logo">FLIP<span>ZONE</span></div>
        <div style={{display:'flex',flex:1,justifyContent:'center',padding:'0 8px'}}>
          {user&&(
            <div className="plr-badge">
              <div className="av">{user.gender==='male'?'👦':'👧'}</div>
              <span className="pn">{user.name}</span>
            </div>
          )}
        </div>
        <div className="hdr-r">
          <button className="ibtn" onClick={()=>setMuted(m=>!m)}>{muted?'🔇':'🔊'}</button>
          <button className="ibtn" onClick={()=>{pageRef.current='pause';setPage('pause');}}>⏸</button>
        </div>
      </header>

      <div className="stats">
        <div className={`chip${timeLeft<=10&&!isFrozen?' dng':''}${tickAnim?' tk':''}`}>
          <span style={{fontSize:'.86rem'}}>{isFrozen?'❄️':'⏱'}</span>
          <div><div className="lbl">TIME</div><div className="val">{isFrozen?`❄${frozenRef.current}s`:timeLeft+'s'}</div></div>
        </div>
        <div className="chip">
          <span style={{fontSize:'.86rem'}}>👆</span>
          <div><div className="lbl">MOVES</div><div className="val">{moves}</div></div>
        </div>
        <div className="chip gld">
          <span style={{fontSize:'.86rem'}}>⭐</span>
          <div><div className="lbl">SCORE</div><div className="val">{score.toLocaleString()}</div></div>
        </div>
        <div className={`chip${combo>1?' ca gld':''}`}>
          <span style={{fontSize:'.86rem'}}>🔥</span>
          <div><div className="lbl">COMBO</div><div className="val">×{combo}</div></div>
        </div>
        <div className="chip">
          <span style={{fontSize:'.86rem'}}>✅</span>
          <div><div className="lbl">PAIRS</div><div className="val">{matched.length}/{totalPairs}</div></div>
        </div>
      </div>
      <div className="prg"><div className="prg-t"><div className="prg-f" style={{width:`${prog}%`}}/></div></div>

      <div className="main">
        <div className="pubar">
          <button className="pubtn" onClick={doHint} disabled={pups.hint<=0}>
            <span className="pi">💡</span>HINT<span className="pc">{pups.hint}</span>
          </button>
          <button className="pubtn" onClick={doShuf} disabled={pups.shuf<=0}>
            <span className="pi">🔀</span>SHUFFLE<span className="pc">{pups.shuf}</span>
          </button>
          <button className="pubtn" onClick={doFrz} disabled={pups.frz<=0||frozenRef.current>0}>
            <span className="pi">❄️</span>FREEZE<span className="pc">{pups.frz}</span>
          </button>
        </div>
        <div className={`cgrid g${gs}`}>
          {cards.map((card,idx)=>(
            <div key={card.id}
              className={`mc${card.flipped||card.matched?' flipped':''}${card.matched?' matched':''}${card.shk?' shk':''}`}
              onClick={e=>handleCard(idx,e)}
              role="button" tabIndex={0}
              onKeyDown={e=>(e.key==='Enter'||e.key===' ')&&handleCard(idx,e)}>
              <div className="ci">
                <div className="cf cb"><div className="cbi">?</div></div>
                <div className="cf cf-f">{card.emoji}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {floats.map(f=><div key={f.id} className="fsc" style={{left:f.x,top:f.y}}>{f.text}</div>)}

      {page==='pause'&&(
        <div className="ovl">
          <div className="ovc">
            <div className="ot">⏸ PAUSED</div>
            <div className="os">{user?.name} — catch your breath</div>
            <div className="scgr">
              <div className="sci"><div className="scl">Time Left</div><div className="scv">{timeLeft}s</div></div>
              <div className="sci"><div className="scl">Score</div><div className="scv g">{score.toLocaleString()}</div></div>
              <div className="sci"><div className="scl">Moves</div><div className="scv">{moves}</div></div>
              <div className="sci"><div className="scl">Best Combo</div><div className="scv">×{maxCombo}</div></div>
            </div>
            <button className="pbtn" onClick={()=>{pageRef.current='game';setPage('game');}}>▶ RESUME</button>
            <button className="sbtn" onClick={()=>{clearInterval(timerRef.current);pageRef.current='lobby';setPage('lobby');}}>✖ QUIT GAME</button>
          </div>
        </div>
      )}

      {page==='result'&&winResult&&(
        <div className="ovl">
          <div className="ovc">
            <div className="ot" style={{color:winResult.isWin?'var(--gold)':'var(--danger)'}}>
              {winResult.isWin?'VICTORY!':'DEFEATED'}
            </div>
            <div className="os">GG {user?.name}!</div>
            <div className="rbanner">
              <div className="rb-ico">{winResult.res.ico}</div>
              <div className="rb-msg">{winResult.res.msg}</div>
              <div className="rb-sub">{winResult.res.sub}</div>
            </div>
            <div className="scgr">
              <div className="sci"><div className="scl">Final Score</div><div className="scv g">{winResult.score.toLocaleString()}</div></div>
              <div className="sci"><div className="scl">Time Left</div><div className="scv">{winResult.timeLeft}s</div></div>
              <div className="sci"><div className="scl">Pairs Found</div><div className="scv">{winResult.matched}/{winResult.totalPairs}</div></div>
              <div className="sci"><div className="scl">Best Combo</div><div className="scv">×{winResult.maxCombo}</div></div>
            </div>
            {winResult.newBest&&<div className="bbadge">🌟 NEW BEST — {winResult.score.toLocaleString()} PTS!</div>}
            <button className="pbtn" onClick={restart}>🔄 PLAY AGAIN</button>
            <button className="sbtn" onClick={()=>{pageRef.current='lobby';setPage('lobby');}}>✖ QUIT GAME</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;