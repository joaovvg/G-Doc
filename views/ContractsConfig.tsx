
import React, { useState } from 'react';
import { Contract } from '../types';

interface ContractsConfigProps {
  contracts: Contract[];
  onSave: (c: Omit<Contract, 'unitId'>) => void;
  onDelete: (id: string) => void;
}

const ContractsConfig: React.FC<ContractsConfigProps> = ({ contracts, onSave, onDelete }) => {
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<Contract | null>(null);
  const [formData, setFormData] = useState({ number: '', description: '' });

  const handleEdit = (c: Contract) => {
    setEditingItem(c);
    setFormData({ number: c.number, description: c.description });
    setShowModal(true);
  };

  const handleNew = () => {
    setEditingItem(null);
    setFormData({ number: '', description: '' });
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ id: editingItem?.id || '', ...formData });
    setShowModal(false);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-slate-800 uppercase tracking-tighter italic">Gestão de Contratos</h1>
          <p className="text-slate-500 font-medium italic">Instrumentos vigentes vinculados à unidade atual.</p>
        </div>
        <button onClick={handleNew} className="bg-indigo-600 hover:bg-black text-white px-8 py-4 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-indigo-100 transition flex items-center gap-3 transform hover:-translate-y-1">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3.5" d="M12 4v16m8-8H4" /></svg>
          Novo Contrato
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {contracts.map(c => (
          <div key={c.id} className="bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm hover:border-indigo-400 transition-all group flex flex-col justify-between">
             <div>
                <div className="flex items-center justify-between mb-4">
                   <h3 className="font-black text-indigo-600 uppercase tracking-widest text-sm">Nº {c.number}</h3>
                   <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
                </div>
                <p className="text-slate-700 font-bold text-sm leading-relaxed line-clamp-3 mb-6 uppercase italic">"{c.description}"</p>
             </div>
             <div className="flex gap-2 pt-6 border-t border-slate-50">
                <button onClick={() => handleEdit(c)} className="flex-1 bg-slate-50 hover:bg-indigo-600 text-slate-600 hover:text-white px-4 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all">Editar Dados</button>
                <button onClick={() => { if(confirm("Remover este contrato permanentemente?")) onDelete(c.id); }} className="p-3 text-red-300 hover:text-red-600 transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
             </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-4">
           <div className="bg-white rounded-[48px] shadow-2xl w-full max-w-xl overflow-hidden animate-in zoom-in-95 duration-200">
             <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
                <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tighter italic">{editingItem ? 'Editar Contrato' : 'Novo Contrato'}</h3>
                <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 transition text-2xl">✕</button>
             </div>
             <form onSubmit={handleSubmit} className="p-10 space-y-8">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">Número do Instrumento *</label>
                  <input required autoFocus value={formData.number} onChange={(e) => setFormData({ ...formData, number: e.target.value })} className="w-full px-5 py-4 bg-slate-50 text-black border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 font-bold uppercase" placeholder="ex: 123/2024" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">Objeto do Contrato / Descrição *</label>
                  <textarea required rows={4} value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="w-full px-5 py-4 bg-slate-50 text-black border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 font-bold uppercase" placeholder="Descrição completa do objeto..." />
                </div>
                <div className="flex flex-col gap-3 pt-4 border-t border-slate-50">
                   <button type="submit" className="w-full bg-indigo-600 text-white py-5 rounded-2xl font-black uppercase text-sm tracking-widest shadow-xl shadow-indigo-100 transition transform hover:-translate-y-1 active:scale-95">Confirmar Registro</button>
                   <button type="button" onClick={() => setShowModal(false)} className="w-full py-4 text-slate-400 font-black text-[10px] uppercase tracking-widest">Descartar</button>
                </div>
             </form>
           </div>
        </div>
      )}
    </div>
  );
};

export default ContractsConfig;
