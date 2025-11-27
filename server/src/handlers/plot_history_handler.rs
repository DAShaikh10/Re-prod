use std::path::PathBuf;
use std::sync::Arc;

use crate::projects::ProjectRuntime;

use super::common::{error_response, WSResponse};
use reprod_core::plot_history::ExportFormat;

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
    format: Option<String>,
) -> Vec<WSResponse> {
    let target = PathBuf::from(&path);
    let manager = runtime.plot_history.lock().await;
    let export_format = match format.as_deref() {
        Some("pdf") => ExportFormat::Pdf,
        _ => ExportFormat::from_path(&target),
    };

    match manager.export_plot_with_format(&plot_id, &target, export_format) {
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

pub(super) async fn handle_plot_history_delete(
    runtime: &Arc<ProjectRuntime>,
    plot_id: String,
) -> Vec<WSResponse> {
    let mut manager = runtime.plot_history.lock().await;
    match manager.delete_plot(&plot_id) {
        Ok(Some(snapshot)) => vec![WSResponse::PlotHistoryDeleted {
            state: Some(snapshot.plots),
            active_plot_id: snapshot.active_plot_id,
            error: None,
        }],
        Ok(None) => vec![WSResponse::PlotHistoryDeleted {
            state: None,
            active_plot_id: manager.active_plot_id(),
            error: Some(format!("Plot {} not found", plot_id)),
        }],
        Err(error) => vec![WSResponse::PlotHistoryDeleted {
            state: None,
            active_plot_id: manager.active_plot_id(),
            error: Some(error.to_string()),
        }],
    }
}

pub(super) async fn handle_plot_history_save(runtime: &Arc<ProjectRuntime>) -> Vec<WSResponse> {
    let manager = runtime.plot_history.lock().await;
    match manager.save_state() {
        Ok(()) => vec![WSResponse::PlotHistorySaved],
        Err(error) => error_response(format!("Failed to save plot history: {}", error)),
    }
}

pub(super) async fn handle_plot_history_restore(runtime: &Arc<ProjectRuntime>) -> Vec<WSResponse> {
    let mut manager = runtime.plot_history.lock().await;
    match manager.restore_state() {
        Ok(()) => match manager.snapshot() {
            Ok(snapshot) => vec![WSResponse::PlotHistoryRestored {
                state: Some(snapshot.plots),
                active_plot_id: snapshot.active_plot_id,
                error: None,
            }],
            Err(error) => error_response(format!("Failed to load plot history: {}", error)),
        },
        Err(error) => vec![WSResponse::PlotHistoryRestored {
            state: None,
            active_plot_id: None,
            error: Some(error.to_string()),
        }],
    }
}
