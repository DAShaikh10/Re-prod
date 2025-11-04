# NGS Data Processing Pipeline

This workflow demonstrates processing next-generation sequencing (NGS) data using CLI tools.

## Overview

This workflow covers:
1. Quality assessment of raw reads
2. Sequence alignment with BLAST
3. SAM/BAM file manipulation
4. Coverage analysis
5. Creating a custom BLAST database

## Prerequisites

The following tools must be installed:
- BLAST+ (blastn, blastp, makeblastdb)
- SAMtools
- MAFFT (for multiple alignment)

## Step 1: Create BLAST Database

Create a custom BLAST database from a reference genome:

```json
{
  "tool_id": "blast",
  "capability_id": "blast::makeblastdb",
  "parameters": {
    "input": "reference_genome.fasta",
    "dbtype": "nucl",
    "out": "reference_db"
  }
}
```

## Step 2: BLAST Search

Search for similar sequences in the database:

```json
{
  "tool_id": "blast",
  "capability_id": "blast::blastn",
  "parameters": {
    "query": "query_sequences.fasta",
    "database": "reference_db",
    "evalue": 1e-5,
    "outfmt": 6,
    "output": "blast_results.txt"
  }
}
```

Output format 6 provides tab-delimited results with these columns:
- qseqid: Query sequence ID
- sseqid: Subject sequence ID
- pident: Percentage of identical matches
- length: Alignment length
- mismatch: Number of mismatches
- gapopen: Number of gap openings
- qstart/qend: Query alignment positions
- sstart/send: Subject alignment positions
- evalue: Expect value
- bitscore: Bit score

## Step 3: Sort BAM Files

Sort alignment files by coordinate:

```json
{
  "tool_id": "samtools",
  "capability_id": "samtools::sort",
  "parameters": {
    "input": "alignments.bam",
    "output": "alignments.sorted.bam",
    "threads": 8
  }
}
```

## Step 4: Index BAM Files

Create an index for fast random access:

```json
{
  "tool_id": "samtools",
  "capability_id": "samtools::index",
  "parameters": {
    "input": "alignments.sorted.bam",
    "threads": 4
  }
}
```

## Step 5: Compute Alignment Statistics

Get summary statistics for quality control:

```json
{
  "tool_id": "samtools",
  "capability_id": "samtools::flagstat",
  "parameters": {
    "input": "alignments.sorted.bam",
    "output": "alignment_stats.txt"
  }
}
```

## Step 6: Calculate Coverage Depth

Compute per-base coverage:

```json
{
  "tool_id": "samtools",
  "capability_id": "samtools::depth",
  "parameters": {
    "input": "alignments.sorted.bam",
    "output": "coverage_depth.txt"
  }
}
```

## Step 7: Extract Region of Interest

Extract alignments from a specific region:

```json
{
  "tool_id": "samtools",
  "capability_id": "samtools::view",
  "parameters": {
    "input": "alignments.sorted.bam",
    "output": "region_alignments.bam",
    "region": "chr1:1000-5000"
  }
}
```

## Complete Pipeline Script

Here's a complete NGS processing pipeline:

