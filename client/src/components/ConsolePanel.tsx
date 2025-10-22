import { useState, useEffect, useRef } from 'react';
import { IconTrash, IconBarChart, IconCheckCircle, IconXCircle } from './icons';
import { useStore } from '../store/useStore';
import './ConsolePanel.css';

export function ConsolePanel(): JSX.Element {
  const { execution, clearResults } = useStore();
  const [activeTab, setActiveTab] = useState<'console' | 'history'>('console');
  const consoleEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (activeTab === 'console') {
      consoleEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [execution.results, activeTab]);

  return (
    <div className="panel console-panel">
      <div className="panel-header">
        <div className="tabs">
          <div
            className={`tab ${activeTab === 'console' ? 'active' : ''}`}
            onClick={() => setActiveTab('console')}
          >
            Console
          </div>
          <div
            className={`tab ${activeTab === 'history' ? 'active' : ''}`}
            onClick={() => setActiveTab('history')}
          >
            History
          </div>
        </div>
        <div className="panel-actions">
          <button
            className="btn btn-icon"
            title="Clear Console"
            onClick={clearResults}
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
                      <div className="console-plots-info">
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
