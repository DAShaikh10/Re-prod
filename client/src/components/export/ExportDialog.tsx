import { useState } from 'react';
import { socketService } from '@/services/socket';
import type { ExtractServerMessage } from 'shared';

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
        console.log('[ExportDialog] Sending export_rmarkdown request:', {
          mode,
          output_path: outputPath,
          document_path: mode === 'document' ? documentPath : undefined,
        });

        const success = socketService.send(
          {
            type: 'export_rmarkdown',
            mode,
            output_path: outputPath,
            document_path: mode === 'document' ? documentPath : undefined,
            include_timestamps: options.includeTimestamps,
            show_actor: options.showActor,
            embed_plots: options.embedPlots,
            include_outputs: options.includeOutputs,
            include_errors: options.includeErrors,
            include_summary: options.includeSummary,
          },
          (response) => {
            clearTimeout(timeout);
            console.log('[ExportDialog] Received response:', response);

            if (response.type === 'export_rmarkdown_response') {
              const msg = response as ExtractServerMessage<'export_rmarkdown_response'>;
              if (msg.success) {
                console.log('✅ RMarkdown exported to:', msg.output_path);
                setExporting(false);
                onClose();
              } else {
                console.error('❌ Export failed:', msg.error);
                setError(msg.error || 'Export failed');
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
    <div className="export-dialog-overlay" onClick={onClose}>
      <div className="export-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="export-dialog-header">
          <h2>Export Analysis</h2>
          <button className="btn btn-icon" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>

        <div className="export-dialog-content">
          {/* Format Selection */}
          <div className="export-section">
            <label className="export-label">Format</label>
            <div className="export-radio-group">
              <label className="export-radio">
                <input
                  type="radio"
                  name="format"
                  value="bundle"
                  checked={format === 'bundle'}
                  onChange={(e) => setFormat(e.target.value as typeof format)}
                />
                <span>Reproduction Bundle (.tar.gz)</span>
              </label>
              <label className="export-radio">
                <input
                  type="radio"
                  name="format"
                  value="rmarkdown"
                  checked={format === 'rmarkdown'}
                  onChange={(e) => setFormat(e.target.value as typeof format)}
                />
                <span>RMarkdown Document (.Rmd)</span>
              </label>
              <label className="export-radio">
                <input
                  type="radio"
                  name="format"
                  value="both"
                  checked={format === 'both'}
                  onChange={(e) => setFormat(e.target.value as typeof format)}
                />
                <span>Both</span>
              </label>
            </div>
          </div>

          {(format === 'rmarkdown' || format === 'both') && (
            <>
              {/* Export Mode */}
              <div className="export-section">
                <label className="export-label">Export Mode</label>
                <div className="export-radio-group">
                  <label className="export-radio">
                    <input
                      type="radio"
                      name="mode"
                      value="timeline"
                      checked={mode === 'timeline'}
                      onChange={(e) => setMode(e.target.value as typeof mode)}
                    />
                    <div className="export-radio-content">
                      <span className="export-radio-title">Timeline-Based (Actual Execution)</span>
                      <span className="export-radio-description">
                        Export what actually ran in console, including AI suggestions and exploration
                        attempts
                      </span>
                    </div>
                  </label>
                  <label className="export-radio">
                    <input
                      type="radio"
                      name="mode"
                      value="document"
                      checked={mode === 'document'}
                      onChange={(e) => setMode(e.target.value as typeof mode)}
                    />
                    <div className="export-radio-content">
                      <span className="export-radio-title">Document-Based (Current File)</span>
                      <span className="export-radio-description">
                        Export the currently open .R file with cleaned, curated code
                      </span>
                    </div>
                  </label>
                </div>
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
                  />
                </div>
              )}

              {/* Options */}
              <div className="export-section">
                <label className="export-label">Options</label>
                <div className="export-checkbox-group">
                  <label className="export-checkbox">
                    <input
                      type="checkbox"
                      checked={options.includeTimestamps}
                      onChange={(e) =>
                        setOptions({ ...options, includeTimestamps: e.target.checked })
                      }
                    />
                    <span>Include timestamps</span>
                  </label>
                  <label className="export-checkbox">
                    <input
                      type="checkbox"
                      checked={options.showActor}
                      onChange={(e) => setOptions({ ...options, showActor: e.target.checked })}
                    />
                    <span>Show actor (User/AI) for each chunk</span>
                  </label>
                  <label className="export-checkbox">
                    <input
                      type="checkbox"
                      checked={options.embedPlots}
                      onChange={(e) => setOptions({ ...options, embedPlots: e.target.checked })}
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
                />
                <p className="export-hint">File path where the RMarkdown will be saved</p>
              </div>
            </>
          )}

          {/* Error Message */}
          {error && (
            <div className="export-error">
              <span>Error: {error}</span>
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
