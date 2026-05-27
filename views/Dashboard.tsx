
import React, { useMemo, useState } from 'react';
import { Document, Process, Sector } from '../types';

interface DashboardProps {
  docs: Document[];
  processes: Process[];
  incomingDocs: Document[];
  incomingProcs: Process[];
  outgoingDocs: Document[];
  outgoingProcs: Process[];
  onReceiveDoc: (id: string) => void;
  onReceiveProc: (id: string) => void;
  onRefuseDoc: (id: string) => void;
  onRefuseProc: (id: string) => void;
  onCancelDoc: (id: string) => void;
  onCancelProc: (id: string) => void;
  onAcceptWebProtocol: (id: string) => void;
  onRefuseWebProtocol: (id: string) => void;
  onSendWebProtocolPending: (id: string, pendingType: 'Documental' | 'Informacao', message: string) => void;
  sectors: Sector[];
  onNavigate: (view: string) => void;
  onSelectDoc: (id: string) => void;
  onSelectProc: (id: string) => void;
  permissions: string[];
}

const Dashboard: React.FC<DashboardProps> = ({ 
  docs, processes, incomingDocs, incomingProcs, outgoingDocs, outgoingProcs,
  onReceiveDoc, onReceiveProc, onRefuseDoc, onRefuseProc, onCancelDoc, onCancelProc,
  onAcceptWebProtocol, onRefuseWebProtocol, onSendWebProtocolPending,
  sectors, onNavigate, onSelectDoc, onSelectProc, permissions 
}) => {
  const [webProtocolMessages, setWebProtocolMessages] = useState<Record<string, string>>({});
  const [webProtocolPendingTypes, setWebProtocolPendingTypes] = useState<Record<string, 'Documental' | 'Informacao'>>({});
  const [openPendingFormFor, setOpenPendingFormFor] = useState<string | null>(null);

  const webProtocols = useMemo(() => processes.filter((proc) => proc.isWebProtocol), [processes]);
  const pendingWebProtocols = webProtocols.filter((proc) => proc.webProtocolStatus === 'Pendente');

  const getWebProtocolStatusMeta = (status?: Process['webProtocolStatus']) => {
    switch (status) {
      case 'Aceito':
        return { label: 'Aceito', className: 'bg-emerald-100 text-emerald-700 border-emerald-200' };
      case 'Recusado':
        return { label: 'Recusado', className: 'bg-rose-100 text-rose-700 border-rose-200' };
      case 'AguardandoResposta':
        return { label: 'Aguardando resposta da pendencia', className: 'bg-amber-100 text-amber-700 border-amber-200' };
      case 'RespostaEnviada':
        return { label: 'Resposta enviada', className: 'bg-blue-100 text-blue-700 border-blue-200' };
      case 'Pendencia':
        return { label: 'Pendencia', className: 'bg-amber-100 text-amber-700 border-amber-200' };
      default:
        return { label: 'Pendente', className: 'bg-sky-100 text-sky-700 border-sky-200' };
    }
  };

  const stats = [
    { 
      label: 'Meus Documentos', 
      value: docs.length, 
      color: 'blue', 
      target: 'doc_list',
      icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
      show: permissions.includes('doc_view')
    },
    { 
      label: 'Meus Processos', 
      value: processes.filter(p => p.status === 'Aberto').length, 
      color: 'indigo', 
      target: 'proc_list',
      icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10',
      show: permissions.includes('proc_view')
    },
    { 
      label: 'Caixa de Entrada', 
      value: incomingDocs.length + incomingProcs.length, 
      color: 'amber', 
      target: 'dashboard',
      icon: 'M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4a2 2 0 012-2m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4',
      show: (incomingDocs.length > 0 && permissions.includes('doc_view')) || (incomingProcs.length > 0 && permissions.includes('proc_view'))
    },
    { 
      label: 'Saída Pendente', 
      value: outgoingDocs.length + outgoingProcs.length, 
      color: 'violet', 
      target: 'dashboard',
      icon: 'M12 19l9 2-9-18-9 18 9-2zm0 0v-8',
      show: (outgoingDocs.length > 0 || outgoingProcs.length > 0)
    },
    { 
      label: 'Arquivados', 
      value: processes.filter(p => p.isArchived).length, 
      color: 'emerald', 
      target: 'proc_list',
      icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
      show: permissions.includes('proc_view')
    },
    {
      label: 'Protocolo Web',
      value: pendingWebProtocols.length,
      color: 'rose',
      target: 'dashboard',
      icon: 'M19 3H5a2 2 0 00-2 2v14a2 2 0 002 2h6.5l-1 2h5l-1-2H19a2 2 0 002-2V5a2 2 0 00-2-2zm-7 12a3 3 0 110-6 3 3 0 010 6z',
      show: permissions.includes('proc_view')
    },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500 text-black">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Painel de Controle</h1>
        <p className="text-slate-500 font-medium">Gestão exclusiva do seu setor ativo.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.filter(s => s.show !== false).map((stat, i) => (
          <button 
            key={i} 
            onClick={() => onNavigate(stat.target)}
            className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 hover:border-indigo-300 hover:shadow-xl hover:shadow-indigo-50 transition-all duration-300 text-left group"
          >
            <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center mb-4 text-slate-400 group-hover:bg-indigo-600 group-hover:text-white transition-all">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={stat.icon} />
              </svg>
            </div>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{stat.label}</p>
            <p className="text-3xl font-black text-slate-800 mt-1 group-hover:text-indigo-600 transition-colors">{stat.value}</p>
            <div className="mt-4 flex items-center gap-1 text-[9px] font-black text-slate-300 uppercase tracking-tighter opacity-0 group-hover:opacity-100 transition-opacity">
              Clique para acessar
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 5l7 7-7 7" /></svg>
            </div>
          </button>
        ))}
      </div>

      {permissions.includes('proc_view') && (
        <section className="rounded-3xl border border-rose-100 bg-white shadow-sm overflow-hidden">
          <div className="p-6 border-b border-rose-100 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-100 flex items-center justify-center text-rose-700">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 3H5a2 2 0 00-2 2v14a2 2 0 002 2h6.5l-1 2h5l-1-2H19a2 2 0 002-2V5a2 2 0 00-2-2zm-7 12a3 3 0 110-6 3 3 0 010 6z" />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-bold text-rose-900">Protocolo Web</h2>
                <p className="text-xs font-medium text-rose-500">Analise as solicitacoes enviadas pelo portal externo.</p>
              </div>
            </div>
            <span className="rounded-full bg-rose-50 px-4 py-2 text-[10px] font-black uppercase tracking-[0.25em] text-rose-700 border border-rose-100">
              {pendingWebProtocols.length} aguardando analise
            </span>
          </div>
          <div className="divide-y divide-rose-100">
            {webProtocols.length === 0 ? (
              <div className="p-6 text-sm font-semibold text-slate-500">
                Nenhum protocolo web encontrado para este setor.
              </div>
            ) : (
              webProtocols.map((proc) => {
                const meta = getWebProtocolStatusMeta(proc.webProtocolStatus);
                const canAct = proc.webProtocolStatus === 'Pendente';
                return (
                  <div key={proc.id} className="p-6">
                    <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-3">
                          <button
                            type="button"
                            onClick={() => onSelectProc(proc.id)}
                            className="text-left"
                          >
                            <p className="text-sm font-black uppercase tracking-tight text-slate-900 hover:text-rose-700 transition-colors">
                              {proc.nup}
                            </p>
                            <p className="mt-1 text-sm font-medium text-slate-500">{proc.description}</p>
                          </button>
                          <span className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] ${meta.className}`}>
                            {meta.label}
                          </span>
                        </div>
                        <p className="mt-3 text-[10px] font-black uppercase tracking-[0.2em] text-rose-500">
                          Origem: {sectors.find((sector) => sector.id === proc.senderSectorId)?.name || 'Portal Externo'}
                        </p>
                        {proc.webProtocolMessage ? (
                          <div className="mt-4 rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-rose-500">Mensagem do protocolo</p>
                            <p className="mt-1 font-medium">{proc.webProtocolMessage}</p>
                          </div>
                        ) : null}
                            {proc.webProtocolPendingType ? (
                              <div className="mt-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Tipo de pendencia</p>
                                <p className="mt-1 font-semibold">{proc.webProtocolPendingType}</p>
                              </div>
                            ) : null}
                        {proc.webProtocolPendingResponseText ? (
                          <div className="mt-3 rounded-2xl border border-indigo-100 bg-indigo-50 px-4 py-3 text-sm text-indigo-700">
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-500">Resposta do cidadão</p>
                            <p className="mt-1 font-medium">{proc.webProtocolPendingResponseText}</p>
                          </div>
                        ) : null}
                        {proc.webProtocolPendingResponseFileName ? (
                          <div className="mt-3 rounded-2xl border border-indigo-100 bg-indigo-50 px-4 py-3 text-sm text-indigo-700">
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-500">Arquivo recebido</p>
                            <p className="mt-1 font-medium">{proc.webProtocolPendingResponseFileName}</p>
                          </div>
                        ) : null}
                      </div>

                      {canAct ? (
                        <div className="w-full xl:max-w-[520px]">
                          {openPendingFormFor === proc.id ? (
                            <div className="rounded-3xl border border-rose-200 bg-rose-50 p-4">
                              <div className="flex items-center justify-between gap-3">
                                <div>
                                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-rose-500">Pendencia do protocolo</p>
                                  <p className="mt-1 text-sm font-semibold text-rose-900">Escolha o tipo e descreva o que o cidadão precisa responder.</p>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => setOpenPendingFormFor(null)}
                                  className="rounded-2xl border border-rose-200 bg-white px-3 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-rose-700 transition hover:bg-rose-100"
                                >
                                  Fechar
                                </button>
                              </div>

                              <label className="mt-4 block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                                Tipo de pendencia
                              </label>
                              <select
                                value={webProtocolPendingTypes[proc.id] || 'Informacao'}
                                onChange={(event) => setWebProtocolPendingTypes((prev) => ({
                                  ...prev,
                                  [proc.id]: event.target.value as 'Documental' | 'Informacao',
                                }))}
                                className="mt-3 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-rose-400"
                              >
                                <option value="Informacao">Informacao</option>
                                <option value="Documental">Documental</option>
                              </select>

                              <label className="mt-4 block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                                Mensagem de pendencia
                              </label>
                              <textarea
                                value={webProtocolMessages[proc.id] || ''}
                                onChange={(event) => setWebProtocolMessages((prev) => ({ ...prev, [proc.id]: event.target.value }))}
                                rows={4}
                                className="mt-3 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-rose-400"
                                placeholder="Explique o que o usuario precisa ajustar ou complementar."
                              />
                              <div className="mt-4 flex flex-wrap gap-2">
                                <button
                                  type="button"
                                  onClick={() => onAcceptWebProtocol(proc.id)}
                                  className="rounded-2xl bg-emerald-600 px-4 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-white transition hover:bg-emerald-700"
                                >
                                  Aceitar
                                </button>
                                <button
                                  type="button"
                                  onClick={() => onRefuseWebProtocol(proc.id)}
                                  className="rounded-2xl border border-rose-200 bg-white px-4 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-rose-700 transition hover:bg-rose-50"
                                >
                                  Recusar
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const message = (webProtocolMessages[proc.id] || '').trim();
                                    const pendingType = webProtocolPendingTypes[proc.id] || 'Informacao';
                                    if (!message) return;
                                    onSendWebProtocolPending(proc.id, pendingType, message);
                                    setWebProtocolMessages((prev) => ({ ...prev, [proc.id]: '' }));
                                    setOpenPendingFormFor(null);
                                  }}
                                  className="rounded-2xl bg-rose-600 px-4 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-white transition hover:bg-black"
                                >
                                  Concluir pendencia
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                              <div className="flex flex-wrap gap-2">
                                <button
                                  type="button"
                                  onClick={() => onAcceptWebProtocol(proc.id)}
                                  className="rounded-2xl bg-emerald-600 px-4 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-white transition hover:bg-emerald-700"
                                >
                                  Aceitar
                                </button>
                                <button
                                  type="button"
                                  onClick={() => onRefuseWebProtocol(proc.id)}
                                  className="rounded-2xl border border-rose-200 bg-white px-4 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-rose-700 transition hover:bg-rose-50"
                                >
                                  Recusar
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setOpenPendingFormFor(proc.id)}
                                  className="rounded-2xl bg-rose-600 px-4 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-white transition hover:bg-black"
                                >
                                  Enviar Pendencia
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="w-full xl:max-w-[360px] rounded-3xl border border-slate-200 bg-slate-50 p-4">
                          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Status final</p>
                          <p className="mt-2 text-sm font-semibold text-slate-700">
                            {proc.webProtocolStatus === 'AguardandoResposta'
                              ? 'Aguardando resposta da pendencia.'
                              : proc.webProtocolStatus === 'RespostaEnviada'
                                ? 'Resposta da pendencia enviada pelo cidadao.'
                              : proc.webProtocolStatus === 'Pendencia'
                                ? 'O usuario foi notificado e aguarda complemento.'
                              : proc.webProtocolStatus === 'Aceito'
                                ? 'Protocolo aceito e liberado para o fluxo interno.'
                                : 'Protocolo recusado no analise web.'}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>
      )}

      {/* Caixa de Entrada */}
      {((incomingDocs.length > 0 && permissions.includes('doc_view')) || (incomingProcs.length > 0 && permissions.includes('proc_view'))) && (
        <div className="bg-amber-50 rounded-3xl border border-amber-100 overflow-hidden shadow-sm">
           <div className="p-6 border-b border-amber-100 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-amber-200 flex items-center justify-center text-amber-700 animate-pulse">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 4H6a2 2 0 00-2 2v12a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-2m-4-1v8m0 0l3-3m-3 3L9 8m-5 5h2.586a1 1 0 01.707.293l2.414 2.414a1 1 0 00.707.293h3.172a1 1 0 00.707-.293l2.414-2.414a1 1 0 01.707-.293H20" /></svg>
              </div>
              <h2 className="text-lg font-bold text-amber-900">Caixa de Entrada (Aguardando Recebimento)</h2>
           </div>
           <div className="divide-y divide-amber-100">
              {permissions.includes('proc_view') && incomingProcs.map(proc => (
                <div key={proc.id} className="p-4 flex items-center justify-between hover:bg-amber-100/50 transition">
                   <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-bold text-amber-600 bg-amber-200 px-2 py-0.5 rounded uppercase tracking-wider">Processo</span>
                        <span className="text-sm font-bold text-amber-900">{proc.nup} (Processo)</span>
                      </div>
                      <p className="text-xs text-amber-800 font-medium">{proc.description}</p>
                      <p className="text-[10px] text-amber-500 font-bold uppercase mt-1">Origem: {sectors.find(s => s.id === proc.senderSectorId)?.name || 'Setor Externo'}</p>
                   </div>
                   <div className="flex gap-2">
                     <button 
                      onClick={() => onRefuseProc(proc.id)}
                      className="px-4 py-2 border border-amber-200 text-amber-600 hover:bg-amber-200 rounded-xl text-xs font-bold transition"
                     >
                       Recusar
                     </button>
                     <button 
                      onClick={() => onReceiveProc(proc.id)}
                      className="px-6 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-lg shadow-amber-200 transition"
                     >
                       Receber
                     </button>
                   </div>
                </div>
              ))}
              {permissions.includes('doc_view') && incomingDocs.map(doc => (
                <div key={doc.id} className="p-4 flex items-center justify-between hover:bg-amber-100/50 transition">
                   <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-bold text-blue-600 bg-blue-100 px-2 py-0.5 rounded uppercase tracking-wider">Documento</span>
                        <span className="text-sm font-bold text-amber-900">{doc.nup} (Documento)</span>
                      </div>
                      <p className="text-xs text-amber-800 font-medium">{doc.description}</p>
                      <p className="text-[10px] text-amber-500 font-bold uppercase mt-1">Origem: {sectors.find(s => s.id === doc.senderSectorId)?.name || 'Setor Externo'}</p>
                   </div>
                   <div className="flex gap-2">
                     <button 
                      onClick={() => onRefuseDoc(doc.id)}
                      className="px-4 py-2 border border-blue-200 text-blue-600 hover:bg-blue-200 rounded-xl text-xs font-bold transition"
                     >
                       Recusar
                     </button>
                     <button 
                      onClick={() => onReceiveDoc(doc.id)}
                      className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-lg shadow-blue-200 transition"
                     >
                       Receber
                     </button>
                   </div>
                </div>
              ))}
           </div>
        </div>
      )}

      {/* Slot de Tramitação: Saída Pendente */}
      {((outgoingDocs.length > 0 && permissions.includes('doc_view')) || (outgoingProcs.length > 0 && permissions.includes('proc_view'))) && (
        <div className="bg-indigo-50 rounded-3xl border border-indigo-100 overflow-hidden shadow-sm">
           <div className="p-6 border-b border-indigo-100 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-indigo-200 flex items-center justify-center text-indigo-700">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
              </div>
              <h2 className="text-lg font-bold text-indigo-900">Saída Pendente (Aguardando Aceite do Destino)</h2>
           </div>
           <div className="divide-y divide-indigo-100">
              {permissions.includes('proc_view') && outgoingProcs.map(proc => (
                <div key={proc.id} className="p-4 flex items-center justify-between hover:bg-indigo-100/30 transition">
                   <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-bold text-indigo-600 bg-indigo-200 px-2 py-0.5 rounded uppercase tracking-wider">Processo</span>
                        <span className="text-sm font-bold text-indigo-900">{proc.nup}</span>
                      </div>
                      <p className="text-xs text-indigo-800 font-medium">{proc.description}</p>
                      <p className="text-[10px] text-indigo-500 font-bold uppercase mt-1 italic">Destino: {sectors.find(s => s.id === proc.destinationSectorId)?.name || 'Setor Externo'}</p>
                   </div>
                   <div className="flex gap-2">
                     <button 
                      onClick={() => onCancelProc(proc.id)}
                      className="px-5 py-2 border border-indigo-200 text-indigo-600 hover:bg-white rounded-xl text-[10px] font-black uppercase tracking-widest transition"
                     >
                       Cancelar Tramitação
                     </button>
                   </div>
                </div>
              ))}
              {permissions.includes('doc_view') && outgoingDocs.map(doc => (
                <div key={doc.id} className="p-4 flex items-center justify-between hover:bg-indigo-100/30 transition">
                   <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-bold text-blue-600 bg-blue-100 px-2 py-0.5 rounded uppercase tracking-wider">Documento</span>
                        <span className="text-sm font-bold text-indigo-900">{doc.nup}</span>
                      </div>
                      <p className="text-xs text-indigo-800 font-medium">{doc.description}</p>
                      <p className="text-[10px] text-indigo-500 font-bold uppercase mt-1 italic">Destino: {sectors.find(s => s.id === doc.destinationSectorId)?.name || 'Setor Externo'}</p>
                   </div>
                   <div className="flex gap-2">
                     <button 
                      onClick={() => onCancelDoc(doc.id)}
                      className="px-5 py-2 border border-blue-200 text-blue-600 hover:bg-white rounded-xl text-[10px] font-black uppercase tracking-widest transition"
                     >
                       Cancelar Tramitação
                     </button>
                   </div>
                </div>
              ))}
           </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {permissions.includes('doc_view') && (
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
            <h3 className="text-lg font-bold text-slate-800 mb-6">Últimos Documentos</h3>
          <div className="space-y-4">
            {docs.length === 0 ? (
              <p className="text-slate-400 text-sm italic">Nenhum documento no setor.</p>
            ) : (
              docs.slice(-5).reverse().map(doc => (
                <button 
                  key={doc.id} 
                  onClick={() => onSelectDoc(doc.id)}
                  className="w-full flex items-center gap-4 p-4 hover:bg-indigo-50/50 rounded-2xl transition border border-transparent hover:border-indigo-100 text-left group"
                >
                  <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-slate-700 truncate group-hover:text-indigo-700 transition-colors">{doc.description}</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase">{doc.nup} (Documento)</p>
                  </div>
                </button>
              ))
            )}
            </div>
          </div>
        )}

        {permissions.includes('proc_view') && (
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
            <h3 className="text-lg font-bold text-slate-800 mb-6">Processos Recentes</h3>
          <div className="space-y-4">
             {processes.length === 0 ? (
              <p className="text-slate-400 text-sm italic">Nenhum processo no setor.</p>
            ) : (
              processes.slice(-5).reverse().map(proc => (
                <button 
                  key={proc.id} 
                  onClick={() => onSelectProc(proc.id)}
                  className="w-full flex items-center gap-4 p-4 hover:bg-indigo-50/50 rounded-2xl transition border border-transparent hover:border-indigo-100 text-left group"
                >
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-slate-700 truncate group-hover:text-indigo-700 transition-colors">{proc.description}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-[9px] px-1.5 py-0.5 rounded font-black uppercase ${proc.status === 'Aberto' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}`}>
                        {proc.status}
                      </span>
                      <span className="text-[9px] text-slate-400 font-bold">{proc.nup} (Processo)</span>
                    </div>
                  </div>
                </button>
              ))
            )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
