import React from 'react';

interface BrandMarkProps {
  className?: string;
  showWordmark?: boolean;
  compact?: boolean;
}

const BrandMark: React.FC<BrandMarkProps> = ({ className = '', showWordmark = true, compact = false }) => {
  const boxSize = compact ? 'w-12 h-12' : 'w-24 h-24';
  const iconSize = compact ? 'w-7 h-7' : 'w-12 h-12';

  return (
    <div className={`inline-flex items-center gap-3 ${className}`}>
      <div className={`${boxSize} bg-indigo-600 rounded-3xl flex items-center justify-center shadow-2xl shadow-indigo-500/30 relative overflow-hidden`}>
        <div className="absolute inset-0 bg-gradient-to-br from-white/15 to-transparent" />
        <svg className={`${iconSize} text-white relative z-10`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 3v5h5" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 8h4" />
        </svg>
      </div>

      {showWordmark ? (
        <div className="leading-none">
          <div className="text-xl font-black uppercase tracking-[0.3em] text-slate-900">G-DOC</div>
          <div className="mt-2 text-[10px] font-bold uppercase tracking-[0.35em] text-slate-400">Gestao Documental</div>
        </div>
      ) : null}
    </div>
  );
};

export default BrandMark;
