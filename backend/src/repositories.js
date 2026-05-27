import { randomUUID } from 'crypto';
import { pool, withTransaction } from './db.js';

const toUuid = (val) => (val === null || val === '' || val === undefined) ? null : val;
const asJsonArray = (value, fallback = []) => {
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : fallback;
    } catch {
      return fallback;
    }
  }
  return fallback;
};

const columnCache = new Map();

const getExistingColumns = async (tableName, columns) => {
  const cacheKey = `${tableName}:${columns.join(',')}`;
  if (columnCache.has(cacheKey)) {
    return columnCache.get(cacheKey);
  }

  const { rows } = await pool.query(
    `
      SELECT column_name
      FROM information_schema.columns
      WHERE table_schema = current_schema()
        AND table_name = $1
        AND column_name = ANY($2::text[])
    `,
    [tableName, columns]
  );
  const existingColumns = columns.filter((column) => rows.some((row) => row.column_name === column));
  columnCache.set(cacheKey, existingColumns);
  return existingColumns;
};

const hasColumn = async (tableName, column) => {
  const existingColumns = await getExistingColumns(tableName, [column]);
  return existingColumns.includes(column);
};

const SIMPLE_TABLES = {
  units: {
    table: 'organizational_units',
    columns: ['id', 'name', 'cnpj', 'address', 'is_primary'],
    toDb: (item) => ({
      id: item.id,
      name: item.name,
      cnpj: item.cnpj ?? null,
      address: item.address ?? null,
      is_primary: Boolean(item.isPrimary),
    }),
    fromDb: (row) => ({
      id: row.id,
      name: row.name,
      cnpj: row.cnpj ?? undefined,
      address: row.address ?? undefined,
      isPrimary: row.is_primary,
    }),
    orderBy: 'name ASC',
  },
  sectors: {
    table: 'sectors',
    columns: ['id', 'name', 'unit_id'],
    toDb: (item) => ({ id: item.id, name: item.name, unit_id: item.unitId }),
    fromDb: (row) => ({ id: row.id, name: row.name, unitId: row.unit_id }),
    orderBy: 'name ASC',
  },
  doc_types: {
    table: 'doc_types',
    columns: ['id', 'name', 'unit_id'],
    toDb: (item) => ({ id: item.id, name: item.name, unit_id: item.unitId }),
    fromDb: (row) => ({ id: row.id, name: row.name, unitId: row.unit_id }),
    orderBy: 'name ASC',
  },
  classifications: {
    table: 'archival_classifications',
    columns: ['id', 'code', 'name', 'description', 'parent_id', 'retention_current_years', 'retention_intermediate_years', 'final_disposition', 'legal_basis', 'notes', 'unit_id'],
    toDb: (item) => ({
      id: item.id,
      code: item.code,
      name: item.name,
      description: item.description ?? null,
      parent_id: toUuid(item.parentId),
      retention_current_years: item.retentionCurrentYears ?? null,
      retention_intermediate_years: item.retentionIntermediateYears ?? null,
      final_disposition: item.finalDisposition ?? null,
      legal_basis: item.legalBasis ?? null,
      notes: item.notes ?? null,
      unit_id: item.unitId,
    }),
    fromDb: (row) => ({
      id: row.id,
      code: row.code,
      name: row.name,
      description: row.description ?? undefined,
      parentId: row.parent_id ?? undefined,
      retentionCurrentYears: row.retention_current_years ?? undefined,
      retentionIntermediateYears: row.retention_intermediate_years ?? undefined,
      finalDisposition: row.final_disposition ?? undefined,
      legalBasis: row.legal_basis ?? undefined,
      notes: row.notes ?? undefined,
      unitId: row.unit_id,
    }),
    orderBy: 'code ASC, name ASC',
  },
  contracts: {
    table: 'contracts',
    columns: ['id', 'number', 'description', 'unit_id'],
    toDb: (item) => ({ id: item.id, number: item.number, description: item.description, unit_id: item.unitId }),
    fromDb: (row) => ({ id: row.id, number: row.number, description: row.description, unitId: row.unit_id }),
    orderBy: 'number ASC',
  },
  portal_services: {
    table: 'portal_services',
    columns: ['id', 'name', 'description', 'unit_id', 'sector_id', 'access_level_id', 'doc_type_id', 'cover_template_id', 'attachment_fields', 'is_active'],
    toDb: (item) => ({
      id: item.id,
      name: item.name,
      description: item.description,
      unit_id: item.unitId,
      sector_id: item.sectorId,
      access_level_id: item.accessLevelId,
      doc_type_id: item.docTypeId,
      cover_template_id: item.coverTemplateId ?? null,
      attachment_fields: item.attachmentFields ?? [],
      is_active: Boolean(item.isActive),
    }),
    fromDb: (row) => ({
      id: row.id,
      name: row.name,
      description: row.description,
      unitId: row.unit_id,
      sectorId: row.sector_id,
      accessLevelId: row.access_level_id,
      docTypeId: row.doc_type_id,
      coverTemplateId: row.cover_template_id ?? undefined,
      attachmentFields: asJsonArray(row.attachment_fields, []),
      isActive: row.is_active,
    }),
    orderBy: 'name ASC',
  },
  access_levels: {
    table: 'access_levels',
    columns: ['id', 'name', 'color', 'unit_id'],
    toDb: (item) => ({ id: item.id, name: item.name, color: item.color, unit_id: item.unitId }),
    fromDb: (row) => ({ id: row.id, name: row.name, color: row.color, unitId: row.unit_id }),
    orderBy: 'name ASC',
  },
  interested: {
    table: 'interested_parties',
    columns: ['id', 'type', 'name', 'identifier', 'email', 'password', 'unit_id'],
    toDb: (item) => ({ id: item.id, type: item.type, name: item.name, identifier: item.identifier, email: item.email ?? null, password: item.password ?? null, unit_id: item.unitId }),
    fromDb: (row) => ({ id: row.id, type: row.type, name: row.name, identifier: row.identifier, email: row.email ?? undefined, password: row.password ?? undefined, unitId: row.unit_id }),
    orderBy: 'name ASC',
  },
  cover_templates: {
    table: 'cover_templates',
    columns: ['id', 'name', 'content', 'is_active', 'unit_id', 'source_file_name'],
    toDb: (item) => ({
      id: item.id,
      name: item.name,
      content: item.content,
      is_active: Boolean(item.isActive),
      unit_id: item.unitId,
      source_file_name: item.sourceFileName ?? null,
    }),
    fromDb: (row) => ({
      id: row.id,
      name: row.name,
      content: row.content,
      isActive: row.is_active,
      unitId: row.unit_id,
      sourceFileName: row.source_file_name ?? undefined,
    }),
    orderBy: 'name ASC',
  },
  access_logs: {
    table: 'access_logs',
    columns: ['id', 'user_id', 'user_name', 'resource_id', 'resource_nup', 'resource_type', 'event_timestamp', 'created_at', 'ip', 'unit_id'],
    touchColumn: null,
    toDb: (item) => ({
      id: item.id,
      user_id: item.userId,
      user_name: item.userName,
      resource_id: item.resourceId,
      resource_nup: item.resourceNup,
      resource_type: item.resourceType,
      event_timestamp: item.timestamp,
      created_at: item.timestamp,
      ip: item.ip,
      unit_id: item.unitId,
    }),
    fromDb: (row) => ({
      id: row.id,
      userId: row.user_id,
      userName: row.user_name,
      resourceId: row.resource_id,
      resourceNup: row.resource_nup,
      resourceType: row.resource_type,
      timestamp: row.event_timestamp ?? row.created_at,
      ip: row.ip,
      unitId: row.unit_id,
    }),
    orderBy: (columns) => {
      if (columns.includes('event_timestamp') && columns.includes('created_at')) {
        return 'COALESCE(event_timestamp, created_at) DESC';
      }
      if (columns.includes('event_timestamp')) return 'event_timestamp DESC';
      if (columns.includes('created_at')) return 'created_at DESC';
      return 'id DESC';
    },
  },
  counter: {
    table: 'counters',
    columns: ['id', 'value'],
    toDb: (item) => ({ id: item.id, value: Number(item.value ?? 0) }),
    fromDb: (row) => ({ id: row.id, value: Number(row.value ?? 0) }),
    orderBy: 'id ASC',
  },
};

