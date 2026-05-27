
import React, { useState } from 'react';
import { User } from '../types';
import { DatabaseService } from '../lib/database';

interface PersonalSettingsProps {
  user: User;
  onUpdateUser: (updated: User) => Promise<boolean>;
}

const AVATAR_COLORS = [
  '#4f46e5', // Indigo
  '#2563eb', // Blue
  '#0891b2', // Cyan
  '#059669', // Emerald
  '#ca8a04', // Yellow
  '#dc2626', // Red
  '#9333ea', // Purple
  '#db2777', // Pink
  '#475569', // Slate
  '#1e1b4b', // Indigo 950
];

const PersonalSettings: React.FC<PersonalSettingsProps> = ({ user, onUpdateUser }) => {
  const [formData, setFormData] = useState({
    name: user.name,
    email: user.email || '',
    phone: user.phone || '',
    avatarColor: user.avatarColor || AVATAR_COLORS[0],
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage(null);

    if (formData.newPassword) {
      if (formData.currentPassword !== user.password) {
        setMessage({ type: 'error', text: 'Sua chave de acesso atual está incorreta.' });
        setIsSaving(false);
        return;
      }
      if (formData.newPassword !== formData.confirmPassword) {
        setMessage({ type: 'error', text: 'A nova chave e a confirmação não conferem.' });
        setIsSaving(false);
        return;
      }
      if (formData.newPassword.length < 4) {
        setMessage({ type: 'error', text: 'A nova chave deve ter pelo menos 4 caracteres.' });
        setIsSaving(false);
        return;
      }
    }

    const updatedUser: User = {
      ...user,
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      avatarColor: formData.avatarColor,
      password: formData.newPassword || user.password
    };

    const success = await onUpdateUser(updatedUser);
    if (success) {
      setMessage({ type: 'success', text: 'Perfil atualizado com sucesso!' });
      setFormData(prev => ({ ...prev, currentPassword: '', newPassword: '', confirmPassword: '' }));
    } else {
      setMessage({ type: 'error', text: 'Erro ao salvar alterações no servidor.' });
    }
    setIsSaving(false);
  };

  const handleClearCache = () => {
    if (confirm("Isso irá limpar os dados salvos localmente e recarregar o sistema da nuvem. Você precisará fazer login novamente. Continuar?")) {
      DatabaseService.clearLocalCache();
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in duration-500 text-black">
      <div>
        <h1 className="text-3xl font-black text-slate-800 uppercase tracking-tighter italic">Minha Conta</h1>
        <p className="text-slate-500 font-medium italic">Gerencie sua identidade visual e segurança de acesso.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <section className="bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm overflow-hidden relative group">
          <h2 className="text-xs font-black text-indigo-600 uppercase tracking-[0.2em] mb-8 flex items-center gap-3">
             <div className="w-4 h-1 bg-indigo-600 rounded-full"></div>
             Identidade Visual (Avatar)
          </h2>
          <div className="flex flex-col md:flex-row items-center gap-10">
             <div 
               style={{ backgroundColor: formData.avatarColor }}
               className="w-32 h-32 rounded-[40px] flex items-center justify-center text-white text-5xl font-black shadow-2xl transform rotate-3 border-4 border-white"
             >
               {formData.name.charAt(0)}
             </div>
             <div className="flex-1">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Escolha a cor do seu identificador:</p>
                <div className="grid grid-cols-5 gap-3">
                  {AVATAR_COLORS.map(color => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setFormData({ ...formData, avatarColor: color })}
                      style={{ backgroundColor: color }}
                      className={`w-10 h-10 rounded-xl transition-all border-4 ${formData.avatarColor === color ? 'border-indigo-100 scale-110 shadow-lg' : 'border-transparent hover:scale-105'}`}
                    />
                  ))}
                </div>
             </div>
          </div>
        </section>

        <section className="bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm">
           <h2 className="text-xs font-black text-indigo-600 uppercase tracking-[0.2em] mb-8 flex items-center gap-3">
             <div className="w-4 h-1 bg-indigo-600 rounded-full"></div>
             Dados Cadastrais
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <div className="md:col-span-2">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Nome de Exibição *</label>
                <input required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-50 font-normal uppercase text-sm text-black" />
             </div>
             <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">E-mail Corporativo</label>
                <input type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-50 font-normal text-sm text-black" placeholder="usuario@gdoc.com.br" />
             </div>
             <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Telefone / Ramal</label>
                <input value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-50 font-normal text-sm text-black" placeholder="(00) 00000-0000" />
             </div>
          </div>
        </section>

        <section className="bg-slate-900 p-8 rounded-[40px] border border-slate-800 shadow-xl text-white">
           <h2 className="text-xs font-black text-indigo-400 uppercase tracking-[0.2em] mb-8 flex items-center gap-3">
             <div className="w-4 h-1 bg-indigo-400 rounded-full"></div>
             Segurança e Chave de Acesso
          </h2>
          <div className="space-y-6">
             <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Chave de Acesso Atual</label>
                <input type="password" value={formData.currentPassword} onChange={e => setFormData({ ...formData, currentPassword: e.target.value })} className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/20 font-normal" placeholder="Digite sua chave atual para mudar" />
             </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Nova Chave de Acesso</label>
                  <input type="password" value={formData.newPassword} onChange={e => setFormData({ ...formData, newPassword: e.target.value })} className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/20 font-normal" placeholder="Mínimo 4 caracteres" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Confirmar Nova Chave</label>
                  <input type="password" value={formData.confirmPassword} onChange={e => setFormData({ ...formData, confirmPassword: e.target.value })} className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/20 font-normal" />
                </div>
             </div>
          </div>
        </section>

        <section className="bg-red-50 p-8 rounded-[40px] border border-red-100 shadow-sm">
           <h2 className="text-xs font-black text-red-600 uppercase tracking-[0.2em] mb-4 flex items-center gap-3">
             <div className="w-4 h-1 bg-red-600 rounded-full"></div>
             Manutenção de Dados
          </h2>
          <p className="text-xs text-red-700 font-medium mb-6">Use esta opção se o sistema parecer desatualizado ou se houver erros de sincronização com o servidor.</p>
          <button 
            type="button" 
            onClick={handleClearCache}
            className="w-full py-4 border-2 border-red-200 text-red-600 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-red-600 hover:text-white transition-all"
          >
            Limpar Cache Local e Recarregar
          </button>
        </section>

        {message && (
          <div className={`p-5 rounded-3xl text-sm font-bold animate-in zoom-in-95 ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'}`}>
            {message.text}
          </div>
        )}

        <div className="flex justify-end pt-4 pb-12">
           <button 
             type="submit" 
             disabled={isSaving}
             className="w-full md:w-auto px-16 py-5 bg-indigo-600 hover:bg-black text-white rounded-3xl font-black uppercase text-sm tracking-widest shadow-2xl shadow-indigo-200 transition-all transform hover:-translate-y-1 active:scale-95 disabled:opacity-50"
           >
             {isSaving ? 'Salvando Alterações...' : 'Confirmar Atualizações'}
           </button>
        </div>
      </form>
    </div>
  );
};

export default PersonalSettings;
