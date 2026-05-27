import express from 'express';
import cors from 'cors';
import { config } from './config.js';
import { initializeDatabase, pool } from './db.js';
import { externalPortalRepository, repository } from './repositories.js';

const app = express();

app.use(cors({ origin: config.corsOrigin.split(',').map((item) => item.trim()) }));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

app.get('/api/health', async (_req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ success: true, message: 'API conectada ao PostgreSQL' });
  } catch (error) {
    console.error('Erro no healthcheck:', error);
    res.status(500).json({ success: false, message: error.message || 'Falha na conexão com o banco.' });
  }
});

app.get('/api/meta/tables', (_req, res) => {
  res.json({ success: true, tables: repository.getSupportedTables() });
});

app.post('/api/external-portal/prepare-access', async (req, res) => {
  try {
    const data = await externalPortalRepository.prepareAccess(req.body?.identifier);
    res.json({ success: true, data });
  } catch (error) {
    console.error('Erro ao preparar acesso externo:', error);
    res.status(400).json({ success: false, message: error.message || 'Falha ao localizar cadastro externo.' });
  }
});

app.post('/api/external-portal/set-password', async (req, res) => {
  try {
    const data = await externalPortalRepository.setPassword(req.body?.identifier, req.body?.password);
    res.json({ success: true, data });
  } catch (error) {
    console.error('Erro ao definir senha externa:', error);
    res.status(400).json({ success: false, message: error.message || 'Falha ao definir senha externa.' });
  }
});

app.post('/api/external-portal/register', async (req, res) => {
  try {
    const data = await externalPortalRepository.registerUser(req.body || {});
    res.json({ success: true, data });
  } catch (error) {
    console.error('Erro ao registrar usuario externo:', error);
    res.status(400).json({ success: false, message: error.message || 'Falha ao registrar usuario externo.' });
  }
});

app.post('/api/external-portal/login', async (req, res) => {
  try {
    const data = await externalPortalRepository.login(req.body?.identifier, req.body?.password);
    res.json({ success: true, data });
  } catch (error) {
    console.error('Erro no login externo:', error);
    res.status(400).json({ success: false, message: error.message || 'Falha no acesso externo.' });
  }
});

app.post('/api/external-portal/process-detail', async (req, res) => {
  try {
    const data = await externalPortalRepository.getProcessDetail(req.body?.identifier, req.body?.processId);
    res.json({ success: true, data });
  } catch (error) {
    console.error('Erro ao carregar detalhe do protocolo externo:', error);
    res.status(400).json({ success: false, message: error.message || 'Falha ao carregar o protocolo.' });
  }
});

app.post('/api/external-portal/process-response', async (req, res) => {
  try {
    const data = await externalPortalRepository.submitPendingResponse(
      req.body?.identifier,
      req.body?.processId,
      req.body || {}
    );
    res.json({ success: true, data });
  } catch (error) {
    console.error('Erro ao responder pendencia externa:', error);
    res.status(400).json({ success: false, message: error.message || 'Falha ao responder a pendencia.' });
  }
});

app.post('/api/external-portal/submit-request', async (req, res) => {
  try {
    const data = await externalPortalRepository.submitRequest(
      req.body?.identifier,
      req.body?.serviceId,
      req.body?.details,
      req.body?.attachments || []
    );
    res.json({ success: true, data });
  } catch (error) {
    console.error('Erro ao protocolar serviço externo:', error);
    res.status(400).json({ success: false, message: error.message || 'Falha ao protocolar o serviço.' });
  }
});

app.get('/api/:tableName', async (req, res) => {
  try {
    console.log(`Consultando ${req.params.tableName}...`);
    const data = await repository.getAll(req.params.tableName);
    res.json({ success: true, data });
  } catch (error) {
    console.error(`Erro ao consultar ${req.params.tableName}:`, error);
    res.status(400).json({ success: false, message: error.message || 'Erro ao consultar dados.' });
  }
});

app.post('/api/:tableName/upsert', async (req, res) => {
  try {
    const item = req.body;
    if (!item || typeof item !== 'object') {
      return res.status(400).json({ success: false, message: 'Payload inválido para upsert.' });
    }

    const data = await repository.upsert(req.params.tableName, item);
    res.json({ success: true, data });
  } catch (error) {
    console.error(`Erro ao salvar ${req.params.tableName}:`, error);
    res.status(400).json({ success: false, message: error.message || 'Erro ao salvar dados.' });
  }
});

app.delete('/api/:tableName/:id', async (req, res) => {
  try {
    await repository.delete(req.params.tableName, req.params.id);
    res.json({ success: true });
  } catch (error) {
    console.error(`Erro ao excluir ${req.params.tableName}:`, error);
    res.status(400).json({ success: false, message: error.message || 'Erro ao excluir registro.' });
  }
});

app.use((error, _req, res, _next) => {
  console.error('Erro não tratado:', error);
  res.status(500).json({ success: false, message: 'Erro interno do servidor.' });
});

const startServer = async () => {
  await initializeDatabase();
  app.listen(config.port, () => {
    console.log(`G-Doc backend rodando na porta ${config.port}`);
  });
};

startServer().catch((error) => {
  console.error('Falha ao iniciar backend:', error);
  process.exit(1);
});