const SIMPLE_TABLE_NAMES = Object.keys(SIMPLE_TABLES);
const SUPPORTED_TABLES = [
  ...SIMPLE_TABLE_NAMES,
  'profiles',
  'users',
  'documents',
  'processes',
];

const ensureTableSupported = (tableName) => {
  if (!SUPPORTED_TABLES.includes(tableName)) {
    throw new Error(`Tabela não suportada pela API: ${tableName}`);
  }
};

const buildUpsertSql = (table, columns, touchColumn = 'updated_at') => {
  const insertColumns = columns.join(', ');
  const valuePlaceholders = columns.map((_, index) => `$${index + 1}`).join(', ');
  const updateColumns = columns.filter((column) => column !== 'id').map((column) => `${column} = EXCLUDED.${column}`);

  if (touchColumn) {
    updateColumns.push(`${touchColumn} = NOW()`);
  }

  const updateClause = updateColumns.length > 0 ? updateColumns.join(', ') : 'id = EXCLUDED.id';

  return `
    INSERT INTO ${table} (${insertColumns})
    VALUES (${valuePlaceholders})
    ON CONFLICT (id)
    DO UPDATE SET ${updateClause}
  `;
};

const upsertSimple = async (tableName, item) => {
  const config = SIMPLE_TABLES[tableName];
  const dbItem = config.toDb(item);
  const columns = await getExistingColumns(config.table, config.columns);
  const defaultTouchColumn = config.touchColumn === undefined ? 'updated_at' : config.touchColumn;
  const touchColumn = defaultTouchColumn && await hasColumn(config.table, defaultTouchColumn)
    ? defaultTouchColumn
    : null;
  const values = columns.map((column) => {
    const val = dbItem[column];
    // Se a coluna for ID ou terminar em _id, tratamos como UUID
    if (column === 'id' || column.endsWith('_id')) {
       return toUuid(val);
    }
    if (Array.isArray(val) || (val && typeof val === 'object')) {
      return JSON.stringify(val);
    }
    return val ?? null;
  });
  const sql = buildUpsertSql(config.table, columns, touchColumn);
  await pool.query(sql, values);
  return item;
};

const getSimple = async (tableName) => {
  const config = SIMPLE_TABLES[tableName];
  const columns = await getExistingColumns(config.table, config.columns);
  const orderBy = typeof config.orderBy === 'function' ? config.orderBy(columns) : config.orderBy;
  const query = `SELECT ${columns.join(', ')} FROM ${config.table} ORDER BY ${orderBy}`;
  const { rows } = await pool.query(query);
  return rows.map(config.fromDb);
};

const deleteSimple = async (tableName, id) => {
  const config = SIMPLE_TABLES[tableName];
  await pool.query(`DELETE FROM ${config.table} WHERE id = $1`, [id]);
};

const replaceRows = async (client, deleteSql, deleteParams, insertSql, rows) => {
  await client.query(deleteSql, deleteParams);
  for (const rowParams of rows) {
    await client.query(insertSql, rowParams);
  }
};

const getProfiles = async () => {
  const { rows } = await pool.query(`
    SELECT
      p.id,
      p.name,
      p.unit_id,
      COALESCE(
        ARRAY_AGG(pp.permission ORDER BY pp.permission)
        FILTER (WHERE pp.permission IS NOT NULL),
        ARRAY[]::TEXT[]
      ) AS permissions
    FROM profiles p
    LEFT JOIN profile_permissions pp ON pp.profile_id = p.id
    GROUP BY p.id, p.name, p.unit_id
    ORDER BY p.name ASC
  `);

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    unitId: row.unit_id,
    permissions: row.permissions ?? [],
  }));
};

const upsertProfile = async (item) => {
  const hasUpdatedAt = await hasColumn('profiles', 'updated_at');
  await withTransaction(async (client) => {
    await client.query(
      `
        INSERT INTO profiles (id, name, unit_id)
        VALUES ($1, $2, $3)
        ON CONFLICT (id)
        DO UPDATE SET name = EXCLUDED.name, unit_id = EXCLUDED.unit_id${hasUpdatedAt ? ', updated_at = NOW()' : ''}
      `,
      [toUuid(item.id), item.name, toUuid(item.unitId)]
    );

    const permissions = Array.isArray(item.permissions) ? item.permissions : [];
    await replaceRows(
      client,
      'DELETE FROM profile_permissions WHERE profile_id = $1',
      [item.id],
      'INSERT INTO profile_permissions (profile_id, permission) VALUES ($1, $2)',
      permissions.map((permission) => [toUuid(item.id), permission])
    );
  });

  return item;
};

const deleteProfile = async (id) => {
  await pool.query('DELETE FROM profiles WHERE id = $1', [id]);
};

const getUsers = async () => {
  const [usersResult, assignmentsResult, accessLevelsResult] = await Promise.all([
    pool.query(`SELECT id, cpf, name, email, phone, password, avatar_color FROM users ORDER BY name ASC`),
    pool.query(`SELECT user_id, unit_id, sector_id, profile_id FROM user_assignments ORDER BY user_id, unit_id, sector_id`),
    pool.query(`SELECT user_id, access_level_id FROM user_access_levels ORDER BY user_id, access_level_id`),
  ]);

  const assignmentsByUser = new Map();
  for (const row of assignmentsResult.rows) {
    if (!assignmentsByUser.has(row.user_id)) assignmentsByUser.set(row.user_id, []);
    assignmentsByUser.get(row.user_id).push({
      unitId: row.unit_id,
      sectorId: row.sector_id,
      profileId: row.profile_id,
    });
  }

  const accessLevelsByUser = new Map();
  for (const row of accessLevelsResult.rows) {
    if (!accessLevelsByUser.has(row.user_id)) accessLevelsByUser.set(row.user_id, []);
    accessLevelsByUser.get(row.user_id).push(row.access_level_id);
  }

  return usersResult.rows.map((row) => ({
    id: row.id,
    cpf: row.cpf,
    name: row.name,
    email: row.email ?? undefined,
    phone: row.phone ?? undefined,
    password: row.password ?? undefined,
    assignments: assignmentsByUser.get(row.id) ?? [],
    authorizedAccessLevelIds: accessLevelsByUser.get(row.id) ?? [],
    avatarColor: row.avatar_color ?? undefined,
  }));
};

