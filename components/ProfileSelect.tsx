
import React from 'react';
import { Profile } from '../types';

interface ProfileSelectProps {
  profiles: Profile[];
  onSelect: (profile: Profile) => void;
}

const ProfileSelect: React.FC<ProfileSelectProps> = ({ profiles, onSelect }) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="bg-white p-10 rounded-3xl shadow-2xl w-full max-w-xl border border-slate-100 animate-in fade-in zoom-in-95 duration-300">
        <div className="text-center mb-10">
           <div className="w-16 h-16 bg-indigo-100 rounded-2xl mx-auto mb-4 flex items-center justify-center text-indigo-600">
             <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
           </div>
           <h2 className="text-3xl font-black text-slate-800 tracking-tighter uppercase">Perfil de Acesso</h2>
           <p className="text-slate-500 font-medium mt-2">Como você deseja atuar na sessão de hoje?</p>
        </div>
        
        <div className="space-y-4">
          {profiles.map(profile => (
            <button key={profile.id} onClick={() => onSelect(profile)} className="w-full flex items-center justify-between p-6 bg-white hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 rounded-2xl transition group text-left">
              <div>
                <span className="font-black text-slate-700 group-hover:text-indigo-700 block text-lg tracking-tight uppercase">{profile.name}</span>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{profile.permissions.length} Permissões Habilitadas</span>
              </div>
              <div className="h-12 w-12 rounded-xl bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-sm">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
              </div>
            </button>
          ))}

          {profiles.length === 0 && (
            <div className="p-8 bg-red-50 border border-red-200 rounded-2xl text-center">
              <p className="text-red-700 font-bold">Nenhum perfil disponível.</p>
              <p className="text-red-600 text-xs mt-1">Verifique com seu administrador as permissões para esta unidade.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfileSelect;
