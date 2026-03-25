export const useExcelExport = () => {
  const exportToExcel = async (data: any[], fileName: string) => {
    // Dynamically import xlsx on the client to prevent SSR bundling errors
    const XLSX = await import('xlsx');
    
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
    
    // Create a binary string
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    
    // Save to file
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8' });
    
    // Trigger download
    if (import.meta.client) {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `${fileName}.xlsx`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
  };

  return { exportToExcel };
};
