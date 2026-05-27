
export type OrganizationalUnit = {
  id: string;
  name: string;
  cnpj?: string;
  address?: string;
  isPrimary?: boolean;
};

export type AccessLevelConfig = {
  id: string;
  name: string;
  color: string; // Hex color for the badge
  unitId: string;
};

export type AuditEntry = {
  id: string;
  userId: string;
  userName: string;
  action: string;
  timestamp: string;
  justification?: string;
};

export type AccessLog = {
  id: string;
  userId: string;
  userName: string;
  resourceId: string;
  resourceNup: string;
  resourceType: 'Documento' | 'Processo';
  timestamp: string;
  ip: string;
  unitId: string;
};

export type Permission = 
  // Geral
  | 'view_dashboard'
  | 'view_archive_center'
  | 'view_files'
  // Documentos
  | 'doc_view' 
  | 'doc_view_all_sectors'
  | 'doc_create' 
  | 'doc_edit' 
  | 'doc_tramitar' 
  | 'doc_arquivar' 
  | 'doc_anexar' 
  | 'doc_autuar'
  // Processos
  | 'proc_view' 
  | 'proc_view_all_sectors'
  | 'proc_create' 
  | 'proc_edit' 
  | 'proc_tramitar' 
  | 'proc_arquivar' 
  | 'proc_capa'
  | 'proc_annex'
  | 'proc_unannex'
  | 'doc_unannex_others'
  | 'proc_unannex_others'
  | 'archive_manage'
  // Administração
  | 'access_settings' 
  | 'set_units' 
  | 'set_users' 
  | 'set_profiles'
  | 'set_sectors'
  | 'set_sectors_all_units'
  | 'set_doctypes'
  | 'set_classifications'
  | 'set_covers'
  | 'set_contracts'
  | 'set_portal_services'
  | 'set_access_levels'
  | 'set_interested'
  | 'set_repository'
  | 'view_audit';

export type Profile = {
  id: string;
  name: string;
  permissions: Permission[];
  unitId: string;
};

export type WebProtocolStatus = 'Pendente' | 'Aceito' | 'Recusado' | 'Pendencia' | 'AguardandoResposta' | 'RespostaEnviada';
export type WebProtocolPendingType = 'Documental' | 'Informacao';

export type UserAssignment = {
  unitId: string;
  sectorId: string;
  profileId: string;
};

export type User = {
  id: string;
  cpf: string;
  name: string;
  email?: string;
  phone?: string;
  password?: string;
  assignments: UserAssignment[];
  authorizedAccessLevelIds: string[]; // Níveis que este usuário pode acessar
  avatarColor?: string; // Cor personalizada do avatar
};

export type Sector = {
  id: string;
  name: string;
  unitId: string;
};

export type DocType = {
  id: string;
  name: string;
  unitId: string;
};

export type ArchivalClassification = {
  id: string;
  code: string;
  name: string;
  description?: string;
  parentId?: string;
  retentionCurrentYears?: string;
  retentionIntermediateYears?: string;
  finalDisposition?: 'Guarda Permanente' | 'Eliminacao' | 'Nao Definida';
  legalBasis?: string;
  notes?: string;
  unitId: string;
};

export type Contract = {
  id: string;
  number: string;
  description: string;
  unitId: string;
};

export type Interested = {
  id: string;
  type: 'Pessoa' | 'Empresa';
  name: string;
  identifier: string; 
  email?: string;
  password?: string;
  unitId: string;
};

export type CoverTemplate = {
  id: string;
  name: string;
  content: string;
  isActive: boolean;
  unitId: string;
  sourceFileName?: string;
};

export type PortalServiceAttachmentField = {
  id: string;
  label: string;
  required: boolean;
};

export type PortalService = {
  id: string;
  name: string;
  description: string;
  unitId: string;
  sectorId: string;
  accessLevelId: string;
  docTypeId: string;
  isActive: boolean;
  coverTemplateId?: string;
  attachmentFields?: PortalServiceAttachmentField[];
};

export type DocComment = {
  id: string;
  userId: string;
  userName: string;
  text: string;
  timestamp: string;
};

export type DocAttachment = {
  name: string;
  content: string; // Base64
};

export type DigitalSignature = {
  id: string;
  signerUserId: string;
  signerName: string;
  signerCpf: string;
  signedAt: string;
  algorithm: 'SHA-256';
  contentHash: string;
  signedFileName?: string;
};

