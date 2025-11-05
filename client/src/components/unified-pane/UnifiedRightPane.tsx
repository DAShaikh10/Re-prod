import { useState, useEffect } from 'react';
import { IconBarChart, IconChevronLeft, IconChevronRight } from '@/components/shared';
import { useStore } from '@/core';
import { TimelinePanel } from '@/components/timeline';

type TabType = 'plots' | 'timeline' | 'help';

export function UnifiedRightPane(): JSX.Element {
  const execution = useStore((state) => state.execution);
  const panes = useStore((state) => state.view.panes);
  const [activeTab, setActiveTab] = useState<TabType>('plots');
  const [selectedPlotIndex, setSelectedPlotIndex] = useState(0);

  const allPlots = execution.results.flatMap(result => result.plots);
  const currentPlot = allPlots[selectedPlotIndex];
  const plotsVisible = panes.plots;
  const timelineVisible = panes.timeline;

  // Listen for plot focus events from ConsolePanel
  useEffect(() => {
    const handleFocusPlot = (event: CustomEvent) => {
      if (!plotsVisible) {
        return;
      }
      const { plotIndex } = event.detail;
      setActiveTab('plots');
      setSelectedPlotIndex(plotIndex);
    };

    window.addEventListener('focusPlot', handleFocusPlot as EventListener);

    return () => {
      window.removeEventListener('focusPlot', handleFocusPlot as EventListener);
    };
  }, [plotsVisible]);

  // Auto-switch to Plots tab when a new plot is created
  useEffect(() => {
    if (!plotsVisible) {
      return;
    }
    if (allPlots.length > 0 && activeTab !== 'plots') {
      setActiveTab('plots');
      // Set to the latest plot
      setSelectedPlotIndex(allPlots.length - 1);
    }
  }, [allPlots.length, plotsVisible, activeTab]);

  // Ensure active tab is valid when panes are hidden
  useEffect(() => {
    if (activeTab === 'plots' && !plotsVisible) {
      setActiveTab(timelineVisible ? 'timeline' : 'help');
    } else if (activeTab === 'timeline' && !timelineVisible) {
      setActiveTab(plotsVisible ? 'plots' : 'help');
    }
  }, [activeTab, plotsVisible, timelineVisible]);

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
    <div className="panel unified-right-pane">
      <div className="panel-header">
        <div className="tabs">
          {plotsVisible && (
            <div
              className={`tab ${activeTab === 'plots' ? 'active' : ''}`}
              onClick={() => setActiveTab('plots')}
            >
              Plots
            </div>
          )}
          {timelineVisible && (
            <div
              className={`tab ${activeTab === 'timeline' ? 'active' : ''}`}
              onClick={() => setActiveTab('timeline')}
            >
              Timeline
            </div>
          )}
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
        {activeTab === 'plots' && plotsVisible && (
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
        {activeTab === 'timeline' && timelineVisible && (
          <TimelinePanel />
        )}
        {activeTab === 'help' && (
          <div className="help-container">
            <div className="help-content">
              <h3>Re-prod Help</h3>
              <div className="help-section">
                <h4>Getting Started</h4>
                <ul>
                  <li>Write R code in the editor</li>
                  <li>Organize code using section markers: <code># Section Name ----</code></li>
                  <li>View results in the Console panel</li>
                  <li>Plots appear automatically in this panel</li>
                </ul>
              </div>
              <div className="help-section">
                <h4>Keyboard Shortcuts</h4>
                <ul>
                  <li><strong>Cmd/Ctrl + Enter:</strong> Run current cell or selection</li>
                  <li><strong>Shift + Enter:</strong> Run cell and move to next</li>
                  <li><strong>Cmd/Ctrl + Shift + Enter:</strong> Run all code</li>
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
