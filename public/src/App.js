import { useState, useEffect, useCallback, useRef } from "react";

const COLORS = ["#6366f1","#ec4899","#f59e0b","#10b981","#3b82f6","#8b5cf6","#06b6d4","#ef4444"];
const TYPES = [
  {id:"carrossel",label:"Carrossel",emoji:"📊",color:"#818cf8"},
  {id:"post_fixo",label:"Post Fixo",emoji:"📌",color:"#fbbf24"},
  {id:"reels",label:"Reels",emoji:"🎬",color:"#f472b6"},
  {id:"story",label:"Story",emoji:"📖",color:"#34d399"},
];
const STATUSES = [
  {id:"pendente",label:"Pendente",color:"#9ca3af"},
  {id:"revisar",label:"Revisar",color:"#fbbf24"},
  {id:"aprovado",label:"Aprovado",color:"#34d399"},
  {id:"alterar_copy",label:"Alterar Copy",color:"#60a5fa"},
  {id:"alterar_design",label:"Alterar Design",color:"#f87171"},
];
const WEEKS = ["Semana 1","Semana 2","Semana 3","Semana 4"];
const IDEA_CATS = [
  {id:"post",label:"Ideias de Post",emoji:"💡"},
  {id:"story",label:"Ideias de Story",emoji:"✨"},
  {id:"reels",label:"Ideias de Reels",emoji:"🎬"},
  {id:"copy",label:"Copies para Melhorar",emoji:"✍️"},
];
const LS_KEY = "orbego_v4";
const uid = () => Math.random().toString(36).slice(2,10);
const todayStr = () => new Date().toISOString().split("T")[0];
const fmtDate = d => d ? new Date(d+"T12:00:00").toLocaleDateString("pt-BR") : "";
const fmtMoney = v => `R$ ${Number(v||0).toLocaleString("pt-BR",{minimumFractionDigits:2})}`;

const DARK  = {bg:"#0f0f1a",card:"#1a1a2e",sidebar:"#13131f",muted:"#6b7280",text:"#f1f5f9",subtext:"#cbd5e1",border:"#ffffff0a",inputBg:"#0f0f1a",inputBorder:"#ffffff22",hover:"#1e1e32",headerBg:"#13131f",tagBg:"#ffffff0d",modalBg:"#000000cc",isDark:true};
const LIGHT = {bg:"#f1f5f9",card:"#ffffff",sidebar:"#ffffff",muted:"#94a3b8",text:"#0f172a",subtext:"#334155",border:"#e2e8f0",inputBg:"#f8fafc",inputBorder:"#cbd5e1",hover:"#f1f5f9",headerBg:"#ffffff",tagBg:"#f1f5f9",modalBg:"#00000066",isDark:false};

const empty = () => ({clients:[],contents:[],ideas:[],files:[],financial:{income:[],expenses:[],goals:[]},reminders:[]});
function loadDB(){try{const r=localStorage.getItem(LS_KEY);return r?JSON.parse(r):null;}catch{return null;}}
function saveDB(d){try{localStorage.setItem(LS_KEY,JSON.stringify(d));}catch{alert("⚠️ Armazenamento cheio! Remova alguns arquivos.");}}

// ─── LOGO ─────────────────────────────────────────────────────────
function OrbeLogo({size=32}){
  return(
    <svg width={size*3.8} height={size} viewBox="0 0 152 40" fill="none">
      <defs><linearGradient id="lgo" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor="#c026d3"/><stop offset="100%" stopColor="#6d28d9"/></linearGradient></defs>
      {[0,1,2,3,4].map(i=>{const y=8+i*5.5,w=22-Math.abs(i-2)*4;return <line key={i} x1={2} y1={y} x2={2+w} y2={y} stroke="url(#lgo)" strokeWidth="2.2" strokeLinecap="round"/>;}) }
      <text x="27" y="30" fontFamily="Arial Black,sans-serif" fontWeight="900" fontSize="28" fill="#4f46e5">C</text>
      <text x="30" y="29" fontFamily="Arial Black,sans-serif" fontWeight="900" fontSize="28" fill="#06b6d4" opacity="0.5">C</text>
      <text x="48" y="29" fontFamily="Arial,sans-serif" fontWeight="700" fontSize="20" fill="#4338ca">ORBE</text>
      <text x="104" y="29" fontFamily="Arial,sans-serif" fontWeight="700" fontSize="20" fill="#06b6d4"> Go</text>
    </svg>
  );
}

// ─── HELPERS ──────────────────────────────────────────────────────
function SaveToast({show}){
  return <div style={{position:"fixed",bottom:20,right:90,zIndex:999,padding:"8px 16px",borderRadius:24,fontSize:12,fontWeight:700,background:show?"#065f46":"transparent",color:show?"#34d399":"transparent",border:show?"1px solid #34d39944":"1px solid transparent",transition:"all 0.3s",pointerEvents:"none"}}>✓ Salvo automaticamente</div>;
}
function ThemeToggle({dark,toggle,t}){
  return <button onClick={toggle} style={{background:dark?"#1e1e32":"#f1f5f9",border:`1px solid ${dark?"#ffffff15":"#e2e8f0"}`,borderRadius:24,cursor:"pointer",padding:"5px 12px",display:"flex",alignItems:"center",gap:6,color:t.text,fontSize:12,fontWeight:600}}>{dark?"☀️ Claro":"🌙 Escuro"}</button>;
}
function TodayRemindersBar({reminders,onDone}){
  const td=todayStr();
  const todayR=(reminders||[]).filter(r=>!r.done&&r.date===td);
  const overdue=(reminders||[]).filter(r=>!r.done&&r.date<td);
  if(!todayR.length&&!overdue.length)return null;
  return(
    <div style={{background:"linear-gradient(90deg,#7c2d12,#991b1b)",padding:"8px 20px",display:"flex",alignItems:"center",gap:10,flexWrap:"wrap",flexShrink:0,zIndex:10}}>
      <span style={{fontSize:16}}>🔔</span>
      <span style={{fontWeight:700,fontSize:13,color:"#fef2f2"}}>Lembretes de hoje:</span>
      {todayR.map(r=><span key={r.id} onClick={()=>onDone(r.id)} style={{background:"#fee2e2",color:"#7f1d1d",padding:"3px 10px",borderRadius:20,fontSize:12,fontWeight:600,cursor:"pointer"}}>{r.text} ✓</span>)}
      {overdue.length>0&&<span style={{color:"#fca5a5",fontSize:12}}>+{overdue.length} atrasado{overdue.length>1?"s":""}</span>}
    </div>
  );
}

