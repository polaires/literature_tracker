import { openDB } from 'idb';
import type { DBSchema, IDBPDatabase } from 'idb';

interface PDFStorageDB extends DBSchema {
  pdfs: {
    key: string;
    value: {
      id: string;
      paperId: string;
      filename: string;
      fileSize: number;
      data: ArrayBuffer;
      addedAt: string;
      lastOpenedAt: string;
    };
    indexes: { 'by-paper': string };
  };
}

const DB_NAME = 'ideagraph-pdfs';
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<PDFStorageDB>> | null = null;

async function getDB(): Promise<IDBPDatabase<PDFStorageDB>> {
  if (!dbPromise) {
    dbPromise = openDB<PDFStorageDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        const store = db.createObjectStore('pdfs', { keyPath: 'id' });
        store.createIndex('by-paper', 'paperId');
      },
    });
  }
  return dbPromise;
}

export const pdfStorage = {
  /**
   * Store a PDF file for a paper
   */
  async storePDF(
    paperId: string,
    file: File
  ): Promise<{ id: string; filename: string; fileSize: number }> {
    const db = await getDB();
    const id = crypto.randomUUID();
    const data = await file.arrayBuffer();
    const now = new Date().toISOString();

    await db.put('pdfs', {
      id,
      paperId,
      filename: file.name,
      fileSize: file.size,
      data,
      addedAt: now,
      lastOpenedAt: now,
    });

    return { id, filename: file.name, fileSize: file.size };
  },

  /**
   * Store a PDF from URL (fetch and store)
   */
  async storePDFFromUrl(
    paperId: string,
    url: string,
    filename?: string
  ): Promise<{ id: string; filename: string; fileSize: number } | null> {
    try {
      const response = await fetch(url);
      if (!response.ok) return null;

      const data = await response.arrayBuffer();
      const db = await getDB();
      const id = crypto.randomUUID();
      const now = new Date().toISOString();

      const finalFilename = filename || url.split('/').pop() || 'document.pdf';

      await db.put('pdfs', {
        id,
        paperId,
        filename: finalFilename,
        fileSize: data.byteLength,
        data,
        addedAt: now,
        lastOpenedAt: now,
      });

      return { id, filename: finalFilename, fileSize: data.byteLength };
    } catch (error) {
      console.error('Failed to fetch PDF:', error);
      return null;
    }
  },

  /**
   * Get PDF data for viewing
   */
  async getPDF(id: string): Promise<ArrayBuffer | null> {
    const db = await getDB();
    const record = await db.get('pdfs', id);

    if (record) {
      // Update last opened time
      await db.put('pdfs', {
        ...record,
        lastOpenedAt: new Date().toISOString(),
      });
      return record.data;
    }

    return null;
  },

  /**
   * Get PDF by paper ID
   */
  async getPDFByPaperId(paperId: string): Promise<{
    id: string;
    filename: string;
    fileSize: number;
    data: ArrayBuffer;
  } | null> {
    const db = await getDB();
    const records = await db.getAllFromIndex('pdfs', 'by-paper', paperId);

    if (records.length > 0) {
      const record = records[0];
      // Update last opened time
      await db.put('pdfs', {
        ...record,
        lastOpenedAt: new Date().toISOString(),
      });
      return {
        id: record.id,
        filename: record.filename,
        fileSize: record.fileSize,
        data: record.data,
      };
    }

    return null;
  },

  /**
   * Check if paper has a stored PDF
   */
  async hasPDF(paperId: string): Promise<boolean> {
    const db = await getDB();
    const records = await db.getAllFromIndex('pdfs', 'by-paper', paperId);
    return records.length > 0;
  },

  /**
   * Get PDF metadata (without loading full data)
   */
  async getPDFMetadata(
    paperId: string
  ): Promise<{ id: string; filename: string; fileSize: number } | null> {
    const db = await getDB();
    const records = await db.getAllFromIndex('pdfs', 'by-paper', paperId);

    if (records.length > 0) {
      const { id, filename, fileSize } = records[0];
      return { id, filename, fileSize };
    }

    return null;
  },

  /**
   * Delete PDF for a paper
   */
  async deletePDF(id: string): Promise<void> {
    const db = await getDB();
    await db.delete('pdfs', id);
  },

  /**
   * Delete all PDFs for a paper
   */
  async deletePDFsByPaperId(paperId: string): Promise<void> {
    const db = await getDB();
    const records = await db.getAllFromIndex('pdfs', 'by-paper', paperId);

    for (const record of records) {
      await db.delete('pdfs', record.id);
    }
  },

  /**
   * Get total storage used
   */
  async getStorageStats(): Promise<{ totalFiles: number; totalSize: number }> {
    const db = await getDB();
    const allRecords = await db.getAll('pdfs');

    return {
      totalFiles: allRecords.length,
      totalSize: allRecords.reduce((sum, r) => sum + r.fileSize, 0),
    };
  },

  /**
   * Create a blob URL for PDF viewing
   */
  async createPDFUrl(paperId: string): Promise<string | null> {
    const pdf = await this.getPDFByPaperId(paperId);
    if (!pdf) return null;

    const blob = new Blob([pdf.data], { type: 'application/pdf' });
    return URL.createObjectURL(blob);
  },
};
