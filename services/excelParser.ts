
import * as XLSX from 'xlsx';

export const parseExcelToString = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e: ProgressEvent<FileReader>) => {
      try {
        if (!e.target?.result) {
            reject(new Error("File could not be read."));
            return;
        }
        const data = new Uint8Array(e.target.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        
        let fullText = '';
        workbook.SheetNames.forEach(sheetName => {
            const worksheet = workbook.Sheets[sheetName];
            const json = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
            
            if(json.length > 0) {
                fullText += `Sheet: ${sheetName}\n`;
                json.forEach((row: any) => {
                    fullText += (row as any[]).join(', ') + '\n';
                });
                fullText += '\n';
            }
        });

        resolve(fullText.trim());
      } catch (error) {
        console.error("Error parsing Excel file:", error);
        reject(new Error("Could not parse the Excel file. Please ensure it is a valid .xlsx or .csv file."));
      }
    };
    reader.onerror = (error) => reject(error);
    reader.readAsArrayBuffer(file);
  });
};
