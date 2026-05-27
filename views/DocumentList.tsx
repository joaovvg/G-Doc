
import React, { useState } from 'react';
import { Document, DocType } from '../types';

interface DocumentListProps {
  documents: Document[];
  docTypes: DocType[];
  onSelectDoc: (id: string) => void;
  onCancelDoc: (id: string) => void;
}

const DocumentList: React.FC<DocumentListProps> = ({ documents, docTypes, onSelectDoc, onCancelDoc }) => {
  const [filter, setFilter] = useState<'current' | 'archived'>('current');

  // Filtra apenas documentos que NÃO possuem processId (não estão em processos)
  const filteredDocs = documents.filter(doc => 
    !doc.processId && (filter === 'current' ? !doc.isArchived : doc.isArchived)
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Documentos do Setor</h1>
          <p className="text-slate-500">Gestão de expedientes avulsos do setor ativo.</p>
        </div>
        <div className="flex bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
          <button 
            onClick={() => setFilter('current')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition ${filter === 'current' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            Correntes
          </button>
          <button 
            onClick={() => setFilter('archived')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition ${filter === 'archived' ? 'bg-amber-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            Arquivados
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">NUP / Protocolo</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Descrição</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Tipo</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Data</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredDocs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400 italic">
                    Nenhum documento avulso {filter === 'current' ? 'corrente' : 'arquivado'} encontrado.
                  </td>
                </tr>
              ) : (
                filteredDocs.map(doc => (
                  <tr key={doc.id} className="hover:bg-slate-50 transition group cursor-pointer" onClick={() => onSelectDoc(doc.id)}>
                    <td className="px-6 py-4">
                      <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2 py-1 rounded border border-blue-100">
                        {doc.nup} (Documento)
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-700 font-medium truncate max-w-xs">{doc.description}</td>
                    <td className="px-6 py-4 text-sm text-slate-500">
                      {docTypes.find(t => t.id === doc.typeId)?.name || 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">
                      {new Date(doc.createdAt).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {doc.isPendingReception && doc.senderSectorId === doc.sectorId ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onCancelDoc(doc.id);
                          }}
                          className="text-amber-700 hover:text-amber-900 text-xs font-bold bg-amber-50 px-3 py-1 rounded-full transition"
                        >
                          Cancelar Tramitação
                        </button>
                      ) : (
                        <button className="text-blue-600 hover:text-blue-800 text-xs font-bold bg-blue-50 px-3 py-1 rounded-full transition">
                        Acessar
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DocumentList;
