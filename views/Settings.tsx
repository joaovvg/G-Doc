import React from 'react';

interface SettingsProps {
  onNavigate: (view: string) => void;
  onRefreshData: () => Promise<void>;
  onSyncAll: () => Promise<void>;
  forceAll?: boolean;
  permissions: {
    units: boolean;
    users: boolean;
    profiles: boolean;
    sectors: boolean;
    doctypes: boolean;
    classifications: boolean;
    covers: boolean;
    portalServices: boolean;
    accessLevels: boolean;
    interested: boolean;
    repository: boolean;
    audit: boolean;
  };
}

type AdminCard = {
  id: string;
  label: string;
  desc: string;
  icon: string;
  allowed: boolean;
};

const Settings: React.FC<SettingsProps> = ({ onNavigate, onRefreshData, onSyncAll, permissions, forceAll }) => {
  const allOptions: AdminCard[] = [
    { id: 'settings_units', label: 'Unidades Organizacionais', desc: 'Gerencie estabelecimentos e empresas isoladas.', icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4', allowed: permissions.units },
    { id: 'settings_profiles', label: 'Perfis de Acesso', desc: 'Defina permissões e visibilidade por grupo de usuários.', icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z', allowed: permissions.profiles },
    { id: 'settings_users', label: 'Usuários', desc: 'Administre o acesso dos colaboradores e seus perfis.', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z', allowed: permissions.users },
    { id: 'settings_audit', label: 'Relatórios e Auditoria', desc: 'Analise o fluxo de trabalho e conformidade documental.', icon: 'M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z', allowed: permissions.audit },
    { id: 'settings_interested', label: 'Banco de Interessados', desc: 'Gerencie o cadastro global de pessoas e empresas.', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z', allowed: permissions.interested },
    { id: 'settings_sectors', label: 'Setores', desc: 'Configure as unidades operacionais da sua empresa.', icon: 'M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5z', allowed: permissions.sectors },
    { id: 'settings_access_levels', label: 'Níveis de Acesso', desc: 'Personalize as regras de sigilo documental.', icon: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z', allowed: permissions.accessLevels },
    { id: 'settings_doc_types', label: 'Tipos de Documento', desc: 'Defina modelos de expedientes aceitos.', icon: 'M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414', allowed: permissions.doctypes },
    { id: 'settings_portal_services', label: 'Serviços do Portal', desc: 'Cadastre os serviços digitais disponibilizados ao cidadão.', icon: 'M12 8c-1.657 0-3 1.343-3 3m6-3c1.657 0 3 1.343 3 3m-9 0v6a2 2 0 002 2h4a2 2 0 002-2v-6m-6 0h6', allowed: permissions.portalServices },
    { id: 'settings_repository', label: 'Repositório Global', desc: 'Consulte todos os PDFs armazenados no sistema.', icon: 'M4 7a2 2 0 012-2h12a2 2 0 012 2v10a2 2 0 01-2 2H6a2 2 0 01-2-2V7zm2 0v10h12V7H6zm2 2h8v2H8V9zm0 4h5v2H8v-2z', allowed: permissions.repository },
    { id: 'settings_classifications', label: 'Classificação Arquivística', desc: 'Organize os planos de retenção e arquivo.', icon: 'M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z', allowed: permissions.classifications },
    { id: 'settings_cover', label: 'Modelo de Capa', desc: 'Personalize a folha de rosto dos processos.', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586', allowed: permissions.covers },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20 text-black">
      <div className="flex justify-between items-end gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-black text-slate-800 uppercase tracking-tighter italic">Configurações Master</h1>
          <p className="text-slate-500 font-medium italic mt-2">Painel de controle administrativo e gestão de sincronia com o Banco de Dados do sistema.</p>
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => void onRefreshData()}
            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-[11px] font-black uppercase tracking-[0.2em] text-slate-700 transition hover:border-indigo-400 hover:text-indigo-700"
          >
            Recarregar Dados
          </button>
          <button
            type="button"
            onClick={() => void onSyncAll()}
            disabled={!forceAll}
            className="rounded-2xl bg-indigo-600 px-4 py-3 text-[11px] font-black uppercase tracking-[0.2em] text-white transition hover:bg-black"
          >
            Sincronizar Tudo
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {allOptions.map((opt) => {
          const enabled = forceAll || opt.allowed;
          return (
          <button
            key={opt.id}
            type="button"
            onClick={() => enabled && onNavigate(opt.id)}
            disabled={!enabled}
            className={`flex flex-col p-8 bg-white border rounded-[3rem] transition-all group text-left relative overflow-hidden ${
              enabled ? 'border-slate-200 hover:border-indigo-400 hover:shadow-2xl cursor-pointer' : 'border-slate-100 opacity-55 cursor-not-allowed'
            }`}
          >
            <div className="pointer-events-none absolute top-0 right-0 w-32 h-32 bg-indigo-50/50 rounded-full blur-3xl translate-x-10 -translate-y-10 group-hover:bg-indigo-100/50 transition-colors"></div>
            <div className="pointer-events-none w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-indigo-600 group-hover:text-white transition-all mb-6 shadow-sm">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={opt.icon} />
              </svg>
            </div>
            <h3 className="font-black text-slate-800 text-xl group-hover:text-indigo-600 transition tracking-tighter uppercase italic">{opt.label}</h3>
            <p className="text-slate-500 text-[11px] font-medium mt-3 leading-relaxed uppercase opacity-70">{opt.desc}</p>
            {!enabled ? <p className="mt-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Sem permissão</p> : null}
          </button>
          );
        })}
      </div>

      <div className="mt-16 p-12 bg-indigo-50 rounded-[4rem] border border-indigo-100 flex items-center gap-10 shadow-inner relative overflow-hidden">
        <div className="pointer-events-none absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-white/20 via-transparent to-transparent"></div>
        <div className="pointer-events-none w-20 h-20 bg-indigo-600 rounded-[2.5rem] flex items-center justify-center text-white shadow-2xl shadow-indigo-200 shrink-0 transform -rotate-3 group-hover:rotate-0 transition-transform">
          <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <div className="relative z-10">
          <p className="text-2xl font-black text-indigo-900 italic tracking-tighter uppercase">Ambiente Corporativo Seguro</p>
          <p className="text-xs text-indigo-700 font-bold leading-relaxed max-w-3xl mt-2 uppercase opacity-80">
            Todas as configurações realizadas nesta central afetam diretamente a governança documental da sua unidade organizacional. O mecanismo de sincronização garante que nenhum dado seja perdido, mesmo em condições de rede instáveis.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Settings;
