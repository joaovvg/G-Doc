
import React, { useState } from 'react';
import { DocType } from '../types';

interface DocTypesConfigProps {
  docTypes: DocType[];
  onSave: (dt: Omit<DocType, 'unitId'>) => void;
}

const DocTypesConfig: React.FC<DocTypesConfigProps> = ({ docTypes, onSave }) => {
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<DocType | null>(null);
  const [name, setName] = useState('');

  const handleEdit = (dt: DocType) => {
    setEditingItem(dt);
    setName(dt.name);
    setShowModal(true);
  };

  const handleNew = () => {
    setEditingItem(null);
    setName('');
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ id: editingItem?.id || '', name });
    setShowModal(false);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-slate-800 uppercase tracking-tighter italic">Tipos de Documento</h1>
          <p className="text-slate-500 font-medium italic">Modelos de expedientes autorizados para esta unidade.</p>
        </div>
        <button onClick={handleNew} className="bg-indigo-600 hover:bg-black text-white px-8 py-4 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-indigo-100 transition flex items-center gap-3 transform hover:-translate-y-1">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3.5" d="M12 4v16m8-8H4" /></svg>
          Novo Tipo
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {docTypes.map(dt => (
          <div key={dt.id} className="bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm hover:border-indigo-400 transition-all group">
             <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-all">
                   <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414a1 1 0 00-.707-.293H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                </div>
                <h3 className="font-black text-slate-800 uppercase tracking-tight text-lg">{dt.name}</h3>
             </div>
             <div className="flex gap-2 pt-4 border-t border-slate-50">
                <button onClick={() => handleEdit(dt)} className="flex-1 bg-slate-50 hover:bg-indigo-600 text-slate-600 hover:text-white px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">Configurar</button>
             </div>
          </div>
        ))}
        {docTypes.length === 0 && (
          <div className="col-span-full py-20 text-center text-slate-400 italic font-bold uppercase tracking-tighter">Nenhum tipo de documento cadastrado.</div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-4">
           <div className="bg-white rounded-[40px] shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
             <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
                <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tighter italic">{editingItem ? 'Editar Tipo' : 'Novo Tipo'}</h3>
                <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 transition text-2xl">✕</button>
             </div>
             <form onSubmit={handleSubmit} className="p-10 space-y-8">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">Nome do Documento *</label>
                  <input required autoFocus value={name} onChange={(e) => setName(e.target.value)} className="w-full px-5 py-4 bg-slate-50 text-black border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 font-bold uppercase" placeholder="Ex: Ofício Externo" />
                </div>
                <div className="flex flex-col gap-3 pt-4 border-t border-slate-50">
                   <button type="submit" className="w-full bg-indigo-600 text-white py-5 rounded-2xl font-black uppercase text-sm tracking-widest shadow-xl shadow-indigo-100 transition transform hover:-translate-y-1 active:scale-95">Salvar Modelo</button>
                   <button type="button" onClick={() => setShowModal(false)} className="w-full py-4 text-slate-400 font-black text-[10px] uppercase tracking-widest">Cancelar</button>
                </div>
             </form>
           </div>
        </div>
      )}
    </div>
  );
};

export default DocTypesConfig;
