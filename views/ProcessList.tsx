
import React, { useState } from 'react';
import { Process } from '../types';

interface ProcessListProps {
  processes: Process[];
  onSelectProc: (id: string) => void;
  onCancelProc: (id: string) => void;
}

const ProcessList: React.FC<ProcessListProps> = ({ processes, onSelectProc, onCancelProc }) => {
  const [filter, setFilter] = useState<'current' | 'archived'>('current');
  const filteredProcs = processes.filter(p => filter === 'current' ? !p.isArchived : p.isArchived);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Processos do Setor</h1>
          <p className="text-slate-500">Acompanhamento dos fluxos administrativos.</p>
        </div>
        <div className="flex bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
          <button 
            onClick={() => setFilter('current')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition ${filter === 'current' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            Correntes
          </button>
          <button 
            onClick={() => setFilter('archived')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition ${filter === 'archived' ? 'bg-amber-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            Arquivados
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">NUP / Processo</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Assunto</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Data</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredProcs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400 italic">
                    Nenhum processo {filter === 'current' ? 'corrente' : 'arquivado'} encontrado.
                  </td>
                </tr>
              ) : (
                filteredProcs.map(proc => (
                  <tr key={proc.id} className="hover:bg-slate-50 transition cursor-pointer group" onClick={() => onSelectProc(proc.id)}>
                    <td className="px-6 py-4 font-bold text-xs text-indigo-700">{proc.nup} (Processo)</td>
                    <td className="px-6 py-4 text-sm text-slate-700 font-medium truncate max-w-xs">{proc.description}</td>
                    <td className="px-6 py-4">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${proc.status === 'Aberto' ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-slate-100 text-slate-600 border border-slate-200'}`}>
                        {proc.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">
                      {new Date(proc.createdAt).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {proc.isPendingReception && proc.senderSectorId === proc.sectorId ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onCancelProc(proc.id);
                          }}
                          className="text-amber-700 hover:text-amber-900 text-xs font-bold bg-amber-50 px-3 py-1 rounded-full transition"
                        >
                          Cancelar Tramitação
                        </button>
                      ) : (
                        <button className="text-blue-600 hover:text-blue-800 text-xs font-bold bg-blue-50 px-3 py-1 rounded-full transition">
                          Acessar
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ProcessList;
