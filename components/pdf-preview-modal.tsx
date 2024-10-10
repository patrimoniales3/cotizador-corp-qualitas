import React from 'react';
import { Button } from "@/components/ui/button"

interface PDFPreviewModalProps {
  pdfUrl: string;
  fileName: string;
  onClose: () => void;
}

const PDFPreviewModal: React.FC<PDFPreviewModalProps> = ({ pdfUrl, fileName, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white rounded-lg w-11/12 h-5/6 flex flex-col">
        <div className="p-4 flex justify-between items-center border-b">
          <h2 className="text-xl font-bold">Previsualización del PDF</h2>
          <div>
            <Button onClick={() => {
              const link = document.createElement('a');
              link.href = pdfUrl;
              link.download = fileName;
              link.click();
            }} className="mr-2">
              Descargar
            </Button>
            <Button onClick={onClose} variant="outline">
              Cerrar
            </Button>
          </div>
        </div>
        <div className="flex-grow p-4">
          <iframe src={pdfUrl} className="w-full h-full" />
        </div>
      </div>
    </div>
  );
};

export default PDFPreviewModal;