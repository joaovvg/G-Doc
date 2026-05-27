
import React from 'react';

export type FeedbackStatus = 'processing' | 'success' | 'error' | null;

interface GlobalFeedbackProps {
  status: FeedbackStatus;
  message: string;
  onClose: () => void;
}

const GlobalFeedback: React.FC<GlobalFeedbackProps> = ({ status, message, onClose }) => {
  if (!status) return null;

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-xs w-full flex flex-col items-center text-center animate-in zoom-in-95 duration-300">
        
        {status === 'processing' && (
          <>
            <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4"></div>
            <h3 className="text-lg font-black text-slate-800 uppercase tracking-tighter italic">Processando</h3>
            <p className="text-sm text-slate-500 font-medium mt-1 leading-tight">{message || 'Aguarde um momento...'}</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4 animate-bounce">
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-lg font-black text-green-700 uppercase tracking-tighter italic">Sucesso!</h3>
            <p className="text-sm text-slate-500 font-medium mt-1 leading-tight">{message || 'Operação realizada com êxito.'}</p>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-4">
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="text-lg font-black text-red-700 uppercase tracking-tighter italic">Erro de Sistema</h3>
            <p className="text-sm text-slate-500 font-medium mt-1 mb-6 leading-tight">{message || 'Não foi possível completar a ação.'}</p>
            <button 
              onClick={onClose}
              className="w-full py-3 bg-slate-800 text-white rounded-xl font-bold hover:bg-black transition shadow-lg"
            >
              Tentar Novamente
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default GlobalFeedback;
