
import React from 'react';
import { OrganizationalUnit } from '../types';

interface UnitSelectProps {
  units: OrganizationalUnit[];
  onSelect: (unit: OrganizationalUnit) => void;
}

const UnitSelect: React.FC<UnitSelectProps> = ({ units, onSelect }) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 p-4">
      <div className="bg-white p-10 rounded-[40px] shadow-2xl w-full max-w-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-500">
        <div className="text-center mb-10">
           <div className="w-20 h-20 bg-indigo-600 rounded-3xl mx-auto mb-6 flex items-center justify-center text-white shadow-xl shadow-indigo-100 transform -rotate-3 hover:rotate-0 transition-transform duration-300">
             <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
             </svg>
           </div>
           <h2 className="text-4xl font-black text-slate-800 tracking-tighter uppercase italic">Selecionar Unidade</h2>
           <p className="text-slate-400 font-bold uppercase text-[10px] tracking-[0.2em] mt-3">Escolha o ambiente de trabalho para iniciar</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {units.map(unit => (
            <button 
              key={unit.id} 
              onClick={() => onSelect(unit)} 
              className="flex flex-col items-start p-7 bg-slate-50 hover:bg-white border-2 border-transparent hover:border-indigo-600 rounded-[32px] transition-all group text-left shadow-sm hover:shadow-2xl hover:scale-[1.02] transform duration-300"
            >
              <div className="flex items-center justify-between w-full mb-3">
                <span className="font-black text-slate-800 group-hover:text-indigo-600 block text-xl tracking-tight uppercase italic transition-colors">
                  {unit.name}
                </span>
                <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-slate-300 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-sm">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 5l7 7-7 7" /></svg>
                </div>
              </div>
              <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest group-hover:text-slate-500 transition-colors">
                {unit.cnpj || 'CNPJ NÃO INFORMADO'}
              </span>
              <div className="mt-5 w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                <div className="h-full bg-indigo-600 w-0 group-hover:w-full transition-all duration-700 ease-out"></div>
              </div>
            </button>
          ))}

          {units.length === 0 && (
            <div className="col-span-2 p-10 bg-rose-50 border-2 border-dashed border-rose-200 rounded-[32px] text-center">
              <div className="w-12 h-12 bg-rose-100 rounded-2xl flex items-center justify-center text-rose-600 mx-auto mb-4">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
              </div>
              <p className="text-rose-800 font-black uppercase tracking-tighter text-lg">Sem Acesso</p>
              <p className="text-rose-600 text-[11px] font-bold uppercase tracking-widest mt-1">Seu usuário não possui permissão em nenhuma unidade ativa.</p>
            </div>
          )}
        </div>

        <div className="mt-12 text-center">
            <p className="text-[9px] text-slate-300 font-black uppercase tracking-[0.3em]">GDOC Intelligence System</p>
        </div>
      </div>
    </div>
  );
};

export default UnitSelect;