// ─── FINANCIAL ────────────────────────────────────────────────────
function FinancialDashboard({data,upd,t}){
  const fin=data.financial||{income:[],expenses:[],goals:[]};
  const rem=data.reminders||[];
  const [modal,setModal]=useState(null);
  const [ni,setNi]=useState({desc:"",value:"",date:todayStr()});
  const [ne,setNe]=useState({desc:"",value:"",date:todayStr()});
  const [ng,setNg]=useState({desc:"",target:"",current:"0"});
  const [nr,setNr]=useState({text:"",date:todayStr()});
  const totalIn=fin.income.reduce((a,i)=>a+Number(i.value||0),0);
  const totalOut=fin.expenses.reduce((a,i)=>a+Number(i.value||0),0);
  const bal=totalIn-totalOut;
  const td=todayStr();
  const iS={width:"100%",background:t.inputBg,border:`1px solid ${t.inputBorder}`,borderRadius:8,padding:"9px 12px",color:t.text,fontSize:13,boxSizing:"border-box",fontFamily:"inherit",outline:"none",colorScheme:t.isDark?"dark":"light"};
  const lS={fontSize:10,color:t.muted,marginBottom:4,display:"block",textTransform:"uppercase",letterSpacing:"0.8px",fontWeight:600};
  const bS=(bg,col="#fff")=>({padding:"8px 14px",background:bg,border:"none",borderRadius:8,color:col,cursor:"pointer",fontWeight:700,fontSize:12});
  const ov={position:"fixed",inset:0,background:t.modalBg,display:"flex",alignItems:"center",justifyContent:"center",zIndex:50,padding:16};
  const mb={background:t.card,borderRadius:16,padding:24,width:"100%",maxWidth:400,border:`1px solid ${t.border}`,color:t.text};
  const addIncome=()=>{if(!ni.desc||!ni.value)return;upd({...data,financial:{...fin,income:[...fin.income,{id:uid(),...ni,value:Number(ni.value)}]}});setNi({desc:"",value:"",date:todayStr()});setModal(null);};
  const addExpense=()=>{if(!ne.desc||!ne.value)return;upd({...data,financial:{...fin,expenses:[...fin.expenses,{id:uid(),...ne,value:Number(ne.value)}]}});setNe({desc:"",value:"",date:todayStr()});setModal(null);};
  const addGoal=()=>{if(!ng.desc||!ng.target)return;upd({...data,financial:{...fin,goals:[...fin.goals,{id:uid(),...ng,target:Number(ng.target),current:Number(ng.current||0)}]}});setNg({desc:"",target:"",current:"0"});setModal(null);};
  const addRem=()=>{if(!nr.text||!nr.date)return;upd({...data,reminders:[...rem,{id:uid(),...nr,done:false}]});setNr({text:"",date:todayStr()});setModal(null);};
  const sorted=[...rem].sort((a,b)=>a.date.localeCompare(b.date));
  return(
    <div style={{flex:1,overflowY:"auto",padding:24}}>
      <div style={{marginBottom:18}}><h2 style={{margin:0,fontSize:20,fontWeight:800,color:t.text}}>📊 Dashboard Financeiro</h2><div style={{fontSize:13,color:t.muted,marginTop:2}}>Visão geral da sua empresa</div></div>
      {/* KPIs */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:18}}>
        {[{label:"Entradas",v:fmtMoney(totalIn),color:"#34d399",icon:"💚"},{label:"Saídas",v:fmtMoney(totalOut),color:"#f87171",icon:"❤️"},{label:"Saldo",v:fmtMoney(bal),color:bal>=0?"#34d399":"#f87171",icon:"💰"},{label:"Clientes",v:data.clients.length,color:"#60a5fa",icon:"👥"}].map((c,i)=>(
          <div key={i} style={{background:t.card,borderRadius:14,padding:16,border:`1px solid ${t.border}`}}>
            <div style={{fontSize:20,marginBottom:5}}>{c.icon}</div>
            <div style={{fontSize:10,color:t.muted,marginBottom:3,textTransform:"uppercase",letterSpacing:1,fontWeight:600}}>{c.label}</div>
            <div style={{fontSize:18,fontWeight:800,color:c.color}}>{c.v}</div>
          </div>
        ))}
      </div>
      {/* Income + Expenses */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:14}}>
        {[{title:"💚 Entradas",items:fin.income,color:"#34d399",btn:"#052e16",onAdd:()=>setModal("income"),onDel:id=>upd({...data,financial:{...fin,income:fin.income.filter(i=>i.id!==id)}})},{title:"❤️ Saídas",items:fin.expenses,color:"#f87171",btn:"#2d0a0a",onAdd:()=>setModal("expense"),onDel:id=>upd({...data,financial:{...fin,expenses:fin.expenses.filter(i=>i.id!==id)}})}].map((s,i)=>(
          <div key={i} style={{background:t.card,borderRadius:14,padding:16,border:`1px solid ${t.border}`}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
              <div style={{fontWeight:700,fontSize:13,color:t.text}}>{s.title}</div>
              <button onClick={s.onAdd} style={bS(s.btn,s.color)}>+ Adicionar</button>
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:6,maxHeight:150,overflowY:"auto"}}>
              {s.items.map(item=>(
                <div key={item.id} style={{display:"flex",alignItems:"center",gap:8,padding:"7px 10px",background:t.bg,borderRadius:8,border:`1px solid ${t.border}`}}>
                  <div style={{flex:1}}><div style={{fontSize:12,color:t.text}}>{item.desc}</div><div style={{fontSize:10,color:t.muted}}>{fmtDate(item.date)}</div></div>
                  <div style={{fontSize:12,color:s.color,fontWeight:700}}>{fmtMoney(item.value)}</div>
                  <button onClick={()=>s.onDel(item.id)} style={{background:"transparent",border:"none",color:t.muted,cursor:"pointer",fontSize:15,padding:0}}>×</button>
                </div>
              ))}
              {!s.items.length&&<div style={{fontSize:12,color:t.muted,textAlign:"center",padding:"14px 0"}}>Nenhum registro</div>}
            </div>
          </div>
        ))}
      </div>
      {/* Client values + Goals */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:14}}>
        <div style={{background:t.card,borderRadius:14,padding:16,border:`1px solid ${t.border}`}}>
          <div style={{fontWeight:700,fontSize:13,color:t.text,marginBottom:12}}>👥 Valor Mensal por Cliente</div>
          <div style={{display:"flex",flexDirection:"column",gap:6,maxHeight:150,overflowY:"auto"}}>
            {data.clients.map(c=>(
              <div key={c.id} style={{display:"flex",alignItems:"center",gap:8,padding:"7px 10px",background:t.bg,borderRadius:8,border:`1px solid ${c.color}22`}}>
                <div style={{width:7,height:7,borderRadius:"50%",background:c.color,flexShrink:0}}/>
                <span style={{flex:1,fontSize:12,color:t.text}}>{c.name}</span>
                <input value={c.monthlyValue||""} onChange={e=>upd({...data,clients:data.clients.map(cl=>cl.id===c.id?{...cl,monthlyValue:e.target.value}:cl)})} placeholder="R$ 0,00" style={{width:90,background:"transparent",border:`1px solid ${t.inputBorder}`,borderRadius:6,padding:"3px 8px",color:"#34d399",fontSize:11,fontWeight:700,fontFamily:"inherit",outline:"none",textAlign:"right"}}/>
              </div>
            ))}
            {!data.clients.length&&<div style={{fontSize:12,color:t.muted,textAlign:"center",padding:"14px 0"}}>Sem clientes</div>}
          </div>
        </div>
        <div style={{background:t.card,borderRadius:14,padding:16,border:`1px solid ${t.border}`}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
            <div style={{fontWeight:700,fontSize:13,color:t.text}}>🎯 Metas do Mês</div>
            <button onClick={()=>setModal("goal")} style={bS("#1e3a5f","#60a5fa")}>+ Meta</button>
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:8,maxHeight:150,overflowY:"auto"}}>
            {fin.goals.map(g=>{
              const pct=Math.min(100,g.target?Math.round((g.current/g.target)*100):0);
              return(
                <div key={g.id} style={{padding:"8px 10px",background:t.bg,borderRadius:8,border:`1px solid ${t.border}`}}>
                  <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:5}}>
                    <span style={{flex:1,fontSize:12,color:t.text}}>{g.desc}</span>
                    <input value={g.current} onChange={e=>upd({...data,financial:{...fin,goals:fin.goals.map(gl=>gl.id===g.id?{...gl,current:Number(e.target.value)}:gl)}})} style={{width:44,background:"transparent",border:`1px solid ${t.inputBorder}`,borderRadius:5,padding:"2px 6px",color:"#60a5fa",fontSize:11,fontFamily:"inherit",outline:"none",textAlign:"right"}}/>
                    <span style={{fontSize:11,color:t.muted}}>/{g.target}</span>
                    <button onClick={()=>upd({...data,financial:{...fin,goals:fin.goals.filter(gl=>gl.id!==g.id)}})} style={{background:"transparent",border:"none",color:t.muted,cursor:"pointer",fontSize:13,padding:0}}>×</button>
                  </div>
                  <div style={{height:5,background:t.border,borderRadius:3}}><div style={{height:"100%",width:`${pct}%`,background:pct>=100?"#34d399":"#6366f1",borderRadius:3,transition:"width 0.3s"}}/></div>
                  <div style={{fontSize:10,color:t.muted,marginTop:2,textAlign:"right"}}>{pct}%</div>
                </div>
              );
            })}
            {!fin.goals.length&&<div style={{fontSize:12,color:t.muted,textAlign:"center",padding:"14px 0"}}>Nenhuma meta</div>}
          </div>
        </div>
      </div>
      {/* Reminders */}
      <div style={{background:t.card,borderRadius:14,padding:16,border:`1px solid ${t.border}`}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
          <div style={{fontWeight:700,fontSize:13,color:t.text}}>🔔 Lembretes Importantes</div>
          <button onClick={()=>setModal("reminder")} style={bS("#7c2d12","#fb923c")}>+ Lembrete</button>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))",gap:10}}>
          {sorted.map(r=>{
            const isT=r.date===td,isO=!r.done&&r.date<td;
            return(
              <div key={r.id} style={{padding:"10px 12px",borderRadius:10,background:r.done?t.bg:isT?"#1c1209":isO?"#1a0808":t.bg,border:`1px solid ${r.done?t.border:isT?"#f59e0b66":isO?"#ef444466":t.border}`,opacity:r.done?0.5:1}}>
                <div style={{display:"flex",alignItems:"flex-start",gap:8}}>
                  <span style={{fontSize:13,flexShrink:0}}>{isT?"🔥":isO?"⚠️":"📌"}</span>
                  <div style={{flex:1}}>
                    <div style={{fontSize:12,color:r.done?t.muted:t.text,textDecoration:r.done?"line-through":"none",fontWeight:r.done?400:500}}>{r.text}</div>
                    <div style={{fontSize:10,color:isT?"#f59e0b":isO?"#f87171":t.muted,marginTop:2,fontWeight:isT||isO?700:400}}>{isT?"🔥 HOJE":isO?"⚠️ "+fmtDate(r.date):fmtDate(r.date)}</div>
                  </div>
                  <div style={{display:"flex",gap:3}}>
                    {!r.done&&<button onClick={()=>upd({...data,reminders:rem.map(rl=>rl.id===r.id?{...rl,done:true}:rl)})} style={{background:"transparent",border:"none",color:"#34d399",cursor:"pointer",fontSize:14,padding:0}}>✓</button>}
                    <button onClick={()=>upd({...data,reminders:rem.filter(rl=>rl.id!==r.id)})} style={{background:"transparent",border:"none",color:t.muted,cursor:"pointer",fontSize:14,padding:0}}>×</button>
                  </div>
                </div>
              </div>
            );
          })}
          {!rem.length&&<div style={{fontSize:12,color:t.muted,padding:"10px 0"}}>Nenhum lembrete</div>}
        </div>
      </div>
      {/* Modais financeiros */}
      {modal==="income"&&(<div style={ov} onClick={()=>setModal(null)}><div style={mb} onClick={e=>e.stopPropagation()}>
        <h3 style={{margin:"0 0 16px",color:"#34d399"}}>💚 Nova Entrada</h3>
        <label style={lS}>Descrição</label><input value={ni.desc} onChange={e=>setNi({...ni,desc:e.target.value})} placeholder="Ex: Pagamento cliente" style={{...iS,marginBottom:10}} autoFocus/>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:16}}>
          <div><label style={lS}>Valor (R$)</label><input type="number" value={ni.value} onChange={e=>setNi({...ni,value:e.target.value})} placeholder="0.00" style={iS}/></div>
          <div><label style={lS}>Data</label><input type="date" value={ni.date} onChange={e=>setNi({...ni,date:e.target.value})} style={iS}/></div>
        </div>
        <div style={{display:"flex",gap:8}}><button onClick={()=>setModal(null)} style={{...bS("#374151"),flex:1,padding:"10px"}}>Cancelar</button><button onClick={addIncome} style={{...bS("#065f46","#34d399"),flex:1,padding:"10px"}}>Adicionar</button></div>
      </div></div>)}
      {modal==="expense"&&(<div style={ov} onClick={()=>setModal(null)}><div style={mb} onClick={e=>e.stopPropagation()}>
        <h3 style={{margin:"0 0 16px",color:"#f87171"}}>❤️ Nova Saída</h3>
        <label style={lS}>Descrição</label><input value={ne.desc} onChange={e=>setNe({...ne,desc:e.target.value})} placeholder="Ex: Assinatura ferramenta" style={{...iS,marginBottom:10}} autoFocus/>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:16}}>
          <div><label style={lS}>Valor (R$)</label><input type="number" value={ne.value} onChange={e=>setNe({...ne,value:e.target.value})} placeholder="0.00" style={iS}/></div>
          <div><label style={lS}>Data</label><input type="date" value={ne.date} onChange={e=>setNe({...ne,date:e.target.value})} style={iS}/></div>
        </div>
        <div style={{display:"flex",gap:8}}><button onClick={()=>setModal(null)} style={{...bS("#374151"),flex:1,padding:"10px"}}>Cancelar</button><button onClick={addExpense} style={{...bS("#7f1d1d","#f87171"),flex:1,padding:"10px"}}>Adicionar</button></div>
      </div></div>)}
      {modal==="goal"&&(<div style={ov} onClick={()=>setModal(null)}><div style={mb} onClick={e=>e.stopPropagation()}>
        <h3 style={{margin:"0 0 16px",color:"#60a5fa"}}>🎯 Nova Meta</h3>
        <label style={lS}>Descrição</label><input value={ng.desc} onChange={e=>setNg({...ng,desc:e.target.value})} placeholder="Ex: Fechar 5 clientes" style={{...iS,marginBottom:10}} autoFocus/>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:16}}>
          <div><label style={lS}>Meta total</label><input type="number" value={ng.target} onChange={e=>setNg({...ng,target:e.target.value})} placeholder="10" style={iS}/></div>
          <div><label style={lS}>Progresso</label><input type="number" value={ng.current} onChange={e=>setNg({...ng,current:e.target.value})} placeholder="0" style={iS}/></div>
        </div>
        <div style={{display:"flex",gap:8}}><button onClick={()=>setModal(null)} style={{...bS("#374151"),flex:1,padding:"10px"}}>Cancelar</button><button onClick={addGoal} style={{...bS("#1e3a5f","#60a5fa"),flex:1,padding:"10px"}}>Adicionar</button></div>
      </div></div>)}
      {modal==="reminder"&&(<div style={ov} onClick={()=>setModal(null)}><div style={mb} onClick={e=>e.stopPropagation()}>
        <h3 style={{margin:"0 0 16px",color:"#fb923c"}}>🔔 Novo Lembrete</h3>
        <label style={lS}>Texto</label><input value={nr.text} onChange={e=>setNr({...nr,text:e.target.value})} placeholder="Ex: Enviar relatório mensal" style={{...iS,marginBottom:10}} autoFocus/>
        <label style={lS}>Data</label><input type="date" value={nr.date} onChange={e=>setNr({...nr,date:e.target.value})} style={{...iS,marginBottom:16}}/>
        <div style={{display:"flex",gap:8}}><button onClick={()=>setModal(null)} style={{...bS("#374151"),flex:1,padding:"10px"}}>Cancelar</button><button onClick={addRem} style={{...bS("#7c2d12","#fb923c"),flex:1,padding:"10px"}}>Adicionar</button></div>
      </div></div>)}
    </div>
  );
}

