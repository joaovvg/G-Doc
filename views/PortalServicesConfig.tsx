import React, { useMemo, useState } from 'react';
import { AccessLevelConfig, CoverTemplate, PortalService, PortalServiceAttachmentField, Sector } from '../types';
import { generateId } from '../utils';

interface PortalServicesConfigProps {
  services: PortalService[];
  sectors: Sector[];
  accessLevels: AccessLevelConfig[];
  docTypes: { id: string; name: string }[];
  coverTemplates: CoverTemplate[];
  unitId: string;
  unitName: string;
  onSave: (service: PortalService) => Promise<boolean>;
  onDelete: (id: string) => Promise<boolean>;
}

const createAttachmentField = (): PortalServiceAttachmentField => ({
  id: generateId(),
  label: '',
  required: true,
});

const emptyForm = {
  id: '',
  name: '',
  description: '',
  sectorId: '',
  accessLevelId: '',
  docTypeId: '',
  coverTemplateId: '',
  isActive: true,
  attachmentFields: [createAttachmentField()],
};

const PortalServicesConfig: React.FC<PortalServicesConfigProps> = ({
  services = [],
  sectors = [],
  accessLevels = [],
  docTypes = [],
  coverTemplates = [],
  unitId,
  unitName,
  onSave,
  onDelete,
}) => {
  const [formData, setFormData] = useState(emptyForm);

  const sortedServices = useMemo(() => [...services].sort((a, b) => a.name.localeCompare(b.name)), [services]);

  const resetForm = () => setFormData(emptyForm);

  const updateField = (index: number, nextValue: PortalServiceAttachmentField) => {
    setFormData((prev) => {
      const nextFields = [...(prev.attachmentFields || [])];
      nextFields[index] = nextValue;
      return { ...prev, attachmentFields: nextFields };
    });
  };

  const addField = () => setFormData((prev) => ({
    ...prev,
    attachmentFields: [...(prev.attachmentFields || []), createAttachmentField()],
  }));

  const removeField = (index: number) => setFormData((prev) => ({
    ...prev,
    attachmentFields: (prev.attachmentFields || []).filter((_, currentIndex) => currentIndex !== index),
  }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const attachmentFields = (formData.attachmentFields || [])
      .map((field) => ({ ...field, label: field.label.trim() }))
      .filter((field) => field.label.length > 0);
    const success = await onSave({
      ...formData,
      attachmentFields,
      unitId,
    } as PortalService);
    if (success) resetForm();
  };

  return (
    <div className="space-y-8 text-black">
      <div>
        <h1 className="text-3xl font-black uppercase tracking-tighter italic text-slate-800">Servicos do Portal</h1>
        <p className="mt-2 text-slate-500">Defina quais servicos poderao ser protocolados pelos cidadaos no portal externo.</p>
        <div className="mt-4 inline-flex items-center gap-2 rounded-2xl border border-indigo-100 bg-indigo-50 px-4 py-2 text-xs font-black uppercase tracking-[0.2em] text-indigo-700">
          Unidade ativa: <span className="text-slate-900">{unitName}</span>
        </div>
      </div>

      <div className="grid gap-8 xl:grid-cols-[640px_minmax(0,1fr)]">
        <form onSubmit={handleSubmit} className="rounded-[2rem] border border-slate-200 bg-white p-10 shadow-sm space-y-6">
          <div>
            <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">Nome do servico</label>
            <input required value={formData.name} onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-indigo-500" placeholder="Ex: Ligacao nova de agua" />
          </div>
          <div>
            <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">Descricao</label>
            <textarea required rows={5} value={formData.description} onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-indigo-500" placeholder="Explique quando o cidadao deve usar este protocolo." />
          </div>
          <div>
            <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">Setor de destino</label>
            <select required value={formData.sectorId} onChange={(e) => setFormData(prev => ({ ...prev, sectorId: e.target.value }))} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-indigo-500">
              <option value="">Selecione o setor</option>
              {sectors.map(sector => <option key={sector.id} value={sector.id}>{sector.name}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">Nivel de acesso do processo</label>
            <select required value={formData.accessLevelId} onChange={(e) => setFormData(prev => ({ ...prev, accessLevelId: e.target.value }))} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-indigo-500">
              <option value="">Selecione o nivel</option>
              {accessLevels.map(level => <option key={level.id} value={level.id}>{level.name}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">Tipo de documento</label>
            <select required value={formData.docTypeId} onChange={(e) => setFormData(prev => ({ ...prev, docTypeId: e.target.value }))} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-indigo-500">
              <option value="">Selecione o tipo</option>
              {docTypes.map(docType => <option key={docType.id} value={docType.id}>{docType.name}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">Capa do processo</label>
            <select value={formData.coverTemplateId} onChange={(e) => setFormData(prev => ({ ...prev, coverTemplateId: e.target.value }))} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-indigo-500">
              <option value="">Usar capa padrao da unidade</option>
              {coverTemplates.map(template => <option key={template.id} value={template.id}>{template.name}</option>)}
            </select>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 md:col-span-2">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">Campos de anexo</p>
                <p className="mt-1 max-w-xl text-sm font-medium leading-6 text-slate-500">
                  Defina quais PDFs o cidadao devera anexar quando abrir este servico no portal externo.
                  Use o nome do campo para deixar claro o que ele precisa enviar, como "Comprovante de residencia" ou "Documento pessoal".
                </p>
              </div>
              <button type="button" onClick={addField} className="rounded-2xl border border-indigo-200 bg-white px-5 py-3 text-xs font-black uppercase tracking-[0.2em] text-indigo-700 transition hover:bg-indigo-50">
                Adicionar campo
              </button>
            </div>
            <div className="mt-5 space-y-4">
              {(formData.attachmentFields || []).map((field, index) => (
                <div key={field.id} className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4">
                  <input
                    value={field.label}
                    onChange={(e) => updateField(index, { ...field, label: e.target.value })}
                    className="block w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-5 text-base outline-none focus:border-indigo-500"
                    placeholder="Ex: Comprovante de residencia"
                  />
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                    <label className="flex flex-1 items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm font-bold text-slate-700">
                      <input
                        type="checkbox"
                        checked={field.required}
                        onChange={(e) => updateField(index, { ...field, required: e.target.checked })}
                      />
                      Obrigatorio
                    </label>
                    <button type="button" onClick={() => removeField(index)} className="rounded-2xl border border-rose-200 px-5 py-4 text-xs font-black uppercase tracking-[0.2em] text-rose-700 transition hover:bg-rose-50">
                      Remover
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-700">
            <input type="checkbox" checked={formData.isActive} onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))} />
            Disponivel para o portal externo
          </label>
          <div className="flex gap-3">
            <button type="submit" className="flex-1 rounded-2xl bg-indigo-600 px-5 py-3 text-sm font-black uppercase tracking-[0.2em] text-white transition hover:bg-slate-950">
              {formData.id ? 'Atualizar' : 'Cadastrar'}
            </button>
            <button type="button" onClick={resetForm} className="rounded-2xl border border-slate-200 px-5 py-3 text-sm font-black uppercase tracking-[0.2em] text-slate-600 transition hover:bg-slate-50">
              Limpar
            </button>
          </div>
        </form>

        <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
          <h2 className="text-xl font-black uppercase tracking-tight text-slate-800">Servicos cadastrados</h2>
          <div className="mt-6 space-y-4">
            {sortedServices.length === 0 ? (
              <p className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 text-sm font-semibold text-slate-500">Nenhum servico do portal cadastrado nesta unidade.</p>
            ) : (
              sortedServices.map(service => (
                <div key={service.id} className="rounded-3xl border border-slate-200 p-5">
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div>
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-black uppercase tracking-tight text-slate-900">{service.name}</h3>
                        <span className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] ${service.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                          {service.isActive ? 'Ativo' : 'Inativo'}
                        </span>
                      </div>
                      <p className="mt-3 text-sm text-slate-500">{service.description}</p>
                      <p className="mt-4 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">
                        Setor: {sectors.find(sector => sector.id === service.sectorId)?.name || 'Nao encontrado'} | Acesso: {accessLevels.find(level => level.id === service.accessLevelId)?.name || 'Nao encontrado'}
                      </p>
                      <p className="mt-2 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">
                        Tipo de documento: {docTypes.find(docType => docType.id === service.docTypeId)?.name || 'Nao definido'}
                      </p>
                      <p className="mt-2 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">
                        Capa: {coverTemplates.find(template => template.id === service.coverTemplateId)?.name || 'Padrao da unidade'}
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {(service.attachmentFields || []).length === 0 ? (
                          <span className="rounded-full bg-slate-100 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                            Sem campos de anexo
                          </span>
                        ) : (
                          service.attachmentFields?.map((field) => (
                            <span key={field.id} className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] ${field.required ? 'bg-indigo-50 text-indigo-700' : 'bg-slate-100 text-slate-500'}`}>
                              {field.label}{field.required ? ' *' : ''}
                            </span>
                          ))
                        )}
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => setFormData({
                          ...emptyForm,
                          ...service,
                          attachmentFields: service.attachmentFields?.length ? service.attachmentFields : [createAttachmentField()],
                        })}
                        className="rounded-2xl border border-indigo-200 px-4 py-2 text-xs font-black uppercase tracking-[0.2em] text-indigo-700 transition hover:bg-indigo-50"
                      >
                        Editar
                      </button>
                      <button type="button" onClick={() => onDelete(service.id)} className="rounded-2xl border border-rose-200 px-4 py-2 text-xs font-black uppercase tracking-[0.2em] text-rose-700 transition hover:bg-rose-50">
                        Excluir
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PortalServicesConfig;
