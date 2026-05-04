import { Loader2, Zap } from 'lucide-react';

interface PageLoaderProps {
  message?: string;
}

export default function PageLoader({ message = 'Cargando ArenaDeck...' }: PageLoaderProps) {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 flex items-center justify-center">
      <div className="glass-panel px-8 py-6 text-center">
        <div className="flex items-center justify-center gap-3 mb-3">
          <Zap className="w-6 h-6 text-cyan-400" />
          <span className="text-white font-semibold tracking-wide">ArenaDeck</span>
        </div>
        <div className="flex items-center justify-center gap-2 text-slate-300">
          <Loader2 className="w-5 h-5 animate-spin text-arcane-400" />
          <span>{message}</span>
        </div>
      </div>
    </div>
  );
}
