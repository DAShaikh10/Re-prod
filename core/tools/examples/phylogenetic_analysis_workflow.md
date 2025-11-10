# Phylogenetic Analysis Workflow

This workflow demonstrates how to perform a complete phylogenetic analysis using the R tool starter pack.

## Overview

This workflow covers:
1. Reading DNA sequences from a FASTA file
2. Multiple sequence alignment with MAFFT
3. Computing a distance matrix
4. Building a phylogenetic tree
5. Visualizing the tree

## Step 1: Read DNA Sequences

Use the `ape` package to read aligned DNA sequences:

```json
{
  "tool_id": "ape",
  "capability_id": "ape::read_alignment",
  "parameters": {
    "path": "sequences.fasta",
    "as.character": "FALSE"
  }
}
```

This returns a `DNAbin` object stored in R.

## Step 2: Perform Multiple Sequence Alignment (if needed)

If your sequences are not aligned, use MAFFT:

```json
{
  "tool_id": "mafft",
  "capability_id": "mafft::align",
  "parameters": {
    "input": "unaligned_sequences.fasta",
    "threads": 4,
    "output": "aligned_sequences.fasta"
  }
}
```

## Step 3: Compute Distance Matrix

Calculate pairwise distances between sequences:

```r
# Using ape
dna_data <- ape::read.dna("aligned_sequences.fasta", format = "fasta")
dist_matrix <- ape::dist.dna(dna_data, model = "K80")
```

## Step 4: Build Phylogenetic Tree

Use the neighbour-joining method:

```json
{
  "tool_id": "ape",
  "capability_id": "ape::nj_tree",
  "parameters": {
    "distance_matrix": "dist_matrix"
  }
}
```

Or use maximum likelihood with phangorn:

```r
# Convert to phyDat format
phyDat_data <- phangorn::as.phyDat(dna_data, type = "DNA")

# Initial tree
nj_tree <- ape::nj(dist_matrix)

# Maximum likelihood
ml_fit <- phangorn::pml(nj_tree, phyDat_data)
ml_tree <- phangorn::optim.pml(ml_fit)
```

## Step 5: Visualize the Tree

Create a publication-quality tree plot:

```json
{
  "tool_id": "ggtree",
  "capability_id": "ggtree::plot_with_tips",
  "parameters": {
    "tree": "ml_tree$tree",
    "layout": "rectangular"
  }
}
```

Save the plot:

```json
{
  "tool_id": "ggtree",
  "capability_id": "ggtree::save_plot",
  "parameters": {
    "plot": "tree_plot",
    "filename": "phylogenetic_tree.png",
    "width": 10,
    "height": 8
  }
}
```

## Complete R Script

Here's the complete workflow as an R script:

```r
# Load libraries
library(ape)
library(phangorn)
library(ggtree)

# Read sequences
dna_data <- ape::read.dna("sequences.fasta", format = "fasta")

# Compute distance matrix
dist_matrix <- ape::dist.dna(dna_data, model = "K80")

# Build neighbour-joining tree
nj_tree <- ape::nj(dist_matrix)

# Convert to phyDat for ML analysis
phyDat_data <- phangorn::as.phyDat(dna_data, type = "DNA")

# Maximum likelihood optimization
ml_fit <- phangorn::pml(nj_tree, phyDat_data)
ml_tree <- phangorn::optim.pml(ml_fit, optNni = TRUE, optBf = TRUE, optQ = TRUE)

# Visualize
tree_plot <- ggtree(ml_tree$tree) +
  geom_tiplab() +
  theme_tree2()

# Save plot
ggsave("phylogenetic_tree.png", tree_plot, width = 10, height = 8)

# Print summary
print(summary(ml_tree))
```

## Notes

- The workflow assumes sequences are already aligned. If not, run MAFFT first.
- For large datasets (>100 sequences), consider using approximate methods.
- Bootstrap analysis can be added using `phangorn::bootstrap.pml()`.
- Different substitution models can be specified in `dist.dna()` and `pml()`.
