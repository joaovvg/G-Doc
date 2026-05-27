
import React, { useState } from 'react';
import { Process, Interested, AccessLevelConfig, Sector, ArchivalClassification } from '../types';

interface ProcessSearchProps {
  processes: Process[];
  interested: Interested[];
  sectors: Sector[];
  classifications: ArchivalClassification[];
  accessLevels: AccessLevelConfig[];
  onSelectProc: (id: string) => void;
}

const ProcessSearch: React.FC<ProcessSearchProps> = ({ processes, interested, sectors, classifications, accessLevels, onSelectProc }) => {
  const [filters, setFilters] = useState({
    nup: '',
    description: '',
    status: '',
    sectorId: '',
    classificationId: '',
    interestedId: '',
    accessLevelId: '',
    dateStart: '',
    dateEnd: ''
  });

  const [results, setResults] = useState<Process[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [isFiltersOpen, setIsFiltersOpen] = useState(true);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const filtered = processes.filter(proc => {
      const matchNup = !filters.nup || proc.nup.toLowerCase().includes(filters.nup.toLowerCase());
      const matchDesc = !filters.description || proc.description.toLowerCase().includes(filters.description.toLowerCase());
      const matchStatus = !filters.status || proc.status === filters.status;
      const matchSector = !filters.sectorId || proc.sectorId === filters.sectorId;
      const matchClass = !filters.classificationId || proc.archivalClassificationId === filters.classificationId;
      const matchInter = !filters.interestedId || (proc.interestedIds && proc.interestedIds.includes(filters.interestedId));
      const matchAccess = !filters.accessLevelId || proc.accessLevelId === filters.accessLevelId;
      
      let matchDate = true;
      if (filters.dateStart) {
        matchDate = matchDate && new Date(proc.createdAt) >= new Date(filters.dateStart);
      }
      if (filters.dateEnd) {
        const end = new Date(filters.dateEnd);
        end.setHours(23, 59, 59, 999);
        matchDate = matchDate && new Date(proc.createdAt) <= end;
      }

      return matchNup && matchDesc && matchStatus && matchSector && matchClass && matchInter && matchAccess && matchDate;
    });

    setResults(filtered);
    setHasSearched(true);
    setIsFiltersOpen(false);
  };

  const clearFilters = () => {
    setFilters({
      nup: '',
      description: '',
      status: '',
      sectorId: '',
      classificationId: '',
      interestedId: '',
      accessLevelId: '',
      dateStart: '',
      dateEnd: ''
    });
    setResults([]);
    setHasSearched(false);
    setIsFiltersOpen(true);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500 text-black">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tighter uppercase italic">Pesquisa de Processos</h1>
          <p className="text-slate-500 font-medium italic">Busca avançada em todos os dossiês da unidade administrativa.</p>
        </div>
        <div className="flex gap-2">
           <button 
            onClick={clearFilters}
            className="px-6 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-black uppercase tracking-widest transition"
           >
             Limpar Filtros
           </button>
           <button 
            onClick={() => setIsFiltersOpen(!isFiltersOpen)}
            className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition flex items-center gap-2 ${isFiltersOpen ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white border border-slate-200 text-slate-600'}`}
           >
             <svg className={`w-4 h-4 transition-transform ${isFiltersOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7" /></svg>
             {isFiltersOpen ? 'Ocultar Filtros' : 'Mostrar Filtros'}
           </button>
        </div>
      </div>

      {/* PAINEL DE FILTROS TÉCNICOS */}
      {isFiltersOpen && (
        <div className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm animate-in slide-in-from-top-4 duration-300">
          <form onSubmit={handleSearch} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="lg:col-span-1">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">NUP / Processo</label>
                <input 
                  type="text" 
                  value={filters.nup}
                  onChange={e => setFilters({...filters, nup: e.target.value})}
                  placeholder="00001.000001/202X-10"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 font-mono text-xs font-normal"
                />
              </div>

              <div className="lg:col-span-2">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Assunto da Capa</label>
                <input 
                  type="text" 
                  value={filters.description}
                  onChange={e => setFilters({...filters, description: e.target.value})}
                  placeholder="Termos contidos na descrição principal do dossiê..."
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 text-xs font-normal"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Status do Fluxo</label>
                <select 
                  value={filters.status}
                  onChange={e => setFilters({...filters, status: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-50 font-normal text-xs"
                >
                  <option value="">Qualquer status</option>
                  <option value="Aberto">Aberto</option>
                  <option value="Tramitado">Tramitado</option>
                  <option value="Arquivado">Arquivado</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Unidade / Setor Atual</label>
                <select 
                  value={filters.sectorId}
                  onChange={e => setFilters({...filters, sectorId: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-50 font-normal text-xs"
                >
                  <option value="">Em qualquer setor</option>
                  {sectors.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Classificação Arquivística</label>
                <select 
                  value={filters.classificationId}
                  onChange={e => setFilters({...filters, classificationId: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-50 font-normal text-xs"
                >
                  <option value="">Qualquer classificação</option>
                  {classifications.map(c => <option key={c.id} value={c.id}>{c.code} - {c.name}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Interessado Principal</label>
                <select 
                  value={filters.interestedId}
                  onChange={e => setFilters({...filters, interestedId: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-50 font-normal text-xs"
                >
                  <option value="">Qualquer interessado</option>
                  {interested.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Grau de Sigilo</label>
                <select 
                  value={filters.accessLevelId}
                  onChange={e => setFilters({...filters, accessLevelId: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-50 font-normal text-xs"
                >
                  <option value="">Todos os níveis</option>
                  {accessLevels.map(al => <option key={al.id} value={al.id}>{al.name}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Período de Abertura (Início)</label>
                <input 
                  type="date" 
                  value={filters.dateStart}
                  onChange={e => setFilters({...filters, dateStart: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-50 font-normal text-xs"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Período de Abertura (Fim)</label>
                <input 
                  type="date" 
                  value={filters.dateEnd}
                  onChange={e => setFilters({...filters, dateEnd: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-50 font-normal text-xs"
                />
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-50">
              <button 
                type="submit"
                className="bg-indigo-600 hover:bg-black text-white px-12 py-4 rounded-[20px] font-black uppercase text-xs tracking-[0.2em] shadow-xl shadow-indigo-100 transition-all transform hover:-translate-y-1 active:scale-95 flex items-center gap-3"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                Realizar Busca de Processo
              </button>
            </div>
          </form>
        </div>
      )}

      {/* LISTAGEM DE RESULTADOS */}
      {hasSearched && (
        <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden animate-in fade-in zoom-in-95 duration-500">
          <div className="p-8 bg-slate-50/50 border-b border-slate-100 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
              </div>
              <h3 className="font-black text-slate-800 uppercase text-xs tracking-widest">Encontrados: {results.length} Processos Administrativos</h3>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/20">
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">NUP / Processo</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Descrição Técnica</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Acesso</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status Atual</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Setor Localizado</th>
                  <th className="px-8 py-5 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Opções</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {results.map(proc => {
                  const al = accessLevels.find(l => l.id === proc.accessLevelId);
                  const sector = sectors.find(s => s.id === proc.sectorId);
                  return (
                    <tr key={proc.id} className="hover:bg-indigo-50/30 transition group cursor-pointer" onClick={() => onSelectProc(proc.id)}>
                      <td className="px-8 py-5">
                         <span className="text-xs font-black text-indigo-700 bg-indigo-50 px-3 py-1 rounded-lg border border-indigo-100">{proc.nup} (Processo)</span>
                      </td>
                      <td className="px-8 py-5">
                        <p className="text-sm font-black text-slate-800 uppercase tracking-tight truncate max-w-sm">{proc.description}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                           <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Aberto em: {new Date(proc.createdAt).toLocaleDateString('pt-BR')}</span>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <span 
                          className="text-[9px] font-black px-2 py-1 rounded uppercase text-white shadow-sm"
                          style={{ backgroundColor: al?.color || '#cbd5e1' }}
                        >
                          {al?.name || '-'}
                        </span>
                      </td>
                      <td className="px-8 py-5">
                        <span className={`text-[9px] px-2 py-1 rounded-full font-black uppercase border shadow-sm ${proc.status === 'Aberto' ? 'bg-green-50 text-green-700 border-green-200' : proc.status === 'Arquivado' ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                          {proc.status}
                        </span>
                      </td>
                      <td className="px-8 py-5">
                        <p className="text-[10px] font-black text-slate-600 uppercase italic">
                           {sector?.name || 'Localização Desconhecida'}
                        </p>
                      </td>
                      <td className="px-8 py-5 text-right">
                         <button className="text-indigo-600 font-black uppercase text-[10px] tracking-widest hover:underline bg-indigo-50 px-4 py-2 rounded-xl group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-sm">Ver Dossiê</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProcessSearch;
