'use client';

import { useEffect, useMemo, useState } from 'react';
import { Activity, Aperture, Copy, Film, FolderOpen, Layers3, RefreshCcw, Settings2, Sparkles, Trash2, Wand2 } from 'lucide-react';

type Job = { id:string; remoteId?:string; status:string; prompt:string; model:string; params:any; storagePath:string; sourceUrl?:string; localPath?:string; error?:string; createdAt:string; updatedAt:string };
const defaults = { baseUrl:'https://api.zscc.in/v1', model:'doubao-seedance-2.0', storagePath:'./outputs/videos', endpointMode:'auto' };
const shotTemplate = `多个镜头。
镜头1：清晨的城市天台，柔和日光，主角站在风中。
镜头2：镜头缓慢推进，主角抬头看向远处，衣服和发丝自然摆动。
镜头3：航拍拉远，城市光影层次丰富，电影感收尾。`;

function statusText(status: string) {
  return ({ pending: '等待中', running: '生成中', succeeded: '已完成', failed: '失败' } as Record<string,string>)[status] || status;
}

export default function Home(){
 const [form,setForm]=useState<any>({...defaults,prompt:shotTemplate,negativePrompt:'低清晰度、变形、抖动、文字水印',duration:5,ratio:'16:9',resolution:'720p',audio:true,seed:''});
 const [apiKey,setApiKey]=useState(''); const [jobs,setJobs]=useState<Job[]>([]); const [busy,setBusy]=useState(false); const [msg,setMsg]=useState('');
 const active = useMemo(()=>jobs.some(j=>!['succeeded','failed'].includes(j.status)),[jobs]);
 const completed = jobs.filter(j => j.status === 'succeeded').length;
 async function load(){ const r=await fetch('/api/jobs'); setJobs(await r.json()); }
 useEffect(()=>{load()},[]);
 useEffect(()=>{ if(!active) return; const t=setInterval(async()=>{ const latest=await Promise.all(jobs.map(async j=>!['succeeded','failed'].includes(j.status)?await (await fetch('/api/jobs/'+j.id)).json():j)); setJobs(latest); },5000); return()=>clearInterval(t); },[active,jobs]);
 function update(k:string,v:any){setForm((f:any)=>({...f,[k]:v}))}
 async function generate(){ setBusy(true); setMsg('正在创建 Seedance 任务...'); try{ const r=await fetch('/api/generate',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...form,apiKey})}); const data=await r.json(); if(!r.ok) throw new Error(data.error); setJobs([data,...jobs]); setMsg('任务已创建，正在轮询结果。'); }catch(e:any){setMsg(e.message)} finally{setBusy(false)} }
 async function del(id:string,remove=false){ await fetch(`/api/files/${id}?removeFile=${remove?'1':'0'}`,{method:'DELETE'}); load(); }
 async function reveal(p:string){ await fetch('/api/open',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({path:p})}); }
 return <main className="studio-shell">
  <div className="noise" />
  <div className="studio-wrap">
   <header className="hero-panel">
    <nav className="topbar">
      <div className="brand"><span className="brand-mark"><Aperture size={18}/></span><span>Seedance Studio</span></div>
      <button onClick={load} className="ghost-button"><RefreshCcw size={16}/>刷新任务</button>
    </nav>
    <div className="hero-grid">
      <div>
        <div className="eyebrow"><Sparkles size={15}/>Seedance 2.0 · New API Gateway</div>
        <h1>把提示词变成<br/>可归档的视频资产</h1>
        <p className="hero-copy">为多镜头叙事、比例控制、原生音频与本地素材管理重新设计的轻量控制台。参数在左，配置在右，生成结果沉淀为可追踪文件。</p>
      </div>
      <div className="hero-stats" aria-label="任务统计">
        <div><strong>{jobs.length}</strong><span>总任务</span></div>
        <div><strong>{completed}</strong><span>已归档</span></div>
        <div><strong>{active ? 'ON' : 'IDLE'}</strong><span>轮询状态</span></div>
      </div>
    </div>
   </header>

   <section className="workspace-grid">
    <form className="composer-card" onSubmit={(e)=>{e.preventDefault(); generate();}}>
      <div className="section-head"><div><span className="kicker">01 / COMPOSE</span><h2><Wand2 size={24}/>生成参数</h2></div><span className="soft-pill">Text to Video</span></div>
      <label className="field-block"><span>多镜头 Prompt</span><textarea className="studio-input prompt-area" value={form.prompt} onChange={e=>update('prompt',e.target.value)} /></label>
      <label className="field-block"><span>Negative Prompt</span><textarea className="studio-input negative-area" value={form.negativePrompt} onChange={e=>update('negativePrompt',e.target.value)} /></label>
      <div className="param-grid">
        <label className="field-block compact"><span>时长</span><select className="studio-input" value={form.duration} onChange={e=>update('duration',Number(e.target.value))}>{[5,10,15].map(x=><option key={x} value={x}>{x}s</option>)}</select></label>
        <label className="field-block compact"><span>画幅</span><select className="studio-input" value={form.ratio} onChange={e=>update('ratio',e.target.value)}>{['16:9','9:16','4:3','3:4','1:1'].map(x=><option key={x}>{x}</option>)}</select></label>
        <label className="field-block compact"><span>清晰度</span><select className="studio-input" value={form.resolution} onChange={e=>update('resolution',e.target.value)}>{['480p','720p','1080p','2K'].map(x=><option key={x}>{x}</option>)}</select></label>
        <label className="field-block compact"><span>Seed</span><input className="studio-input" placeholder="随机" value={form.seed} onChange={e=>update('seed',e.target.value)} /></label>
      </div>
      <label className="toggle-row"><input type="checkbox" checked={form.audio} onChange={e=>update('audio',e.target.checked)}/><span><b>原生音频 / 声画同步</b><small>作为高级参数透传给上游模型</small></span></label>
      <button disabled={busy} className="primary-action"><span>{busy?'正在创建任务':'生成视频'}</span><Film size={18}/></button>
      {msg && <p className="status-message">{msg}</p>}
    </form>

    <aside className="config-card">
      <div className="section-head"><div><span className="kicker">02 / ROUTE</span><h2><Settings2 size={23}/>模型配置</h2></div></div>
      <label className="field-block"><span>Base URL</span><input className="studio-input" value={form.baseUrl} onChange={e=>update('baseUrl',e.target.value)} /></label>
      <label className="field-block"><span>Model</span><input className="studio-input" value={form.model} onChange={e=>update('model',e.target.value)} /></label>
      <label className="field-block"><span>本地存储路径</span><input className="studio-input" value={form.storagePath} onChange={e=>update('storagePath',e.target.value)} /></label>
      <label className="field-block"><span>临时 API Key</span><input className="studio-input" type="password" placeholder="留空则读取 .env.local" value={apiKey} onChange={e=>setApiKey(e.target.value)} /></label>
      <label className="field-block"><span>端点策略</span><select className="studio-input" value={form.endpointMode} onChange={e=>update('endpointMode',e.target.value)}><option value="auto">自动：官方任务接口优先，失败回退 OpenAI video</option><option value="official">仅官方 /api/v3/contents/generations/tasks</option><option value="openai">仅 /v1/video/generations</option></select></label>
      <div className="notice"><Activity size={16}/><span>API Key 不写入任务历史；正式使用建议只放在 <code>.env.local</code>。</span></div>
      <div className="capability-card"><Layers3 size={20}/><div><b>Seedance 2.0 创作重点</b><p>稳定运动、多镜头叙事、多模态参考入口预留、声画同步参数。</p></div></div>
    </aside>
   </section>

   <section className="library-card">
    <div className="section-head"><div><span className="kicker">03 / ARCHIVE</span><h2><VideoIcon/>任务与本地文件</h2></div><span className="soft-pill">{jobs.length} jobs</span></div>
    <div className="job-list">{jobs.map(j=><article key={j.id} className="job-row">
      <div className="job-main"><div className="job-meta"><span className={`state state-${j.status}`}>{statusText(j.status)}</span><span>{j.model}</span><span>{j.params?.duration}s · {j.params?.ratio}</span></div><h3>{j.prompt}</h3><p>remote: {j.remoteId||'-'}<br/>local: {j.localPath||'-'}{j.error ? <><br/>error: {j.error}</> : null}</p><div className="job-actions">{j.localPath&&<button onClick={()=>reveal(j.localPath!)}><FolderOpen size={15}/>定位</button>}{j.localPath&&<button onClick={()=>navigator.clipboard.writeText(j.localPath!)}><Copy size={15}/>复制路径</button>}<button onClick={()=>del(j.id,false)}><Trash2 size={15}/>删记录</button>{j.localPath&&<button onClick={()=>del(j.id,true)}>删文件</button>}</div></div>
      <div className="preview-box">{j.localPath ? <video controls src={`/api/video?path=${encodeURIComponent(j.localPath)}`} /> : <div><Film size={28}/><span>等待视频</span></div>}</div>
    </article>)}{jobs.length===0&&<div className="empty-state"><Film size={34}/><b>还没有任务</b><span>生成后的视频会出现在这里，并自动保存到指定目录。</span></div>}</div>
   </section>
  </div>
 </main>
}
function VideoIcon(){ return <Film size={24}/> }
