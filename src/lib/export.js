import * as XLSX from 'xlsx'
const download = (blob, name) => {
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; a.click(); URL.revokeObjectURL(a.href)
}
export function exportCSV(rows, name) {
  const ws = XLSX.utils.json_to_sheet(rows.length ? rows : [{}])
  download(new Blob([XLSX.utils.sheet_to_csv(ws)], { type: 'text/csv;charset=utf-8' }), `${name}.csv`)
}
export function exportExcel(sheets, name) {
  const wb = XLSX.utils.book_new()
  Object.entries(sheets).forEach(([title, rows]) => XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows.length ? rows : [{}]), title.slice(0, 31)))
  XLSX.writeFile(wb, `${name}.xlsx`)
}