const upsertUser = async (item) => {
  const hasUpdatedAt = await hasColumn('users', 'updated_at');
  await withTransaction(async (client) => {
    await client.query(
      `
        INSERT INTO users (id, cpf, name, email, phone, password, avatar_color)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (id)
        DO UPDATE SET
          cpf = EXCLUDED.cpf,
          name = EXCLUDED.name,
          email = EXCLUDED.email,
          phone = EXCLUDED.phone,
          password = EXCLUDED.password,
          avatar_color = EXCLUDED.avatar_color
          ${hasUpdatedAt ? ', updated_at = NOW()' : ''}
      `,
      [
        toUuid(item.id),
        item.cpf,
        item.name,
        item.email ?? null,
        item.phone ?? null,
        item.password ?? null,
        item.avatarColor ?? null,
      ]
    );

    const assignments = Array.isArray(item.assignments) ? item.assignments : [];
    await replaceRows(
      client,
      'DELETE FROM user_assignments WHERE user_id = $1',
      [item.id],
      'INSERT INTO user_assignments (user_id, unit_id, sector_id, profile_id) VALUES ($1, $2, $3, $4)',
      assignments.map((assignment) => [toUuid(item.id), toUuid(assignment.unitId), toUuid(assignment.sectorId), toUuid(assignment.profileId)])
    );

    const authorizedAccessLevelIds = Array.isArray(item.authorizedAccessLevelIds) ? item.authorizedAccessLevelIds : [];
    await replaceRows(
      client,
      'DELETE FROM user_access_levels WHERE user_id = $1',
      [item.id],
      'INSERT INTO user_access_levels (user_id, access_level_id) VALUES ($1, $2)',
      authorizedAccessLevelIds.map((accessLevelId) => [toUuid(item.id), toUuid(accessLevelId)])
    );
  });

  return item;
};

const deleteUser = async (id) => {
  await pool.query('DELETE FROM users WHERE id = $1', [id]);
};

const getDocuments = async () => {
  const [docsResult, interestedResult, attachmentsResult, commentsResult] = await Promise.all([
    pool.query(`
      SELECT
        id, nup, description, type_id, sector_id, created_at, annexed_at, annexed_by_user_id,
        archived_at, archived_by_user_id, archived_sector_id,
        file_name, file_content, is_archived, access_level_id, author_id,
        archival_classification_id, contract_id, process_id, parent_doc_id,
        signatures,
        is_pending_reception, sender_sector_id, destination_user_id, unit_id
      FROM documents
      ORDER BY created_at DESC, description ASC
    `),
    pool.query(`SELECT document_id, interested_id FROM document_interested ORDER BY document_id, interested_id`),
    pool.query(`SELECT document_id, file_name, file_content, position FROM document_attachments ORDER BY document_id, position, id`),
    pool.query(`
      SELECT id, document_id, user_id, user_name, comment_text, event_timestamp
      FROM document_comments
      ORDER BY document_id, event_timestamp ASC
    `),
  ]);

  const interestedByDoc = new Map();
  for (const row of interestedResult.rows) {
    if (!interestedByDoc.has(row.document_id)) interestedByDoc.set(row.document_id, []);
    interestedByDoc.get(row.document_id).push(row.interested_id);
  }

  const attachmentsByDoc = new Map();
  for (const row of attachmentsResult.rows) {
    if (!attachmentsByDoc.has(row.document_id)) attachmentsByDoc.set(row.document_id, []);
    attachmentsByDoc.get(row.document_id).push({ name: row.file_name, content: row.file_content });
  }

  const commentsByDoc = new Map();
  for (const row of commentsResult.rows) {
    if (!commentsByDoc.has(row.document_id)) commentsByDoc.set(row.document_id, []);
    commentsByDoc.get(row.document_id).push({
      id: row.id,
      userId: row.user_id,
      userName: row.user_name,
      text: row.comment_text,
      timestamp: row.event_timestamp,
    });
  }

  return docsResult.rows.map((row) => ({
    id: row.id,
    nup: row.nup,
    description: row.description,
    typeId: row.type_id,
    interestedIds: interestedByDoc.get(row.id) ?? [],
    sectorId: row.sector_id,
    createdAt: row.created_at,
    annexedAt: row.annexed_at ?? undefined,
    annexedByUserId: row.annexed_by_user_id ?? undefined,
    archivedAt: row.archived_at ?? undefined,
    archivedByUserId: row.archived_by_user_id ?? undefined,
    archivedSectorId: row.archived_sector_id ?? undefined,
    fileName: row.file_name ?? undefined,
    fileContent: row.file_content ?? undefined,
    isArchived: row.is_archived,
    accessLevelId: row.access_level_id,
    authorId: row.author_id,
    archivalClassificationId: row.archival_classification_id ?? undefined,
    contractId: row.contract_id ?? undefined,
    processId: row.process_id ?? undefined,
    parentDocId: row.parent_doc_id ?? undefined,
    signatures: asJsonArray(row.signatures, []),
    attachments: attachmentsByDoc.get(row.id) ?? [],
    comments: commentsByDoc.get(row.id) ?? [],
    isPendingReception: row.is_pending_reception,
    senderSectorId: row.sender_sector_id ?? undefined,
    destinationUserId: row.destination_user_id ?? undefined,
    unitId: row.unit_id,
  }));
};

const upsertDocument = async (item) => {
  await withTransaction(async (client) => {
    await client.query(
      `
        INSERT INTO documents (
          id, nup, description, type_id, sector_id, created_at, annexed_at, annexed_by_user_id,
          archived_at, archived_by_user_id, archived_sector_id,
          file_name, file_content, is_archived, access_level_id, author_id,
          archival_classification_id, contract_id, process_id, parent_doc_id,
          signatures,
          is_pending_reception, sender_sector_id, destination_user_id, unit_id
        )
        VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8,
          $9, $10, $11,
          $12, $13, $14, $15, $16,
          $17, $18, $19, $20,
          $21, $22, $23, $24, $25
        )
        ON CONFLICT (id)
        DO UPDATE SET
          nup = EXCLUDED.nup,
          description = EXCLUDED.description,
          type_id = EXCLUDED.type_id,
          sector_id = EXCLUDED.sector_id,
          created_at = EXCLUDED.created_at,
          annexed_at = EXCLUDED.annexed_at,
          annexed_by_user_id = EXCLUDED.annexed_by_user_id,
          archived_at = EXCLUDED.archived_at,
          archived_by_user_id = EXCLUDED.archived_by_user_id,
          archived_sector_id = EXCLUDED.archived_sector_id,
          file_name = EXCLUDED.file_name,
          file_content = EXCLUDED.file_content,
          is_archived = EXCLUDED.is_archived,
          access_level_id = EXCLUDED.access_level_id,
          author_id = EXCLUDED.author_id,
          archival_classification_id = EXCLUDED.archival_classification_id,
          contract_id = EXCLUDED.contract_id,
          process_id = EXCLUDED.process_id,
          parent_doc_id = EXCLUDED.parent_doc_id,
          signatures = EXCLUDED.signatures,
          is_pending_reception = EXCLUDED.is_pending_reception,
          sender_sector_id = EXCLUDED.sender_sector_id,
          destination_user_id = EXCLUDED.destination_user_id,
          unit_id = EXCLUDED.unit_id,
          updated_at = NOW()
      `,
      [
        toUuid(item.id),
        item.nup,
        item.description,
        toUuid(item.typeId),
        toUuid(item.sectorId),
        item.createdAt,
        item.annexedAt ?? null,
        toUuid(item.annexedByUserId),
        item.archivedAt ?? null,
        toUuid(item.archivedByUserId),
        toUuid(item.archivedSectorId),
        item.fileName ?? null,
        item.fileContent ?? null,
        Boolean(item.isArchived),
        toUuid(item.accessLevelId),
        toUuid(item.authorId),
        toUuid(item.archivalClassificationId),
        toUuid(item.contractId),
        toUuid(item.processId),
        toUuid(item.parentDocId),
        Array.isArray(item.signatures) ? item.signatures : [],
        Boolean(item.isPendingReception),
        toUuid(item.senderSectorId),
        toUuid(item.destinationUserId),
        toUuid(item.unitId),
      ]
    );

    const interestedIds = Array.isArray(item.interestedIds) ? item.interestedIds : [];
    await replaceRows(
      client,
      'DELETE FROM document_interested WHERE document_id = $1',
      [item.id],
      'INSERT INTO document_interested (document_id, interested_id) VALUES ($1, $2)',
      interestedIds.map((interestedId) => [toUuid(item.id), toUuid(interestedId)])
    );

    const attachments = Array.isArray(item.attachments) ? item.attachments : [];
    await replaceRows(
      client,
      'DELETE FROM document_attachments WHERE document_id = $1',
      [item.id],
      'INSERT INTO document_attachments (document_id, file_name, file_content, position) VALUES ($1, $2, $3, $4)',
      attachments.map((attachment, index) => [toUuid(item.id), attachment.name, attachment.content, index])
    );

    const comments = Array.isArray(item.comments) ? item.comments : [];
    await replaceRows(
      client,
      'DELETE FROM document_comments WHERE document_id = $1',
      [item.id],
      'INSERT INTO document_comments (id, document_id, user_id, user_name, comment_text, event_timestamp) VALUES ($1, $2, $3, $4, $5, $6)',
      comments.map((comment) => [toUuid(comment.id), toUuid(item.id), toUuid(comment.userId), comment.userName, comment.text, comment.timestamp])
    );
  });

  return item;
};

