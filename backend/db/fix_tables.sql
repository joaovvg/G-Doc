-- Script de Correção e Criação de Tabelas Ausentes
-- Este script foi refatorado para ser idempotente (seguro de rodar múltiplas vezes).

-- ========================================
-- 1. CORRIGIR COLUNAS AUSENTES - ADICIONAR CREATED_AT E UPDATED_AT
-- ========================================
ALTER TABLE IF EXISTS organizational_units ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
ALTER TABLE IF EXISTS organizational_units ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

ALTER TABLE IF EXISTS profiles ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
ALTER TABLE IF EXISTS profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

ALTER TABLE IF EXISTS sectors ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
ALTER TABLE IF EXISTS sectors ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

ALTER TABLE IF EXISTS users ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
ALTER TABLE IF EXISTS users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

ALTER TABLE IF EXISTS doc_types ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
ALTER TABLE IF EXISTS doc_types ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

ALTER TABLE IF EXISTS archival_classifications ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
ALTER TABLE IF EXISTS archival_classifications ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
ALTER TABLE IF EXISTS archival_classifications ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE IF EXISTS archival_classifications ADD COLUMN IF NOT EXISTS parent_id UUID;
ALTER TABLE IF EXISTS archival_classifications ADD COLUMN IF NOT EXISTS retention_current_years TEXT;
ALTER TABLE IF EXISTS archival_classifications ADD COLUMN IF NOT EXISTS retention_intermediate_years TEXT;
ALTER TABLE IF EXISTS archival_classifications ADD COLUMN IF NOT EXISTS final_disposition TEXT;
ALTER TABLE IF EXISTS archival_classifications ADD COLUMN IF NOT EXISTS legal_basis TEXT;
ALTER TABLE IF EXISTS archival_classifications ADD COLUMN IF NOT EXISTS notes TEXT;

ALTER TABLE IF EXISTS contracts ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
ALTER TABLE IF EXISTS contracts ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

ALTER TABLE IF EXISTS interested_parties ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE IF EXISTS interested_parties ADD COLUMN IF NOT EXISTS password TEXT;
ALTER TABLE IF EXISTS interested_parties ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
ALTER TABLE IF EXISTS interested_parties ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

ALTER TABLE IF EXISTS cover_templates ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
ALTER TABLE IF EXISTS cover_templates ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

ALTER TABLE IF EXISTS access_levels ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
ALTER TABLE IF EXISTS access_levels ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
ALTER TABLE IF EXISTS access_logs ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
ALTER TABLE IF EXISTS access_logs ADD COLUMN IF NOT EXISTS event_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW();
UPDATE access_logs SET created_at = COALESCE(created_at, NOW()) WHERE created_at IS NULL;
UPDATE access_logs SET event_timestamp = COALESCE(event_timestamp, created_at, NOW()) WHERE event_timestamp IS NULL;
ALTER TABLE IF EXISTS access_logs ALTER COLUMN created_at SET DEFAULT NOW();
ALTER TABLE IF EXISTS access_logs ALTER COLUMN event_timestamp SET DEFAULT NOW();

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

ALTER TABLE IF EXISTS processes ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
ALTER TABLE IF EXISTS documents ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
ALTER TABLE IF EXISTS processes ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;
ALTER TABLE IF EXISTS processes ADD COLUMN IF NOT EXISTS archived_by_user_id UUID;
ALTER TABLE IF EXISTS processes ADD COLUMN IF NOT EXISTS archived_sector_id UUID;
ALTER TABLE IF EXISTS documents ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;
ALTER TABLE IF EXISTS documents ADD COLUMN IF NOT EXISTS archived_by_user_id UUID;
ALTER TABLE IF EXISTS documents ADD COLUMN IF NOT EXISTS archived_sector_id UUID;
ALTER TABLE IF EXISTS documents ADD COLUMN IF NOT EXISTS signatures JSONB NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE IF EXISTS portal_services ADD COLUMN IF NOT EXISTS cover_template_id UUID;
ALTER TABLE IF EXISTS portal_services ADD COLUMN IF NOT EXISTS doc_type_id UUID;
ALTER TABLE IF EXISTS portal_services ADD COLUMN IF NOT EXISTS attachment_fields JSONB NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE IF EXISTS process_attachments ADD COLUMN IF NOT EXISTS field_label TEXT;
ALTER TABLE IF EXISTS process_attachments ADD COLUMN IF NOT EXISTS position INTEGER NOT NULL DEFAULT 0;
ALTER TABLE IF EXISTS process_attachments ADD COLUMN IF NOT EXISTS uploaded_by TEXT;
ALTER TABLE IF EXISTS process_attachments ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();


-- ========================================
-- 2. CORRIGIR OUTRAS TABELAS POTENCIALMENTE INCOMPLETAS (VÍNCULOS)
-- ========================================

