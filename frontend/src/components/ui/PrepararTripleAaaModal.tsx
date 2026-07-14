import React, { useState } from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { Plus, Trash2 } from 'lucide-react';
import { useAppData } from '../../context/AppDataContext';
import type { VentaItem } from '../../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (item: VentaItem) => void;
}

export function PrepararTripleAaaModal({ isOpen, onClose, onAdd }: Props) {
  const { materiasPrimas } = useAppData();
  
  const [nombrePerfume, setNombrePerfume] = useState('');
  const [precio, setPrecio] = useState(0);
  const [error, setError] = useState<string | null>(null);
  
  const [ingredientes, setIngredientes] = useState<{ id: string, materia_prima_id: string, cantidad: number }[]>([
    { id: Date.now().toString(), materia_prima_id: '', cantidad: 0 }
  ]);

  const materiasActivas = materiasPrimas.filter(m => m.estado !== 'inactivo');

  const handleAddIngredient = () => {
    setIngredientes(prev => [...prev, { id: Date.now().toString(), materia_prima_id: '', cantidad: 0 }]);
  };

  const handleRemoveIngredient = (id: string) => {
    setIngredientes(prev => prev.filter(ing => ing.id !== id));
  };

  const handleIngredientChange = (id: string, field: 'materia_prima_id' | 'cantidad', value: string | number) => {
    setIngredientes(prev => prev.map(ing => ing.id === id ? { ...ing, [field]: value } : ing));
  };

  const formatNumberWithDots = (val: number | string) => {
    if (val === undefined || val === null || val === 0) return '';
    const numStr = String(val).replace(/\D/g, '');
    if (!numStr) return '';
    return new Intl.NumberFormat('es-CO', { maximumFractionDigits: 0 }).format(+numStr);
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    
    setError(null);
    const recetaValida = ingredientes.filter(ing => ing.materia_prima_id && ing.cantidad > 0);
    if (recetaValida.length === 0) {
      setError("Debes agregar al menos un ingrediente válido con cantidad mayor a 0.");
      return;
    }

    const newItem: VentaItem = {
      producto_id: `TRIPLE_AAA_${Date.now()}`,
      nombre: nombrePerfume,
      cantidad: 1,
      precio_unitario: precio,
      subtotal: precio,
      es_preparado: true,
      receta: recetaValida.map(ing => ({
        materia_prima_id: ing.materia_prima_id,
        cantidad: Number(ing.cantidad)
      }))
    };
    onAdd(newItem);
    onClose();
    // Reset
    setNombrePerfume('');
    setPrecio(0);
    setIngredientes([{ id: Date.now().toString(), materia_prima_id: '', cantidad: 0 }]);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Preparar Perfume Triple AAA" size="xl">
      <form onSubmit={handleAdd} className="space-y-5">
        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm font-medium border border-red-100">
            {error}
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Nombre Referencia</label>
            <input required type="text" className="w-full p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-400 transition-colors bg-white" placeholder="Ej: Perfume Invictus 100ml" value={nombrePerfume} onChange={e => setNombrePerfume(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Precio de Venta</label>
            <input required type="text" className="w-full p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-400 transition-colors bg-white" value={formatNumberWithDots(precio)} onChange={e => {
              const cleaned = e.target.value.replace(/\D/g, '');
              setPrecio(cleaned === '' ? 0 : Number(cleaned));
            }} />
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100">
          <div className="flex justify-between items-center mb-2">
            <h4 className="font-semibold text-slate-700 text-sm">Receta (Materias Primas Gastadas)</h4>
            <Button type="button" size="sm" variant="secondary" onClick={handleAddIngredient}>
              <Plus className="w-4 h-4 mr-1" /> Añadir
            </Button>
          </div>
          
          <div className="space-y-2 max-h-[30vh] overflow-y-auto pr-2">
            {ingredientes.map((ing, idx) => (
              <div key={ing.id} className="flex gap-2 items-center bg-slate-50 p-2 rounded-lg border border-slate-100 shadow-sm">
                <span className="text-xs font-bold text-slate-400 w-4 text-center">{idx + 1}.</span>
                <input 
                  required 
                  list={`materias-${ing.id}`}
                  placeholder="Buscar insumo..."
                  className="flex-1 p-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-400" 
                  value={materiasActivas.find(m => m.id === ing.materia_prima_id)?.nombre || ing.materia_prima_id} 
                  onChange={e => {
                    const val = e.target.value;
                    const match = materiasActivas.find(m => m.nombre === val);
                    handleIngredientChange(ing.id, 'materia_prima_id', match ? match.id : val);
                  }}
                />
                <datalist id={`materias-${ing.id}`}>
                  {materiasActivas.map(m => (
                    <option key={m.id} value={m.nombre}>
                      {m.unidad_medida} (Stock: {m.stock})
                    </option>
                  ))}
                </datalist>
                <input 
                  required 
                  type="number" 
                  step="0.01"
                  min="0.01" 
                  placeholder="Cant."
                  className="w-24 p-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-400" 
                  value={ing.cantidad || ''} 
                  onChange={e => handleIngredientChange(ing.id, 'cantidad', Number(e.target.value))} 
                />
                <button 
                  type="button" 
                  className="p-2 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors"
                  onClick={() => handleRemoveIngredient(ing.id)}
                  disabled={ingredientes.length === 1}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button type="submit">Agregar al Carrito</Button>
        </div>
      </form>
    </Modal>
  );
}
