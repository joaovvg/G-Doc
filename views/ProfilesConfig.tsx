
import React, { useState } from 'react';
import { Profile, Permission, OrganizationalUnit } from '../types';

interface ProfilesConfigProps {
  profiles: Profile[];
  units: OrganizationalUnit[];
  currentUnitId: string;
  canManageAllUnits: boolean;
  onSave: (p: Profile) => void;
  onDelete: (id: string) => void;
}

const ProfilesConfig: React.FC<ProfilesConfigProps> = ({ profiles, units, currentUnitId, canManageAllUnits, onSave, onDelete }) => {
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<Profile | null>(null);
  const [formData, setFormData] = useState<Omit<Profile, 'id' | 'unitId'>>({
    name: '',
    permissions: []
  });
  const [selectedUnitId, setSelectedUnitId] = useState(currentUnitId);

  const allPermissions: { id: Permission; label: string; group: string }[] = [
    // GERAL
    { id: 'view_dashboard', label: 'Ver Dashboard', group: 'Geral' },
    { id: 'view_files', label: 'Ver Arquivos', group: 'Geral' },
    
    // DOCUMENTOS
    { id: 'doc_view', label: 'Ver Documentos (Próprio Setor)', group: 'Documentos' },
    { id: 'doc_view_all_sectors', label: 'Ver Documentos de outros setores', group: 'Documentos' },
    { id: 'doc_create', label: 'Criar Documento', group: 'Documentos' },
    { id: 'doc_edit', label: 'Editar Documento', group: 'Documentos' },
    { id: 'doc_tramitar', label: 'Tramitar Documento', group: 'Documentos' },
    { id: 'doc_arquivar', label: 'Arquivar Documento', group: 'Documentos' },
    { id: 'doc_anexar', label: 'Anexar Peças em Documento', group: 'Documentos' },
    { id: 'doc_autuar', label: 'Autuar Documento em Processo', group: 'Documentos' },
    
    // PROCESSOS
    { id: 'proc_view', label: 'Ver Processos (Próprio Setor)', group: 'Processos' },
    { id: 'proc_view_all_sectors', label: 'Ver Processos de outros setores', group: 'Processos' },
    { id: 'proc_create', label: 'Abrir Processo', group: 'Processos' },
    { id: 'proc_edit', label: 'Editar Processo', group: 'Processos' },
    { id: 'proc_tramitar', label: 'Tramitar Processo', group: 'Processos' },
    { id: 'proc_arquivar', label: 'Arquivar Processo', group: 'Processos' },
    { id: 'proc_capa', label: 'Gerar Capa de Processo', group: 'Processos' },
    { id: 'proc_annex', label: 'Vincular Processo (Anexar/Apensar)', group: 'Processos' },
    { id: 'proc_unannex', label: 'Desanexação', group: 'Processos' },
    { id: 'doc_unannex_others', label: 'Desanexar Documentos de Outros', group: 'Processos' },
    { id: 'proc_unannex_others', label: 'Desanexar Processos de Outros', group: 'Processos' },
    { id: 'archive_manage', label: 'Arquivar e Desarquivar', group: 'Processos' },
    
    // ADMINISTRAÇÃO
    { id: 'access_settings', label: 'Acesso ao Painel Administrativo', group: 'Administração' },
    { id: 'set_units', label: 'Gerenciar Unidades', group: 'Administração' },
    { id: 'set_users', label: 'Gerenciar Usuários', group: 'Administração' },
    { id: 'set_profiles', label: 'Gerenciar Perfis', group: 'Administração' },
    { id: 'set_sectors', label: 'Configurar Setores', group: 'Administração' },
    { id: 'set_sectors_all_units', label: 'Vincular Setores entre Unidades', group: 'Administração' },
    { id: 'set_doctypes', label: 'Tipos de Documento', group: 'Administração' },
    { id: 'set_classifications', label: 'Classificação Arquivística', group: 'Administração' },
    { id: 'set_covers', label: 'Modelos de Capa', group: 'Administração' },
    { id: 'set_access_levels', label: 'Níveis de Sigilo', group: 'Administração' },
    { id: 'set_interested', label: 'Banco de Interessados', group: 'Administração' },
    { id: 'set_repository', label: 'Repositório Global de Arquivos', group: 'Administração' },
    { id: 'view_audit', label: 'Ver Relatórios de Auditoria', group: 'Administração' },
  ];

  const handleEdit = (p: Profile) => {
    setEditingItem(p);
    setFormData({ name: p.name, permissions: p.permissions });
    setSelectedUnitId(p.unitId);
    setShowModal(true);
  };

  const handleNew = () => {
    setEditingItem(null);
    setFormData({ name: '', permissions: [] });
    setSelectedUnitId(currentUnitId);
    setShowModal(true);
  };

  const togglePermission = (perm: Permission) => {
    const current = formData.permissions;
    if (current.includes(perm)) {
      setFormData({ ...formData, permissions: current.filter(p => p !== perm) });
    } else {
      setFormData({ ...formData, permissions: [...current, perm] });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;
    
    onSave({
      ...formData,
      id: editingItem?.id || '',
      unitId: selectedUnitId
    });
    setShowModal(false);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-slate-800 uppercase tracking-tighter italic">Perfis de Acesso</h1>
          <p className="text-slate-500 font-medium italic mt-1">Definição granular de permissões na unidade: <span className="text-indigo-600 font-black uppercase">{units.find(u => u.id === currentUnitId)?.name}</span></p>
        </div>
        <button onClick={handleNew} className="bg-indigo-600 hover:bg-black text-white px-8 py-4 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-indigo-100 transition flex items-center gap-3 transform hover:-translate-y-1">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3.5" d="M12 4v16m8-8H4" /></svg>
          Novo Perfil
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {profiles.map(p => (
          <div key={p.id} className="bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm flex flex-col justify-between group hover:border-indigo-400 hover:shadow-2xl transition-all duration-300">
            <div>
              <div className="flex items-center justify-between mb-6">
                 <h3 className="font-black text-slate-800 text-xl uppercase tracking-tighter italic truncate pr-4">{p.name}</h3>
                 <div className="w-3 h-3 rounded-full bg-indigo-600 shadow-sm shadow-indigo-200"></div>
              </div>
              <div className="flex flex-wrap gap-2">
                <span className="text-[10px] bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-xl font-black uppercase tracking-widest border border-indigo-100">
                  {p.permissions.length} Privilégios
                </span>
              </div>
            </div>
            <div className="flex gap-2 pt-8 mt-8 border-t border-slate-50">
              <button onClick={() => handleEdit(p)} className="flex-1 bg-slate-50 hover:bg-indigo-600 text-slate-600 hover:text-white px-4 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all">Configurar</button>
              <button onClick={() => { if(confirm("Excluir este perfil permanentemente?")) onDelete(p.id); }} className="p-3 text-red-300 hover:text-red-600 transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
              </button>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-4 text-black">
          <div className="bg-white rounded-[48px] shadow-2xl w-full max-w-5xl overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-300">
            <div className="p-10 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
              <h3 className="text-3xl font-black text-slate-800 uppercase tracking-tighter italic">{editingItem ? 'Editar Permissões' : 'Criar Perfil de Acesso'}</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 transition text-3xl font-light">✕</button>
            </div>
            <div className="p-10 space-y-10 overflow-y-auto custom-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">Denominação do Perfil *</label>
                  <input required autoFocus value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full px-6 py-4 bg-slate-50 text-black border border-slate-200 rounded-[20px] outline-none focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 font-bold uppercase" placeholder="Ex: Analista de Protocolo" />
                </div>
                <div className={!canManageAllUnits ? "opacity-60 pointer-events-none" : ""}>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">Unidade Responsável</label>
                  <select required value={selectedUnitId} onChange={(e) => setSelectedUnitId(e.target.value)} className="w-full px-6 py-4 bg-slate-100 text-black border border-slate-200 rounded-[20px] outline-none font-bold">
                    {units.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                  </select>
                </div>
              </div>

              <div className="space-y-12">
                {['Geral', 'Documentos', 'Processos', 'Administração'].map(group => (
                  <div key={group}>
                    <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-3 mb-6">
                      <div className="w-4 h-1 bg-indigo-600 rounded-full shadow-[0_0_8px_rgba(79,70,229,0.4)]"></div>
                      Privilégios de {group}
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {allPermissions.filter(p => p.group === group).map(perm => (
                        <div key={perm.id} onClick={() => togglePermission(perm.id)} className={`flex items-center justify-between p-5 rounded-[24px] cursor-pointer transition-all duration-300 border select-none ${formData.permissions.includes(perm.id) ? 'bg-indigo-600 border-indigo-600 shadow-lg shadow-indigo-100' : 'bg-slate-50 border-slate-100 hover:border-indigo-300'}`}>
                          <span className={`text-[11px] font-black uppercase tracking-tight leading-tight ${formData.permissions.includes(perm.id) ? 'text-white' : 'text-slate-600'}`}>{perm.label}</span>
                          <div className={`w-10 h-5 rounded-full relative transition-colors shrink-0 ml-4 ${formData.permissions.includes(perm.id) ? 'bg-white/20 shadow-inner' : 'bg-slate-300'}`}>
                            <div className={`absolute top-0.5 w-4 h-4 rounded-full shadow transition-transform transform ${formData.permissions.includes(perm.id) ? 'translate-x-5 bg-white' : 'translate-x-0.5 bg-white'}`}></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="p-10 border-t border-slate-50 bg-slate-50/50 flex justify-end gap-4">
              <button onClick={() => setShowModal(false)} className="px-8 py-4 text-slate-400 font-black uppercase text-[10px] tracking-widest hover:text-slate-800 transition-colors">Descartar</button>
              <button onClick={handleSubmit} className="bg-indigo-600 text-white px-16 py-4 rounded-2xl font-black uppercase text-xs tracking-widest shadow-2xl shadow-indigo-100 hover:bg-black transition-all transform active:scale-95">
                Salvar Perfil
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfilesConfig;

