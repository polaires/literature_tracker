// Configure PDF.js worker for react-pdf-highlighter
// This uses CDN to avoid Vite worker bundling complexity
import { GlobalWorkerOptions, version } from 'pdfjs-dist';

GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${version}/pdf.worker.min.js`;

export { version };
