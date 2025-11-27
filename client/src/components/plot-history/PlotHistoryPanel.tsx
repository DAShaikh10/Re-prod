import { useMemo } from "react";
import { IconBarChart, IconTrash } from "@/components/shared";
import { useStore } from "@/core";
import {
	clearPlotHistory,
	deletePlot,
	exportPlot,
	setActivePlot,
} from "@/services/plotHistoryService";

const formatTime = (timestamp: number): string =>
	new Date(timestamp).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });

export function PlotHistoryPanel(): JSX.Element {
	const plotHistory = useStore((state) => state.plotHistory);
	const focusPlotById = useStore((state) => state.focusPlotById);
	const resetPlotHistory = useStore((state) => state.resetPlotHistory);

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

	const handleClear = () => {
		if (!window.confirm("Clear all plots from history? This will delete stored images.")) {
			return;
		}
		resetPlotHistory();
		void clearPlotHistory().catch((error) => {
			console.warn("Failed to clear plot history", error);
		});
	};

	const handleDelete = (plotId: string) => {
		if (!window.confirm("Delete this plot from history?")) {
			return;
		}
		void deletePlot(plotId).catch((error) => {
			console.warn("Failed to delete plot", error);
		});
	};

	const handleExport = (plotId: string, format: "png" | "pdf", filename: string) => {
		const ext = format === "pdf" ? ".pdf" : ".png";
		const target =
			filename.endsWith(".png") && format === "png" ? filename : filename.replace(/\\.png$/i, ext);
		void exportPlot(plotId, target, format).catch((error) => {
			console.warn(`Failed to export plot as ${format}`, error);
		});
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
				<div className="plot-panel-toolbar">
					<button className="btn btn-secondary" onClick={handleClear}>
						<IconTrash width={14} height={14} aria-hidden /> Clear history
					</button>
				</div>
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
							<div className="plot-actions">
								<button
									className="btn btn-secondary"
									onClick={() => handleExport(activePlot.id, "png", activePlot.filename)}
								>
									Export PNG
								</button>
								<button
									className="btn btn-secondary"
									onClick={() =>
										handleExport(
											activePlot.id,
											"pdf",
											activePlot.filename.replace(/\.png$/i, ".pdf"),
										)
									}
								>
									Export PDF
								</button>
								<button
									className="btn btn-danger"
									onClick={() => handleDelete(activePlot.id)}
									title="Delete plot from history"
								>
									<IconTrash width={14} height={14} aria-hidden /> Delete
								</button>
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
