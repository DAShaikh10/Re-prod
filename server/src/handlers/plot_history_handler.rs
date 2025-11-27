use std::path::PathBuf;
use std::sync::Arc;

use crate::projects::ProjectRuntime;

use super::common::{error_response, WSResponse};

pub(super) async fn handle_plot_history_get(runtime: &Arc<ProjectRuntime>) -> Vec<WSResponse> {
    let manager = runtime.plot_history.lock().await;
    match manager.snapshot() {
        Ok(snapshot) => vec![WSResponse::PlotHistoryState {
            active_plot_id: snapshot.active_plot_id,
            plots: snapshot.plots,
        }],
        Err(error) => error_response(format!("Failed to load plot history: {}", error)),
    }
}

pub(super) async fn handle_plot_history_set_active(
    runtime: &Arc<ProjectRuntime>,
    plot_id: String,
) -> Vec<WSResponse> {
    let mut manager = runtime.plot_history.lock().await;
    match manager.set_active_plot(&plot_id) {
        Ok(Some(_)) => match manager.snapshot() {
            Ok(snapshot) => vec![WSResponse::PlotHistoryState {
                active_plot_id: snapshot.active_plot_id,
                plots: snapshot.plots,
            }],
            Err(error) => error_response(format!("Failed to load plot history: {}", error)),
        },
        Ok(None) => error_response(format!("Plot {} not found in history", plot_id)),
        Err(error) => error_response(format!("Failed to update active plot: {}", error)),
    }
}

pub(super) async fn handle_plot_history_export(
    runtime: &Arc<ProjectRuntime>,
    plot_id: String,
    path: String,
) -> Vec<WSResponse> {
    let target = PathBuf::from(&path);
    let manager = runtime.plot_history.lock().await;
    match manager.export_plot(&plot_id, &target) {
        Ok(()) => vec![WSResponse::PlotHistoryExported {
            success: true,
            path,
            error: None,
        }],
        Err(error) => vec![WSResponse::PlotHistoryExported {
            success: false,
            path,
            error: Some(error.to_string()),
        }],
    }
}
