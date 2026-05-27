import React, { useState } from 'react';
import { User, Sector, OrganizationalUnit, Profile, AccessLevelConfig } from '../types';
import { formatCPF } from '../utils';

interface UsersConfigProps {
  users: User[];
  sectors: Sector[];
  units: OrganizationalUnit[];
  profiles: Profile[];
  accessLevels: AccessLevelConfig[];
  onSave: (user: User) => void;
  onDelete: (id: string) => void;
}

const UsersConfig: React.FC<UsersConfigProps> = ({ users, sectors, units, profiles, accessLevels, onSave, onDelete }) => {
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState<Omit<User, 'id'>>({
    cpf: '',
    name: '',
    email: '',
    phone: '',
    password: '',
    assignments: [],
    authorizedAccessLevelIds: []
  });
  const [newAssign, setNewAssign] = useState({ unitId: '', sectorId: '', profileId: '' });

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setFormData({
      cpf: user.cpf,
      name: user.name,
      email: user.email || '',
      phone: user.phone || '',
      password: user.password || '',
      assignments: user.assignments,
      authorizedAccessLevelIds: user.authorizedAccessLevelIds || []
    });
    setShowModal(true);
  };

  const handleNew = () => {
    setEditingUser(null);
    setFormData({
      cpf: '',
      name: '',
      email: '',
      phone: '',
      password: '',
      assignments: [],
      authorizedAccessLevelIds: accessLevels.length > 0 ? [accessLevels[0].id] : []
    });
    setNewAssign({ unitId: '', sectorId: '', profileId: '' });
    setShowModal(true);
  };

  const addAssignment = () => {
    if (!newAssign.unitId || !newAssign.sectorId || !newAssign.profileId) return;
    const exists = formData.assignments.some(a => a.sectorId === newAssign.sectorId && a.unitId === newAssign.unitId);
    if (exists) {
      alert('Usuario ja possui perfil neste setor da unidade selecionada.');
      return;
    }
    setFormData(prev => ({ ...prev, assignments: [...prev.assignments, { ...newAssign }] }));
    setNewAssign({ ...newAssign, sectorId: '', profileId: '' });
  };

  const removeAssignment = (unitId: string, sectorId: string) => {
    setFormData(prev => ({
      ...prev,
      assignments: prev.assignments.filter(a => !(a.unitId === unitId && a.sectorId === sectorId))
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.cpf.length < 14) {
      alert('Informe um CPF valido completo.');
      return;
    }
    if (!formData.name.trim()) {
      alert('Informe o nome completo do usuario.');
      return;
    }
    if (!(formData.email || '').trim()) {
      alert('Informe o e-mail do usuario.');
      return;
    }
    if (!(formData.password || '').trim()) {
      alert('Informe a senha de acesso do usuario.');
      return;
    }
    if (formData.assignments.length === 0) {
      alert('Vincule pelo menos um acesso (lotacao) para o usuario.');
      return;
    }
    onSave({ ...formData, id: editingUser?.id || '' } as User);
    setShowModal(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Colaboradores da Unidade</h1>
          <p className="text-slate-500 font-medium italic">Gerencie acessos e perfis dos usuarios vinculados a este ambiente.</p>
        </div>
        <button onClick={handleNew} className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-bold shadow-lg transition hover:bg-indigo-700">Novo Usuario</button>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {users.map(user => (
          <div key={user.id} className="rounded-2xl border border-slate-200 bg-white p-6 text-black shadow-sm transition hover:shadow-md">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-50 font-black text-indigo-600">
                {user.name.charAt(0)}
              </div>
              <div>
                <h3 className="truncate text-sm font-bold uppercase tracking-tight text-slate-800">{user.name}</h3>
                <p className="font-mono text-[10px] font-bold uppercase text-slate-400">{user.cpf}</p>
                <p className="truncate text-[10px] font-semibold text-slate-500">{user.email}</p>
              </div>
            </div>

            <div className="custom-scrollbar mb-6 h-28 space-y-2 overflow-y-auto pr-1">
              {user.assignments.map((assignment, idx) => (
                <div key={idx} className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="mb-0.5 block truncate text-[9px] font-black uppercase text-indigo-500">
                        {units.find(unit => unit.id === assignment.unitId)?.name || 'Unidade nao encontrada'}
                      </span>
                      <span className="text-[10px] font-bold uppercase text-slate-700">
                        {sectors.find(sector => sector.id === assignment.sectorId)?.name || 'Setor nao encontrado'}
                      </span>
                    </div>
                    <span className="rounded bg-slate-200 px-2 py-1 text-[9px] font-black uppercase text-slate-700 shadow-sm">
                      {profiles.find(profile => profile.id === assignment.profileId)?.name || 'Perfil'}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <button onClick={() => handleEdit(user)} className="flex-1 rounded-xl bg-indigo-600 py-2 text-xs font-bold uppercase tracking-widest text-white shadow-md transition hover:bg-black">
                Configurar Acesso
              </button>
              <button onClick={() => { if (confirm('Deseja excluir este usuario?')) onDelete(user.id); }} className="p-2 text-red-300 transition hover:text-red-500">
                x
              </button>
            </div>
          </div>
        ))}

        {users.length === 0 && (
          <div className="col-span-full py-20 text-center font-medium italic text-slate-400">
            Nenhum usuario vinculado a esta unidade organizacional.
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="flex max-h-[95vh] w-full max-w-3xl flex-col overflow-hidden rounded-[2rem] bg-white shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 bg-white p-8">
              <h3 className="text-xl font-black uppercase tracking-tighter italic text-slate-800">
                {editingUser ? 'CONFIGURAR COLABORADOR' : 'NOVO COLABORADOR'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-2xl text-slate-400 transition hover:text-slate-600">
                x
              </button>
            </div>

            <form onSubmit={handleSubmit} className="custom-scrollbar space-y-10 overflow-y-auto p-10 text-black">
              <section className="grid grid-cols-1 gap-8 md:grid-cols-2">
                <div className="md:col-span-2">
                  <h4 className="mb-4 flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.2em] text-indigo-600">
                    <div className="h-1 w-4 rounded-full bg-indigo-600"></div>
                    IDENTIFICACAO
                  </h4>
                </div>

                <div>
                  <label className="mb-2 ml-1 block text-[10px] font-black uppercase tracking-widest text-slate-400">CPF (LOGIN PRINCIPAL) *</label>
                  <input
                    required
                    value={formData.cpf}
                    onChange={e => setFormData({ ...formData, cpf: formatCPF(e.target.value) })}
                    maxLength={14}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-3.5 font-bold text-slate-700 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50"
                    placeholder="000.000.000-00"
                  />
                </div>

                <div>
                  <label className="mb-2 ml-1 block text-[10px] font-black uppercase tracking-widest text-slate-400">NOME COMPLETO *</label>
                  <input
                    required
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-3.5 font-bold uppercase text-slate-700 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50"
                    placeholder="NOME DO COLABORADOR"
                  />
                </div>

                <div>
                  <label className="mb-2 ml-1 block text-[10px] font-black uppercase tracking-widest text-slate-400">E-MAIL *</label>
                  <input
                    required
                    type="email"
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-3.5 font-bold text-slate-700 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50"
                    placeholder="usuario@empresa.com"
                  />
                </div>

                <div>
                  <label className="mb-2 ml-1 block text-[10px] font-black uppercase tracking-widest text-slate-400">TELEFONE</label>
                  <input
                    value={formData.phone || ''}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-3.5 font-bold text-slate-700 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50"
                    placeholder="(00) 00000-0000"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="mb-2 ml-1 block text-[10px] font-black uppercase tracking-widest text-slate-400">SENHA DE ACESSO *</label>
                  <input
                    required
                    type="password"
                    value={formData.password}
                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-3.5 font-bold text-slate-700 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50"
                    placeholder="........"
                  />
                </div>
              </section>

              <section>
                <h4 className="mb-4 flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.2em] text-indigo-600">
                  <div className="h-1 w-4 rounded-full bg-indigo-600"></div>
                  LOTACAO E VINCULOS (SETOR + PERFIL)
                </h4>

                <div className="space-y-6 rounded-[2rem] border border-slate-200 bg-slate-50/50 p-8">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <div>
                      <label className="mb-2 block text-[9px] font-black uppercase text-slate-400">1. UNIDADE</label>
                      <select
                        value={newAssign.unitId}
                        onChange={e => setNewAssign({ ...newAssign, unitId: e.target.value, sectorId: '', profileId: '' })}
                        className="w-full rounded-xl border bg-white px-4 py-3 text-[11px] font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="">Selecione...</option>
                        {units.map(unit => (
                          <option key={unit.id} value={unit.id}>{unit.name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="mb-2 block text-[9px] font-black uppercase text-slate-400">2. SETOR</label>
                      <select
                        value={newAssign.sectorId}
                        disabled={!newAssign.unitId}
                        onChange={e => setNewAssign({ ...newAssign, sectorId: e.target.value })}
                        className="w-full rounded-xl border bg-white px-4 py-3 text-[11px] font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
                      >
                        <option value="">Selecione...</option>
                        {sectors.filter(sector => sector.unitId === newAssign.unitId).map(sector => (
                          <option key={sector.id} value={sector.id}>{sector.name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="mb-2 block text-[9px] font-black uppercase text-slate-400">3. PERFIL</label>
                      <select
                        value={newAssign.profileId}
                        disabled={!newAssign.unitId}
                        onChange={e => setNewAssign({ ...newAssign, profileId: e.target.value })}
                        className="w-full rounded-xl border bg-white px-4 py-3 text-[11px] font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
                      >
                        <option value="">Selecione...</option>
                        {profiles.filter(profile => profile.unitId === newAssign.unitId).map(profile => (
                          <option key={profile.id} value={profile.id}>{profile.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <button type="button" onClick={addAssignment} className="w-full rounded-2xl bg-indigo-600 py-4 text-[11px] font-black uppercase tracking-[0.2em] text-white shadow-lg shadow-indigo-100 transition hover:bg-black">
                    VINCULAR ACESSO
                  </button>
                </div>

                <div className="mt-8 space-y-3">
                  {formData.assignments.map((assignment, idx) => (
                    <div key={idx} className="group flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:shadow-md">
                      <div className="flex flex-col">
                        <span className="mb-1 text-[10px] font-black uppercase tracking-widest text-indigo-600">
                          {units.find(unit => unit.id === assignment.unitId)?.name}
                        </span>
                        <span className="text-xs font-bold uppercase text-slate-800">
                          {sectors.find(sector => sector.id === assignment.sectorId)?.name}
                        </span>
                      </div>

                      <div className="flex items-center gap-6">
                        <span className="rounded-xl border border-slate-200 bg-slate-100 px-4 py-2 text-[10px] font-black uppercase tracking-tighter text-slate-700">
                          {profiles.find(profile => profile.id === assignment.profileId)?.name}
                        </span>
                        <button type="button" onClick={() => removeAssignment(assignment.unitId, assignment.sectorId)} className="text-red-300 opacity-0 transition group-hover:opacity-100 hover:text-red-600">
                          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <div className="flex items-center justify-center gap-6 border-t border-slate-100 pt-10">
                <button type="button" onClick={() => setShowModal(false)} className="text-[11px] font-black uppercase tracking-widest text-slate-400 transition-colors hover:text-slate-800">
                  CANCELAR
                </button>
                <button type="submit" className="rounded-2xl bg-indigo-600 px-20 py-4 text-[12px] font-black uppercase tracking-[0.2em] text-white shadow-2xl shadow-indigo-100 transition-all hover:bg-black active:scale-95">
                  SALVAR COLABORADOR
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsersConfig;
