import { useEffect, useState } from 'react';
import { PanelTabs, type PanelTabItem } from '@/components/shared';
import { socketService } from '@/services/socket';
import type { ExtractServerMessage, ExportRMarkdownRequestPayload } from 'shared';

interface ExportDialogProps {
  open: boolean;
  onClose: () => void;
}

export function ExportDialog({ open, onClose }: ExportDialogProps): JSX.Element | null {
  const [format, setFormat] = useState<'bundle' | 'rmarkdown' | 'both'>('rmarkdown');
  const [mode, setMode] = useState<'timeline' | 'document'>('timeline');
  const [options, setOptions] = useState({
    includeTimestamps: true,
    showActor: true,
    embedPlots: true,
    includeOutputs: true,
    includeErrors: false,
    includeSummary: true,
  });
  const [outputPath, setOutputPath] = useState('analysis_report.Rmd');
  const [documentPath, setDocumentPath] = useState('');
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string>('');

  // Handle Escape key to close dialog
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open && !exporting) {
        onClose();
      }
    };

    if (open) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [open, exporting, onClose]);

  const formatTabs: PanelTabItem<'bundle' | 'rmarkdown' | 'both'>[] = [
    {
      id: 'bundle',
      label: (
        <div className="export-tab-content">
          <span className="export-tab-title">Reproduction Bundle (.tar.gz)</span>
          <span className="export-tab-description">Download timeline bundle, scripts, and README.</span>
        </div>
      ),
    },
    {
      id: 'rmarkdown',
      label: (
        <div className="export-tab-content">
          <span className="export-tab-title">RMarkdown Document (.Rmd)</span>
          <span className="export-tab-description">Publication-ready narrative of your session.</span>
        </div>
      ),
    },
    {
      id: 'both',
      label: (
        <div className="export-tab-content">
          <span className="export-tab-title">Both</span>
          <span className="export-tab-description">Get the bundle plus RMarkdown in one go.</span>
        </div>
      ),
    },
  ] as const;

  const modeTabs: PanelTabItem<'timeline' | 'document'>[] = [
    {
      id: 'timeline',
      label: (
        <div className="export-tab-content">
          <span className="export-tab-title">Timeline-Based</span>
          <span className="export-tab-description">Export everything that actually ran.</span>
        </div>
      ),
    },
    {
      id: 'document',
      label: (
        <div className="export-tab-content">
          <span className="export-tab-title">Document-Based</span>
          <span className="export-tab-description">Export the cleaned document in the editor.</span>
        </div>
      ),
    },
  ] as const;

  const handleExport = async (): Promise<void> => {
    setExporting(true);
    setError('');

    // Set timeout to prevent hanging
    const timeout = setTimeout(() => {
      setError('Export timeout - please check server logs');
      setExporting(false);
    }, 30000); // 30 second timeout

    try {
      if (format === 'rmarkdown' || format === 'both') {
        const trimmedDocumentPath = documentPath.trim();
        if (mode === 'document' && !trimmedDocumentPath) {
          clearTimeout(timeout);
          setError('Document path is required for document-based export');
          setExporting(false);
          return;
        }

        const requestPayload: ExportRMarkdownRequestPayload = {
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

        console.log('[ExportDialog] Sending export_rmarkdown request:', requestPayload);

        const success = socketService.send(
          {
            type: 'export_rmarkdown',
            request: requestPayload,
          },
          (response) => {
            clearTimeout(timeout);
            console.log('[ExportDialog] Received response:', response);

            if (response.type === 'export_rmarkdown_response') {
              const msg = response as ExtractServerMessage<'export_rmarkdown_response'>;
              const payload = msg.response;
              if (payload.success) {
                console.log('✅ RMarkdown exported to:', payload.outputPath);
                setExporting(false);
                onClose();
              } else {
                console.error('❌ Export failed:', payload.error);
                setError(payload.error || 'Export failed');
                setExporting(false);
              }
            } else if (response.type === 'error') {
              console.error('❌ Server error:', response);
              setError((response as any).message || 'Export failed');
              setExporting(false);
            }
          },
          (msg) => msg.type === 'export_rmarkdown_response' || msg.type === 'error'
        );

        if (!success) {
          clearTimeout(timeout);
          setError('WebSocket not connected');
          setExporting(false);
        }
      }
    } catch (err) {
      clearTimeout(timeout);
      console.error('[ExportDialog] Export error:', err);
      setError(err instanceof Error ? err.message : 'Export failed');
      setExporting(false);
    }
  };

  if (!open) return null;

  return (
    <div
      className="export-dialog-overlay"
      onClick={exporting ? undefined : onClose}
      role="presentation"
    >
      <div
        className="export-dialog"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="export-dialog-title"
        aria-describedby="export-dialog-description"
      >
        <div className="export-dialog-header">
          <h2 id="export-dialog-title">Export Analysis</h2>
          <button
            className="btn btn-icon"
            onClick={onClose}
            disabled={exporting}
            aria-label="Close dialog"
          >
            ×
          </button>
        </div>

        <div className={`export-dialog-content ${exporting ? 'loading' : ''}`}>
          {/* Format Selection */}
          <div className="export-section">
            <label className="export-label" id="format-label">
              Format
            </label>
            <PanelTabs
              items={formatTabs}
              activeId={format}
              onSelect={(id) => setFormat(id as typeof format)}
              className="panel-tabs--flush panel-tabs--equal-width panel-tabs--compact export-panel-tabs"
            />
          </div>

          {(format === 'rmarkdown' || format === 'both') && (
            <>
              {/* Export Mode */}
              <div className="export-section">
                <label className="export-label" id="mode-label">
                  Export Mode
                </label>
                <PanelTabs
                  items={modeTabs}
                  activeId={mode}
                  onSelect={(id) => setMode(id as typeof mode)}
                  className="panel-tabs--flush panel-tabs--equal-width panel-tabs--compact export-panel-tabs"
                />
              </div>

              {/* Document Path (for Document mode) */}
              {mode === 'document' && (
                <div className="export-section">
                  <label className="export-label" htmlFor="documentPath">
                    Document Path
                  </label>
                  <input
                    type="text"
                    id="documentPath"
                    className="export-input"
                    value={documentPath}
                    onChange={(e) => setDocumentPath(e.target.value)}
                    placeholder="analysis.R"
                    disabled={exporting}
                    aria-required="true"
                    aria-describedby="documentPath-hint"
                  />
                  <p id="documentPath-hint" className="export-hint">
                    Path to the R file to export
                  </p>
                </div>
              )}

              {/* Options */}
              <div className="export-section">
                <label className="export-label" id="options-label">
                  Options
                </label>
                <div
                  className="export-checkbox-group"
                  role="group"
                  aria-labelledby="options-label"
                >
                  <label className="export-checkbox">
                    <input
                      type="checkbox"
                      checked={options.includeTimestamps}
                      onChange={(e) =>
                        setOptions({ ...options, includeTimestamps: e.target.checked })
                      }
                      disabled={exporting}
                      aria-label="Include timestamps in export"
                    />
                    <span>Include timestamps</span>
                  </label>
                  <label className="export-checkbox">
                    <input
                      type="checkbox"
                      checked={options.showActor}
                      onChange={(e) => setOptions({ ...options, showActor: e.target.checked })}
                      disabled={exporting}
                      aria-label="Show actor for each chunk"
                    />
                    <span>Show actor (User/AI) for each chunk</span>
                  </label>
                  <label className="export-checkbox">
                    <input
                      type="checkbox"
                      checked={options.embedPlots}
                      onChange={(e) => setOptions({ ...options, embedPlots: e.target.checked })}
                      disabled={exporting}
                      aria-label="Embed plot images inline"
                    />
                    <span>Embed plot images inline</span>
                  </label>
                  <label className="export-checkbox">
                    <input
                      type="checkbox"
                      checked={options.includeOutputs}
                      onChange={(e) =>
                        setOptions({ ...options, includeOutputs: e.target.checked })
                      }
                      disabled={exporting}
                      aria-label="Include execution outputs"
                    />
                    <span>Include execution outputs</span>
                  </label>
                  <label className="export-checkbox">
                    <input
                      type="checkbox"
                      checked={options.includeErrors}
                      onChange={(e) =>
                        setOptions({ ...options, includeErrors: e.target.checked })
                      }
                      disabled={exporting}
                      aria-label="Include error messages"
                    />
                    <span>Include error messages</span>
                  </label>
                  <label className="export-checkbox">
                    <input
                      type="checkbox"
                      checked={options.includeSummary}
                      onChange={(e) =>
                        setOptions({ ...options, includeSummary: e.target.checked })
                      }
                      disabled={exporting}
                      aria-label="Add session statistics summary"
                    />
                    <span>Add session statistics summary</span>
                  </label>
                </div>
              </div>

              {/* Output Path */}
              <div className="export-section">
                <label className="export-label" htmlFor="outputPath">
                  Output Path
                </label>
                <input
                  type="text"
                  id="outputPath"
                  className="export-input"
                  value={outputPath}
                  onChange={(e) => setOutputPath(e.target.value)}
                  disabled={exporting}
                  aria-required="true"
                  aria-describedby="outputPath-hint"
                />
                <p id="outputPath-hint" className="export-hint">
                  File path where the RMarkdown will be saved
                </p>
              </div>
            </>
          )}

          {/* Error Message */}
          {error && (
            <div className="export-error" role="alert" aria-live="polite">
              <span>{error}</span>
            </div>
          )}
        </div>

        <div className="export-dialog-footer">
          <button className="btn" onClick={onClose} disabled={exporting}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={handleExport} disabled={exporting}>
            {exporting ? 'Exporting...' : 'Export'}
          </button>
        </div>
      </div>
    </div>
  );
}
