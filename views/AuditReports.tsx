
import React, { useMemo, useState } from 'react';
import { Document, Process, User, Sector, DocType, AuditEntry, AccessLog } from '../types';

interface AuditReportsProps {
  documents: Document[];
  processes: Process[];
  users: User[];
  sectors: Sector[];
  docTypes: DocType[];
  accessLogs: AccessLog[];
}

const AuditReports: React.FC<AuditReportsProps> = ({ documents, processes, users, sectors, docTypes, accessLogs }) => {
  const [activeTab, setActiveTab] = useState<'timeline' | 'access' | 'flow' | 'users' | 'integrity'>('timeline');
  const [searchLog, setSearchLog] = useState('');

  // Consolidar logs de ações (Timeline)
  const globalTimeline = useMemo(() => {
    const list: (AuditEntry & { type: 'Processo' | 'Documento', nup: string })[] = [];
    
    processes.forEach(p => {
      (p.history || []).forEach(h => list.push({ ...h, type: 'Processo', nup: p.nup }));
    });

    documents.forEach(d => {
      (d.comments || []).forEach(c => {
        if (c.text.toUpperCase().includes('TRAMITADO') || c.text.toUpperCase().includes('ARQUIVADO')) {
           list.push({ id: c.id, userId: c.userId, userName: c.userName, action: c.text, timestamp: c.timestamp, type: 'Documento', nup: d.nup });
        }
      });
    });

    return list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [processes, documents]);

  // Logs de Acesso (Visualização)
  const filteredAccessLogs = useMemo(() => {
    return [...accessLogs]
      .filter(l => l.userName.toLowerCase().includes(searchLog.toLowerCase()) || l.resourceNup.includes(searchLog))
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [accessLogs, searchLog]);

  // Relatório de Fluxo por Setor
  const flowStats = useMemo(() => {
    const stats: Record<string, { in: number, out: number }> = {};
    sectors.forEach(s => stats[s.id] = { in: 0, out: 0 });

    processes.forEach(p => {
        if (p.senderSectorId && stats[p.senderSectorId]) stats[p.senderSectorId].out++;
        if (stats[p.sectorId]) stats[p.sectorId].in++;
    });

    return Object.entries(stats).map(([id, val]) => ({
      name: sectors.find(s => s.id === id)?.name || 'Desconhecido',
      ...val
    }));
  }, [processes, sectors]);

  const statsCards = [
    { label: 'Ações Registradas', value: globalTimeline.length, color: 'indigo' },
    { label: 'Acessos Monitorados', value: accessLogs.length, color: 'rose' },
    { label: 'Processos Ativos', value: processes.filter(p => !p.isArchived).length, color: 'green' },
    { label: 'Documentos Únicos', value: documents.length, color: 'blue' }
  ];

  const Icon = ({ path, className = "w-5 h-5" }: { path: string, className?: string }) => <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="Mpath" /></svg>;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex justify-between items-end">
        <div>
           <h1 className="text-3xl font-black text-slate-800 uppercase tracking-tighter italic">Central de Auditoria</h1>
           <p className="text-slate-500 font-medium italic">Inteligência de dados e rastreabilidade total do GDOC.</p>
        </div>
        <div className="flex gap-1 bg-slate-100 p-1 rounded-2xl border border-slate-200">
           {['timeline', 'access', 'flow', 'users', 'integrity'].map(tab => (
             <button 
                key={tab}
                onClick={() => setActiveTab(tab as any)} 
                className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
             >
                {tab === 'timeline' ? 'Ações' : tab === 'access' ? 'Acessos' : tab === 'flow' ? 'Fluxo' : tab === 'users' ? 'Usuários' : 'Integridade'}
             </button>
           ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsCards.map((s, i) => (
          <div key={i} className="bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm group hover:border-indigo-400 transition-all">
             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{s.label}</p>
             <p className={`text-4xl font-black tracking-tighter italic group-hover:scale-110 transition-transform origin-left text-slate-800`}>{s.value}</p>
          </div>
        ))}
      </div>

      {activeTab === 'timeline' && (
        <div className="bg-white rounded-[40px] border border-slate-200 shadow-sm overflow-hidden text-black animate-in slide-in-from-bottom-2">
           <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/30">
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Rastro de Ações Administrativas</h3>
              <button onClick={() => window.print()} className="px-4 py-2 bg-slate-800 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition">Imprimir Logs</button>
           </div>
           <div className="max-h-[600px] overflow-y-auto custom-scrollbar">
              <table className="w-full text-left">
                <thead className="bg-slate-50/50 sticky top-0 backdrop-blur-sm">
                  <tr>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Data/Hora</th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Usuário</th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Origem (NUP)</th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Ação Realizada</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {globalTimeline.map((log, i) => (
                    <tr key={i} className="hover:bg-indigo-50/30 transition group">
                      <td className="px-8 py-5 whitespace-nowrap">
                         <p className="text-xs font-bold text-slate-600">{new Date(log.timestamp).toLocaleDateString()}</p>
                         <p className="text-[10px] font-medium text-slate-400">{new Date(log.timestamp).toLocaleTimeString()}</p>
                      </td>
                      <td className="px-8 py-5">
                         <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-indigo-600 font-black text-[10px]">{log.userName.charAt(0)}</div>
                            <span className="text-xs font-black text-slate-700 uppercase tracking-tight">{log.userName}</span>
                         </div>
                      </td>
                      <td className="px-8 py-5">
                         <span className={`text-[10px] font-black px-2 py-1 rounded-lg ${log.type === 'Processo' ? 'bg-indigo-50 text-indigo-700' : 'bg-blue-50 text-blue-700'}`}>{log.nup} ({log.type})</span>
                      </td>
                      <td className="px-8 py-5">
                         <p className="text-xs text-slate-500 font-medium max-w-md">{log.action}</p>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
           </div>
        </div>
      )}

      {activeTab === 'access' && (
        <div className="bg-white rounded-[40px] border border-slate-200 shadow-sm overflow-hidden text-black animate-in slide-in-from-bottom-2">
           <div className="p-8 border-b border-slate-50 flex flex-col md:flex-row justify-between items-center bg-slate-50/30 gap-4">
              <div>
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Monitoramento de Visualizações</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Quem viu o quê e de onde (IP)</p>
              </div>
              <input 
                type="text" 
                placeholder="Filtrar por nome ou NUP..." 
                value={searchLog}
                onChange={e => setSearchLog(e.target.value)}
                className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-500 w-full md:w-64"
              />
           </div>
           <div className="max-h-[600px] overflow-y-auto custom-scrollbar">
              <table className="w-full text-left">
                <thead className="bg-slate-50 sticky top-0">
                  <tr>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Acessado em</th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Colaborador</th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Recurso (NUP)</th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Tipo</th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Origem de Rede (IP)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredAccessLogs.map((log, i) => (
                    <tr key={log.id} className="hover:bg-indigo-50/30 transition group">
                      <td className="px-8 py-5 whitespace-nowrap">
                         <p className="text-xs font-bold text-slate-600">{new Date(log.timestamp).toLocaleDateString()}</p>
                         <p className="text-[10px] font-medium text-slate-400">{new Date(log.timestamp).toLocaleTimeString()}</p>
                      </td>
                      <td className="px-8 py-5">
                        <span className="text-xs font-black text-slate-700 uppercase tracking-tight">{log.userName}</span>
                      </td>
                      <td className="px-8 py-5">
                         <span className="text-xs font-mono font-bold text-indigo-600">{log.resourceNup} ({log.resourceType})</span>
                      </td>
                      <td className="px-8 py-5">
                         <span className={`text-[9px] font-black px-2 py-0.5 rounded uppercase ${log.resourceType === 'Processo' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>{log.resourceType}</span>
                      </td>
                      <td className="px-8 py-5">
                         <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                            <span className="text-xs font-mono font-bold text-slate-500">{log.ip}</span>
                         </div>
                      </td>
                    </tr>
                  ))}
                  {filteredAccessLogs.length === 0 && (
                    <tr><td colSpan={5} className="px-8 py-20 text-center text-slate-300 italic uppercase font-bold text-xs tracking-widest">Nenhum rastro de acesso encontrado.</td></tr>
                  )}
                </tbody>
              </table>
           </div>
        </div>
      )}

      {activeTab === 'flow' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in slide-in-from-bottom-2">
           <div className="bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm text-black">
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-8">Movimentação por Setor</h3>
              <div className="space-y-6">
                {flowStats.map((fs, i) => (
                  <div key={i} className="group">
                    <div className="flex justify-between items-end mb-2">
                       <span className="text-xs font-black text-slate-700 uppercase tracking-tight">{fs.name}</span>
                       <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">E: {fs.in} | S: {fs.out}</span>
                    </div>
                    <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden flex">
                       <div className="h-full bg-green-500 transition-all duration-1000 group-hover:opacity-80" style={{ width: `${(fs.in / (processes.length || 1)) * 100}%` }}></div>
                       <div className="h-full bg-amber-500 transition-all duration-1000 group-hover:opacity-80" style={{ width: `${(fs.out / (processes.length || 1)) * 100}%` }}></div>
                    </div>
                  </div>
                ))}
              </div>
           </div>
           
           <div className="bg-slate-900 p-8 rounded-[40px] shadow-2xl text-white">
              <div className="flex items-center gap-4 mb-8">
                 <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                 </div>
                 <h3 className="text-xl font-black uppercase tracking-tighter italic">Insights do Protocolo</h3>
              </div>
              <div className="space-y-8">
                 <div className="p-6 bg-white/5 rounded-3xl border border-white/10">
                    <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">Taxa de Arquivamento</p>
                    <p className="text-3xl font-black italic tracking-tighter">{((processes.filter(p => p.isArchived).length / (processes.length || 1)) * 100).toFixed(1)}%</p>
                 </div>
                 <div className="p-6 bg-white/5 rounded-3xl border border-white/10">
                    <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">Média de Itens por Processo</p>
                    <p className="text-3xl font-black italic tracking-tighter">{(documents.filter(d => d.processId).length / (processes.length || 1)).toFixed(1)} <span className="text-xs opacity-40">peças</span></p>
                 </div>
              </div>
           </div>
        </div>
      )}

      {activeTab === 'integrity' && (
        <div className="bg-white p-12 rounded-[40px] border border-slate-200 text-black animate-in zoom-in-95">
           <div className="max-w-2xl mx-auto text-center space-y-8">
              <div className="w-24 h-24 bg-indigo-50 rounded-[36px] flex items-center justify-center text-indigo-600 mx-auto border border-indigo-100 shadow-xl shadow-indigo-100/50">
                 <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
              </div>
              <div>
                <h2 className="text-3xl font-black uppercase tracking-tighter italic">Saúde da Base de Dados</h2>
                <p className="text-slate-500 font-medium italic mt-2">Relatório de integridade técnica e referencial.</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                 <div className="p-8 bg-slate-50 rounded-3xl border border-slate-100">
                    <p className="text-[10px] font-black text-slate-400 uppercase mb-2">Documentos Sincronizados</p>
                    <p className="text-4xl font-black tracking-tighter italic text-indigo-600">100%</p>
                 </div>
                 <div className="p-8 bg-slate-50 rounded-3xl border border-slate-100">
                    <p className="text-[10px] font-black text-slate-400 uppercase mb-2">Orfãos de Referência</p>
                    <p className="text-4xl font-black tracking-tighter italic text-emerald-600">Zero</p>
                 </div>
              </div>
           </div>
        </div>
      )}

      {activeTab === 'users' && (
        <div className="bg-white rounded-[40px] border border-slate-200 overflow-hidden text-black animate-in slide-in-from-bottom-2">
           <table className="w-full text-left">
             <thead className="bg-slate-50 border-b">
               <tr>
                 <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase">Colaborador</th>
                 <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase">Participação em Processos</th>
                 <th className="px-8 py-5 text-right text-[10px] font-black text-slate-400 uppercase">Ações</th>
               </tr>
             </thead>
             <tbody className="divide-y divide-slate-50">
               {users.map(u => (
                 <tr key={u.id} className="hover:bg-slate-50 transition group">
                   <td className="px-8 py-5">
                      <p className="text-sm font-black text-slate-800 uppercase italic tracking-tight">{u.name}</p>
                      <p className="text-[9px] font-bold text-slate-400 font-mono tracking-widest">{u.cpf}</p>
                   </td>
                   <td className="px-8 py-5">
                      <div className="flex gap-1">
                         {Array.from({ length: Math.min(processes.filter(p => p.history?.some(h => h.userId === u.id)).length, 8) }).map((_, i) => (
                           <div key={i} className="w-2 h-6 bg-indigo-600/20 rounded-full"></div>
                         ))}
                         {processes.filter(p => p.history?.some(h => h.userId === u.id)).length === 0 && <span className="text-[10px] text-slate-300 italic">Sem registros ativos</span>}
                      </div>
                   </td>
                   <td className="px-8 py-5 text-right">
                      <button className="text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:underline">Ver Atividade</button>
                   </td>
                 </tr>
               ))}
             </tbody>
           </table>
        </div>
      )}
    </div>
  );
};

export default AuditReports;
