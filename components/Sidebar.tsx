import React, { useState } from 'react';

interface SidebarProps {
  activeSubView: string;
  onNavigate: (view: string) => void;
  permissions: string[];
}

const Sidebar: React.FC<SidebarProps> = ({ activeSubView, onNavigate, permissions }) => {
  const [expanded, setExpanded] = useState({ docs: false, procs: false });

  const MenuItem = ({ id, icon, label, permission, children }: { id: string; icon: React.ReactNode; label: string; permission?: string | string[]; children?: React.ReactNode }) => {
    const permissionList = Array.isArray(permission) ? permission : permission ? [permission] : [];
    if (permissionList.length > 0 && !permissionList.some((perm) => permissions.includes(perm))) return null;

    const isActive = activeSubView.startsWith(id) && id !== 'settings';
    const hasChildren = !!children;
    const isExpanded = id === 'doc' ? expanded.docs : id === 'proc' ? expanded.procs : false;

    return (
      <div className="mb-1">
        <button
          type="button"
          onClick={() => {
            if (hasChildren) setExpanded((prev) => ({ ...prev, [id === 'doc' ? 'docs' : 'procs']: !isExpanded }));
            else onNavigate(id);
          }}
          className={`w-full flex items-center justify-between px-4 py-2.5 rounded-lg transition ${isActive && !hasChildren ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
        >
          <div className="flex items-center gap-3">
            {icon}
            <span className="font-medium">{label}</span>
          </div>
          {hasChildren && <svg className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>}
        </button>
        {hasChildren && isExpanded && <div className="ml-9 mt-1 space-y-1">{children}</div>}
      </div>
    );
  };

  return (
    <aside className="w-64 bg-slate-900 h-full flex flex-col text-slate-100 overflow-y-auto shrink-0 border-r border-slate-800">
      <div className="p-6 border-b border-slate-800 flex items-center gap-3">
        <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white shrink-0">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <div>
          <h2 className="text-xl font-bold bg-gradient-to-r from-indigo-400 to-blue-400 bg-clip-text text-transparent italic leading-tight">GDOC</h2>
          <p className="text-[9px] text-slate-500 font-semibold tracking-tighter uppercase">Gestor Documental</p>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        <MenuItem id="dashboard" label="Dashboard" permission="view_dashboard" icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>} />
        <MenuItem id="proc" label="Processos" permission="proc_view" icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>}>
          <div className="space-y-1">
          <button onClick={() => onNavigate('proc_list')} className={`w-full text-left px-4 py-2 rounded-lg text-sm ${activeSubView === 'proc_list' ? 'text-indigo-400 bg-slate-800' : 'text-slate-500 hover:text-white'}`}>Listagem</button>
          <button onClick={() => onNavigate('proc_search')} className={`w-full text-left px-4 py-2 rounded-lg text-sm ${activeSubView === 'proc_search' ? 'text-indigo-400 bg-slate-800' : 'text-slate-500 hover:text-white'}`}>Pesquisar</button>
          {permissions.includes('proc_create') && <button onClick={() => onNavigate('proc_register')} className={`w-full text-left px-4 py-2 rounded-lg text-sm ${activeSubView === 'proc_register' ? 'text-indigo-400 bg-slate-800' : 'text-slate-500 hover:text-white'}`}>Novo Registro</button>}
          </div>
        </MenuItem>
        <MenuItem id="doc" label="Documentos" permission="doc_view" icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>}>
          <div className="space-y-1">
          <button onClick={() => onNavigate('doc_list')} className={`w-full text-left px-4 py-2 rounded-lg text-sm ${activeSubView === 'doc_list' ? 'text-indigo-400 bg-slate-800' : 'text-slate-500 hover:text-white'}`}>Listagem</button>
          <button onClick={() => onNavigate('doc_search')} className={`w-full text-left px-4 py-2 rounded-lg text-sm ${activeSubView === 'doc_search' ? 'text-indigo-400 bg-slate-800' : 'text-slate-500 hover:text-white'}`}>Pesquisar</button>
          {permissions.includes('doc_create') && <button onClick={() => onNavigate('doc_register')} className={`w-full text-left px-4 py-2 rounded-lg text-sm ${activeSubView === 'doc_register' ? 'text-indigo-400 bg-slate-800' : 'text-slate-500 hover:text-white'}`}>Novo Registro</button>}
          </div>
        </MenuItem>
        <MenuItem id="archive_center" label="Arquivos" permission={['view_files', 'view_archive_center']} icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" /></svg>} />
      </nav>

      <div className="p-4 mt-auto border-t border-slate-800">
        <button type="button" onClick={() => onNavigate('settings')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition ${activeSubView.startsWith('settings') ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-600/20' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
          <span className="font-bold">Administracao</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
