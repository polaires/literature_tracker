// Configure PDF.js worker for react-pdf-highlighter
// This uses CDN to avoid Vite worker bundling complexity
import { GlobalWorkerOptions, version } from 'pdfjs-dist';

// Use unpkg CDN which is more reliable for ES modules
// The mjs version is compatible with modern bundlers
GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${version}/build/pdf.worker.min.mjs`;

export { version };