// ─── FILES ────────────────────────────────────────────────────────
function FilesTab({clientId,data,upd,t}){
  const files=(data.files||[]).filter(f=>f.clientId===clientId);
  const [drag,setDrag]=useState(false);
  const ref=useRef();
  const handleFiles=list=>{
    Array.from(list).forEach(file=>{
      const r=new FileReader();
      r.onload=e=>upd({...data,files:[...(data.files||[]),{id:uid(),clientId,name:file.name,type:file.type,dataUrl:e.target.result,size:file.size,createdAt:Date.now()}]});
      r.readAsDataURL(file);
    });
  };
  const del=id=>upd({...data,files:(data.files||[]).filter(f=>f.id!==id)});
  const sz=s=>s>1048576?`${(s/1048576).toFixed(1)}MB`:`${(s/1024).toFixed(0)}KB`;
  return(
    <div>
      <div onDragOver={e=>{e.preventDefault();setDrag(true);}} onDragLeave={()=>setDrag(false)} onDrop={e=>{e.preventDefault();setDrag(false);handleFiles(e.dataTransfer.files);}} onClick={()=>ref.current?.click()} style={{border:`2px dashed ${drag?"#6366f1":t.inputBorder}`,borderRadius:12,padding:"22px",textAlign:"center",cursor:"pointer",marginBottom:18,background:drag?"#6366f111":t.card,transition:"all 0.2s"}}>
        <div style={{fontSize:30,marginBottom:6}}>📂</div>
        <div style={{fontSize:13,color:t.muted}}>Arraste arquivos ou clique para selecionar</div>
        <div style={{fontSize:11,color:t.muted,marginTop:3}}>PNG, JPG, PDF, AI, contratos...</div>
        <input ref={ref} type="file" multiple style={{display:"none"}} onChange={e=>handleFiles(e.target.files)}/>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(140px,1fr))",gap:12}}>
        {files.map(f=>(
          <div key={f.id} style={{background:t.card,borderRadius:12,border:`1px solid ${t.border}`,overflow:"hidden",position:"relative"}}>
            <div style={{height:90,background:t.bg,display:"flex",alignItems:"center",justifyContent:"center",overflow:"hidden"}}>
              {f.type.startsWith("image/")?<img src={f.dataUrl} alt={f.name} style={{width:"100%",height:"100%",objectFit:"cover"}}/>:<div style={{fontSize:34}}>{f.type==="application/pdf"?"📄":"📎"}</div>}
            </div>
            <div style={{padding:"8px 10px"}}>
              <div style={{fontSize:11,color:t.text,fontWeight:500,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}} title={f.name}>{f.name}</div>
              <div style={{fontSize:10,color:t.muted,marginTop:2}}>{sz(f.size)}</div>
            </div>
            <div style={{position:"absolute",top:6,right:6,display:"flex",gap:3}}>
              <a href={f.dataUrl} download={f.name} style={{width:22,height:22,background:"#000000aa",borderRadius:5,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,textDecoration:"none",color:"#fff"}}>⬇</a>
              <button onClick={()=>del(f.id)} style={{width:22,height:22,background:"#000000aa",border:"none",borderRadius:5,color:"#f87171",cursor:"pointer",fontSize:13,display:"flex",alignItems:"center",justifyContent:"center",padding:0}}>×</button>
            </div>
          </div>
        ))}
        {!files.length&&<div style={{gridColumn:"1/-1",textAlign:"center",padding:"28px 0",color:t.muted,fontSize:13}}>Nenhum arquivo. Arraste ou clique acima.</div>}
      </div>
    </div>
  );
}

