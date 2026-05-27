
import React, { useState } from 'react';
import { AccessLevelConfig, User } from '../types';

interface AccessLevelsConfigProps {
  accessLevels: AccessLevelConfig[];
  users: User[]; // Necessário para listar quem pode ter acesso
  onSave: (al: Omit<AccessLevelConfig, 'unitId'>, authorizedUserIds: string[]) => void;
  onDelete: (id: string) => void;
}

const AccessLevelsConfig: React.FC<AccessLevelsConfigProps> = ({ accessLevels, users, onSave, onDelete }) => {
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<AccessLevelConfig | null>(null);
  const [formData, setFormData] = useState({ name: '', color: '#3b82f6' });
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);

  const handleEdit = (al: AccessLevelConfig) => {
    setEditingItem(al);
    setFormData({ name: al.name, color: al.color });
    // Descobre quais usuários já possuem esse nível autorizado
    const authorized = users.filter(u => u.authorizedAccessLevelIds?.includes(al.id)).map(u => u.id);
    setSelectedUserIds(authorized);
    setShowModal(true);
  };

  const handleNew = () => {
    setEditingItem(null);
    setFormData({ name: '', color: '#3b82f6' });
    setSelectedUserIds([]);
    setShowModal(true);
  };

  const toggleUserSelection = (userId: string) => {
    setSelectedUserIds(prev => 
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ id: editingItem?.id || '', ...formData }, selectedUserIds);
    setShowModal(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Níveis de Acesso</h1>
          <p className="text-slate-500">Configure quem pode visualizar documentos por categoria de sigilo.</p>
        </div>
        <button onClick={handleNew} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-bold shadow-lg transition">
          Novo Nível
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase">Descrição</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase">Identificador Visual</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase">Usuários Autorizados</th>
              <th className="px-6 py-4 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {accessLevels.map(al => {
              const authCount = users.filter(u => u.authorizedAccessLevelIds?.includes(al.id)).length;
              return (
                <tr key={al.id} className="hover:bg-slate-50 transition">
                  <td className="px-6 py-4 text-slate-700 font-bold">{al.name}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full" style={{ backgroundColor: al.color }}></div>
                      <span className="text-xs font-mono text-slate-400 uppercase">{al.color}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-[10px] font-black bg-slate-100 text-slate-500 px-2 py-1 rounded-full uppercase">
                      {authCount} Colaboradores
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right flex justify-end gap-3">
                     <button onClick={() => handleEdit(al)} className="text-blue-600 hover:underline text-sm font-bold">Editar / Usuários</button>
                     <button onClick={() => onDelete(al.id)} className="text-red-400 hover:text-red-600 transition">✕</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
           <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
             <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <h3 className="text-xl font-bold text-slate-800">{editingItem ? 'Configurar Nível e Usuários' : 'Novo Nível de Acesso'}</h3>
                <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 transition">✕</button>
             </div>
             <form onSubmit={handleSubmit} className="overflow-y-auto p-8 space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Nome do Nível</label>
                    <input required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full px-4 py-2 bg-white text-slate-900 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" placeholder="Ex: Confidencial" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Cor do Badge</label>
                    <div className="flex gap-4 items-center">
                      <input type="color" value={formData.color} onChange={(e) => setFormData({ ...formData, color: e.target.value })} className="w-12 h-12 rounded-lg cursor-pointer bg-transparent border-none" />
                      <div className="flex-1 px-4 py-2 bg-slate-50 rounded-xl text-sm font-mono text-slate-500 border border-slate-200">
                        {formData.color.toUpperCase()}
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                   <h4 className="text-xs font-black text-blue-600 uppercase tracking-widest mb-4 border-b pb-2">Usuários com autorização para este nível</h4>
                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                      {users.map(u => (
                        <label key={u.id} className={`flex items-center justify-between p-3 border rounded-2xl cursor-pointer transition ${selectedUserIds.includes(u.id) ? 'bg-blue-50 border-blue-200' : 'bg-white border-slate-100 hover:bg-slate-50'}`}>
                           <div className="flex flex-col">
                              <span className="text-sm font-bold text-slate-800">{u.name}</span>
                              <span className="text-[10px] text-slate-400 font-mono">{u.cpf}</span>
                           </div>
                           <input 
                            type="checkbox" 
                            checked={selectedUserIds.includes(u.id)} 
                            onChange={() => toggleUserSelection(u.id)}
                            className="w-5 h-5 rounded-lg accent-blue-600"
                           />
                        </label>
                      ))}
                   </div>
                </div>

                <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
                   <button type="button" onClick={() => setShowModal(false)} className="px-6 py-2 text-slate-500 font-bold">Cancelar</button>
                   <button type="submit" className="bg-blue-600 text-white px-8 py-2 rounded-xl font-bold transition hover:bg-blue-700 shadow-lg">Salvar Configurações</button>
                </div>
             </form>
           </div>
        </div>
      )}
    </div>
  );
};

export default AccessLevelsConfig;
