import type { PlotHistoryStatePayload } from "shared";
import type { ServerMessage } from "shared";
import { socketService } from "./socket";

const historyMatcher = (message: ServerMessage): boolean =>
	message.type === "plot_history_state" || message.type === "error";

export async function requestPlotHistory(): Promise<PlotHistoryStatePayload> {
	return new Promise((resolve, reject) => {
		const didSend = socketService.send(
			{ type: "plot_history_get" },
			(message) => {
				if (message.type === "plot_history_state") {
					resolve({
						activePlotId: message.activePlotId ?? null,
						plots: message.plots,
					});
					return;
				}

				if (message.type === "error") {
					reject(new Error(message.message));
					return;
				}

				reject(new Error(`Unexpected plot history response: ${message.type}`));
			},
			historyMatcher,
		);

		if (!didSend) {
			reject(new Error("Failed to request plot history: WebSocket is not connected"));
		}
	});
}

export async function setActivePlot(plotId: string): Promise<PlotHistoryStatePayload> {
	return new Promise((resolve, reject) => {
		const didSend = socketService.send(
			{ type: "plot_history_set_active", plotId },
			(message) => {
				if (message.type === "plot_history_state") {
					resolve({
						activePlotId: message.activePlotId ?? null,
						plots: message.plots,
					});
					return;
				}

				if (message.type === "error") {
					reject(new Error(message.message));
					return;
				}

				reject(new Error(`Unexpected plot history response: ${message.type}`));
			},
			historyMatcher,
		);

		if (!didSend) {
			reject(new Error("Failed to set active plot: WebSocket is not connected"));
		}
	});
}

export async function exportPlot(plotId: string, path: string): Promise<void> {
	return new Promise((resolve, reject) => {
		const didSend = socketService.send(
			{ type: "plot_history_export", plotId, path },
			(message) => {
				if (message.type === "plot_history_exported") {
					if (message.success) {
						resolve();
					} else {
						reject(new Error(message.error || "Failed to export plot"));
					}
					return;
				}

				if (message.type === "error") {
					reject(new Error(message.message));
					return;
				}

				reject(new Error(`Unexpected plot export response: ${message.type}`));
			},
			(message) => message.type === "plot_history_exported" || message.type === "error",
		);

		if (!didSend) {
			reject(new Error("Failed to export plot: WebSocket is not connected"));
		}
	});
}