const deleteDocument = async (id) => {
  await pool.query('DELETE FROM documents WHERE id = $1', [id]);
};

const getProcesses = async () => {
  const [processesResult, interestedResult, historyResult, attachmentsResult] = await Promise.all([
    pool.query(`
      SELECT
        p.id, p.nup, p.description, p.sector_id, p.created_at, p.status, p.is_archived, p.archived_at,
        p.archived_by_user_id, p.archived_sector_id, p.access_level_id,
        archival_classification_id, contract_id, cover_template_id, parent_process_id,
        annex_type, annexed_by_user_id, is_pending_reception, sender_sector_id,
        destination_user_id, p.web_protocol_status, p.web_protocol_message,
        p.web_protocol_reviewed_at, p.web_protocol_reviewed_by_user_id,
        p.web_protocol_pending_type, p.web_protocol_pending_response_text, p.web_protocol_pending_response_file_name,
        p.unit_id,
        epp.id AS external_portal_protocol_id
      FROM processes p
      LEFT JOIN external_portal_protocols epp ON epp.process_id = p.id
      ORDER BY p.created_at DESC, p.description ASC
    `),
    pool.query(`SELECT process_id, interested_id FROM process_interested ORDER BY process_id, interested_id`),
    pool.query(`
      SELECT id, process_id, user_id, user_name, action_text, event_timestamp, justification
      FROM process_history
      ORDER BY process_id, event_timestamp ASC
    `),
    pool.query(`
      SELECT process_id, id, file_name, file_content, field_label, position, uploaded_by, created_at
      FROM process_attachments
      ORDER BY process_id, position, id
    `),
  ]);

  const interestedByProcess = new Map();
  for (const row of interestedResult.rows) {
    if (!interestedByProcess.has(row.process_id)) interestedByProcess.set(row.process_id, []);
    interestedByProcess.get(row.process_id).push(row.interested_id);
  }

  const historyByProcess = new Map();
  for (const row of historyResult.rows) {
    if (!historyByProcess.has(row.process_id)) historyByProcess.set(row.process_id, []);
    historyByProcess.get(row.process_id).push({
      id: row.id,
      userId: row.user_id,
      userName: row.user_name,
      action: row.action_text,
      timestamp: row.event_timestamp,
      justification: row.justification ?? undefined,
    });
  }

  const attachmentsByProcess = new Map();
  for (const row of attachmentsResult.rows) {
    if (!attachmentsByProcess.has(row.process_id)) attachmentsByProcess.set(row.process_id, []);
    attachmentsByProcess.get(row.process_id).push({
      id: row.id,
      name: row.file_name,
      content: row.file_content,
      fieldLabel: row.field_label ?? undefined,
      uploadedAt: row.created_at,
      uploadedBy: row.uploaded_by ?? undefined,
    });
  }

  return processesResult.rows.map((row) => ({
    id: row.id,
    nup: row.nup,
    description: row.description,
    interestedIds: interestedByProcess.get(row.id) ?? [],
    sectorId: row.sector_id,
    createdAt: row.created_at,
    status: row.status,
    isArchived: row.is_archived,
    archivedAt: row.archived_at ?? undefined,
    archivedByUserId: row.archived_by_user_id ?? undefined,
    archivedSectorId: row.archived_sector_id ?? undefined,
    accessLevelId: row.access_level_id,
    archivalClassificationId: row.archival_classification_id ?? undefined,
    contractId: row.contract_id ?? undefined,
    coverTemplateId: row.cover_template_id ?? undefined,
    parentProcessId: row.parent_process_id ?? undefined,
    annexType: row.annex_type ?? undefined,
    annexedByUserId: row.annexed_by_user_id ?? undefined,
    isPendingReception: row.is_pending_reception,
    senderSectorId: row.sender_sector_id ?? undefined,
    destinationUserId: row.destination_user_id ?? undefined,
    unitId: row.unit_id,
    isWebProtocol: Boolean(row.external_portal_protocol_id),
    webProtocolStatus: row.web_protocol_status ?? (row.external_portal_protocol_id ? 'Pendente' : undefined),
    webProtocolMessage: row.web_protocol_message ?? undefined,
    webProtocolReviewedAt: row.web_protocol_reviewed_at ?? undefined,
    webProtocolReviewedByUserId: row.web_protocol_reviewed_by_user_id ?? undefined,
    webProtocolPendingType: row.web_protocol_pending_type ?? undefined,
    webProtocolPendingResponseText: row.web_protocol_pending_response_text ?? undefined,
    webProtocolPendingResponseFileName: row.web_protocol_pending_response_file_name ?? undefined,
    attachments: attachmentsByProcess.get(row.id) ?? [],
    history: historyByProcess.get(row.id) ?? [],
  }));
};

