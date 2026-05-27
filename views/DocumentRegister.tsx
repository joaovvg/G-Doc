
import React, { useState, useEffect } from 'react';
import { DocType, Interested, Document, ArchivalClassification, AccessLevelConfig, User } from '../types';
import { formatCPF, formatCNPJ, generateId, fileToBase64 } from '../utils';

interface DocumentRegisterProps {
  docTypes: DocType[];
  interested: Interested[];
  classifications: ArchivalClassification[];
  accessLevels: AccessLevelConfig[];
  onSave: (doc: Omit<Document, 'id' | 'createdAt' | 'sectorId' | 'nup' | 'isArchived' | 'attachments' | 'unitId'>) => void;
  onAddInterested: (i: Interested) => void;
  currentUser: User;
}

const DocumentRegister: React.FC<DocumentRegisterProps> = ({ docTypes, interested, classifications, accessLevels, onSave, onAddInterested, currentUser }) => {
  const [formData, setFormData] = useState({
    description: '',
    typeId: '',
    interestedIds: [] as string[],
    fileName: '',
    fileContent: '',
    archivalClassificationId: '',
    accessLevelId: '',
    authorId: currentUser.id
  });

  const [isReadingFile, setIsReadingFile] = useState(false);
  const [showInterestedSearch, setShowInterestedSearch] = useState(false);
  const [showQuickAddInterested, setShowQuickAddInterested] = useState(false);
  
  const [newInterested, setNewInterested] = useState<Omit<Interested, 'id' | 'unitId'>>({ type: 'Pessoa', name: '', identifier: '' });

  useEffect(() => {
    if (accessLevels.length > 0 && !formData.accessLevelId) {
      setFormData(prev => ({ ...prev, accessLevelId: accessLevels[0].id }));
    }
  }, [accessLevels]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsReadingFile(true);
      try {
        const base64 = await fileToBase64(file);
        setFormData(prev => ({ ...prev, fileName: file.name, fileContent: base64 }));
      } catch (err) {
        alert("Erro ao ler o arquivo PDF.");
      } finally {
        setIsReadingFile(false);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.interestedIds.length === 0) {
        alert("Por favor, selecione pelo menos um interessado.");
        return;
    }
    if (!formData.fileContent) {
        alert("Por favor, anexe o arquivo PDF do documento.");
        return;
    }
    onSave(formData);
  };

  const toggleInterested = (id: string) => {
    setFormData(prev => ({
      ...prev,
      interestedIds: prev.interestedIds.includes(id) 
        ? prev.interestedIds.filter(i => i !== id) 
        : [...prev.interestedIds, id]
    }));
  };

  const handleQuickAddInterested = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validação de Duplicidade
    const isDuplicate = interested.some(i => i.identifier === newInterested.identifier);
    if (isDuplicate) {
      alert(`Erro: Já existe um interessado cadastrado com este ${newInterested.type === 'Pessoa' ? 'CPF' : 'CNPJ'}.`);
      return;
    }

    const minLength = newInterested.type === 'Pessoa' ? 14 : 18;
    if (newInterested.identifier.length < minLength) {
      alert(`O ${newInterested.type === 'Pessoa' ? 'CPF' : 'CNPJ'} está incompleto.`);
      return;
    }

    const newId = generateId();
    onAddInterested({ ...newInterested, id: newId, unitId: '' });
    setFormData(prev => ({ ...prev, interestedIds: [...prev.interestedIds, newId] }));
    setShowQuickAddInterested(false);
    setNewInterested({ type: 'Pessoa', name: '', identifier: '' });
  };

  const handleQuickIdentifierChange = (val: string) => {
    const formatted = newInterested.type === 'Pessoa' ? formatCPF(val) : formatCNPJ(val);
    setNewInterested({ ...newInterested, identifier: formatted });
  };

  const selectedInterestedObjects = interested.filter(i => formData.interestedIds.includes(i.id));

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500 text-black">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Cadastrar Documento</h1>
        <p className="text-slate-500">Registre expedientes e anexe o arquivo PDF real que será salvo no banco de dados do sistema.</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">ClassificaÃ§Ã£o ArquivÃ­stica</label>
            <select value={formData.archivalClassificationId} onChange={(e) => setFormData({ ...formData, archivalClassificationId: e.target.value })} className="w-full px-4 py-2 bg-white text-black border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-normal">
              <option value="">Nenhuma classificaÃ§Ã£o</option>
              {classifications.map(c => <option key={c.id} value={c.id}>{c.code} - {c.name}</option>)}
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-bold text-slate-700 mb-1">Descrição / Assunto *</label>
            <textarea required rows={3} value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="w-full px-4 py-2 bg-white text-black border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-normal" placeholder="Descreva o conteúdo do documento..."></textarea>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Tipo de Documento *</label>
            <select required value={formData.typeId} onChange={(e) => setFormData({ ...formData, typeId: e.target.value })} className="w-full px-4 py-2 bg-white text-black border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-normal">
              <option value="">Selecione...</option>
              {docTypes.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Nível de Acesso *</label>
            <select required value={formData.accessLevelId} onChange={(e) => setFormData({ ...formData, accessLevelId: e.target.value })} className="w-full px-4 py-2 bg-white text-black border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-normal">
              <option value="">Selecione o nível...</option>
              {accessLevels.map(al => <option key={al.id} value={al.id}>{al.name}</option>)}
            </select>
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
                    {interested.map(i => (
                      <button key={i.id} type="button" onClick={() => { toggleInterested(i.id); setShowInterestedSearch(false); }} className={`w-full text-left px-4 py-3 text-sm hover:bg-slate-50 transition border-b border-slate-50 last:border-0 flex justify-between items-center ${formData.interestedIds.includes(i.id) ? 'bg-blue-50' : ''}`}>
                        <div><span className="font-bold block text-slate-800">{i.name}</span><span className="text-[10px] text-slate-400">{i.identifier}</span></div>
                        {formData.interestedIds.includes(i.id) && <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <button type="button" onClick={() => setShowQuickAddInterested(true)} className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg></button>
            </div>
            <div className="flex flex-wrap gap-2 mt-3">
              {selectedInterestedObjects.map(i => (
                <div key={i.id} className="flex items-center gap-2 bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-full animate-in zoom-in-95 duration-200">
                  <span className="text-[10px] font-bold text-blue-700">{i.name}</span>
                  <button type="button" onClick={() => toggleInterested(i.id)} className="text-blue-400 hover:text-red-500 transition-colors"><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg></button>
                </div>
              ))}
            </div>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-bold text-slate-700 mb-1">Arquivo PDF *</label>
            <div className={`relative w-full p-6 border-2 border-dashed rounded-2xl transition-all ${formData.fileContent ? 'border-green-300 bg-green-50' : 'border-slate-300 bg-slate-50 hover:border-indigo-400'}`}>
              <input 
                type="file" 
                accept="application/pdf" 
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                onChange={handleFileChange}
              />
              <div className="text-center">
                {isReadingFile ? (
                  <div className="flex items-center justify-center gap-2 text-indigo-600 font-bold">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    Processando arquivo...
                  </div>
                ) : formData.fileName ? (
                  <div className="flex items-center justify-center gap-2">
                    <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    <div>
                      <p className="text-sm font-bold text-green-800">{formData.fileName}</p>
                      <p className="text-[10px] text-green-600 uppercase font-black">Arquivo carregado com sucesso</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <svg className="w-10 h-10 text-slate-400 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                    <p className="text-xs font-bold text-slate-500 uppercase">Clique ou arraste o PDF para anexar</p>
                    <p className="text-[9px] text-slate-400">Tamanho máximo recomendado: 5MB</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-6 border-t border-slate-100">
          <button type="submit" disabled={isReadingFile} className="w-full sm:w-auto px-12 py-3 bg-indigo-600 hover:bg-black text-white rounded-xl font-bold shadow-lg transition disabled:opacity-50">Incluir Documento</button>
        </div>
      </form>

      {/* Modal de Cadastro Rápido de Interessado */}
      {showQuickAddInterested && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95">
             <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                <h3 className="text-xl font-bold text-slate-800 tracking-tight italic">Novo Interessado</h3>
                <button onClick={() => setShowQuickAddInterested(false)} className="text-slate-400 hover:text-slate-600 transition">✕</button>
             </div>
             
             <form onSubmit={handleQuickAddInterested} className="p-8 space-y-6">
                <div>
                   <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Tipo de Pessoa</label>
                   <div className="flex gap-4 p-1 bg-slate-100 rounded-xl">
                      <button 
                        type="button" 
                        onClick={() => setNewInterested({...newInterested, type: 'Pessoa', identifier: ''})}
                        className={`flex-1 py-2 rounded-lg text-xs font-bold transition ${newInterested.type === 'Pessoa' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}
                      >Física (CPF)</button>
                      <button 
                        type="button" 
                        onClick={() => setNewInterested({...newInterested, type: 'Empresa', identifier: ''})}
                        className={`flex-1 py-2 rounded-lg text-xs font-bold transition ${newInterested.type === 'Empresa' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}
                      >Jurídica (CNPJ)</button>
                   </div>
                </div>

                <div>
                   <label className="block text-xs font-bold text-slate-700 mb-1">Nome Completo / Razão Social</label>
                   <input required value={newInterested.name} onChange={(e) => setNewInterested({...newInterested, name: e.target.value})} className="w-full p-2.5 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 bg-white text-slate-900 font-normal" placeholder="Digite o nome..." />
                </div>

                <div>
                   <label className="block text-xs font-bold text-slate-700 mb-1">{newInterested.type === 'Pessoa' ? 'CPF' : 'CNPJ'} *</label>
                   <input 
                    required 
                    value={newInterested.identifier} 
                    onChange={(e) => handleQuickIdentifierChange(e.target.value)} 
                    maxLength={newInterested.type === 'Pessoa' ? 14 : 18}
                    className="w-full p-2.5 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-mono bg-white text-slate-900 font-normal" 
                    placeholder={newInterested.type === 'Pessoa' ? '000.000.000-00' : '00.000.000/0000-00'} 
                   />
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

export default DocumentRegister;