export type Document = {
  id: string;
  nup: string;
  description: string;
  typeId: string;
  interestedIds: string[];
  sectorId: string;
  createdAt: string;
  annexedAt?: string;
  annexedByUserId?: string; // ID do usuário que anexou este documento ao processo
  fileName?: string;
  fileContent?: string; // Base64 do arquivo principal
  isArchived: boolean;
  archivedAt?: string;
  archivedByUserId?: string;
  archivedSectorId?: string;
  accessLevelId: string; 
  authorId: string;
  archivalClassificationId?: string;
  contractId?: string;
  processId?: string;
  parentDocId?: string;
  attachments: DocAttachment[]; 
  signatures?: DigitalSignature[];
  comments?: DocComment[];
  isPendingReception?: boolean;
  senderSectorId?: string;
  destinationSectorId?: string;
  destinationUserId?: string;
  unitId: string;
};

export type Process = {
  id: string;
  nup: string;
  description: string;
  interestedIds: string[];
  sectorId: string;
  createdAt: string;
  status: 'Aberto' | 'Tramitado' | 'Arquivado';
  isArchived: boolean;
  archivedAt?: string;
  archivedByUserId?: string;
  archivedSectorId?: string;
  accessLevelId: string; 
  archivalClassificationId?: string;
  contractId?: string;
  coverTemplateId?: string;
  parentProcessId?: string;
  annexType?: 'Anexação' | 'Apensação';
  annexedByUserId?: string; // ID do usuário que anexou este processo a um processo pai
  isPendingReception?: boolean;
  senderSectorId?: string;
  destinationSectorId?: string;
  destinationUserId?: string;
  unitId: string;
  isWebProtocol?: boolean;
  webProtocolStatus?: WebProtocolStatus;
  webProtocolMessage?: string;
  webProtocolReviewedAt?: string;
  webProtocolReviewedByUserId?: string;
  webProtocolPendingType?: WebProtocolPendingType;
  webProtocolPendingResponseText?: string;
  webProtocolPendingResponseFileName?: string;
  attachments?: ProcessAttachment[];
  history: AuditEntry[];
};

export type ProcessAttachment = {
  id: string;
  name: string;
  content: string;
  fieldLabel?: string;
  uploadedAt: string;
  uploadedBy?: string;
};

export enum ViewMode {
  LOGIN,
  UNIT_SELECT,
  SECTOR_SELECT,
  DASHBOARD
}

export type AppState = {
  currentUser: User | null;
  activeUnit: OrganizationalUnit | null;
  activeSector: Sector | null;
  activeProfile: Profile | null;
  viewMode: ViewMode;
  activeSubView: string;
}

export type ExternalPortalRecord = {
  id: string;
  processId: string;
  nup: string;
  description: string;
  createdAt: string;
  status?: Process['status'];
  serviceName?: string;
  sectorName?: string;
  webProtocolStatus?: WebProtocolStatus;
  webProtocolMessage?: string;
  webProtocolReviewedAt?: string;
  webProtocolPendingType?: WebProtocolPendingType;
  webProtocolPendingResponseText?: string;
  webProtocolPendingResponseFileName?: string;
};

export type ExternalPortalProcessDocument = {
  id: string;
  nup: string;
  description: string;
  createdAt: string;
  annexedAt?: string;
  fileName?: string;
  fileContent?: string;
  typeName?: string;
  sectorName?: string;
};

export type ExternalPortalProcessDetail = {
  process: {
    id: string;
    nup: string;
    description: string;
    createdAt: string;
    status: Process['status'];
    sectorName?: string;
    serviceName?: string;
    coverTemplateName?: string;
    coverTemplateContent?: string;
    webProtocolStatus?: WebProtocolStatus;
    webProtocolMessage?: string;
    webProtocolReviewedAt?: string;
    webProtocolPendingType?: WebProtocolPendingType;
    webProtocolPendingResponseText?: string;
    webProtocolPendingResponseFileName?: string;
  };
  documents: ExternalPortalProcessDocument[];
  history: AuditEntry[];
};

export type ExternalPortalPreparation = {
  identifier: string;
  name: string;
  processCount: number;
  documentCount: number;
  hasAccount: boolean;
};

export type ExternalPortalSession = {
  identifier: string;
  name: string;
  processes: ExternalPortalRecord[];
  services: PortalService[];
};
