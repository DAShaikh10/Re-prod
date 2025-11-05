use crate::{
    error::ReprodError,
    executor::timeline::{SortOrder, TimelineFilters, TimelineQuery, TimelineResponse, TimelineStats},
    ExecutionActor, ExecutionEvent, ExecutionSource,
};
use serde::{Deserialize, Serialize};

#[derive(Debug, Deserialize)]
pub struct TimelineQueryPayload {
    pub filters: Option<TimelineFiltersPayload>,
    pub sort: Option<String>,
    pub limit: Option<u32>,
    pub offset: Option<u32>,
}

#[derive(Debug, Deserialize)]
pub struct TimelineFiltersPayload {
    pub actor: Option<String>,
    pub source: Option<String>,
    #[serde(rename = "startTime")]
    pub start_time: Option<u64>,
    #[serde(rename = "endTime")]
    pub end_time: Option<u64>,
    #[serde(rename = "hasPlots")]
    pub has_plots: Option<bool>,
    #[serde(rename = "hasErrors")]
    pub has_errors: Option<bool>,
    #[serde(rename = "codeContains")]
    pub code_contains: Option<String>,
}

impl TimelineQueryPayload {
    pub fn into_domain(self) -> Result<TimelineQuery, ReprodError> {
        let filters = match self.filters {
            Some(payload) => Some(payload.try_into()?),
            None => None,
        };

        let sort = match self.sort {
            Some(value) => Some(match value.as_str() {
                "asc" => SortOrder::Asc,
                "desc" => SortOrder::Desc,
                other => {
                    return Err(ReprodError::ProtocolError(format!(
                        "Invalid sort order: {}",
                        other
                    )))
                }
            }),
            None => None,
        };

        Ok(TimelineQuery {
            filters,
            sort,
            limit: self.limit,
            offset: self.offset,
        })
    }
}

impl TryFrom<TimelineFiltersPayload> for TimelineFilters {
    type Error = ReprodError;

    fn try_from(payload: TimelineFiltersPayload) -> Result<Self, Self::Error> {
        let actor = match payload.actor.as_deref() {
            Some("user") => Some(ExecutionActor::User),
            Some("ai") => Some(ExecutionActor::Ai),
            Some(other) => {
                return Err(ReprodError::ProtocolError(format!(
                    "Invalid actor: {}",
                    other
                )))
            }
            None => None,
        };

        let source = match payload.source.as_deref() {
            Some("selection") => Some(ExecutionSource::Selection),
            Some("cell") => Some(ExecutionSource::Cell),
            Some("whole_document") => Some(ExecutionSource::WholeDocument),
            Some("unknown") => Some(ExecutionSource::Unknown),
            Some(other) => {
                return Err(ReprodError::ProtocolError(format!(
                    "Invalid source: {}",
                    other
                )))
            }
            None => None,
        };

        Ok(TimelineFilters {
            actor,
            source,
            start_time: payload.start_time,
            end_time: payload.end_time,
            has_plots: payload.has_plots,
            has_errors: payload.has_errors,
            code_contains: payload.code_contains,
        })
    }
}

#[derive(Debug, Serialize)]
pub struct TimelineResponsePayload {
    pub events: Vec<ExecutionEvent>,
    pub total: u32,
    #[serde(rename = "hasMore")]
    pub has_more: bool,
    pub query: TimelineQueryEcho,
}

#[derive(Debug, Serialize)]
pub struct TimelineQueryEcho {
    pub filters: Option<TimelineFiltersEcho>,
    pub sort: Option<String>,
    pub limit: Option<u32>,
    pub offset: Option<u32>,
}

#[derive(Debug, Serialize)]
pub struct TimelineFiltersEcho {
    pub actor: Option<String>,
    pub source: Option<String>,
    #[serde(rename = "startTime")]
    pub start_time: Option<u64>,
    #[serde(rename = "endTime")]
    pub end_time: Option<u64>,
    #[serde(rename = "hasPlots")]
    pub has_plots: Option<bool>,
    #[serde(rename = "hasErrors")]
    pub has_errors: Option<bool>,
    #[serde(rename = "codeContains")]
    pub code_contains: Option<String>,
}

impl From<TimelineResponse> for TimelineResponsePayload {
    fn from(response: TimelineResponse) -> Self {
        let filters = response.query.filters.map(|f| TimelineFiltersEcho {
            actor: f.actor.map(actor_to_string),
            source: f.source.map(source_to_string),
            start_time: f.start_time,
            end_time: f.end_time,
            has_plots: f.has_plots,
            has_errors: f.has_errors,
            code_contains: f.code_contains,
        });

        let sort = response.query.sort.map(|s| match s {
            SortOrder::Asc => "asc".to_string(),
            SortOrder::Desc => "desc".to_string(),
        });

        TimelineResponsePayload {
            events: response.events,
            total: response.total,
            has_more: response.has_more,
            query: TimelineQueryEcho {
                filters,
                sort,
                limit: response.query.limit,
                offset: response.query.offset,
            },
        }
    }
}

#[derive(Debug, Serialize)]
pub struct TimelineStatsPayload {
    #[serde(rename = "totalEvents")]
    pub total_events: u32,
    #[serde(rename = "totalPlots")]
    pub total_plots: u32,
    #[serde(rename = "totalErrors")]
    pub total_errors: u32,
    #[serde(rename = "userActions")]
    pub user_actions: u32,
    #[serde(rename = "aiActions")]
    pub ai_actions: u32,
    #[serde(rename = "sessionStartTime")]
    pub session_start_time: u64,
    #[serde(rename = "sessionEndTime")]
    pub session_end_time: u64,
    #[serde(rename = "sessionDuration")]
    pub session_duration: u64,
}

impl From<TimelineStats> for TimelineStatsPayload {
    fn from(stats: TimelineStats) -> Self {
        TimelineStatsPayload {
            total_events: stats.total_events,
            total_plots: stats.total_plots,
            total_errors: stats.total_errors,
            user_actions: stats.user_actions,
            ai_actions: stats.ai_actions,
            session_start_time: stats.session_start_time,
            session_end_time: stats.session_end_time,
            session_duration: stats.session_duration,
        }
    }
}

fn actor_to_string(actor: ExecutionActor) -> String {
    match actor {
        ExecutionActor::User => "user".to_string(),
        ExecutionActor::Ai => "ai".to_string(),
    }
}

fn source_to_string(source: ExecutionSource) -> String {
    match source {
        ExecutionSource::Selection => "selection".to_string(),
        ExecutionSource::Cell => "cell".to_string(),
        ExecutionSource::WholeDocument => "whole_document".to_string(),
        ExecutionSource::Unknown => "unknown".to_string(),
    }
}
