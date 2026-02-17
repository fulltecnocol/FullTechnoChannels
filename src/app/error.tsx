"use client";

import React from 'react';
import { AlertCircle, RefreshCcw } from 'lucide-react';

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    React.useEffect(() => {
        console.error('App Crash:', error);
    }, [error]);

    return (
        <div className="min-h-screen bg-[#020617] flex items-center justify-center p-6 text-white font-sans">
            <div className="max-w-md w-full space-y-8 text-center">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-red-500/10 border border-red-500/20 mb-4">
                    <AlertCircle className="w-10 h-10 text-red-500" />
                </div>

                <div className="space-y-4">
                    <h1 className="text-3xl font-black tracking-tight">FGate Error</h1>
                    <p className="text-slate-400 font-medium">
                        Se ha producido un error inesperado en la aplicación.
                    </p>

                    <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl text-left text-xs font-mono overflow-auto max-h-40">
                        <span className="text-red-400">Error:</span> {error.message || 'Error desconocido'}
                        {error.digest && (
                            <div className="mt-2 text-slate-500">ID: {error.digest}</div>
                        )}
                    </div>
                </div>

                <button
                    onClick={() => reset()}
                    className="w-full py-4 bg-white text-black rounded-xl font-bold flex items-center justify-center gap-3 hover:bg-slate-200 transition-all"
                >
                    <RefreshCcw className="w-5 h-5" />
                    Reintentar Cargar
                </button>

                <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest">
                    Enviado desde FGate Security Engine
                </p>
            </div>
        </div>
    );
}
