
import React, { useState } from 'react';
import { Document, DocType, Interested, ArchivalClassification, AccessLevelConfig, Sector, User } from '../types';

interface DocumentSearchProps {
  documents: Document[];
  docTypes: DocType[];
  interested: Interested[];
  sectors: Sector[];
  users: User[];
  classifications: ArchivalClassification[];
  accessLevels: AccessLevelConfig[];
  onSelectDoc: (id: string) => void;
}

const DocumentSearch: React.FC<DocumentSearchProps> = ({ documents, docTypes, interested, sectors, users, classifications, accessLevels, onSelectDoc }) => {
  const [filters, setFilters] = useState({
    nup: '',
    description: '',
    typeId: '',
    sectorId: '',
    classificationId: '',
    interestedId: '',
    accessLevelId: '',
    authorId: '',
    dateStart: '',
    dateEnd: ''
  });

  const [results, setResults] = useState<Document[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [isFiltersOpen, setIsFiltersOpen] = useState(true);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const filtered = documents.filter(doc => {
      const matchNup = !filters.nup || doc.nup.toLowerCase().includes(filters.nup.toLowerCase());
      const matchDesc = !filters.description || doc.description.toLowerCase().includes(filters.description.toLowerCase());
      const matchType = !filters.typeId || doc.typeId === filters.typeId;
      const matchSector = !filters.sectorId || doc.sectorId === filters.sectorId;
      const matchClass = !filters.classificationId || doc.archivalClassificationId === filters.classificationId;
      const matchInter = !filters.interestedId || (doc.interestedIds && doc.interestedIds.includes(filters.interestedId));
      const matchAccess = !filters.accessLevelId || doc.accessLevelId === filters.accessLevelId;
      const matchAuthor = !filters.authorId || doc.authorId === filters.authorId;
      
      let matchDate = true;
      if (filters.dateStart) {
        matchDate = matchDate && new Date(doc.createdAt) >= new Date(filters.dateStart);
      }
      if (filters.dateEnd) {
        // Ajusta para o final do dia
        const end = new Date(filters.dateEnd);
        end.setHours(23, 59, 59, 999);
        matchDate = matchDate && new Date(doc.createdAt) <= end;
      }

      return matchNup && matchDesc && matchType && matchSector && matchClass && matchInter && matchAccess && matchAuthor && matchDate;
    });

    setResults(filtered);
    setHasSearched(true);
    setIsFiltersOpen(false); // Fecha filtros para focar nos resultados
  };

  const clearFilters = () => {
    setFilters({
      nup: '',
      description: '',
      typeId: '',
      sectorId: '',
      classificationId: '',
      interestedId: '',
      accessLevelId: '',
      authorId: '',
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
          <h1 className="text-3xl font-black text-slate-800 tracking-tighter uppercase italic">Pesquisa de Documentos</h1>
          <p className="text-slate-500 font-medium italic">Localize expedientes em toda a unidade organizacional.</p>
        </div>
        <div className="flex gap-2">
           <button 
            onClick={clearFilters}
            className="px-6 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-black uppercase tracking-widest transition"
           >
             Limpar Tudo
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

      {/* FORMULÁRIO DE FILTROS */}
      {isFiltersOpen && (
        <div className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm animate-in slide-in-from-top-4 duration-300">
          <form onSubmit={handleSearch} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="lg:col-span-1">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">NUP / Protocolo</label>
                <input 
                  type="text" 
                  value={filters.nup}
                  onChange={e => setFilters({...filters, nup: e.target.value})}
                  placeholder="00000.000000/202X-00"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 font-mono text-xs font-normal"
                />
              </div>

              <div className="lg:col-span-3">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Assunto / Descrição</label>
                <input 
                  type="text" 
                  value={filters.description}
                  onChange={e => setFilters({...filters, description: e.target.value})}
                  placeholder="Busque por termos contidos no assunto do documento..."
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 text-xs font-normal"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Tipo Documental</label>
                <select 
                  value={filters.typeId}
                  onChange={e => setFilters({...filters, typeId: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-50 font-normal text-xs"
                >
                  <option value="">Todos os tipos</option>
                  {docTypes.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Localização (Setor)</label>
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
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Interessado</label>
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
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Criado por (Autor)</label>
                <select 
                  value={filters.authorId}
                  onChange={e => setFilters({...filters, authorId: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-50 font-normal text-xs"
                >
                  <option value="">Qualquer colaborador</option>
                  {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Classificacao Arquivistica</label>
                <select 
                  value={filters.classificationId}
                  onChange={e => setFilters({...filters, classificationId: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-50 font-normal text-xs"
                >
                  <option value="">Qualquer classificacao</option>
                  {classifications.map(c => <option key={c.id} value={c.id}>{c.code} - {c.name}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Sigilo / Acesso</label>
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
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Data Início</label>
                <input 
                  type="date" 
                  value={filters.dateStart}
                  onChange={e => setFilters({...filters, dateStart: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-50 font-normal text-xs"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Data Fim</label>
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
                Executar Busca Técnica
              </button>
            </div>
          </form>
        </div>
      )}

      {/* RESULTADOS DA BUSCA */}
      {hasSearched && (
        <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden animate-in fade-in zoom-in-95 duration-500">
          <div className="p-8 bg-slate-50/50 border-b border-slate-100 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              </div>
              <h3 className="font-black text-slate-800 uppercase text-xs tracking-widest">Encontrados: {results.length} Documentos</h3>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/20">
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">NUP / Protocolo</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Assunto</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Acesso</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Tipo</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Localização Atual</th>
                  <th className="px-8 py-5 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {results.map(doc => {
                  const al = accessLevels.find(l => l.id === doc.accessLevelId);
                  const sector = sectors.find(s => s.id === doc.sectorId);
                  return (
                    <tr key={doc.id} className="hover:bg-indigo-50/30 transition group cursor-pointer" onClick={() => onSelectDoc(doc.id)}>
                      <td className="px-8 py-5">
                         <span className="text-xs font-black text-indigo-600 bg-indigo-50 px-3 py-1 rounded-lg border border-indigo-100">{doc.nup} (Documento)</span>
                      </td>
                      <td className="px-8 py-5">
                        <p className="text-sm font-black text-slate-800 uppercase tracking-tight truncate max-w-xs">{doc.description}</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">Criado em: {new Date(doc.createdAt).toLocaleDateString('pt-BR')}</p>
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
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{docTypes.find(t => t.id === doc.typeId)?.name}</p>
                      </td>
                      <td className="px-8 py-5">
                        <p className="text-[10px] font-black text-slate-600 uppercase italic">
                           {sector?.name || 'Localização Indefinida'}
                        </p>
                      </td>
                      <td className="px-8 py-5 text-right">
                         <button className="text-indigo-600 font-black uppercase text-[10px] tracking-widest hover:underline bg-indigo-50 px-4 py-2 rounded-xl group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-sm">Abrir Detalhes</button>
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

export default DocumentSearch;
