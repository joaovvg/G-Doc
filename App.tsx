
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { User, Sector, DocType, Interested, Document, Process, ViewMode, AppState, ArchivalClassification, CoverTemplate, OrganizationalUnit, Profile, Permission, Contract, AccessLevelConfig, AccessLog, PortalService } from './types';
import { extractNUPSequence, generateId, generateNUP } from './utils';
import { DatabaseService } from './lib/database';
import Login from './components/Login';
import UnitSelect from './components/UnitSelect';
import SectorSelect from './components/SectorSelect';
import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';
import GlobalFeedback, { FeedbackStatus } from './components/GlobalFeedback';
import Dashboard from './views/Dashboard';
import DocumentList from './views/DocumentList';
import DocumentRegister from './views/DocumentRegister';
import DocumentDetail from './views/DocumentDetail';
import DocumentSearch from './views/DocumentSearch';
import ProcessList from './views/ProcessList';
import ProcessRegister from './views/ProcessRegister';
import ProcessDetail from './views/ProcessDetail';
import ProcessSearch from './views/ProcessSearch';
import ArchiveCenter from './views/ArchiveCenter';
import Settings from './views/Settings';
import UsersConfig from './views/UsersConfig';
import InterestedConfig from './views/InterestedConfig';
import SectorsConfig from './views/SectorsConfig';
import DocTypesConfig from './views/DocTypesConfig';
import ArchivalClassificationConfig from './views/ArchivalClassificationConfig';
import CoverTemplateConfig from './views/CoverTemplateConfig';
import OrganizationalUnitConfig from './views/OrganizationalUnitConfig';
import ProfilesConfig from './views/ProfilesConfig';
import AccessLevelsConfig from './views/AccessLevelsConfig';
import PortalServicesConfig from './views/PortalServicesConfig';
import FileRepository from './views/FileRepository';
import AuditReports from './views/AuditReports';
import PersonalSettings from './views/PersonalSettings';
import { MASTER_CPF, MASTER_PASSWORD, MASTER_PROFILE_ID, MASTER_SECTOR_ID, MASTER_USER_ID, MASTER_USER_NAME } from './constants';
import { buildMasterFallbackAssignment } from './lib/masterLogin.js';

const ALL_PERMISSIONS: Permission[] = [
  'view_dashboard', 'view_archive_center', 'view_files', 'doc_view', 'doc_view_all_sectors', 'doc_create', 'doc_edit', 'doc_tramitar', 'doc_arquivar', 'doc_anexar', 'doc_autuar',
  'proc_view', 'proc_view_all_sectors', 'proc_create', 'proc_edit', 'proc_tramitar', 'proc_arquivar', 'proc_capa', 'proc_annex', 'proc_unannex', 'doc_unannex_others', 'proc_unannex_others',
  'archive_manage',
  'access_settings', 'set_units', 'set_users', 'set_profiles', 'set_sectors', 'set_sectors_all_units', 'set_doctypes', 'set_classifications', 'set_covers', 'set_portal_services', 'set_access_levels', 'set_interested', 'set_repository', 'view_audit'
];

type UnitCounter = {
  id: string;
  value: number;
};

