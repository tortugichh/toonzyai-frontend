declare module 'html2pdf.js' {
  interface Html2PdfOptions {
    margin?: number | number[];
    filename?: string;
    image?: { type?: string; quality?: number };
    html2canvas?: { scale?: number; useCORS?: boolean };
    jsPDF?: { unit?: string; format?: string; orientation?: string };
  }

  interface Html2Pdf {
    from(element: HTMLElement): Html2Pdf;
    set(options: Html2PdfOptions): Html2Pdf;
    save(): Promise<void>;
    output(type: string): Promise<any>;
    outputPdf(): Promise<any>;
  }

  declare function html2pdf(): Html2Pdf;
  declare function html2pdf(element: HTMLElement, options?: Html2PdfOptions): Html2Pdf;

  export = html2pdf;
} 