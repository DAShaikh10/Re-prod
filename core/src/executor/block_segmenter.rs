use crate::{CodeBlockKind, CodeBlockMetadata};
use uuid::Uuid;

/// Represents a document to segment into code blocks.
pub struct SegmentationInput<'a> {
    pub content: &'a str,
    pub filename: Option<&'a str>,
}

/// Segment R code into blocks using RStudio section markers or Rmd chunks.
/// Returns a vector of metadata describing each block.
pub fn segment_r_code(input: SegmentationInput<'_>) -> Vec<CodeBlockMetadata> {
    let SegmentationInput { content, filename } = input;
    let is_rmd = filename
        .map(|name| name.to_ascii_lowercase().ends_with(".rmd"))
        .unwrap_or(false);

    if is_rmd {
        segment_rmd_code(content)
    } else {
        segment_r_script(content)
    }
}

fn segment_r_script(content: &str) -> Vec<CodeBlockMetadata> {
    let lines: Vec<&str> = content.split('\n').collect();
    let mut blocks = Vec::new();

    // Pattern: at least one #, optional text, at least four dashes
    let mut section_starts: Vec<(usize, String)> = Vec::new();
    for (idx, line) in lines.iter().enumerate() {
        if let Some(label) = parse_section_label(line, section_starts.len()) {
            section_starts.push((idx, label));
        }
    }

    if section_starts.is_empty() {
        if !content.trim().is_empty() {
            blocks.push(build_block(
                CodeBlockKind::Document,
                "document",
                1,
                lines.len() as u32,
                content,
                0,
            ));
        }
        return blocks;
    }

    for (i, (start_idx, label)) in section_starts.iter().enumerate() {
        let end_line = if i + 1 < section_starts.len() {
            section_starts[i + 1].0
        } else {
            lines.len()
        };

        let block_lines = &lines[*start_idx..end_line];
        let code = block_lines.join("\n");
        if code.trim().is_empty() {
            continue;
        }

        blocks.push(build_block(
            CodeBlockKind::Section,
            label,
            (*start_idx + 1) as u32,
            end_line as u32,
            &code,
            i as u32,
        ));
    }

    blocks
}

fn segment_rmd_code(content: &str) -> Vec<CodeBlockMetadata> {
    let mut blocks = Vec::new();
    let mut chunk_start: Option<usize> = None;
    let mut chunk_label: Option<String> = None;
    let lines: Vec<&str> = content.split('\n').collect();

    for (idx, line) in lines.iter().enumerate() {
        if chunk_start.is_none() {
            if let Some(label) = parse_rmd_chunk_start(line) {
                chunk_start = Some(idx);
                chunk_label = if label.is_empty() {
                    Some(format!("Chunk {}", blocks.len() + 1))
                } else {
                    Some(label)
                };
            }
        } else if is_rmd_chunk_end(line) {
            let start = chunk_start.unwrap();
            let code_lines = &lines[(start + 1)..idx];
            let code = code_lines.join("\n");
            blocks.push(build_block(
                CodeBlockKind::Chunk,
                chunk_label.as_deref().unwrap_or("chunk"),
                (start + 1) as u32,
                idx as u32,
                &code,
                blocks.len() as u32,
            ));
            chunk_start = None;
            chunk_label = None;
        }
    }

    if blocks.is_empty() && !content.trim().is_empty() {
        blocks.push(build_block(
            CodeBlockKind::Document,
            "document",
            1,
            lines.len() as u32,
            content,
            0,
        ));
    }

    blocks
}

fn build_block(
    kind: CodeBlockKind,
    label: &str,
    start_line: u32,
    end_line: u32,
    code: &str,
    index: u32,
) -> CodeBlockMetadata {
    CodeBlockMetadata {
        id: Uuid::new_v4().to_string(),
        index,
        kind,
        label: Some(label.to_string()),
        start_line,
        end_line,
        code: code.to_string(),
    }
}

fn parse_section_label(line: &str, existing_sections: usize) -> Option<String> {
    let trimmed = line.trim();
    if !trimmed.starts_with('#') {
        return None;
    }

    let mut hash_count = 0usize;
    for ch in trimmed.chars() {
        if ch == '#' {
            hash_count += 1;
        } else {
            break;
        }
    }

    if hash_count == 0 {
        return None;
    }

    let remainder = trimmed[hash_count..].trim_start();
    let dash_index = remainder.find("----");
    if dash_index.is_none() {
        return None;
    }

    let label_part = &remainder[..dash_index.unwrap()];
    let label = label_part.trim();
    if label.is_empty() {
        Some(format!("Section {}", existing_sections + 1))
    } else {
        Some(label.to_string())
    }
}

fn parse_rmd_chunk_start(line: &str) -> Option<String> {
    let trimmed = line.trim();
    if !trimmed.starts_with("```{r") {
        return None;
    }

    let mut tail = trimmed[4..].trim_start(); // remove ```
    if !tail.starts_with('{') {
        return None;
    }
    tail = tail[1..].trim_start(); // remove {
    if tail.is_empty() {
        return Some(String::new());
    }

    if tail.starts_with('}') {
        return Some(String::new());
    }

    let mut end_idx = tail.len();
    for (idx, ch) in tail.char_indices() {
        if ch == ',' || ch == '}' {
            end_idx = idx;
            break;
        }
    }

    let candidate = tail[..end_idx].trim();
    Some(candidate.to_string())
}

fn is_rmd_chunk_end(line: &str) -> bool {
    line.trim() == "```"
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn segments_rstudio_sections() {
        let content = "# Data Load ----\nprint('a')\n# Plot ----\nplot(1:10)";

        let blocks = segment_r_code(SegmentationInput {
            content,
            filename: Some("analysis.R"),
        });

        assert_eq!(blocks.len(), 2);

        assert_eq!(blocks[0].kind, CodeBlockKind::Section);
        assert_eq!(blocks[0].label.as_deref(), Some("Data Load"));
        assert_eq!(blocks[0].start_line, 1);
        assert_eq!(blocks[0].end_line, 2);
        assert!(blocks[0].code.contains("print('a')"));

        assert_eq!(blocks[1].label.as_deref(), Some("Plot"));
        assert_eq!(blocks[1].start_line, 3);
        assert!(blocks[1].code.contains("plot(1:10)"));
    }

    #[test]
    fn falls_back_to_document_block_for_plain_script() {
        let content = "x <- 1:10\nmean(x)";

        let blocks = segment_r_code(SegmentationInput {
            content,
            filename: Some("script.R"),
        });

        assert_eq!(blocks.len(), 1);
        assert_eq!(blocks[0].kind, CodeBlockKind::Document);
        assert_eq!(blocks[0].start_line, 1);
        assert_eq!(blocks[0].end_line, 2);
    }

    #[test]
    fn detects_rmd_chunks() {
        let content = "```{r setup}\nprint('setup')\n```\n```{r plot}\nplot(1:10)\n```";

        let blocks = segment_r_code(SegmentationInput {
            content,
            filename: Some("analysis.Rmd"),
        });

        assert_eq!(blocks.len(), 2);
        assert_eq!(blocks[0].kind, CodeBlockKind::Chunk);
        assert_eq!(blocks[0].label.as_deref(), Some("setup"));
        assert!(blocks[0].code.contains("print('setup')"));
        assert_eq!(blocks[1].label.as_deref(), Some("plot"));
    }
}
