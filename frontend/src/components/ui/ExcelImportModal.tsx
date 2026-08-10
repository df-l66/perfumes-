import React, { useState, useRef } from 'react';
import { Upload, FileSpreadsheet, Download, CheckCircle2, AlertTriangle, X, RefreshCw } from 'lucide-react';
import { Modal } from './Modal';
import { Button } from './Button';
import { parseExcelFile, downloadExcelTemplate } from '../../utils/excelUtils';

export interface ColumnDefinition {
  label: string;
  key: string;
  example: string | number;
  required?: boolean;
}

interface ExcelImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  columns: ColumnDefinition[];
  templateFileName: string;
  fieldMapper: (rawRow: Record<string, any>) => { data: any; errors: string[] };
  onImport: (validItems: any[]) => Promise<void> | void;
}

export function ExcelImportModal({
  isOpen,
  onClose,
  title,
  columns,
  templateFileName,
  fieldMapper,
  onImport
}: ExcelImportModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [parsedRows, setParsedRows] = useState<{ raw: any; parsed: any; errors: string[] }[]>([]);
  const [loading, setLoading] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  const resetState = () => {
    setFileName(null);
    setParsedRows([]);
    setLoading(false);
    setIsImporting(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const handleDownloadTemplate = () => {
    downloadExcelTemplate(columns, templateFileName);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setLoading(true);

    try {
      const rawData = await parseExcelFile<Record<string, any>>(file);

      const processed = rawData.map(raw => {
        const { data, errors } = fieldMapper(raw);
        return { raw, parsed: data, errors };
      });

      setParsedRows(processed);
    } catch (err) {
      alert('Error al leer el archivo Excel. Asegúrate de que sea un archivo .xlsx, .xls o .csv válido.');
      resetState();
    } finally {
      setLoading(false);
    }
  };

  const validRows = parsedRows.filter(r => r.errors.length === 0);
  const invalidRows = parsedRows.filter(r => r.errors.length > 0);

  const handleConfirmImport = async () => {
    if (validRows.length === 0) return;
    setIsImporting(true);
    try {
      const validItems = validRows.map(r => r.parsed);
      await onImport(validItems);
      handleClose();
    } catch (err) {
      alert(`Error al importar datos: ${err instanceof Error ? err.message : err}`);
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={title} size="xl">
      <div className="space-y-5">
        {/* Header Action / Template download */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 bg-amber-50/60 rounded-xl border border-amber-200/70 gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500 text-white rounded-lg shadow-sm">
              <FileSpreadsheet size={20} />
            </div>
            <div>
              <h4 className="text-xs font-bold text-amber-900 uppercase tracking-wide">Carga de Datos por Excel</h4>
              <p className="text-xs text-amber-700">Descarga la plantilla con la estructura correcta para evitar errores de validación.</p>
            </div>
          </div>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            icon={<Download size={14} />}
            onClick={handleDownloadTemplate}
            className="w-full sm:w-auto text-amber-900 border-amber-300 hover:bg-amber-100"
          >
            Descargar Plantilla
          </Button>
        </div>

        {/* Upload Box */}
        {!fileName ? (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-zinc-300 hover:border-amber-500 rounded-xl p-8 text-center cursor-pointer transition-colors bg-zinc-50/50 hover:bg-amber-50/30 group"
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".xlsx, .xls, .csv"
              className="hidden"
            />
            <Upload size={36} className="mx-auto text-zinc-400 group-hover:text-amber-600 transition-colors mb-3" />
            <p className="text-sm font-semibold text-zinc-700">Haz clic aquí para seleccionar tu archivo Excel</p>
            <p className="text-xs text-zinc-400 mt-1">Soporta formatos .xlsx, .xls y .csv</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* File info bar */}
            <div className="flex items-center justify-between p-3 bg-zinc-100 rounded-lg border border-zinc-200">
              <div className="flex items-center gap-2 overflow-hidden">
                <FileSpreadsheet size={18} className="text-amber-600 shrink-0" />
                <span className="text-xs font-bold text-zinc-800 truncate">{fileName}</span>
                <span className="text-[11px] px-2 py-0.5 bg-zinc-200 text-zinc-700 rounded-full font-semibold">
                  {parsedRows.length} registros
                </span>
              </div>
              <button
                type="button"
                onClick={resetState}
                className="text-zinc-400 hover:text-zinc-600 text-xs font-medium flex items-center gap-1 cursor-pointer"
              >
                <X size={14} /> Cambiar archivo
              </button>
            </div>

            {/* Validation summary badges */}
            <div className="flex gap-3 text-xs font-semibold">
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg">
                <CheckCircle2 size={14} />
                <span>{validRows.length} Válidos</span>
              </div>
              {invalidRows.length > 0 && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 text-rose-700 border border-rose-200 rounded-lg">
                  <AlertTriangle size={14} />
                  <span>{invalidRows.length} Con Errores</span>
                </div>
              )}
            </div>

            {/* Preview table */}
            <div className="max-h-60 overflow-y-auto rounded-lg border border-zinc-200 bg-white">
              <table className="w-full text-left text-xs">
                <thead className="bg-zinc-100 sticky top-0 border-b border-zinc-200 text-zinc-600 font-bold uppercase text-[10px]">
                  <tr>
                    <th className="px-3 py-2">Estado</th>
                    {columns.slice(0, 5).map(col => (
                      <th key={col.key} className="px-3 py-2">{col.label}</th>
                    ))}
                    <th className="px-3 py-2">Detalle / Errores</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 font-mono">
                  {parsedRows.map((row, idx) => {
                    const hasError = row.errors.length > 0;
                    return (
                      <tr key={idx} className={hasError ? 'bg-rose-50/50 hover:bg-rose-50' : 'hover:bg-zinc-50'}>
                        <td className="px-3 py-2 font-sans whitespace-nowrap">
                          {hasError ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-600 bg-rose-100 px-2 py-0.5 rounded">
                              <AlertTriangle size={12} /> Error
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded">
                              <CheckCircle2 size={12} /> Listo
                            </span>
                          )}
                        </td>
                        {columns.slice(0, 5).map(col => (
                          <td key={col.key} className="px-3 py-2 text-zinc-700 truncate max-w-32">
                            {String(row.parsed[col.key] ?? '')}
                          </td>
                        ))}
                        <td className="px-3 py-2 font-sans text-xs">
                          {hasError ? (
                            <span className="text-rose-600 font-medium">{row.errors.join(', ')}</span>
                          ) : (
                            <span className="text-zinc-400">Sin observaciones</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex justify-end gap-2 pt-4 border-t border-zinc-100">
          <Button type="button" variant="secondary" onClick={handleClose} disabled={isImporting}>
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleConfirmImport}
            disabled={validRows.length === 0 || isImporting || loading}
            icon={isImporting ? <RefreshCw size={14} className="animate-spin" /> : undefined}
          >
            {isImporting ? 'Importando...' : `Importar ${validRows.length} Registros`}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
