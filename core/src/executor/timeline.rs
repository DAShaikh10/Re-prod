use std::sync::{Arc, Mutex};

use reprod_protocol::ExecutionEvent;

#[async_trait::async_trait]
pub trait TimelineSink: Send + Sync {
    async fn record(&self, event: ExecutionEvent) -> anyhow::Result<()>;
}

/// No-op implementation used until the timeline service is wired.
pub struct NoopTimeline;

#[async_trait::async_trait]
impl TimelineSink for NoopTimeline {
    async fn record(&self, _event: ExecutionEvent) -> anyhow::Result<()> {
        Ok(())
    }
}

/// In-memory timeline recorder for tests.
#[derive(Clone, Default)]
pub struct InMemoryTimeline {
    events: Arc<Mutex<Vec<ExecutionEvent>>>,
}

impl InMemoryTimeline {
    pub fn new() -> Self {
        Self::default()
    }

    pub fn events(&self) -> Vec<ExecutionEvent> {
        self.events.lock().expect("timeline lock poisoned").clone()
    }
}

#[async_trait::async_trait]
impl TimelineSink for InMemoryTimeline {
    async fn record(&self, event: ExecutionEvent) -> anyhow::Result<()> {
        let mut guard = self.events.lock().expect("timeline lock poisoned");
        guard.push(event);
        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use reprod_protocol::{
        CodeBlockKind, CodeBlockMetadata, EnvironmentSnapshot, ExecutionActor, ExecutionContext,
        ExecutionEvent, ExecutionResult, ExecutionSource, PlotInfo,
    };

    #[tokio::test]
    async fn stores_events_in_memory() {
        let timeline = InMemoryTimeline::new();

        let event = ExecutionEvent {
            event_id: "evt-test".into(),
            context: ExecutionContext {
                source: ExecutionSource::Cell,
                document_path: Some("analysis.R".into()),
                cell_index: Some(1),
                triggered_at_ms: 1,
                actor: ExecutionActor::User,
            },
            blocks: vec![CodeBlockMetadata {
                id: "block-1".into(),
                index: 0,
                kind: CodeBlockKind::Section,
                label: Some("Section".into()),
                start_line: 1,
                end_line: 3,
                code: "# Section ----\nprint('test')".into(),
            }],
            result: ExecutionResult {
                success: true,
                output: "ok".into(),
                error: None,
                plots: vec![PlotInfo {
                    filename: "plot.png".into(),
                    base64_data: "ZGF0YQ==".into(),
                    index: 1,
                }],
                execution_time_ms: 10,
            },
            environment: EnvironmentSnapshot {
                r_path: "Rscript".into(),
                working_dir: "/tmp".into(),
                temp_dir: "/tmp/reprod".into(),
            },
            created_at_ms: 2,
        };

        timeline
            .record(event.clone())
            .await
            .expect("record timeline");

        let events = timeline.events();
        assert_eq!(events.len(), 1);
        assert_eq!(events[0], event);
    }
}
