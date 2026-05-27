
import React, { useState } from 'react';
import { OrganizationalUnit } from '../types';
import { formatCNPJ } from '../utils';

interface OrganizationalUnitConfigProps {
  units: OrganizationalUnit[];
  onSave: (unit: OrganizationalUnit) => void;
  onDelete: (id: string) => void;
}

const OrganizationalUnitConfig: React.FC<OrganizationalUnitConfigProps> = ({ units, onSave, onDelete }) => {
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<OrganizationalUnit | null>(null);
  const [formData, setFormData] = useState<Omit<OrganizationalUnit, 'id'>>({
    name: '',
    cnpj: '',
    address: '',
    isPrimary: false
  });

  const handleEdit = (u: OrganizationalUnit) => {
    setEditingItem(u);
    setFormData({ name: u.name, cnpj: u.cnpj || '', address: u.address || '', isPrimary: u.isPrimary || false });
    setShowModal(true);
  };

  const handleNew = () => {
    setEditingItem(null);
    setFormData({ name: '', cnpj: '', address: '', isPrimary: false });
    setShowModal(true);
  };

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`TEM CERTEZA QUE DESEJA APAGAR A UNIDADE "${name.toUpperCase()}"? \n\nEsta ação é irreversível e pode afetar todos os usuários e documentos vinculados a ela.`)) {
      onDelete(id);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.cnpj && formData.cnpj.length < 18) {
      alert("Informe um CNPJ válido completo.");
      return;
    }
    onSave({ ...formData, id: editingItem?.id || '' } as OrganizationalUnit);
    setShowModal(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Unidades Organizacionais</h1>
          <p className="text-slate-500">Gerencie os estabelecimentos vinculados ao sistema.</p>
        </div>
        <button onClick={handleNew} className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg font-bold shadow-lg transition flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
          Nova Unidade
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {units.map(u => (
          <div key={u.id} className={`bg-white p-6 rounded-2xl border transition-all text-black ${u.isPrimary ? 'border-indigo-600 shadow-md ring-2 ring-indigo-50' : 'border-slate-200 shadow-sm hover:shadow-md'}`}>
            <div className="flex justify-between items-start mb-4">
               <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-slate-800 text-lg">{u.name}</h3>
                    {u.isPrimary && (
                      <span className="bg-indigo-600 text-white text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest">Principal</span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 font-mono mt-1">{u.cnpj || 'CNPJ não informado'}</p>
               </div>
               <div className="flex gap-2">
                  <button onClick={() => handleEdit(u)} className="text-slate-400 hover:text-indigo-600 transition">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                  </button>
                   {units.length > 1 && (
                    <button 
                      onClick={() => handleDelete(u.id, u.name)} 
                      className="w-10 h-10 rounded-xl bg-slate-50 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-all flex items-center justify-center group/del"
                      title="Excluir Unidade"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  )}
               </div>
            </div>
            <div className="text-xs text-slate-500 flex items-center gap-2">
               <svg className="w-4 h-4 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
               {u.address || 'Endereço não cadastrado'}
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
           <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
             <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <h3 className="text-xl font-bold text-slate-800 italic uppercase tracking-tight">{editingItem ? 'Configurar Unidade' : 'Nova Unidade'}</h3>
                <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 transition">✕</button>
             </div>
             <form onSubmit={handleSubmit} className="p-8 space-y-6">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Nome da Unidade *</label>
                  <input required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full px-4 py-2 bg-white text-black border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Ex: G-Doc MATRIZ" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">CNPJ</label>
                  <input 
                    value={formData.cnpj} 
                    onChange={(e) => setFormData({ ...formData, cnpj: formatCNPJ(e.target.value) })} 
                    maxLength={18} 
                    className="w-full px-4 py-2 bg-white text-black border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-mono" 
                    placeholder="00.000.000/0000-00" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Endereço Completo</label>
                  <textarea rows={2} value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} className="w-full px-4 py-2 bg-white text-black border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Rua, Número, Bairro, Cidade - UF" />
                </div>
                <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl border border-slate-100">
                   <input 
                    type="checkbox" 
                    id="is_primary_check" 
                    checked={formData.isPrimary} 
                    onChange={e => setFormData({...formData, isPrimary: e.target.checked})}
                    className="w-5 h-5 accent-indigo-600"
                   />
                   <label htmlFor="is_primary_check" className="text-xs font-bold text-slate-600 uppercase">Definir como Unidade Principal</label>
                </div>
                <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
                   <button type="button" onClick={() => setShowModal(false)} className="px-6 py-2 text-slate-500 font-bold">Cancelar</button>
                   <button type="submit" className="bg-indigo-600 text-white px-8 py-2 rounded-xl font-bold hover:bg-indigo-700 shadow-lg transition">Salvar Unidade</button>
                </div>
             </form>
           </div>
        </div>
      )}
    </div>
  );
};

export default OrganizationalUnitConfig;
