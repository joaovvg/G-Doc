
import React, { useState, useRef, useEffect } from 'react';
import { CoverTemplate } from '../types';

interface CoverTemplateConfigProps {
  templates: CoverTemplate[];
  onSave: (t: Omit<CoverTemplate, 'unitId'>) => void;
  onDelete: (id: string) => void;
}

const FONT_FAMILIES = [
  { name: 'Arial', value: 'Arial, sans-serif' },
  { name: 'Times New Roman', value: 'Times New Roman, serif' },
  { name: 'Courier New', value: 'Courier New, monospace' },
  { name: 'Verdana', value: 'Verdana, sans-serif' },
  { name: 'Georgia', value: 'Georgia, serif' },
  { name: 'Trebuchet MS', value: 'Trebuchet MS, sans-serif' },
];

const FONT_SIZES = [
  { label: 'PP', value: '1' },
  { label: 'P', value: '2' },
  { label: 'N', value: '3' },
  { label: 'M', value: '4' },
  { label: 'G', value: '5' },
  { label: 'GG', value: '6' },
  { label: 'T', value: '7' },
];

const CoverTemplateConfig: React.FC<CoverTemplateConfigProps> = ({ templates, onSave, onDelete }) => {
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<CoverTemplate | null>(null);
  const [title, setTitle] = useState('');
  const [isActive, setIsActive] = useState(true);
  const editorRef = useRef<HTMLDivElement>(null);

  const execCommand = (command: string, value: string = '') => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        execCommand('insertImage', ev.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const insertTag = (tag: string) => {
    // Inserindo tag como span não editável para evitar que o usuário quebre o padrão {{...}}
    execCommand('insertHTML', `<span class="tag-atom bg-indigo-50 text-indigo-700 px-1 rounded font-black border border-indigo-200" contenteditable="false" style="user-select: all;">${tag}</span>&nbsp;`);
  };

  const handleEdit = (t: CoverTemplate) => {
    setEditingItem(t);
    setTitle(t.name);
    setIsActive(t.isActive);
    setShowModal(true);
    setTimeout(() => {
      if (editorRef.current) {
        editorRef.current.innerHTML = t.content || '';
      }
    }, 50);
  };

  const handleNew = () => {
    setEditingItem(null);
    setTitle('');
    setIsActive(true);
    setShowModal(true);
    setTimeout(() => {
      if (editorRef.current) {
        editorRef.current.innerHTML = '';
      }
    }, 50);
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!title.trim()) {
      alert("Por favor, identifique este modelo com um título.");
      return;
    }
    const content = editorRef.current?.innerHTML || '';
    onSave({ 
      id: editingItem?.id || '', 
      name: title, 
      content, 
      isActive 
    } as CoverTemplate);
    setShowModal(false);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-slate-800 uppercase tracking-tighter italic">Modelos de Capa</h1>
          <p className="text-slate-500 font-medium italic">Editor visual A4 para folhas de rosto personalizadas.</p>
        </div>
        <button onClick={handleNew} className="bg-indigo-600 hover:bg-black text-white px-8 py-4 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl transition-all transform hover:-translate-y-1">
          Criar Novo Layout
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {templates.map(t => (
          <div key={t.id} className={`bg-white p-8 rounded-[40px] border-2 transition-all ${t.isActive ? 'border-indigo-600 shadow-xl' : 'border-slate-100 shadow-sm hover:border-indigo-200'}`}>
            <div className="flex justify-between items-start mb-4">
               <div>
                  <h3 className="font-black text-slate-800 uppercase text-lg tracking-tighter truncate max-w-[180px]">{t.name}</h3>
                  {t.isActive && <span className="text-[8px] font-black text-white uppercase tracking-widest bg-indigo-600 px-2 py-0.5 rounded-full mt-1 inline-block">Modelo Ativo</span>}
               </div>
               <div className="flex gap-1">
                  <button onClick={() => handleEdit(t)} className="p-2 text-slate-400 hover:text-indigo-600 transition-colors"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg></button>
                  <button onClick={() => { if(confirm("Deseja realmente remover este modelo?")) onDelete(t.id); }} className="p-2 text-red-200 hover:text-red-600 transition-colors"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
               </div>
            </div>
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 h-32 overflow-hidden relative opacity-60">
               <div dangerouslySetInnerHTML={{ __html: t.content }} className="text-[5px] transform scale-75 origin-top-left font-serif" />
               <div className="absolute inset-0 bg-gradient-to-t from-slate-50 to-transparent"></div>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-xl z-[100] flex flex-col animate-in fade-in duration-300">
           <div className="h-20 bg-white border-b border-slate-200 px-8 flex items-center justify-between shrink-0 shadow-sm z-50">
              <div className="flex items-center gap-6 flex-1 max-w-3xl">
                <button onClick={() => setShowModal(false)} className="p-2 text-slate-400 hover:text-slate-900 transition">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" /></svg>
                </button>
                <div className="h-8 w-px bg-slate-100" />
                <div className="flex-1">
                  <input 
                    required 
                    value={title} 
                    onChange={(e) => setTitle(e.target.value)} 
                    className="w-full bg-transparent text-xl font-black text-slate-800 outline-none placeholder:text-slate-300 uppercase tracking-tighter" 
                    placeholder="Título do Layout (ex: Capa de Pagamento de Fornecedor)" 
                  />
                  <p className="text-[9px] font-black text-indigo-500 uppercase tracking-widest mt-0.5 italic">Ambiente Criativo de Capas Administrativas</p>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                 <div className="flex items-center gap-2 mr-4 group cursor-pointer" onClick={() => setIsActive(!isActive)}>
                    <input type="checkbox" checked={isActive} readOnly className="w-5 h-5 accent-indigo-600 cursor-pointer rounded-lg" />
                    <label className="text-[10px] font-black text-slate-400 group-hover:text-slate-600 uppercase tracking-widest cursor-pointer transition-colors">Padrão da Unidade</label>
                 </div>
                 <button onClick={() => handleSubmit()} className="bg-indigo-600 hover:bg-black text-white px-10 py-3 rounded-xl font-black uppercase text-[11px] tracking-[0.2em] shadow-xl transition-all transform hover:-translate-y-0.5">
                   Confirmar Design
                 </button>
              </div>
           </div>

           <div className="bg-slate-50 border-b border-slate-200 px-8 py-3 flex flex-wrap gap-4 items-center shrink-0 shadow-inner sticky top-0 z-40">
              <div className="flex items-center gap-1 bg-white p-1 rounded-xl shadow-sm border border-slate-200">
                 <select onChange={(e) => execCommand('fontName', e.target.value)} className="bg-transparent px-3 py-1.5 text-xs font-bold text-slate-700 outline-none border-r border-slate-100">
                    <option value="">Fonte...</option>
                    {FONT_FAMILIES.map(f => <option key={f.value} value={f.value}>{f.name}</option>)}
                 </select>
                 <select onChange={(e) => execCommand('fontSize', e.target.value)} className="bg-transparent px-3 py-1.5 text-xs font-bold text-slate-700 outline-none">
                    <option value="">Tamanho...</option>
                    {FONT_SIZES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                 </select>
              </div>

              <div className="flex bg-white p-1 rounded-xl shadow-sm border border-slate-200">
                 <button type="button" onClick={() => execCommand('bold')} className="p-2 hover:bg-indigo-50 text-slate-700 border-r border-slate-100 transition rounded-l-lg" title="Negrito"><b>B</b></button>
                 <button type="button" onClick={() => execCommand('italic')} className="p-2 hover:bg-indigo-50 text-slate-700 border-r border-slate-100 transition" title="Itálico"><i>I</i></button>
                 <button type="button" onClick={() => execCommand('underline')} className="p-2 hover:bg-indigo-50 text-slate-700 transition rounded-r-lg" title="Sublinhado"><u>U</u></button>
              </div>

              <div className="flex bg-white p-1 rounded-xl shadow-sm border border-slate-200">
                 <button type="button" onClick={() => execCommand('justifyLeft')} className="p-2 hover:bg-indigo-50 text-slate-700 border-r border-slate-100 transition rounded-l-lg"><Icon path="M4 6h16M4 12h10M4 18h16" /></button>
                 <button type="button" onClick={() => execCommand('justifyCenter')} className="p-2 hover:bg-indigo-50 text-slate-700 border-r border-slate-100 transition"><Icon path="M4 6h16M7 12h10M4 18h16" /></button>
                 <button type="button" onClick={() => execCommand('justifyRight')} className="p-2 hover:bg-indigo-50 text-slate-700 transition rounded-r-lg"><Icon path="M4 6h16M10 12h10M4 18h16" /></button>
              </div>

              <div className="flex items-center gap-3 bg-white p-1 px-3 rounded-xl shadow-sm border border-slate-200">
                 <label htmlFor="mfc" className="text-[9px] font-black text-slate-400 uppercase tracking-widest cursor-pointer">Cor:</label>
                 <input id="mfc" type="color" onChange={(e) => execCommand('foreColor', e.target.value)} className="w-8 h-8 rounded-lg cursor-pointer border-none bg-transparent" />
              </div>

              <label className="bg-white hover:bg-indigo-50 border border-slate-200 p-1 px-4 rounded-xl shadow-sm cursor-pointer transition flex items-center gap-2">
                 <Icon path="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                 <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">Imagem</span>
                 <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
              </label>

              <div className="h-8 w-px bg-slate-200 mx-2" />
              
              <div className="flex flex-wrap gap-1.5">
                 <span className="text-[9px] text-slate-400 font-black uppercase tracking-widest mr-1">Tags Dinâmicas:</span>
                 {['{{NUP}}', '{{INTERESSADO}}', '{{ASSUNTO}}', '{{DATA}}', '{{SETOR}}', '{{CLASSIFICACAO}}'].map(tag => (
                   <button key={tag} type="button" onClick={() => insertTag(tag)} className="px-3 py-1.5 bg-indigo-600 text-white text-[9px] font-black rounded-lg hover:bg-black transition-all shadow-md shadow-indigo-100 transform active:scale-95">{tag}</button>
                 ))}
              </div>
           </div>

           <div className="flex-1 overflow-y-auto bg-slate-200 p-12 custom-scrollbar flex justify-center">
              <div 
                ref={editorRef}
                contentEditable
                className="bg-white w-[794px] min-h-[1123px] p-24 shadow-2xl outline-none text-black ring-1 ring-slate-300 font-serif leading-relaxed"
              />
           </div>

           <div className="h-10 bg-white border-t border-slate-200 px-8 flex items-center text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em] justify-center">
              Canvas de Edição A4 • 210mm x 297mm • GDOC Engine
           </div>
        </div>
      )}

      <style>{`
        [contenteditable] img { max-width: 100%; height: auto; display: block; margin: 15px auto; border: 1px solid #eee; }
        [contenteditable]:empty:before {
          content: 'Desenhe o modelo de capa aqui... use as Tags Dinâmicas para preenchimento automático de dados do processo.';
          color: #cbd5e1;
          font-style: italic;
        }
        .tag-atom { cursor: default; }
      `}</style>
    </div>
  );
};

const Icon = ({ path }: { path: string }) => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={path} /></svg>
);

export default CoverTemplateConfig;
