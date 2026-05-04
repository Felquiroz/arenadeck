import { useState } from 'react';
import { Swords, Trophy, Handshake, X } from 'lucide-react';

interface ReportResultModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (result: 'P1_WIN' | 'P2_WIN' | 'DRAW', scores: { p1: number; p2: number; draws: number }) => void;
  player1Name: string;
  player2Name: string;
}

export const ReportResultModal = ({
  isOpen,
  onClose,
  onSubmit,
  player1Name,
  player2Name,
}: ReportResultModalProps) => {
  const [selectedResult, setSelectedResult] = useState<'P1_WIN' | 'P2_WIN' | 'DRAW' | null>(null);
  const [scores, setScores] = useState({ p1: 0, p2: 0, draws: 0 });

  if (!isOpen) return null;

  const handleSubmit = () => {
    if (!selectedResult) return;
    onSubmit(selectedResult, scores);
    setSelectedResult(null);
    setScores({ p1: 0, p2: 0, draws: 0 });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md glass-panel p-6 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">Reportar Resultado</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4 mb-6">
          <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50">
            <span className="text-slate-400">Jugador 1</span>
            <span className="font-semibold text-white">{player1Name}</span>
          </div>
          <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50">
            <span className="text-slate-400">Jugador 2</span>
            <span className="font-semibold text-white">{player2Name}</span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-6">
          <button
            onClick={() => setSelectedResult('P1_WIN')}
            className={`p-4 rounded-lg border transition-all ${
              selectedResult === 'P1_WIN'
                ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
                : 'border-slate-700 hover:border-slate-600 text-slate-400'
            }`}
          >
            <Trophy className="w-6 h-6 mx-auto mb-2" />
            <span className="text-sm font-medium">Gana P1</span>
          </button>
          <button
            onClick={() => setSelectedResult('DRAW')}
            className={`p-4 rounded-lg border transition-all ${
              selectedResult === 'DRAW'
                ? 'bg-amber-500/20 border-amber-500 text-amber-400'
                : 'border-slate-700 hover:border-slate-600 text-slate-400'
            }`}
          >
            <Handshake className="w-6 h-6 mx-auto mb-2" />
            <span className="text-sm font-medium">Empate</span>
          </button>
          <button
            onClick={() => setSelectedResult('P2_WIN')}
            className={`p-4 rounded-lg border transition-all ${
              selectedResult === 'P2_WIN'
                ? 'bg-rose-500/20 border-rose-500 text-rose-400'
                : 'border-slate-700 hover:border-slate-600 text-slate-400'
            }`}
          >
            <Trophy className="w-6 h-6 mx-auto mb-2 rotate-180" />
            <span className="text-sm font-medium">Gana P2</span>
          </button>
        </div>

        <div className="flex gap-4 mb-6">
          <div className="flex-1">
            <label className="block text-sm text-slate-400 mb-2">
              Victorias P1
            </label>
            <input
              type="number"
              min="0"
              max="3"
              value={scores.p1}
              onChange={(e) => setScores({ ...scores, p1: parseInt(e.target.value) || 0 })}
              className="input-field text-center"
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm text-slate-400 mb-2">
              Victorias P2
            </label>
            <input
              type="number"
              min="0"
              max="3"
              value={scores.p2}
              onChange={(e) => setScores({ ...scores, p2: parseInt(e.target.value) || 0 })}
              className="input-field text-center"
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm text-slate-400 mb-2">Empates</label>
            <input
              type="number"
              min="0"
              max="3"
              value={scores.draws}
              onChange={(e) => setScores({ ...scores, draws: parseInt(e.target.value) || 0 })}
              className="input-field text-center"
            />
          </div>
        </div>

        <div className="flex gap-3">
          <button onClick={onClose} className="btn-secondary flex-1">
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={!selectedResult}
            className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReportResultModal;