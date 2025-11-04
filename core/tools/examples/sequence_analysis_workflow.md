# Sequence Analysis Workflow

This workflow demonstrates basic sequence analysis tasks using the R tool starter pack.

## Overview

This workflow covers:
1. Reading sequences from FASTA files
2. Computing sequence statistics (GC content, composition)
3. Translating DNA to protein
4. Pairwise sequence alignment
5. Creating sequence visualizations

## Step 1: Read Sequences

### Using seqinr

```json
{
  "tool_id": "seqinr",
  "capability_id": "seqinr::read_fasta",
  "parameters": {
    "file": "sequences.fasta",
    "seqtype": "DNA"
  }
}
```

### Using Biostrings

```json
{
  "tool_id": "biostrings",
  "capability_id": "biostrings::read_fasta",
  "parameters": {
    "filepath": "sequences.fasta"
  }
}
```

## Step 2: Compute Sequence Statistics

### GC Content

Calculate GC content for quality control:

```json
{
  "tool_id": "seqinr",
  "capability_id": "seqinr::gc_content",
  "parameters": {
    "sequence": "my_sequence[[1]]"
  }
}
```

### Codon Usage

Analyze codon usage patterns:

```json
{
  "tool_id": "seqinr",
  "capability_id": "seqinr::count_codons",
  "parameters": {
    "sequence": "my_sequence[[1]]",
    "wordsize": 3
  }
}
```

## Step 3: Translate DNA to Protein

Use Biostrings to translate DNA sequences:

```json
{
  "tool_id": "biostrings",
  "capability_id": "biostrings::translate",
  "parameters": {
    "dna_sequences": "dna_stringset"
  }
}
```

## Step 4: Pairwise Alignment

Compare two sequences:

```json
{
  "tool_id": "biostrings",
  "capability_id": "biostrings::pairwise_alignment",
  "parameters": {
    "pattern": "seq1",
    "subject": "seq2",
    "type": "global"
  }
}
```

## Step 5: Sequence Comparison

Create a dotplot to visualize sequence similarity:

```json
{
  "tool_id": "seqinr",
  "capability_id": "seqinr::dotplot",
  "parameters": {
    "seq1": "my_sequences[[1]]",
    "seq2": "my_sequences[[2]]",
    "wsize": 5
  }
}
```

## Complete R Script

Here's a complete sequence analysis workflow:

```r
# Load libraries
library(Biostrings)
library(seqinr)

# Read sequences
dna_sequences <- Biostrings::readDNAStringSet("sequences.fasta")
seqinr_data <- seqinr::read.fasta("sequences.fasta", seqtype = "DNA")

# Calculate GC content for each sequence
gc_values <- sapply(seqinr_data, seqinr::GC)
print("GC Content:")
print(gc_values)

# Analyze codon usage (first sequence)
codon_counts <- seqinr::count(seqinr_data[[1]], wordsize = 3)
print("Codon Usage:")
print(sort(codon_counts, decreasing = TRUE)[1:10])

# Translate to protein
protein_sequences <- Biostrings::translate(dna_sequences)
print("Protein Sequences:")
print(protein_sequences)

# Write translated sequences
Biostrings::writeXStringSet(protein_sequences, "proteins.fasta")

# Pairwise alignment (if multiple sequences)
if (length(dna_sequences) >= 2) {
  alignment <- Biostrings::pairwiseAlignment(
    dna_sequences[[1]],
    dna_sequences[[2]],
    type = "global"
  )
  print("Alignment Score:")
  print(score(alignment))
  print(alignment)
}

# Create dotplot comparison
if (length(seqinr_data) >= 2) {
  png("sequence_dotplot.png", width = 800, height = 800)
  seqinr::dotPlot(seqinr_data[[1]], seqinr_data[[2]], wsize = 5)
  dev.off()
}

# Summary statistics
cat("\n=== Summary ===\n")
cat("Number of sequences:", length(dna_sequences), "\n")
cat("Sequence lengths:", width(dna_sequences), "\n")
cat("Mean GC content:", mean(gc_values), "\n")
cat("GC content range:", range(gc_values), "\n")
```

## Notes

- GC content is useful for quality control and detecting contamination
- Codon usage analysis can reveal expression bias
- Translation uses the standard genetic code by default
- Pairwise alignment is best for closely related sequences
- For multiple sequence alignment, use MAFFT instead

## Common Use Cases

### Quality Control
Check GC content and sequence lengths to detect issues:
```r
gc_content <- sapply(sequences, seqinr::GC)
outliers <- which(gc_content < 0.3 | gc_content > 0.7)
```

### Gene Finding
Translate in all six reading frames to find ORFs:
```r
# Forward strand
prot_f1 <- translate(dna_seq)
prot_f2 <- translate(subseq(dna_seq, start = 2))
prot_f3 <- translate(subseq(dna_seq, start = 3))

# Reverse complement
rc <- reverseComplement(dna_seq)
prot_r1 <- translate(rc)
prot_r2 <- translate(subseq(rc, start = 2))
prot_r3 <- translate(subseq(rc, start = 3))
```

### Sequence Comparison
Compare conserved regions across species:
```r
alignment <- pairwiseAlignment(human_seq, mouse_seq, type = "local")
conserved_regions <- alignment[score(alignment) > threshold]
```
