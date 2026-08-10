import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { Plus, Trash2, Search, X, Check, Sparkles } from 'lucide-react';
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
  options: { id: string, label: string, extra?: string, tipo?: string }[] 
}) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const selectedOpt = useMemo(() => options.find(o => o.id === valueId), [options, valueId]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filtered = useMemo(() => {
    if (!query.trim()) return options;
    const q = query.toLowerCase();
    return options.filter(o => o.label.toLowerCase().includes(q) || (o.tipo && o.tipo.toLowerCase().includes(q)));
  }, [options, query]);

  const handleSelect = (id: string) => {
    onChange(id);
    setIsOpen(false);
    setQuery('');
  };

  const handleClear = () => {
    onChange('');
    setQuery('');
    setIsOpen(true);
  };

  return (
    <div className="relative flex-1 min-w-0" ref={wrapperRef}>
      {selectedOpt && !isOpen ? (
        <div 
          className="flex items-start justify-between gap-2 p-2.5 bg-amber-50/80 hover:bg-amber-100/60 border border-amber-300/80 rounded-xl cursor-pointer transition-all shadow-sm group"
          onClick={() => setIsOpen(true)}
          title={selectedOpt.label}
        >
          <div className="min-w-0 flex-1">
            <p className="text-xs sm:text-sm font-bold text-zinc-900 leading-snug wrap-break-word whitespace-normal">
              {selectedOpt.label}
            </p>
            {selectedOpt.extra && (
              <span className="inline-block text-[11px] font-bold text-amber-800 mt-1 font-mono bg-amber-100 px-1.5 py-0.5 rounded">
                {selectedOpt.extra}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleClear();
            }}
            className="text-amber-700 hover:text-amber-950 p-1 rounded-lg hover:bg-amber-200/60 transition-colors shrink-0"
            title="Cambiar insumo"
          >
            <X size={14} />
          </button>
        </div>
      ) : (
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            className="w-full pl-9 pr-8 py-2.5 text-xs sm:text-sm font-medium border border-zinc-200 rounded-xl bg-white focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-500/20 shadow-sm"
            placeholder="Buscar por nombre completo de esencia..."
            value={query}
            onFocus={() => setIsOpen(true)}
            onChange={e => {
              setQuery(e.target.value);
              setIsOpen(true);
            }}
          />
          {query && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
            >
              <X size={14} />
            </button>
          )}
        </div>
      )}

      {isOpen && (
        <div className="absolute z-50 left-0 right-0 sm:right-auto sm:w-[125%] sm:min-w-70 max-w-full sm:max-w-xl mt-1 max-h-64 overflow-y-auto bg-white border border-zinc-200 rounded-xl shadow-2xl divide-y divide-zinc-100 font-sans">
          {filtered.length === 0 ? (
            <div className="p-3.5 text-center text-xs text-zinc-400">
              No se encontraron esencias con ese nombre
            </div>
          ) : (
            filtered.map(o => {
              const isSelected = o.id === valueId;
              return (
                <div
                  key={o.id}
                  title={o.label}
                  className={`p-3 text-xs sm:text-sm hover:bg-amber-50/90 cursor-pointer transition-colors flex items-start justify-between gap-3 ${
                    isSelected ? 'bg-amber-50 text-amber-900 font-bold' : 'text-zinc-800'
                  }`}
                  onClick={() => handleSelect(o.id)}
                >
                  <div className="space-y-1 min-w-0 flex-1">
                    <p className="font-bold text-zinc-900 leading-snug wrap-break-word whitespace-normal text-xs sm:text-sm">
                      {o.label}
                    </p>
                    {o.extra && (
                      <span className="inline-block px-1.5 py-0.5 bg-zinc-100 text-zinc-700 font-mono text-[10px] font-bold rounded">
                        {o.extra}
                      </span>
                    )}
                  </div>
                  {isSelected && <Check size={16} className="text-amber-600 shrink-0 mt-0.5" />}
                </div>
              );
            })
          )}
        </div>
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

  useEffect(() => {
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

  const materiasActivas = useMemo(() => materiasPrimas.filter(m => m.estado !== 'inactivo'), [materiasPrimas]);

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
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Preparar Perfume Triple AAA" size="xl">
      <form onSubmit={handleAdd} className="space-y-5">
        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm font-medium border border-red-100">
            {error}
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1.5">Nombre Referencia</label>
            <input required type="text" className="w-full p-2.5 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-400 transition-colors bg-white shadow-sm" placeholder="Ej: Perfume Invictus 100ml" value={nombrePerfume} onChange={e => setNombrePerfume(e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1.5">Precio de Venta</label>
            <input required type="text" className="w-full p-2.5 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-400 transition-colors bg-white shadow-sm font-mono font-bold text-amber-700" value={formatNumberWithDots(precio)} onChange={e => {
              const cleaned = e.target.value.replace(/\D/g, '');
              setPrecio(cleaned === '' ? 0 : Number(cleaned));
            }} />
          </div>
        </div>

        <div className="pt-4 border-t border-zinc-100">
          <div className="flex justify-between items-center mb-3">
            <h4 className="font-bold text-zinc-800 text-sm flex items-center gap-1.5">
              <Sparkles size={16} className="text-amber-500" /> Receta de Insumos y Esencias
            </h4>
            <Button type="button" size="sm" variant="secondary" onClick={handleAddIngredient}>
              <Plus className="w-4 h-4 mr-1" /> Añadir
            </Button>
          </div>
          
          <div className="space-y-3 max-h-[42vh] overflow-y-auto pr-1">
            {ingredientes.map((ing, idx) => {
              const selectedMp = materiasActivas.find(m => m.id === ing.materia_prima_id);
              const isStockInsufficient = selectedMp && ing.cantidad > selectedMp.stock;

              return (
                <div key={ing.id} className="flex flex-col sm:flex-row gap-2.5 items-start sm:items-center bg-zinc-50/90 p-3 rounded-xl border border-zinc-200/80 shadow-sm transition-all hover:border-amber-200">
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <span className="text-xs font-black text-zinc-400 w-5 text-center shrink-0 font-mono">{idx + 1}.</span>
                  </div>
                  
                  {/* Selector con soporte para nombres largos de esencias */}
                  <SearchableSelect 
                    valueId={ing.materia_prima_id} 
                    onChange={(id) => handleIngredientChange(ing.id, 'materia_prima_id', id)} 
                    options={materiasActivas.map(m => ({ 
                      id: m.id, 
                      label: m.nombre, 
                      extra: `${m.unidad_medida} (Stock: ${m.stock})`,
                      tipo: m.tipo 
                    }))} 
                  />
                  
                  <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 justify-end">
                    <div className="relative">
                      <input 
                        required 
                        type="number" 
                        step="0.01"
                        min="0.01" 
                        placeholder="Cant."
                        className={`w-28 p-2 text-xs sm:text-sm font-mono font-bold border rounded-xl bg-white focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-500/20 ${
                          isStockInsufficient ? 'border-red-400 bg-red-50 text-red-700' : 'border-zinc-200'
                        }`} 
                        value={ing.cantidad || ''} 
                        onChange={e => handleIngredientChange(ing.id, 'cantidad', Number(e.target.value))} 
                      />
                      {selectedMp && (
                        <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[11px] font-bold text-zinc-400 pointer-events-none">
                          {selectedMp.unidad_medida}
                        </span>
                      )}
                    </div>

                    <button 
                      type="button" 
                      className="p-2 text-zinc-400 hover:text-red-500 rounded-xl hover:bg-red-50 transition-colors cursor-pointer shrink-0"
                      onClick={() => handleRemoveIngredient(ing.id)}
                      disabled={ingredientes.length === 1}
                      title="Eliminar ingrediente"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="flex justify-between items-center mt-3 pt-2">
            <Button type="button" variant="secondary" size="sm" onClick={handleAddIngredient} className="flex items-center gap-1">
              <Plus size={16} /> Agregar Insumo
            </Button>
            <button type="button" onClick={handleSaveDefault} className="text-xs text-amber-700 hover:text-amber-900 font-bold px-3 py-1.5 bg-amber-100/70 hover:bg-amber-200/70 border border-amber-300 rounded-xl transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer">
              ⭐ Memorizar Fórmula por Defecto
            </button>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t border-zinc-100">
          <Button type="button" variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button type="submit">Agregar al Carrito</Button>
        </div>
      </form>
    </Modal>
  );
}