DO $$
BEGIN
    -- Tabelas e suas restrições
    -- === PROCESSES ===
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_processes_sector_id') THEN
        ALTER TABLE processes ADD CONSTRAINT fk_processes_sector_id FOREIGN KEY (sector_id) REFERENCES sectors(id) ON DELETE SET NULL;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_processes_access_level_id') THEN
        ALTER TABLE processes ADD CONSTRAINT fk_processes_access_level_id FOREIGN KEY (access_level_id) REFERENCES access_levels(id) ON DELETE SET NULL;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_processes_archival_classification_id') THEN
        ALTER TABLE processes ADD CONSTRAINT fk_processes_archival_classification_id FOREIGN KEY (archival_classification_id) REFERENCES archival_classifications(id) ON DELETE SET NULL;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_processes_contract_id') THEN
        ALTER TABLE processes ADD CONSTRAINT fk_processes_contract_id FOREIGN KEY (contract_id) REFERENCES contracts(id) ON DELETE SET NULL;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_processes_cover_template_id') THEN
        ALTER TABLE processes ADD CONSTRAINT fk_processes_cover_template_id FOREIGN KEY (cover_template_id) REFERENCES cover_templates(id) ON DELETE SET NULL;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_processes_annexed_by_user_id') THEN
        ALTER TABLE processes ADD CONSTRAINT fk_processes_annexed_by_user_id FOREIGN KEY (annexed_by_user_id) REFERENCES users(id) ON DELETE SET NULL;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_processes_archived_by_user_id') THEN
        ALTER TABLE processes ADD CONSTRAINT fk_processes_archived_by_user_id FOREIGN KEY (archived_by_user_id) REFERENCES users(id) ON DELETE SET NULL;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_processes_archived_sector_id') THEN
        ALTER TABLE processes ADD CONSTRAINT fk_processes_archived_sector_id FOREIGN KEY (archived_sector_id) REFERENCES sectors(id) ON DELETE SET NULL;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_processes_destination_user_id') THEN
        ALTER TABLE processes ADD CONSTRAINT fk_processes_destination_user_id FOREIGN KEY (destination_user_id) REFERENCES users(id) ON DELETE SET NULL;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_processes_unit_id') THEN
        ALTER TABLE processes ADD CONSTRAINT fk_processes_unit_id FOREIGN KEY (unit_id) REFERENCES organizational_units(id) ON DELETE CASCADE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_portal_services_cover_template_id') THEN
        ALTER TABLE portal_services ADD CONSTRAINT fk_portal_services_cover_template_id FOREIGN KEY (cover_template_id) REFERENCES cover_templates(id) ON DELETE SET NULL;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_portal_services_doc_type_id') THEN
        ALTER TABLE portal_services ADD CONSTRAINT fk_portal_services_doc_type_id FOREIGN KEY (doc_type_id) REFERENCES doc_types(id) ON DELETE SET NULL;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_processes_sender_sector_id') THEN
        ALTER TABLE processes ADD CONSTRAINT fk_processes_sender_sector_id FOREIGN KEY (sender_sector_id) REFERENCES sectors(id) ON DELETE SET NULL;
    END IF;

    -- === DOCUMENTS ===
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_documents_type_id') THEN
        ALTER TABLE documents ADD CONSTRAINT fk_documents_type_id FOREIGN KEY (type_id) REFERENCES doc_types(id) ON DELETE SET NULL;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_documents_sector_id') THEN
        ALTER TABLE documents ADD CONSTRAINT fk_documents_sector_id FOREIGN KEY (sector_id) REFERENCES sectors(id) ON DELETE SET NULL;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_documents_access_level_id') THEN
        ALTER TABLE documents ADD CONSTRAINT fk_documents_access_level_id FOREIGN KEY (access_level_id) REFERENCES access_levels(id) ON DELETE SET NULL;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_documents_author_id') THEN
        ALTER TABLE documents ADD CONSTRAINT fk_documents_author_id FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE SET NULL;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_documents_archival_classification_id') THEN
        ALTER TABLE documents ADD CONSTRAINT fk_documents_archival_classification_id FOREIGN KEY (archival_classification_id) REFERENCES archival_classifications(id) ON DELETE SET NULL;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_documents_contract_id') THEN
        ALTER TABLE documents ADD CONSTRAINT fk_documents_contract_id FOREIGN KEY (contract_id) REFERENCES contracts(id) ON DELETE SET NULL;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_documents_annexed_by_user_id') THEN
        ALTER TABLE documents ADD CONSTRAINT fk_documents_annexed_by_user_id FOREIGN KEY (annexed_by_user_id) REFERENCES users(id) ON DELETE SET NULL;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_documents_archived_by_user_id') THEN
        ALTER TABLE documents ADD CONSTRAINT fk_documents_archived_by_user_id FOREIGN KEY (archived_by_user_id) REFERENCES users(id) ON DELETE SET NULL;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_documents_archived_sector_id') THEN
        ALTER TABLE documents ADD CONSTRAINT fk_documents_archived_sector_id FOREIGN KEY (archived_sector_id) REFERENCES sectors(id) ON DELETE SET NULL;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_documents_destination_user_id') THEN
        ALTER TABLE documents ADD CONSTRAINT fk_documents_destination_user_id FOREIGN KEY (destination_user_id) REFERENCES users(id) ON DELETE SET NULL;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_documents_unit_id') THEN
        ALTER TABLE documents ADD CONSTRAINT fk_documents_unit_id FOREIGN KEY (unit_id) REFERENCES organizational_units(id) ON DELETE CASCADE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_documents_sender_sector_id') THEN
        ALTER TABLE documents ADD CONSTRAINT fk_documents_sender_sector_id FOREIGN KEY (sender_sector_id) REFERENCES sectors(id) ON DELETE SET NULL;
    END IF;

    -- === PROCESS HISTORY ===
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_process_history_process_id') THEN
        ALTER TABLE process_history ADD CONSTRAINT fk_process_history_process_id FOREIGN KEY (process_id) REFERENCES processes(id) ON DELETE CASCADE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_process_history_user_id') THEN
        ALTER TABLE process_history ADD CONSTRAINT fk_process_history_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_process_attachments_process_id') THEN
        ALTER TABLE process_attachments ADD CONSTRAINT fk_process_attachments_process_id FOREIGN KEY (process_id) REFERENCES processes(id) ON DELETE CASCADE;
    END IF;

    -- === OTHERS (INTERESTED, ATTACHMENTS, COMMENTS, ASSIGNMENTS) ===
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_document_interested_document_id') THEN
        ALTER TABLE document_interested ADD CONSTRAINT fk_document_interested_document_id FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_document_interested_interested_id') THEN
        ALTER TABLE document_interested ADD CONSTRAINT fk_document_interested_interested_id FOREIGN KEY (interested_id) REFERENCES interested_parties(id) ON DELETE CASCADE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_process_interested_process_id') THEN
        ALTER TABLE process_interested ADD CONSTRAINT fk_process_interested_process_id FOREIGN KEY (process_id) REFERENCES processes(id) ON DELETE CASCADE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_process_interested_interested_id') THEN
        ALTER TABLE process_interested ADD CONSTRAINT fk_process_interested_interested_id FOREIGN KEY (interested_id) REFERENCES interested_parties(id) ON DELETE CASCADE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_document_attachments_document_id') THEN
        ALTER TABLE document_attachments ADD CONSTRAINT fk_document_attachments_document_id FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_document_comments_document_id') THEN
        ALTER TABLE document_comments ADD CONSTRAINT fk_document_comments_document_id FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_document_comments_user_id') THEN
        ALTER TABLE document_comments ADD CONSTRAINT fk_document_comments_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_user_assignments_profile_id') THEN
        ALTER TABLE user_assignments ADD CONSTRAINT fk_user_assignments_profile_id FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_user_access_levels_user_id') THEN
        ALTER TABLE user_access_levels ADD CONSTRAINT fk_user_access_levels_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_user_access_levels_access_level_id') THEN
        ALTER TABLE user_access_levels ADD CONSTRAINT fk_user_access_levels_access_level_id FOREIGN KEY (access_level_id) REFERENCES access_levels(id) ON DELETE CASCADE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_access_logs_user_id') THEN
        ALTER TABLE access_logs ADD CONSTRAINT fk_access_logs_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_access_logs_unit_id') THEN
        ALTER TABLE access_logs ADD CONSTRAINT fk_access_logs_unit_id FOREIGN KEY (unit_id) REFERENCES organizational_units(id) ON DELETE CASCADE;
    END IF;

    -- Alterar colunas para permitir NULL onde queremos usar ON DELETE SET NULL
    BEGIN
        ALTER TABLE process_history ALTER COLUMN user_id DROP NOT NULL;
    EXCEPTION WHEN OTHERS THEN
        -- ignora caso ocorra erro (ex: sintaxe ou objetos ausentes)
    END;

    BEGIN
        ALTER TABLE document_comments ALTER COLUMN user_id DROP NOT NULL;
    EXCEPTION WHEN OTHERS THEN
    END;

    BEGIN
        ALTER TABLE access_logs ALTER COLUMN user_id DROP NOT NULL;
    EXCEPTION WHEN OTHERS THEN
    END;

END $$;

-- ========================================
-- 3. VERIFICAR ÍNDICES
-- ========================================
CREATE INDEX IF NOT EXISTS idx_doc_types_unit_id ON doc_types(unit_id);
CREATE INDEX IF NOT EXISTS idx_profiles_unit_id ON profiles(unit_id);
CREATE INDEX IF NOT EXISTS idx_sectors_unit_id ON sectors(unit_id);
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

-- ========================================
-- 4. LISTAR TODAS AS TABELAS PARA VERIFICAÇÃO
-- ========================================
SELECT 
  tablename,
  (SELECT count(*) FROM information_schema.columns WHERE table_name = tablename) as total_columns
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
