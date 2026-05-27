
import React, { useState, useEffect, useMemo } from 'react';
import { Document, DocType, Interested, Sector, User, ArchivalClassification, Permission, AccessLevelConfig, DigitalSignature } from '../types';
import { generateId, fileToBase64, base64ToBlobUrl, sha256FromString } from '../utils';
import { MASTER_CPF } from '../constants';

interface DocumentDetailProps {
  doc: Document;
  docTypes: DocType[];
  interested: Interested[];
  sectors: Sector[];
  users: User[];
  classifications: ArchivalClassification[];
  accessLevels: AccessLevelConfig[];
  allDocs: Document[];
  userPermissions: Permission[];
  currentUser: User;
  currentSectorId: string;
  onUpdate: (doc: Document) => Promise<boolean>;
  onCancelTramitation: (id: string) => Promise<boolean>;
  onAutuar: () => void;
  onRespond: () => void;
  onNavigateBack: () => void;
  onLogAccess: (id: string, nup: string, type: 'Documento' | 'Processo') => void;
}

type TreeViewItem = {
  id: string;
  label: string;
  type: 'document' | 'file' | 'child_doc';
  content?: string;
  children?: TreeViewItem[];
};

const DocumentDetail: React.FC<DocumentDetailProps> = ({ 
  doc, docTypes, interested, sectors, users, classifications, accessLevels, allDocs, userPermissions, currentUser, currentSectorId, onUpdate, onCancelTramitation, onAutuar, onRespond, onNavigateBack, onLogAccess 
}) => {
  const [viewMode, setViewMode] = useState<'data' | 'viewer'>('data');
  const [selectedItem, setSelectedItem] = useState<TreeViewItem | null>(null);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set(['root']));
  const [activeModal, setActiveModal] = useState<'tramitar' | 'arquivar' | 'anexar' | 'arquivo_digital' | 'editar' | null>(null);
  const [selectedSectorId, setSelectedSectorId] = useState('');
  const canCancelTramitation = doc.isPendingReception && doc.senderSectorId === currentSectorId;
  const [selectedDocIdToAnnex, setSelectedDocIdToAnnex] = useState('');
  const [isReadingFile, setIsReadingFile] = useState(false);
  const [isSigning, setIsSigning] = useState(false);
  const [currentFileHash, setCurrentFileHash] = useState<string>('');
  const [editForm, setEditForm] = useState({ 
    description: doc.description, 
    typeId: doc.typeId,
    interestedIds: doc.interestedIds || [],
    accessLevelId: doc.accessLevelId || '',
    archivalClassificationId: doc.archivalClassificationId || ''
  });
  const [interestedSearch, setInterestedSearch] = useState('');

  const isAdmin = currentUser.cpf === MASTER_CPF;
  const isAuthor = currentUser.id === doc.authorId;
  const canManageFiles = isAdmin || isAuthor;
  const canManageArchive = userPermissions.includes('archive_manage');
  const isArchiveSectorMatch = (doc.archivedSectorId ?? doc.sectorId) === currentSectorId;
  const canArchiveDocument = canManageArchive && !doc.isArchived && doc.sectorId === currentSectorId;
  const canUnarchiveDocument = canManageArchive && doc.isArchived && isArchiveSectorMatch;
  const hasMainFile = Boolean(doc.fileContent);
  const docSignatures = doc.signatures || [];
  const hasSignedByCurrentUser = docSignatures.some((signature) => signature.signerUserId === currentUser.id);

  const [archiveForm, setArchiveForm] = useState({
    classificationId: doc.archivalClassificationId || ''
  });

  useEffect(() => {
    onLogAccess(doc.id, doc.nup, 'Documento');
  }, [doc.id]);

  useEffect(() => {
    if (viewMode === 'viewer' && !selectedItem && doc.fileContent) {
      setSelectedItem({ id: `main-${doc.id}`, label: `[PDF] ${doc.fileName}`, type: 'file', content: doc.fileContent });
    }
  }, [viewMode, doc, selectedItem]);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (!doc.fileContent) {
        if (!cancelled) setCurrentFileHash('');
        return;
      }
      const hash = await sha256FromString(doc.fileContent);
      if (!cancelled) setCurrentFileHash(hash);
    };
    void run();
    return () => { cancelled = true; };
  }, [doc.fileContent]);

  const viewerUrl = useMemo(() => {
    if (!selectedItem?.content) return null;
    // Se for uma string base64 ou data:url, converte para Blob URL
    if (selectedItem.content.includes('base64') || selectedItem.content.length > 1000) {
      return base64ToBlobUrl(selectedItem.content);
    }
    return selectedItem.content;
  }, [selectedItem]);

  const toggleNode = (id: string) => {
    setExpandedNodes(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const treeData = useMemo((): TreeViewItem => {
    const items: TreeViewItem[] = [];
    if (doc.fileContent) {
      items.push({ id: `main-${doc.id}`, label: `[PDF] ${doc.fileName}`, type: 'file', content: doc.fileContent });
    }
    (doc.attachments || []).forEach((att, idx) => {
      items.push({ id: `att-${idx}`, label: `[PEÇA] ${att.name}`, type: 'file', content: att.content });
    });
    const childrenDocs = allDocs.filter(d => d.parentDocId === doc.id);
    childrenDocs.forEach(cd => {
      items.push({ id: cd.id, label: `[VÍNCULO] ${cd.nup}`, type: 'child_doc', content: cd.fileContent });
    });
    return { id: 'root', label: `${doc.nup}`, type: 'document', children: items };
  }, [doc, allDocs]);

  const handleTramitar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSectorId) return;
    const success = await onUpdate({
      ...doc, 
      isPendingReception: true, 
      senderSectorId: doc.sectorId,
      destinationSectorId: selectedSectorId,
      comments: [...(doc.comments || []), { id: generateId(), userId: currentUser.id, userName: currentUser.name, text: `TRAMITADO PARA: ${sectors.find(s => s.id === selectedSectorId)?.name} (AGUARDANDO ACEITE)`, timestamp: new Date().toISOString() }]
    });
    if (success) { setActiveModal(null); onNavigateBack(); }
  };

  const handleAnexarDocumento = async (e: React.FormEvent) => {
    e.preventDefault();
    const docToAnnex = allDocs.find(d => d.id === selectedDocIdToAnnex);
    if (!docToAnnex) return;
    await onUpdate({ ...docToAnnex, parentDocId: doc.id });
    setActiveModal(null);
    setSelectedDocIdToAnnex('');
  };

  const handleArquivar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!archiveForm.classificationId) return;
    const success = await onUpdate({
      ...doc,
      isArchived: true,
      archivedAt: new Date().toISOString(),
      archivedByUserId: currentUser.id,
      archivedSectorId: currentSectorId,
      archivalClassificationId: archiveForm.classificationId,
      comments: [...(doc.comments || []), { id: generateId(), userId: currentUser.id, userName: currentUser.name, text: `ARQUIVAMENTO REALIZADO`, timestamp: new Date().toISOString() }]
    });
    if (success) { setActiveModal(null); onNavigateBack(); }
  };

  const handleDesarquivar = async () => {
    if (!canUnarchiveDocument) return;
    if (!confirm('Deseja desarquivar este documento?')) return;
    const success = await onUpdate({
      ...doc,
      isArchived: false,
      archivedAt: undefined,
      archivedByUserId: undefined,
      archivedSectorId: undefined,
      comments: [...(doc.comments || []), { id: generateId(), userId: currentUser.id, userName: currentUser.name, text: `DESARQUIVAMENTO REALIZADO`, timestamp: new Date().toISOString() }]
    });
    if (success) onNavigateBack();
  };

  const handleUploadPDF = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsReadingFile(true);
    try {
      const base64 = await fileToBase64(file);
      await onUpdate({ ...doc, attachments: [...(doc.attachments || []), { name: file.name, content: base64 }] });
    } catch (err) { alert("Erro ao ler arquivo."); } finally { setIsReadingFile(false); }
  };

  const handleRemovePDF = async (index: number) => {
    if (!confirm("Excluir este arquivo digital?")) return;
    const newAtts = [...(doc.attachments || [])];
    newAtts.splice(index, 1);
    await onUpdate({ ...doc, attachments: newAtts });
  };

  const handleSignDocument = async () => {
    if (!doc.fileContent) {
      alert('Este documento nao possui PDF principal para assinatura.');
      return;
    }
    if (hasSignedByCurrentUser) {
      alert('Voce ja assinou este documento.');
      return;
    }
    if (!confirm('Deseja assinar digitalmente este documento?')) return;

    setIsSigning(true);
    try {
      const contentHash = await sha256FromString(doc.fileContent);
      const signature: DigitalSignature = {
        id: generateId(),
        signerUserId: currentUser.id,
        signerName: currentUser.name,
        signerCpf: currentUser.cpf,
        signedAt: new Date().toISOString(),
        algorithm: 'SHA-256',
        contentHash,
        signedFileName: doc.fileName,
      };

      const success = await onUpdate({
        ...doc,
        signatures: [...docSignatures, signature],
        comments: [
          ...(doc.comments || []),
          {
            id: generateId(),
            userId: currentUser.id,
            userName: currentUser.name,
            text: `ASSINATURA DIGITAL REGISTRADA POR ${currentUser.name.toUpperCase()}`,
            timestamp: new Date().toISOString(),
          }
        ]
      });
      if (!success) return;
    } finally {
      setIsSigning(false);
    }
  };

  const TreeItem: React.FC<{ item: TreeViewItem, level: number }> = ({ item, level }) => {
    const hasChildren = item.children && item.children.length > 0;
    const isSelected = selectedItem?.id === item.id;
    return (
      <div className="select-none">
        <div onClick={() => { if (hasChildren) toggleNode(item.id); setSelectedItem(item); }} style={{ paddingLeft: `${level * 16 + 12}px` }} className={`flex items-center gap-2 py-2.5 cursor-pointer hover:bg-slate-100 border-l-4 ${isSelected ? 'bg-indigo-50 border-indigo-600 text-indigo-700 font-bold' : 'border-transparent text-slate-600'}`} >
          <span className="text-[10px] uppercase tracking-tighter truncate">{item.label}</span>
        </div>
        {expandedNodes.has(item.id) && hasChildren && <div>{item.children!.map(child => <TreeItem key={child.id} item={child} level={level + 1} />)}</div>}
      </div>
    );
  };

  return (
    <div className={`flex flex-col ${viewMode === 'viewer' ? 'h-screen' : 'min-h-screen'} bg-slate-50 animate-in fade-in duration-300`}>
      <div className="h-20 bg-white border-b border-slate-200 px-8 flex items-center justify-between sticky top-0 z-40 shadow-sm text-black">
        <div className="flex items-center gap-4">
          <button onClick={onNavigateBack} className="p-2 text-slate-400 hover:text-indigo-600 transition"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" /></svg></button>
          <h1 className="text-xl font-black text-slate-800 uppercase tracking-tighter italic">{doc.nup}</h1>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setViewMode(viewMode === 'data' ? 'viewer' : 'data')} className="bg-indigo-600 text-white px-6 py-2 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-lg hover:bg-black transition-all">
            {viewMode === 'data' ? 'Visualizar' : 'Ver Metadados'}
          </button>
          {!doc.isArchived && (
            <>
              <button onClick={() => setActiveModal('arquivo_digital')} className="bg-white border border-slate-200 text-slate-700 px-5 py-2 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-sm hover:shadow-md transition">Arquivo Digital</button>
              
              {userPermissions.includes('doc_anexar') && (
                <button onClick={() => setActiveModal('anexar')} className="bg-white border border-slate-200 text-slate-700 px-5 py-2 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-sm hover:shadow-md transition">Anexar</button>
              )}
              
              {userPermissions.includes('doc_tramitar') && (
                <button onClick={() => setActiveModal('tramitar')} className="bg-white border border-slate-200 text-slate-700 px-5 py-2 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-sm hover:shadow-md transition">Tramitar</button>
              )}

              {canCancelTramitation && (
                <button
                  onClick={async () => {
                    const success = await onCancelTramitation(doc.id);
                    if (success) onNavigateBack();
                  }}
                  className="bg-amber-50 border border-amber-200 text-amber-700 px-5 py-2 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-amber-100 transition"
                >
                  Cancelar Tramitação
                </button>
              )}
              
              {userPermissions.includes('doc_autuar') && (
                <button onClick={onAutuar} className="bg-amber-50 border border-amber-200 text-amber-700 px-5 py-2 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-amber-100 transition">Autuar</button>
              )}

              {hasMainFile && (
                <button onClick={handleSignDocument} disabled={isSigning || hasSignedByCurrentUser} className="bg-sky-50 border border-sky-200 text-sky-700 px-5 py-2 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-sky-100 transition disabled:opacity-50">
                  {isSigning ? 'Assinando...' : hasSignedByCurrentUser ? 'Assinado Por Voce' : 'Assinar Digitalmente'}
                </button>
              )}
              
              {canManageFiles && (
                <button onClick={() => { 
                  setEditForm({ 
                    description: doc.description, 
                    typeId: doc.typeId,
                    interestedIds: doc.interestedIds || [],
                    accessLevelId: doc.accessLevelId || '',
                    archivalClassificationId: doc.archivalClassificationId || ''
                  }); 
                  setActiveModal('editar'); 
                }} className="bg-white border border-slate-200 text-slate-700 px-5 py-2 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-sm hover:shadow-md transition">Editar</button>
              )}
              
              {canArchiveDocument && (
                <button onClick={() => setActiveModal('arquivar')} className="bg-rose-50 border border-rose-100 text-rose-700 px-5 py-2 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-rose-100 transition">Arquivar</button>
              )}
              {canUnarchiveDocument && (
                <button onClick={handleDesarquivar} className="bg-emerald-50 border border-emerald-100 text-emerald-700 px-5 py-2 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-emerald-100 transition">Desarquivar</button>
              )}
            </>
          )}
        </div>
      </div>

      {viewMode === 'data' ? (
        <div className="p-8 max-w-6xl mx-auto w-full grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 bg-white p-10 rounded-[32px] shadow-sm border border-slate-200 text-black">
             <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tighter mb-8 italic">Informações do Documento</h2>
             <div className="space-y-8">
                <div><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Assunto</label><p className="text-lg font-bold text-slate-800 uppercase leading-tight">{doc.description}</p></div>
                <div className="grid grid-cols-2 gap-6">
                  <div><label className="text-[10px] font-black text-slate-400 uppercase block mb-1">Tipo</label><p className="font-bold text-slate-700 uppercase">{docTypes.find(t => t.id === doc.typeId)?.name || 'N/A'}</p></div>
                  <div><label className="text-[10px] font-black text-slate-400 uppercase block mb-1">Nível de Acesso</label><p className="font-bold text-indigo-600 uppercase">{accessLevels.find(al => al.id === doc.accessLevelId)?.name || 'Padrão'}</p></div>
                </div>
                <div><label className="text-[10px] font-black text-slate-400 uppercase block mb-2">Interessados</label>
                  <div className="flex flex-wrap gap-2">{interested.filter(i => doc.interestedIds.includes(i.id)).map(i => <span key={i.id} className="bg-slate-100 px-3 py-1 rounded-lg text-[10px] font-bold text-slate-600 uppercase">{i.name}</span>)}</div>
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase block mb-2">Assinaturas Digitais</label>
                  {docSignatures.length === 0 ? (
                    <p className="text-sm font-medium text-slate-400">Nenhuma assinatura registrada.</p>
                  ) : (
                    <div className="space-y-3">
                      {docSignatures.map((signature) => {
                        const isValid = currentFileHash ? signature.contentHash === currentFileHash : true;
                        return (
                          <div key={signature.id} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                            <div className="flex items-center justify-between gap-4">
                              <div>
                                <p className="text-sm font-black text-slate-800 uppercase">{signature.signerName}</p>
                                <p className="text-[10px] font-bold text-slate-500 uppercase">CPF {signature.signerCpf}</p>
                              </div>
                              <span className={`rounded-full px-3 py-1 text-[10px] font-black uppercase ${isValid ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                                {isValid ? 'Hash Valido' : 'Arquivo Alterado'}
                              </span>
                            </div>
                            <p className="mt-2 text-[10px] font-bold text-slate-500 uppercase">{new Date(signature.signedAt).toLocaleString()} | {signature.algorithm}</p>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
             </div>
          </div>
          <div className="bg-white p-8 rounded-[32px] shadow-sm border border-slate-200 overflow-y-auto max-h-[600px] custom-scrollbar text-black">
             <h3 className="text-xs font-black text-indigo-600 uppercase mb-6 tracking-widest">Histórico</h3>
             <div className="space-y-6 relative before:absolute before:left-2 before:top-2 before:bottom-2 before:w-px before:bg-slate-100">
                {[...(doc.comments || [])].reverse().map((c, i) => (
                  <div key={i} className="relative pl-6">
                    <div className="absolute left-0 top-1 w-4 h-4 rounded-full bg-white border-4 border-indigo-600"></div>
                    <p className="text-[9px] font-black text-slate-400 uppercase">{new Date(c.timestamp).toLocaleString()}</p>
                    <p className="text-[10px] font-bold text-slate-700 uppercase">{c.text}</p>
                  </div>
                ))}
             </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex overflow-hidden bg-[#525659]">
          <div className="w-72 bg-white border-r border-slate-300 overflow-y-auto custom-scrollbar shadow-inner">
            <div className="p-4 bg-slate-50 border-b font-black text-[10px] uppercase tracking-widest text-slate-400">Estrutura Eletrônica</div>
            <TreeItem item={treeData} level={0} />
          </div>
          <div className="flex-1 flex flex-col overflow-hidden">
            {viewerUrl ? (
              <iframe src={viewerUrl} className="flex-1 w-full h-full border-0" style={{ display: 'block' }} />
            ) : <div className="text-white/20 font-black uppercase tracking-widest m-auto mt-20">Selecione uma peça para visualizar</div>}
          </div>

        </div>
      )}

      {/* MODAL: ARQUIVO DIGITAL (PDFs) */}
      {activeModal === 'arquivo_digital' && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4 text-black">
          <div className="bg-white rounded-[40px] shadow-2xl w-full max-w-xl overflow-hidden animate-in zoom-in-95 flex flex-col max-h-[85vh]">
             <div className="p-6 border-b flex justify-between items-center bg-slate-50"><h3 className="font-black uppercase text-sm italic">Gestão de Arquivo Digital</h3><button onClick={() => setActiveModal(null)}>✕</button></div>
             <div className="p-8 space-y-8 overflow-y-auto custom-scrollbar">
                <section>
                   <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Peça Original</h4>
                   {doc.fileContent ? (
                     <div className="p-4 bg-green-50 border border-green-100 rounded-2xl flex items-center justify-between">
                        <span className="text-xs font-bold text-green-800 uppercase truncate pr-4">{doc.fileName}</span>
                     </div>
                   ) : <p className="text-xs text-slate-300 italic">Sem PDF principal.</p>}
                </section>
                <section>
                   <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Arquivos Vinculados</h4>
                   <div className="space-y-2">
                      {(doc.attachments || []).map((att, idx) => (
                        <div key={idx} className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-between group">
                           <span className="text-xs font-bold text-slate-700 uppercase truncate pr-4">{att.name}</span>
                           {canManageFiles && (
                             <button onClick={() => handleRemovePDF(idx)} className="text-[9px] font-black text-red-600 uppercase bg-white px-3 py-1 rounded shadow-sm opacity-0 group-hover:opacity-100 transition">Remover</button>
                           )}
                        </div>
                      ))}
                   </div>
                </section>
                {canManageFiles && (
                  <label className="block w-full py-5 bg-indigo-600 text-white text-center rounded-2xl font-black uppercase text-[11px] tracking-widest cursor-pointer hover:bg-black transition shadow-xl">
                     {isReadingFile ? 'Lendo...' : 'Incluir Novo PDF'}
                     <input type="file" accept="application/pdf" className="hidden" onChange={handleUploadPDF} disabled={isReadingFile} />
                  </label>
                )}
                {!canManageFiles && <p className="text-center text-[9px] font-black text-slate-400 uppercase tracking-widest">Somente autor ou administrador podem editar arquivos.</p>}
             </div>
          </div>
        </div>
      )}

      {/* MODAL: ANEXAR (Documentos existentes) */}
      {activeModal === 'anexar' && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4 text-black">
           <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95">
              <div className="p-6 border-b flex justify-between items-center bg-slate-50"><h3 className="font-black uppercase text-sm italic">Anexar Documento Existente</h3><button onClick={() => setActiveModal(null)}>✕</button></div>
              <form onSubmit={handleAnexarDocumento} className="p-8 space-y-6">
                <div><label className="text-[10px] font-black text-slate-400 uppercase block mb-2">Documento Alvo *</label>
                  <select required value={selectedDocIdToAnnex} onChange={e => setSelectedDocIdToAnnex(e.target.value)} className="w-full p-4 border border-slate-200 rounded-2xl bg-slate-50 text-xs font-black outline-none">
                    <option value="">Selecione...</option>
                    {allDocs.filter(d => d.id !== doc.id && !d.parentDocId && !d.processId).map(d => <option key={d.id} value={d.id}>{d.nup} - {d.description.slice(0,40)}...</option>)}
                  </select>
                </div>
                <button type="submit" className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl hover:bg-black transition">Anexar Vínculo</button>
              </form>
           </div>
        </div>
      )}

      {/* MODAIS DE FLUXO */}
      {activeModal === 'tramitar' && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4 text-black">
           <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95">
              <div className="p-6 border-b flex justify-between items-center bg-slate-50"><h3 className="font-black uppercase text-sm italic">Tramitar Documento</h3><button onClick={() => setActiveModal(null)}>✕</button></div>
              <form onSubmit={handleTramitar} className="p-8 space-y-6">
                <select required value={selectedSectorId} onChange={e => setSelectedSectorId(e.target.value)} className="w-full p-4 border border-slate-200 rounded-2xl bg-slate-50 text-xs font-black outline-none">
                  <option value="">Selecione o destino...</option>
                  {sectors.filter(s => s.id !== doc.sectorId).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
                <button type="submit" className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl hover:bg-black transition">Confirmar Envio</button>
              </form>
           </div>
        </div>
      )}

      {activeModal === 'arquivar' && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4 text-black">
           <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95">
              <div className="p-6 border-b flex justify-between items-center bg-rose-50 text-rose-800 font-black uppercase text-sm italic">Finalizar Expediente<button onClick={() => setActiveModal(null)} className="ml-auto text-black">✕</button></div>
              <form onSubmit={handleArquivar} className="p-8 space-y-6">
                 <select required value={archiveForm.classificationId} onChange={e => setArchiveForm({...archiveForm, classificationId: e.target.value})} className="w-full p-4 border border-slate-200 rounded-2xl font-black bg-slate-50 text-[11px] outline-none">
                    <option value="">Classificação...</option>
                    {classifications.map(c => <option key={c.id} value={c.id}>{c.code} - {c.name}</option>)}
                 </select>
                 <button type="submit" className="w-full bg-rose-600 text-white py-4 rounded-2xl font-black uppercase text-xs shadow-xl hover:bg-black transition">Efetivar Arquivamento</button>
              </form>
           </div>
        </div>
      )}

      {activeModal === 'editar' && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4 text-black">
           <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95">
              <div className="p-6 border-b flex justify-between items-center bg-slate-50 font-black uppercase text-sm italic">Editar Metadados Completo<button onClick={() => setActiveModal(null)} className="ml-auto">✕</button></div>
              <form onSubmit={async (e) => {
                e.preventDefault();
                const success = await onUpdate({
                  ...doc,
                  description: editForm.description,
                  typeId: editForm.typeId,
                  interestedIds: editForm.interestedIds,
                  accessLevelId: editForm.accessLevelId,
                  archivalClassificationId: editForm.archivalClassificationId,
                  comments: [...(doc.comments || []), { id: generateId(), userId: currentUser.id, userName: currentUser.name, text: `EDIÇÃO TOTAL DE METADADOS: ${editForm.description.toUpperCase()}`, timestamp: new Date().toISOString() }]
                });
                if (success) setActiveModal(null);
              }} className="p-8 space-y-6 overflow-y-auto max-h-[80vh] custom-scrollbar">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Assunto/Descrição *</label>
                    <textarea required value={editForm.description} onChange={e => setEditForm({...editForm, description: e.target.value})} className="w-full p-4 border border-slate-200 rounded-2xl bg-slate-50 text-xs font-bold outline-none h-24" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Tipo de Documento *</label>
                    <select required value={editForm.typeId} onChange={e => setEditForm({...editForm, typeId: e.target.value})} className="w-full p-4 border border-slate-200 rounded-2xl bg-slate-50 text-xs font-bold outline-none">
                      {docTypes.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Nível de Acesso *</label>
                    <select required value={editForm.accessLevelId} onChange={e => setEditForm({...editForm, accessLevelId: e.target.value})} className="w-full p-4 border border-slate-200 rounded-2xl bg-slate-50 text-xs font-bold outline-none">
                      <option value="">Selecione...</option>
                      {accessLevels.map(al => <option key={al.id} value={al.id}>{al.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Classificação Arquivística</label>
                    <select value={editForm.archivalClassificationId} onChange={e => setEditForm({...editForm, archivalClassificationId: e.target.value})} className="w-full p-4 border border-slate-200 rounded-2xl bg-slate-50 text-xs font-bold outline-none">
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

export default DocumentDetail;
