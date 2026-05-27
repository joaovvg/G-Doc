import React, { useMemo, useState } from 'react';
import { ArchivalClassification } from '../types';

interface ArchivalClassificationConfigProps {
  classifications: ArchivalClassification[];
  onSave: (c: Omit<ArchivalClassification, 'unitId'>) => void;
}

const emptyForm: {
  code: string;
  name: string;
  description: string;
  parentId: string;
  retentionCurrentYears: string;
  retentionIntermediateYears: string;
  finalDisposition: 'Guarda Permanente' | 'Eliminacao' | 'Nao Definida';
  legalBasis: string;
  notes: string;
} = {
  code: '',
  name: '',
  description: '',
  parentId: '',
  retentionCurrentYears: '',
  retentionIntermediateYears: '',
  finalDisposition: 'Nao Definida' as const,
  legalBasis: '',
  notes: '',
};

const ArchivalClassificationConfig: React.FC<ArchivalClassificationConfigProps> = ({ classifications, onSave }) => {
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<ArchivalClassification | null>(null);
  const [formData, setFormData] = useState(emptyForm);

  const orderedClassifications = useMemo(
    () => [...classifications].sort((a, b) => `${a.code} ${a.name}`.localeCompare(`${b.code} ${b.name}`)),
    [classifications]
  );

  const handleEdit = (c: ArchivalClassification) => {
    setEditingItem(c);
    setFormData({
      code: c.code,
      name: c.name,
      description: c.description || '',
      parentId: c.parentId || '',
      retentionCurrentYears: c.retentionCurrentYears || '',
      retentionIntermediateYears: c.retentionIntermediateYears || '',
      finalDisposition: c.finalDisposition || 'Nao Definida',
      legalBasis: c.legalBasis || '',
      notes: c.notes || '',
    });
    setShowModal(true);
  };

  const handleNew = () => {
    setEditingItem(null);
    setFormData(emptyForm);
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      id: editingItem?.id || '',
      code: formData.code.trim(),
      name: formData.name.trim(),
      description: formData.description.trim() || undefined,
      parentId: formData.parentId || undefined,
      retentionCurrentYears: formData.retentionCurrentYears.trim() || undefined,
      retentionIntermediateYears: formData.retentionIntermediateYears.trim() || undefined,
      finalDisposition: formData.finalDisposition,
      legalBasis: formData.legalBasis.trim() || undefined,
      notes: formData.notes.trim() || undefined,
    });
    setShowModal(false);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 uppercase tracking-tighter italic">Classificacao Arquivistica</h1>
          <p className="text-slate-500 font-medium italic">Estruture o plano de classificacao e temporalidade em conformidade com o CONARQ.</p>
        </div>
        <button onClick={handleNew} className="bg-indigo-600 hover:bg-black text-white px-8 py-4 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-indigo-100 transition flex items-center gap-3 transform hover:-translate-y-1">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3.5" d="M12 4v16m8-8H4" /></svg>
          Nova Classe
        </button>
      </div>

      <div className="rounded-[32px] border border-indigo-100 bg-indigo-50 p-6 text-black">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-600">Padrao CONARQ</p>
        <p className="mt-2 text-sm font-medium text-indigo-900">
          Cada classe pode registrar codigo, descricao, hierarquia, prazo de guarda nas fases corrente e intermediaria, destinacao final e base legal.
        </p>
      </div>

      <div className="bg-white rounded-[40px] border border-slate-200 shadow-sm overflow-hidden text-black">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>
              <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Codigo</th>
              <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Classe</th>
              <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Temporalidade</th>
              <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Destinacao</th>
              <th className="px-6 py-5 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Acoes</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {orderedClassifications.map((c) => (
              <tr key={c.id} className="hover:bg-indigo-50/30 transition group">
                <td className="px-6 py-5">
                  <span className="text-xs font-black text-indigo-600 bg-indigo-50 px-3 py-1 rounded-lg border border-indigo-100">{c.code}</span>
                </td>
                <td className="px-6 py-5">
                  <p className="text-sm font-black text-slate-800 uppercase">{c.name}</p>
                  {c.description ? <p className="mt-1 text-xs text-slate-500">{c.description}</p> : null}
                </td>
                <td className="px-6 py-5">
                  <p className="text-xs font-bold text-slate-700 uppercase">
                    Corrente: {c.retentionCurrentYears || '-'} | Intermediaria: {c.retentionIntermediateYears || '-'}
                  </p>
                </td>
                <td className="px-6 py-5">
                  <p className="text-xs font-black text-slate-600 uppercase">{c.finalDisposition || 'Nao Definida'}</p>
                </td>
                <td className="px-6 py-5 text-right">
                  <button onClick={() => handleEdit(c)} className="text-indigo-600 hover:text-black text-[10px] font-black uppercase tracking-widest bg-indigo-50 px-4 py-2 rounded-xl transition">Editar</button>
                </td>
              </tr>
            ))}
            {orderedClassifications.length === 0 && (
              <tr><td colSpan={5} className="px-8 py-20 text-center text-slate-400 italic font-bold uppercase tracking-tighter">Nenhuma classificacao cadastrada.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[40px] shadow-2xl w-full max-w-4xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
              <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tighter italic">{editingItem ? 'Editar Classe CONARQ' : 'Nova Classe CONARQ'}</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 transition text-2xl">x</button>
            </div>
            <form onSubmit={handleSubmit} className="p-10 space-y-8 max-h-[85vh] overflow-y-auto custom-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">Codigo *</label>
                  <input required autoFocus value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value })} className="w-full px-5 py-4 bg-slate-50 text-black border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 font-bold uppercase" placeholder="Ex: 020.1" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">Classe Pai</label>
                  <select value={formData.parentId} onChange={(e) => setFormData({ ...formData, parentId: e.target.value })} className="w-full px-5 py-4 bg-slate-50 text-black border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 font-bold">
                    <option value="">Sem hierarquia superior</option>
                    {orderedClassifications.filter((item) => item.id !== editingItem?.id).map((item) => (
                      <option key={item.id} value={item.id}>{item.code} - {item.name}</option>
                    ))}
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">Titulo da Classe *</label>
                  <input required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full px-5 py-4 bg-slate-50 text-black border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 font-bold uppercase" placeholder="Ex: Gestao de contratos e ajustes" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">Descricao</label>
                  <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={3} className="w-full px-5 py-4 bg-slate-50 text-black border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 font-medium" placeholder="Detalhe a abrangencia da classe na tabela de classificacao." />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">Guarda Corrente</label>
                  <input value={formData.retentionCurrentYears} onChange={(e) => setFormData({ ...formData, retentionCurrentYears: e.target.value })} className="w-full px-5 py-4 bg-slate-50 text-black border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 font-bold uppercase" placeholder="Ex: 5 anos" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">Guarda Intermediaria</label>
                  <input value={formData.retentionIntermediateYears} onChange={(e) => setFormData({ ...formData, retentionIntermediateYears: e.target.value })} className="w-full px-5 py-4 bg-slate-50 text-black border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 font-bold uppercase" placeholder="Ex: 10 anos" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">Destinacao Final</label>
                  <select value={formData.finalDisposition} onChange={(e) => setFormData({ ...formData, finalDisposition: e.target.value as typeof formData.finalDisposition })} className="w-full px-5 py-4 bg-slate-50 text-black border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 font-bold">
                    <option value="Nao Definida">Nao Definida</option>
                    <option value="Guarda Permanente">Guarda Permanente</option>
                    <option value="Eliminacao">Eliminacao</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">Base Legal</label>
                  <input value={formData.legalBasis} onChange={(e) => setFormData({ ...formData, legalBasis: e.target.value })} className="w-full px-5 py-4 bg-slate-50 text-black border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 font-bold" placeholder="Resolucao, lei, tabela-meio, observacao normativa..." />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">Observacoes</label>
                  <textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} rows={4} className="w-full px-5 py-4 bg-slate-50 text-black border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 font-medium" placeholder="Use este campo para criterios de aplicacao, amostragem ou observacoes da tabela." />
                </div>
              </div>
              <div className="flex flex-col gap-3 pt-4 border-t border-slate-50">
                <button type="submit" className="w-full bg-indigo-600 text-white py-5 rounded-2xl font-black uppercase text-sm tracking-widest shadow-xl shadow-indigo-100 transition transform hover:-translate-y-1 active:scale-95">Salvar Classificacao</button>
                <button type="button" onClick={() => setShowModal(false)} className="w-full py-4 text-slate-400 font-black text-[10px] uppercase tracking-widest">Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ArchivalClassificationConfig;
