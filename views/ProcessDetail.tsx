
import React, { useState, useEffect, useMemo } from 'react';
import { Process, Document, Interested, DocType, Sector, User, ArchivalClassification, CoverTemplate, Permission, AccessLevelConfig } from '../types';
import { generateId, base64ToBlobUrl } from '../utils';

interface ProcessDetailProps {
  process: Process;
  allProcesses: Process[];
  documents: Document[];
  allSectorDocs: Document[];
  interested: Interested[];
  docTypes: DocType[];
  sectors: Sector[];
  users: User[];
  currentUser: User;
  currentSectorId: string;
  classifications: ArchivalClassification[];
  accessLevels: AccessLevelConfig[];
  userPermissions: Permission[];
  coverTemplate?: CoverTemplate;
  onSelectDoc: (id: string) => void;
  onUpdate: (proc: Process) => Promise<boolean>;
  onCancelTramitation: (id: string) => Promise<boolean>;
  onUpdateDocs: (docs: Document[]) => Promise<boolean>;
  onUpdateProcs: (procs: Process[]) => Promise<boolean>;
  onNavigateBack: () => void;
  onLogAccess: (id: string, nup: string, type: 'Documento' | 'Processo') => void;
  onIncludeNewDoc: (procId: string) => void;
}

type TreeViewItem = {
  id: string;
  label: string;
  type: 'process' | 'document' | 'file' | 'cover';
  content?: string;
  children?: TreeViewItem[];
};

