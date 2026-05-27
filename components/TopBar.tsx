
import React, { useState, useEffect } from 'react';
import { User, Sector, OrganizationalUnit } from '../types';
import { DatabaseService } from '../lib/database';
import BrandMark from './BrandMark';

interface TopBarProps {
  user: User;
  activeSector: Sector;
  sectors: Sector[];
  units: OrganizationalUnit[];
  activeUnit: OrganizationalUnit;
  onLogout: () => void;
  onSwitchSector: (sector: Sector) => void;
  onSwitchUnit: (unit: OrganizationalUnit) => void;
  onNavigateToSettings: () => void;
}

const TopBar: React.FC<TopBarProps> = ({ user, activeSector, sectors, units, activeUnit, onLogout, onSwitchSector, onSwitchUnit, onNavigateToSettings }) => {
  const [showConfigMenu, setShowConfigMenu] = useState(false);
  const [dbStatus, setDbStatus] = useState<'connected' | 'offline' | 'error'>('offline');

  useEffect(() => {
    const checkDb = async () => {
      const test = await DatabaseService.testConnection();
      setDbStatus(test.success ? 'connected' : 'error');
    };
    checkDb();
    const interval = setInterval(checkDb, 30000); 
    return () => clearInterval(interval);
  }, []);

  const userUnitIds = Array.from(new Set(user.assignments.map(a => a.unitId)));
  const availableUnits = units.filter(u => userUnitIds.includes(u.id));
  
  const userSectorIdsInCurrentUnit = user.assignments
    .filter(a => a.unitId === activeUnit.id)
    .map(a => a.sectorId);
  const availableSectors = sectors.filter(s => userSectorIdsInCurrentUnit.includes(s.id));

  const avatarStyle = user.avatarColor ? { backgroundColor: user.avatarColor } : { backgroundColor: '#4f46e5' };

  return (
    <header className="bg-white border-b border-slate-200 h-24 flex items-center justify-between px-8 shrink-0 z-30 shadow-sm relative text-black">
      <div className="flex items-center gap-6">
         <BrandMark compact showWordmark={false} className="hidden xl:inline-flex" />
         <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-full border border-slate-100">
            <div className={`w-2 h-2 rounded-full animate-pulse ${dbStatus === 'connected' ? 'bg-green-50 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : dbStatus === 'error' ? 'bg-red-500' : 'bg-slate-300'}`}></div>
            <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">
               {dbStatus === 'connected' ? 'Conectado' : dbStatus === 'error' ? 'Erro de Banco' : 'Local'}
            </span>
         </div>
        <div className="hidden lg:flex items-center gap-2 text-indigo-600 bg-indigo-50 px-4 py-1.5 rounded-2xl border border-indigo-100">
           <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
           <span className="text-[10px] font-black uppercase tracking-widest truncate max-w-[200px]">{activeUnit.name}</span>
        </div>
      </div>

      <div className="flex items-center gap-6 relative">
        <button 
          onClick={() => setShowConfigMenu(!showConfigMenu)}
          className={`flex items-center gap-3 p-2 pr-4 rounded-3xl transition-all border ${showConfigMenu ? 'bg-indigo-50 border-indigo-200 shadow-inner' : 'hover:bg-slate-50 border-transparent'}`}
        >
          <div className="flex flex-col text-right hidden sm:flex">
            <span className="text-sm font-black text-slate-800 leading-none">{user.name}</span>
            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-1.5">{activeSector.name}</span>
          </div>
          <div 
            style={avatarStyle}
            className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white font-black border-2 border-white shadow-lg transform rotate-3 group-hover:rotate-0 transition-transform`}
          >
            {user.name.charAt(0)}
          </div>
          <svg className={`w-4 h-4 text-slate-300 transition-transform duration-300 ${showConfigMenu ? 'rotate-180 text-indigo-500' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {showConfigMenu && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setShowConfigMenu(false)}></div>
            <div className="absolute right-0 top-full mt-2 w-80 bg-white border border-slate-200 rounded-[32px] shadow-2xl z-50 py-6 overflow-hidden animate-in fade-in zoom-in-95 duration-200 origin-top-right border border-indigo-100">
              <div className="px-6 mb-4 flex justify-between items-center border-b border-slate-50 pb-3">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Sessão de Trabalho</h3>
                <button 
                  onClick={() => { onNavigateToSettings(); setShowConfigMenu(false); }}
                  className="text-[9px] font-black text-indigo-600 bg-indigo-50 px-2 py-1 rounded-lg hover:bg-indigo-600 hover:text-white transition-all uppercase tracking-widest"
                >
                  Perfil
                </button>
              </div>

              <div className="px-6 mb-6">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-[9px] font-black text-indigo-500 uppercase tracking-widest">Unidade</label>
                </div>
                <div className="space-y-1.5 max-h-40 overflow-y-auto custom-scrollbar pr-1">
                  {availableUnits.map(u => (
                    <button
                      key={u.id}
                      onClick={() => { onSwitchUnit(u); setShowConfigMenu(false); }}
                      className={`w-full text-left px-4 py-3 rounded-2xl text-xs font-bold transition-all flex items-center justify-between border ${u.id === activeUnit.id ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-100' : 'bg-slate-50 text-slate-600 border-slate-100 hover:border-indigo-200 hover:bg-white'}`}
                    >
                      <span className="truncate pr-2">{u.name}</span>
                      {u.id === activeUnit.id && <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>}
                    </button>
                  ))}
                </div>
              </div>

              <div className="px-6 mb-8">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-[9px] font-black text-blue-500 uppercase tracking-widest">Setor Ativo</label>
                </div>
                <div className="space-y-1.5 max-h-40 overflow-y-auto custom-scrollbar pr-1">
                  {availableSectors.map(s => (
                    <button
                      key={s.id}
                      onClick={() => { onSwitchSector(s); setShowConfigMenu(false); }}
                      className={`w-full text-left px-4 py-3 rounded-2xl text-xs font-bold transition-all flex items-center justify-between border ${s.id === activeSector.id ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-100' : 'bg-slate-50 text-slate-600 border-slate-100 hover:border-blue-200 hover:bg-white'}`}
                    >
                      <span className="truncate pr-2">{s.name}</span>
                      {s.id === activeSector.id && <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>}
                    </button>
                  ))}
                </div>
              </div>

              <div className="px-4 pt-4 border-t border-slate-50">
                <button
                  onClick={onLogout}
                  className="w-full flex items-center gap-3 px-6 py-4 text-sm text-red-600 hover:bg-red-50 rounded-[24px] font-black uppercase tracking-widest text-[10px] transition-all group"
                >
                  <div className="w-8 h-8 rounded-xl bg-red-100 flex items-center justify-center group-hover:bg-red-600 group-hover:text-white transition-colors shadow-sm">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                  </div>
                  Finalizar Sessão
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </header>
  );
};

export default TopBar;
