import { useState, useEffect, useCallback } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, AreaChart, Area } from "recharts";

const monthlyData = [
  {month:"25/4",newReg:34,churn:38,total:159},{month:"5",newReg:10,churn:9,total:160},
  {month:"6",newReg:5,churn:5,total:160},{month:"7",newReg:7,churn:5,total:162},
  {month:"8",newReg:8,churn:3,total:167},{month:"9",newReg:3,churn:5,total:165},
  {month:"10",newReg:2,churn:6,total:161},{month:"11",newReg:4,churn:1,total:164},
  {month:"12",newReg:1,churn:4,total:161},{month:"26/1",newReg:3,churn:5,total:159},
  {month:"2",newReg:3,churn:1,total:161},{month:"3",newReg:12,churn:4,total:169},
  {month:"4",newReg:1,churn:0,total:170},
];

// === Execution KPIs: 4 categories mapped 1:1 to flow stages ===
const DEFAULT_EXEC = [
  // Flow source ①
  { cat:"直接交流", icon:"🤝", color:"#F97316", flowLabel:"流入①", items:[
    {name:"EDIX東京 来場",tgt:1,act:0,unit:"回",dl:"5/15",note:"来場無料"},
    {name:"日数教 全国大会",tgt:1,act:0,unit:"回",dl:"8/7",note:"本丸"},
    {name:"秋期研究大会",tgt:1,act:0,unit:"回",dl:"11/1",note:"埼玉"},
    {name:"EDIX関西",tgt:1,act:0,unit:"回",dl:"10/15",note:"大阪"},
    {name:"都道府県研究会",tgt:3,act:0,unit:"件",dl:"12月",note:"登壇者経由"},
    {name:"教育委員会研修",tgt:1,act:0,unit:"回",dl:"年度内",note:"法人化後"},
  ]},
  // Flow source ② + ③ + ④
  { cat:"コンテンツ発信", icon:"🎬", color:"#3B82F6", flowLabel:"流入②③④", items:[
    {name:"YouTubeチャンネル開設",tgt:1,act:0,unit:"",dl:"5月",note:"ショート専用"},
    {name:"YouTubeショート投稿",tgt:80,act:0,unit:"本",dl:"年間",note:"週2本"},
    {name:"登壇者SNS投稿",tgt:48,act:0,unit:"回",dl:"年間",note:"月4回"},
    {name:"登壇者SNS投稿ガイド作成",tgt:1,act:0,unit:"set",dl:"6月",note:"投稿例+ハッシュタグ+素材"},
    {name:"メールリスト構築",tgt:1500,act:300,unit:"件",dl:"イベント時",note:"名刺交換で集める"},
    {name:"メールリスト配信",tgt:24,act:0,unit:"回",dl:"年間",note:"月2回・イベント/LP案内"},
  ]},
  // Flow middle: LP + 無料LINE（行動KPIのみ）
  { cat:"LP・無料LINE", icon:"📱", color:"#8B5CF6", flowLabel:"受け皿", items:[
    {name:"LP GA導入・CVR計測",tgt:1,act:0,unit:"",dl:"5月",note:"現状把握が最優先"},
    {name:"LP ABテスト実施",tgt:3,act:0,unit:"回",dl:"10月",note:"CVR 15→25%目標"},
    {name:"無料LINE配信",tgt:40,act:0,unit:"回",dl:"年間",note:"週1回・授業ネタ等"},
    {name:"授業ネタ無料コンテンツ",tgt:5,act:0,unit:"件",dl:"10月",note:"LINE登録の引き"},
  ]},
  // Flow right: conversion + foundation
  { cat:"転換・基盤", icon:"🏗️", color:"#10B981", flowLabel:"転換", items:[
    {name:"社団法人 登記完了",tgt:1,act:0,unit:"",dl:"4月",note:"全ての前提"},
    {name:"入会導線 設計・テスト",tgt:1,act:0,unit:"set",dl:"5月",note:"QR→体験→入会"},
    {name:"税理士 選定",tgt:1,act:0,unit:"名",dl:"5月",note:"公益法人経験者"},
  ]},
];

