
import React from 'react';
import { Sector, User, Profile } from '../types';
import { MASTER_CPF } from '../constants';

interface SectorSelectProps {
  sectors: Sector[];
  user: User;
  activeUnitId: string;
  profiles: Profile[];
  onSelect: (sector: Sector) => void;
  onProvision: () => void;
}

const SectorSelect: React.FC<SectorSelectProps> = ({ sectors, user, activeUnitId, profiles, onSelect, onProvision }) => {
  const isAdmin = user.cpf === MASTER_CPF;

  // REGRA DE OURO: Somente setores vinculados explicitamente ao usuário nesta unidade.
  // Se o usuário não estiver vinculado em 'Administração > Usuários', a lista será vazia.
  const userAssignments = user.assignments.filter(a => a.unitId === activeUnitId);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6 animate-fade-in text-black">
      <div className="bg-white p-12 rounded-[48px] shadow-[0_32px_64px_rgba(0,0,0,0.05)] w-full max-w-xl border border-slate-100 flex flex-col items-center relative overflow-hidden">
        
        {/* Glow de fundo sutil */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-1 bg-gradient-to-r from-transparent via-indigo-500 to-transparent"></div>

        {/* Ícone Superior conforme imagem */}
        <div className="w-24 h-24 bg-indigo-50 rounded-[32px] flex items-center justify-center mb-10 border border-indigo-100/50 shadow-inner">
           <div className="w-12 h-3 bg-indigo-600 rounded-full shadow-sm"></div>
        </div>

        <div className="text-center mb-14">
           <h2 className="text-[36px] font-black text-slate-900 tracking-tighter uppercase mb-4 leading-none italic">Selecione o Setor</h2>
           <p className="text-slate-400 text-lg font-bold uppercase tracking-widest opacity-80">Identifique sua área de atuação para esta sessão.</p>
        </div>
        
        <div className="space-y-5 w-full max-h-[500px] overflow-y-auto pr-4 custom-scrollbar">
          {userAssignments.map(assign => {
            // Busca o setor no banco de dados que corresponde ao ID no vínculo do usuário
            const sector = sectors.find(s => s.id === assign.sectorId);
            const profile = profiles.find(p => p.id === assign.profileId);
            
            // Se o setor não existir mais no banco ou não pertencer a esta unidade, pula
            if (!sector || sector.unitId !== activeUnitId) return null;

            return (
              <button 
                key={`${assign.unitId}-${assign.sectorId}`} 
                onClick={() => onSelect(sector)} 
                className="w-full flex items-center justify-between p-8 bg-white hover:bg-slate-50 border border-slate-200 hover:border-indigo-500 rounded-[28px] transition-all duration-300 group text-left shadow-sm hover:shadow-xl hover:-translate-y-1 transform"
              >
                <div className="flex-1">
                  <span className="font-black text-slate-800 group-hover:text-indigo-600 block text-2xl tracking-tighter uppercase mb-1 transition-colors">{sector.name}</span>
                  <span className="text-[11px] text-slate-400 font-black uppercase tracking-[0.2em] group-hover:text-slate-500 transition-colors">
                    {profile?.name || 'Acesso Administrativo'}
                  </span>
                </div>
                <div className="h-14 w-14 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-inner ml-4">
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </button>
            );
          })}

          {userAssignments.length === 0 && (
            <div className="p-12 bg-rose-50 border-2 border-dashed border-rose-200 rounded-[40px] text-center w-full animate-in zoom-in-95 duration-500">
              <div className="w-20 h-20 bg-rose-100 rounded-full flex items-center justify-center text-rose-600 mx-auto mb-8 shadow-sm">
                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <p className="text-rose-900 font-black uppercase text-xl tracking-tighter mb-3 italic">Sem Vínculos Detectados</p>
              <p className="text-rose-600 text-xs font-black uppercase tracking-widest leading-relaxed px-6 opacity-80">
                Seu usuário não possui setores atribuídos em seu perfil nesta unidade organizacional. 
              </p>
              
              {isAdmin && (
                <button 
                  onClick={onProvision}
                  className="mt-10 w-full py-6 bg-indigo-600 text-white rounded-3xl font-black uppercase tracking-[0.2em] text-[11px] shadow-2xl shadow-indigo-100 hover:bg-black transition-all transform active:scale-95"
                >
                  Provisionar Setor de Protocolo
                </button>
              )}
            </div>
          )}
        </div>

        {/* Rodapé decorativo para fidelidade à imagem */}
        <div className="mt-16 opacity-30 text-[9px] font-black uppercase tracking-[0.4em] text-slate-300">GDOC Governance Engine</div>
      </div>
    </div>
  );
};

export default SectorSelect;