// ─── AI ASSISTANT ─────────────────────────────────────────────────
function AIAssistant({t}){
  const [open,setOpen]=useState(false);
  const [msgs,setMsgs]=useState([{role:"assistant",content:"Olá! Sou seu assistente de copy. Me diga o nicho do cliente e o objetivo do post — crio copies incríveis! 🚀"}]);
  const [input,setInput]=useState("");
  const [loading,setLoading]=useState(false);
  const [apiKey,setApiKey]=useState(()=>localStorage.getItem("og_apikey")||"");
  const [showKey,setShowKey]=useState(!localStorage.getItem("og_apikey"));
  const scrollRef=useRef();
  useEffect(()=>{if(scrollRef.current)scrollRef.current.scrollTop=scrollRef.current.scrollHeight;},[msgs]);
  const saveKey=()=>{localStorage.setItem("og_apikey",apiKey);setShowKey(false);};
  const iSt2={background:t.inputBg,border:`1px solid ${t.inputBorder}`,borderRadius:8,padding:"8px 12px",color:t.text,fontSize:13,fontFamily:"inherit",outline:"none"};
  const send=async()=>{
    if(!input.trim()||loading)return;
    const nm=[...msgs,{role:"user",content:input}];
    setMsgs(nm);setInput("");setLoading(true);
    try{
      const res=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",
        headers:{"Content-Type":"application/json","x-api-key":apiKey,"anthropic-version":"2023-06-01","anthropic-dangerous-direct-browser-access":"true"},
        body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:800,
          system:"Você é especialista em copywriting para redes sociais brasileiras. Crie copies envolventes para posts, stories, reels e carrosséis. Sempre em português do Brasil. Ofereça 2-3 variações quando possível.",
          messages:nm.map(m=>({role:m.role,content:m.content}))})});
      const d=await res.json();
      setMsgs(p=>[...p,{role:"assistant",content:d.content?.[0]?.text||"Erro ao gerar."}]);
    }catch{setMsgs(p=>[...p,{role:"assistant",content:"❌ Erro. Verifique sua API Key."}]);}
    setLoading(false);
  };
  return(
    <>
      <button onClick={()=>setOpen(o=>!o)} style={{position:"fixed",bottom:24,right:24,zIndex:100,width:54,height:54,borderRadius:"50%",background:"linear-gradient(135deg,#6366f1,#ec4899)",border:"none",cursor:"pointer",fontSize:22,boxShadow:"0 4px 24px #6366f166",display:"flex",alignItems:"center",justifyContent:"center",transition:"transform 0.2s",transform:open?"rotate(135deg)":"none"}}>
        {open?"✕":"✨"}
      </button>
      {open&&(
        <div style={{position:"fixed",bottom:90,right:24,zIndex:99,width:320,height:450,background:t.card,borderRadius:20,border:`1px solid ${t.border}`,display:"flex",flexDirection:"column",boxShadow:"0 8px 40px #00000044",overflow:"hidden"}}>
          <div style={{padding:"12px 16px",background:"linear-gradient(135deg,#6366f1,#ec4899)",display:"flex",alignItems:"center",gap:8}}>
            <span style={{fontSize:18}}>✨</span>
            <div style={{flex:1}}><div style={{fontWeight:700,fontSize:14,color:"#fff"}}>Assistente de Copy IA</div><div style={{fontSize:10,color:"#ffffff88"}}>Powered by Claude</div></div>
            <button onClick={()=>setShowKey(s=>!s)} style={{background:"transparent",border:"none",color:"#ffffff88",cursor:"pointer",fontSize:16}}>⚙️</button>
          </div>
          {showKey&&(
            <div style={{padding:"10px 14px",background:t.isDark?"#1e3a5f":"#eff6ff",borderBottom:`1px solid ${t.border}`}}>
              <div style={{fontSize:11,color:"#60a5fa",marginBottom:6,fontWeight:600}}>🔑 Anthropic API Key</div>
              <div style={{display:"flex",gap:6}}>
                <input value={apiKey} onChange={e=>setApiKey(e.target.value)} placeholder="sk-ant-..." type="password" style={{...iSt2,flex:1,padding:"6px 10px",fontSize:12}}/>
                <button onClick={saveKey} style={{padding:"6px 10px",background:"#1e40af",border:"none",borderRadius:8,color:"#93c5fd",cursor:"pointer",fontSize:11,fontWeight:700}}>OK</button>
              </div>
            </div>
          )}
          <div ref={scrollRef} style={{flex:1,overflowY:"auto",padding:12,display:"flex",flexDirection:"column",gap:8}}>
            {msgs.map((m,i)=>(
              <div key={i} style={{display:"flex",justifyContent:m.role==="user"?"flex-end":"flex-start"}}>
                <div style={{maxWidth:"85%",padding:"8px 12px",borderRadius:m.role==="user"?"16px 16px 4px 16px":"16px 16px 16px 4px",background:m.role==="user"?"linear-gradient(135deg,#6366f1,#8b5cf6)":t.isDark?"#ffffff11":"#f1f5f9",color:t.text,fontSize:13,lineHeight:1.6,whiteSpace:"pre-wrap"}}>{m.content}</div>
              </div>
            ))}
            {loading&&<div style={{display:"flex",justifyContent:"flex-start"}}><div style={{padding:"8px 12px",borderRadius:"16px 16px 16px 4px",background:t.isDark?"#ffffff11":"#f1f5f9",color:t.muted,fontSize:13}}>✍️ Criando copy...</div></div>}
          </div>
          <div style={{padding:"10px 12px",borderTop:`1px solid ${t.border}`,display:"flex",gap:8}}>
            <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&!e.shiftKey&&send()} placeholder="Descreva o post..." style={{...iSt2,flex:1,borderRadius:24}}/>
            <button onClick={send} disabled={loading} style={{width:36,height:36,borderRadius:"50%",background:"linear-gradient(135deg,#6366f1,#ec4899)",border:"none",cursor:"pointer",color:"#fff",fontSize:15,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>➤</button>
          </div>
        </div>
      )}
    </>
  );
}

