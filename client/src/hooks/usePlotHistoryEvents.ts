import { useEffect } from "react";
import { useStore } from "@/core";
import { socketService } from "@/services/socket";

export function usePlotHistoryEvents(): void {
	const applySnapshot = useStore((state) => state.applyPlotHistorySnapshot);
	const appendPlotHistory = useStore((state) => state.appendPlotHistory);

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

		return () => {
			offState();
			offUpdate();
		};
	}, [appendPlotHistory, applySnapshot]);
}
