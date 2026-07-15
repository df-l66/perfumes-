import React, { useState } from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { Plus, Trash2 } from 'lucide-react';
import { useAppData } from '../../context/AppDataContext';
import { useAuth } from '../../context/AuthContext';
import type { VentaItem } from '../../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (item: VentaItem) => void;
}

function SearchableSelect({ 
  valueId, 
  onChange, 
  options 
}: { 
  valueId: string, 
  onChange: (id: string) => void, 
  options: { id: string, label: string, extra?: string }[] 
}) {
  const [query, setQuery] = React.useState('');
  const [isOpen, setIsOpen] = React.useState(false);
  const wrapperRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const opt = options.find(o => o.id === valueId);
    if (opt) setQuery(opt.label);
    else setQuery('');
  }, [valueId, options]);

  React.useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        const opt = options.find(o => o.id === valueId);
        setQuery(opt ? opt.label : '');
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [valueId, options]);

  const filtered = options.filter(o => o.label.toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="relative flex-1" ref={wrapperRef}>
      <input
        className="w-full p-2 text-sm border border-zinc-200 rounded-lg bg-white focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
        placeholder="Buscar insumo..."
        value={query}
        onFocus={() => setIsOpen(true)}
        onChange={e => {
          setQuery(e.target.value);
          setIsOpen(true);
          onChange(''); // Clear selected ID if they start typing a new one
        }}
      />
      {isOpen && filtered.length > 0 && (
        <ul className="absolute z-50 w-full mt-1 max-h-48 overflow-y-auto bg-white border border-zinc-200 rounded-lg shadow-xl">
          {filtered.map(o => (
            <li 
              key={o.id}
              className="px-3 py-2 text-sm hover:bg-amber-50 cursor-pointer border-b border-zinc-50 last:border-0"
              onClick={() => {
                onChange(o.id);
                setQuery(o.label);
                setIsOpen(false);
              }}
            >
              <div className="font-medium text-zinc-800">{o.label}</div>
              {o.extra && <div className="text-xs text-zinc-400">{o.extra}</div>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function PrepararTripleAaaModal({ isOpen, onClose, onAdd }: Props) {
  const { materiasPrimas, configuracion, updateConfiguracion } = useAppData();
  const { user } = useAuth();
  
  const [nombrePerfume, setNombrePerfume] = useState('');
  const [precio, setPrecio] = useState(0);
  const [error, setError] = useState<string | null>(null);
  
  const [ingredientes, setIngredientes] = useState<{ id: string, materia_prima_id: string, cantidad: number }[]>([
    { id: Date.now().toString(), materia_prima_id: '', cantidad: 0 }
  ]);

  React.useEffect(() => {
    if (isOpen) {
      setNombrePerfume('');
      setPrecio(0);
      setError(null);
      if (configuracion?.formula_triple_aaa && configuracion.formula_triple_aaa.length > 0) {
        setIngredientes(configuracion.formula_triple_aaa.map(ing => ({ ...ing, id: Math.random().toString(36).substr(2, 9) })));
      } else {
        setIngredientes([{ id: Date.now().toString(), materia_prima_id: '', cantidad: 0 }]);
      }
    }
  }, [isOpen, configuracion]);

  const handleSaveDefault = async () => {
    if (!user) return;
    const recetaValida = ingredientes.filter(ing => ing.materia_prima_id && ing.cantidad > 0);
    if (recetaValida.length === 0) {
      setError("No hay insumos válidos para guardar en la fórmula.");
      return;
    }
    
    try {
      await updateConfiguracion({ ...configuracion, formula_triple_aaa: recetaValida }, user.name, user.role);
      alert('¡Fórmula Memorizada en la Nube!\n\nSe ha sincronizado para todos tus dispositivos.');
    } catch (e) {
      alert('Hubo un error al guardar la fórmula en la base de datos.');
    }
  };

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
    // Reset handle manually only for inputs, ingredients reset is handled by useEffect
    onClose();
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
            <label className="block text-sm font-medium text-zinc-700 mb-1">Nombre Referencia</label>
            <input required type="text" className="w-full p-2.5 border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-400 transition-colors bg-white" placeholder="Ej: Perfume Invictus 100ml" value={nombrePerfume} onChange={e => setNombrePerfume(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">Precio de Venta</label>
            <input required type="text" className="w-full p-2.5 border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-400 transition-colors bg-white" value={formatNumberWithDots(precio)} onChange={e => {
              const cleaned = e.target.value.replace(/\D/g, '');
              setPrecio(cleaned === '' ? 0 : Number(cleaned));
            }} />
          </div>
        </div>

        <div className="pt-4 border-t border-zinc-100">
          <div className="flex justify-between items-center mb-2">
            <h4 className="font-semibold text-zinc-700 text-sm">Receta (Materias Primas Gastadas)</h4>
            <Button type="button" size="sm" variant="secondary" onClick={handleAddIngredient}>
              <Plus className="w-4 h-4 mr-1" /> Añadir
            </Button>
          </div>
          
          <div className="space-y-2 max-h-[30vh] overflow-y-auto pr-2">
            {ingredientes.map((ing, idx) => (
              <div key={ing.id} className="flex gap-2 items-center bg-zinc-50 p-2 rounded-lg border border-zinc-100 shadow-sm">
                <span className="text-xs font-bold text-zinc-400 w-4 text-center">{idx + 1}.</span>
                <SearchableSelect 
                  valueId={ing.materia_prima_id} 
                  onChange={(id) => handleIngredientChange(ing.id, 'materia_prima_id', id)} 
                  options={materiasActivas.map(m => ({ id: m.id, label: m.nombre, extra: `${m.unidad_medida} (Stock: ${m.stock})` }))} 
                />
                <input 
                  required 
                  type="number" 
                  step="0.01"
                  min="0.01" 
                  placeholder="Cant."
                  className="w-24 p-2 text-sm border border-zinc-200 rounded-lg bg-white focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400" 
                  value={ing.cantidad || ''} 
                  onChange={e => handleIngredientChange(ing.id, 'cantidad', Number(e.target.value))} 
                />
                <button 
                  type="button" 
                  className="p-2 text-zinc-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors"
                  onClick={() => handleRemoveIngredient(ing.id)}
                  disabled={ingredientes.length === 1}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
          <div className="flex justify-between items-center mt-3">
            <Button type="button" variant="secondary" size="sm" onClick={handleAddIngredient} className="flex items-center gap-1">
              <Plus size={16} /> Agregar Insumo
            </Button>
            <button type="button" onClick={handleSaveDefault} className="text-xs text-amber-600 hover:text-amber-700 font-bold px-3 py-1.5 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg transition-colors flex items-center gap-1.5 shadow-sm">
              ⭐ Memorizar Fórmula
            </button>
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