// ─── CLIENT REVIEW PAGE ───────────────────────────────────────────
function ClientReview({data,upd}){
  const cid=window.location.hash.match(/^#review\/(.+)$/)?.[1];
  const content=data.contents.find(c=>c.id===cid);
  const client=content?data.clients.find(c=>c.id===content.clientId):null;
  const [fb,setFb]=useState(content?.clientFeedback||"");
  const [approved,setApproved]=useState(content?.clientApproved||false);
  const [msg,setMsg]=useState(content?.clientApproved?"✅ Você já aprovou este conteúdo!":"");
  const T=DARK;
  if(!content||!client)return<div style={{height:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:T.bg,color:T.text,fontFamily:"'Segoe UI',sans-serif",flexDirection:"column",gap:10}}><div style={{fontSize:52}}>🔍</div><h2 style={{margin:0}}>Conteúdo não encontrado</h2><p style={{color:T.muted,margin:0,fontSize:14}}>Este link pode ter expirado.</p></div>;
  const tp=TYPES.find(t=>t.id===content.type),st=STATUSES.find(s=>s.id===content.status);
  const iSt={width:"100%",background:T.bg,border:"1px solid #ffffff22",borderRadius:8,padding:"10px 12px",color:T.text,fontSize:14,boxSizing:"border-box",fontFamily:"inherit",outline:"none"};
  const submit=doApprove=>{const u={...content,clientFeedback:fb,clientApproved:doApprove};upd({...data,contents:data.contents.map(c=>c.id===cid?u:c)});setApproved(doApprove);setMsg(doApprove?"✅ Aprovado com sucesso!":"💬 Feedback enviado!");};
  return(
    <div style={{minHeight:"100vh",background:T.bg,color:T.text,fontFamily:"'Segoe UI',sans-serif",padding:"32px 16px"}}>
      <div style={{maxWidth:560,margin:"0 auto"}}>
        <div style={{textAlign:"center",marginBottom:24}}><OrbeLogo size={28}/>
          <div style={{marginTop:14,width:12,height:12,borderRadius:"50%",background:client.color,margin:"14px auto 10px",boxShadow:`0 0 16px ${client.color}`}}/>
          <h1 style={{margin:0,fontSize:20,fontWeight:900,background:`linear-gradient(135deg,${client.color},#06b6d4)`,WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>{client.name}</h1>
        </div>
        <div style={{background:T.card,borderRadius:16,padding:24,border:`1px solid ${client.color}44`,marginBottom:16}}>
          <div style={{display:"flex",gap:12,marginBottom:14}}>
            <span style={{fontSize:28}}>{tp?.emoji}</span>
            <div style={{flex:1}}><div style={{fontWeight:700,fontSize:18,marginBottom:8,color:T.text}}>{content.title}</div>
              <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                <span style={{fontSize:11,background:tp?.color+"22",color:tp?.color,padding:"3px 10px",borderRadius:20,fontWeight:700}}>{tp?.label}</span>
                <span style={{fontSize:11,background:st?.color+"22",color:st?.color,padding:"3px 10px",borderRadius:20}}>{st?.label}</span>
                <span style={{fontSize:11,color:T.muted}}>{content.week}</span>
              </div>
            </div>
          </div>
          {content.mediaUrl&&(
            <div style={{marginBottom:14,borderRadius:10,overflow:"hidden",border:`1px solid ${client.color}33`}}>
              {content.mediaType?.startsWith("image/")?<img src={content.mediaUrl} alt="mídia" style={{width:"100%",maxHeight:280,objectFit:"contain",background:"#000"}}/>
                :<div style={{padding:"12px 14px",background:T.bg,display:"flex",alignItems:"center",gap:10}}><span style={{fontSize:24}}>📄</span><a href={content.mediaUrl} download={content.mediaName} style={{color:"#60a5fa",fontSize:13}}>{content.mediaName}</a></div>}
            </div>
          )}
          {content.copy&&<><div style={{fontSize:10,color:T.muted,marginBottom:6,textTransform:"uppercase",letterSpacing:1,fontWeight:600}}>Copy</div><div style={{background:T.bg,borderRadius:10,padding:14,fontSize:14,lineHeight:1.8,color:"#e2e8f0",whiteSpace:"pre-wrap",marginBottom:content.designNotes?12:0}}>{content.copy}</div></>}
          {content.designNotes&&<><div style={{fontSize:10,color:T.muted,marginBottom:6,textTransform:"uppercase",letterSpacing:1,fontWeight:600,marginTop:12}}>Obs. Design</div><div style={{background:T.bg,borderRadius:10,padding:12,fontSize:13,color:"#e2e8f0"}}>{content.designNotes}</div></>}
        </div>
        <div style={{background:T.card,borderRadius:16,padding:24,border:"1px solid #ffffff11"}}>
          <h3 style={{margin:"0 0 14px",fontSize:16,fontWeight:700}}>💬 Seu Feedback</h3>
          {msg&&<div style={{padding:"12px 14px",background:approved?"#052e16":"#1e3a5f",borderRadius:10,marginBottom:14,fontSize:14,color:approved?"#34d399":"#60a5fa",fontWeight:600}}>{msg}</div>}
          <textarea value={fb} onChange={e=>setFb(e.target.value)} placeholder="O que achou? O que gostaria de mudar?" style={{...iSt,minHeight:100,resize:"vertical",marginBottom:14}}/>
          <div style={{display:"flex",gap:10}}>
            <button onClick={()=>submit(true)} style={{flex:1,padding:"10px",background:approved?"#065f46":"#052e16",border:`1px solid ${approved?"#34d399":"#065f46"}`,borderRadius:8,color:"#34d399",cursor:"pointer",fontWeight:700,fontSize:13}}>✅ {approved?"Aprovado!":"Aprovar"}</button>
            <button onClick={()=>submit(false)} style={{padding:"10px 18px",background:"#1e3a5f",border:"1px solid #1e40af",borderRadius:8,color:"#60a5fa",cursor:"pointer",fontWeight:700,fontSize:13}}>Enviar Feedback</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── MAIN ─────────────────────────────────────────────────────────
function MainContent({data,upd,dark,toggleDark}){
  const T=dark?DARK:LIGHT;
  const [sel,setSel]=useState(null);
  const [tab,setTab]=useState("calendario");
  const [modal,setModal]=useState(null);
  const [copied,setCopied]=useState(null);
  const [saveShow,setSaveShow]=useState(false);
  const [nc,setNc]=useState({name:"",color:COLORS[0]});
  const [nco,setNco]=useState({title:"",type:"carrossel",week:"Semana 1",status:"pendente",copy:"",designNotes:""});
  const [ni,setNi]=useState({category:"post",text:""});
  const [pendingMedia,setPendingMedia]=useState(null);
  const mediaRef=useRef();

  const client=data.clients.find(c=>c.id===sel);
  const cContents=data.contents.filter(c=>c.clientId===sel);
  const cIdeas=data.ideas.filter(i=>i.clientId===sel);
  const selContent=modal&&!["addClient","addContent","addIdea"].includes(modal)?data.contents.find(c=>c.id===modal):null;

  const iSt={width:"100%",background:T.inputBg,border:`1px solid ${T.inputBorder}`,borderRadius:8,padding:"10px 12px",color:T.text,fontSize:14,boxSizing:"border-box",fontFamily:"inherit",outline:"none",colorScheme:dark?"dark":"light"};
  const lSt={fontSize:11,color:T.muted,marginBottom:5,display:"block",textTransform:"uppercase",letterSpacing:"0.8px",fontWeight:600};
  const bSt=(bg,col="#fff")=>({padding:"10px 18px",background:bg,border:"none",borderRadius:8,color:col,cursor:"pointer",fontWeight:700,fontSize:13});
  const ov={position:"fixed",inset:0,background:T.modalBg,display:"flex",alignItems:"center",justifyContent:"center",zIndex:50,padding:16};
  const mb={background:T.card,borderRadius:16,padding:24,width:"100%",maxWidth:510,maxHeight:"92vh",overflowY:"auto",border:`1px solid ${T.border}`,color:T.text};

  const flashSave=useCallback(()=>{setSaveShow(true);setTimeout(()=>setSaveShow(false),2000);},[]);
  const smartUpd=useCallback(d=>{upd(d);flashSave();},[upd,flashSave]);
  const doneReminder=id=>smartUpd({...data,reminders:(data.reminders||[]).map(r=>r.id===id?{...r,done:true}:r)});

  const addClient=()=>{if(!nc.name.trim())return;const c={id:uid(),name:nc.name.trim(),color:nc.color,monthlyValue:"",createdAt:Date.now()};smartUpd({...data,clients:[...data.clients,c]});setSel(c.id);setNc({name:"",color:COLORS[data.clients.length%COLORS.length]});setModal(null);};
  const addContent=()=>{
    if(!nco.title.trim())return;
    const c={id:uid(),clientId:sel,...nco,mediaUrl:pendingMedia?.url||"",mediaType:pendingMedia?.type||"",mediaName:pendingMedia?.name||"",clientFeedback:"",clientApproved:false,createdAt:Date.now()};
    smartUpd({...data,contents:[...data.contents,c]});
    setNco({title:"",type:"carrossel",week:"Semana 1",status:"pendente",copy:"",designNotes:""});
    setPendingMedia(null);setModal(null);
  };
  const addIdea=()=>{if(!ni.text.trim())return;smartUpd({...data,ideas:[...data.ideas,{id:uid(),clientId:sel,...ni,createdAt:Date.now()}]});setNi({category:"post",text:""});setModal(null);};
  const updContent=(id,ch)=>smartUpd({...data,contents:data.contents.map(c=>c.id===id?{...c,...ch}:c)});
  const delContent=id=>{smartUpd({...data,contents:data.contents.filter(c=>c.id!==id)});setModal(null);};
  const delIdea=id=>smartUpd({...data,ideas:data.ideas.filter(i=>i.id!==id)});
  const copyLink=(cid,e)=>{if(e)e.stopPropagation();navigator.clipboard.writeText(`${window.location.href.split("#")[0]}#review/${cid}`).catch(()=>{});setCopied(cid);setTimeout(()=>setCopied(null),2500);};
  const loadMedia=(file,cb)=>{const r=new FileReader();r.onload=e=>cb({url:e.target.result,type:file.type,name:file.name});r.readAsDataURL(file);};

  return(
    <div style={{display:"flex",height:"100vh",fontFamily:"'Segoe UI',system-ui,sans-serif",background:T.bg,color:T.text,overflow:"hidden",transition:"background 0.2s",flexDirection:"column"}}>
      <style>{`::-webkit-scrollbar{width:4px}::-webkit-scrollbar-track{background:transparent}::-webkit-scrollbar-thumb{background:#88888844;border-radius:2px}.ch:hover{opacity:.82}.card-h:hover{background:${T.hover}!important;border-color:${dark?"#ffffff22":"#cbd5e1"}!important}select option{background:${T.card}}input[type=date]::-webkit-calendar-picker-indicator{filter:${dark?"invert(1)":"none"}}`}</style>
      <TodayRemindersBar reminders={data.reminders||[]} onDone={doneReminder}/>
      <div style={{display:"flex",flex:1,overflow:"hidden"}}>
        {/* SIDEBAR */}
        <div style={{width:225,background:T.sidebar,display:"flex",flexDirection:"column",borderRight:`1px solid ${T.border}`,flexShrink:0,transition:"background 0.2s"}}>
          <div style={{padding:"14px 16px 10px",borderBottom:`1px solid ${T.border}`}}><OrbeLogo size={25}/></div>
          <div onClick={()=>{setSel(null);}} style={{display:"flex",alignItems:"center",gap:9,padding:"10px 16px",cursor:"pointer",background:!sel?"#6366f118":"transparent",borderBottom:`1px solid ${T.border}`,transition:"all 0.15s"}}>
            <span style={{fontSize:15}}>📊</span><span style={{fontSize:13,fontWeight:!sel?700:400,color:!sel?"#818cf8":T.subtext}}>Dashboard</span>
          </div>
          <div style={{flex:1,overflowY:"auto",padding:"10px 8px"}}>
            <div style={{fontSize:10,color:T.muted,padding:"4px 10px",marginBottom:6,fontWeight:700,textTransform:"uppercase",letterSpacing:1.5}}>Clientes</div>
            {data.clients.map(c=>(
              <div key={c.id} onClick={()=>{setSel(c.id);setTab("calendario");}} style={{display:"flex",alignItems:"center",gap:9,padding:"9px 10px",borderRadius:8,cursor:"pointer",background:sel===c.id?c.color+"18":"transparent",border:sel===c.id?`1px solid ${c.color}44`:"1px solid transparent",marginBottom:3,transition:"all 0.15s"}}>
                <div style={{width:8,height:8,borderRadius:"50%",background:c.color,flexShrink:0,boxShadow:sel===c.id?`0 0 8px ${c.color}`:""}}/>
                <span style={{fontSize:13,fontWeight:sel===c.id?700:400,color:sel===c.id?c.color:T.subtext,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",flex:1}}>{c.name}</span>
                <span style={{fontSize:10,color:T.muted,flexShrink:0}}>{data.contents.filter(ct=>ct.clientId===c.id).length}</span>
              </div>
            ))}
            {!data.clients.length&&<div style={{fontSize:12,color:T.muted,textAlign:"center",padding:"20px 8px",lineHeight:1.8,opacity:.7}}>Sem clientes<br/>👇 Adicione abaixo</div>}
          </div>
          <div style={{padding:"10px 8px",borderTop:`1px solid ${T.border}`}}>
            <button onClick={()=>setModal("addClient")} style={{width:"100%",padding:"9px",background:"transparent",border:`1px dashed ${T.inputBorder}`,borderRadius:8,color:T.muted,cursor:"pointer",fontSize:12,display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>＋ Novo Cliente</button>
          </div>
        </div>

        {/* MAIN AREA */}
        <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
          {!client?(
            <>
              <div style={{padding:"12px 24px",borderBottom:`1px solid ${T.border}`,display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0,background:T.headerBg}}>
                <div style={{fontWeight:700,fontSize:15,color:T.text}}>📊 Dashboard Financeiro</div>
                <ThemeToggle dark={dark} toggle={toggleDark} t={T}/>
              </div>
              <FinancialDashboard data={data} upd={smartUpd} t={T}/>
            </>
          ):(
            <>
              <div style={{padding:"12px 24px",borderBottom:`1px solid ${T.border}`,display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0,background:T.headerBg}}>
                <div style={{display:"flex",alignItems:"center",gap:10}}>
                  <div style={{width:10,height:10,borderRadius:"50%",background:client.color,boxShadow:`0 0 10px ${client.color}`}}/>
                  <h2 style={{margin:0,fontSize:17,fontWeight:800,color:T.text}}>{client.name}</h2>
                  <span style={{fontSize:11,color:T.muted,background:T.tagBg,padding:"2px 10px",borderRadius:20}}>{cContents.length} conteúdos</span>
                </div>
                <div style={{display:"flex",alignItems:"center",gap:10}}>
                  <ThemeToggle dark={dark} toggle={toggleDark} t={T}/>
                  {tab!=="arquivos"&&<button onClick={()=>setModal(tab==="ideias"?"addIdea":"addContent")} className="ch" style={{...bSt(client.color),padding:"8px 16px"}}>+ {tab==="ideias"?"Ideia":"Conteúdo"}</button>}
                </div>
              </div>
              <div style={{display:"flex",padding:"0 24px",borderBottom:`1px solid ${T.border}`,flexShrink:0,background:T.headerBg}}>
                {[{id:"calendario",label:"📅 Calendário"},{id:"conteudos",label:"📋 Conteúdos"},{id:"arquivos",label:"📁 Arquivos"},{id:"ideias",label:"💡 Ideias"}].map(tb=>(
                  <button key={tb.id} onClick={()=>setTab(tb.id)} style={{padding:"11px 15px",background:"transparent",border:"none",color:tab===tb.id?client.color:T.muted,cursor:"pointer",fontSize:13,fontWeight:tab===tb.id?700:400,borderBottom:tab===tb.id?`2px solid ${client.color}`:"2px solid transparent",marginBottom:-1,transition:"all 0.15s"}}>{tb.label}</button>
                ))}
              </div>
              <div style={{flex:1,overflowY:"auto",padding:24}}>
                {/* CALENDÁRIO */}
                {tab==="calendario"&&(
                  <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:14}}>
                    {WEEKS.map(week=>(
                      <div key={week} style={{background:T.card,borderRadius:14,border:`1px solid ${T.border}`,overflow:"hidden"}}>
                        <div style={{padding:"12px 14px",background:client.color+"18",borderBottom:`1px solid ${client.color}22`}}>
                          <div style={{fontSize:13,fontWeight:700,color:client.color}}>{week}</div>
                          <div style={{fontSize:10,color:T.muted,marginTop:2}}>{cContents.filter(c=>c.week===week).length} itens</div>
                        </div>
                        <div style={{padding:10,display:"flex",flexDirection:"column",gap:7,minHeight:90}}>
                          {cContents.filter(c=>c.week===week).map(ct=>{
                            const tp=TYPES.find(t=>t.id===ct.type),stObj=STATUSES.find(s=>s.id===ct.status);
                            return(
                              <div key={ct.id} onClick={()=>setModal(ct.id)} className="card-h" style={{background:T.bg,borderRadius:8,padding:"8px 10px",cursor:"pointer",border:`1px solid ${tp?.color}22`,transition:"all 0.15s"}}>
                                {ct.mediaUrl&&ct.mediaType?.startsWith("image/")&&<div style={{width:"100%",height:38,borderRadius:5,overflow:"hidden",marginBottom:4}}><img src={ct.mediaUrl} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/></div>}
                                <div style={{fontSize:11,fontWeight:600,marginBottom:3,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",color:T.text}}>{ct.title}</div>
                                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                                  <span style={{fontSize:10,color:tp?.color}}>{tp?.emoji} {tp?.label}</span>
                                  <div style={{display:"flex",alignItems:"center",gap:3}}>
                                    {ct.clientApproved&&<span style={{fontSize:10}}>✅</span>}
                                    {ct.clientFeedback&&!ct.clientApproved&&<span style={{fontSize:10}}>💬</span>}
                                    <span style={{fontSize:12,color:stObj?.color}}>●</span>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                          {!cContents.filter(c=>c.week===week).length&&<div style={{fontSize:11,color:T.muted,textAlign:"center",padding:"18px 0",opacity:.5}}>— vazio —</div>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {/* CONTEÚDOS */}
                {tab==="conteudos"&&(
                  <div>
                    <div style={{display:"flex",gap:8,marginBottom:18,flexWrap:"wrap"}}>
                      {TYPES.map(tp=>{const cnt=cContents.filter(c=>c.type===tp.id).length;return(<div key={tp.id} style={{display:"flex",alignItems:"center",gap:6,padding:"6px 14px",background:tp.color+"11",borderRadius:24,border:`1px solid ${tp.color}33`}}><span style={{fontSize:14}}>{tp.emoji}</span><span style={{fontSize:12,color:tp.color,fontWeight:700}}>{tp.label}</span><span style={{fontSize:11,color:T.muted,background:T.tagBg,padding:"0 7px",borderRadius:12}}>{cnt}</span></div>);})}
                    </div>
                    {!cContents.length&&<div style={{textAlign:"center",padding:"50px 0",color:T.muted}}><div style={{fontSize:44,marginBottom:12}}>📭</div>Nenhum conteúdo. Clique em "+ Conteúdo".</div>}
                    <div style={{display:"flex",flexDirection:"column",gap:8}}>
                      {[...cContents].sort((a,b)=>b.createdAt-a.createdAt).map(ct=>{
                        const tp=TYPES.find(t=>t.id===ct.type),stObj=STATUSES.find(s=>s.id===ct.status);
                        return(
                          <div key={ct.id} onClick={()=>setModal(ct.id)} className="card-h" style={{background:T.card,borderRadius:12,padding:"12px 16px",border:`1px solid ${T.border}`,display:"flex",alignItems:"center",gap:12,cursor:"pointer",transition:"all 0.15s"}}>
                            {ct.mediaUrl&&ct.mediaType?.startsWith("image/")?<img src={ct.mediaUrl} alt="" style={{width:44,height:44,borderRadius:8,objectFit:"cover",flexShrink:0}}/>:<span style={{fontSize:22,flexShrink:0}}>{tp?.emoji}</span>}
                            <div style={{flex:1,minWidth:0}}>
                              <div style={{fontWeight:600,fontSize:14,marginBottom:4,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",color:T.text}}>{ct.title}</div>
                              <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
                                <span style={{fontSize:10,color:tp?.color,background:tp?.color+"22",padding:"2px 8px",borderRadius:20,fontWeight:600}}>{tp?.label}</span>
                                <span style={{fontSize:10,color:stObj?.color,background:stObj?.color+"22",padding:"2px 8px",borderRadius:20}}>{stObj?.label}</span>
                                <span style={{fontSize:10,color:T.muted}}>{ct.week}</span>
                              </div>
                            </div>
                            <div style={{display:"flex",alignItems:"center",gap:7,flexShrink:0}}>
                              {ct.clientApproved&&<span style={{fontSize:15}}>✅</span>}
                              {ct.clientFeedback&&!ct.clientApproved&&<span style={{fontSize:15}}>💬</span>}
                              <button onClick={e=>copyLink(ct.id,e)} className="ch" style={{padding:"5px 12px",background:copied===ct.id?"#065f46":"#1e2d40",border:"none",borderRadius:6,color:copied===ct.id?"#34d399":"#60a5fa",cursor:"pointer",fontSize:11,fontWeight:700}}>{copied===ct.id?"✓ Copiado":"🔗 Link"}</button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
                {/* ARQUIVOS */}
                {tab==="arquivos"&&<FilesTab clientId={sel} data={data} upd={smartUpd} t={T}/>}
                {/* IDEIAS */}
                {tab==="ideias"&&(
                  <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:16}}>
                    {IDEA_CATS.map(cat=>(
                      <div key={cat.id} style={{background:T.card,borderRadius:14,border:`1px solid ${T.border}`,display:"flex",flexDirection:"column"}}>
                        <div style={{padding:"14px 16px",borderBottom:`1px solid ${T.border}`,display:"flex",alignItems:"center",gap:8}}>
                          <span style={{fontSize:20}}>{cat.emoji}</span><div style={{fontWeight:700,fontSize:13,flex:1,color:T.text}}>{cat.label}</div>
                          <span style={{fontSize:11,color:T.muted}}>{cIdeas.filter(i=>i.category===cat.id).length}</span>
                        </div>
                        <div style={{padding:12,flex:1,display:"flex",flexDirection:"column",gap:7}}>
                          {cIdeas.filter(i=>i.category===cat.id).map(idea=>(
                            <div key={idea.id} style={{background:T.bg,borderRadius:8,padding:10,fontSize:13,lineHeight:1.6,display:"flex",gap:8,alignItems:"flex-start",border:`1px solid ${T.border}`}}>
                              <span style={{flex:1,color:T.subtext}}>{idea.text}</span>
                              <button onClick={()=>delIdea(idea.id)} style={{background:"transparent",border:"none",color:T.muted,cursor:"pointer",fontSize:16,padding:0}}>×</button>
                            </div>
                          ))}
                          {!cIdeas.filter(i=>i.category===cat.id).length&&<div style={{fontSize:12,color:T.muted,textAlign:"center",padding:"20px 0",opacity:.6}}>Sem ideias</div>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ─── MODAIS ─── */}
      {modal==="addClient"&&(<div style={ov} onClick={()=>setModal(null)}><div style={mb} onClick={e=>e.stopPropagation()}>
        <h3 style={{margin:"0 0 18px",fontSize:17,color:T.text}}>➕ Novo Cliente</h3>
        <label style={lSt}>Nome</label><input value={nc.name} onChange={e=>setNc({...nc,name:e.target.value})} placeholder="Nome do cliente" style={{...iSt,marginBottom:14}} autoFocus onKeyDown={e=>e.key==="Enter"&&addClient()}/>
        <label style={lSt}>Cor</label><div style={{display:"flex",gap:8,marginBottom:20}}>{COLORS.map(c=><div key={c} onClick={()=>setNc({...nc,color:c})} style={{width:26,height:26,borderRadius:"50%",background:c,cursor:"pointer",border:nc.color===c?"3px solid #fff":"3px solid transparent",boxShadow:nc.color===c?`0 0 8px ${c}`:"",transition:"all 0.15s"}}/>)}</div>
        <div style={{display:"flex",gap:8}}><button onClick={()=>setModal(null)} style={{...bSt("#374151"),flex:1}}>Cancelar</button><button onClick={addClient} style={{...bSt(nc.color),flex:1}}>Adicionar</button></div>
      </div></div>)}

      {modal==="addContent"&&(<div style={ov} onClick={()=>setModal(null)}><div style={mb} onClick={e=>e.stopPropagation()}>
        <h3 style={{margin:"0 0 16px",fontSize:17,color:T.text}}>📝 Novo Conteúdo</h3>
        <label style={lSt}>Título</label><input value={nco.title} onChange={e=>setNco({...nco,title:e.target.value})} placeholder="Ex: Post de lançamento" style={{...iSt,marginBottom:10}} autoFocus/>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}>
          <div><label style={lSt}>Tipo</label><select value={nco.type} onChange={e=>setNco({...nco,type:e.target.value})} style={iSt}>{TYPES.map(t=><option key={t.id} value={t.id}>{t.emoji} {t.label}</option>)}</select></div>
          <div><label style={lSt}>Semana</label><select value={nco.week} onChange={e=>setNco({...nco,week:e.target.value})} style={iSt}>{WEEKS.map(w=><option key={w} value={w}>{w}</option>)}</select></div>
        </div>
        <label style={lSt}>Status</label><select value={nco.status} onChange={e=>setNco({...nco,status:e.target.value})} style={{...iSt,marginBottom:10}}>{STATUSES.map(s=><option key={s.id} value={s.id}>{s.label}</option>)}</select>
        <label style={lSt}>Copy do Post</label><textarea value={nco.copy} onChange={e=>setNco({...nco,copy:e.target.value})} placeholder="Texto do post..." style={{...iSt,minHeight:64,resize:"vertical",marginBottom:10}}/>
        <label style={lSt}>Obs. de Design</label><textarea value={nco.designNotes} onChange={e=>setNco({...nco,designNotes:e.target.value})} placeholder="Referências, cores..." style={{...iSt,minHeight:44,resize:"vertical",marginBottom:10}}/>
        <label style={lSt}>Mídia</label>
        <div onClick={()=>document.getElementById("nm_inp").click()} style={{border:`2px dashed ${T.inputBorder}`,borderRadius:8,padding:"10px",textAlign:"center",cursor:"pointer",marginBottom:16,background:pendingMedia?"#6366f111":T.bg}}>
          {pendingMedia?<div style={{display:"flex",alignItems:"center",gap:8,justifyContent:"center"}}>
            {pendingMedia.type?.startsWith("image/")?<img src={pendingMedia.url} alt="" style={{height:44,borderRadius:6,objectFit:"cover"}}/>:<span style={{fontSize:22}}>📄</span>}
            <span style={{fontSize:12,color:T.text,flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{pendingMedia.name}</span>
            <button onClick={e=>{e.stopPropagation();setPendingMedia(null);}} style={{background:"transparent",border:"none",color:"#f87171",cursor:"pointer",fontSize:14}}>×</button>
          </div>:<div style={{fontSize:12,color:T.muted}}>📎 Clique para anexar imagem ou arquivo</div>}
        </div>
        <input id="nm_inp" type="file" accept="image/*,application/pdf" style={{display:"none"}} onChange={e=>{if(e.target.files[0])loadMedia(e.target.files[0],setPendingMedia);}}/>
        <div style={{display:"flex",gap:8}}><button onClick={()=>{setModal(null);setPendingMedia(null);}} style={{...bSt("#374151"),flex:1}}>Cancelar</button><button onClick={addContent} style={{...bSt(client?.color||"#6366f1"),flex:1}}>Criar</button></div>
      </div></div>)}

      {modal==="addIdea"&&(<div style={ov} onClick={()=>setModal(null)}><div style={mb} onClick={e=>e.stopPropagation()}>
        <h3 style={{margin:"0 0 18px",fontSize:17,color:T.text}}>💡 Nova Ideia</h3>
        <label style={lSt}>Categoria</label><select value={ni.category} onChange={e=>setNi({...ni,category:e.target.value})} style={{...iSt,marginBottom:12}}>{IDEA_CATS.map(c=><option key={c.id} value={c.id}>{c.emoji} {c.label}</option>)}</select>
        <label style={lSt}>Ideia</label><textarea value={ni.text} onChange={e=>setNi({...ni,text:e.target.value})} placeholder="Descreva sua ideia..." style={{...iSt,minHeight:100,resize:"vertical",marginBottom:18}} autoFocus/>
        <div style={{display:"flex",gap:8}}><button onClick={()=>setModal(null)} style={{...bSt("#374151"),flex:1}}>Cancelar</button><button onClick={addIdea} style={{...bSt(client?.color||"#6366f1"),flex:1}}>Salvar</button></div>
      </div></div>)}

      {selContent&&(()=>{
        const ct=selContent,tp=TYPES.find(t=>t.id===ct.type),stObj=STATUSES.find(s=>s.id===ct.status);
        return(<div style={ov} onClick={()=>setModal(null)}><div style={{...mb,maxWidth:540}} onClick={e=>e.stopPropagation()}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16}}>
            <div style={{display:"flex",alignItems:"center",gap:10}}><span style={{fontSize:24}}>{tp?.emoji}</span>
              <div><div style={{fontWeight:700,fontSize:15,color:T.text}}>{ct.title}</div><div style={{fontSize:11,color:T.muted,marginTop:1}}>{ct.week}</div></div>
            </div>
            <button onClick={()=>setModal(null)} style={{background:"transparent",border:"none",color:T.muted,cursor:"pointer",fontSize:22,lineHeight:1,padding:4}}>×</button>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginBottom:12}}>
            <div><label style={lSt}>Tipo</label><select value={ct.type} onChange={e=>updContent(ct.id,{type:e.target.value})} style={iSt}>{TYPES.map(t=><option key={t.id} value={t.id}>{t.emoji} {t.label}</option>)}</select></div>
            <div><label style={lSt}>Semana</label><select value={ct.week} onChange={e=>updContent(ct.id,{week:e.target.value})} style={iSt}>{WEEKS.map(w=><option key={w} value={w}>{w}</option>)}</select></div>
            <div><label style={lSt}>Status</label><select value={ct.status} onChange={e=>updContent(ct.id,{status:e.target.value})} style={iSt}>{STATUSES.map(s=><option key={s.id} value={s.id}>{s.label}</option>)}</select></div>
          </div>
          <label style={lSt}>Mídia</label>
          <div style={{marginBottom:12}}>
            {ct.mediaUrl?(
              <div style={{borderRadius:10,overflow:"hidden",border:`1px solid ${T.border}`,position:"relative"}}>
                {ct.mediaType?.startsWith("image/")?<img src={ct.mediaUrl} alt="" style={{width:"100%",maxHeight:160,objectFit:"contain",background:"#000"}}/>:<div style={{padding:"12px 14px",background:T.bg,display:"flex",alignItems:"center",gap:10}}><span style={{fontSize:24}}>📄</span><span style={{fontSize:13,color:T.text,flex:1}}>{ct.mediaName}</span><a href={ct.mediaUrl} download={ct.mediaName} style={{color:"#60a5fa",fontSize:12}}>⬇ Baixar</a></div>}
                <button onClick={()=>updContent(ct.id,{mediaUrl:"",mediaType:"",mediaName:""})} style={{position:"absolute",top:5,right:5,background:"#000000aa",border:"none",borderRadius:5,color:"#f87171",cursor:"pointer",fontSize:14,width:22,height:22,display:"flex",alignItems:"center",justifyContent:"center",padding:0}}>×</button>
              </div>
            ):(
              <div onClick={()=>document.getElementById("ec_inp").click()} style={{border:`2px dashed ${T.inputBorder}`,borderRadius:8,padding:"10px",textAlign:"center",cursor:"pointer",background:T.bg}}>
                <div style={{fontSize:12,color:T.muted}}>📎 Clique para anexar mídia</div>
              </div>
            )}
            <input id="ec_inp" type="file" accept="image/*,application/pdf" style={{display:"none"}} onChange={e=>{if(e.target.files[0])loadMedia(e.target.files[0],m=>updContent(ct.id,{mediaUrl:m.url,mediaType:m.type,mediaName:m.name}));}}/>
          </div>
          <label style={lSt}>Copy</label><textarea value={ct.copy} onChange={e=>updContent(ct.id,{copy:e.target.value})} placeholder="Texto do post..." style={{...iSt,minHeight:72,resize:"vertical",marginBottom:10}}/>
          <label style={lSt}>Obs. de Design</label><textarea value={ct.designNotes} onChange={e=>updContent(ct.id,{designNotes:e.target.value})} placeholder="Referências, cores..." style={{...iSt,minHeight:44,resize:"vertical",marginBottom:12}}/>
          {(ct.clientFeedback||ct.clientApproved)&&(
            <div style={{background:T.bg,borderRadius:10,padding:12,marginBottom:12,border:`1px solid ${ct.clientApproved?"#34d39933":"#60a5fa33"}`}}>
              <div style={{fontSize:10,color:T.muted,marginBottom:6,textTransform:"uppercase",letterSpacing:1,fontWeight:600}}>💬 Feedback do cliente</div>
              {ct.clientFeedback&&<div style={{fontSize:13,color:T.subtext,lineHeight:1.7}}>{ct.clientFeedback}</div>}
              {ct.clientApproved&&<div style={{color:"#34d399",fontSize:12,marginTop:6,fontWeight:700}}>✅ Aprovado pelo cliente</div>}
            </div>
          )}
          <div style={{display:"flex",gap:8}}>
            <button onClick={()=>copyLink(ct.id)} className="ch" style={{...bSt("#1e2d40","#60a5fa"),flex:1,border:"1px solid #1e40af"}}>{copied===ct.id?"✓ Link copiado!":"🔗 Link para o cliente"}</button>
            <button onClick={()=>delContent(ct.id)} className="ch" style={{...bSt("#2d0a0a","#f87171"),border:"1px solid #7f1d1d",padding:"10px 14px"}}>🗑</button>
          </div>
        </div></div>);
      })()}

      <SaveToast show={saveShow}/>
      <AIAssistant t={T}/>
    </div>
  );
}

// ─── ROOT ─────────────────────────────────────────────────────────
export default function App(){
  const [data,setData]=useState(empty());
  const [loaded,setLoaded]=useState(false);
  const [dark,setDark]=useState(true);
  const [hash,setHash]=useState(window.location.hash);
  useEffect(()=>{
    const saved=loadDB();
    if(saved){setData(saved.data||saved);if(saved.dark!==undefined)setDark(saved.dark);}
    setLoaded(true);
    const onHash=()=>setHash(window.location.hash);
    window.addEventListener("hashchange",onHash);
    return()=>window.removeEventListener("hashchange",onHash);
  },[]);
  const upd=d=>{setData(d);saveDB({data:d,dark});};
  const toggleDark=()=>{const nd=!dark;setDark(nd);saveDB({data,dark:nd});};
  if(!loaded)return<div style={{height:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"#0f0f1a",color:"#fff",fontFamily:"'Segoe UI',sans-serif",gap:12}}><style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style><div style={{width:18,height:18,border:"2px solid #6366f1",borderTop:"2px solid transparent",borderRadius:"50%",animation:"spin 0.8s linear infinite"}}/><span style={{color:"#6b7280",fontSize:14}}>Carregando Orbe Go...</span></div>;
  if(hash.match(/^#review\/.+$/))return<ClientReview data={data} upd={d=>{setData(d);saveDB({data:d,dark});}}/>;
  return<MainContent data={data} upd={upd} dark={dark} toggleDark={toggleDark}/>;
}
