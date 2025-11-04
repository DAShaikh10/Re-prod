use reprod_core::{ArtifactInfo as ProtoArtifact, ToolExecutionResult as ProtoToolExecutionResult};

pub fn to_proto_tool_result(src: reprod_core::tools::ToolExecutionResult) -> ProtoToolExecutionResult {
    ProtoToolExecutionResult {
        tool_id: src.tool_id,
        capability_id: src.capability_id,
        success: src.success,
        stdout: src.stdout,
        stderr: src.stderr,
        artifacts: src
            .artifacts
            .into_iter()
            .map(|a| ProtoArtifact {
                path: a.path,
                artifact_type: a.artifact_type,
                label: a.label,
                record_as: a.record_as,
            })
            .collect(),
        execution_time_ms: src.execution_time_ms,
        error: src.error,
    }
}