const App: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [feedback, setFeedback] = useState<{ status: FeedbackStatus; message: string }>({ status: null, message: '' });

  const [unitCounters, setUnitCounters] = useState<Record<string, number>>({});
  const [units, setUnits] = useState<OrganizationalUnit[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [docTypes, setDocTypes] = useState<DocType[]>([]);
  const [classifications, setClassifications] = useState<ArchivalClassification[]>([]);
  const [coverTemplates, setCoverTemplates] = useState<CoverTemplate[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [portalServices, setPortalServices] = useState<PortalService[]>([]);
  const [accessLevels, setAccessLevels] = useState<AccessLevelConfig[]>([]);
  const [interested, setInterested] = useState<Interested[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [processes, setProcesses] = useState<Process[]>([]);
  const [accessLogs, setAccessLogs] = useState<AccessLog[]>([]);

  const [activeProcessContext, setActiveProcessContext] = useState<string | null>(null);
  const [appState, setAppState] = useState<AppState>({ currentUser: null, activeUnit: null, activeSector: null, activeProfile: null, viewMode: ViewMode.LOGIN, activeSubView: 'dashboard' });

  const [currentDocDetailId, setCurrentDocDetailId] = useState<string | null>(null);
  const [currentProcDetailId, setCurrentProcDetailId] = useState<string | null>(null);
  const [autuarDocId, setAutuarDocId] = useState<string | null>(null);

  // LOGICA DE OURO: O Administrador Mestre só vê todos os setores se não tiver nenhum vínculo manual.
  // Se você vincular o admin a apenas 1 setor em 'Administração > Usuários', o sistema respeitará isso na tela de login.
  const currentUserEffective = useMemo(() => {
    if (!appState.currentUser) return null;
    const isRoot = appState.currentUser.cpf === MASTER_CPF;
    
    // Se for o Admin Mestre e ele não tiver NENHUM setor em NENHUMA unidade, 
    // ou se o usuário explicitamente deseja que o Admin veja o que está no banco, 
    // mas se a lista for vazia, permitimos que ele veja os setores da unidade ativa como fallback técnico
    if (isRoot && (appState.currentUser.assignments || []).length === 0 && sectors.length > 0) {
      const activeUnitId = appState.activeUnit?.id || units[0]?.id || '';
      return { 
        ...appState.currentUser, 
        assignments: sectors
          .filter(s => s.unitId === activeUnitId)
          .map(s => ({ unitId: s.unitId, sectorId: s.id, profileId: MASTER_PROFILE_ID })) 
      };
    }
    return appState.currentUser;
  }, [appState.currentUser, sectors, appState.activeUnit]);

  const userPermissions = useMemo(() => appState.activeProfile?.permissions || [], [appState.activeProfile]);
  const canManageArchive = useMemo(() => userPermissions.includes('archive_manage'), [userPermissions]);

  const loadInitialData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [u, p, s, usr, dt, cl, ct, int, docs, procs, cnt, contr, portalSvcs, al, logs] = await Promise.all([
        DatabaseService.getAll<OrganizationalUnit[]>('units', []), 
        DatabaseService.getAll<Profile[]>('profiles', []), 
        DatabaseService.getAll<Sector[]>('sectors', []),
        DatabaseService.getAll<User[]>('users', []), 
        DatabaseService.getAll<DocType[]>('doc_types', []), 
        DatabaseService.getAll<ArchivalClassification[]>('classifications', []),
        DatabaseService.getAll<CoverTemplate[]>('cover_templates', []), 
        DatabaseService.getAll<Interested[]>('interested', []), 
        DatabaseService.getAll<Document[]>('documents', []),
        DatabaseService.getAll<Process[]>('processes', []), 
        DatabaseService.getAll<any>('counter', []), 
        DatabaseService.getAll<Contract[]>('contracts', []),
        DatabaseService.getAll<PortalService[]>('portal_services', []),
        DatabaseService.getAll<AccessLevelConfig[]>('access_levels', []), 
        DatabaseService.getAll<AccessLog[]>('access_logs', [])
      ]);

      setUnits(u);
      setProfiles(p); setSectors(s); setUsers(usr); setDocTypes(dt); setAccessLevels(al); setClassifications(cl);
      setCoverTemplates(ct); setInterested(int); setDocuments(docs); setProcesses(procs); setAccessLogs(logs); setContracts(contr); setPortalServices(portalSvcs);
      
      const counterData = Array.isArray(cnt) ? cnt as UnitCounter[] : [];
      const nextCounters = counterData.reduce<Record<string, number>>((acc, counter) => {
        acc[counter.id] = Number(counter.value || 0);
        return acc;
      }, {});
      setUnitCounters(nextCounters);
    } catch (e) {
      console.error("Erro Crítico ao Carregar Dados:", e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const syncState = async <T extends { id: string }>(key: string, item: T | T[], setter: React.Dispatch<React.SetStateAction<T[]>>) => {
    const items = Array.isArray(item) ? item : [item];
    setter(prev => {
      const next = [...prev];
      items.forEach(newItem => {
        const idx = next.findIndex(x => x.id === newItem.id);
        if (idx > -1) next[idx] = newItem; else next.push(newItem);
      });
      DatabaseService.saveLocal(key, next);
      return next;
    });
    for (const it of items) await DatabaseService.upsert(key, it);
  };

  const getNextNupData = useCallback((unitId: string) => {
    const persistedCounter = unitCounters[unitId] || 0;
    const documentMax = documents
      .filter(doc => doc.unitId === unitId)
      .reduce((max, doc) => Math.max(max, extractNUPSequence(doc.nup)), 0);
    const processMax = processes
      .filter(proc => proc.unitId === unitId)
      .reduce((max, proc) => Math.max(max, extractNUPSequence(proc.nup)), 0);

    const nextSequence = Math.max(persistedCounter, documentMax, processMax) + 1;
    return {
      sequence: nextSequence,
      nup: generateNUP(nextSequence),
    };
  }, [documents, processes, unitCounters]);

  const handleSyncAll = async () => {
    setFeedback({ status: 'processing', message: 'Sincronizando tabelas...' });
    try {
      await DatabaseService.syncAll();
      setFeedback({ status: 'success', message: 'Sincronização concluída!' });
      setTimeout(() => {
        setFeedback({ status: null, message: '' });
        loadInitialData();
      }, 1500);
    } catch (e: any) {
      setFeedback({ status: 'error', message: `Erro: ${e.message}` });
    }
  };

  const executeAsync = useCallback(async (task: () => Promise<any>, msgs?: any) => {
    setFeedback({ status: 'processing', message: msgs?.processing || 'Processando...' });
    try {
      const result = await task();
      setFeedback({ status: 'success', message: msgs?.success || 'Concluído!' });
      setTimeout(() => setFeedback({ status: null, message: '' }), 1500);
      return result !== false;
    } catch (e: any) {
      setFeedback({ status: 'error', message: e.message || 'Erro inesperado.' });
      return false;
    }
  }, []);

  useEffect(() => { loadInitialData(); }, [loadInitialData]);

  const handleLogin = async (cpf: string, pass: string) => executeAsync(async () => {
    const user = users.find(u => u.cpf === cpf);
    if (cpf === MASTER_CPF && (!user || user.password === pass || pass === MASTER_PASSWORD)) {
       // Usar a primeira unidade existente no banco, ou criar o usuário admin sem unidade fixa
       const existingUnit = units.find(u => u.isPrimary) || units[0];
       const masterProfile: Profile = {
         id: MASTER_PROFILE_ID,
         name: MASTER_USER_NAME,
         permissions: ALL_PERMISSIONS,
         unitId: existingUnit?.id || profiles[0]?.unitId || '',
       };
       const existingAssignment = buildMasterFallbackAssignment(existingUnit, sectors, MASTER_PROFILE_ID);

       const rootUser = user 
         ? { ...user, assignments: user.assignments?.length > 0 ? user.assignments : (existingAssignment ? [existingAssignment] : []) }
         : { 
           id: MASTER_USER_ID, 
           cpf: MASTER_CPF, 
           name: MASTER_USER_NAME, 
           password: pass || MASTER_PASSWORD, 
           assignments: existingAssignment ? [existingAssignment] : [], 
           authorizedAccessLevelIds: [] 
         };
       
       // Persistir o perfil mestre com todas as permissões e vincular o usuário a ele
       await DatabaseService.upsert('profiles', masterProfile);
       await DatabaseService.upsert('users', rootUser);
       
       if (!user) setUsers(prev => [...prev, rootUser]);
       else setUsers(prev => prev.map(u => u.id === rootUser.id ? rootUser : u));
       setProfiles(prev => {
         const next = prev.filter(p => p.id !== MASTER_PROFILE_ID);
         next.push(masterProfile);
         return next;
       });

       setAppState(prev => ({ ...prev, currentUser: rootUser, viewMode: ViewMode.UNIT_SELECT }));
       return true;
    }
    if (!user || user.password !== pass) throw new Error("Acesso negado: Credenciais inválidas.");
    if ((user.assignments || []).length === 0) throw new Error("Usuário sem lotação cadastrada.");
    setAppState(prev => ({ ...prev, currentUser: user, viewMode: ViewMode.UNIT_SELECT }));
    return true;
  }, { processing: "Autenticando...", success: "Acesso autorizado!" });

  const handleUnitSelect = (unit: OrganizationalUnit) => setAppState(prev => ({ ...prev, activeUnit: unit, viewMode: ViewMode.SECTOR_SELECT, activeSubView: 'dashboard' }));
  
  const handleSectorSelect = (sector: Sector) => {
    const isRoot = currentUserEffective?.cpf === MASTER_CPF;
    const assignment = (currentUserEffective?.assignments || []).find(a => a.sectorId === sector.id && a.unitId === appState.activeUnit?.id);
    let prof = profiles.find(p => p.id === assignment?.profileId);
    
    if (isRoot) prof = { id: MASTER_PROFILE_ID, name: MASTER_USER_NAME, permissions: ALL_PERMISSIONS, unitId: appState.activeUnit?.id || '' };
    if (!prof) { alert("Perfil de acesso não encontrado para este setor."); return; }
    
    setAppState(prev => ({ 
      ...prev, 
      activeSector: sector, 
      activeProfile: prof!, 
      viewMode: ViewMode.DASHBOARD, 
      activeSubView: 'dashboard' 
    }));
  };

  const handleBack = useCallback(() => {
    const view = appState.activeSubView;
    if (view === 'dashboard') return;
    if (view.startsWith('settings_')) setAppState(prev => ({ ...prev, activeSubView: 'settings' }));
    else if (['doc_detail', 'doc_register'].includes(view)) setAppState(prev => ({ ...prev, activeSubView: 'doc_list' }));
    else if (['proc_detail', 'proc_register'].includes(view)) setAppState(prev => ({ ...prev, activeSubView: 'proc_list' }));
    else setAppState(prev => ({ ...prev, activeSubView: 'dashboard' }));
  }, [appState.activeSubView]);

  const handleSaveDoc = (data: any) => executeAsync(async () => {
    const unitId = appState.activeUnit!.id;
    const { nup, sequence } = getNextNupData(unitId);
    const doc: Document = { 
      ...data, 
      id: generateId(), 
      nup, 
      createdAt: new Date().toISOString(), 
      sectorId: appState.activeSector!.id, 
      unitId, 
      attachments: [], 
      isArchived: false, 
      processId: activeProcessContext || undefined 
    };
    await DatabaseService.upsert('counter', { id: unitId, value: sequence });
    setUnitCounters(prev => ({ ...prev, [unitId]: sequence }));
    await syncState<Document>('documents', doc, setDocuments);
    setAppState(prev => ({ ...prev, activeSubView: activeProcessContext ? 'proc_detail' : 'doc_list' }));
    setActiveProcessContext(null);
  });

  const handleCancelDoc = (id: string) => executeAsync(() => {
    const found = documents.find(d => d.id === id);
    if (!found) return Promise.resolve(false);
    const updatedDoc = { ...found, isPendingReception: false, senderSectorId: undefined, destinationSectorId: undefined } as Document;
    return syncState<Document>('documents', updatedDoc, setDocuments);
  });

  const handleCancelProc = (id: string) => executeAsync(() => {
    const found = processes.find(p => p.id === id);
    if (!found) return Promise.resolve(false);
    const updatedProc = { ...found, isPendingReception: false, senderSectorId: undefined, destinationSectorId: undefined, status: 'Aberto' } as Process;
    return syncState<Process>('processes', updatedProc, setProcesses);
  });

  const handleWebProtocolReview = (
    id: string,
    status: 'Aceito' | 'Recusado' | 'Pendencia',
    options?: { message?: string; pendingType?: 'Documental' | 'Informacao' }
  ) => executeAsync(() => {
    const found = processes.find(proc => proc.id === id);
    if (!found) return Promise.resolve(false);

    const now = new Date().toISOString();
    const action = status === 'Aceito'
      ? 'PROTOCOLO WEB ACEITO'
      : status === 'Recusado'
        ? 'PROTOCOLO WEB RECUSADO'
        : `PENDENCIA WEB CONCLUIDA, AGUARDANDO RESPOSTA (${options?.pendingType || 'NAO INFORMADA'})${options?.message ? `: ${options.message}` : ''}`;

    const updatedProc: Process = {
      ...found,
      webProtocolStatus: status === 'Pendencia' ? 'AguardandoResposta' : status,
      webProtocolMessage: status === 'Pendencia' ? options?.message : undefined,
      webProtocolReviewedAt: now,
      webProtocolReviewedByUserId: currentUserEffective?.id,
      webProtocolPendingType: status === 'Pendencia' ? options?.pendingType : undefined,
      webProtocolPendingResponseText: undefined,
      webProtocolPendingResponseFileName: undefined,
      history: [
        ...(found.history || []),
        {
          id: generateId(),
          userId: currentUserEffective?.id || '',
          userName: currentUserEffective?.name || 'Sistema',
          action,
          timestamp: now,
          justification: options?.message || undefined,
        },
      ],
    };

    return syncState<Process>('processes', updatedProc, setProcesses);
  });

  const syncInterestedFromUser = async (user: User) => {
    const unitIds = Array.from(new Set((user.assignments || []).map(assignment => assignment.unitId).filter(Boolean)));
    for (const linkedUnitId of unitIds) {
      const existingInterested = interested.find(item => item.unitId === linkedUnitId && item.identifier === user.cpf);
      const interestedPayload: Interested = {
        id: existingInterested?.id || generateId(),
        type: 'Pessoa',
        name: user.name,
        identifier: user.cpf,
        email: user.email || '',
        password: user.password || '',
        unitId: linkedUnitId,
      };
      await syncState<Interested>('interested', interestedPayload, setInterested);
    }
  };

  const renderContent = () => {
    if (!currentUserEffective || !appState.activeSector || !appState.activeUnit || !appState.activeProfile) return null;
    const { id: unitId } = appState.activeUnit;
    const { id: sectorId } = appState.activeSector;

    const props = {
      unitSectors: sectors.filter(s => s.unitId === unitId),
      unitDocTypes: docTypes.filter(dt => dt.unitId === unitId),
      unitInterested: interested.filter(i => i.unitId === unitId),
      unitClassifications: classifications.filter(c => c.unitId === unitId),
      unitContracts: contracts.filter(c => c.unitId === unitId),
      unitAccessLevels: accessLevels.filter(al => al.unitId === unitId),
      // Documentos no setor: Agora inclui os que estão em "saída pendente" (ainda no setor mas indo para outro)
      sectorDocs: documents.filter(d => 
        d.unitId === unitId && 
        d.sectorId === sectorId && 
        (!d.isPendingReception || (d.isPendingReception && d.senderSectorId === sectorId)) && 
        !d.processId
      ),
      sectorProcs: processes.filter(p => 
        p.unitId === unitId && 
        p.sectorId === sectorId && 
        (!p.isPendingReception || (p.isPendingReception && p.senderSectorId === sectorId))
      ),
      // Documentos chegando: Pendentes onde o DESTINO é o meu setor
      incomingDocs: documents.filter(d => d.unitId === unitId && d.isPendingReception && d.destinationSectorId === sectorId),
      incomingProcs: processes.filter(p => p.unitId === unitId && p.isPendingReception && p.destinationSectorId === sectorId),
      // Documentos saindo: Pendentes onde a ORIGEM é o meu setor
      outgoingDocs: documents.filter(d => d.unitId === unitId && d.isPendingReception && d.senderSectorId === sectorId),
      outgoingProcs: processes.filter(p => p.unitId === unitId && p.isPendingReception && p.senderSectorId === sectorId),
    };

    switch (appState.activeSubView) {
      case 'dashboard': 
        return <Dashboard 
          docs={props.sectorDocs} 
          processes={props.sectorProcs} 
          incomingDocs={props.incomingDocs} 
          incomingProcs={props.incomingProcs}
          outgoingDocs={props.outgoingDocs}
          outgoingProcs={props.outgoingProcs}
          onReceiveDoc={id => executeAsync(() => {
            const found = documents.find(d => d.id === id);
            if (!found) return Promise.resolve(false);
            // Ao receber, o sectorId muda DEFINITIVAMENTE para o meu setor (destino)
            const updatedDoc = { ...found, isPendingReception: false, sectorId, senderSectorId: undefined, destinationSectorId: undefined } as Document;
            return syncState<Document>('documents', updatedDoc, setDocuments);
          })} 
          onReceiveProc={id => executeAsync(() => {
            const found = processes.find(p => p.id === id);
            if (!found) return Promise.resolve(false);
            // Ao receber, o sectorId muda DEFINITIVAMENTE para o meu setor (destino)
            const updatedProc = { ...found, isPendingReception: false, sectorId, senderSectorId: undefined, destinationSectorId: undefined, status: 'Aberto' } as Process;
            return syncState<Process>('processes', updatedProc, setProcesses);
          })} 
          onRefuseDoc={id => {
            const motive = prompt("Justificativa para recusa:");
            if (motive === null) return;
            executeAsync(() => {
              const found = documents.find(d => d.id === id);
              if (!found) return Promise.resolve(false);
              // Ao recusar, volta ao estado normal no setor de origem (que já é o sectorId atual)
              const updatedDoc = { 
                ...found, 
                isPendingReception: false,
                senderSectorId: undefined,
                destinationSectorId: undefined,
                comments: [...(found.comments || []), { id: generateId(), userId: currentUserEffective!.id, userName: currentUserEffective!.name, text: `TRAMITAÇÃO RECUSADA PELO DESTINO. MOTIVO: ${motive || 'Sem justificativa'}`, timestamp: new Date().toISOString() }]
              } as Document;
              return syncState<Document>('documents', updatedDoc, setDocuments);
            });
          }}
          onRefuseProc={id => {
            const motive = prompt("Justificativa para recusa:");
            if (motive === null) return;
            executeAsync(() => {
              const found = processes.find(p => p.id === id);
              if (!found) return Promise.resolve(false);
              // Ao recusar, volta ao estado normal no setor de origem
              const updatedProc = { 
                ...found, 
                isPendingReception: false,
                senderSectorId: undefined,
                destinationSectorId: undefined,
                status: 'Aberto',
                history: [...(found.history || []), { id: generateId(), userId: currentUserEffective!.id, userName: currentUserEffective!.name, action: `TRAMITAÇÃO RECUSADA PELO DESTINO. MOTIVO: ${motive || 'Sem justificativa'}`, timestamp: new Date().toISOString() }]
              } as Process;
              return syncState<Process>('processes', updatedProc, setProcesses);
            });
          }}
          onCancelDoc={handleCancelDoc}
          onCancelProc={handleCancelProc}
          onAcceptWebProtocol={id => handleWebProtocolReview(id, 'Aceito')}
          onRefuseWebProtocol={id => handleWebProtocolReview(id, 'Recusado')}
          onSendWebProtocolPending={(id, pendingType, message) => handleWebProtocolReview(id, 'Pendencia', { pendingType, message })}
          sectors={props.unitSectors} 
          onNavigate={v => setAppState(prev => ({ ...prev, activeSubView: v }))} 
          onSelectDoc={id => { setCurrentDocDetailId(id); setAppState(prev => ({ ...prev, activeSubView: 'doc_detail' })); }} 
          onSelectProc={id => { setCurrentProcDetailId(id); setAppState(prev => ({ ...prev, activeSubView: 'proc_detail' })); }} 
          permissions={userPermissions}
        />;
      case 'doc_list': return <DocumentList documents={props.sectorDocs} docTypes={props.unitDocTypes} onCancelDoc={handleCancelDoc} onSelectDoc={id => { setCurrentDocDetailId(id); setAppState(prev => ({ ...prev, activeSubView: 'doc_detail' })); }} />;
      case 'doc_register': return <DocumentRegister docTypes={props.unitDocTypes} interested={props.unitInterested} classifications={props.unitClassifications} accessLevels={props.unitAccessLevels} onSave={handleSaveDoc} currentUser={currentUserEffective} onAddInterested={i => syncState<Interested>('interested', { ...i, unitId } as Interested, setInterested)} />;
      case 'doc_detail':
        const d = documents.find(x => x.id === currentDocDetailId);
        const canViewAll = userPermissions.includes('doc_view_all_sectors');
        const accessibleDocs = documents.filter(x => x.unitId === unitId && (canViewAll || x.sectorId === sectorId));
        return d ? <DocumentDetail doc={d} docTypes={props.unitDocTypes} interested={props.unitInterested} sectors={sectors.filter(s => s.unitId === unitId)} users={users} classifications={props.unitClassifications} accessLevels={props.unitAccessLevels} allDocs={accessibleDocs} userPermissions={userPermissions} currentUser={currentUserEffective} currentSectorId={sectorId} onUpdate={u => executeAsync(() => syncState<Document>('documents', u, setDocuments))} onCancelTramitation={handleCancelDoc} onAutuar={() => { setAutuarDocId(d.id); setAppState(prev => ({ ...prev, activeSubView: 'proc_register' })); }} onRespond={() => {}} onNavigateBack={handleBack} onLogAccess={() => {}} /> : null;
      case 'proc_list': return <ProcessList processes={props.sectorProcs} onCancelProc={handleCancelProc} onSelectProc={id => { setCurrentProcDetailId(id); setAppState(prev => ({ ...prev, activeSubView: 'proc_detail' })); }} />;
      case 'proc_detail':
        const p = processes.find(x => x.id === currentProcDetailId);
        const canViewAllProcs = userPermissions.includes('proc_view_all_sectors');
        const accessibleProcs = processes.filter(x => x.unitId === unitId && (canViewAllProcs || x.sectorId === sectorId));
        return p ? <ProcessDetail process={p} allProcesses={accessibleProcs} documents={documents.filter(x => x.processId === p.id)} allSectorDocs={documents.filter(x => x.unitId === unitId && x.sectorId === sectorId && !x.processId)} interested={props.unitInterested} docTypes={props.unitDocTypes} sectors={sectors.filter(s => s.unitId === unitId)} users={users} currentUser={currentUserEffective} currentSectorId={sectorId} classifications={props.unitClassifications} accessLevels={props.unitAccessLevels} userPermissions={userPermissions} coverTemplate={coverTemplates.find(t => t.id === p.coverTemplateId) || coverTemplates.find(t => t.unitId === unitId && t.isActive)} onSelectDoc={id => { setCurrentDocDetailId(id); setAppState(prev => ({ ...prev, activeSubView: 'doc_detail' })); }} onUpdate={u => executeAsync(() => syncState<Process>('processes', u, setProcesses))} onCancelTramitation={handleCancelProc} onUpdateDocs={docs => executeAsync(() => syncState<Document>('documents', docs, setDocuments))} onUpdateProcs={procs => executeAsync(() => syncState<Process>('processes', procs, setProcesses))} onNavigateBack={handleBack} onLogAccess={() => {}} onIncludeNewDoc={id => { setActiveProcessContext(id); setAppState(prev => ({ ...prev, activeSubView: 'doc_register' })); }} /> : null;
      case 'settings': return <Settings onNavigate={v => setAppState(prev => ({ ...prev, activeSubView: v }))} onRefreshData={loadInitialData} onSyncAll={handleSyncAll} forceAll={currentUserEffective?.cpf === MASTER_CPF} permissions={{ units: userPermissions.includes('set_units'), users: userPermissions.includes('set_users'), profiles: userPermissions.includes('set_profiles'), sectors: userPermissions.includes('set_sectors'), doctypes: userPermissions.includes('set_doctypes'), classifications: userPermissions.includes('set_classifications'), covers: userPermissions.includes('set_covers'), portalServices: userPermissions.includes('set_portal_services'), accessLevels: userPermissions.includes('set_access_levels'), interested: userPermissions.includes('set_interested'), repository: userPermissions.includes('set_repository'), audit: userPermissions.includes('view_audit') }} />;
      
      case 'settings_units': 
        const adminUnits = currentUserEffective?.cpf === MASTER_CPF ? units : units.filter(u => (currentUserEffective?.assignments || []).some(a => a.unitId === u.id));
        return <OrganizationalUnitConfig units={adminUnits} onSave={u => executeAsync(async () => { 
        const id = u.id || generateId();
        const updatedUnit = { ...u, id };
        let updatedUnits = units.map(x => x.id === id ? updatedUnit : x);
        if (!units.find(x => x.id === id)) updatedUnits.push(updatedUnit);

        // Se a unidade salva é a principal, desmarcar todas as outras
        if (updatedUnit.isPrimary) {
          updatedUnits = updatedUnits.map(x => x.id === id ? x : { ...x, isPrimary: false });
        }

        // Persistir todas as unidades alteradas
        for (const unit of updatedUnits) {
          await DatabaseService.upsert('units', unit);
        }
        setUnits(updatedUnits);
        return true;
      })} onDelete={id => executeAsync(async () => { 
        // Verificar dependências antes de excluir a unidade
        const hasSectors = sectors.some(s => s.unitId === id);
        const hasUsers = users.some(u => (u.assignments || []).some(a => a.unitId === id));
        if (hasSectors || hasUsers) {
          alert("NÃO É POSSÍVEL EXCLUIR ESTA UNIDADE. \nExistem setores ou usuários vinculados a ela. Remova-os primeiro.");
          return false;
        }
        await DatabaseService.delete('units', id); 
        setUnits(prev => prev.filter(x => x.id !== id)); 
      })} />;

      case 'settings_profiles': 
        const adminProfiles = profiles.filter(x => x.unitId === unitId);
        return <ProfilesConfig profiles={adminProfiles} units={units} currentUnitId={unitId} canManageAllUnits={userPermissions.includes('set_profiles')} onSave={p => executeAsync(() => syncState<Profile>('profiles', p.id ? p : { ...p, id: generateId() }, setProfiles))} onDelete={id => executeAsync(async () => { await DatabaseService.delete('profiles', id); setProfiles(prev => prev.filter(x => x.id !== id)); })} />;

      case 'settings_sectors': 
        const adminSectors = currentUserEffective?.cpf === MASTER_CPF 
          ? props.unitSectors 
          : props.unitSectors.filter(s => (currentUserEffective?.assignments || []).some(a => a.sectorId === s.id));
        return <SectorsConfig sectors={adminSectors} units={units} currentUnitId={unitId} canManageAllUnits={userPermissions.includes('set_sectors_all_units')} onSave={s => executeAsync(() => syncState<Sector>('sectors', s.id ? s : { ...s, id: generateId() }, setSectors))} onDelete={id => executeAsync(async () => { 
        // Verificar dependências antes de excluir o setor
        const hasDocs = documents.some(d => d.sectorId === id);
        const hasProcs = processes.some(p => p.sectorId === id);
        if (hasDocs || hasProcs) {
          alert("NÃO É POSSÍVEL EXCLUIR ESTE SETOR. \nExistem documentos ou processos ativos neste setor. Realize a tramitação antes de excluir.");
          return false;
        }
        await DatabaseService.delete('sectors', id); 
        setSectors(prev => prev.filter(x => x.id !== id)); 
      })} />;
      case 'settings_users': return <UsersConfig users={users.filter(u => (u.assignments || []).some(a => a.unitId === unitId))} sectors={props.unitSectors} units={units} profiles={profiles} accessLevels={props.unitAccessLevels} onSave={u => executeAsync(async () => {
        const userToSave = u.id ? u : { ...u, id: generateId() };
        await syncState<User>('users', userToSave, setUsers);
        await syncInterestedFromUser(userToSave);
      })} onDelete={id => executeAsync(async () => { await DatabaseService.delete('users', id); setUsers(prev => prev.filter(x => x.id !== id)); })} />;
      case 'settings_doc_types': return <DocTypesConfig docTypes={props.unitDocTypes} onSave={dt => executeAsync(() => syncState<DocType>('doc_types', { ...dt, id: dt.id || generateId(), unitId } as DocType, setDocTypes))} />;
      case 'settings_classifications': return <ArchivalClassificationConfig classifications={props.unitClassifications} onSave={c => executeAsync(() => syncState<ArchivalClassification>('classifications', { ...c, id: c.id || generateId(), unitId } as ArchivalClassification, setClassifications))} />;
      case 'settings_portal_services': return <PortalServicesConfig unitId={unitId} unitName={appState.activeUnit.name} services={portalServices.filter(service => service.unitId === unitId)} sectors={props.unitSectors || []} accessLevels={props.unitAccessLevels || []} docTypes={props.unitDocTypes || []} coverTemplates={coverTemplates.filter(t => t.unitId === unitId)} onSave={service => executeAsync(() => syncState<PortalService>('portal_services', { ...service, id: service.id || generateId(), unitId } as PortalService, setPortalServices))} onDelete={id => executeAsync(async () => { await DatabaseService.delete('portal_services', id); setPortalServices(prev => prev.filter(x => x.id !== id)); })} />;
      case 'settings_repository': return <FileRepository documents={documents.filter(d => d.unitId === unitId)} onNavigateToDoc={id => { setCurrentDocDetailId(id); setAppState(prev => ({ ...prev, activeSubView: 'doc_detail' })); }} />;
      case 'settings_access_levels': return <AccessLevelsConfig accessLevels={props.unitAccessLevels} users={users} onSave={(al, userIds) => executeAsync(async () => { const id = al.id || generateId(); await syncState<AccessLevelConfig>('access_levels', { ...al, id, unitId } as AccessLevelConfig, setAccessLevels); const updatedUsers = users.map(u => { const has = u.authorizedAccessLevelIds?.includes(id); const should = userIds.includes(u.id); if (should && !has) return { ...u, authorizedAccessLevelIds: [...(u.authorizedAccessLevelIds || []), id] }; if (!should && has) return { ...u, authorizedAccessLevelIds: u.authorizedAccessLevelIds.filter(x => x !== id) }; return u; }); for (const u of updatedUsers) await DatabaseService.upsert('users', u); setUsers(updatedUsers); })} onDelete={id => executeAsync(async () => { await DatabaseService.delete('access_levels', id); setAccessLevels(prev => prev.filter(x => x.id !== id)); })} />;
      case 'settings_interested': return <InterestedConfig interested={props.unitInterested} onSave={i => executeAsync(() => syncState<Interested>('interested', { ...i, id: i.id || generateId(), unitId } as Interested, setInterested))} onDelete={id => executeAsync(async () => { await DatabaseService.delete('interested', id); setInterested(prev => prev.filter(x => x.id !== id)); })} />;
      case 'settings_cover': return <CoverTemplateConfig templates={coverTemplates.filter(t => t.unitId === unitId)} onSave={t => executeAsync(() => syncState<CoverTemplate>('cover_templates', { ...t, id: t.id || generateId(), unitId } as CoverTemplate, setCoverTemplates))} onDelete={id => executeAsync(async () => { await DatabaseService.delete('cover_templates', id); setCoverTemplates(prev => prev.filter(x => x.id !== id)); })} />;
      case 'settings_audit': return <AuditReports documents={documents.filter(d => d.unitId === unitId)} processes={processes.filter(p => p.unitId === unitId)} users={users} sectors={props.unitSectors} docTypes={props.unitDocTypes} accessLogs={accessLogs.filter(l => l.unitId === unitId)} />;
      case 'personal_settings': return <PersonalSettings user={currentUserEffective!} onUpdateUser={u => executeAsync(() => syncState<User>('users', u, setUsers))} />;
      case 'proc_register': return <ProcessRegister interested={props.unitInterested} documents={documents.filter(d => d.unitId === unitId)} classifications={props.unitClassifications} coverTemplates={coverTemplates.filter(t => t.unitId === unitId)} accessLevels={props.unitAccessLevels} onSave={d => executeAsync(async () => { 
        const { nup, sequence } = getNextNupData(unitId);
        const procId = generateId();
        const proc: Process = { ...d, id: procId, nup, createdAt: new Date().toISOString(), sectorId, status: 'Aberto', isArchived: false, unitId, history: [] } as Process; 
        
        await DatabaseService.upsert('counter', { id: unitId, value: sequence }); 
        setUnitCounters(prev => ({ ...prev, [unitId]: sequence }));
        
        // 1. Salvar o processo primeiro para satisfazer a FK
        await syncState<Process>('processes', proc, setProcesses); 

        // 2. Depois atualizar o documento se for o caso de autuação
        if (autuarDocId) { 
          const doc = documents.find(x => x.id === autuarDocId); 
          if (doc) { 
            const updatedDoc: Document = { 
              ...doc, 
              processId: procId, 
              annexedAt: new Date().toISOString(), 
              annexedByUserId: currentUserEffective!.id,
              comments: [...(doc.comments || []), { id: generateId(), userId: currentUserEffective!.id, userName: currentUserEffective!.name, text: `DOCUMENTO AUTUADO NO PROCESSO ${nup}`, timestamp: new Date().toISOString() }]
            }; 
            await syncState<Document>('documents', updatedDoc, setDocuments); 
            
            // Adicionar histórico na capa do processo informando a autuação
            const updatedProcWithHistory = {
              ...proc,
              history: [...proc.history, { id: generateId(), userId: currentUserEffective!.id, userName: currentUserEffective!.name, action: `AUTUAÇÃO DO DOCUMENTO ${doc.nup}`, timestamp: new Date().toISOString() }]
            };
            await DatabaseService.upsert('processes', updatedProcWithHistory);
            setProcesses(prev => prev.map(p => p.id === procId ? updatedProcWithHistory : p));
          } 
          setAutuarDocId(null); 
        } 
        
        setAppState(prev => ({ ...prev, activeSubView: 'proc_list' })); 
      })} onAddInterested={i => syncState<Interested>('interested', { ...i, unitId } as Interested, setInterested)} autuarDocId={autuarDocId} />;
      case 'doc_search': 
        const canViewAllSearch = userPermissions.includes('doc_view_all_sectors');
        const searchDocs = documents.filter(d => d.unitId === unitId && (canViewAllSearch || d.sectorId === sectorId) && !d.processId);
        return <DocumentSearch documents={searchDocs} docTypes={props.unitDocTypes} interested={props.unitInterested} sectors={sectors.filter(s => s.unitId === unitId)} users={users} classifications={props.unitClassifications} accessLevels={props.unitAccessLevels} onSelectDoc={id => { setCurrentDocDetailId(id); setAppState(prev => ({ ...prev, activeSubView: 'doc_detail' })); }} />;
      case 'proc_search': 
        const canViewAllProcSearch = userPermissions.includes('proc_view_all_sectors');
        const searchProcs = processes.filter(p => p.unitId === unitId && (canViewAllProcSearch || p.sectorId === sectorId));
        return <ProcessSearch processes={searchProcs} interested={props.unitInterested} sectors={sectors.filter(s => s.unitId === unitId)} classifications={props.unitClassifications} accessLevels={props.unitAccessLevels} onSelectProc={id => { setCurrentProcDetailId(id); setAppState(prev => ({ ...prev, activeSubView: 'proc_detail' })); }} />;
      case 'archive_center': return <ArchiveCenter
        classifications={props.unitClassifications}
        allProcesses={processes.filter(p => p.unitId === unitId && p.sectorId === sectorId)}
        allDocuments={documents.filter(d => d.unitId === unitId && d.sectorId === sectorId && !d.processId)}
        docTypes={props.unitDocTypes}
        currentSectorId={sectorId}
        canManageArchive={canManageArchive}
        onSelectDoc={id => { setCurrentDocDetailId(id); setAppState(prev => ({ ...prev, activeSubView: 'doc_detail' })); }}
        onSelectProc={id => { setCurrentProcDetailId(id); setAppState(prev => ({ ...prev, activeSubView: 'proc_detail' })); }}
        onUnarchiveDoc={id => executeAsync(() => {
          const found = documents.find(doc => doc.id === id);
          if (!found || (found.archivedSectorId ?? found.sectorId) !== sectorId) return Promise.resolve(false);
          const updatedDoc: Document = {
            ...found,
            isArchived: false,
            archivedAt: undefined,
            archivedByUserId: undefined,
            archivedSectorId: undefined,
            comments: [...(found.comments || []), {
              id: generateId(),
              userId: currentUserEffective!.id,
              userName: currentUserEffective!.name,
              text: 'DESARQUIVAMENTO REALIZADO',
              timestamp: new Date().toISOString(),
            }],
          };
          return syncState<Document>('documents', updatedDoc, setDocuments);
        })}
        onUnarchiveProc={id => executeAsync(() => {
          const found = processes.find(proc => proc.id === id);
          if (!found || (found.archivedSectorId ?? found.sectorId) !== sectorId) return Promise.resolve(false);
          const updatedProc: Process = {
            ...found,
            isArchived: false,
            status: 'Aberto',
            archivedAt: undefined,
            archivedByUserId: undefined,
            archivedSectorId: undefined,
            history: [...(found.history || []), {
              id: generateId(),
              userId: currentUserEffective!.id,
              userName: currentUserEffective!.name,
              action: 'DESARQUIVAMENTO REALIZADO',
              timestamp: new Date().toISOString(),
            }],
          };
          return syncState<Process>('processes', updatedProc, setProcesses);
        })}
      />;
      default: return <div className="p-20 text-center text-slate-400 font-black uppercase tracking-widest italic">Módulo indisponível</div>;
    }
  };

  if (isLoading) return <div className="min-h-screen bg-slate-950 flex items-center justify-center"><div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div></div>;
  
  if (appState.viewMode === ViewMode.LOGIN) return <Login onLogin={handleLogin} />;
  
  if (appState.viewMode === ViewMode.UNIT_SELECT) {
    const availableUnits = units.filter(u => currentUserEffective?.cpf === MASTER_CPF || (currentUserEffective?.assignments || []).some(a => a.unitId === u.id));
    return <UnitSelect units={availableUnits} onSelect={handleUnitSelect} />;
  }
  
  if (appState.viewMode === ViewMode.SECTOR_SELECT) {
    return <SectorSelect 
      sectors={sectors} 
      user={currentUserEffective!} 
      activeUnitId={appState.activeUnit?.id || ''} 
      profiles={profiles}
      onSelect={handleSectorSelect} 
      onProvision={async () => {
       if (currentUserEffective?.cpf === MASTER_CPF && appState.activeUnit) {
          const newSectorId = generateId();
          const newSector = { id: newSectorId, name: 'PROTOCOLO CENTRAL', unitId: appState.activeUnit.id };
          
          // 1. Criar o setor
          await executeAsync(() => syncState<Sector>('sectors', newSector, setSectors));
          
          // 2. Vincular o usuário a este novo setor
          const updatedUser = {
            ...currentUserEffective,
            assignments: [
              ...currentUserEffective.assignments,
              { unitId: appState.activeUnit.id, sectorId: newSectorId, profileId: MASTER_PROFILE_ID }
            ]
          };
          
          await executeAsync(() => syncState<User>('users', updatedUser, setUsers));
          setAppState(prev => ({ ...prev, currentUser: updatedUser }));
       }
      }} 
    />;
  }

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden text-black font-sans selection:bg-indigo-100 animate-fade-in">
      <Sidebar activeSubView={appState.activeSubView} onNavigate={v => { setActiveProcessContext(null); setAppState(prev => ({ ...prev, activeSubView: v })); }} permissions={userPermissions} />
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar user={currentUserEffective!} activeSector={appState.activeSector!} sectors={sectors} units={units} activeUnit={appState.activeUnit!} onLogout={() => setAppState(prev => ({ ...prev, viewMode: ViewMode.LOGIN, activeUnit: null, activeSector: null, activeProfile: null, currentUser: null }))} onSwitchSector={handleSectorSelect} onSwitchUnit={handleUnitSelect} onNavigateToSettings={() => setAppState(prev => ({ ...prev, activeSubView: 'personal_settings' }))} />
        <GlobalFeedback status={feedback.status} message={feedback.message} onClose={() => setFeedback({ status: null, message: '' })} />
        <main className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar relative">
          {appState.activeSubView !== 'dashboard' && (
            <button onClick={handleBack} className="mb-6 flex items-center gap-3 text-slate-400 hover:text-indigo-600 transition-all group z-10 relative">
              <div className="w-10 h-10 rounded-2xl bg-white border border-slate-200 flex items-center justify-center group-hover:border-indigo-200 shadow-sm group-hover:shadow-md transition-all">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M15 19l-7-7 7-7" /></svg>
              </div>
              <span className="text-[10px] font-black uppercase tracking-[0.2em] italic">Voltar</span>
            </button>
          )}
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default App;
