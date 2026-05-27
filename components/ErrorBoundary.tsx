import React from 'react';

type ErrorBoundaryProps = {
  children: React.ReactNode;
};

type ErrorBoundaryState = {
  hasError: boolean;
  error?: Error;
};

export default class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('Erro nao tratado na interface', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-slate-950 px-6 text-white">
          <div className="w-full max-w-xl rounded-[2rem] border border-rose-500/30 bg-white/5 p-8 shadow-2xl shadow-black/30">
            <p className="text-[11px] font-black uppercase tracking-[0.35em] text-rose-300">Erro na interface</p>
            <h1 className="mt-3 text-3xl font-black uppercase tracking-tight">A tela encontrou um erro</h1>
            <p className="mt-4 text-sm leading-6 text-slate-300">
              O sistema encontrou um problema ao renderizar esta tela. Recarregue a página para tentar novamente.
            </p>
            {this.state.error?.message ? (
              <pre className="mt-5 overflow-auto rounded-2xl border border-white/10 bg-black/30 p-4 text-xs text-rose-200">
                {this.state.error.message}
              </pre>
            ) : null}
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-6 rounded-2xl bg-rose-500 px-5 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-white transition hover:bg-rose-600"
            >
              Recarregar
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