const upsertProcess = async (item) => {
  await withTransaction(async (client) => {
    await client.query(
      `
        INSERT INTO processes (
          id, nup, description, sector_id, created_at, status, is_archived, archived_at,
          archived_by_user_id, archived_sector_id, access_level_id,
          archival_classification_id, contract_id, cover_template_id, parent_process_id,
          annex_type, annexed_by_user_id, is_pending_reception, sender_sector_id,
          destination_user_id, web_protocol_status, web_protocol_message,
          web_protocol_reviewed_at, web_protocol_reviewed_by_user_id,
          web_protocol_pending_type, web_protocol_pending_response_text,
          web_protocol_pending_response_file_name, unit_id
        )
        VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8,
          $9, $10, $11, $12,
          $13, $14, $15, $16,
          $17, $18, $19, $20,
          $21, $22, $23, $24,
          $25, $26, $27, $28
        )
        ON CONFLICT (id)
        DO UPDATE SET
          nup = EXCLUDED.nup,
          description = EXCLUDED.description,
          sector_id = EXCLUDED.sector_id,
          created_at = EXCLUDED.created_at,
          status = EXCLUDED.status,
          is_archived = EXCLUDED.is_archived,
          archived_at = EXCLUDED.archived_at,
          archived_by_user_id = EXCLUDED.archived_by_user_id,
          archived_sector_id = EXCLUDED.archived_sector_id,
          access_level_id = EXCLUDED.access_level_id,
          archival_classification_id = EXCLUDED.archival_classification_id,
          contract_id = EXCLUDED.contract_id,
          cover_template_id = EXCLUDED.cover_template_id,
          parent_process_id = EXCLUDED.parent_process_id,
          annex_type = EXCLUDED.annex_type,
          annexed_by_user_id = EXCLUDED.annexed_by_user_id,
          is_pending_reception = EXCLUDED.is_pending_reception,
          sender_sector_id = EXCLUDED.sender_sector_id,
          destination_user_id = EXCLUDED.destination_user_id,
          web_protocol_status = EXCLUDED.web_protocol_status,
          web_protocol_message = EXCLUDED.web_protocol_message,
          web_protocol_reviewed_at = EXCLUDED.web_protocol_reviewed_at,
          web_protocol_reviewed_by_user_id = EXCLUDED.web_protocol_reviewed_by_user_id,
          web_protocol_pending_type = EXCLUDED.web_protocol_pending_type,
          web_protocol_pending_response_text = EXCLUDED.web_protocol_pending_response_text,
          web_protocol_pending_response_file_name = EXCLUDED.web_protocol_pending_response_file_name,
          unit_id = EXCLUDED.unit_id,
          updated_at = NOW()
      `,
      [
        toUuid(item.id),
        item.nup,
        item.description,
        toUuid(item.sectorId),
        item.createdAt,
        item.status,
        Boolean(item.isArchived),
        item.archivedAt ?? null,
        toUuid(item.archivedByUserId),
        toUuid(item.archivedSectorId),
        toUuid(item.accessLevelId),
        toUuid(item.archivalClassificationId),
        toUuid(item.contractId),
        toUuid(item.coverTemplateId),
        toUuid(item.parentProcessId),
        item.annexType ?? null,
        toUuid(item.annexedByUserId),
        Boolean(item.isPendingReception),
        toUuid(item.senderSectorId),
        toUuid(item.destinationUserId),
        item.webProtocolStatus ?? null,
        item.webProtocolMessage ?? null,
        item.webProtocolReviewedAt ?? null,
        toUuid(item.webProtocolReviewedByUserId),
        item.webProtocolPendingType ?? null,
        item.webProtocolPendingResponseText ?? null,
        item.webProtocolPendingResponseFileName ?? null,
        toUuid(item.unitId),
      ]
    );

    const interestedIds = Array.isArray(item.interestedIds) ? item.interestedIds : [];
    await replaceRows(
      client,
      'DELETE FROM process_interested WHERE process_id = $1',
      [item.id],
      'INSERT INTO process_interested (process_id, interested_id) VALUES ($1, $2)',
      interestedIds.map((interestedId) => [toUuid(item.id), toUuid(interestedId)])
    );

    const history = Array.isArray(item.history) ? item.history : [];
    await replaceRows(
      client,
      'DELETE FROM process_history WHERE process_id = $1',
      [item.id],
      'INSERT INTO process_history (id, process_id, user_id, user_name, action_text, event_timestamp, justification) VALUES ($1, $2, $3, $4, $5, $6, $7)',
      history.map((entry) => [
        toUuid(entry.id),
        toUuid(item.id),
        toUuid(entry.userId),
        entry.userName,
        entry.action,
        entry.timestamp,
        entry.justification ?? null,
      ])
    );

    if (item.attachments !== undefined) {
      const attachments = Array.isArray(item.attachments) ? item.attachments : [];
      await replaceRows(
        client,
        'DELETE FROM process_attachments WHERE process_id = $1',
        [item.id],
        'INSERT INTO process_attachments (id, process_id, file_name, file_content, field_label, position, uploaded_by, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
        attachments.map((attachment, index) => [
          toUuid(attachment.id || randomUUID()),
          toUuid(item.id),
          attachment.name,
          attachment.content,
          attachment.fieldLabel ?? null,
          index,
          attachment.uploadedBy ?? null,
          attachment.uploadedAt ?? new Date().toISOString(),
        ])
      );
    }
  });

  return item;
};

const deleteProcess = async (id) => {
  await pool.query('DELETE FROM processes WHERE id = $1', [id]);
};

const normalizeIdentifier = (value) => String(value || '').replace(/\D/g, '');

const calculateNUPDV = (base) => {
  const digits = String(base || '').replace(/\D/g, '');
  const calculateDigit = (numStr) => {
    let sum = 0;
    let weight = 2;
    for (let i = numStr.length - 1; i >= 0; i--) {
      sum += Number(numStr[i]) * weight;
      weight++;
    }
    const remainder = sum % 11;
    const digit = 11 - remainder;
    return digit >= 10 ? 0 : digit;
  };
  const d1 = calculateDigit(digits);
  const d2 = calculateDigit(digits + d1);
  return `${d1}${d2}`;
};

const generateNUP = (sequence) => {
  const year = new Date().getFullYear();
  const prefix = '00001';
  const seqStr = String(sequence).padStart(6, '0');
  const base = `${prefix}${seqStr}${year}`;
  const dv = calculateNUPDV(base);
  return `${prefix}.${seqStr}/${year}-${dv}`;
};

const getNextSequenceForUnit = async (client, unitId) => {
  const counterResult = await client.query('SELECT value FROM counters WHERE id = $1 LIMIT 1', [unitId]);
  const currentValue = Number(counterResult.rows[0]?.value || 0);
  const nextValue = currentValue + 1;
  await client.query(
    `
      INSERT INTO counters (id, value)
      VALUES ($1, $2)
      ON CONFLICT (id)
      DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()
    `,
    [unitId, nextValue]
  );
  return nextValue;
};

const getActivePortalServicesByUnit = async (unitId) => {
  const columns = await getExistingColumns('portal_services', SIMPLE_TABLES.portal_services.columns);
  const { rows } = await pool.query(
    `
      SELECT ${columns.join(', ')}
      FROM portal_services
      WHERE unit_id = $1 AND is_active = TRUE
      ORDER BY name ASC
    `,
    [unitId]
  );

  return rows.map(SIMPLE_TABLES.portal_services.fromDb);
};

const getAllActivePortalServices = async () => {
  const columns = await getExistingColumns('portal_services', SIMPLE_TABLES.portal_services.columns);
  const { rows } = await pool.query(
    `
      SELECT ${columns.join(', ')}
      FROM portal_services
      WHERE is_active = TRUE
      ORDER BY name ASC
    `
  );

  return rows.map(SIMPLE_TABLES.portal_services.fromDb);
};

