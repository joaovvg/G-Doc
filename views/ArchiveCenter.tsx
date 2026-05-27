import React, { useMemo, useState } from 'react';
import { ArchivalClassification, Process, Document, DocType } from '../types';

interface ArchiveCenterProps {
  classifications: ArchivalClassification[];
  allProcesses: Process[];
  allDocuments: Document[];
  docTypes: DocType[];
  currentSectorId: string;
  canManageArchive: boolean;
  onSelectDoc: (id: string) => void;
  onSelectProc: (id: string) => void;
  onUnarchiveDoc: (id: string) => void;
  onUnarchiveProc: (id: string) => void;
}

const ArchiveCenter: React.FC<ArchiveCenterProps> = ({ classifications, allProcesses, allDocuments, docTypes, currentSectorId, canManageArchive, onSelectDoc, onSelectProc, onUnarchiveDoc, onUnarchiveProc }) => {
  const [selectedClassificationId, setSelectedClassificationId] = useState<string | null>(null);

  const archivedProcs = useMemo(() => allProcesses.filter((item) => item.isArchived), [allProcesses]);
  const archivedDocs = useMemo(() => allDocuments.filter((item) => item.isArchived), [allDocuments]);

  const classificationStats = useMemo(() => {
    const stats: Record<string, { procs: number; docs: number }> = {};
    classifications.forEach((item) => { stats[item.id] = { procs: 0, docs: 0 }; });
    archivedProcs.forEach((item) => { if (item.archivalClassificationId && stats[item.archivalClassificationId]) stats[item.archivalClassificationId].procs++; });
    archivedDocs.forEach((item) => { if (item.archivalClassificationId && stats[item.archivalClassificationId]) stats[item.archivalClassificationId].docs++; });
    return stats;
  }, [classifications, archivedDocs, archivedProcs]);

  const filteredProcs = useMemo(
    () => selectedClassificationId ? archivedProcs.filter((item) => item.archivalClassificationId === selectedClassificationId) : [],
    [archivedProcs, selectedClassificationId]
  );
  const filteredDocs = useMemo(
    () => selectedClassificationId ? archivedDocs.filter((item) => item.archivalClassificationId === selectedClassificationId) : [],
    [archivedDocs, selectedClassificationId]
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500 text-black">
      <div>
        <h1 className="text-3xl font-black text-slate-800 uppercase tracking-tighter italic leading-none">Central de Arquivos</h1>
        <p className="text-slate-500 font-medium italic mt-2">Dossies e expedientes inativos organizados por classificacao arquivistica.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-4">
          <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
            <div className="w-3 h-1 bg-indigo-600 rounded-full"></div>
            Classes de Arquivamento
          </h2>
          <div className="space-y-2 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
            {classifications.map((item) => (
              <button
                key={item.id}
                onClick={() => setSelectedClassificationId(item.id)}
                className={`w-full text-left p-6 rounded-[24px] border-2 transition-all ${selectedClassificationId === item.id ? 'bg-indigo-600 border-indigo-600 text-white shadow-xl shadow-indigo-100' : 'bg-white border-slate-100 text-slate-700 hover:border-indigo-200'}`}
              >
                <p className={`text-[10px] font-black uppercase tracking-widest mb-1 ${selectedClassificationId === item.id ? 'text-indigo-200' : 'text-indigo-600'}`}>{item.code}</p>
                <p className="text-sm font-bold uppercase line-clamp-2">{item.name}</p>
                <div className="mt-4 flex gap-3">
                  <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase ${selectedClassificationId === item.id ? 'bg-white/20' : 'bg-slate-100 text-slate-500'}`}>{classificationStats[item.id]?.procs || 0} Processos</span>
                  <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase ${selectedClassificationId === item.id ? 'bg-white/20' : 'bg-slate-100 text-slate-500'}`}>{classificationStats[item.id]?.docs || 0} Documentos</span>
                </div>
              </button>
            ))}
            {classifications.length === 0 && (
              <div className="p-10 text-center bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                <p className="text-xs font-bold text-slate-400 uppercase">Nenhuma classificacao cadastrada.</p>
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-2 space-y-8">
          {!selectedClassificationId ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-20 bg-slate-50 rounded-[48px] border-2 border-dashed border-slate-200 opacity-60">
              <svg className="w-20 h-20 text-slate-300 mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" /></svg>
              <h3 className="text-xl font-black text-slate-400 uppercase tracking-tighter italic">Selecione uma classificacao a esquerda</h3>
              <p className="text-xs font-medium text-slate-400 mt-2">Para listar o acervo documental correspondente.</p>
            </div>
          ) : (
            <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
              <section>
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest mb-4 flex items-center gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-600"></div>
                  Processos Arquivados ({filteredProcs.length})
                </h3>
                <div className="grid grid-cols-1 gap-3">
                  {filteredProcs.map((item) => (
                    <div key={item.id} onClick={() => onSelectProc(item.id)} className="flex items-center justify-between p-5 bg-white border border-slate-200 rounded-[24px] hover:shadow-lg transition-all group text-left cursor-pointer">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-black text-xs">PROC</div>
                        <div>
                          <p className="text-xs font-black text-slate-400 uppercase leading-none mb-1">{item.nup}</p>
                          <p className="text-sm font-bold text-slate-800 uppercase line-clamp-1">{item.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {canManageArchive && (item.archivedSectorId ?? item.sectorId) === currentSectorId && (
                          <button onClick={(e) => { e.stopPropagation(); onUnarchiveProc(item.id); }} className="text-[10px] font-black uppercase tracking-widest bg-emerald-50 text-emerald-700 px-3 py-2 rounded-full border border-emerald-100">Desarquivar</button>
                        )}
                        <button onClick={() => onSelectProc(item.id)} className="p-2">
                          <svg className="w-5 h-5 text-slate-300 group-hover:text-indigo-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                        </button>
                      </div>
                    </div>
                  ))}
                  {filteredProcs.length === 0 && <p className="text-xs text-slate-400 italic px-6">Nenhum processo arquivado para esta classificacao.</p>}
                </div>
              </section>

              <section>
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest mb-4 flex items-center gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-600"></div>
                  Documentos Avulsos ({filteredDocs.length})
                </h3>
                <div className="grid grid-cols-1 gap-3">
                  {filteredDocs.map((item) => (
                    <div key={item.id} onClick={() => onSelectDoc(item.id)} className="flex items-center justify-between p-5 bg-white border border-slate-200 rounded-[24px] hover:shadow-lg transition-all group text-left cursor-pointer">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 font-black text-xs">DOC</div>
                        <div>
                          <p className="text-xs font-black text-slate-400 uppercase leading-none mb-1">{item.nup}</p>
                          <p className="text-sm font-bold text-slate-800 uppercase line-clamp-1">{item.description}</p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">{docTypes.find((type) => type.id === item.typeId)?.name || 'Tipo nao informado'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {canManageArchive && (item.archivedSectorId ?? item.sectorId) === currentSectorId && (
                          <button onClick={(e) => { e.stopPropagation(); onUnarchiveDoc(item.id); }} className="text-[10px] font-black uppercase tracking-widest bg-emerald-50 text-emerald-700 px-3 py-2 rounded-full border border-emerald-100">Desarquivar</button>
                        )}
                        <button onClick={() => onSelectDoc(item.id)} className="p-2">
                          <svg className="w-5 h-5 text-slate-300 group-hover:text-indigo-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                        </button>
                      </div>
                    </div>
                  ))}
                  {filteredDocs.length === 0 && <p className="text-xs text-slate-400 italic px-6">Nenhum documento arquivado para esta classificacao.</p>}
                </div>
              </section>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ArchiveCenter;
