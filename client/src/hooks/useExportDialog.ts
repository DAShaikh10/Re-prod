import { useCallback, useEffect, useState } from 'react';
import { exportRMarkdown, ExportServiceError } from '@/services/exportService';
import type { ExportRMarkdownRequestPayload } from 'shared';

export type ExportDialogOptions = Pick<
  ExportRMarkdownRequestPayload,
  'includeTimestamps' | 'showActor' | 'embedPlots' | 'includeOutputs' | 'includeErrors' | 'includeSummary'
>;

export type ExportOptionKey = keyof ExportDialogOptions;

const defaultOptions: ExportDialogOptions = {
  includeTimestamps: true,
  showActor: true,
  embedPlots: true,
  includeOutputs: true,
  includeErrors: false,
  includeSummary: true,
};

type ExportFormat = 'bundle' | 'rmarkdown' | 'both';

interface UseExportDialogProps {
  open: boolean;
  onClose: () => void;
}

interface UseExportDialogReturn {
  format: ExportFormat;
  setFormat: (next: ExportFormat) => void;
  mode: ExportRMarkdownRequestPayload['mode'];
  setMode: (next: ExportRMarkdownRequestPayload['mode']) => void;
  options: ExportDialogOptions;
  setOption: (key: ExportOptionKey, value: boolean) => void;
  documentPath: string;
  setDocumentPath: (value: string) => void;
  outputPath: string;
  setOutputPath: (value: string) => void;
  exporting: boolean;
  error: string;
  handleExport: () => Promise<void>;
}

export function useExportDialog({ open, onClose }: UseExportDialogProps): UseExportDialogReturn {
  const [format, setFormat] = useState<ExportFormat>('rmarkdown');
  const [mode, setMode] = useState<ExportRMarkdownRequestPayload['mode']>('timeline');
  const [options, setOptions] = useState<ExportDialogOptions>(defaultOptions);
  const [documentPath, setDocumentPath] = useState('');
  const [outputPath, setOutputPath] = useState('analysis_report.Rmd');
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState('');

  const resetError = useCallback(() => {
    setError('');
  }, []);

  useEffect(() => {
    if (!open) {
      resetError();
      setExporting(false);
    }
  }, [open, resetError]);

  useEffect(() => {
    if (!open || exporting || typeof document === 'undefined') {
      return undefined;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !exporting) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, exporting, onClose]);

  const setOption = useCallback((key: ExportOptionKey, value: boolean) => {
    setOptions((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handleExport = useCallback(async (): Promise<void> => {
    setExporting(true);
    setError('');

    if (format === 'bundle') {
      setError('Bundle export is not supported yet.');
      setExporting(false);
      return;
    }

    const trimmedDocumentPath = documentPath.trim();

    if (mode === 'document' && !trimmedDocumentPath) {
      setError('Document path is required for document-based export');
      setExporting(false);
      return;
    }

    const payload: ExportRMarkdownRequestPayload = {
      mode,
      outputPath,
      documentPath: mode === 'document' ? trimmedDocumentPath : undefined,
      includeTimestamps: options.includeTimestamps,
      showActor: options.showActor,
      embedPlots: options.embedPlots,
      includeOutputs: options.includeOutputs,
      includeErrors: options.includeErrors,
      includeSummary: options.includeSummary,
    };

    try {
      await exportRMarkdown(payload);
      onClose();
    } catch (err) {
      if (err instanceof ExportServiceError || err instanceof Error) {
        setError(err.message);
      } else {
        setError('Export failed');
      }
    } finally {
      setExporting(false);
    }
  }, [format, mode, options, documentPath, outputPath, onClose]);

  return {
    format,
    setFormat,
    mode,
    setMode,
    options,
    setOption,
    documentPath,
    setDocumentPath,
    outputPath,
    setOutputPath,
    exporting,
    error,
    handleExport,
  };
}