const getExternalPortalProtocols = async (identifierNormalized) => {
  const { rows } = await pool.query(
    `
      SELECT
        epp.id,
        epp.process_id,
        p.nup,
        p.description,
        p.created_at,
        p.status,
        p.web_protocol_status,
        p.web_protocol_message,
        p.web_protocol_reviewed_at,
        p.web_protocol_pending_type,
        p.web_protocol_pending_response_text,
        p.web_protocol_pending_response_file_name,
        ps.name AS service_name,
        s.name AS sector_name
      FROM external_portal_protocols epp
      INNER JOIN processes p ON p.id = epp.process_id
      INNER JOIN portal_services ps ON ps.id = epp.portal_service_id
      LEFT JOIN sectors s ON s.id = p.sector_id
      WHERE epp.account_identifier_normalized = $1
      ORDER BY epp.created_at DESC, p.created_at DESC
    `,
    [identifierNormalized]
  );

  return rows.map((row) => ({
    id: row.id,
    processId: row.process_id,
    nup: row.nup,
    description: row.description,
    createdAt: row.created_at,
    status: row.status,
    serviceName: row.service_name,
    sectorName: row.sector_name,
    webProtocolStatus: row.web_protocol_status ?? 'Pendente',
    webProtocolMessage: row.web_protocol_message ?? undefined,
    webProtocolReviewedAt: row.web_protocol_reviewed_at ?? undefined,
    webProtocolPendingType: row.web_protocol_pending_type ?? undefined,
    webProtocolPendingResponseText: row.web_protocol_pending_response_text ?? undefined,
    webProtocolPendingResponseFileName: row.web_protocol_pending_response_file_name ?? undefined,
  }));
};

const getExternalPortalProcessDetail = async (identifier, processId) => {
  const identifierNormalized = normalizeIdentifier(identifier);
  if (!identifierNormalized || !processId) {
    throw new Error('Informe o protocolo desejado.');
  }

  const accessResult = await pool.query(
    `
      SELECT 1
      FROM external_portal_protocols
      WHERE account_identifier_normalized = $1
        AND process_id = $2
      LIMIT 1
    `,
    [identifierNormalized, processId]
  );

  if (accessResult.rows.length === 0) {
    throw new Error('Protocolo nao encontrado para este acesso externo.');
  }

  const [processResult, documentsResult, historyResult] = await Promise.all([
    pool.query(
      `
        SELECT
          p.id,
          p.nup,
          p.description,
          p.created_at,
          p.status,
          p.web_protocol_status,
          p.web_protocol_message,
          p.web_protocol_reviewed_at,
          p.web_protocol_pending_type,
          p.web_protocol_pending_response_text,
          p.web_protocol_pending_response_file_name,
          s.name AS sector_name,
          ps.name AS service_name,
          ct.name AS cover_template_name,
          ct.content AS cover_template_content
        FROM processes p
        LEFT JOIN sectors s ON s.id = p.sector_id
        LEFT JOIN external_portal_protocols epp ON epp.process_id = p.id
        LEFT JOIN portal_services ps ON ps.id = epp.portal_service_id
        LEFT JOIN cover_templates ct ON ct.id = p.cover_template_id
        WHERE p.id = $1
        LIMIT 1
      `,
      [processId]
    ),
    pool.query(
      `
        SELECT
          d.id,
          d.nup,
          d.description,
          d.created_at,
          d.annexed_at,
          d.file_name,
          d.file_content,
          s.name AS sector_name,
          dt.name AS type_name
        FROM documents d
        LEFT JOIN sectors s ON s.id = d.sector_id
        LEFT JOIN doc_types dt ON dt.id = d.type_id
        WHERE d.process_id = $1
        ORDER BY d.created_at ASC, d.nup ASC
      `,
      [processId]
    ),
    pool.query(
      `
        SELECT id, process_id, user_id, user_name, action_text, event_timestamp, justification
        FROM process_history
        WHERE process_id = $1
        ORDER BY event_timestamp ASC
      `,
      [processId]
    ),
  ]);

  if (processResult.rows.length === 0) {
    throw new Error('Protocolo nao localizado.');
  }

  return {
    process: {
      id: processResult.rows[0].id,
      nup: processResult.rows[0].nup,
      description: processResult.rows[0].description,
      createdAt: processResult.rows[0].created_at,
      status: processResult.rows[0].status,
      sectorName: processResult.rows[0].sector_name ?? undefined,
      serviceName: processResult.rows[0].service_name ?? undefined,
      coverTemplateName: processResult.rows[0].cover_template_name ?? undefined,
      coverTemplateContent: processResult.rows[0].cover_template_content ?? undefined,
      webProtocolStatus: processResult.rows[0].web_protocol_status ?? 'Pendente',
      webProtocolMessage: processResult.rows[0].web_protocol_message ?? undefined,
      webProtocolReviewedAt: processResult.rows[0].web_protocol_reviewed_at ?? undefined,
      webProtocolPendingType: processResult.rows[0].web_protocol_pending_type ?? undefined,
      webProtocolPendingResponseText: processResult.rows[0].web_protocol_pending_response_text ?? undefined,
      webProtocolPendingResponseFileName: processResult.rows[0].web_protocol_pending_response_file_name ?? undefined,
    },
    documents: documentsResult.rows.map((row) => ({
      id: row.id,
      nup: row.nup,
      description: row.description,
      createdAt: row.created_at,
      annexedAt: row.annexed_at ?? undefined,
      fileName: row.file_name ?? undefined,
      fileContent: row.file_content ?? undefined,
      typeName: row.type_name ?? undefined,
      sectorName: row.sector_name ?? undefined,
    })),
    history: historyResult.rows.map((row) => ({
      id: row.id,
      userId: row.user_id,
      userName: row.user_name,
      action: row.action_text,
      timestamp: row.event_timestamp,
      justification: row.justification ?? undefined,
    })),
  };
};

const prepareExternalPortalAccess = async (identifier) => {
  const identifierNormalized = normalizeIdentifier(identifier);
  if (!identifierNormalized) {
    throw new Error('Informe um CPF ou CNPJ valido.');
  }

  const interestedResult = await pool.query(
    `
      SELECT id, name, identifier
      FROM interested_parties
      WHERE regexp_replace(identifier, '\\D', '', 'g') = $1
      ORDER BY name ASC
    `,
    [identifierNormalized]
  );

  if (interestedResult.rows.length === 0) {
    throw new Error('Nenhum interessado foi localizado com este CPF/CNPJ no cadastro interno.');
  }

  const accountResult = await pool.query(
    `
      SELECT id
      FROM external_portal_accounts
      WHERE identifier_normalized = $1
      LIMIT 1
    `,
    [identifierNormalized]
  );

  return {
    identifier: interestedResult.rows[0].identifier,
    name: interestedResult.rows[0].name,
    processCount: 0,
    documentCount: 0,
    hasAccount: accountResult.rows.length > 0,
  };
};

const setExternalPortalPassword = async (identifier, password) => {
  const prepared = await prepareExternalPortalAccess(identifier);
  if (!password || String(password).trim().length < 4) {
    throw new Error('A senha deve ter pelo menos 4 caracteres.');
  }

  const identifierNormalized = normalizeIdentifier(identifier);
  await pool.query(
    `
      UPDATE interested_parties
      SET password = $2, updated_at = NOW()
      WHERE regexp_replace(identifier, '\\D', '', 'g') = $1
    `,
    [identifierNormalized, password]
  );
  await pool.query(
    `
      INSERT INTO external_portal_accounts (identifier_normalized, identifier_display, interested_name, password)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (identifier_normalized)
      DO UPDATE SET
        identifier_display = EXCLUDED.identifier_display,
        interested_name = EXCLUDED.interested_name,
        password = EXCLUDED.password,
        updated_at = NOW()
    `,
    [identifierNormalized, prepared.identifier, prepared.name, password]
  );

  return {
    ...prepared,
    hasAccount: true,
  };
};

