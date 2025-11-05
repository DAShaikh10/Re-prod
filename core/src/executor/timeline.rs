use std::sync::{Arc, Mutex};

use crate::protocol::{ExecutionActor, ExecutionEvent, ExecutionSource};
use anyhow::{Context, Result};
use rusqlite::{params, Connection};
use std::path::PathBuf;

#[async_trait::async_trait]
pub trait TimelineSink: Send + Sync {
    async fn record(&self, event: ExecutionEvent) -> anyhow::Result<()>;
}

// ==== SQLite Timeline Implementation ====

/// SQL schema for timeline events table
const CREATE_TABLE_SQL: &str = r#"
CREATE TABLE IF NOT EXISTS timeline_events (
    event_id TEXT PRIMARY KEY,
    actor TEXT NOT NULL,
    source TEXT NOT NULL,
    document_path TEXT,
    created_at_ms INTEGER NOT NULL,
    triggered_at_ms INTEGER NOT NULL,
    success INTEGER NOT NULL,
    has_plots INTEGER NOT NULL,
    has_errors INTEGER NOT NULL,
    code_text TEXT,
    event_json TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_created_at ON timeline_events(created_at_ms);
CREATE INDEX IF NOT EXISTS idx_actor ON timeline_events(actor);
CREATE INDEX IF NOT EXISTS idx_source ON timeline_events(source);
CREATE INDEX IF NOT EXISTS idx_success ON timeline_events(success);
CREATE INDEX IF NOT EXISTS idx_has_plots ON timeline_events(has_plots);
CREATE INDEX IF NOT EXISTS idx_has_errors ON timeline_events(has_errors);
"#;

/// Query parameters matching the TimelineQuery from shared/src/timeline.ts
#[derive(Debug, Clone, Default)]
pub struct TimelineQuery {
    pub filters: Option<TimelineFilters>,
    pub sort: Option<SortOrder>,
    pub limit: Option<u32>,
    pub offset: Option<u32>,
}

#[derive(Debug, Clone, Default)]
pub struct TimelineFilters {
    pub actor: Option<ExecutionActor>,
    pub source: Option<ExecutionSource>,
    pub start_time: Option<u64>,
    pub end_time: Option<u64>,
    pub has_plots: Option<bool>,
    pub has_errors: Option<bool>,
    pub code_contains: Option<String>,
}

#[derive(Debug, Clone, Copy)]
pub enum SortOrder {
    Asc,
    Desc,
}

impl Default for SortOrder {
    fn default() -> Self {
        SortOrder::Desc
    }
}

/// Response with pagination metadata
#[derive(Debug, Clone)]
pub struct TimelineResponse {
    pub events: Vec<ExecutionEvent>,
    pub total: u32,
    pub has_more: bool,
    pub query: TimelineQuery,
}

/// Timeline statistics
#[derive(Debug, Clone)]
pub struct TimelineStats {
    pub total_events: u32,
    pub total_plots: u32,
    pub total_errors: u32,
    pub user_actions: u32,
    pub ai_actions: u32,
    pub session_start_time: u64,
    pub session_end_time: u64,
    pub session_duration: u64,
}

/// SQLite-backed timeline storage with query support
pub struct SqliteTimeline {
    conn: Arc<Mutex<Connection>>,
}

impl SqliteTimeline {
    /// Create a new SQLite timeline with a file-backed database
    pub fn new(db_path: PathBuf) -> Result<Self> {
        let conn = Connection::open(db_path).context("Failed to open SQLite database")?;
        Self::initialize_schema(&conn)?;
        Ok(Self {
            conn: Arc::new(Mutex::new(conn)),
        })
    }

    /// Create an in-memory SQLite timeline for testing
    pub fn new_in_memory() -> Result<Self> {
        let conn = Connection::open_in_memory().context("Failed to create in-memory database")?;
        Self::initialize_schema(&conn)?;
        Ok(Self {
            conn: Arc::new(Mutex::new(conn)),
        })
    }

    /// Initialize the database schema
    fn initialize_schema(conn: &Connection) -> Result<()> {
        conn.execute_batch(CREATE_TABLE_SQL)
            .context("Failed to create timeline_events table")?;
        Ok(())
    }

    /// Extract searchable code text from all blocks
    fn extract_code_text(event: &ExecutionEvent) -> String {
        event
            .blocks
            .iter()
            .map(|block| block.code.as_str())
            .collect::<Vec<_>>()
            .join("\n")
    }

    /// Convert ExecutionActor to string for storage
    fn actor_to_string(actor: &ExecutionActor) -> &'static str {
        match actor {
            ExecutionActor::User => "user",
            ExecutionActor::Ai => "ai",
        }
    }

    /// Convert ExecutionSource to string for storage
    fn source_to_string(source: &ExecutionSource) -> &'static str {
        match source {
            ExecutionSource::Selection => "selection",
            ExecutionSource::Cell => "cell",
            ExecutionSource::WholeDocument => "whole_document",
            ExecutionSource::Unknown => "unknown",
        }
    }

    /// Query timeline events with filters, sorting, and pagination
    pub fn query(&self, query: TimelineQuery) -> Result<TimelineResponse> {
        let conn = self.conn.lock().expect("timeline lock poisoned");

        // Build WHERE clause
        let mut where_clauses = Vec::new();
        let mut params: Vec<Box<dyn rusqlite::ToSql>> = Vec::new();

        if let Some(filters) = &query.filters {
            if let Some(actor) = &filters.actor {
                where_clauses.push("actor = ?");
                params.push(Box::new(Self::actor_to_string(actor).to_string()));
            }
            if let Some(source) = &filters.source {
                where_clauses.push("source = ?");
                params.push(Box::new(Self::source_to_string(source).to_string()));
            }
            if let Some(start_time) = filters.start_time {
                where_clauses.push("created_at_ms >= ?");
                params.push(Box::new(start_time));
            }
            if let Some(end_time) = filters.end_time {
                where_clauses.push("created_at_ms <= ?");
                params.push(Box::new(end_time));
            }
            if let Some(has_plots) = filters.has_plots {
                where_clauses.push("has_plots = ?");
                params.push(Box::new(if has_plots { 1 } else { 0 }));
            }
            if let Some(has_errors) = filters.has_errors {
                where_clauses.push("has_errors = ?");
                params.push(Box::new(if has_errors { 1 } else { 0 }));
            }
            if let Some(code_contains) = &filters.code_contains {
                where_clauses.push("code_text LIKE ?");
                params.push(Box::new(format!("%{}%", code_contains)));
            }
        }

        let where_clause = if where_clauses.is_empty() {
            String::new()
        } else {
            format!("WHERE {}", where_clauses.join(" AND "))
        };

        // Get total count
        let count_sql = format!("SELECT COUNT(*) FROM timeline_events {}", where_clause);
        let total: u32 = {
            let mut stmt = conn.prepare(&count_sql)?;
            let params_refs: Vec<&dyn rusqlite::ToSql> =
                params.iter().map(|b| b.as_ref()).collect();
            stmt.query_row(params_refs.as_slice(), |row| row.get(0))?
        };

        // Build ORDER BY clause
        let sort_order = query.sort.unwrap_or_default();
        let order_clause = match sort_order {
            SortOrder::Asc => "ORDER BY created_at_ms ASC",
            SortOrder::Desc => "ORDER BY created_at_ms DESC",
        };

        // Build LIMIT and OFFSET
        let limit = query.limit.unwrap_or(50).min(200);
        let offset = query.offset.unwrap_or(0);

        // Query events
        let select_sql = format!(
            "SELECT event_json FROM timeline_events {} {} LIMIT ? OFFSET ?",
            where_clause, order_clause
        );

        let mut stmt = conn.prepare(&select_sql)?;
        let mut params_with_pagination = params;
        params_with_pagination.push(Box::new(limit));
        params_with_pagination.push(Box::new(offset));

        let params_refs: Vec<&dyn rusqlite::ToSql> =
            params_with_pagination.iter().map(|b| b.as_ref()).collect();

        let events: Result<Vec<ExecutionEvent>> = stmt
            .query_map(params_refs.as_slice(), |row| {
                let json: String = row.get(0)?;
                Ok(json)
            })?
            .map(|result| {
                let json = result?;
                serde_json::from_str(&json).context("Failed to deserialize event")
            })
            .collect();

        let events = events?;
        let has_more = offset + limit < total;

        Ok(TimelineResponse {
            events,
            total,
            has_more,
            query,
        })
    }

    /// Get timeline statistics
    pub fn stats(&self) -> Result<TimelineStats> {
        let conn = self.conn.lock().expect("timeline lock poisoned");

        let stats_sql = r#"
            SELECT
                COUNT(*) as total_events,
                SUM(has_plots) as total_plots,
                SUM(has_errors) as total_errors,
                SUM(CASE WHEN actor = 'user' THEN 1 ELSE 0 END) as user_actions,
                SUM(CASE WHEN actor = 'ai' THEN 1 ELSE 0 END) as ai_actions,
                MIN(created_at_ms) as session_start_time,
                MAX(created_at_ms) as session_end_time
            FROM timeline_events
        "#;

        let mut stmt = conn.prepare(stats_sql)?;
        let stats = stmt.query_row([], |row| {
            let total_events: u32 = row.get(0)?;
            let total_plots: u32 = row.get(1)?;
            let total_errors: u32 = row.get(2)?;
            let user_actions: u32 = row.get(3)?;
            let ai_actions: u32 = row.get(4)?;
            let session_start_time: Option<u64> = row.get(5)?;
            let session_end_time: Option<u64> = row.get(6)?;

            let (start, end) = match (session_start_time, session_end_time) {
                (Some(s), Some(e)) => (s, e),
                _ => (0, 0),
            };

            Ok(TimelineStats {
                total_events,
                total_plots,
                total_errors,
                user_actions,
                ai_actions,
                session_start_time: start,
                session_end_time: end,
                session_duration: end.saturating_sub(start),
            })
        })?;

        Ok(stats)
    }

    /// Clear all events (available for tests)
    #[cfg(test)]
    pub fn clear(&self) -> Result<usize> {
        let conn = self.conn.lock().expect("timeline lock poisoned");
        let count = conn.execute("DELETE FROM timeline_events", [])?;
        Ok(count)
    }
}

