CREATE TABLE IF NOT EXISTS organizational_units (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  cnpj TEXT,
  address TEXT,
  is_primary BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  unit_id UUID REFERENCES organizational_units(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS profile_permissions (
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  permission TEXT NOT NULL,
  PRIMARY KEY (profile_id, permission)
);

CREATE TABLE IF NOT EXISTS sectors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  unit_id UUID REFERENCES organizational_units(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cpf TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  password TEXT,
  avatar_color TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS doc_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  unit_id UUID REFERENCES organizational_units(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS archival_classifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  parent_id UUID REFERENCES archival_classifications(id) ON DELETE SET NULL,
  retention_current_years TEXT,
  retention_intermediate_years TEXT,
  final_disposition TEXT,
  legal_basis TEXT,
  notes TEXT,
  unit_id UUID REFERENCES organizational_units(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  number TEXT NOT NULL,
  description TEXT NOT NULL,
  unit_id UUID REFERENCES organizational_units(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS interested_parties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN ('Pessoa', 'Empresa')),
  name TEXT NOT NULL,
  identifier TEXT NOT NULL,
  email TEXT,
  password TEXT,
  unit_id UUID REFERENCES organizational_units(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS external_portal_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier_normalized TEXT NOT NULL UNIQUE,
  identifier_display TEXT NOT NULL,
  interested_name TEXT NOT NULL,
  password TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS portal_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  unit_id UUID NOT NULL REFERENCES organizational_units(id) ON DELETE CASCADE,
  sector_id UUID NOT NULL REFERENCES sectors(id) ON DELETE CASCADE,
  access_level_id UUID NOT NULL REFERENCES access_levels(id) ON DELETE CASCADE,
  doc_type_id UUID REFERENCES doc_types(id) ON DELETE SET NULL,
  cover_template_id UUID,
  attachment_fields JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS external_portal_protocols (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_identifier_normalized TEXT NOT NULL,
  interested_id UUID NOT NULL REFERENCES interested_parties(id) ON DELETE CASCADE,
  process_id UUID NOT NULL UNIQUE REFERENCES processes(id) ON DELETE CASCADE,
  portal_service_id UUID NOT NULL REFERENCES portal_services(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS cover_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  content TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT FALSE,
  unit_id UUID REFERENCES organizational_units(id) ON DELETE CASCADE,
  source_file_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS access_levels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  color TEXT NOT NULL,
  unit_id UUID REFERENCES organizational_units(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS portal_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  unit_id UUID NOT NULL REFERENCES organizational_units(id) ON DELETE CASCADE,
  sector_id UUID NOT NULL REFERENCES sectors(id) ON DELETE CASCADE,
  access_level_id UUID NOT NULL REFERENCES access_levels(id) ON DELETE CASCADE,
  doc_type_id UUID REFERENCES doc_types(id) ON DELETE SET NULL,
  cover_template_id UUID,
  attachment_fields JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS counters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  value BIGINT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_assignments (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  unit_id UUID NOT NULL REFERENCES organizational_units(id) ON DELETE CASCADE,
  sector_id UUID NOT NULL REFERENCES sectors(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, unit_id, sector_id)
);

CREATE TABLE IF NOT EXISTS user_access_levels (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  access_level_id UUID NOT NULL REFERENCES access_levels(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, access_level_id)
);

CREATE TABLE IF NOT EXISTS processes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nup TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL,
  sector_id UUID REFERENCES sectors(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('Aberto', 'Tramitado', 'Arquivado')),
  is_archived BOOLEAN NOT NULL DEFAULT FALSE,
  archived_at TIMESTAMPTZ,
  archived_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  archived_sector_id UUID REFERENCES sectors(id) ON DELETE SET NULL,
  access_level_id UUID REFERENCES access_levels(id) ON DELETE SET NULL,
  archival_classification_id UUID REFERENCES archival_classifications(id) ON DELETE SET NULL,
  contract_id UUID REFERENCES contracts(id) ON DELETE SET NULL,
  cover_template_id UUID REFERENCES cover_templates(id) ON DELETE SET NULL,
  parent_process_id UUID REFERENCES processes(id) ON DELETE SET NULL,
  annex_type TEXT CHECK (annex_type IN ('Anexação', 'Apensação')),
  annexed_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  is_pending_reception BOOLEAN NOT NULL DEFAULT FALSE,
  sender_sector_id UUID REFERENCES sectors(id) ON DELETE SET NULL,
  destination_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  web_protocol_status TEXT,
  web_protocol_message TEXT,
  web_protocol_reviewed_at TIMESTAMPTZ,
  web_protocol_reviewed_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  web_protocol_pending_type TEXT,
  web_protocol_pending_response_text TEXT,
  web_protocol_pending_response_file_name TEXT,
  unit_id UUID NOT NULL REFERENCES organizational_units(id) ON DELETE CASCADE,
  created_row_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS process_interested (
  process_id UUID NOT NULL REFERENCES processes(id) ON DELETE CASCADE,
  interested_id UUID NOT NULL REFERENCES interested_parties(id) ON DELETE CASCADE,
  PRIMARY KEY (process_id, interested_id)
);

CREATE TABLE IF NOT EXISTS process_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  process_id UUID NOT NULL REFERENCES processes(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  user_name TEXT NOT NULL,
  action_text TEXT NOT NULL,
  event_timestamp TIMESTAMPTZ NOT NULL,
  justification TEXT
);

CREATE TABLE IF NOT EXISTS process_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  process_id UUID NOT NULL REFERENCES processes(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_content TEXT NOT NULL,
  field_label TEXT,
  position INTEGER NOT NULL DEFAULT 0,
  uploaded_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nup TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL,
  type_id UUID REFERENCES doc_types(id) ON DELETE SET NULL,
  sector_id UUID REFERENCES sectors(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL,
  annexed_at TIMESTAMPTZ,
  annexed_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  archived_at TIMESTAMPTZ,
  archived_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  archived_sector_id UUID REFERENCES sectors(id) ON DELETE SET NULL,
  file_name TEXT,
  file_content TEXT,
  is_archived BOOLEAN NOT NULL DEFAULT FALSE,
  access_level_id UUID REFERENCES access_levels(id) ON DELETE SET NULL,
  author_id UUID REFERENCES users(id) ON DELETE SET NULL,
  archival_classification_id UUID REFERENCES archival_classifications(id) ON DELETE SET NULL,
  contract_id UUID REFERENCES contracts(id) ON DELETE SET NULL,
  process_id UUID REFERENCES processes(id) ON DELETE SET NULL,
  parent_doc_id UUID REFERENCES documents(id) ON DELETE SET NULL,
  signatures JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_pending_reception BOOLEAN NOT NULL DEFAULT FALSE,
  sender_sector_id UUID REFERENCES sectors(id) ON DELETE SET NULL,
  destination_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  unit_id UUID NOT NULL REFERENCES organizational_units(id) ON DELETE CASCADE,
  created_row_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS document_interested (
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  interested_id UUID NOT NULL REFERENCES interested_parties(id) ON DELETE CASCADE,
  PRIMARY KEY (document_id, interested_id)
);

CREATE TABLE IF NOT EXISTS document_attachments (
  id BIGSERIAL PRIMARY KEY,
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_content TEXT NOT NULL,
  position INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS document_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  user_name TEXT NOT NULL,
  comment_text TEXT NOT NULL,
  event_timestamp TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS access_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  user_name TEXT NOT NULL,
  resource_id TEXT NOT NULL,
  resource_nup TEXT NOT NULL,
  resource_type TEXT NOT NULL CHECK (resource_type IN ('Documento', 'Processo')),
  event_timestamp TIMESTAMPTZ NOT NULL,
  ip TEXT NOT NULL,
  unit_id UUID NOT NULL REFERENCES organizational_units(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_profiles_unit_id ON profiles(unit_id);
CREATE INDEX IF NOT EXISTS idx_sectors_unit_id ON sectors(unit_id);
CREATE INDEX IF NOT EXISTS idx_doc_types_unit_id ON doc_types(unit_id);
CREATE INDEX IF NOT EXISTS idx_classifications_unit_id ON archival_classifications(unit_id);
CREATE INDEX IF NOT EXISTS idx_contracts_unit_id ON contracts(unit_id);
CREATE INDEX IF NOT EXISTS idx_interested_unit_id ON interested_parties(unit_id);
CREATE INDEX IF NOT EXISTS idx_cover_templates_unit_id ON cover_templates(unit_id);
CREATE INDEX IF NOT EXISTS idx_access_levels_unit_id ON access_levels(unit_id);
CREATE INDEX IF NOT EXISTS idx_processes_unit_sector ON processes(unit_id, sector_id);
CREATE INDEX IF NOT EXISTS idx_process_attachments_process_id ON process_attachments(process_id);
CREATE INDEX IF NOT EXISTS idx_documents_unit_sector ON documents(unit_id, sector_id);
CREATE INDEX IF NOT EXISTS idx_documents_process_id ON documents(process_id);
CREATE INDEX IF NOT EXISTS idx_access_logs_unit_id ON access_logs(unit_id);

DO $$
DECLARE
  has_created_at BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = current_schema()
      AND table_name = 'access_logs'
      AND column_name = 'created_at'
  ) INTO has_created_at;

  IF has_created_at THEN
    EXECUTE 'ALTER TABLE access_logs ADD COLUMN IF NOT EXISTS event_timestamp TIMESTAMPTZ';
    EXECUTE 'UPDATE access_logs SET event_timestamp = COALESCE(event_timestamp, created_at) WHERE event_timestamp IS NULL';
  ELSE
    EXECUTE 'ALTER TABLE access_logs ADD COLUMN IF NOT EXISTS event_timestamp TIMESTAMPTZ DEFAULT NOW()';
    EXECUTE 'UPDATE access_logs SET event_timestamp = COALESCE(event_timestamp, NOW()) WHERE event_timestamp IS NULL';
  END IF;

  EXECUTE 'ALTER TABLE access_logs ALTER COLUMN event_timestamp SET DEFAULT NOW()';
  EXECUTE 'ALTER TABLE access_logs ALTER COLUMN event_timestamp SET NOT NULL';
END $$;

ALTER TABLE processes ADD COLUMN IF NOT EXISTS web_protocol_status TEXT;
ALTER TABLE processes ADD COLUMN IF NOT EXISTS web_protocol_message TEXT;
ALTER TABLE processes ADD COLUMN IF NOT EXISTS web_protocol_reviewed_at TIMESTAMPTZ;
ALTER TABLE processes ADD COLUMN IF NOT EXISTS web_protocol_reviewed_by_user_id UUID;
ALTER TABLE processes ADD COLUMN IF NOT EXISTS web_protocol_pending_type TEXT;
ALTER TABLE processes ADD COLUMN IF NOT EXISTS web_protocol_pending_response_text TEXT;
ALTER TABLE processes ADD COLUMN IF NOT EXISTS web_protocol_pending_response_file_name TEXT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE table_schema = current_schema()
      AND table_name = 'processes'
      AND constraint_name = 'processes_web_protocol_reviewed_by_user_id_fkey'
  ) THEN
    ALTER TABLE processes
      ADD CONSTRAINT processes_web_protocol_reviewed_by_user_id_fkey
      FOREIGN KEY (web_protocol_reviewed_by_user_id) REFERENCES users(id) ON DELETE SET NULL;
  END IF;
END $$;