const registerExternalPortalUser = async ({ identifier, name, email, password }) => {
  const identifierNormalized = normalizeIdentifier(identifier);
  if (!identifierNormalized || !name || !email || !password) {
    throw new Error('Preencha CPF, nome completo, e-mail e senha para concluir o cadastro.');
  }

  const existingInterested = await pool.query(
    `
      SELECT id, unit_id
      FROM interested_parties
      WHERE regexp_replace(identifier, '\\D', '', 'g') = $1
      ORDER BY created_at ASC
      LIMIT 1
    `,
    [identifierNormalized]
  );

  const interestedId = existingInterested.rows[0]?.id || randomUUID();
  const unitId = existingInterested.rows[0]?.unit_id || null;

  await pool.query(
    `
      INSERT INTO interested_parties (id, type, name, identifier, email, password, unit_id)
      VALUES ($1, 'Pessoa', $2, $3, $4, $5, $6)
      ON CONFLICT (id)
      DO UPDATE SET
        type = 'Pessoa',
        name = EXCLUDED.name,
        identifier = EXCLUDED.identifier,
        email = EXCLUDED.email,
        password = EXCLUDED.password,
        updated_at = NOW()
    `,
    [interestedId, name, identifier, email, password, unitId]
  );

  await pool.query(
    `
      INSERT INTO external_portal_accounts (identifier_normalized, identifier_display, interested_name, password)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (identifier_normalized)
      DO UPDATE SET
        identifier_display = EXCLUDED.identifier_display,
        interested_name = EXCLUDED.interested_name,
        password = EXCLUDED.password,
        updated_at = NOW()
    `,
    [identifierNormalized, identifier, name, password]
  );

  return prepareExternalPortalAccess(identifier);
};

const loginExternalPortal = async (identifier, password) => {
  const identifierNormalized = normalizeIdentifier(identifier);
  if (!identifierNormalized || !password) {
    throw new Error('Informe o CPF/CNPJ e a senha para acessar.');
  }

  const accountResult = await pool.query(
    `
      SELECT identifier_display, interested_name, password
      FROM external_portal_accounts
      WHERE identifier_normalized = $1
      LIMIT 1
    `,
    [identifierNormalized]
  );

  if (accountResult.rows.length === 0) {
    throw new Error('Acesso externo nao encontrado. Use o primeiro acesso para definir sua senha.');
  }

  const account = accountResult.rows[0];
  if (account.password !== password) {
    throw new Error('Senha invalida para o protocolo digital.');
  }

  const protocols = await getExternalPortalProtocols(identifierNormalized);
  const interestedResult = await pool.query(
    `
      SELECT unit_id
      FROM interested_parties
      WHERE regexp_replace(identifier, '\\D', '', 'g') = $1
      ORDER BY name ASC
      LIMIT 1
    `,
    [identifierNormalized]
  );
  const unitId = interestedResult.rows?.[0]?.unit_id;
  const services = unitId ? await getActivePortalServicesByUnit(unitId) : await getAllActivePortalServices();

  return {
    identifier: account.identifier_display,
    name: account.interested_name,
    processes: protocols,
    services,
  };
};

const submitExternalPortalRequest = async (identifier, serviceId, details, attachments = []) => {
  const identifierNormalized = normalizeIdentifier(identifier);
  if (!identifierNormalized || !serviceId) {
    throw new Error('Informe o serviço desejado para protocolar.');
  }

  const interestedResult = await pool.query(
    `
      SELECT id, name, identifier, unit_id
      FROM interested_parties
      WHERE regexp_replace(identifier, '\\D', '', 'g') = $1
      ORDER BY name ASC
      LIMIT 1
    `,
    [identifierNormalized]
  );

  if (interestedResult.rows.length === 0) {
    throw new Error('Interessado nao localizado no cadastro interno.');
  }

  const portalServiceColumns = await getExistingColumns('portal_services', SIMPLE_TABLES.portal_services.columns);
  const serviceResult = await pool.query(
    `
      SELECT ${portalServiceColumns.join(', ')}
      FROM portal_services
      WHERE id = $1
      LIMIT 1
    `,
    [serviceId]
  );

  if (serviceResult.rows.length === 0 || !serviceResult.rows[0].is_active) {
    throw new Error('Servico do portal nao encontrado ou indisponivel.');
  }

  const service = SIMPLE_TABLES.portal_services.fromDb(serviceResult.rows[0]);
  const interested = interestedResult.rows[0];
  if (interested.unit_id && service.unitId !== interested.unit_id) {
    throw new Error('O serviço selecionado nao pertence a unidade do cadastro identificado.');
  }

  const serviceFields = asJsonArray(service.attachmentFields, []);
  const normalizedAttachments = Array.isArray(attachments) ? attachments : [];
  const missingRequiredFields = serviceFields.filter((field) => field?.required && !normalizedAttachments.some((attachment) => attachment.fieldLabel === field.label && attachment.content));
  if (missingRequiredFields.length > 0) {
    throw new Error(`Anexe os documentos obrigatórios: ${missingRequiredFields.map((field) => field.label).join(', ')}.`);
  }
  if (!service.docTypeId) {
    throw new Error('Tipo de documento nao configurado para este servico.');
  }

  await withTransaction(async (client) => {
    const sequence = await getNextSequenceForUnit(client, service.unitId);
    const processId = randomUUID();
    const historyId = randomUUID();
    const now = new Date().toISOString();
    const description = `PROTOCOLO EXTERNO - ${service.name}${details ? ` - ${details}` : ''}`;

    await client.query(
      `
        INSERT INTO processes (
          id, nup, description, sector_id, created_at, status, is_archived, access_level_id,
          archival_classification_id, contract_id, cover_template_id, parent_process_id,
          annex_type, annexed_by_user_id, is_pending_reception, sender_sector_id,
          destination_user_id, web_protocol_status, web_protocol_message,
          web_protocol_reviewed_at, web_protocol_reviewed_by_user_id,
          web_protocol_pending_type, web_protocol_pending_response_text,
          web_protocol_pending_response_file_name, unit_id
        )
        VALUES (
          $1, $2, $3, $4, $5, 'Aberto', FALSE, $6,
          NULL, NULL, $7, NULL,
          NULL, NULL, FALSE, NULL,
          NULL, 'Pendente', NULL,
          NULL, NULL, NULL,
          NULL, NULL, $8
        )
      `,
      [processId, generateNUP(sequence), description, service.sectorId, now, service.accessLevelId, toUuid(service.coverTemplateId), service.unitId]
    );

    await client.query(
      'INSERT INTO process_interested (process_id, interested_id) VALUES ($1, $2)',
      [processId, interested.id]
    );

    if (!interested.unit_id) {
      await client.query(
        `
          UPDATE interested_parties
          SET unit_id = $2, updated_at = NOW()
          WHERE id = $1
        `,
        [interested.id, service.unitId]
      );
    }

    await client.query(
      `
        INSERT INTO external_portal_protocols (id, account_identifier_normalized, interested_id, process_id, portal_service_id)
        VALUES ($1, $2, $3, $4, $5)
      `,
      [randomUUID(), identifierNormalized, interested.id, processId, service.id]
    );

    await client.query(
      `
        INSERT INTO process_history (id, process_id, user_id, user_name, action_text, event_timestamp, justification)
        VALUES ($1, $2, NULL, $3, $4, $5, NULL)
      `,
      [historyId, processId, 'PORTAL EXTERNO', `SOLICITACAO EXTERNA DO SERVICO ${service.name.toUpperCase()} PARA ${interested.name.toUpperCase()}`, now]
    );

    for (let index = 0; index < normalizedAttachments.length; index++) {
      const attachment = normalizedAttachments[index];
      const docSequence = await getNextSequenceForUnit(client, service.unitId);
      const documentId = randomUUID();
      const documentNup = generateNUP(docSequence);
      const docDescription = attachment.fieldLabel ? `${service.name} - ${attachment.fieldLabel}` : `${service.name} - Anexo ${index + 1}`;

      await client.query(
        `
          INSERT INTO documents (
            id, nup, description, type_id, sector_id, created_at, annexed_at, annexed_by_user_id,
            file_name, file_content, is_archived, access_level_id, author_id,
            archival_classification_id, contract_id, process_id, parent_doc_id,
            is_pending_reception, sender_sector_id, destination_user_id, unit_id
          )
          VALUES (
            $1, $2, $3, $4, $5, $6, $7, NULL,
            $8, $9, FALSE, $10, NULL,
            NULL, NULL, $11, NULL,
            FALSE, NULL, NULL, $12
          )
        `,
        [
          documentId,
          documentNup,
          docDescription,
          service.docTypeId,
          service.sectorId,
          now,
          now,
          attachment.name,
          attachment.content,
          service.accessLevelId,
          processId,
          service.unitId,
        ]
      );

      await client.query(
        'INSERT INTO document_interested (document_id, interested_id) VALUES ($1, $2)',
        [documentId, interested.id]
      );

      await client.query(
        `
          INSERT INTO process_history (id, process_id, user_id, user_name, action_text, event_timestamp, justification)
          VALUES ($1, $2, NULL, $3, $4, $5, NULL)
        `,
        [
          randomUUID(),
          processId,
          'PORTAL EXTERNO',
          `DOCUMENTO ${documentNup} ANEXADO AO PROCESSO A PARTIR DO ARQUIVO ${attachment.name}`,
          now,
        ]
      );
    }
  });

  return loginExternalPortal(identifier, (await pool.query(
    'SELECT password FROM external_portal_accounts WHERE identifier_normalized = $1 LIMIT 1',
    [identifierNormalized]
  )).rows[0]?.password || '');
};