#[async_trait::async_trait]
impl TimelineSink for SqliteTimeline {
    async fn record(&self, event: ExecutionEvent) -> Result<()> {
        let conn = self.conn.lock().expect("timeline lock poisoned");

        let actor = Self::actor_to_string(&event.context.actor);
        let source = Self::source_to_string(&event.context.source);
        let has_plots = if event.result.plots.is_empty() { 0 } else { 1 };
        let has_errors = if event.result.error.is_some() { 1 } else { 0 };
        let code_text = Self::extract_code_text(&event);
        let event_json = serde_json::to_string(&event).context("Failed to serialize event")?;

        conn.execute(
            r#"
            INSERT INTO timeline_events (
                event_id, actor, source, document_path, created_at_ms, triggered_at_ms,
                success, has_plots, has_errors, code_text, event_json
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            "#,
            params![
                event.event_id,
                actor,
                source,
                event.context.document_path,
                event.created_at_ms,
                event.context.triggered_at_ms,
                if event.result.success { 1 } else { 0 },
                has_plots,
                has_errors,
                code_text,
                event_json,
            ],
        )
        .context("Failed to insert event into timeline")?;

        Ok(())
    }
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
    use crate::protocol::{
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

    // SqliteTimeline tests
    fn create_test_event(
        event_id: &str,
        actor: ExecutionActor,
        source: ExecutionSource,
        created_at_ms: u64,
        has_plot: bool,
        has_error: bool,
        code: &str,
    ) -> ExecutionEvent {
        ExecutionEvent {
            event_id: event_id.into(),
            context: ExecutionContext {
                source,
                document_path: Some("test.R".into()),
                cell_index: Some(0),
                triggered_at_ms: created_at_ms,
                actor,
            },
            blocks: vec![CodeBlockMetadata {
                id: "block-1".into(),
                index: 0,
                kind: CodeBlockKind::Section,
                label: Some("Test".into()),
                start_line: 1,
                end_line: 2,
                code: code.into(),
            }],
            result: ExecutionResult {
                success: !has_error,
                output: "test output".into(),
                error: if has_error {
                    Some("test error".into())
                } else {
                    None
                },
                plots: if has_plot {
                    vec![PlotInfo {
                        filename: "plot.png".into(),
                        base64_data: "data".into(),
                        index: 0,
                    }]
                } else {
                    vec![]
                },
                execution_time_ms: 100,
            },
            environment: EnvironmentSnapshot {
                r_path: "Rscript".into(),
                working_dir: "/tmp".into(),
                temp_dir: "/tmp/reprod".into(),
            },
            created_at_ms,
        }
    }

    #[tokio::test]
    async fn test_sqlite_record_and_retrieve() {
        let timeline = SqliteTimeline::new_in_memory().expect("create timeline");

        let event = create_test_event(
            "evt-1",
            ExecutionActor::User,
            ExecutionSource::Cell,
            1000,
            false,
            false,
            "print('hello')",
        );

        timeline.record(event.clone()).await.expect("record event");

        let response = timeline
            .query(TimelineQuery::default())
            .expect("query events");

        assert_eq!(response.events.len(), 1);
        assert_eq!(response.total, 1);
        assert_eq!(response.events[0].event_id, "evt-1");
    }

    #[tokio::test]
    async fn test_sqlite_filter_by_actor() {
        let timeline = SqliteTimeline::new_in_memory().expect("create timeline");

        timeline
            .record(create_test_event(
                "evt-user",
                ExecutionActor::User,
                ExecutionSource::Cell,
                1000,
                false,
                false,
                "user code",
            ))
            .await
            .expect("record user event");

        timeline
            .record(create_test_event(
                "evt-ai",
                ExecutionActor::Ai,
                ExecutionSource::Cell,
                2000,
                false,
                false,
                "ai code",
            ))
            .await
            .expect("record ai event");

        let query = TimelineQuery {
            filters: Some(TimelineFilters {
                actor: Some(ExecutionActor::User),
                ..Default::default()
            }),
            ..Default::default()
        };

        let response = timeline.query(query).expect("query by actor");

        assert_eq!(response.events.len(), 1);
        assert_eq!(response.events[0].event_id, "evt-user");
    }

    #[tokio::test]
    async fn test_sqlite_pagination() {
        let timeline = SqliteTimeline::new_in_memory().expect("create timeline");

        // Insert 10 events
        for i in 0..10 {
            timeline
                .record(create_test_event(
                    &format!("evt-{}", i),
                    ExecutionActor::User,
                    ExecutionSource::Cell,
                    (i + 1) * 1000,
                    false,
                    false,
                    &format!("code {}", i),
                ))
                .await
                .expect("record event");
        }

        // First page
        let query1 = TimelineQuery {
            limit: Some(3),
            offset: Some(0),
            sort: Some(SortOrder::Desc),
            ..Default::default()
        };

        let response1 = timeline.query(query1).expect("query page 1");

        assert_eq!(response1.events.len(), 3);
        assert_eq!(response1.total, 10);
        assert!(response1.has_more);
        assert_eq!(response1.events[0].event_id, "evt-9");
    }

    #[tokio::test]
    async fn test_sqlite_stats() {
        let timeline = SqliteTimeline::new_in_memory().expect("create timeline");

        timeline
            .record(create_test_event(
                "evt-1",
                ExecutionActor::User,
                ExecutionSource::Cell,
                1000,
                true,
                false,
                "code 1",
            ))
            .await
            .expect("record event 1");

        timeline
            .record(create_test_event(
                "evt-2",
                ExecutionActor::Ai,
                ExecutionSource::Cell,
                2000,
                false,
                true,
                "code 2",
            ))
            .await
            .expect("record event 2");

        timeline
            .record(create_test_event(
                "evt-3",
                ExecutionActor::User,
                ExecutionSource::Cell,
                3000,
                true,
                false,
                "code 3",
            ))
            .await
            .expect("record event 3");

        let stats = timeline.stats().expect("get stats");

        assert_eq!(stats.total_events, 3);
        assert_eq!(stats.total_plots, 2);
        assert_eq!(stats.total_errors, 1);
        assert_eq!(stats.user_actions, 2);
        assert_eq!(stats.ai_actions, 1);
        assert_eq!(stats.session_start_time, 1000);
        assert_eq!(stats.session_end_time, 3000);
        assert_eq!(stats.session_duration, 2000);
    }
}