const Ring=({pct,size=56,sw=5,color="#F97316"})=>{const r=(size-sw)/2,c=2*Math.PI*r;return (<svg width={size} height={size} style={{transform:"rotate(-90deg)"}}><circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={sw}/><circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={sw} strokeDasharray={c} strokeDashoffset={c*(1-Math.min(pct,1))} strokeLinecap="round" style={{transition:"stroke-dashoffset 1s"}}/></svg>);};
const Tip=({active,payload,label})=>{if(!active||!payload)return null;return (<div style={{background:"#1E293B",border:"1px solid rgba(255,255,255,0.1)",borderRadius:8,padding:"8px 12px",fontSize:11,color:"#E2E8F0"}}><div style={{fontWeight:700,marginBottom:3}}>{label}</div>{payload.map((p,i)=><div key={i} style={{color:p.color}}>{p.name}: {p.value?.toLocaleString()}</div>)}</div>);};
const Expand=({title,children})=>{const[o,setO]=useState(false);return (<div style={{background:"rgba(255,255,255,0.02)",borderRadius:8,border:"1px solid rgba(255,255,255,0.03)",marginTop:10}}><button onClick={()=>setO(!o)} style={{width:"100%",display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 14px",background:"none",border:"none",color:"#94A3B8",cursor:"pointer",fontSize:11,fontFamily:"'Noto Sans JP'"}}><span>💡 {title}</span><span style={{transform:o?"rotate(180deg)":"",transition:"0.3s",fontSize:9}}>▼</span></button>{o&&<div style={{padding:"0 14px 12px",fontSize:11,color:"#CBD5E1",lineHeight:1.8}}>{children}</div>}</div>);};

// Helper: get summary from exec data for flow display
function getFlowSummary(exec) {
  const find = (cat, nameIncludes) => {
    const c = exec.find(e => e.cat === cat);
    if (!c) return null;
    return c.items.find(i => i.name.includes(nameIncludes));
  };
  const sumCat = (cat) => {
    const c = exec.find(e => e.cat === cat);
    if (!c) return {done:0,total:0};
    return {done: c.items.filter(i=>i.act>=i.tgt).length, total: c.items.length};
  };
  const yt = find("コンテンツ発信","YouTubeショート投稿");
  const spk = find("コンテンツ発信","登壇者SNS投稿");
  const mail = find("コンテンツ発信","メールリスト構築");
  const mailPosts = find("コンテンツ発信","メールリスト配信");
  const linePosts = find("LP・無料LINE","無料LINE配信");
  const ev = sumCat("直接交流");
  return { yt, spk, mail, mailPosts, linePosts, ev };
}

export default function Dashboard(){
  const[tab,setTab]=useState("overview");
  const[showSettings,setShowSettings]=useState(false);
  const[sheetId,setSheetId]=useState("");
  const[inputId,setInputId]=useState("");
  const[connected,setConnected]=useState(false);
  const[loading,setLoading]=useState(false);
  const[lastFetch,setLastFetch]=useState(null);
  const[error,setError]=useState(null);
  const[execData,setExecData]=useState(DEFAULT_EXEC);
  const[outcome,setOutcome]=useState({members:170,standard:137,gold:33,revenue:370500,churnRate:34.4,rejoin:20,freeLine:0,freeLineTarget:500});
  const[monthly,setMonthly]=useState(monthlyData);

  useEffect(()=>{(async()=>{try{const r={ value: localStorage.getItem("mef_sheet_id") };if(r&&r.value){setSheetId(r.value);setInputId(r.value);}}catch(e){}})();},[]);
  function parseCSV(t){const ls=t.split("\n").filter(l=>l.trim());if(ls.length<2)return[];const hs=ls[0].split(",").map(h=>h.replace(/^"|"$/g,"").trim());return ls.slice(1).map(l=>{const vs=[];let c="",q=false;for(const ch of l){if(ch==='"')q=!q;else if(ch===","&&!q){vs.push(c.trim());c="";}else c+=ch;}vs.push(c.trim());const o={};hs.forEach((h,i)=>o[h]=(vs[i]||"").replace(/^"|"$/g,""));return o;});}
  const fetchData=useCallback(async(id)=>{if(!id)return;setLoading(true);setError(null);const base=`https://docs.google.com/spreadsheets/d/${id}/gviz/tq?tqx=out:csv&sheet=`;try{const[e,o,m]=await Promise.all([fetch(base+encodeURIComponent("実行KPI")),fetch(base+encodeURIComponent("結果KPI")),fetch(base+encodeURIComponent("月次推移"))]);if(!e.ok||!o.ok||!m.ok)throw new Error("取得失敗");const[et,ot,mt]=await Promise.all([e.text(),o.text(),m.text()]);const er=parseCSV(et),or2=parseCSV(ot),mr=parseCSV(mt);if(er.length>0){const cats={};const im={"直接交流":"🤝","コンテンツ発信":"🎬","LP・無料LINE":"📱","転換・基盤":"🏗️"};const cm={"直接交流":"#F97316","コンテンツ発信":"#3B82F6","LP・無料LINE":"#8B5CF6","転換・基盤":"#10B981"};const fl={"直接交流":"流入①","コンテンツ発信":"流入②③","LP・無料LINE":"受け皿","転換・基盤":"転換"};er.forEach(r=>{const c=r["カテゴリ"]||"";if(!c)return;if(!cats[c])cats[c]={cat:c,icon:im[c]||"📋",color:cm[c]||"#94A3B8",flowLabel:fl[c]||"",items:[]};cats[c].items.push({name:r["タスク名"]||"",tgt:Number(r["目標値"])||0,act:Number(r["実績値"])||0,unit:r["単位"]||"",dl:r["期限"]||"",note:r["メモ"]||""});});setExecData(Object.values(cats));}if(or2.length>0){const g=n=>{const r=or2.find(r=>r["指標名"]===n);return r?Number(r["現在値"])||0:0;};setOutcome({members:g("有効メンバー数"),standard:g("スタンダード会員数"),gold:g("ゴールド会員数"),revenue:g("月次売上"),churnRate:g("累計解約率"),rejoin:g("再入会者数"),freeLine:g("無料LINE登録者数"),freeLineTarget:500});}if(mr.length>0)setMonthly(mr.map(r=>{const m2=r["年月"]||"";return{month:m2.replace("2025-0","25/").replace("2025-","25/").replace("2026-0","26/").replace("2026-","26/"),newReg:Number(r["新規登録"])||0,churn:Number(r["退会"])||0,total:Number(r["累計有効"])||0};}));setConnected(true);setLastFetch(new Date());}catch(e2){setError(e2.message);setConnected(false);}setLoading(false);},[]);
  useEffect(()=>{if(sheetId)fetchData(sheetId);},[sheetId,fetchData]);
  const saveSettings=async()=>{const id=inputId.trim();const m=id.match(/\/d\/([a-zA-Z0-9_-]+)/);const c=m?m[1]:id;setSheetId(c);setInputId(c);try{localStorage.setItem("mef_sheet_id",c);}catch(e){}await fetchData(c);setShowSettings(false);};

  const days=Math.ceil((new Date("2027-02-21")-new Date())/86400000);
  const totalT=execData.reduce((s,c)=>s+c.items.length,0);
  const totalD=execData.reduce((s,c)=>s+c.items.filter(i=>i.act>=i.tgt).length,0);
  const oPct=totalT>0?totalD/totalT:0;
  const flow = getFlowSummary(execData);

  // Mini progress bar for flow
  const MiniBar = ({act,tgt,color}) => {
    const pct = tgt>0?Math.min(act/tgt,1):0;
    return <div style={{display:"flex",alignItems:"center",gap:4}}>
      <div style={{width:28,height:3,background:"rgba(255,255,255,0.06)",borderRadius:2}}><div style={{width:`${pct*100}%`,height:"100%",background:pct>=1?"#10B981":color,borderRadius:2}}/></div>
      <span style={{fontSize:10,fontWeight:800,color:pct>=1?"#10B981":color,fontFamily:"'DM Sans'"}}>{act}/{tgt}</span>
    </div>;
  };

  return (
    <div style={{minHeight:"100vh",background:"#0B1120",color:"#E2E8F0",fontFamily:"'Noto Sans JP','DM Sans',sans-serif"}}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&family=Noto+Sans+JP:wght@300;400;500;600;700;800&display=swap" rel="stylesheet"/>

      {/* Header */}
      <div style={{background:"linear-gradient(135deg,#0F172A,#1E293B,#0F172A)",borderBottom:"1px solid rgba(255,255,255,0.05)",padding:"0 20px"}}>
        <div style={{maxWidth:1200,margin:"0 auto",display:"flex",alignItems:"center",justifyContent:"space-between",height:54}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <div style={{width:30,height:30,borderRadius:7,background:"linear-gradient(135deg,#F97316,#DC2626)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,fontWeight:900,color:"#FFF"}}>数</div>
            <div><div style={{fontSize:12,fontWeight:700,color:"#F8FAFC"}}>数学教育フェス</div><div style={{fontSize:8,color:"#64748B",letterSpacing:1.5}}>EXECUTION DASHBOARD</div></div>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <div style={{display:"flex",alignItems:"center",gap:4,padding:"3px 8px",borderRadius:5,background:connected?"rgba(16,185,129,0.08)":"rgba(100,116,139,0.08)",border:`1px solid ${connected?"rgba(16,185,129,0.2)":"rgba(100,116,139,0.15)"}`}}>
              <div style={{width:5,height:5,borderRadius:"50%",background:connected?"#10B981":"#64748B"}}/>
              <span style={{fontSize:9,color:connected?"#10B981":"#64748B",fontWeight:600}}>{connected?"Sheets連携":"オフライン"}</span>
            </div>
            <button onClick={()=>setShowSettings(!showSettings)} style={{width:28,height:28,borderRadius:6,background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.1)",color:"#94A3B8",cursor:"pointer",fontSize:12,display:"flex",alignItems:"center",justifyContent:"center"}}>⚙️</button>
            <div style={{textAlign:"right"}}><div style={{fontSize:8,color:"#64748B"}}>第4回まで</div><div style={{fontSize:16,fontWeight:900,color:"#F97316",fontFamily:"'DM Sans'"}}>{days}<span style={{fontSize:9,color:"#94A3B8",fontWeight:400}}>日</span></div></div>
          </div>
        </div>
      </div>

      {showSettings&&<div style={{background:"#1E293B",borderBottom:"1px solid rgba(255,255,255,0.08)",padding:"14px 20px"}}><div style={{maxWidth:1200,margin:"0 auto"}}>
        <div style={{fontSize:12,fontWeight:700,color:"#F8FAFC",marginBottom:8}}>⚙️ Google Sheets 連携</div>
        <div style={{fontSize:10,color:"#94A3B8",marginBottom:10,lineHeight:1.7}}>テンプレートをGoogleスプレッドシートで開く → 「ファイル」→「共有」→「ウェブに公開」→ CSV → URLを貼付</div>
        <div style={{display:"flex",gap:8}}><input value={inputId} onChange={e=>setInputId(e.target.value)} placeholder="スプレッドシートURL or ID" style={{flex:1,padding:"7px 10px",borderRadius:6,border:"1px solid rgba(255,255,255,0.1)",background:"rgba(0,0,0,0.3)",color:"#E2E8F0",fontSize:11,outline:"none"}}/><button onClick={saveSettings} disabled={loading} style={{padding:"7px 18px",borderRadius:6,border:"none",background:loading?"#475569":"#F97316",color:"#FFF",fontWeight:700,fontSize:11,cursor:loading?"default":"pointer"}}>{loading?"...":"接続"}</button>{connected&&<button onClick={()=>fetchData(sheetId)} style={{padding:"7px 12px",borderRadius:6,border:"1px solid rgba(255,255,255,0.1)",background:"transparent",color:"#94A3B8",fontSize:11,cursor:"pointer"}}>🔄</button>}</div>
        {error&&<div style={{marginTop:6,fontSize:10,color:"#F87171"}}>⚠️ {error}</div>}
        {connected&&lastFetch&&<div style={{marginTop:4,fontSize:9,color:"#10B981"}}>✓ {lastFetch.toLocaleString("ja-JP")}</div>}
      </div></div>}

      {/* Tabs */}
      <div style={{background:"rgba(15,23,42,0.9)",borderBottom:"1px solid rgba(255,255,255,0.05)",padding:"0 20px",position:"sticky",top:0,zIndex:10,backdropFilter:"blur(12px)"}}>
        <div style={{maxWidth:1200,margin:"0 auto",display:"flex",gap:2}}>
          {[{id:"overview",l:"概要",i:"🏠"},{id:"members",l:"会員分析",i:"👥"},{id:"actions",l:"ロードマップ",i:"🎯"}].map(t=>(
            <button key={t.id} onClick={()=>setTab(t.id)} style={{padding:"10px 15px",background:tab===t.id?"rgba(249,115,22,0.08)":"transparent",border:"none",borderBottom:tab===t.id?"2px solid #F97316":"2px solid transparent",color:tab===t.id?"#F97316":"#64748B",fontFamily:"'Noto Sans JP'",fontSize:11,fontWeight:600,cursor:"pointer"}}>{t.i} {t.l}</button>
          ))}
        </div>
      </div>

      <div style={{maxWidth:1200,margin:"0 auto",padding:"20px"}}>
        {tab==="overview"&&(<div>

          {/* ====== JOURNEY FLOW (HERO) ====== */}
          <div style={{background:"linear-gradient(135deg,rgba(15,23,42,0.98),rgba(30,41,59,0.95))",borderRadius:14,padding:"20px 18px",border:"1px solid rgba(249,115,22,0.1)",marginBottom:18}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
              <div><div style={{fontSize:14,fontWeight:800,color:"#F8FAFC"}}>カスタマージャーニー</div><div style={{fontSize:10,color:"#94A3B8",marginTop:2}}>フローの数字は下の実行進捗と連動</div></div>
              <div style={{fontSize:10,color:"#64748B"}}>有料LINE = 最終ゴール</div>
            </div>

            <div style={{display:"flex",alignItems:"stretch",gap:0}}>

              {/* === SOURCES === */}
              <div style={{flex:1.3,display:"flex",flexDirection:"column",gap:3}}>
                <div style={{fontSize:8,color:"#64748B",fontWeight:600,textAlign:"center",marginBottom:2,letterSpacing:0.5}}>流入経路（すべて管理可能）</div>

                {/* Source: 直接交流 */}
                <div style={{padding:"6px 8px",borderRadius:6,background:"rgba(249,115,22,0.05)",border:"1px solid rgba(249,115,22,0.15)"}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <span style={{fontSize:10,fontWeight:600,color:"#F97316"}}>🤝 直接交流</span>
                    <MiniBar act={flow.ev.done} tgt={flow.ev.total} color="#F97316"/>
                  </div>
                  <div style={{fontSize:8,color:"#64748B",marginTop:2}}>学会・EDIX・研究会</div>
                </div>

                {/* Source: 登壇者SNS */}
                <div style={{padding:"6px 8px",borderRadius:6,background:"rgba(139,92,246,0.05)",border:"1px solid rgba(139,92,246,0.15)"}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <span style={{fontSize:10,fontWeight:600,color:"#8B5CF6"}}>📣 登壇者SNS</span>
                    {flow.spk&&<MiniBar act={flow.spk.act} tgt={flow.spk.tgt} color="#8B5CF6"/>}
                  </div>
                  <div style={{fontSize:8,color:"#64748B",marginTop:2}}>投稿ガイド活用・月4回</div>
                </div>

                {/* Source: YouTube */}
                <div style={{padding:"6px 8px",borderRadius:6,background:"rgba(59,130,246,0.05)",border:"1px solid rgba(59,130,246,0.15)"}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <span style={{fontSize:10,fontWeight:600,color:"#3B82F6"}}>🎬 YouTube</span>
                    {flow.yt&&<MiniBar act={flow.yt.act} tgt={flow.yt.tgt} color="#3B82F6"/>}
                  </div>
                  <div style={{fontSize:8,color:"#64748B",marginTop:2}}>ショート専用CH・週2本</div>
                </div>

                {/* Source: メールリスト */}
                <div style={{padding:"6px 8px",borderRadius:6,background:"rgba(16,185,129,0.05)",border:"1px solid rgba(16,185,129,0.15)"}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <span style={{fontSize:10,fontWeight:600,color:"#10B981"}}>📧 メールリスト</span>
                    {flow.mail&&<MiniBar act={flow.mail.act} tgt={flow.mail.tgt} color="#10B981"/>}
                  </div>
                  <div style={{fontSize:8,color:"#64748B",marginTop:2}}>学会名刺→メール案内</div>
                </div>
              </div>

              {/* Arrow */}
              <div style={{display:"flex",alignItems:"center",justifyContent:"center",padding:"0 4px",color:"#475569",fontSize:13}}>→</div>

              {/* === LP === */}
              <div style={{flex:0.7,display:"flex",flexDirection:"column",justifyContent:"center"}}>
                <div style={{padding:"12px 8px",borderRadius:8,background:"rgba(245,158,11,0.05)",border:"1px solid rgba(245,158,11,0.15)",textAlign:"center"}}>
                  <div style={{fontSize:8,color:"#64748B",fontWeight:600}}>LP</div>
                  <div style={{fontSize:16,fontWeight:900,color:"#F59E0B",fontFamily:"'DM Sans'",marginTop:2}}>—</div>
                  <div style={{fontSize:8,color:"#64748B",marginTop:2}}>CVR未計測</div>
                  <div style={{fontSize:7,color:"#F59E0B",marginTop:3,fontWeight:600}}>⚠ 計測が最初の一手</div>
                </div>
              </div>

              <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"0 3px"}}>
                <div style={{fontSize:7,color:"#64748B",whiteSpace:"nowrap"}}>LP→LINE</div>
                <div style={{color:"#475569",fontSize:13}}>→</div>
                <div style={{fontSize:9,fontWeight:700,color:"#F97316"}}>15-25%</div>
              </div>

              {/* === 無料LINE === */}
              <div style={{flex:0.9,display:"flex",flexDirection:"column",justifyContent:"center"}}>
                <div style={{padding:"12px 8px",borderRadius:8,background:"rgba(139,92,246,0.05)",border:"2px solid rgba(139,92,246,0.2)",textAlign:"center"}}>
                  <div style={{fontSize:8,color:"#64748B",fontWeight:600}}>無料LINE</div>
                  <div style={{fontSize:18,fontWeight:900,color:"#8B5CF6",fontFamily:"'DM Sans'",marginTop:2}}>{outcome.freeLine}<span style={{fontSize:9,fontWeight:400,color:"#64748B"}}>/{outcome.freeLineTarget}</span></div>
                  <div style={{fontSize:8,color:"#64748B",marginTop:2}}>登録者数（結果）</div>
                  {flow.linePosts&&<div style={{fontSize:8,color:"#8B5CF6",marginTop:3}}>配信 {flow.linePosts.act}/{flow.linePosts.tgt}回</div>}
                </div>
              </div>

              <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"0 3px"}}>
                <div style={{fontSize:7,color:"#64748B",whiteSpace:"nowrap"}}>体験</div>
                <div style={{color:"#475569",fontSize:13}}>→</div>
              </div>

              {/* === TRIGGERS === */}
              <div style={{flex:1,display:"flex",flexDirection:"column",gap:3,justifyContent:"center"}}>
                <div style={{fontSize:8,color:"#64748B",fontWeight:600,textAlign:"center",marginBottom:1}}>転換トリガー</div>
                {[
                  {n:"年次イベント",c:"#F97316",r:"25-30%"},
                  {n:"月例セミナー体験",c:"#10B981",r:"10-15%"},
                  {n:"動画アーカイブ",c:"#8B5CF6",r:"5-10%"},
                ].map((t,i)=>(
                  <div key={i} style={{padding:"4px 7px",borderRadius:5,background:"rgba(255,255,255,0.02)",border:`1px solid ${t.c}18`,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <span style={{fontSize:9,color:"#CBD5E1"}}>{t.n}</span>
                    <span style={{fontSize:8,fontWeight:700,color:t.c}}>{t.r}</span>
                  </div>
                ))}
              </div>

              <div style={{display:"flex",alignItems:"center",justifyContent:"center",padding:"0 4px",color:"#475569",fontSize:13}}>→</div>

              {/* === GOAL === */}
              <div style={{flex:1,display:"flex",flexDirection:"column",justifyContent:"center"}}>
                <div style={{padding:"14px 10px",borderRadius:10,background:"rgba(16,185,129,0.06)",border:"2px solid rgba(16,185,129,0.2)",textAlign:"center"}}>
                  <div style={{fontSize:8,color:"#64748B",fontWeight:600}}>有料LINE</div>
                  <div style={{fontSize:22,fontWeight:900,color:"#10B981",fontFamily:"'DM Sans'",marginTop:2}}>{outcome.members}</div>
                  <div style={{fontSize:9,color:"#64748B",marginTop:2}}>¥{outcome.revenue.toLocaleString()}/月</div>
                  <div style={{fontSize:8,color:"#10B981",marginTop:3}}>目標 300名</div>
                </div>
              </div>
            </div>

            {/* Bottlenecks */}
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginTop:14}}>
              <div style={{padding:"8px 10px",borderRadius:7,borderLeft:"3px solid #F59E0B",background:"rgba(245,158,11,0.03)"}}>
                <div style={{fontSize:9,fontWeight:700,color:"#F59E0B"}}>ボトルネック① LP→無料LINE</div>
                <div style={{fontSize:9,color:"#94A3B8",marginTop:2}}>CVR未計測。GA導入→ABテストが最初の打ち手。</div>
              </div>
              <div style={{padding:"8px 10px",borderRadius:7,borderLeft:"3px solid #8B5CF6",background:"rgba(139,92,246,0.03)"}}>
                <div style={{fontSize:9,fontWeight:700,color:"#8B5CF6"}}>ボトルネック② 非イベント転換</div>
                <div style={{fontSize:9,color:"#94A3B8",marginTop:2}}>自動フォローアップで「イベント待ち」脱却。</div>
              </div>
            </div>
          </div>

          {/* ====== 結果KPI ====== */}
          <div style={{marginBottom:18}}>
            <div style={{fontSize:10,color:"#64748B",fontWeight:600,letterSpacing:1,marginBottom:8}}>📊 結果KPI — 行動の結果として動く数字</div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:8}}>
              {[
                { l:"有効メンバー", v:outcome.members.toLocaleString(), s:"目標300", c:"#10B981", tgt:300, act:outcome.members },
                { l:"無料LINE登録者", v:outcome.freeLine.toLocaleString(), s:"目標"+outcome.freeLineTarget, c:"#8B5CF6", tgt:outcome.freeLineTarget, act:outcome.freeLine },
                { l:"月次売上", v:`¥${outcome.revenue.toLocaleString()}`, s:"目標¥682,500", c:"#3B82F6", tgt:682500, act:outcome.revenue },
                { l:"解約率", v:outcome.churnRate+"%", s:"再入会"+outcome.rejoin+"名", c:"#EF4444" },
                { l:"市場浸透率", v:(outcome.members/38000*100).toFixed(1)+"%", s:"TAM 38,000人", c:"#F97316" },
              ].map((m,i) => (
                <div key={i} style={{background:"linear-gradient(135deg,rgba(15,23,42,0.95),rgba(30,41,59,0.9))",borderRadius:10,padding:"12px 10px",border:"1px solid rgba(255,255,255,0.05)",borderLeft:`3px solid ${m.c}`}}>
                  <div style={{fontSize:8,color:"#64748B",fontWeight:600}}>{m.l}</div>
                  <div style={{fontSize:20,fontWeight:900,color:"#F8FAFC",fontFamily:"'DM Sans'",marginTop:3}}>{m.v}</div>
                  <div style={{fontSize:8,color:"#64748B",marginTop:2}}>{m.s}</div>
                  {m.tgt && <div style={{marginTop:4,height:3,background:"rgba(255,255,255,0.04)",borderRadius:2}}><div style={{width:`${Math.min((m.act/m.tgt)*100,100)}%`,height:"100%",background:m.c,borderRadius:2,minWidth:2}}/></div>}
                </div>
              ))}
            </div>
          </div>

          {/* ====== 行動KPI ====== */}
          <div style={{background:"linear-gradient(135deg,rgba(15,23,42,0.98),rgba(30,41,59,0.95))",borderRadius:14,padding:"20px 18px",border:"1px solid rgba(249,115,22,0.12)",marginBottom:18,position:"relative"}}>
            <div style={{position:"absolute",top:0,left:0,right:0,height:3,background:`linear-gradient(90deg,#F97316 ${oPct*100}%,rgba(255,255,255,0.04) ${oPct*100}%)`}}/>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16}}>
              <div>
                <div style={{fontSize:14,fontWeight:800,color:"#F8FAFC"}}>📋 行動KPI — やったかどうか</div>
                <div style={{fontSize:9,color:"#94A3B8",marginTop:2}}>自分でコントロールできること。これが結果を動かす。</div>
              </div>
              <div style={{display:"flex",alignItems:"center",gap:10}}>
                <div style={{position:"relative",display:"flex",alignItems:"center",justifyContent:"center"}}>
                  <Ring pct={oPct} size={50} sw={4} color={oPct>.6?"#10B981":oPct>.3?"#F97316":"#EF4444"}/>
                  <div style={{position:"absolute",fontSize:13,fontWeight:900,color:"#F8FAFC",fontFamily:"'DM Sans'"}}>{Math.round(oPct*100)}%</div>
                </div>
                <div style={{textAlign:"right"}}>
                  <div style={{fontSize:17,fontWeight:900,color:oPct>.6?"#10B981":"#EF4444",fontFamily:"'DM Sans'"}}>{totalD}<span style={{color:"#64748B",fontSize:11,fontWeight:400}}>/{totalT}</span></div>
                </div>
              </div>
            </div>

            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
              {execData.map((cat,ci)=>{
                const done=cat.items.filter(i=>i.act>=i.tgt).length;
                return (
                  <div key={ci} style={{background:"rgba(0,0,0,0.2)",borderRadius:10,padding:"13px 12px",border:`1px solid ${cat.color}18`}}>
                    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:9}}>
                      <div style={{display:"flex",alignItems:"center",gap:5}}>
                        <span style={{fontSize:14}}>{cat.icon}</span>
                        <span style={{fontSize:11,fontWeight:700,color:"#F8FAFC"}}>{cat.cat}</span>
                        {cat.flowLabel&&<span style={{fontSize:8,padding:"1px 5px",borderRadius:3,background:`${cat.color}15`,color:cat.color,fontWeight:600}}>{cat.flowLabel}</span>}
                      </div>
                      <div style={{display:"flex",alignItems:"center",gap:4}}>
                        <div style={{width:40,height:3,background:"rgba(255,255,255,0.05)",borderRadius:2}}><div style={{width:`${(done/cat.items.length)*100}%`,height:"100%",background:cat.color,borderRadius:2}}/></div>
                        <span style={{fontSize:9,fontWeight:800,color:cat.color,fontFamily:"'DM Sans'"}}>{done}/{cat.items.length}</span>
                      </div>
                    </div>
                    {cat.items.map((it,ii)=>{
                      const pct=it.tgt>0?Math.min(it.act/it.tgt,1):0,ok=it.act>=it.tgt,started=it.act>0;
                      return (
                        <div key={ii} style={{display:"flex",alignItems:"center",gap:6,padding:"5px 0",borderBottom:ii<cat.items.length-1?"1px solid rgba(255,255,255,0.02)":"none"}}>
                          <div style={{width:14,height:14,borderRadius:3,background:ok?"#10B981":started?`${cat.color}22`:"rgba(255,255,255,0.03)",border:ok?"none":`1.5px solid ${started?cat.color:"rgba(255,255,255,0.07)"}`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>{ok&&<span style={{color:"#FFF",fontSize:8}}>✓</span>}</div>
                          <div style={{flex:1,minWidth:0}}>
                            <div style={{fontSize:10,color:ok?"#94A3B8":"#E2E8F0",fontWeight:500,textDecoration:ok?"line-through":"none",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{it.name}</div>
                            <div style={{fontSize:7,color:"#64748B",marginTop:1}}>{it.dl}{it.note?` · ${it.note}`:""}</div>
                          </div>
                          <div style={{display:"flex",alignItems:"center",gap:4,flexShrink:0}}>
                            {it.tgt>1&&<div style={{width:28,height:3,background:"rgba(255,255,255,0.05)",borderRadius:2}}><div style={{width:`${pct*100}%`,height:"100%",background:ok?"#10B981":cat.color,borderRadius:2}}/></div>}
                            <span style={{fontSize:10,fontWeight:800,color:ok?"#10B981":started?cat.color:"#475569",fontFamily:"'DM Sans'",minWidth:34,textAlign:"right"}}>{it.act}{it.tgt>1?`/${it.tgt}`:""}<span style={{fontSize:7,fontWeight:400,color:"#64748B"}}>{it.unit}</span></span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Charts */}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            <div style={{background:"linear-gradient(135deg,rgba(15,23,42,0.95),rgba(30,41,59,0.9))",borderRadius:12,padding:16,border:"1px solid rgba(255,255,255,0.05)"}}>
              <div style={{fontSize:11,fontWeight:700,color:"#F8FAFC",marginBottom:10}}>会員数推移</div>
              <ResponsiveContainer width="100%" height={160}>
                <AreaChart data={monthly} margin={{top:5,right:5,left:-20,bottom:0}}>
                  <defs><linearGradient id="tg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#3B82F6" stopOpacity={.2}/><stop offset="100%" stopColor="#3B82F6" stopOpacity={0}/></linearGradient></defs>
                  <XAxis dataKey="month" tick={{fontSize:8,fill:"#64748B"}} axisLine={false} tickLine={false}/>
                  <YAxis tick={{fontSize:8,fill:"#64748B"}} axisLine={false} tickLine={false} domain={[0,"auto"]}/>
                  <Tooltip content={<Tip/>}/>
                  <Area type="monotone" dataKey="total" stroke="#3B82F6" strokeWidth={2} fill="url(#tg)" name="累計" dot={{r:2,fill:"#3B82F6"}}/>
                  <Bar dataKey="newReg" fill="#F97316" name="新規" radius={[2,2,0,0]} barSize={6} opacity={.7}/>
                  <Bar dataKey="churn" fill="#EF4444" name="退会" radius={[2,2,0,0]} barSize={6} opacity={.5}/>
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div style={{background:"linear-gradient(135deg,rgba(15,23,42,0.95),rgba(30,41,59,0.9))",borderRadius:12,padding:16,border:"1px solid rgba(255,255,255,0.05)"}}>
              <div style={{fontSize:11,fontWeight:700,color:"#F8FAFC",marginBottom:10}}>売上ロードマップ</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:6}}>
                {[{l:"現在",r:outcome.revenue,m:outcome.members,c:"#3B82F6"},{l:"第4回後",r:502500,m:230,c:"#F97316"},{l:"ストレッチ",r:682500,m:300,c:"#10B981"}].map((s,i)=>(
                  <div key={i} style={{textAlign:"center",padding:10,borderRadius:7,background:`${s.c}08`,border:`1px solid ${s.c}15`}}>
                    <div style={{fontSize:7,color:"#94A3B8"}}>{s.l}</div>
                    <div style={{fontSize:15,fontWeight:900,color:s.c,fontFamily:"'DM Sans'",marginTop:2}}>¥{s.r.toLocaleString()}</div>
                    <div style={{fontSize:7,color:"#64748B",marginTop:1}}>{s.m}名/月</div>
                  </div>
                ))}
              </div>
              <div style={{marginTop:8,height:4,background:"rgba(255,255,255,0.03)",borderRadius:2}}><div style={{width:`${(outcome.revenue/682500)*100}%`,height:"100%",background:"linear-gradient(90deg,#3B82F6,#F97316)",borderRadius:2}}/></div>
            </div>
          </div>
        </div>)}

        {tab==="members"&&(<div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:12}}>
            <div style={{background:"linear-gradient(135deg,rgba(15,23,42,0.95),rgba(30,41,59,0.9))",borderRadius:12,padding:18,border:"1px solid rgba(255,255,255,0.05)"}}>
              <div style={{fontSize:11,fontWeight:700,color:"#F8FAFC",marginBottom:10}}>地域分布</div>
              {[{r:"関東",m:76,c:"#F97316"},{r:"中部",m:29,c:"#3B82F6"},{r:"中国四国",m:21,c:"#10B981"},{r:"近畿",m:18,c:"#8B5CF6"},{r:"九州沖縄",m:17,c:"#EC4899"},{r:"北海道東北",m:9,c:"#6366F1"}].map((r,i)=>(<div key={i} style={{display:"flex",alignItems:"center",gap:7,marginBottom:5}}><div style={{width:48,fontSize:9,color:"#94A3B8"}}>{r.r}</div><div style={{flex:1,height:14,background:"rgba(255,255,255,0.03)",borderRadius:3}}><div style={{width:`${(r.m/76)*100}%`,height:"100%",background:r.c,borderRadius:3,opacity:.7}}/></div><div style={{width:26,fontSize:10,fontWeight:800,color:r.c,textAlign:"right",fontFamily:"'DM Sans'"}}>{r.m}</div></div>))}
            </div>
            <div style={{background:"linear-gradient(135deg,rgba(15,23,42,0.95),rgba(30,41,59,0.9))",borderRadius:12,padding:18,border:"1px solid rgba(255,255,255,0.05)"}}>
              <div style={{fontSize:11,fontWeight:700,color:"#F8FAFC",marginBottom:10}}>プラン / 再入会</div>
              <div style={{display:"flex",gap:12,alignItems:"center",marginBottom:14}}>
                <div style={{width:80,height:80}}><ResponsiveContainer><PieChart><Pie data={[{n:"S",value:outcome.standard},{n:"G",value:outcome.gold}]} cx="50%" cy="50%" innerRadius={26} outerRadius={38} dataKey="value" stroke="none"><Cell fill="#3B82F6"/><Cell fill="#F59E0B"/></Pie></PieChart></ResponsiveContainer></div>
                <div>
                  <div style={{marginBottom:4}}><span style={{display:"inline-block",width:7,height:7,borderRadius:2,background:"#3B82F6",marginRight:3}}/><span style={{fontSize:9,color:"#94A3B8"}}>S </span><span style={{fontSize:14,fontWeight:800,color:"#3B82F6",fontFamily:"'DM Sans'"}}>{outcome.standard}</span></div>
                  <div><span style={{display:"inline-block",width:7,height:7,borderRadius:2,background:"#F59E0B",marginRight:3}}/><span style={{fontSize:9,color:"#94A3B8"}}>G </span><span style={{fontSize:14,fontWeight:800,color:"#F59E0B",fontFamily:"'DM Sans'"}}>{outcome.gold}</span></div>
                </div>
              </div>
              <div style={{padding:8,background:"rgba(16,185,129,0.04)",borderRadius:6}}>
                <div style={{fontSize:10,color:"#10B981",fontWeight:600}}>再入会 {outcome.rejoin}名（退会者の22.5%）</div>
                <div style={{fontSize:8,color:"#94A3B8",marginTop:2}}>戻る人がいる = コンテンツ力の証</div>
              </div>
            </div>
          </div>
        </div>)}

        {tab==="actions"&&(<div>
          <div style={{fontSize:9,color:"#F97316",fontWeight:700,letterSpacing:2,marginBottom:4}}>ROADMAP & MARKET</div>
          <div style={{fontSize:16,fontWeight:800,color:"#F8FAFC",marginBottom:14}}>第4回イベントまでの実行計画</div>

          <div style={{display:"grid",gridTemplateColumns:"1fr 280px",gap:16}}>
            {/* Left: Roadmap */}
            <div>
              {[
                {ph:"0",t:"基盤整備",p:"〜5月",c:"#EF4444",tasks:["法人化完了","入会導線+フォローアップ設計","LP GA導入・CVR計測","税理士選定"]},
                {ph:"1",t:"直接交流+コンテンツ開始",p:"5〜8月",c:"#F97316",tasks:["EDIX東京(5/13)","YouTubeチャンネル開設+投稿開始","登壇者SNS投稿ガイド作成→SNS投稿開始","全国大会(8/6)"]},
                {ph:"2",t:"認知拡大+LP改善",p:"5〜10月",c:"#3B82F6",tasks:["LP ABテスト3回","無料LINE配信 週1開始","メールリスト→LP/LINE案内","EDIX関西+秋期大会"]},
                {ph:"3",t:"集客ラッシュ",p:"10〜1月",c:"#8B5CF6",tasks:["告知+チケット販売","学会関係者に招待状","LINE広告出稿","無料LINE→イベント案内強化"]},
                {ph:"4",t:"イベント+送客",p:"2月",c:"#10B981",tasks:["第4回(2/21) 300名","体験ブース設置","フォローアップ→入会55〜75名"]},
              ].map((p,i)=>(
                <div key={i} style={{display:"flex",gap:10,marginBottom:2}}>
                  <div style={{display:"flex",flexDirection:"column",alignItems:"center",width:22,flexShrink:0}}>
                    <div style={{width:10,height:10,borderRadius:"50%",background:p.c,border:"3px solid #0B1120",zIndex:1}}/>
                    {i<4&&<div style={{width:2,flex:1,background:"rgba(255,255,255,0.04)"}}/>}
                  </div>
                  <div style={{flex:1,background:"linear-gradient(135deg,rgba(15,23,42,0.95),rgba(30,41,59,0.9))",borderRadius:9,padding:"11px 13px",border:"1px solid rgba(255,255,255,0.04)",marginBottom:6}}>
                    <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                      <div><span style={{fontSize:7,color:p.c,fontWeight:800}}>PHASE {p.ph}</span><span style={{fontSize:11,fontWeight:700,color:"#F8FAFC",marginLeft:6}}>{p.t}</span></div>
                      <span style={{fontSize:8,color:"#64748B"}}>{p.p}</span>
                    </div>
                    {p.tasks.map((t,j)=>(<div key={j} style={{fontSize:10,color:"#CBD5E1",marginBottom:1,paddingLeft:8}}>· {t}</div>))}
                  </div>
                </div>
              ))}
            </div>

            {/* Right: Market context */}
            <div style={{display:"flex",flexDirection:"column",gap:10}}>
              {/* TAM */}
              <div style={{background:"linear-gradient(135deg,rgba(15,23,42,0.95),rgba(30,41,59,0.9))",borderRadius:10,padding:"14px 14px",border:"1px solid rgba(255,255,255,0.05)"}}>
                <div style={{fontSize:9,color:"#64748B",fontWeight:600,letterSpacing:0.5,marginBottom:6}}>ターゲット市場</div>
                <div style={{display:"flex",alignItems:"baseline",gap:4}}>
                  <span style={{fontSize:28,fontWeight:900,color:"#F97316",fontFamily:"'DM Sans'"}}>38,000</span>
                  <span style={{fontSize:10,color:"#64748B"}}>人</span>
                </div>
                <div style={{fontSize:9,color:"#94A3B8",marginTop:4}}>高校数学教員 28,000〜33,000</div>
                <div style={{fontSize:9,color:"#94A3B8"}}>予備校数学講師 5,000〜10,000</div>
                <div style={{marginTop:8,height:4,background:"rgba(255,255,255,0.04)",borderRadius:2}}>
                  <div style={{width:`${(outcome.members/38000)*100}%`,height:"100%",background:"#F97316",borderRadius:2,minWidth:3}}/>
                </div>
                <div style={{display:"flex",justifyContent:"space-between",marginTop:3,fontSize:8,color:"#64748B"}}>
                  <span>現在 {outcome.members}名</span>
                  <span>浸透率 {(outcome.members/38000*100).toFixed(1)}%</span>
                </div>
              </div>

              {/* Key events */}
              <div style={{background:"linear-gradient(135deg,rgba(15,23,42,0.95),rgba(30,41,59,0.9))",borderRadius:10,padding:"14px 14px",border:"1px solid rgba(255,255,255,0.05)"}}>
                <div style={{fontSize:9,color:"#64748B",fontWeight:600,letterSpacing:0.5,marginBottom:8}}>先生に会える場所</div>
                {[
                  {m:"5月",n:"EDIX東京",s:"数万人来場",c:"#F97316"},
                  {m:"6月",n:"春期研究大会",s:"鹿児島",c:"#3B82F6"},
                  {m:"8月",n:"全国大会",s:"数千人・本丸",c:"#EF4444"},
                  {m:"10月",n:"秋期研究大会",s:"埼玉",c:"#3B82F6"},
                  {m:"10月",n:"EDIX関西",s:"大阪",c:"#F97316"},
                  {m:"通年",n:"都道府県研究会",s:"各50〜200人",c:"#10B981"},
                ].map((e,i)=>(
                  <div key={i} style={{display:"flex",alignItems:"center",gap:6,marginBottom:4}}>
                    <span style={{fontSize:9,fontWeight:700,color:e.c,width:28,flexShrink:0}}>{e.m}</span>
                    <span style={{fontSize:9,color:"#E2E8F0",flex:1}}>{e.n}</span>
                    <span style={{fontSize:8,color:"#64748B"}}>{e.s}</span>
                  </div>
                ))}
              </div>

              {/* Teacher demographics */}
              <div style={{background:"linear-gradient(135deg,rgba(15,23,42,0.95),rgba(30,41,59,0.9))",borderRadius:10,padding:"14px 14px",border:"1px solid rgba(255,255,255,0.05)"}}>
                <div style={{fontSize:9,color:"#64748B",fontWeight:600,letterSpacing:0.5,marginBottom:8}}>教員の特徴（公立高校）</div>
                {[
                  {l:"教員総数",v:"223,201人",n:"令和6年度"},
                  {l:"平均年齢",v:"45.5歳",n:"上昇傾向"},
                  {l:"50歳以上",v:"43.9%",n:"未開拓層"},
                  {l:"公立:私立",v:"72:28",n:""},
                ].map((d,i)=>(
                  <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:3}}>
                    <span style={{fontSize:9,color:"#94A3B8"}}>{d.l}</span>
                    <div style={{textAlign:"right"}}>
                      <span style={{fontSize:10,fontWeight:700,color:"#E2E8F0",fontFamily:"'DM Sans'"}}>{d.v}</span>
                      {d.n&&<span style={{fontSize:7,color:"#64748B",marginLeft:4}}>{d.n}</span>}
                    </div>
                  </div>
                ))}
              </div>

              {/* Community vs market */}
              <div style={{background:"linear-gradient(135deg,rgba(15,23,42,0.95),rgba(30,41,59,0.9))",borderRadius:10,padding:"14px 14px",border:"1px solid rgba(255,255,255,0.05)"}}>
                <div style={{fontSize:9,color:"#64748B",fontWeight:600,letterSpacing:0.5,marginBottom:8}}>コミュニティ vs 市場</div>
                <div style={{fontSize:9,color:"#94A3B8",marginBottom:6}}>コミュニティは25〜44歳が66%。市場の50歳以上層（43.9%）にまだリーチできていない。</div>
                <div style={{display:"flex",gap:4}}>
                  <div style={{flex:1,textAlign:"center",padding:"6px 4px",borderRadius:5,background:"rgba(249,115,22,0.06)",border:"1px solid rgba(249,115,22,0.12)"}}>
                    <div style={{fontSize:8,color:"#64748B"}}>関東集中</div>
                    <div style={{fontSize:13,fontWeight:800,color:"#F97316",fontFamily:"'DM Sans'"}}>45%</div>
                  </div>
                  <div style={{flex:1,textAlign:"center",padding:"6px 4px",borderRadius:5,background:"rgba(16,185,129,0.06)",border:"1px solid rgba(16,185,129,0.12)"}}>
                    <div style={{fontSize:8,color:"#64748B"}}>広島が健闘</div>
                    <div style={{fontSize:13,fontWeight:800,color:"#10B981",fontFamily:"'DM Sans'"}}>11名</div>
                  </div>
                  <div style={{flex:1,textAlign:"center",padding:"6px 4px",borderRadius:5,background:"rgba(139,92,246,0.06)",border:"1px solid rgba(139,92,246,0.12)"}}>
                    <div style={{fontSize:8,color:"#64748B"}}>男女比</div>
                    <div style={{fontSize:13,fontWeight:800,color:"#8B5CF6",fontFamily:"'DM Sans'"}}>93:7</div>
                  </div>
                </div>
              </div>

              {/* Revenue context */}
              <div style={{background:"linear-gradient(135deg,rgba(15,23,42,0.95),rgba(30,41,59,0.9))",borderRadius:10,padding:"14px 14px",border:"1px solid rgba(249,115,22,0.08)"}}>
                <div style={{fontSize:9,color:"#64748B",fontWeight:600,letterSpacing:0.5,marginBottom:6}}>直接交流の投資対効果</div>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                  <div>
                    <div style={{fontSize:8,color:"#94A3B8"}}>年間コスト</div>
                    <div style={{fontSize:16,fontWeight:900,color:"#F8FAFC",fontFamily:"'DM Sans'"}}>¥73,000</div>
                  </div>
                  <div style={{fontSize:16,color:"#475569"}}>→</div>
                  <div style={{textAlign:"right"}}>
                    <div style={{fontSize:8,color:"#94A3B8"}}>期待リターン/月</div>
                    <div style={{fontSize:16,fontWeight:900,color:"#10B981",fontFamily:"'DM Sans'"}}>+¥30,000</div>
                  </div>
                </div>
                <div style={{fontSize:9,color:"#10B981",textAlign:"center",fontWeight:600}}>3ヶ月で回収。最高ROI施策。</div>
              </div>
            </div>
          </div>
        </div>)}
      </div>
      <div style={{borderTop:"1px solid rgba(255,255,255,0.03)",padding:"8px",textAlign:"center",fontSize:8,color:"#475569"}}>数学教育フェス KPIダッシュボード{connected&&lastFetch?` ／ ${lastFetch.toLocaleTimeString("ja-JP")}`:""}</div>
    </div>
  );
}
