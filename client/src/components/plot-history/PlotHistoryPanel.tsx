import { useMemo } from "react";
import { IconBarChart } from "@/components/shared";
import { useStore } from "@/core";
import { setActivePlot } from "@/services/plotHistoryService";

const formatTime = (timestamp: number): string =>
	new Date(timestamp).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });

export function PlotHistoryPanel(): JSX.Element {
	const plotHistory = useStore((state) => state.plotHistory);
	const focusPlotById = useStore((state) => state.focusPlotById);

	const activePlot = useMemo(() => {
		const byId = plotHistory.items.find((plot) => plot.id === plotHistory.activePlotId);
		if (byId) return byId;
		return plotHistory.items.length > 0 ? plotHistory.items[plotHistory.items.length - 1] : null;
	}, [plotHistory.activePlotId, plotHistory.items]);

	const handleSelect = (plotId: string) => {
		focusPlotById(plotId);
		void setActivePlot(plotId).catch((error) =>
			console.warn("Failed to persist active plot", error),
		);
	};

	if (!plotHistory.items.length) {
		return (
			<div className="plots-container">
				<div className="empty-state">
					<div className="empty-icon">
						<IconBarChart width={48} height={48} aria-hidden />
					</div>
					<p>No plots yet</p>
					<p className="empty-hint">Run R code to generate visualizations</p>
				</div>
			</div>
		);
	}

	return (
		<div className="plots-container">
			<div className="plots-panel">
				<div className="plot-viewer">
					{activePlot && (
						<div className="plot-frame">
							<div className="plot-meta">
								<div className="plot-meta__primary">
									<span className="plot-meta__label">Plot</span>
									<strong>#{plotHistory.items.findIndex((p) => p.id === activePlot.id) + 1}</strong>
								</div>
								<div className="plot-meta__details">
									<span>{formatTime(activePlot.timestamp)}</span>
									<span>
										{activePlot.width} × {activePlot.height}
									</span>
								</div>
							</div>
							<img src={activePlot.data} alt="Active plot" className="plot-image" loading="lazy" />
						</div>
					)}
				</div>
				<div className="plot-timeline" aria-label="Plot history">
					{plotHistory.items.map((plot, index) => {
						const isActive = plot.id === activePlot?.id;
						return (
							<button
								key={plot.id}
								className={`plot-thumb ${isActive ? "plot-thumb--active" : ""}`}
								onClick={() => handleSelect(plot.id)}
								title={`Plot ${index + 1} (${formatTime(plot.timestamp)})`}
							>
								<img src={plot.data} alt={`Plot ${index + 1}`} loading="lazy" />
								<div className="plot-thumb__meta">
									<span className="plot-thumb__index">#{index + 1}</span>
									<span className="plot-thumb__time">{formatTime(plot.timestamp)}</span>
								</div>
							</button>
						);
					})}
				</div>
			</div>
		</div>
	);
}
