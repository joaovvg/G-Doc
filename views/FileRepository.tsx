
import React, { useMemo, useState } from 'react';
import { Document } from '../types';

interface FileRepositoryProps {
  documents: Document[];
  onNavigateToDoc: (id: string) => void;
}

const FileRepository: React.FC<FileRepositoryProps> = ({ documents, onNavigateToDoc }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const allFiles = useMemo(() => {
    const list: { id: string; docId: string; nup: string; name: string; content: string; type: 'Peça Principal' | 'Anexo' }[] = [];
    
    documents.forEach(doc => {
      if (doc.fileContent && doc.fileName) {
        list.push({ id: `main-${doc.id}`, docId: doc.id, nup: doc.nup, name: doc.fileName, content: doc.fileContent, type: 'Peça Principal' });
      }
      (doc.attachments || []).forEach((att, idx) => {
        list.push({ id: `att-${doc.id}-${idx}`, docId: doc.id, nup: doc.nup, name: att.name, content: att.content, type: 'Anexo' });
      });
    });

    return list.filter(f => f.name.toLowerCase().includes(searchTerm.toLowerCase()) || f.nup.includes(searchTerm));
  }, [documents, searchTerm]);

  const calculateSize = (base64: string) => {
    const bytes = (base64.length * 3) / 4;
    if (bytes < 1024) return `${bytes.toFixed(0)} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  };

  const openFile = (content: string, name: string) => {
    const newWindow = window.open();
    if (newWindow) {
      newWindow.document.title = name;
      newWindow.document.body.style.margin = "0";
      newWindow.document.body.innerHTML = `<iframe src="${content}" width="100%" height="100%" style="border:none;"></iframe>`;
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-black text-slate-800 uppercase tracking-tighter italic">Centro de Arquivos Digitais</h1>
        <p className="text-slate-500 font-medium italic">Visão global de todos os PDFs persistidos no Banco de Dados do sistema.</p>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
        <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
        </div>
        <input 
          type="text" 
          value={searchTerm} 
          onChange={e => setSearchTerm(e.target.value)}
          placeholder="Pesquisar por nome do arquivo ou NUP do documento..." 
          className="flex-1 bg-transparent outline-none text-slate-700 font-medium"
        />
        <div className="px-4 py-1.5 bg-indigo-50 rounded-full text-[10px] font-black text-indigo-600 uppercase tracking-widest">
           {allFiles.length} Arquivos
        </div>
      </div>

      <div className="bg-white rounded-[40px] border border-slate-200 shadow-sm overflow-hidden text-black">
        <table className="w-full text-left">
           <thead className="bg-slate-50 border-b border-slate-100">
             <tr>
               <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Arquivo</th>
               <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Origem (NUP)</th>
               <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Tamanho</th>
               <th className="px-8 py-5 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Ações</th>
             </tr>
           </thead>
           <tbody className="divide-y divide-slate-50">
             {allFiles.map(file => (
               <tr key={file.id} className="hover:bg-indigo-50/30 transition group">
                 <td className="px-8 py-5">
                    <div className="flex items-center gap-3">
                       <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-red-500">
                          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M7 2a2 2 0 00-2 2v16a2 2 0 002 2h10a2 2 0 002-2V8l-6-6H7zm6 7V3.5L18.5 9H13z" /></svg>
                       </div>
                       <div>
                          <p className="text-sm font-black text-slate-800 uppercase tracking-tight truncate max-w-xs">{file.name}</p>
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{file.type}</p>
                       </div>
                    </div>
                 </td>
                 <td className="px-8 py-5">
                    <span className="text-xs font-black text-indigo-600 bg-indigo-50 px-3 py-1 rounded-lg">{file.nup} (Documento)</span>
                 </td>
                 <td className="px-8 py-5 text-center">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">{calculateSize(file.content)}</span>
                 </td>
                 <td className="px-8 py-5 text-right">
                    <div className="flex justify-end gap-2">
                       <button onClick={() => openFile(file.content, file.name)} className="text-blue-600 hover:text-black font-black uppercase text-[10px] tracking-widest bg-blue-50 px-4 py-2 rounded-xl transition">Abrir</button>
                       <button onClick={() => onNavigateToDoc(file.docId)} className="text-slate-400 hover:text-indigo-600 font-black uppercase text-[10px] tracking-widest bg-slate-50 px-4 py-2 rounded-xl transition">Ir para Doc</button>
                    </div>
                 </td>
               </tr>
             ))}
             {allFiles.length === 0 && (
               <tr><td colSpan={4} className="px-8 py-20 text-center text-slate-400 italic uppercase font-bold text-sm tracking-tighter">Nenhum arquivo persistido encontrado.</td></tr>
             )}
           </tbody>
        </table>
      </div>
    </div>
  );
};

export default FileRepository;
