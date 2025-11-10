import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { ExportDialog } from '../ExportDialog';
import { socketService } from '@/services/socket';

describe('ExportDialog', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('sends the nested request payload and closes when export succeeds', async () => {
    const sendMock = vi.fn((request, handler) => {
      handler({
        type: 'export_rmarkdown_response',
        response: {
          success: true,
          outputPath: 'analysis_report.Rmd',
        },
      });
      return true;
    });

    vi.spyOn(socketService, 'send').mockImplementation(sendMock);
    const onClose = vi.fn();

    render(<ExportDialog open onClose={onClose} />);

    fireEvent.click(screen.getByRole('button', { name: 'Export' }));

    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));

    expect(sendMock).toHaveBeenCalledTimes(1);
    const [sentRequest] = sendMock.mock.calls[0];
    expect(sentRequest.type).toBe('export_rmarkdown');
    expect(sentRequest.request).toMatchObject({
      mode: 'timeline',
      outputPath: 'analysis_report.Rmd',
      includeTimestamps: true,
      showActor: true,
      embedPlots: true,
      includeOutputs: true,
      includeErrors: false,
      includeSummary: true,
    });
    expect(sentRequest.request.documentPath).toBeUndefined();
  });

  it('shows an error message when the backend reports a failure and keeps the dialog open', async () => {
    const sendMock = vi.fn((request, handler) => {
      handler({
        type: 'export_rmarkdown_response',
        response: {
          success: false,
          outputPath: '',
          error: 'Export failed',
        },
      });
      return true;
    });

    vi.spyOn(socketService, 'send').mockImplementation(sendMock);
    const onClose = vi.fn();

    render(<ExportDialog open onClose={onClose} />);

    fireEvent.click(screen.getByRole('radio', { name: /Document-Based/i }));
    const documentPathInput = screen.getByLabelText('Document Path');
    fireEvent.change(documentPathInput, { target: { value: '/tmp/report.R' } });

    fireEvent.click(screen.getByRole('button', { name: 'Export' }));

    await waitFor(() => {
      expect(screen.getByText('Error: Export failed')).toBeInTheDocument();
    });

    expect(onClose).not.toHaveBeenCalled();
    const [sentRequest] = sendMock.mock.calls[0];
    expect(sentRequest.request.documentPath).toBe('/tmp/report.R');
  });
});
