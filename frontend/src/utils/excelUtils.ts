import * as XLSX from 'xlsx';

/**
 * Exporta un arreglo de datos a un archivo Excel (.xlsx).
 * @param data Lista de objetos a exportar.
 * @param fileName Nombre del archivo generado (sin extensión).
 * @param headersMap Mapeo de claves de objeto a nombres de columna legibles.
 * @param sheetName Nombre de la pestaña dentro del Excel.
 */
export function exportToExcel(
  data: any[],
  fileName: string,
  headersMap: Record<string, string>,
  sheetName: string = 'Reporte'
) {
  if (!data || data.length === 0) {
    alert('No hay datos disponibles para exportar.');
    return;
  }

  const keys = Object.keys(headersMap);
  const formattedData = data.map(item => {
    const row: Record<string, any> = {};
    keys.forEach(key => {
      let val = item[key];
      if (val === undefined || val === null) {
        val = '';
      } else if (typeof val === 'boolean') {
        val = val ? 'Sí' : 'No';
      } else if (typeof val === 'object') {
        val = JSON.stringify(val);
      }
      row[headersMap[key]] = val;
    });
    return row;
  });

  const worksheet = XLSX.utils.json_to_sheet(formattedData);

  // Ajustar ancho automático de columnas
  const colWidths = keys.map(key => {
    const headerName = headersMap[key];
    const maxLen = Math.max(
      headerName.length,
      ...data.map(item => String(item[key] ?? '').length)
    );
    return { wch: Math.min(Math.max(maxLen + 3, 10), 40) };
  });
  worksheet['!cols'] = colWidths;

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

  XLSX.writeFile(workbook, `${fileName}_${new Date().toISOString().slice(0, 10)}.xlsx`);
}

/**
 * Lee un archivo Excel (.xlsx, .xls, .csv) y retorna un arreglo de objetos JSON.
 */
export async function parseExcelFile<T = any>(file: File): Promise<T[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheet = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheet];

        const jsonData: T[] = XLSX.utils.sheet_to_json(worksheet, {
          defval: '',
          raw: false // Convierte valores numéricos/fechas a texto limpio para mayor control
        });

        resolve(jsonData);
      } catch (err) {
        reject(err);
      }
    };

    reader.onerror = (err) => reject(err);
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Genera y descarga una plantilla Excel de ejemplo con encabezados y una fila de muestra.
 */
export function downloadExcelTemplate(
  columns: { label: string; key: string; example: string | number }[],
  fileName: string
) {
  const headerRow: Record<string, string> = {};
  const exampleRow: Record<string, any> = {};

  columns.forEach(col => {
    headerRow[col.key] = col.label;
    exampleRow[col.label] = col.example;
  });

  const worksheet = XLSX.utils.json_to_sheet([exampleRow]);

  const colWidths = columns.map(col => ({
    wch: Math.max(col.label.length, String(col.example).length, 12) + 4
  }));
  worksheet['!cols'] = colWidths;

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Plantilla');

  XLSX.writeFile(workbook, `Plantilla_${fileName}.xlsx`);
}
