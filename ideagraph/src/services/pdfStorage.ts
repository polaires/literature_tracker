import { openDB } from 'idb';
import type { DBSchema, IDBPDatabase } from 'idb';
import JSZip from 'jszip';

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
   * Includes a 30-second timeout to avoid hanging on slow/dead servers
   */
  async storePDFFromUrl(
    paperId: string,
    url: string,
    filename?: string
  ): Promise<{ id: string; filename: string; fileSize: number } | null> {
    const PDF_FETCH_TIMEOUT = 30000; // 30 seconds

    try {
      // Add timeout using AbortController
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), PDF_FETCH_TIMEOUT);

      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);

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
      if (error instanceof Error && error.name === 'AbortError') {
        console.error('PDF fetch timed out:', url);
      } else {
        console.error('Failed to fetch PDF:', error);
      }
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

  /**
   * Reassign PDF from one paper ID to another
   * Used when pre-downloading PDF before paper creation
   */
  async reassignPDF(fromPaperId: string, toPaperId: string): Promise<boolean> {
    const db = await getDB();
    const records = await db.getAllFromIndex('pdfs', 'by-paper', fromPaperId);

    if (records.length === 0) return false;

    // Update each record with new paperId
    for (const record of records) {
      await db.put('pdfs', {
        ...record,
        paperId: toPaperId,
      });
    }

    return true;
  },

  /**
   * Export all PDFs as a zip file for backup
   * Includes manifest.json with metadata for restore
   */
  async exportAllPDFs(
    onProgress?: (current: number, total: number) => void
  ): Promise<Blob | null> {
    const db = await getDB();
    const allRecords = await db.getAll('pdfs');

    if (allRecords.length === 0) {
      return null;
    }

    const zip = new JSZip();

    // Create manifest with metadata (without the actual PDF data)
    const manifest = allRecords.map((record) => ({
      id: record.id,
      paperId: record.paperId,
      filename: record.filename,
      fileSize: record.fileSize,
      addedAt: record.addedAt,
      lastOpenedAt: record.lastOpenedAt,
    }));

    zip.file('manifest.json', JSON.stringify(manifest, null, 2));

    // Add each PDF to the zip
    for (let i = 0; i < allRecords.length; i++) {
      const record = allRecords[i];
      // Use paperId as folder name and original filename
      const path = `pdfs/${record.paperId}/${record.filename}`;
      zip.file(path, record.data);
      onProgress?.(i + 1, allRecords.length);
    }

    // Generate the zip file
    const blob = await zip.generateAsync({ type: 'blob' });
    return blob;
  },

  /**
   * Import PDFs from a backup zip file
   * Restores PDFs and their metadata from manifest
   */
  async importPDFsFromZip(
    zipFile: File,
    options: {
      onProgress?: (current: number, total: number, filename: string) => void;
      skipExisting?: boolean;
    } = {}
  ): Promise<{
    imported: number;
    skipped: number;
    errors: string[];
  }> {
    const { onProgress, skipExisting = true } = options;
    const result = { imported: 0, skipped: 0, errors: [] as string[] };

    try {
      const zip = await JSZip.loadAsync(zipFile);

      // Read manifest
      const manifestFile = zip.file('manifest.json');
      if (!manifestFile) {
        result.errors.push('Invalid backup: manifest.json not found');
        return result;
      }

      const manifestText = await manifestFile.async('text');
      const manifest = JSON.parse(manifestText) as Array<{
        id: string;
        paperId: string;
        filename: string;
        fileSize: number;
        addedAt: string;
        lastOpenedAt: string;
      }>;

      const db = await getDB();

      for (let i = 0; i < manifest.length; i++) {
        const entry = manifest[i];
        onProgress?.(i + 1, manifest.length, entry.filename);

        try {
          // Check if already exists
          if (skipExisting) {
            const existing = await db.get('pdfs', entry.id);
            if (existing) {
              result.skipped++;
              continue;
            }
          }

          // Find the PDF file in the zip
          const pdfPath = `pdfs/${entry.paperId}/${entry.filename}`;
          const pdfFile = zip.file(pdfPath);

          if (!pdfFile) {
            result.errors.push(`PDF not found in backup: ${entry.filename}`);
            continue;
          }

          const data = await pdfFile.async('arraybuffer');

          // Store in database
          await db.put('pdfs', {
            id: entry.id,
            paperId: entry.paperId,
            filename: entry.filename,
            fileSize: entry.fileSize,
            data,
            addedAt: entry.addedAt,
            lastOpenedAt: entry.lastOpenedAt,
          });

          result.imported++;
        } catch (error) {
          result.errors.push(
            `Failed to import ${entry.filename}: ${error instanceof Error ? error.message : 'Unknown error'}`
          );
        }
      }

      return result;
    } catch (error) {
      result.errors.push(
        `Failed to read zip file: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
      return result;
    }
  },

  /**
   * Get list of all stored PDFs with metadata (for display)
   */
  async getAllPDFMetadata(): Promise<
    Array<{
      id: string;
      paperId: string;
      filename: string;
      fileSize: number;
      addedAt: string;
      lastOpenedAt: string;
    }>
  > {
    const db = await getDB();
    const allRecords = await db.getAll('pdfs');

    return allRecords.map((record) => ({
      id: record.id,
      paperId: record.paperId,
      filename: record.filename,
      fileSize: record.fileSize,
      addedAt: record.addedAt,
      lastOpenedAt: record.lastOpenedAt,
    }));
  },
};
