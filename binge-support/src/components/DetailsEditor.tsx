'use client';
import { useState, useRef } from 'react';

type Props = { initial?: string|null; onSave: (md: string) => Promise<void>|void; onCancel?: () => void; };

export default function DetailsEditor({ initial, onSave, onCancel }: Props) {
  const [value, setValue] = useState(initial ?? '');
  const taRef = useRef<HTMLTextAreaElement|null>(null);

  function insert(before: string, after='') {
    const el = taRef.current; if (!el) return;
    const { selectionStart:s, selectionEnd:e, value:v } = el;
    const sel = v.slice(s, e);
    const next = v.slice(0, s) + before + sel + after + v.slice(e);
    setValue(next);
    requestAnimationFrame(() => { const pos = s + before.length + sel.length + after.length; el.selectionStart = el.selectionEnd = pos; el.focus(); });
  }

  return (
    <div style={{ border:'1px solid #e4e7ec', borderRadius:10, padding:12, background:'#fafafa' }}>
      <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:8 }}>
        <Mini onClick={() => insert('## ')}>H2</Mini>
        <Mini onClick={() => insert('### ')}>H3</Mini>
        <Mini onClick={() => insert('**','**')}><b>B</b></Mini>
        <Mini onClick={() => insert('_','_')}><i>I</i></Mini>
        <Mini onClick={() => insert('- ')}>• List</Mini>
        <Mini onClick={() => insert('- [ ] ')}>☐ Todo</Mini>
        <Mini onClick={() => insert('> ')}>Quote</Mini>
        <Mini onClick={() => insert('---\n')}>HR</Mini>
      </div>
      <textarea
        ref={taRef}
        rows={8}
        placeholder="소제목/핵심/링크 등을 Markdown으로…"
        value={value}
        onChange={(e)=>setValue(e.target.value)}
        style={{ width:'100%', borderRadius:8, border:'1px solid #e5e7eb', padding:'10px 12px', fontSize:14, resize:'vertical', background:'#fff' }}
      />
      <div style={{ display:'flex', gap:8, justifyContent:'flex-end', marginTop:8 }}>
        {onCancel && <button className="btn-ghost" onClick={onCancel}>취소</button>}
        <button className="btn" onClick={()=>onSave(value.trim())}>저장</button>
      </div>
    </div>
  );
}

function Mini({ onClick, children }:{ onClick:()=>void; children:React.ReactNode }) {
  return <button type="button" onClick={onClick} style={{ border:'1px solid #d9e0d9', background:'#fff', borderRadius:9999, padding:'4px 10px', fontSize:12, cursor:'pointer' }}>{children}</button>;
}