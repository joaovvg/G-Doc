import React, { useEffect, useMemo, useState } from 'react';
import { ExternalPortalPreparation, ExternalPortalProcessDetail, ExternalPortalRecord, ExternalPortalSession, WebProtocolStatus } from '../types';
import { DatabaseService } from '../lib/database';
import { formatIdentifier } from '../utils';
import BrandMark from '../components/BrandMark';

type PortalMode = 'home' | 'login' | 'register' | 'password' | 'dashboard' | 'protocol_detail' | 'pending_response';

const formatDate = (value: string) => new Date(value).toLocaleDateString('pt-BR');

const getWebProtocolStatusMeta = (status?: WebProtocolStatus) => {
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
      return { label: 'Aguardando analise', className: 'bg-sky-100 text-sky-700 border-sky-200' };
  }
};

const readPdfAsBase64 = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result === 'string') {
        resolve(result);
      } else {
        reject(new Error('Falha ao ler o arquivo.'));
      }
    };
    reader.onerror = () => reject(new Error('Falha ao ler o arquivo.'));
    reader.readAsDataURL(file);
  });

const RecordCard: React.FC<{ item: ExternalPortalRecord; onOpen: () => void }> = ({ item, onOpen }) => (
  <button
    type="button"
    onClick={onOpen}
    className="block w-full rounded-[2rem] border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-300 hover:shadow-md"
  >
    <div className="flex items-center justify-between gap-3">
      <span className="rounded-full bg-indigo-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.25em] text-indigo-700">
        Protocolo Web
      </span>
      <span className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] ${getWebProtocolStatusMeta(item.webProtocolStatus).className}`}>
        {getWebProtocolStatusMeta(item.webProtocolStatus).label}
      </span>
    </div>
    <h3 className="mt-4 text-lg font-black uppercase tracking-tight text-slate-900">{item.description}</h3>
    <div className="mt-4 space-y-1 text-sm text-slate-500">
      <p>NUP: <span className="font-bold text-slate-700">{item.nup}</span></p>
      <p>Data: <span className="font-bold text-slate-700">{formatDate(item.createdAt)}</span></p>
      {item.serviceName ? <p>Servico: <span className="font-bold text-slate-700">{item.serviceName}</span></p> : null}
      {item.sectorName ? <p>Setor atual: <span className="font-bold text-slate-700">{item.sectorName}</span></p> : null}
      {item.webProtocolStatus ? <p>Status web: <span className="font-bold text-slate-700">{getWebProtocolStatusMeta(item.webProtocolStatus).label}</span></p> : null}
      {item.webProtocolMessage ? <p className="text-slate-600">Pendencia: <span className="font-bold text-slate-800">{item.webProtocolMessage}</span></p> : null}
      {item.webProtocolPendingType ? <p className="text-slate-600">Tipo da pendencia: <span className="font-bold text-slate-800">{item.webProtocolPendingType}</span></p> : null}
      {item.webProtocolPendingResponseText ? <p className="text-slate-600">Resposta enviada: <span className="font-bold text-slate-800">{item.webProtocolPendingResponseText}</span></p> : null}
      {item.webProtocolPendingResponseFileName ? <p className="text-slate-600">Anexo enviado: <span className="font-bold text-slate-800">{item.webProtocolPendingResponseFileName}</span></p> : null}
    </div>
    <p className="mt-4 text-[10px] font-black uppercase tracking-[0.25em] text-indigo-700">Clique para ver o detalhamento</p>
  </button>
);

const ExternalPortalApp: React.FC = () => {
  const [mode, setMode] = useState<PortalMode>('home');
  const [identifier, setIdentifier] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [prepared, setPrepared] = useState<ExternalPortalPreparation | null>(null);
  const [session, setSession] = useState<ExternalPortalSession | null>(null);
  const [selectedServiceId, setSelectedServiceId] = useState('');
  const [serviceDetails, setServiceDetails] = useState('');
  const [requestedAttachments, setRequestedAttachments] = useState<Record<string, { name: string; content: string }>>({});
  const [selectedProtocol, setSelectedProtocol] = useState<ExternalPortalProcessDetail | null>(null);
  const [selectedProtocolLabel, setSelectedProtocolLabel] = useState<ExternalPortalRecord | null>(null);
  const [selectedProtocolDocumentId, setSelectedProtocolDocumentId] = useState('');
  const [pendingResponseText, setPendingResponseText] = useState('');
  const [pendingResponseAttachment, setPendingResponseAttachment] = useState<{ name: string; content: string } | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingProtocol, setIsLoadingProtocol] = useState(false);
  const [isSubmittingPendingResponse, setIsSubmittingPendingResponse] = useState(false);

  const selectedService = useMemo(
    () => session?.services.find((service) => service.id === selectedServiceId) || null,
    [session, selectedServiceId]
  );

  const selectedProtocolDocument = useMemo(() => {
    const documents = selectedProtocol?.documents || [];
    if (!documents.length) return null;
    return documents.find((doc) => doc.id === selectedProtocolDocumentId) || documents[0];
  }, [selectedProtocol, selectedProtocolDocumentId]);

  useEffect(() => {
    setRequestedAttachments({});
  }, [selectedServiceId]);

  useEffect(() => {
    const documents = selectedProtocol?.documents || [];
    if (documents.length) {
      setSelectedProtocolDocumentId(documents[0].id);
    } else {
      setSelectedProtocolDocumentId('');
    }
  }, [selectedProtocol]);

  const clearFeedback = () => {
    setError('');
    setSuccess('');
  };

  const goTo = (nextMode: PortalMode) => {
    clearFeedback();
    setMode(nextMode);
  };

  const openProtocolDetail = async (record: ExternalPortalRecord) => {
    if (!session) return;
    setIsLoadingProtocol(true);
    clearFeedback();
    try {
      const detail = await DatabaseService.externalPortalProcessDetail(session.identifier, record.processId);
      setSelectedProtocol(detail);
      setSelectedProtocolLabel(record);
      setSelectedProtocolDocumentId('');
      setPendingResponseText('');
      setPendingResponseAttachment(null);
      setMode('protocol_detail');
    } catch (err: any) {
      setError(err.message || 'Nao foi possivel carregar o protocolo.');
    } finally {
      setIsLoadingProtocol(false);
    }
  };

  const openPendingResponsePage = () => {
    clearFeedback();
    setMode('pending_response');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    clearFeedback();
    try {
      const result = await DatabaseService.externalPortalLogin(identifier, password);
      setSession(result);
      setMode('dashboard');
      setPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setError(err.message || 'Nao foi possivel acessar o portal.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePrepareRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    clearFeedback();
    try {
      const result = await DatabaseService.externalPortalRegister(identifier, fullName, email, password);
      setPrepared(result);
      setMode('password');
      setConfirmPassword('');
      setSuccess('Cadastro realizado no Banco de Interessados. Confirme ou atualize a senha para concluir o acesso externo.');
    } catch (err: any) {
      setError(err.message || 'Nao foi possivel localizar o cadastro.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    clearFeedback();
    try {
      if (password !== confirmPassword) {
        throw new Error('A confirmacao da senha nao confere.');
      }
      await DatabaseService.externalPortalSetPassword(identifier, password);
      const result = await DatabaseService.externalPortalLogin(identifier, password);
      setSession(result);
      setMode('dashboard');
      setPassword('');
      setConfirmPassword('');
      setSuccess('Senha definida com sucesso.');
    } catch (err: any) {
      setError(err.message || 'Nao foi possivel definir a senha.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session || !selectedServiceId || !selectedService) return;
    setIsSubmitting(true);
    clearFeedback();
    try {
      const requiredFields = selectedService.attachmentFields || [];
      const missingFields = requiredFields.filter((field) => field.required && !requestedAttachments[field.id]?.content);
      if (missingFields.length > 0) {
        throw new Error(`Anexe os arquivos obrigatorios: ${missingFields.map((field) => field.label).join(', ')}.`);
      }

      const attachments = requiredFields
        .map((field) => {
          const file = requestedAttachments[field.id];
          if (!file?.content) return null;
          return {
            name: file.name,
            content: file.content,
            fieldLabel: field.label,
          };
        })
        .filter(Boolean) as { name: string; content: string; fieldLabel?: string }[];

      const refreshed = await DatabaseService.externalPortalSubmitRequest(session.identifier, selectedServiceId, serviceDetails, attachments);
      setSession(refreshed);
      setSelectedServiceId('');
      setServiceDetails('');
      setRequestedAttachments({});
      setSuccess('Solicitacao protocolada com sucesso.');
    } catch (err: any) {
      setError(err.message || 'Nao foi possivel abrir o protocolo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const logout = () => {
    setSession(null);
    setPrepared(null);
    setSelectedProtocol(null);
    setSelectedProtocolLabel(null);
    setSelectedProtocolDocumentId('');
    setPendingResponseText('');
    setPendingResponseAttachment(null);
    setIdentifier('');
    setFullName('');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setSelectedServiceId('');
    setServiceDetails('');
    setRequestedAttachments({});
    goTo('home');
  };

  const handleSubmitPendingResponse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session || !selectedProtocol) return;
    setIsSubmittingPendingResponse(true);
    clearFeedback();
    try {
      const pendingType = selectedProtocol.process.webProtocolPendingType;
      if (pendingType === 'Documental') {
        if (!pendingResponseAttachment) {
          throw new Error('Anexe o PDF solicitado para enviar a resposta documental.');
        }
      } else if (pendingType === 'Informacao') {
        if (!pendingResponseText.trim()) {
          throw new Error('Digite a informação solicitada para enviar a resposta.');
        }
      } else {
        throw new Error('Este protocolo nao possui pendencia aberta.');
      }

      const updated = await DatabaseService.externalPortalSubmitPendingResponse(session.identifier, selectedProtocol.process.id, {
        responseText: pendingResponseText.trim(),
        attachment: pendingResponseAttachment || undefined,
      });
      setSelectedProtocol(updated);
      setSession((prev) => prev ? ({
        ...prev,
        processes: prev.processes.map((item) => item.processId === updated.process.id ? {
          ...item,
          webProtocolStatus: updated.process.webProtocolStatus,
          webProtocolMessage: updated.process.webProtocolMessage,
          webProtocolReviewedAt: updated.process.webProtocolReviewedAt,
          webProtocolPendingType: updated.process.webProtocolPendingType,
          webProtocolPendingResponseText: updated.process.webProtocolPendingResponseText,
          webProtocolPendingResponseFileName: updated.process.webProtocolPendingResponseFileName,
        } : item),
      }) : prev);
      setPendingResponseText('');
      setPendingResponseAttachment(null);
      setSuccess('Resposta da pendencia enviada com sucesso.');
    } catch (err: any) {
      setError(err.message || 'Nao foi possivel enviar a resposta.');
    } finally {
      setIsSubmittingPendingResponse(false);
    }
  };

  const selectedProtocolDocuments = selectedProtocol?.documents || [];
  const selectedProtocolHistory = selectedProtocol?.history || [];

  const renderPdfViewer = (base64?: string) => {
    if (!base64) return null;
    const url = base64.includes('base64,') ? base64 : `data:application/pdf;base64,${base64}`;
    return (
      <iframe
        title="Visualizacao do documento"
        src={url}
        className="h-[70vh] w-full rounded-[1.75rem] border border-slate-200 bg-white"
      />
    );
  };

  if (mode === 'pending_response' && session && selectedProtocol) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900">
        <div className="mx-auto max-w-5xl px-6 py-8">
          <div className="mb-6 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setMode('protocol_detail')}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black uppercase tracking-[0.2em] text-slate-700 transition hover:border-indigo-300 hover:text-indigo-700"
            >
              Voltar
            </button>
            <button
              type="button"
              onClick={logout}
              className="rounded-2xl bg-indigo-600 px-5 py-3 text-sm font-black uppercase tracking-[0.2em] text-white transition hover:bg-black"
            >
              Sair
            </button>
          </div>

          <section className="rounded-[2rem] border border-amber-200 bg-white p-8 shadow-sm">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.35em] text-amber-700">Responder pendencia</p>
                <h1 className="mt-2 text-3xl font-black uppercase tracking-tight text-slate-900">{selectedProtocol.process.nup}</h1>
                <p className="mt-2 text-sm font-semibold text-slate-500">{selectedProtocol.process.description}</p>
              </div>
              <div className="rounded-[1.5rem] border border-amber-100 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                <p className="text-[10px] font-black uppercase tracking-[0.25em] text-amber-500">Status atual</p>
                <p className="mt-1 font-bold">{getWebProtocolStatusMeta(selectedProtocol.process.webProtocolStatus).label}</p>
              </div>
            </div>

            <div className="mt-6 rounded-[1.75rem] border border-slate-200 bg-slate-50 p-5">
              <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">Mensagem da pendencia</p>
              <p className="mt-2 text-sm font-semibold text-slate-700">
                {selectedProtocol.process.webProtocolMessage || 'Nenhuma mensagem foi informada pela equipe interna.'}
              </p>
            </div>

            <form onSubmit={handleSubmitPendingResponse} className="mt-6 rounded-[1.75rem] border border-amber-200 bg-amber-50 p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.25em] text-amber-500">Formulario de resposta</p>
                  <p className="mt-1 text-sm font-bold text-amber-900">
                    {selectedProtocol.process.webProtocolPendingType === 'Documental'
                      ? 'Envie o PDF solicitado.'
                      : 'Digite a informacao solicitada.'}
                  </p>
                </div>
                <span className="rounded-full border border-amber-200 bg-white px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-amber-700">
                  {selectedProtocol.process.webProtocolPendingType || 'Nao informado'}
                </span>
              </div>

              {selectedProtocol.process.webProtocolPendingType === 'Documental' ? (
                <div className="mt-4">
                  <label className="mb-2 block text-[11px] font-black uppercase tracking-[0.25em] text-amber-700">Arquivo PDF</label>
                  <input
                    type="file"
                    accept="application/pdf"
                    className="block w-full rounded-2xl border border-amber-200 bg-white px-4 py-3 text-sm outline-none file:mr-4 file:rounded-xl file:border-0 file:bg-amber-600 file:px-4 file:py-2 file:text-[10px] file:font-black file:uppercase file:tracking-[0.2em] file:text-white hover:file:bg-black"
                    onChange={async (event) => {
                      const file = event.target.files?.[0];
                      if (!file) return;
                      if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
                        setError('Apenas arquivos PDF podem ser enviados.');
                        event.target.value = '';
                        return;
                      }
                      try {
                        clearFeedback();
                        const content = await readPdfAsBase64(file);
                        setPendingResponseAttachment({ name: file.name, content });
                      } catch (uploadError: any) {
                        setError(uploadError.message || 'Nao foi possivel ler o arquivo.');
                      }
                    }}
                  />
                  {pendingResponseAttachment ? (
                    <p className="mt-2 text-[11px] font-bold uppercase tracking-[0.2em] text-emerald-700">
                      Arquivo selecionado: {pendingResponseAttachment.name}
                    </p>
                  ) : (
                    <p className="mt-2 text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500">
                      Nenhum PDF selecionado
                    </p>
                  )}
                </div>
              ) : (
                <div className="mt-4">
                  <label className="mb-2 block text-[11px] font-black uppercase tracking-[0.25em] text-amber-700">Informacao solicitada</label>
                  <textarea
                    rows={6}
                    value={pendingResponseText}
                    onChange={(event) => setPendingResponseText(event.target.value)}
                    className="w-full rounded-2xl border border-amber-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-amber-500"
                    placeholder="Digite a informacao solicitada pela equipe interna."
                  />
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmittingPendingResponse}
                className="mt-4 rounded-2xl bg-amber-600 px-5 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-white transition hover:bg-black disabled:opacity-60"
              >
                {isSubmittingPendingResponse ? 'Enviando...' : 'Enviar resposta'}
              </button>
            </form>
          </section>
        </div>
      </div>
    );
  }

  if (mode === 'protocol_detail' && session && selectedProtocol) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900">
        <div className="mx-auto max-w-7xl px-6 py-8">
          <div className="mb-6 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => goTo('dashboard')}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black uppercase tracking-[0.2em] text-slate-700 transition hover:border-indigo-300 hover:text-indigo-700"
            >
              Voltar
            </button>
            <button
              type="button"
              onClick={logout}
              className="rounded-2xl bg-indigo-600 px-5 py-3 text-sm font-black uppercase tracking-[0.2em] text-white transition hover:bg-black"
            >
              Sair
            </button>
          </div>

          <section className="rounded-[2rem] bg-white p-8 shadow-sm ring-1 ring-slate-200">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.35em] text-indigo-700">Detalhamento do protocolo</p>
                <h1 className="mt-2 text-3xl font-black uppercase tracking-tight text-slate-900">{selectedProtocol.process.nup}</h1>
                <p className="mt-2 text-sm font-semibold text-slate-500">{selectedProtocol.process.description}</p>
              </div>
              <div className="grid gap-3 text-sm">
                <div className="rounded-2xl bg-slate-50 px-4 py-3">
                  <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">Setor atual</p>
                  <p className="mt-1 font-bold text-slate-800">{selectedProtocol.process.sectorName || 'Nao informado'}</p>
                </div>
                <div className="rounded-2xl bg-slate-50 px-4 py-3">
                  <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">Serviço</p>
                  <p className="mt-1 font-bold text-slate-800">{selectedProtocol.process.serviceName || selectedProtocolLabel?.serviceName || 'Nao informado'}</p>
                </div>
                <div className="rounded-2xl bg-slate-50 px-4 py-3">
                  <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">Status</p>
                  <p className="mt-1 font-bold text-slate-800">{selectedProtocol.process.status}</p>
                </div>
              </div>
            </div>

            <div className="mt-6 rounded-[1.75rem] border border-slate-200 bg-slate-50 p-5">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">Protocolo web</p>
                  <p className="mt-2 text-sm font-bold text-slate-800">
                    {getWebProtocolStatusMeta(selectedProtocol.process.webProtocolStatus).label}
                  </p>
                </div>
                <span className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] ${getWebProtocolStatusMeta(selectedProtocol.process.webProtocolStatus).className}`}>
                  {getWebProtocolStatusMeta(selectedProtocol.process.webProtocolStatus).label}
                </span>
              </div>
              {selectedProtocol.process.webProtocolMessage ? (
                <div className="mt-4 rounded-2xl border border-rose-100 bg-white px-4 py-4 text-sm text-slate-700">
                  <p className="text-[10px] font-black uppercase tracking-[0.25em] text-rose-500">Mensagem da analise</p>
                  <p className="mt-2 font-medium">{selectedProtocol.process.webProtocolMessage}</p>
                </div>
              ) : (
                <p className="mt-4 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                  {selectedProtocol.process.webProtocolStatus === 'Aceito'
                    ? 'Seu protocolo foi liberado para o fluxo interno.'
                    : selectedProtocol.process.webProtocolStatus === 'Recusado'
                      ? 'Este protocolo foi recusado pela equipe interna.'
                      : selectedProtocol.process.webProtocolStatus === 'AguardandoResposta'
                        ? 'Existe uma pendencia aguardando resposta.'
                        : selectedProtocol.process.webProtocolStatus === 'RespostaEnviada'
                          ? 'Resposta enviada. Aguarde a analise interna.'
                        : selectedProtocol.process.webProtocolStatus === 'Pendencia'
                          ? 'Existe uma pendencia aguardando retorno.'
                          : 'Seu protocolo ainda esta aguardando analise interna.'}
                </p>
              )}
            </div>

            {selectedProtocol.process.webProtocolStatus === 'AguardandoResposta' ? (
              <div className="mt-6 rounded-[1.75rem] border border-amber-200 bg-amber-50 p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.25em] text-amber-500">Pendencia aberta</p>
                    <p className="mt-1 text-sm font-bold text-amber-900">A pendencia aguarda resposta no formulario dedicado.</p>
                  </div>
                  <button
                    type="button"
                    onClick={openPendingResponsePage}
                    className="rounded-2xl bg-amber-600 px-5 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-white transition hover:bg-black"
                  >
                    Responder pendencia
                  </button>
                </div>
              </div>
            ) : null}

            <div className="mt-8 grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
              <div className="space-y-6">
                <div className="rounded-[1.75rem] border border-slate-200 bg-slate-50 p-5">
                  <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">Capa do processo</p>
                  <p className="mt-2 text-sm font-bold text-slate-800">{selectedProtocol.process.coverTemplateName || 'Definida no portal interno'}</p>
                  <p className="mt-2 text-xs leading-6 text-slate-500">
                    {selectedProtocol.process.coverTemplateContent ? 'A capa foi configurada internamente e aparece no detalhamento completo abaixo.' : 'A capa foi definida internamente e o processo foi protocolado com essa configuração.'}
                  </p>
                </div>

                <div className="rounded-[1.75rem] border border-slate-200 bg-white p-5">
                  <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">Documentos anexados</p>
                  <div className="mt-4 space-y-3">
                    {selectedProtocolDocuments.length === 0 ? (
                      <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm font-semibold text-slate-500">
                        Nenhum documento foi anexado neste protocolo.
                      </div>
                    ) : (
                      selectedProtocolDocuments.map((doc) => (
                        <button
                          key={doc.id}
                          type="button"
                          onClick={() => setSelectedProtocolDocumentId(doc.id)}
                          className={`w-full rounded-2xl border px-4 py-4 text-left transition ${
                            selectedProtocolDocumentId === doc.id
                              ? 'border-indigo-300 bg-indigo-50'
                              : 'border-slate-200 bg-slate-50 hover:border-indigo-200 hover:bg-white'
                          }`}
                        >
                          <p className="text-sm font-black uppercase tracking-tight text-slate-900">{doc.description}</p>
                          <div className="mt-2 space-y-1 text-xs text-slate-500">
                            <p>NUP: <span className="font-bold text-slate-700">{doc.nup}</span></p>
                            {doc.typeName ? <p>Tipo: <span className="font-bold text-slate-700">{doc.typeName}</span></p> : null}
                            {doc.sectorName ? <p>Setor: <span className="font-bold text-slate-700">{doc.sectorName}</span></p> : null}
                            <p>{selectedProtocolDocumentId === doc.id ? 'Visualizando este documento' : 'Clique para visualizar no PDF'}</p>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </div>

                <div className="rounded-[1.75rem] border border-slate-200 bg-white p-5">
                  <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">Andamento</p>
                  <div className="mt-4 space-y-3">
                    {selectedProtocolHistory.length === 0 ? (
                      <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm font-semibold text-slate-500">
                        Nenhum andamento registrado.
                      </div>
                    ) : (
                      selectedProtocolHistory.map((entry) => (
                        <div key={entry.id} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                          <p className="text-sm font-bold text-slate-800">{entry.action}</p>
                          <p className="mt-1 text-xs text-slate-500">
                            {entry.userName} • {formatDate(entry.timestamp)}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="rounded-[1.75rem] border border-slate-200 bg-white p-5">
                  <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">Visualização completa</p>
                  <p className="mt-2 text-sm text-slate-500">
                    O PDF principal do protocolo aparece abaixo. Se houver mais de um documento, a lista ao lado mostra cada anexo separado.
                  </p>
                  <div className="mt-5">{renderPdfViewer(selectedProtocolDocument?.fileContent)}</div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    );
  }

  if (mode === 'dashboard' && session) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900">
        <div className="mx-auto max-w-7xl px-6 py-8">
          <header className="rounded-[2rem] bg-[linear-gradient(135deg,#4f46e5_0%,#2563eb_100%)] px-8 py-8 text-white shadow-2xl shadow-indigo-200/40">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <BrandMark className="mb-5" compact showWordmark />
                <p className="text-[11px] font-black uppercase tracking-[0.35em] text-indigo-100">Portal Externo do Cidadao</p>
                <h1 className="mt-3 text-4xl font-black uppercase tracking-tight">Acompanhamento de Protocolos</h1>
                <p className="mt-3 max-w-2xl text-sm font-medium text-indigo-50/90">
                  Ambiente externo para comunicacao entre a empresa e o cidadao, com abertura e acompanhamento dos protocolos enviados pelo portal.
                </p>
              </div>
              <button onClick={logout} className="rounded-2xl bg-white px-5 py-3 text-sm font-black uppercase tracking-[0.2em] text-indigo-700 transition hover:bg-slate-100">
                Sair
              </button>
            </div>
          </header>

          <section className="mt-8 grid gap-6 md:grid-cols-3">
            <div className="rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-slate-200">
              <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">Interessado</p>
              <p className="mt-3 text-2xl font-black uppercase tracking-tight text-slate-900">{session.name}</p>
              <p className="mt-2 text-sm font-semibold text-slate-500">{session.identifier}</p>
            </div>
            <div className="rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-slate-200">
              <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">Protocolos</p>
              <p className="mt-3 text-4xl font-black text-indigo-700">{session.processes.length}</p>
            </div>
            <div className="rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-slate-200">
              <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">Servicos disponiveis</p>
              <p className="mt-3 text-4xl font-black text-blue-700">{session.services.length}</p>
            </div>
          </section>

          {success ? <div className="mt-6 rounded-3xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-bold text-emerald-700">{success}</div> : null}
          {error ? <div className="mt-6 rounded-3xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm font-bold text-rose-700">{error}</div> : null}

          <section className="mt-8 grid gap-8 xl:grid-cols-[1.1fr_0.9fr]">
            <div className="rounded-[2rem] bg-white p-8 shadow-sm ring-1 ring-slate-200">
              <p className="text-[11px] font-black uppercase tracking-[0.35em] text-indigo-700">Novo Protocolo</p>
              <h2 className="mt-2 text-3xl font-black uppercase tracking-tight text-slate-900">Solicitacao de Servicos</h2>
              <p className="mt-4 text-sm font-medium leading-6 text-slate-500">
                Os servicos abaixo sao pre-cadastrados no portal interno da empresa. Ao enviar uma solicitacao, o sistema abre automaticamente um processo em seu nome.
              </p>

              <form onSubmit={handleSubmitRequest} className="mt-8 space-y-5">
                <div>
                  <label className="mb-2 block text-[11px] font-black uppercase tracking-[0.25em] text-slate-400">Servico Disponivel</label>
                  <select value={selectedServiceId} onChange={(e) => setSelectedServiceId(e.target.value)} required className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-5 py-4 font-semibold outline-none transition focus:border-indigo-600 focus:bg-white">
                    <option value="">Selecione um servico</option>
                    {session.services.map((service) => <option key={service.id} value={service.id}>{service.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="mb-2 block text-[11px] font-black uppercase tracking-[0.25em] text-slate-400">Detalhamento da Solicitacao</label>
                  <textarea rows={7} value={serviceDetails} onChange={(e) => setServiceDetails(e.target.value)} className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-5 py-4 font-medium outline-none transition focus:border-indigo-600 focus:bg-white" placeholder="Descreva o pedido e informe os dados necessarios para analise." />
                </div>
                {selectedService ? (
                  <div className="rounded-[2rem] border border-slate-200 bg-slate-50 p-5">
                    <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                      <div>
                        <p className="text-[11px] font-black uppercase tracking-[0.25em] text-slate-400">Anexos do servico</p>
                        <p className="mt-1 text-sm text-slate-500">
                          Os arquivos abaixo serao incorporados ao processo como anexos em PDF.
                        </p>
                      </div>
                      <span className="rounded-full bg-white px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ring-1 ring-slate-200">
                        {selectedService.attachmentFields?.length || 0} campo(s)
                      </span>
                    </div>
                    <div className="mt-4 space-y-4">
                      {(selectedService.attachmentFields || []).length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-4 text-sm font-semibold text-slate-500">
                          Este servico nao exige anexos adicionais.
                        </div>
                      ) : (
                        selectedService.attachmentFields?.map((field) => {
                          const currentFile = requestedAttachments[field.id];
                          return (
                            <div key={field.id} className="rounded-2xl border border-slate-200 bg-white p-4">
                              <div className="flex items-center justify-between gap-3">
                                <label className="text-sm font-black uppercase tracking-[0.2em] text-slate-700">
                                  {field.label}{field.required ? ' *' : ''}
                                </label>
                                <span className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] ${field.required ? 'bg-rose-50 text-rose-700' : 'bg-slate-100 text-slate-500'}`}>
                                  {field.required ? 'Obrigatorio' : 'Opcional'}
                                </span>
                              </div>
                              <input
                                type="file"
                                accept="application/pdf"
                                className="mt-3 block w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none file:mr-4 file:rounded-xl file:border-0 file:bg-indigo-600 file:px-4 file:py-2 file:text-xs file:font-black file:uppercase file:tracking-[0.2em] file:text-white hover:file:bg-black"
                                onChange={async (event) => {
                                  const file = event.target.files?.[0];
                                  if (!file) return;
                                  if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
                                    setError('Apenas arquivos PDF podem ser anexados.');
                                    event.target.value = '';
                                    return;
                                  }
                                  try {
                                    clearFeedback();
                                    const content = await readPdfAsBase64(file);
                                    setRequestedAttachments((prev) => ({
                                      ...prev,
                                      [field.id]: {
                                        name: file.name,
                                        content,
                                      },
                                    }));
                                  } catch (uploadError: any) {
                                    setError(uploadError.message || 'Nao foi possivel ler o arquivo.');
                                  }
                                }}
                              />
                              {currentFile ? (
                                <p className="mt-2 text-[11px] font-bold uppercase tracking-[0.2em] text-emerald-700">
                                  Arquivo selecionado: {currentFile.name}
                                </p>
                              ) : (
                                <p className="mt-2 text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">
                                  Nenhum PDF selecionado
                                </p>
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                ) : null}
                <button disabled={isSubmitting || session.services.length === 0} className="w-full rounded-3xl bg-indigo-600 px-5 py-4 text-sm font-black uppercase tracking-[0.25em] text-white transition hover:bg-black disabled:opacity-50">
                  {isSubmitting ? 'Protocolando...' : 'Abrir Protocolo'}
                </button>
              </form>
            </div>

          </section>

          <section className="mt-8 rounded-[2rem] bg-white p-8 shadow-sm ring-1 ring-slate-200">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-2xl font-black uppercase tracking-tight text-slate-900">Meus Protocolos</h2>
              <span className="rounded-full bg-indigo-50 px-4 py-2 text-[10px] font-black uppercase tracking-[0.25em] text-indigo-700">{session.processes.length} item(ns)</span>
            </div>
            <p className="mt-3 max-w-3xl text-sm font-medium text-slate-500">
              Esta area mostra apenas os protocolos abertos pelo portal externo. Nenhuma informacao de setores ou estrutura do sistema interno e exposta aqui.
            </p>
            {isLoadingProtocol ? (
              <div className="mt-6 rounded-[1.5rem] border border-slate-200 bg-slate-50 px-5 py-4 text-sm font-semibold text-slate-500">
                Carregando protocolo...
              </div>
            ) : null}
            <div className="mt-6 space-y-4">
              {session.processes.length === 0 ? (
                <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 px-5 py-4 text-sm font-semibold text-slate-500">
                  Nenhum protocolo externo encontrado para este cadastro.
                </div>
              ) : (
                session.processes.map((item) => <RecordCard key={item.id} item={item} onOpen={() => openProtocolDetail(item)} />)
              )}
            </div>
          </section>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-3 text-slate-900">
      <div className="mx-auto max-w-[1040px] rounded border border-slate-300 bg-white">
        <div className="px-4 pt-4">
          <BrandMark compact />
        </div>
        <div className="rounded-t bg-indigo-600 px-4 py-2 text-white">
          <p className="text-lg font-bold">Olá, Seja bem-vindo!</p>
        </div>

        <div className="px-4 py-4 text-[14px] leading-6 text-slate-800">
          <p>
            Para realizar a solicitação de um serviço de forma digital ou acompanhar as solicitações já formalizadas, é necessário que você esteja cadastrado(a).
          </p>
          <p className="mt-1">
            Não é cadastrado(a)?{' '}
            <button onClick={() => goTo('register')} className="font-bold text-indigo-600 underline underline-offset-2">
              Clique aqui e Cadastre-se!
            </button>
          </p>
        </div>

        {(error || success) ? (
          <div className="px-4 pb-3">
            {error ? <div className="rounded border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-bold text-rose-700">{error}</div> : null}
            {success ? <div className="rounded border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-bold text-emerald-700">{success}</div> : null}
          </div>
        ) : null}

        <div className="px-4 pb-6">
          <div className="mx-auto mt-2 max-w-[760px] overflow-hidden rounded-md border border-slate-300">
            <div className="bg-indigo-50 px-4 py-3 text-center text-sm font-bold uppercase text-indigo-700">
              {mode === 'password' ? 'Definir Senha de Acesso' : mode === 'register' ? 'Cadastre-se' : 'Já Tenho Cadastro'}
            </div>

            {(mode === 'home' || mode === 'login') ? (
              <div className="grid md:grid-cols-2">
                <div className="border-r border-slate-300 px-6 py-8">
                  <p className="text-center text-[10px] font-bold uppercase text-slate-700">Acesso sem certificado digital</p>
                  <form onSubmit={handleLogin} className="mx-auto mt-6 max-w-[220px] space-y-3">
                    <div className="grid grid-cols-[72px_1fr] items-center gap-2">
                      <label className="text-right text-sm text-slate-800">CPF/CNPJ</label>
                      <input value={identifier} onChange={(e) => setIdentifier(formatIdentifier(e.target.value))} maxLength={18} required className="h-7 border border-slate-400 px-2 text-sm outline-none focus:border-indigo-600" />
                    </div>
                    <div className="grid grid-cols-[72px_1fr] items-center gap-2">
                      <label className="text-right text-sm text-slate-800">Senha</label>
                      <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="h-7 border border-slate-400 px-2 text-sm outline-none focus:border-indigo-600" />
                    </div>
                    <div className="text-right">
                      <button type="button" onClick={() => goTo('register')} className="text-[11px] text-indigo-600 underline underline-offset-2">
                        Esqueci a senha
                      </button>
                    </div>
                    <div className="mt-4 rounded border border-slate-300 bg-slate-50 px-3 py-3 text-center text-[11px] text-slate-500">
                      Não sou um robô
                    </div>
                    <div className="pt-1 text-center">
                      <button disabled={isSubmitting} className="min-w-20 rounded bg-indigo-600 px-5 py-1.5 text-sm font-bold text-white transition hover:bg-black disabled:opacity-70">
                        {isSubmitting ? 'Entrando...' : 'Entrar'}
                      </button>
                    </div>
                  </form>
                </div>

              <div className="px-6 py-8">
                  <div className="mx-auto max-w-[250px] text-center">
                    <p className="text-[10px] font-bold uppercase text-slate-700">Acesso com certificado digital</p>
                    <p className="mt-10 text-sm leading-6 text-slate-700">
                      Conecte o seu Token e clique no botão entrar para iniciar suas solicitações de serviços.
                    </p>
                    <div className="mt-8 bg-slate-100 px-4 py-4 text-sm text-slate-700">
                      Informação de como adquirir certificado digital. <span className="font-bold text-indigo-600">Clique Aqui</span>
                    </div>
                    <button className="mt-6 min-w-20 rounded bg-indigo-600 px-5 py-1.5 text-sm font-bold text-white transition hover:bg-black">
                      Entrar
                    </button>
                  </div>
                </div>
              </div>
            ) : null}

            {mode === 'register' ? (
              <div className="px-8 py-8">
                <form onSubmit={handlePrepareRegister} className="mx-auto max-w-[520px] space-y-5">
                  <div className="rounded border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-slate-700">
                    O cadastro externo será gravado no Banco de Interessados com CPF, nome completo, e-mail e senha.
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-bold text-slate-700">Nome Completo</label>
                    <input value={fullName} onChange={(e) => setFullName(e.target.value)} required className="h-10 w-full rounded border border-slate-400 px-3 text-sm outline-none focus:border-indigo-600" />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-bold text-slate-700">CPF/CNPJ</label>
                    <input value={identifier} onChange={(e) => setIdentifier(formatIdentifier(e.target.value))} maxLength={18} required className="h-10 w-full rounded border border-slate-400 px-3 text-sm outline-none focus:border-indigo-600" />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-bold text-slate-700">E-mail</label>
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="h-10 w-full rounded border border-slate-400 px-3 text-sm outline-none focus:border-indigo-600" />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-bold text-slate-700">Senha</label>
                    <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="h-10 w-full rounded border border-slate-400 px-3 text-sm outline-none focus:border-indigo-600" />
                  </div>
                  <div className="flex gap-3">
                    <button disabled={isSubmitting} className="rounded bg-indigo-600 px-6 py-2 text-sm font-bold text-white transition hover:bg-black disabled:opacity-70">
                      {isSubmitting ? 'Cadastrando...' : 'Cadastrar Usuário'}
                    </button>
                    <button type="button" onClick={() => goTo('login')} className="rounded border border-slate-300 px-6 py-2 text-sm font-bold text-slate-700">
                      Voltar
                    </button>
                  </div>
                </form>
              </div>
            ) : null}

            {mode === 'password' && prepared ? (
              <div className="px-8 py-8">
                <form onSubmit={handleSetPassword} className="mx-auto max-w-[520px] space-y-5">
                  <div className="rounded border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm text-slate-700">
                    <p className="font-bold uppercase text-slate-900">{prepared.name}</p>
                    <p className="mt-1">{prepared.identifier}</p>
                    <p className="mt-2">Cadastro localizado. Defina sua senha para acessar e abrir protocolos.</p>
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-bold text-slate-700">Nova Senha</label>
                    <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="h-10 w-full rounded border border-slate-400 px-3 text-sm outline-none focus:border-indigo-600" />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-bold text-slate-700">Confirmar Senha</label>
                    <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required className="h-10 w-full rounded border border-slate-400 px-3 text-sm outline-none focus:border-indigo-600" />
                  </div>
                  <div className="flex gap-3">
                    <button disabled={isSubmitting} className="rounded bg-indigo-600 px-6 py-2 text-sm font-bold text-white transition hover:bg-black disabled:opacity-70">
                      {isSubmitting ? 'Salvando...' : prepared.hasAccount ? 'Atualizar Senha' : 'Concluir Cadastro'}
                    </button>
                    <button type="button" onClick={() => goTo('login')} className="rounded border border-slate-300 px-6 py-2 text-sm font-bold text-slate-700">
                      Voltar
                    </button>
                  </div>
                </form>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExternalPortalApp;
