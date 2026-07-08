export function exportToCSV(data: any[], filename: string, headers: Record<string, string>) {
  if (!data || !data.length) return;

  const headerKeys = Object.keys(headers);
  const headerRow = headerKeys.map(k => headers[k]).join(',');

  const rows = data.map(row => {
    return headerKeys.map(key => {
      let cell = row[key] ?? '';
      
      // Manejar casos especiales como fechas o arrays/objetos si fuera necesario
      if (typeof cell === 'object') {
        cell = JSON.stringify(cell);
      } else {
        cell = String(cell);
      }
      
      // Limpiar texto para CSV (escapar comillas y envolver en comillas si hay comas)
      cell = cell.replace(/"/g, '""');
      if (cell.includes(',') || cell.includes('\n') || cell.includes('"')) {
        cell = `"${cell}"`;
      }
      
      return cell;
    }).join(',');
  });

  const csvContent = [headerRow, ...rows].join('\n');
  
  // Agregar BOM para que Excel detecte UTF-8
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
