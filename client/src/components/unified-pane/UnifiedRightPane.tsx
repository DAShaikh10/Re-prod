import { useState, useEffect } from 'react';
import {
  IconBarChart,
  IconChevronLeft,
  IconChevronRight,
  PanelTabs,
  type PanelTabItem,
} from '@/components/shared';
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

  const tabs: PanelTabItem<TabType>[] = [];
  if (plotsVisible) {
    tabs.push({ id: 'plots', label: 'Plots' });
  }
  if (timelineVisible) {
    tabs.push({ id: 'timeline', label: 'Timeline' });
  }
  tabs.push({ id: 'help', label: 'Help' });

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
  // Note: We removed 'activeTab' from dependencies to prevent switching back
  // when user manually navigates to Timeline/Help tabs
  useEffect(() => {
    if (!plotsVisible) {
      return;
    }
    // Only switch if we have plots and we're not already on plots tab
    // This will trigger once when length changes (new plot added)
    if (allPlots.length > 0 && activeTab !== 'plots') {
      setActiveTab('plots');
      // Set to the latest plot
      setSelectedPlotIndex(allPlots.length - 1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allPlots.length, plotsVisible]); // Removed activeTab to prevent re-triggering

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
        <PanelTabs items={tabs} activeId={activeTab} onSelect={setActiveTab} />
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
