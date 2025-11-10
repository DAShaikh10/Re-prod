import { IconTrash, IconBarChart, IconCheckCircle, IconXCircle, PanelTabs } from '@/components/shared';
import { useConsolePanelState } from '@/hooks/useConsolePanelState';

export function ConsolePanel(): JSX.Element {
  const {
    execution,
    tabs,
    activeTab,
    setActiveTab,
    consoleEndRef,
    clearExecutionResults,
  } = useConsolePanelState();

  return (
    <div className="panel panel--transparent console-panel">
      <div className="panel-header panel-header--plain">
        <PanelTabs
          items={tabs}
          activeId={activeTab}
          onSelect={setActiveTab}
          className="panel-tabs--flush"
        />
        <div className="panel-actions panel-actions--compact">
          <button
            className="btn btn-icon"
            title="Clear Console"
            onClick={clearExecutionResults}
            aria-label="Clear console">
            <IconTrash width={16} height={16} aria-hidden />
          </button>
        </div>
      </div>
      <div className="panel-content console-content">
        {activeTab === 'console' && (
          <div className="console-output">
            {execution.results.length === 0 ? (
              <div className="console-welcome">
                <p>Console ready. Run R code to see output here.</p>
              </div>
            ) : (
              <>
                {execution.results.map((result, index) => (
                  <div key={index} className="console-entry">
                    <div className="console-meta">
                      <span className="console-time">
                        {new Date(result.timestamp).toLocaleTimeString()}
                      </span>
                      <span className="console-duration">
                        ({result.duration}ms)
                      </span>
                      {!result.success && (
                        <span className="console-error-badge">Error</span>
                      )}
                    </div>
                    {result.stdout && (
                      <pre className="console-stdout">{result.stdout}</pre>
                    )}
                    {result.stderr && (
                      <pre className="console-stderr">{result.stderr}</pre>
                    )}
                    {result.plots.length > 0 && (
                      <div
                        className="console-plots-info clickable"
                        onClick={() => {
                          // Calculate the global plot index for this result
                          const previousPlots = execution.results
                            .slice(0, index)
                            .reduce((sum, r) => sum + r.plots.length, 0);

                          // Dispatch custom event to focus on this plot
                          window.dispatchEvent(
                            new CustomEvent('focusPlot', {
                              detail: { plotIndex: previousPlots }
                            })
                          );
                        }}
                        role="button"
                        tabIndex={0}
                        title="Click to view plot"
                      >
                        <IconBarChart width={16} height={16} aria-hidden />
                        Generated {result.plots.length} plot{result.plots.length > 1 ? 's' : ''}
                      </div>
                    )}
                  </div>
                ))}
                <div ref={consoleEndRef} />
              </>
            )}
          </div>
        )}
        {activeTab === 'history' && (
          <div className="console-history">
            {execution.history.length === 0 ? (
              <div className="console-welcome">
                <p>Execution history will appear here.</p>
              </div>
            ) : (
              <div className="history-list">
                {execution.history.map((result, index) => (
                  <div key={index} className="history-item">
                    <div className="history-header">
                      <span className="history-number">#{index + 1}</span>
                      <span className="history-time">
                        {new Date(result.timestamp).toLocaleString()}
                      </span>
                      <span className={`history-status ${result.success ? 'success' : 'error'}`}>
                        {result.success ? (
                          <IconCheckCircle width={14} height={14} aria-hidden />
                        ) : (
                          <IconXCircle width={14} height={14} aria-hidden />
                        )}
                      </span>
                    </div>
                    <div className="history-summary">
                      {result.plots.length > 0 && `${result.plots.length} plot(s) · `}
                      {result.duration}ms
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
