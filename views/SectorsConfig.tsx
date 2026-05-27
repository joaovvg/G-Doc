
import React, { useState } from 'react';
import { Sector, OrganizationalUnit } from '../types';

interface SectorsConfigProps {
  sectors: Sector[];
  units: OrganizationalUnit[];
  currentUnitId: string;
  canManageAllUnits: boolean;
  onSave: (s: Sector) => void;
  onDelete: (id: string) => void;
}

const SectorsConfig: React.FC<SectorsConfigProps> = ({ sectors, units, currentUnitId, canManageAllUnits, onSave, onDelete }) => {
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<Sector | null>(null);
  const [name, setName] = useState('');
  const [selectedUnitId, setSelectedUnitId] = useState(currentUnitId);

  const handleEdit = (s: Sector) => {
    setEditingItem(s);
    setName(s.name);
    setSelectedUnitId(s.unitId);
    setShowModal(true);
  };

  const handleNew = () => {
    setEditingItem(null);
    setName('');
    setSelectedUnitId(currentUnitId);
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ 
      id: editingItem?.id || '', 
      name, 
      unitId: selectedUnitId 
    });
    setShowModal(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 uppercase tracking-tighter italic">Setores Registrados</h1>
          <p className="text-slate-500 font-medium italic">Listando apenas setores da unidade: <span className="text-indigo-600 font-black uppercase">{units.find(u => u.id === currentUnitId)?.name}</span></p>
        </div>
        <button onClick={handleNew} className="bg-indigo-600 hover:bg-black text-white px-6 py-3 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-indigo-100 transition flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4" /></svg>
          Novo Setor
        </button>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden text-black">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>
              <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Nome do Setor Operacional</th>
              <th className="px-6 py-5 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Ações Disponíveis</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {sectors.map(s => (
              <tr key={s.id} className="hover:bg-indigo-50/30 transition group">
                <td className="px-6 py-5">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-400 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                    </div>
                    <p className="text-slate-800 font-black uppercase text-sm">{s.name}</p>
                  </div>
                </td>
                <td className="px-6 py-5 text-right flex justify-end gap-3">
                   <button onClick={() => handleEdit(s)} className="text-indigo-600 hover:text-black text-[10px] font-black uppercase tracking-widest bg-indigo-50 px-4 py-2 rounded-xl transition">Editar</button>
                   <button onClick={() => { if(confirm("Excluir este setor permanentemente?")) onDelete(s.id); }} className="p-2 text-red-300 hover:text-red-600 transition">
                     <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                   </button>
                </td>
              </tr>
            ))}
            {sectors.length === 0 && (
              <tr><td colSpan={2} className="px-6 py-20 text-center text-slate-400 italic font-bold text-sm uppercase tracking-tighter">Nenhum setor cadastrado nesta unidade organizacinal.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
           <div className="bg-white rounded-[40px] shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
             <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
                <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tighter italic">{editingItem ? 'Configurar Setor' : 'Novo Setor'}</h3>
                <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 transition text-2xl">✕</button>
             </div>
             <form onSubmit={handleSubmit} className="p-10 space-y-8">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">Identificação do Setor *</label>
                  <input required autoFocus value={name} onChange={(e) => setName(e.target.value)} className="w-full px-5 py-4 bg-slate-50 text-black border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 font-bold uppercase" placeholder="Ex: Protocolo Central" />
                </div>

                {canManageAllUnits ? (
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">Unidade Vinculada *</label>
                    <select 
                      required 
                      value={selectedUnitId} 
                      onChange={(e) => setSelectedUnitId(e.target.value)}
                      className="w-full px-5 py-4 bg-slate-50 text-black border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 font-bold"
                    >
                      {units.map(u => (
                        <option key={u.id} value={u.id}>{u.name}</option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div className="opacity-60">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">Unidade (Contexto Fixo)</label>
                    <div className="w-full px-5 py-4 bg-slate-100 text-slate-500 border border-slate-200 rounded-2xl font-black uppercase text-xs">
                      {units.find(u => u.id === currentUnitId)?.name}
                    </div>
                  </div>
                )}

                <div className="flex flex-col gap-3 pt-4 border-t border-slate-50">
                   <button type="submit" className="w-full bg-indigo-600 text-white py-5 rounded-2xl font-black uppercase text-sm tracking-widest shadow-xl shadow-indigo-100 transition transform hover:-translate-y-1 active:scale-95">Salvar Registro</button>
                   <button type="button" onClick={() => setShowModal(false)} className="w-full py-4 text-slate-400 font-black text-[10px] uppercase tracking-widest">Cancelar e Voltar</button>
                </div>
             </form>
           </div>
        </div>
      )}
    </div>
  );
};

export default SectorsConfig;
