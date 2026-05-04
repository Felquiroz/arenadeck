import { ShoppingCart, Package, Ticket, Sparkles } from 'lucide-react';

const items = [
  { id: '1', name: 'Booster Pack MTG', price: '$4.990', stock: 32 },
  { id: '2', name: 'Deck Box Premium', price: '$12.990', stock: 14 },
  { id: '3', name: 'Mica Protectora x100', price: '$6.490', stock: 58 },
  { id: '4', name: 'Entrada Torneo Semanal', price: '$8.000', stock: 20 },
];

export default function Store() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Tienda</h1>
          <p className="text-slate-400 mt-1">Productos y entradas para tus torneos</p>
        </div>
        <div className="glass-panel px-4 py-2 flex items-center gap-2">
          <ShoppingCart className="w-5 h-5 text-cyan-400" />
          <span className="text-white font-medium">ArenaDeck Shop</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {items.map((item) => (
          <div key={item.id} className="glass-panel p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center">
                <Package className="w-5 h-5 text-arcane-400" />
              </div>
              <span className="text-xs text-slate-400">Stock: {item.stock}</span>
            </div>
            <h3 className="text-white font-semibold">{item.name}</h3>
            <p className="text-cyan-300 text-lg font-bold mt-1">{item.price}</p>
            <button type="button" className="btn-primary w-full mt-4">
              Agregar
            </button>
          </div>
        ))}
      </div>

      <div className="glass-panel p-6">
        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <Ticket className="w-5 h-5 text-arcane-400" />
          Beneficios del Club
        </h2>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700/50">
            <Sparkles className="w-5 h-5 text-emerald-400 mb-2" />
            <p className="text-white font-medium">Ranking Prioritario</p>
            <p className="text-slate-400 text-sm mt-1">Participa en eventos exclusivos.</p>
          </div>
          <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700/50">
            <Sparkles className="w-5 h-5 text-amber-400 mb-2" />
            <p className="text-white font-medium">Descuentos</p>
            <p className="text-slate-400 text-sm mt-1">Hasta 15% en productos seleccionados.</p>
          </div>
          <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700/50">
            <Sparkles className="w-5 h-5 text-cyan-400 mb-2" />
            <p className="text-white font-medium">Acceso Temprano</p>
            <p className="text-slate-400 text-sm mt-1">Reserva cupos antes de apertura general.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
