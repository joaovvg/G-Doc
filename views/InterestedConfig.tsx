
import React, { useState } from 'react';
import { Interested } from '../types';
import { formatCPF, formatCNPJ } from '../utils';

interface InterestedConfigProps {
  interested: Interested[];
  onSave: (i: Omit<Interested, 'unitId'>) => void;
  onDelete: (id: string) => void;
}

const InterestedConfig: React.FC<InterestedConfigProps> = ({ interested, onSave, onDelete }) => {
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<Interested | null>(null);
  const [formData, setFormData] = useState<Omit<Interested, 'id' | 'unitId'>>({
    type: 'Pessoa',
    name: '',
    identifier: '',
    email: '',
    password: ''
  });

  const handleIdentifierChange = (val: string) => {
    const formatted = formData.type === 'Pessoa' ? formatCPF(val) : formatCNPJ(val);
    setFormData({ ...formData, identifier: formatted });
  };

  const handleTypeChange = (type: 'Pessoa' | 'Empresa') => {
    setFormData({ ...formData, type, identifier: '' });
  };

  const handleEdit = (i: Interested) => {
    setEditingItem(i);
    setFormData({ type: i.type, name: i.name, identifier: i.identifier, email: i.email || '', password: i.password || '' });
    setShowModal(true);
  };

  const handleNew = () => {
    setEditingItem(null);
    setFormData({ type: 'Pessoa', name: '', identifier: '', email: '', password: '' });
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validação de Duplicidade
    const isDuplicate = interested.some(i => i.identifier === formData.identifier && i.id !== editingItem?.id);
    if (isDuplicate) {
      alert(`Erro: Já existe um interessado cadastrado com este ${formData.type === 'Pessoa' ? 'CPF' : 'CNPJ'}.`);
      return;
    }

    const minLength = formData.type === 'Pessoa' ? 14 : 18;
    if (formData.identifier.length < minLength) {
      alert(`O ${formData.type === 'Pessoa' ? 'CPF' : 'CNPJ'} informado está incompleto.`);
      return;
    }
    
    onSave({ ...formData, id: editingItem?.id || '' });
    setShowModal(false);
  };

  return (
    <div className="space-y-6">
       <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Gestão de Interessados</h1>
          <p className="text-slate-500">Pessoas e Empresas vinculadas a documentos e processos.</p>
        </div>
        <button onClick={handleNew} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-bold shadow-lg shadow-blue-100 transition flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
          Novo Interessado
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {interested.map(i => (
          <div key={i.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition text-black">
             <div className="flex items-center gap-3 mb-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold ${i.type === 'Pessoa' ? 'bg-indigo-500' : 'bg-amber-500'}`}>
                   {i.type === 'Pessoa' ? <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg> : <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>}
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 leading-tight">{i.name}</h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{i.type}</p>
                </div>
             </div>
             <div className="text-xs text-black mb-6 font-medium bg-slate-50 p-2 rounded-lg border border-slate-100">
               {i.type === 'Pessoa' ? 'CPF' : 'CNPJ'}: <span className="font-mono text-blue-700">{i.identifier}</span>
             </div>
             <div className="flex gap-2 pt-4 border-t border-slate-50">
                <button onClick={() => handleEdit(i)} className="flex-1 px-3 py-2 bg-slate-50 hover:bg-blue-50 text-slate-600 hover:text-blue-600 rounded-lg text-sm font-bold transition flex items-center justify-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                  Editar
                </button>
                <button onClick={() => { if(confirm("Deseja excluir este interessado?")) onDelete(i.id); }} className="p-2 text-red-400 hover:text-red-600 transition">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
             </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
           <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
             <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <h3 className="text-xl font-bold text-slate-800">{editingItem ? 'Editar Interessado' : 'Novo Interessado'}</h3>
                <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 transition">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
             </div>
             <form onSubmit={handleSubmit} className="p-8 space-y-6 text-black">
                <div>
                   <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Tipo de Cadastro</label>
                   <div className="flex gap-4 p-1 bg-slate-100 rounded-xl">
                      <button 
                        type="button" 
                        onClick={() => handleTypeChange('Pessoa')}
                        className={`flex-1 py-2 rounded-lg text-sm font-bold transition ${formData.type === 'Pessoa' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}
                      >Física (CPF)</button>
                      <button 
                        type="button" 
                        onClick={() => handleTypeChange('Empresa')}
                        className={`flex-1 py-2 rounded-lg text-sm font-bold transition ${formData.type === 'Empresa' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}
                      >Jurídica (CNPJ)</button>
                   </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Nome Completo / Razão Social</label>
                  <input required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full px-4 py-2 bg-white text-black border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-normal" placeholder="Digite o nome..." />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">{formData.type === 'Pessoa' ? 'CPF' : 'CNPJ'} *</label>
                  <input 
                    required 
                    value={formData.identifier} 
                    onChange={(e) => handleIdentifierChange(e.target.value)} 
                    maxLength={formData.type === 'Pessoa' ? 14 : 18}
                    className="w-full px-4 py-2 bg-white text-black border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-mono font-normal" 
                    placeholder={formData.type === 'Pessoa' ? '000.000.000-00' : '00.000.000/0000-00'}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">E-mail</label>
                  <input value={formData.email || ''} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="w-full px-4 py-2 bg-white text-black border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-normal" placeholder="email@dominio.com" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Senha</label>
                  <input type="password" value={formData.password || ''} onChange={(e) => setFormData({ ...formData, password: e.target.value })} className="w-full px-4 py-2 bg-white text-black border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-normal" placeholder="Defina uma senha" />
                </div>
                <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
                   <button type="button" onClick={() => setShowModal(false)} className="px-6 py-2 text-slate-500 font-bold">Cancelar</button>
                   <button type="submit" className="bg-blue-600 text-white px-8 py-2 rounded-xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-100 transition">Salvar Dados</button>
                </div>
             </form>
           </div>
        </div>
      )}
    </div>
  );
};

export default InterestedConfig;
