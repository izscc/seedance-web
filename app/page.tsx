'use client';
import { useEffect, useMemo, useState } from 'react';
import { FolderOpen, Sparkles, Video, Trash2, Copy, RefreshCcw } from 'lucide-react';

type Job = { id:string; remoteId?:string; status:string; prompt:string; model:string; params:any; storagePath:string; sourceUrl?:string; localPath?:string; error?:string; createdAt:string; updatedAt:string };
const defaults = { baseUrl:'https://api.zscc.in/v1', model:'doubao-seedance-2.0', storagePath:'./outputs/videos', endpointMode:'auto' };
const shotTemplate = `多个镜头。
镜头1：清晨的城市天台，柔和日光，主角站在风中。
镜头2：镜头缓慢推进，主角抬头看向远处，衣服和发丝自然摆动。
镜头3：航拍拉远，城市光影层次丰富，电影感收尾。`;

export default function Home(){
 const [form,setForm]=useState<any>({...defaults,prompt:shotTemplate,negativePrompt:'低清晰度、变形、抖动、文字水印',duration:5,ratio:'16:9',resolution:'720p',audio:true,seed:''});
 const [apiKey,setApiKey]=useState(''); const [jobs,setJobs]=useState<Job[]>([]); const [busy,setBusy]=useState(false); const [msg,setMsg]=useState('');
 const active = useMemo(()=>jobs.some(j=>!['succeeded','failed'].includes(j.status)),[jobs]);
 async function load(){ const r=await fetch('/api/jobs'); setJobs(await r.json()); }
 useEffect(()=>{load()},[]);
 useEffect(()=>{ if(!active) return; const t=setInterval(async()=>{ const latest=await Promise.all(jobs.map(async j=>!['succeeded','failed'].includes(j.status)?await (await fetch('/api/jobs/'+j.id)).json():j)); setJobs(latest); },5000); return()=>clearInterval(t); },[active,jobs]);
 function update(k:string,v:any){setForm((f:any)=>({...f,[k]:v}))}
 async function generate(){ setBusy(true); setMsg('正在创建 Seedance 任务...'); try{ const r=await fetch('/api/generate',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...form,apiKey})}); const data=await r.json(); if(!r.ok) throw new Error(data.error); setJobs([data,...jobs]); setMsg('任务已创建，正在轮询结果。'); }catch(e:any){setMsg(e.message)} finally{setBusy(false)} }
 async function del(id:string,remove=false){ await fetch(`/api/files/${id}?removeFile=${remove?'1':'0'}`,{method:'DELETE'}); load(); }
 async function reveal(p:string){ await fetch('/api/open',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({path:p})}); }
 return <main className="min-h-screen p-6 lg:p-10 bg-[radial-gradient(circle_at_top_left,#dbeafe,transparent_35%),radial-gradient(circle_at_top_right,#f5d0fe,transparent_30%)]">
  <div className="mx-auto max-w-7xl space-y-8">
   <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between"><div><div className="badge w-fit mb-3">Seedance 2.0 Local Console</div><h1 className="text-4xl lg:text-6xl font-black tracking-tight">用 New API 生成并本地归档视频</h1><p className="mt-4 max-w-3xl text-slate-600">面向 Seedance 2.0 的多模态视频模型特性设计：多镜头提示词、比例/时长/清晰度控制、原生音频开关、任务轮询和本地文件库。</p></div><button onClick={load} className="btn btn-soft flex items-center gap-2"><RefreshCcw size={18}/>刷新</button></header>
   <section className="grid lg:grid-cols-[1.15fr_.85fr] gap-6">
    <div className="card p-6 space-y-5"><h2 className="text-2xl font-black flex gap-2 items-center"><Sparkles/>生成参数</h2>
     <textarea className="field min-h-56 font-medium" value={form.prompt} onChange={e=>update('prompt',e.target.value)} />
     <textarea className="field min-h-20" placeholder="Negative prompt" value={form.negativePrompt} onChange={e=>update('negativePrompt',e.target.value)} />
     <div className="grid md:grid-cols-4 gap-3"><select className="field" value={form.duration} onChange={e=>update('duration',Number(e.target.value))}>{[5,10,15].map(x=><option key={x} value={x}>{x}s</option>)}</select><select className="field" value={form.ratio} onChange={e=>update('ratio',e.target.value)}>{['16:9','9:16','4:3','3:4','1:1'].map(x=><option key={x}>{x}</option>)}</select><select className="field" value={form.resolution} onChange={e=>update('resolution',e.target.value)}>{['480p','720p','1080p','2K'].map(x=><option key={x}>{x}</option>)}</select><input className="field" placeholder="seed 可选" value={form.seed} onChange={e=>update('seed',e.target.value)} /></div>
     <label className="flex items-center gap-3 text-sm font-bold"><input type="checkbox" checked={form.audio} onChange={e=>update('audio',e.target.checked)}/> 启用原生音频/声画同步参数</label>
     <button disabled={busy} onClick={generate} className="btn btn-primary w-full disabled:opacity-50">{busy?'创建中...':'生成视频'}</button><p className="text-sm text-slate-500 whitespace-pre-wrap">{msg}</p>
    </div>
    <div className="card p-6 space-y-4"><h2 className="text-2xl font-black">配置</h2><input className="field" value={form.baseUrl} onChange={e=>update('baseUrl',e.target.value)} /><input className="field" value={form.model} onChange={e=>update('model',e.target.value)} /><input className="field" value={form.storagePath} onChange={e=>update('storagePath',e.target.value)} /><input className="field" type="password" placeholder="临时 API Key；留空则读取 .env.local" value={apiKey} onChange={e=>setApiKey(e.target.value)} /><select className="field" value={form.endpointMode} onChange={e=>update('endpointMode',e.target.value)}><option value="auto">自动：官方任务接口优先，失败回退 OpenAI video</option><option value="official">仅官方 /api/v3/contents/generations/tasks</option><option value="openai">仅 /v1/video/generations</option></select><p className="text-xs text-slate-500">API Key 不会写入前端历史；生产使用请放入 .env.local。</p></div>
   </section>
   <section className="card p-6"><h2 className="text-2xl font-black flex gap-2 items-center mb-5"><Video/>任务与本地文件</h2><div className="grid gap-4">{jobs.map(j=><article key={j.id} className="rounded-2xl border border-slate-200 bg-white p-4 grid lg:grid-cols-[1fr_280px] gap-4"><div><div className="flex gap-2 flex-wrap"><span className="badge">{j.status}</span><span className="badge">{j.model}</span><span className="badge">{j.params?.duration}s {j.params?.ratio}</span></div><p className="font-bold mt-3 line-clamp-2">{j.prompt}</p><p className="text-xs text-slate-500 mt-2 break-all">remote: {j.remoteId||'-'}<br/>local: {j.localPath||'-'}<br/>{j.error}</p><div className="flex gap-2 mt-3 flex-wrap">{j.localPath&&<button className="btn btn-soft flex gap-1" onClick={()=>reveal(j.localPath!)}><FolderOpen size={16}/>定位</button>}{j.localPath&&<button className="btn btn-soft flex gap-1" onClick={()=>navigator.clipboard.writeText(j.localPath!)}><Copy size={16}/>复制路径</button>}<button className="btn btn-soft flex gap-1" onClick={()=>del(j.id,false)}><Trash2 size={16}/>删记录</button>{j.localPath&&<button className="btn btn-soft flex gap-1" onClick={()=>del(j.id,true)}>删文件</button>}</div></div><div>{j.localPath ? <video controls src={`/api/video?path=${encodeURIComponent(j.localPath)}`} className="w-full rounded-xl bg-black"/> : <div className="h-40 rounded-xl bg-slate-100 grid place-items-center text-slate-400">等待视频</div>}</div></article>)}{jobs.length===0&&<p className="text-slate-500">还没有任务。</p>}</div></section>
  </div>
 </main>
}