const submitExternalPortalPendingResponse = async (identifier, processId, payload = {}) => {
  const identifierNormalized = normalizeIdentifier(identifier);
  if (!identifierNormalized || !processId) {
    throw new Error('Informe o protocolo desejado.');
  }

  const accessResult = await pool.query(
    `
      SELECT 1
      FROM external_portal_protocols
      WHERE account_identifier_normalized = $1
        AND process_id = $2
      LIMIT 1
    `,
    [identifierNormalized, processId]
  );

  if (accessResult.rows.length === 0) {
    throw new Error('Protocolo nao encontrado para este acesso externo.');
  }

  const responseText = String(payload?.responseText || '').trim();
  const attachment = payload?.attachment && typeof payload.attachment === 'object' ? payload.attachment : null;

  const processResult = await pool.query(
    `
      SELECT p.web_protocol_pending_type
      FROM processes p
      WHERE p.id = $1
      LIMIT 1
    `,
    [processId]
  );

  if (processResult.rows.length === 0) {
    throw new Error('Protocolo nao localizado.');
  }

  const pendingType = processResult.rows[0].web_protocol_pending_type;
  if (pendingType === 'Documental') {
    if (!attachment?.content || !attachment?.name) {
      throw new Error('Anexe o PDF solicitado para responder a pendencia documental.');
    }
    if (!String(attachment.name).toLowerCase().endsWith('.pdf')) {
      throw new Error('A pendencia documental aceita apenas arquivos PDF.');
    }
  } else if (pendingType === 'Informacao') {
    if (!responseText) {
      throw new Error('Informe o texto solicitado para responder a pendencia de informação.');
    }
  } else {
    throw new Error('Este protocolo nao possui pendencia aberta para resposta.');
  }

  const now = new Date().toISOString();
  const attachmentId = pendingType === 'Documental' ? randomUUID() : null;

  await withTransaction(async (client) => {
    await client.query(
      `
        UPDATE processes
        SET
          web_protocol_status = 'RespostaEnviada',
          web_protocol_pending_response_text = $2,
          web_protocol_pending_response_file_name = $3,
          updated_at = NOW()
        WHERE id = $1
      `,
      [
        processId,
        pendingType === 'Informacao' ? responseText : null,
        pendingType === 'Documental' ? String(attachment.name) : null,
      ]
    );

    if (pendingType === 'Documental' && attachmentId) {
      await client.query(
        `
          INSERT INTO process_attachments (id, process_id, file_name, file_content, field_label, position, uploaded_by, created_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        `,
        [
          attachmentId,
          processId,
          String(attachment.name),
          String(attachment.content),
          'RESPOSTA DE PENDENCIA DOCUMENTAL',
          9999,
          'PORTAL EXTERNO',
          now,
        ]
      );
    }

    await client.query(
      `
        INSERT INTO process_history (id, process_id, user_id, user_name, action_text, event_timestamp, justification)
        VALUES ($1, $2, NULL, $3, $4, $5, $6)
      `,
      [
        randomUUID(),
        processId,
        'PORTAL EXTERNO',
        pendingType === 'Documental'
          ? 'RESPOSTA DOCUMENTAL ENVIADA PELO PORTAL EXTERNO'
          : 'RESPOSTA DE INFORMACAO ENVIADA PELO PORTAL EXTERNO',
        now,
        pendingType === 'Informacao' ? responseText : `Arquivo: ${String(attachment.name)}`,
      ]
    );
  });

  return getExternalPortalProcessDetail(identifier, processId);
};

export const repository = {
  isSupported: (tableName) => SUPPORTED_TABLES.includes(tableName),
  getSupportedTables: () => [...SUPPORTED_TABLES],
  async getAll(tableName) {
    ensureTableSupported(tableName);

    if (SIMPLE_TABLE_NAMES.includes(tableName)) return getSimple(tableName);
    if (tableName === 'profiles') return getProfiles();
    if (tableName === 'users') return getUsers();
    if (tableName === 'documents') return getDocuments();
    if (tableName === 'processes') return getProcesses();

    throw new Error(`Consulta não implementada para ${tableName}`);
  },
  async upsert(tableName, item) {
    ensureTableSupported(tableName);

    if (SIMPLE_TABLE_NAMES.includes(tableName)) return upsertSimple(tableName, item);
    if (tableName === 'profiles') return upsertProfile(item);
    if (tableName === 'users') return upsertUser(item);
    if (tableName === 'documents') return upsertDocument(item);
    if (tableName === 'processes') return upsertProcess(item);

    throw new Error(`Upsert não implementado para ${tableName}`);
  },
  async delete(tableName, id) {
    ensureTableSupported(tableName);

    if (SIMPLE_TABLE_NAMES.includes(tableName)) return deleteSimple(tableName, id);
    if (tableName === 'profiles') return deleteProfile(id);
    if (tableName === 'users') return deleteUser(id);
    if (tableName === 'documents') return deleteDocument(id);
    if (tableName === 'processes') return deleteProcess(id);

    throw new Error(`Delete não implementado para ${tableName}`);
  },
};

export const externalPortalRepository = {
  prepareAccess: prepareExternalPortalAccess,
  registerUser: registerExternalPortalUser,
  setPassword: setExternalPortalPassword,
  login: loginExternalPortal,
  getProcessDetail: getExternalPortalProcessDetail,
  submitRequest: submitExternalPortalRequest,
  submitPendingResponse: submitExternalPortalPendingResponse,
};
