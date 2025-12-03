import { useEffect } from "react";
import { useStore } from "@/core";
import { socketService } from "@/services/socket";

export function usePlotHistoryEvents(): void {
	const applySnapshot = useStore((state) => state.applyPlotHistorySnapshot);
	const appendPlotHistory = useStore((state) => state.appendPlotHistory);
	const resetPlotHistory = useStore((state) => state.resetPlotHistory);
	const setActivePlotId = useStore((state) => state.setActivePlotId);

	useEffect(() => {
		const offState = socketService.on("plot_history_state", (message) => {
			if (message.type === "plot_history_state") {
				applySnapshot({
					activePlotId: message.activePlotId ?? null,
					plots: message.plots,
				});
			}
		});

		const offUpdate = socketService.on("plot_history_updated", (message) => {
			if (message.type === "plot_history_updated") {
				appendPlotHistory(message.plots, message.activePlotId ?? null);
			}
		});

		const offDeleted = socketService.on("plot_history_deleted", (message) => {
			if (message.type === "plot_history_deleted") {
				if (message.error) {
					console.warn("Plot delete failed:", message.error);
					return;
				}
				if (message.state) {
					applySnapshot({
						activePlotId: message.activePlotId ?? null,
						plots: message.state,
					});
				} else {
					resetPlotHistory();
					setActivePlotId(null);
				}
			}
		});

		const offCleared = socketService.on("plot_history_cleared", (message) => {
			if (message.type === "plot_history_cleared") {
				if (message.state) {
					applySnapshot({
						activePlotId: message.activePlotId ?? null,
						plots: message.state,
					});
				} else {
					resetPlotHistory();
				}
			}
		});

		return () => {
			offState();
			offUpdate();
			offDeleted();
			offCleared();
		};
	}, [appendPlotHistory, applySnapshot, resetPlotHistory, setActivePlotId]);
}
