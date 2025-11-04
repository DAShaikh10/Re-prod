mod block_segmenter;
mod r_executor;
mod timeline;

pub use block_segmenter::{segment_r_code, SegmentationInput};
pub use r_executor::{CommandOutput, CommandRunner, RExecutor, RExecutorBuilder};
pub use timeline::{InMemoryTimeline, NoopTimeline, TimelineSink};
