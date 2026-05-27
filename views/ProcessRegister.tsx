import React, { useEffect, useState } from 'react';
import { Interested, Process, Document, ArchivalClassification, CoverTemplate, AccessLevelConfig } from '../types';
import { generateId, formatCPF, formatCNPJ } from '../utils';

interface ProcessRegisterProps {
  interested: Interested[];
  documents: Document[];
  classifications: ArchivalClassification[];
  coverTemplates: CoverTemplate[];
  accessLevels: AccessLevelConfig[];
  onSave: (proc: Omit<Process, 'id' | 'createdAt' | 'sectorId' | 'status' | 'isArchived' | 'nup' | 'unitId'>) => void;
  onAddInterested: (i: Interested) => void;
  autuarDocId: string | null;
}

const ProcessRegister: React.FC<ProcessRegisterProps> = ({ interested, documents, classifications, coverTemplates, accessLevels, onSave, onAddInterested, autuarDocId }) => {
  const [formData, setFormData] = useState({
    description: '',
    interestedIds: [] as string[],
    archivalClassificationId: '',
    coverTemplateId: '',
    accessLevelId: '',
  });
  const [showInterestedSearch, setShowInterestedSearch] = useState(false);
  const [showQuickAddInterested, setShowQuickAddInterested] = useState(false);
  const [newInterested, setNewInterested] = useState<Omit<Interested, 'id' | 'unitId'>>({ type: 'Pessoa', name: '', identifier: '' });

  useEffect(() => {
    if (accessLevels.length > 0 && !formData.accessLevelId) {
      setFormData((prev) => ({ ...prev, accessLevelId: accessLevels[0].id }));
    }
  }, [accessLevels, formData.accessLevelId]);

  useEffect(() => {
    if (!autuarDocId) return;
    const doc = documents.find((item) => item.id === autuarDocId);
    if (!doc) return;
    setFormData((prev) => ({
      ...prev,
      description: `PROCESSO DE AUTUACAO: ${doc.description}`,
      interestedIds: doc.interestedIds || [],
      archivalClassificationId: doc.archivalClassificationId || '',
      accessLevelId: doc.accessLevelId,
    }));
  }, [autuarDocId, documents]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.interestedIds.length === 0) {
      alert('Selecione pelo menos um interessado.');
      return;
    }
    if (!formData.accessLevelId) {
      alert('Por favor, selecione o nivel de acesso.');
      return;
    }
    onSave({ ...formData, history: [] });
  };

  const toggleInterested = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      interestedIds: prev.interestedIds.includes(id)
        ? prev.interestedIds.filter((item) => item !== id)
        : [...prev.interestedIds, id],
    }));
  };

  const handleQuickAddInterested = (e: React.FormEvent) => {
    e.preventDefault();
    const isDuplicate = interested.some((item) => item.identifier === newInterested.identifier);
    if (isDuplicate) {
      alert(`Erro: ja existe um interessado cadastrado com este ${newInterested.type === 'Pessoa' ? 'CPF' : 'CNPJ'}.`);
      return;
    }

    const minLength = newInterested.type === 'Pessoa' ? 14 : 18;
    if (newInterested.identifier.length < minLength) {
      alert(`O ${newInterested.type === 'Pessoa' ? 'CPF' : 'CNPJ'} esta incompleto.`);
      return;
    }

    const newId = generateId();
    onAddInterested({ ...newInterested, id: newId, unitId: '' } as Interested);
    setFormData((prev) => ({ ...prev, interestedIds: [...prev.interestedIds, newId] }));
    setShowQuickAddInterested(false);
    setNewInterested({ type: 'Pessoa', name: '', identifier: '' });
  };

  const handleQuickIdentifierChange = (value: string) => {
    const formatted = newInterested.type === 'Pessoa' ? formatCPF(value) : formatCNPJ(value);
    setNewInterested({ ...newInterested, identifier: formatted });
  };

  const selectedInterestedObjects = interested.filter((item) => formData.interestedIds.includes(item.id));

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500 text-black">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">{autuarDocId ? 'Autuar Processo Administrativo' : 'Abrir Novo Processo'}</h1>
        <p className="text-slate-500">Inicie um novo fluxo administrativo com classificacao arquivistica e nivel de acesso.</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <label className="block text-sm font-bold text-slate-700 mb-1">Assunto / Descricao Principal *</label>
            <textarea required rows={4} value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="w-full px-4 py-2 bg-white text-black border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-normal" />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-bold text-slate-700 mb-1">Interessados *</label>
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <button type="button" onClick={() => setShowInterestedSearch(!showInterestedSearch)} className="w-full px-4 py-2 bg-white text-slate-400 border border-slate-300 rounded-xl outline-none text-left text-sm flex justify-between items-center font-normal">
                  <span>Adicionar interessado...</span>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                </button>

                {showInterestedSearch && (
                  <div className="absolute z-50 mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-2xl max-h-60 overflow-y-auto">
                    {interested.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => { toggleInterested(item.id); setShowInterestedSearch(false); }}
                        className={`w-full text-left px-4 py-3 text-sm hover:bg-slate-50 transition border-b border-slate-50 last:border-0 flex justify-between items-center ${formData.interestedIds.includes(item.id) ? 'bg-indigo-50' : ''}`}
                      >
                        <div>
                          <span className="font-bold block text-slate-800">{item.name}</span>
                          <span className="text-[10px] text-slate-400">{item.identifier}</span>
                        </div>
                        {formData.interestedIds.includes(item.id) && <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <button type="button" onClick={() => setShowQuickAddInterested(true)} className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
              </button>
            </div>

            <div className="flex flex-wrap gap-2 mt-3">
              {selectedInterestedObjects.map((item) => (
                <div key={item.id} className="flex items-center gap-2 bg-indigo-50 border border-indigo-200 px-3 py-1.5 rounded-full group animate-in zoom-in-95 duration-200">
                  <span className="text-[10px] font-bold text-indigo-700">{item.name}</span>
                  <button type="button" onClick={() => toggleInterested(item.id)} className="text-indigo-400 hover:text-red-500 transition-colors">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Nivel de Acesso *</label>
            <select required value={formData.accessLevelId} onChange={(e) => setFormData({ ...formData, accessLevelId: e.target.value })} className="w-full px-4 py-2 bg-white text-black border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-normal">
              <option value="">Selecione o nivel...</option>
              {accessLevels.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Classificacao Arquivistica</label>
            <select value={formData.archivalClassificationId} onChange={(e) => setFormData({ ...formData, archivalClassificationId: e.target.value })} className="w-full px-4 py-2 bg-white text-black border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-normal">
              <option value="">Nenhuma classificacao</option>
              {classifications.map((item) => <option key={item.id} value={item.id}>{item.code} - {item.name}</option>)}
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-bold text-slate-700 mb-1">Modelo de Capa (Opcional)</label>
            <select value={formData.coverTemplateId} onChange={(e) => setFormData({ ...formData, coverTemplateId: e.target.value })} className="w-full px-4 py-2 bg-white text-black border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-normal">
              <option value="">Nenhuma capa</option>
              {coverTemplates.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
            </select>
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t border-slate-100">
          <button type="submit" className="px-12 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-lg transition">Iniciar Processo</button>
        </div>
      </form>

      {showQuickAddInterested && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md animate-in zoom-in-95 duration-200 overflow-hidden">
            <div className="p-6 border-b flex justify-between items-center bg-slate-50/50">
              <h3 className="text-xl font-bold text-slate-800 italic tracking-tight">Novo Interessado</h3>
              <button onClick={() => setShowQuickAddInterested(false)} className="text-slate-400 hover:text-slate-600 transition">x</button>
            </div>
            <form onSubmit={handleQuickAddInterested} className="p-8 space-y-5">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Tipo de Cadastro</label>
                <div className="flex gap-2 p-1 bg-slate-100 rounded-lg border border-slate-200">
                  <button type="button" onClick={() => setNewInterested({ ...newInterested, type: 'Pessoa', identifier: '' })} className={`flex-1 py-2 text-xs font-bold rounded-md transition ${newInterested.type === 'Pessoa' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500'}`}>Fisica (CPF)</button>
                  <button type="button" onClick={() => setNewInterested({ ...newInterested, type: 'Empresa', identifier: '' })} className={`flex-1 py-2 text-xs font-bold rounded-md transition ${newInterested.type === 'Empresa' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500'}`}>Juridica (CNPJ)</button>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nome / Razao Social</label>
                <input required value={newInterested.name} onChange={(e) => setNewInterested({ ...newInterested, name: e.target.value })} className="w-full p-2.5 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 bg-white text-slate-900 shadow-sm font-normal" placeholder="Digite o nome..." />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">{newInterested.type === 'Pessoa' ? 'CPF' : 'CNPJ'} *</label>
                <input required value={newInterested.identifier} onChange={(e) => handleQuickIdentifierChange(e.target.value)} maxLength={newInterested.type === 'Pessoa' ? 14 : 18} className="w-full p-2.5 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-mono bg-white text-slate-900 shadow-sm font-normal" placeholder={newInterested.type === 'Pessoa' ? '000.000.000-00' : '00.000.000/0000-00'} />
              </div>
              <div className="flex gap-2 pt-4 border-t border-slate-50">
                <button type="button" onClick={() => setShowQuickAddInterested(false)} className="flex-1 py-3 text-slate-500 font-bold hover:text-slate-800 transition">Cancelar</button>
                <button type="submit" className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-bold shadow-lg transition">Salvar e Vincular</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProcessRegister;