const ProcessDetail: React.FC<ProcessDetailProps> = ({ 
  process, allProcesses, documents, allSectorDocs, interested, docTypes, sectors, users, currentUser, currentSectorId, classifications, accessLevels, userPermissions, coverTemplate, onSelectDoc, onUpdate, onCancelTramitation, onUpdateDocs, onUpdateProcs, onNavigateBack, onLogAccess, onIncludeNewDoc
}) => {
  const [viewMode, setViewMode] = useState<'data' | 'viewer'>('data');
  const [selectedItem, setSelectedItem] = useState<TreeViewItem | null>(null);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set([process.id]));
  const [activeModal, setActiveModal] = useState<'tramitar' | 'anexar' | 'arquivar' | 'editar' | null>(null);
  const [selectedItemId, setSelectedItemId] = useState('');
  const canCancelTramitation = process.isPendingReception && process.senderSectorId === currentSectorId;

  const [archiveForm, setArchiveForm] = useState({
    classificationId: process.archivalClassificationId || ''
  });

  const [editForm, setEditForm] = useState({ 
    description: process.description,
    classificationId: process.archivalClassificationId || '',
    interestedIds: process.interestedIds || []
  });

  const [interestedSearch, setInterestedSearch] = useState('');
  const canUnannexProcess = userPermissions.includes('proc_unannex') || userPermissions.includes('proc_unannex_others');
  const canManageArchive = userPermissions.includes('archive_manage');
  const isArchiveSectorMatch = (process.archivedSectorId ?? process.sectorId) === currentSectorId;
  const canArchiveProcess = canManageArchive && !process.isArchived && process.sectorId === currentSectorId;
  const canUnarchiveProcess = canManageArchive && process.isArchived && isArchiveSectorMatch;
  const processAttachments = process.attachments || [];
  const processHistory = process.history || [];

  useEffect(() => {
    onLogAccess(process.id, process.nup, 'Processo');
  }, [process.id]);

  // Ao entrar no modo visualizador, seleciona a capa por padrão se existir
  useEffect(() => {
    if (viewMode === 'viewer' && !selectedItem) {
        if (coverTemplate) {
            setSelectedItem({ id: `cover-${process.id}`, label: 'CAPA DO PROCESSO', type: 'cover', content: coverTemplate.content });
        } else if (processAttachments.length > 0) {
            const firstAttachment = processAttachments[0];
            setSelectedItem({ id: firstAttachment.id, label: firstAttachment.name, type: 'file', content: firstAttachment.content });
        } else if (documents.length > 0) {
            const first = documents[0];
            setSelectedItem({ id: first.id, label: first.nup, type: 'document', content: first.fileContent });
        }
    }
  }, [viewMode, coverTemplate, documents, processAttachments, process.id, selectedItem]);
  
  const viewerUrl = useMemo(() => {
    if (!selectedItem?.content) return null;
    if (selectedItem.type === 'cover' || selectedItem.type === 'process') return null; 
    // Se for uma string base64 ou data:url, converte para Blob URL
    if (selectedItem.content.includes('base64') || selectedItem.content.length > 1000) {
      return base64ToBlobUrl(selectedItem.content);
    }
    return selectedItem.content;
  }, [selectedItem]);

  const allProcessDocs = useMemo(() => {
    return documents.filter(d => d.processId === process.id).sort((a,b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }, [documents, process.id]);

  const treeData = useMemo(() => {
    const buildTree = (proc: Process): TreeViewItem => {
      const procDocs = documents.filter(d => d.processId === proc.id);
      const childProcs = allProcesses.filter(p => p.parentProcessId === proc.id);
      const items: TreeViewItem[] = [];
      
      // Sempre coloca a capa no topo da árvore do processo principal
      if (proc.id === process.id && coverTemplate) {
          items.push({ id: `cover-${proc.id}`, label: `CAPA DO PROCESSO.pdf`, type: 'cover', content: coverTemplate.content });
      }

      if (proc.id === process.id) {
        (proc.attachments || []).forEach((attachment) => {
          items.push({
            id: attachment.id,
            label: `[ANEXO] ${attachment.name}`,
            type: 'file',
            content: attachment.content,
          });
        });
      }

      procDocs.forEach(doc => {
        items.push({ 
          id: doc.id, 
          label: `${doc.nup}`, 
          type: 'document', 
          content: doc.fileContent,
          children: (doc.attachments || []).map((att, idx) => ({ 
            id: `att-${doc.id}-${idx}`, 
            label: `[PEÇA] ${att.name}`, 
            type: 'file', 
            content: att.content 
          }))
        });
      });
      childProcs.forEach(cp => { items.push({ ...buildTree(cp), label: `${cp.nup} (Processo Filho)` }); });
      return { id: proc.id, label: `${proc.nup}`, type: 'process', children: items };
    };
    return buildTree(process);
  }, [process, documents, allProcesses, coverTemplate]);

  // Função para processar as tags da capa em tempo de execução
  const renderCoverHTML = (html: string) => {
    let output = html || '';
    const interNames = interested.filter(i => process.interestedIds.includes(i.id)).map(i => i.name).join(', ') || 'NÃO INFORMADO';
    const sectorName = sectors.find(s => s.id === process.sectorId)?.name || 'N/A';
    const className = classifications.find(c => c.id === process.archivalClassificationId)?.name || 'NÃO DEFINIDA';

    output = output.replace(/{{NUP}}/g, process.nup);
    output = output.replace(/{{ASSUNTO}}/g, process.description.toUpperCase());
    output = output.replace(/{{INTERESSADO}}/g, interNames.toUpperCase());
    output = output.replace(/{{DATA}}/g, new Date(process.createdAt).toLocaleDateString('pt-BR'));
    output = output.replace(/{{SETOR}}/g, sectorName.toUpperCase());
    output = output.replace(/{{CLASSIFICACAO}}/g, className.toUpperCase());
    
    // Limpeza de tags de estilo que podem vir do editor
    output = output.replace(/<span class="tag-atom[^>]*>(.*?)<\/span>/g, '$1');
    
    return output;
  };

  const handleTramitar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItemId) return;
    const dest = sectors.find(s => s.id === selectedItemId);
    const success = await onUpdate({
      ...process, 
      isPendingReception: true, 
      senderSectorId: process.sectorId,
      destinationSectorId: selectedItemId,
      status: 'Tramitado',
      history: [...(process.history || []), { id: generateId(), userId: currentUser.id, userName: currentUser.name, action: `TRAMITADO PARA: ${dest?.name} (AGUARDANDO ACEITE)`, timestamp: new Date().toISOString() }]
    });
    if (success) onNavigateBack();
  };

  const handleAnexar = async (e: React.FormEvent) => {
    e.preventDefault();
    const docToAnnex = allSectorDocs.find(d => d.id === selectedItemId);
    if (!docToAnnex) return;
    const updatedDoc: Document = { 
      ...docToAnnex, 
      processId: process.id, 
      annexedAt: new Date().toISOString(), 
      annexedByUserId: currentUser.id,
      comments: [...(docToAnnex.comments || []), { id: generateId(), userId: currentUser.id, userName: currentUser.name, text: `ANEXADO AO PROCESSO ${process.nup}`, timestamp: new Date().toISOString() }]
    };
    const success = await onUpdate({ ...process, history: [...(process.history || []), { id: generateId(), userId: currentUser.id, userName: currentUser.name, action: `ANEXAÇÃO DA PEÇA ${docToAnnex.nup}`, timestamp: new Date().toISOString() }] });
    if (success) { await onUpdateDocs([updatedDoc]); setActiveModal(null); setSelectedItemId(''); }
  };

  const handleDesanexarDocumento = async (docToDetach: Document) => {
    if (!canUnannexProcess) return;

    const success = await onUpdate({
      ...process,
      history: [...(process.history || []), {
        id: generateId(),
        userId: currentUser.id,
        userName: currentUser.name,
        action: `DESANEXAÇÃO DO DOCUMENTO ${docToDetach.nup}`,
        timestamp: new Date().toISOString()
      }]
    });
    if (!success) return;

    const updatedDoc: Document = {
      ...docToDetach,
      processId: undefined,
      annexedAt: undefined,
      annexedByUserId: undefined,
      comments: [...(docToDetach.comments || []), {
        id: generateId(),
        userId: currentUser.id,
        userName: currentUser.name,
        text: `DESANEXADO DO PROCESSO ${process.nup}`,
        timestamp: new Date().toISOString()
      }]
    };
    await onUpdateDocs([updatedDoc]);
  };

  const handleDesanexarTudo = async () => {
    if (!canUnannexProcess) return;
    const attachedDocs = allProcessDocs.filter((d) => d.processId === process.id);
    if (attachedDocs.length === 0) return;

    const success = await onUpdate({
      ...process,
      history: [...(process.history || []), {
        id: generateId(),
        userId: currentUser.id,
        userName: currentUser.name,
        action: `DESANEXAÇÃO EM LOTE DE ${attachedDocs.length} DOCUMENTO(S)`,
        timestamp: new Date().toISOString()
      }]
    });
    if (!success) return;

    await onUpdateDocs(attachedDocs.map((docToDetach) => ({
      ...docToDetach,
      processId: undefined,
      annexedAt: undefined,
      annexedByUserId: undefined,
      comments: [...(docToDetach.comments || []), {
        id: generateId(),
        userId: currentUser.id,
        userName: currentUser.name,
        text: `DESANEXADO EM LOTE DO PROCESSO ${process.nup}`,
        timestamp: new Date().toISOString()
      }]
    })));
    setSelectedItemId('');
  };

  const handleArquivar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!archiveForm.classificationId) {
      alert("Por favor, selecione tanto a classificação quanto o contrato.");
      return;
    }
    const success = await onUpdate({
      ...process, 
      isArchived: true, 
      status: 'Arquivado', 
      archivedAt: new Date().toISOString(),
      archivedByUserId: currentUser.id,
      archivedSectorId: currentSectorId,
      archivalClassificationId: archiveForm.classificationId, 
      history: [...(process.history || []), { id: generateId(), userId: currentUser.id, userName: currentUser.name, action: 'ARQUIVAMENTO REALIZADO', timestamp: new Date().toISOString() }]
    });
    if (success) { setActiveModal(null); onNavigateBack(); }
  };

  const handleDesarquivar = async () => {
    if (!canUnarchiveProcess) return;
    if (!confirm('Deseja desarquivar este processo?')) return;
    const success = await onUpdate({
      ...process,
      isArchived: false,
      status: 'Aberto',
      archivedAt: undefined,
      archivedByUserId: undefined,
      archivedSectorId: undefined,
      history: [...(process.history || []), { id: generateId(), userId: currentUser.id, userName: currentUser.name, action: 'DESARQUIVAMENTO REALIZADO', timestamp: new Date().toISOString() }]
    });
    if (success) onNavigateBack();
  };

  const toggleNode = (id: string) => {
    setExpandedNodes(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const TreeItem: React.FC<{ item: TreeViewItem, level: number }> = ({ item, level }) => {
    const isSelected = selectedItem?.id === item.id;
    const hasChildren = item.children && item.children.length > 0;
    return (
      <div className="select-none">
        <div 
          onClick={() => { if (hasChildren) toggleNode(item.id); setSelectedItem(item); }} 
          style={{ paddingLeft: `${level * 16 + 12}px` }} 
          className={`flex items-center gap-2 py-2.5 cursor-pointer hover:bg-slate-100 border-l-4 transition-all ${isSelected ? 'bg-indigo-50 border-indigo-600 text-indigo-700 font-black italic' : 'border-transparent text-slate-600'}`} 
        >
          <div className="shrink-0">
            {item.type === 'cover' ? <svg className="w-4 h-4 text-amber-500" fill="currentColor" viewBox="0 0 20 20"><path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" /><path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" /></svg> : 
             item.type === 'document' ? <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg> :
             item.type === 'file' ? <svg className="w-3 h-3 text-slate-400" fill="currentColor" viewBox="0 0 20 20"><path d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" /></svg> :
             <svg className="w-4 h-4 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /></svg>}
          </div>
          <span className="text-[10px] truncate uppercase tracking-tighter">{item.label}</span>
        </div>
        {expandedNodes.has(item.id) && hasChildren && <div>{item.children!.map(child => <TreeItem key={child.id} item={child} level={level + 1} />)}</div>}
      </div>
    );
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 animate-in fade-in duration-300">
      <div className="h-20 bg-white border-b border-slate-200 px-8 flex items-center justify-between sticky top-0 z-40 shadow-sm text-black">
        <div className="flex items-center gap-4">
          <button onClick={onNavigateBack} className="p-2 text-slate-400 hover:text-indigo-600 transition"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" /></svg></button>
          <h1 className="text-xl font-black text-slate-800 uppercase tracking-tighter italic">{process.nup}</h1>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setViewMode(viewMode === 'data' ? 'viewer' : 'data')} className="bg-indigo-600 text-white px-6 py-2 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-lg hover:bg-black transition-all">
            {viewMode === 'data' ? 'Visualizar' : 'Ver Metadados'}
          </button>
          {!process.isArchived && (
            <>
              {userPermissions.includes('doc_create') && (
                <button onClick={() => onIncludeNewDoc(process.id)} className="bg-white border border-indigo-200 text-indigo-600 px-5 py-2 rounded-xl font-black uppercase text-[10px] tracking-widest">Novo Doc</button>
              )}
              
              {userPermissions.includes('proc_edit') && (
                <button onClick={() => { 
                  setEditForm({ 
                    description: process.description,
                    classificationId: process.archivalClassificationId || '',
                    interestedIds: process.interestedIds || []
                  }); 
                  setActiveModal('editar'); 
                }} className="bg-white border border-slate-200 text-slate-700 px-5 py-2 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-sm hover:shadow-md transition">Editar</button>
              )}
              
              {userPermissions.includes('proc_annex') && (
                <button onClick={() => setActiveModal('anexar')} className="bg-white border border-slate-200 text-slate-700 px-5 py-2 rounded-xl font-black uppercase text-[10px] tracking-widest">Anexar</button>
              )}
              
              {userPermissions.includes('proc_tramitar') && (
                <button onClick={() => setActiveModal('tramitar')} className="bg-white border border-slate-200 text-slate-700 px-5 py-2 rounded-xl font-black uppercase text-[10px] tracking-widest">Tramitar</button>
              )}

              {canCancelTramitation && (
                <button
                  onClick={async () => {
                    const success = await onCancelTramitation(process.id);
                    if (success) onNavigateBack();
                  }}
                  className="bg-amber-50 border border-amber-200 text-amber-700 px-5 py-2 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-amber-100 transition"
                >
                  Cancelar Tramitação
                </button>
              )}
              
              {canArchiveProcess && (
                <button onClick={() => setActiveModal('arquivar')} className="bg-amber-600 text-white px-5 py-2 rounded-xl font-black uppercase text-[10px] tracking-widest">Arquivar</button>
              )}
              {canUnarchiveProcess && (
                <button onClick={handleDesarquivar} className="bg-emerald-600 text-white px-5 py-2 rounded-xl font-black uppercase text-[10px] tracking-widest">Desarquivar</button>
              )}
            </>
          )}
        </div>
      </div>

      {viewMode === 'data' ? (
        <div className="p-8 max-w-6xl mx-auto w-full grid grid-cols-1 lg:grid-cols-3 gap-8 text-black">
           <div className="lg:col-span-2 bg-white p-10 rounded-[32px] shadow-sm border border-slate-200 min-h-[500px]">
              <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tighter mb-8 italic">Capa Administrativa</h2>
              <div className="space-y-8">
                 <div><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Assunto Principal</label><p className="text-xl font-bold text-slate-800 uppercase leading-relaxed">{process.description}</p></div>
                 <div className="grid grid-cols-2 gap-8">
                    <div><label className="text-[10px] font-black text-slate-400 uppercase block mb-1">Classificação</label><p className="font-bold text-slate-700 uppercase">{classifications.find(c => c.id === process.archivalClassificationId)?.name || 'NÃO DEFINIDA'}</p></div>
                 </div>
                 {process.isWebProtocol ? (
                   <div className="rounded-3xl border border-rose-100 bg-rose-50 p-5">
                     <div className="flex flex-wrap items-center justify-between gap-3">
                       <div>
                         <p className="text-[10px] font-black uppercase tracking-widest text-rose-500">Protocolo Web</p>
                         <p className="mt-1 font-bold text-rose-900">
                           {process.webProtocolStatus === 'AguardandoResposta'
                             ? 'Aguardando resposta da pendencia'
                             : process.webProtocolStatus === 'RespostaEnviada'
                               ? 'Resposta de pendencia enviada'
                             : process.webProtocolStatus || 'Pendente'}
                         </p>
                       </div>
                       {process.webProtocolPendingType ? (
                         <span className="rounded-full border border-rose-200 bg-white px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-rose-700">
                           {process.webProtocolPendingType}
                         </span>
                       ) : null}
                     </div>
                     {process.webProtocolMessage ? <p className="mt-3 text-sm font-medium text-rose-800">{process.webProtocolMessage}</p> : null}
                     {process.webProtocolPendingResponseText ? (
                       <div className="mt-4 rounded-2xl border border-indigo-100 bg-white px-4 py-3">
                         <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-500">Resposta de informação</p>
                         <p className="mt-2 text-sm font-medium text-slate-700">{process.webProtocolPendingResponseText}</p>
                       </div>
                     ) : null}
                     {process.webProtocolPendingResponseFileName ? (
                       <div className="mt-4 rounded-2xl border border-indigo-100 bg-white px-4 py-3">
                         <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-500">Anexo da pendência documental</p>
                         <p className="mt-2 text-sm font-medium text-slate-700">{process.webProtocolPendingResponseFileName}</p>
                       </div>
                     ) : null}
                   </div>
                 ) : null}
                 <div><label className="text-[10px] font-black text-slate-400 uppercase block mb-3">Interessados</label>
                   <div className="flex flex-wrap gap-2">{interested.filter(i => process.interestedIds.includes(i.id)).map(i => <span key={i.id} className="bg-slate-100 px-3 py-1 rounded-lg text-[10px] font-bold text-slate-600 uppercase">{i.name}</span>)}</div>
                 </div>
              </div>
           </div>
           <div className="bg-white p-8 rounded-[32px] shadow-sm border border-slate-200 overflow-y-auto max-h-[600px] custom-scrollbar">
              <h3 className="text-xs font-black text-indigo-600 uppercase mb-8 tracking-widest">Histórico</h3>
              <div className="space-y-6 relative before:absolute before:left-2 before:top-2 before:bottom-2 before:w-px before:bg-slate-100">
                {processHistory.slice().reverse().map((h, i) => (
                  <div key={i} className="relative pl-6">
                    <div className="absolute left-0 top-1 w-4 h-4 rounded-full bg-white border-4 border-indigo-600"></div>
                    <p className="text-[9px] font-black text-slate-400 uppercase">{new Date(h.timestamp).toLocaleString()}</p>
                    <p className="text-[10px] font-bold text-slate-700 uppercase">{h.action}</p>
                  </div>
                ))}
              </div>
           </div>
        </div>
      ) : (
        <div className="flex-1 flex overflow-hidden bg-[#525659]">
          <div className="w-72 bg-white border-r border-slate-300 overflow-y-auto custom-scrollbar shadow-inner shrink-0">
            <div className="p-4 bg-slate-50 border-b font-black text-[10px] uppercase tracking-widest text-slate-400">Dossiê Eletrônico</div>
            <TreeItem item={treeData} level={0} />
          </div>
          <div className="flex-1 p-10 flex flex-col items-center overflow-y-auto custom-scrollbar">
             {selectedItem?.type === 'process' ? (
                <div className="w-full max-w-[900px] space-y-12 pb-20">
                    <div className="bg-indigo-900/10 p-6 rounded-3xl border border-indigo-200/50 backdrop-blur-sm mb-8 text-center">
                        <h2 className="text-xl font-black text-indigo-900 uppercase italic tracking-tighter">Dossiê Completo: {process.nup}</h2>
                        <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-[0.3em] mt-1">Visualização Unificada de Capa e Peças</p>
                    </div>

                    {coverTemplate && (
                        <div className="space-y-4 pb-12">
                            <div className="flex items-center gap-4 bg-white/80 backdrop-blur px-6 py-3 rounded-2xl border border-slate-200 shadow-sm sticky top-0 z-10">
                                <div className="w-8 h-8 rounded-xl bg-amber-500 flex items-center justify-center text-white font-black text-xs italic">CAPA</div>
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">PROCESSO {process.nup}</p>
                                    <p className="text-xs font-bold text-slate-700 uppercase">Capa Administrativa</p>
                                </div>
                            </div>
                            <div className="bg-white shadow-2xl w-full min-h-[1100px] p-20 rounded-2xl">
                                <div className="prose max-w-none font-serif text-black" dangerouslySetInnerHTML={{ __html: renderCoverHTML(coverTemplate.content || '') }} />
                            </div>
                        </div>
                    )}

                    {processAttachments.length > 0 && (
                      <div className="space-y-4 pb-12">
                        <div className="flex items-center gap-4 bg-white/80 backdrop-blur px-6 py-3 rounded-2xl border border-slate-200 shadow-sm sticky top-0 z-10">
                          <div className="w-8 h-8 rounded-xl bg-slate-900 flex items-center justify-center text-white font-black text-xs italic">PDF</div>
                          <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">PROCESSO {process.nup}</p>
                            <p className="text-xs font-bold text-slate-700 uppercase">Anexos enviados pelo cidadao</p>
                          </div>
                        </div>
                        {processAttachments.map((attachment, idx) => (
                          <div key={attachment.id} className="space-y-4 pt-12 border-t-4 border-slate-900/10 first:border-t-0 first:pt-0">
                            <div className="flex items-center gap-4 bg-white/80 backdrop-blur px-6 py-3 rounded-2xl border border-slate-200 shadow-sm sticky top-0 z-10">
                              <div className="w-8 h-8 rounded-xl bg-slate-900 flex items-center justify-center text-white font-black text-xs italic">{idx + 1}</div>
                              <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{attachment.fieldLabel || 'Anexo'}</p>
                                <p className="text-xs font-bold text-slate-700 uppercase">{attachment.name}</p>
                              </div>
                            </div>
                            <iframe
                              src={base64ToBlobUrl(attachment.content)}
                              className="w-full h-[1100px] bg-white shadow-2xl rounded-2xl border-0 overflow-hidden"
                            />
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {allProcessDocs.map((doc, idx) => (
                        <div key={doc.id} className="space-y-4 pt-12 border-t-4 border-indigo-900/10 first:border-t-0 first:pt-0">
                            <div className="flex items-center gap-4 bg-white/80 backdrop-blur px-6 py-3 rounded-2xl border border-slate-200 shadow-sm sticky top-0 z-10">
                                <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-black text-xs italic">{idx + 1}</div>
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{doc.nup}</p>
                                    <p className="text-xs font-bold text-slate-700 uppercase">{doc.description}</p>
                                </div>
                            </div>
                            <iframe 
                                src={base64ToBlobUrl(doc.fileContent || '')} 
                                className="w-full h-[1100px] bg-white shadow-2xl rounded-2xl border-0 overflow-hidden" 
                            />
                        </div>
                    ))}
                </div>
             ) : selectedItem?.type === 'cover' ? (
                <div className="bg-white shadow-2xl w-[850px] min-h-[1100px] p-20 animate-in zoom-in-95 duration-500 rounded-sm">
                   <div className="prose max-w-none font-serif text-black" dangerouslySetInnerHTML={{ __html: renderCoverHTML(selectedItem.content || '') }} />
                </div>
             ) : viewerUrl ? (
                <iframe src={viewerUrl} className="w-full max-w-[900px] h-[1200px] bg-white shadow-2xl rounded border-0" />
             ) : (
                <div className="text-white/20 font-black uppercase tracking-widest mt-20 flex flex-col items-center">
                   <svg className="w-16 h-16 mb-4 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                   Selecione um item na árvore lateral
                </div>
             )}
          </div>
        </div>
      )}

      {activeModal === 'tramitar' && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4 text-black">
           <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95">
              <div className="p-6 border-b flex justify-between items-center bg-slate-50 font-black uppercase text-sm italic">Tramitar Processo<button onClick={() => setActiveModal(null)} className="ml-auto">✕</button></div>
              <form onSubmit={handleTramitar} className="p-8 space-y-6">
                <select required value={selectedItemId} onChange={e => setSelectedItemId(e.target.value)} className="w-full p-4 border border-slate-200 rounded-2xl bg-slate-50 text-xs font-black outline-none">
                  <option value="">Selecione o destino...</option>
                  {sectors.filter(s => s.id !== process.sectorId).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
                <button type="submit" className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl hover:bg-black transition">Confirmar Envio</button>
              </form>
           </div>
        </div>
      )}

      {activeModal === 'anexar' && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4 text-black">
           <div className="bg-white rounded-[40px] shadow-2xl w-full max-w-xl overflow-hidden animate-in zoom-in-95 flex flex-col max-h-[85vh]">
              <div className="p-6 border-b flex justify-between items-center bg-slate-50 font-black uppercase text-sm italic">Anexar Peça do Setor<button onClick={() => setActiveModal(null)} className="ml-auto">✕</button></div>
              <div className="p-8 space-y-6 overflow-y-auto custom-scrollbar">
                {canUnannexProcess && allProcessDocs.length > 0 && (
                  <div className="rounded-3xl border border-rose-200 bg-rose-50 p-5">
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.25em] text-rose-700">Desanexação</p>
                        <p className="mt-1 text-sm font-semibold text-rose-900">Remova documentos já anexados a este processo.</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => void handleDesanexarTudo()}
                        className="rounded-2xl border border-rose-300 bg-white px-4 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-rose-700 transition hover:bg-rose-100"
                      >
                        Desanexar Tudo
                      </button>
                    </div>
                    <div className="mt-4 space-y-3">
                      {allProcessDocs.map((attachedDoc) => (
                        <div key={attachedDoc.id} className="rounded-2xl border border-rose-200 bg-white px-4 py-3">
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <p className="text-sm font-black uppercase tracking-tight text-slate-900">{attachedDoc.nup}</p>
                              <p className="text-xs text-slate-500">{attachedDoc.description}</p>
                            </div>
                            <button
                              type="button"
                              onClick={() => void handleDesanexarDocumento(attachedDoc)}
                              className="rounded-2xl border border-rose-200 px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-rose-700 transition hover:bg-rose-50"
                            >
                              Desanexar
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <select required value={selectedItemId} onChange={e => setSelectedItemId(e.target.value)} className="w-full p-4 border border-slate-200 rounded-2xl bg-white text-xs font-black outline-none shadow-sm">
                   <option value="">Selecione um documento do setor...</option>
                   {allSectorDocs.map(d => <option key={d.id} value={d.id}>{d.nup} - {d.description.slice(0,60)}...</option>)}
                </select>
                <button onClick={handleAnexar} disabled={!selectedItemId} className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg hover:bg-black transition disabled:opacity-50">Confirmar Anexação</button>
              </div>
           </div>
        </div>
      )}

      {activeModal === 'arquivar' && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4 text-black">
           <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95">
              <div className="p-6 border-b flex justify-between items-center bg-amber-50 font-black uppercase text-sm italic text-amber-800">Finalizar Dossiê (Arquivamento)<button onClick={() => setActiveModal(null)} className="ml-auto text-black">✕</button></div>
              <form onSubmit={handleArquivar} className="p-8 space-y-6">
                 <div>
                   <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Classificação Arquivística *</label>
                   <select required value={archiveForm.classificationId} onChange={e => setArchiveForm({...archiveForm, classificationId: e.target.value})} className="w-full p-4 border border-slate-200 rounded-2xl bg-slate-50 text-xs font-black outline-none">
                      <option value="">Selecione a Classificação...</option>
                      {classifications.map(c => <option key={c.id} value={c.id}>{c.code} - {c.name}</option>)}
                   </select>
                 </div>
                 <div>
                 </div>
                 <button type="submit" className="w-full bg-amber-600 text-white py-4 rounded-2xl font-black uppercase text-xs shadow-xl hover:bg-black transition">Confirmar Arquivamento</button>
              </form>
           </div>
        </div>
      )}

      {activeModal === 'editar' && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4 text-black">
           <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95">
              <div className="p-6 border-b flex justify-between items-center bg-slate-50 font-black uppercase text-sm italic">Editar Metadados do Processo<button onClick={() => setActiveModal(null)} className="ml-auto">✕</button></div>
              <form onSubmit={async (e) => {
                e.preventDefault();
                const success = await onUpdate({
                  ...process,
                  description: editForm.description,
                  archivalClassificationId: editForm.classificationId,
                  interestedIds: editForm.interestedIds,
                  history: [...(process.history || []), { id: generateId(), userId: currentUser.id, userName: currentUser.name, action: `ALTERAÇÃO TOTAL DE METADADOS: ${editForm.description.toUpperCase()}`, timestamp: new Date().toISOString() }]
                });
                if (success) setActiveModal(null);
              }} className="p-8 space-y-6 overflow-y-auto max-h-[80vh] custom-scrollbar">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Assunto Principal *</label>
                    <textarea required value={editForm.description} onChange={e => setEditForm({...editForm, description: e.target.value})} className="w-full p-4 border border-slate-200 rounded-2xl bg-slate-50 text-xs font-bold outline-none h-24" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Classificação Arquivística</label>
                    <select value={editForm.classificationId} onChange={e => setEditForm({...editForm, classificationId: e.target.value})} className="w-full p-4 border border-slate-200 rounded-2xl bg-slate-50 text-xs font-bold outline-none">
                      <option value="">Nenhuma</option>
                      {classifications.map(c => <option key={c.id} value={c.id}>{c.code} - {c.name}</option>)}
                    </select>
                  </div>
                </div>

                <div>
                   <div className="flex items-center justify-between mb-3 px-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Interessados</label>
                      <div className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200">
                         <svg className="w-3 h-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                         <input 
                          type="text" 
                          placeholder="FILTRAR NOMES..." 
                          value={interestedSearch} 
                          onChange={e => setInterestedSearch(e.target.value)} 
                          className="bg-transparent border-none outline-none text-[9px] font-black uppercase w-32 placeholder:text-slate-300"
                         />
                      </div>
                   </div>
                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto p-4 bg-slate-50 rounded-2xl border border-slate-100 custom-scrollbar">
                      {interested.filter(i => i.name.toLowerCase().includes(interestedSearch.toLowerCase())).map(i => (
                        <label key={i.id} className="flex items-center gap-3 cursor-pointer group">
                           <input 
                            type="checkbox" 
                            checked={editForm.interestedIds.includes(i.id)} 
                            onChange={e => {
                               const ids = e.target.checked 
                                ? [...editForm.interestedIds, i.id] 
                                : editForm.interestedIds.filter(x => x !== i.id);
                               setEditForm({...editForm, interestedIds: ids});
                            }}
                            className="w-4 h-4 rounded-lg text-indigo-600 border-slate-300 focus:ring-indigo-500"
                           />
                           <span className="text-[10px] font-bold text-slate-600 uppercase group-hover:text-indigo-600 transition-colors">{i.name}</span>
                        </label>
                      ))}
                   </div>
                </div>

                <div className="pt-4">
                  <button type="submit" className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black uppercase text-xs shadow-xl hover:bg-black transition">Salvar Alterações</button>
                </div>
              </form>
           </div>
        </div>
      )}
    </div>
  );
};

export default ProcessDetail;