```bash
#!/bin/bash

# Configuration
REFERENCE="reference_genome.fasta"
QUERY="query_sequences.fasta"
BAM_INPUT="alignments.bam"
DB_NAME="reference_db"
THREADS=8

echo "=== NGS Processing Pipeline ==="

# Step 1: Create BLAST database
echo "Creating BLAST database..."
makeblastdb -in $REFERENCE -dbtype nucl -out $DB_NAME

# Step 2: BLAST search
echo "Running BLAST search..."
blastn -query $QUERY -db $DB_NAME -evalue 1e-5 -outfmt 6 -out blast_results.txt

# Step 3: Sort BAM file
echo "Sorting BAM file..."
samtools sort -@ $THREADS -o alignments.sorted.bam $BAM_INPUT

# Step 4: Index BAM file
echo "Indexing BAM file..."
samtools index -@ $THREADS alignments.sorted.bam

# Step 5: Compute alignment statistics
echo "Computing alignment statistics..."
samtools flagstat alignments.sorted.bam > alignment_stats.txt

# Step 6: Calculate coverage depth
echo "Calculating coverage depth..."
samtools depth alignments.sorted.bam > coverage_depth.txt

# Step 7: Generate summary report
echo "Generating summary report..."
cat << EOF > pipeline_summary.txt
=== NGS Pipeline Summary ===
Date: $(date)

BLAST Results:
- Total hits: $(wc -l < blast_results.txt)
- Top hit: $(head -n 1 blast_results.txt)

Alignment Statistics:
$(cat alignment_stats.txt)

Coverage Statistics:
- Mean depth: $(awk '{sum+=$3; n++} END {print sum/n}' coverage_depth.txt)
- Max depth: $(awk 'BEGIN{max=0} {if($3>max) max=$3} END{print max}' coverage_depth.txt)
EOF

cat pipeline_summary.txt
echo "Pipeline complete!"
```

## Visualization in R

Analyze the results in R:

```r
# Load coverage data
coverage <- read.table("coverage_depth.txt", header = FALSE,
                       col.names = c("chr", "pos", "depth"))

# Plot coverage
library(ggplot2)
ggplot(coverage, aes(x = pos, y = depth)) +
  geom_line(color = "blue") +
  theme_minimal() +
  labs(title = "Coverage Depth",
       x = "Position",
       y = "Depth") +
  facet_wrap(~chr, scales = "free_x")

ggsave("coverage_plot.png", width = 12, height = 6)

# Load BLAST results
blast_results <- read.table("blast_results.txt", header = FALSE,
                           col.names = c("qseqid", "sseqid", "pident",
                                        "length", "mismatch", "gapopen",
                                        "qstart", "qend", "sstart", "send",
                                        "evalue", "bitscore"))

# Plot BLAST hits
ggplot(blast_results, aes(x = pident, y = bitscore)) +
  geom_point(alpha = 0.6, color = "darkblue") +
  theme_minimal() +
  labs(title = "BLAST Results",
       x = "Percent Identity",
       y = "Bit Score")

ggsave("blast_results.png", width = 8, height = 6)

# Summary statistics
cat("\n=== Summary Statistics ===\n")
cat("Mean coverage depth:", mean(coverage$depth), "\n")
cat("Median coverage depth:", median(coverage$depth), "\n")
cat("Coverage > 10x:", sum(coverage$depth >= 10) / nrow(coverage) * 100, "%\n")
cat("\nBLAST Results:\n")
cat("Total hits:", nrow(blast_results), "\n")
cat("Mean identity:", mean(blast_results$pident), "%\n")
cat("Hits > 90% identity:", sum(blast_results$pident >= 90), "\n")
```

## Quality Control Checks

### Check Alignment Quality
```bash
# Extract mapping quality
samtools view alignments.sorted.bam | awk '{print $5}' | sort -n | uniq -c

# Count properly paired reads
samtools view -c -f 2 alignments.sorted.bam

# Count unmapped reads
samtools view -c -f 4 alignments.sorted.bam
```

### Check BLAST Results
```bash
# Count high-quality hits (>90% identity)
awk '$3 > 90' blast_results.txt | wc -l

# Find best hit per query
sort -k1,1 -k12,12rn blast_results.txt | awk '!seen[$1]++'
```

## Notes

- Always sort BAM files before indexing
- Use appropriate thread counts based on available CPU cores
- BLAST e-value threshold depends on your specific use case
- Coverage depth calculations can be memory-intensive for large genomes
- Consider subsampling for very large datasets

## Troubleshooting

### BAM file is corrupted
```bash
samtools quickcheck alignments.bam
```

### BLAST database not found
```bash
# Check database files exist
ls -l reference_db.*
```

### Low coverage regions
```bash
# Find regions with coverage < 10x
awk '$3 < 10' coverage_depth.txt > low_coverage_regions.txt
```
