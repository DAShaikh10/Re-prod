import { useState } from 'react';
import { IconBarChart, IconChevronLeft, IconChevronRight } from './icons';
import { useStore } from '../store/useStore';

export function PlotsPanel(): JSX.Element {
  const { execution } = useStore();
  const [activeTab, setActiveTab] = useState<'plots' | 'viewer' | 'help'>('plots');
  const [selectedPlotIndex, setSelectedPlotIndex] = useState(0);

  const allPlots = execution.results.flatMap(result => result.plots);
  const currentPlot = allPlots[selectedPlotIndex];

  const handlePrevious = (): void => {
    if (selectedPlotIndex > 0) {
      setSelectedPlotIndex(selectedPlotIndex - 1);
    }
  };

  const handleNext = (): void => {
    if (selectedPlotIndex < allPlots.length - 1) {
      setSelectedPlotIndex(selectedPlotIndex + 1);
    }
  };

  return (
    <div className="panel plots-panel">
      <div className="panel-header">
        <div className="tabs">
          <div
            className={`tab ${activeTab === 'plots' ? 'active' : ''}`}
            onClick={() => setActiveTab('plots')}
          >
            Plots
          </div>
          <div
            className={`tab ${activeTab === 'viewer' ? 'active' : ''}`}
            onClick={() => setActiveTab('viewer')}
          >
            Viewer
          </div>
          <div
            className={`tab ${activeTab === 'help' ? 'active' : ''}`}
            onClick={() => setActiveTab('help')}
          >
            Help
          </div>
        </div>
        {allPlots.length > 0 && activeTab === 'plots' && (
          <div className="panel-actions">
            <button
              className="btn btn-icon"
              onClick={handlePrevious}
              disabled={selectedPlotIndex === 0}
              title="Previous plot"
              aria-label="Previous plot">
              <IconChevronLeft width={16} height={16} aria-hidden />
            </button>
            <span className="plot-counter">
              {selectedPlotIndex + 1} / {allPlots.length}
            </span>
            <button
              className="btn btn-icon"
              onClick={handleNext}
              disabled={selectedPlotIndex >= allPlots.length - 1}
              title="Next plot"
              aria-label="Next plot">
              <IconChevronRight width={16} height={16} aria-hidden />
            </button>
          </div>
        )}
      </div>
      <div className="panel-content">
        {activeTab === 'plots' && (
          <div className="plots-container">
            {allPlots.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">
                  <IconBarChart width={48} height={48} aria-hidden />
                </div>
                <p>No plots yet</p>
                <p className="empty-hint">Run R code to generate visualizations</p>
              </div>
            ) : (
              <div className="plot-viewer">
                {currentPlot && (
                  <img
                    src={currentPlot.data}
                    alt={`Plot ${selectedPlotIndex + 1}`}
                    className="plot-image"
                  />
                )}
              </div>
            )}
          </div>
        )}
        {activeTab === 'viewer' && (
          <div className="viewer-container">
            <div className="empty-state">
              <p>HTML Viewer</p>
              <p className="empty-hint">View HTML outputs here</p>
            </div>
          </div>
        )}
        {activeTab === 'help' && (
          <div className="help-container">
            <div className="help-content">
              <h3>Re-prod Help</h3>
              <div className="help-section">
                <h4>Getting Started</h4>
                <ul>
                  <li>Write R code in the editor</li>
                  <li>Click "Run" or press Ctrl+Enter to execute</li>
                  <li>View results in the Console panel</li>
                  <li>Plots appear automatically in this panel</li>
                </ul>
              </div>
              <div className="help-section">
                <h4>AI Assistant</h4>
                <ul>
                  <li>Ask questions about R programming</li>
                  <li>Get code suggestions and explanations</li>
                  <li>Apply suggested code to your editor</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
