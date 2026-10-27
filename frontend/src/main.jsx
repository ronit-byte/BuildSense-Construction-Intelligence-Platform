import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { HardHat, ShieldCheck, FileText, Image, Upload, Search, AlertTriangle, CheckCircle2, Info, Activity, ArrowRight, LoaderCircle, ClipboardList } from 'lucide-react';
import './style.css';

const API = 'http://127.0.0.1:8000';
function App() {
  const [tab, setTab] = useState('text');
  const [text, setText] = useState('Site inspection notes:\nWorkers near scaffolding should use hard hats and safety vests.\nLoose debris is obstructing the walkway near the electrical cable.');
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [drag, setDrag] = useState(false);

  async function analyze() {
    setBusy(true); setError(''); setResult(null);
    try {
      let response;
      if (tab === 'text') {
        response = await fetch(`${API}/api/analyze-text`, {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({text})});
      } else {
        if (!file) throw new Error('Choose a file first.');
        const data = new FormData(); data.append('file', file);
        response = await fetch(`${API}/api/analyze-file`, {method:'POST', body:data});
      }
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.detail || 'Analysis failed. Is the backend running?');
      setResult(payload);
    } catch (e) { setError(e.message || 'Unable to connect to backend.'); }
    finally { setBusy(false); }
  }
  const severityClass = s => (s || 'info').toLowerCase();
  return <div className="app-shell">
    <aside className="sidebar">
      <div className="brand"><div className="brand-mark"><HardHat size={23}/></div><div><b>BuildSense</b><small>CONSTRUCTION INTELLIGENCE</small></div></div>
      <div className="nav-label">WORKSPACE</div>
      <button className="nav-item active"><Activity size={18}/> Overview</button>
      <button className="nav-item" onClick={()=>{setTab('file');setResult(null)}}><Image size={18}/> Media analysis</button>
      <button className="nav-item" onClick={()=>{setTab('text');setResult(null)}}><FileText size={18}/> Text inspection</button>
      <div className="sidebar-bottom"><ShieldCheck size={18}/><span><b>Safety first</b><small>Preliminary screening tool</small></span></div>
    </aside>
    <main className="main">
      <header className="topbar"><div><span className="eyebrow">SITE OPERATIONS / OVERVIEW</span><h1>Construction intelligence</h1><p>Turn site notes and project documents into actionable preliminary insights.</p></div><div className="status"><span></span> SYSTEM READY</div></header>
      <section className="metrics">
        <div className="metric"><div className="metric-icon blue"><ClipboardList size={20}/></div><div><small>INPUT TYPES</small><b>Text · PDF · Images</b><span>Multi-format workflow</span></div></div>
        <div className="metric"><div className="metric-icon orange"><AlertTriangle size={20}/></div><div><small>SCREENING</small><b>Safety keywords</b><span>Rule-based prototype</span></div></div>
        <div className="metric"><div className="metric-icon green"><ShieldCheck size={20}/></div><div><small>OUTPUT</small><b>Findings & actions</b><span>Human review required</span></div></div>
      </section>
      <div className="content-grid">
        <section className="panel input-panel">
          <div className="panel-heading"><div><span className="eyebrow">ANALYSIS WORKBENCH</span><h2>Analyze site information</h2></div><span className="step">STEP 01</span></div>
          <div className="tabs"><button className={tab==='text'?'selected':''} onClick={()=>{setTab('text');setResult(null);setError('')}}><FileText size={16}/> Text notes</button><button className={tab==='file'?'selected':''} onClick={()=>{setTab('file');setResult(null);setError('')}}><Upload size={16}/> Upload file</button></div>
          {tab==='text' ? <><label htmlFor="notes">SITE NOTES / OBSERVATIONS</label><textarea id="notes" value={text} onChange={e=>setText(e.target.value)} placeholder="Paste site notes, observations, or report text here..."/><div className="helper">Try terms such as scaffolding, PPE, exposed wire, debris, excavation or hot work.</div></> :
          <><label>PROJECT DOCUMENT OR IMAGE</label><div className={`dropzone ${drag?'drag':''}`} onDragOver={e=>{e.preventDefault();setDrag(true)}} onDragLeave={()=>setDrag(false)} onDrop={e=>{e.preventDefault();setDrag(false);setFile(e.dataTransfer.files?.[0]||null)}}><input id="file" type="file" accept=".txt,.md,.pdf,.png,.jpg,.jpeg,.webp" onChange={e=>setFile(e.target.files?.[0]||null)}/><label htmlFor="file" className="upload-icon"><Upload size={23}/></label><b>{file?file.name:'Drop a file here or browse'}</b><span>PDF, TXT, MD, PNG, JPG or WEBP · Max 10 MB</span><small>PDF text extraction and optional image OCR supported</small></div></>}
          {error && <div className="error"><AlertTriangle size={17}/>{error}</div>}
          <button className="primary" onClick={analyze} disabled={busy}>{busy?<><LoaderCircle className="spin" size={18}/> Analyzing...</>:<><Search size={18}/> Run preliminary analysis <ArrowRight size={17}/></>}</button>
          <p className="privacy-note"><Info size={14}/> Prototype analysis only. Do not upload confidential or sensitive site documents.</p>
        </section>
        <section className="panel results-panel">
          <div className="panel-heading"><div><span className="eyebrow">ANALYSIS OUTPUT</span><h2>Findings & recommendations</h2></div><span className="step">STEP 02</span></div>
          {!result ? <div className="empty"><div className="empty-art"><Search size={30}/></div><h3>Your results will appear here</h3><p>Run an analysis to see detected topics, evidence snippets, and suggested follow-up actions.</p><div className="empty-list"><span><CheckCircle2 size={15}/> Topic-based screening</span><span><CheckCircle2 size={15}/> Prioritized review cues</span><span><CheckCircle2 size={15}/> Recommended next steps</span></div></div> :
          <div className="results">
            <div className="result-summary"><div className="summary-icon"><Activity size={20}/></div><div><b>Analysis complete</b><p>{result.summary}</p></div></div>
            {result.file_name && <div className="file-tag"><FileText size={15}/>{result.file_name} · {result.file_type}</div>}
            <div className="finding-title">DETECTED TOPICS <span>{result.findings?.length || 0}</span></div>
            {result.findings?.map((f,i)=><article className="finding" key={i}><div className="finding-top"><div className={`severity ${severityClass(f.severity)}`}>{f.severity==='High'?<AlertTriangle size={14}/>:f.severity==='Info'?<Info size={14}/>:<ShieldCheck size={14}/>} {f.severity}</div><b>{f.category}</b></div><div className="evidence"><small>EVIDENCE</small><p>{f.evidence}</p></div><div className="recommendation"><CheckCircle2 size={16}/><p>{f.recommendation}</p></div></article>)}
            {result.extracted_text_preview && <details className="extracted"><summary>View extracted text preview</summary><p>{result.extracted_text_preview}</p></details>}
            <div className="disclaimer"><Info size={15}/>{result.disclaimer}</div>
          </div>}
        </section>
      </div>
      <footer>BUILDSENSE · MULTIMODAL CONSTRUCTION INTELLIGENCE PLATFORM <span>DEMO PROTOTYPE v1.0</span></footer>
    </main>
  </div>
}
createRoot(document.getElementById('root')).render(<App/>);
