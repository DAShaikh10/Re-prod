
# Background
RStudio is the application that enables R language users to make an analysis in the visualized panes. But It is not the best product for analysis.
- It's not AI native IDE.
- It's not easy to reproduce the analysis when you execute the cells ad-hoc.

# Concept

- R and sparse tools to Natural Language.

# Problem

Researchers in biology inevitably face the need to become proficient in the R language. 
What’s more, they suffer from the dearth of tools outside of R. 
Even worse, when a package for R does exist, it is often extremely unfriendly to users. 
Many researchers are forced to give up on learning bioinformatics or ask younger colleagues to carry out the analyses. 
Meanwhile, the younger researchers lose efficiency every time they must switch between different tools (especially tools outside of R) to perform small steps in a bio-analysis pipeline. The interfaces for plotting modules are particularly varied in how they display results.

# Solution

LLM friendly interface like Cursor and `marimo`. 
MCP server (or Claude Code Skills like solutions) setup will make it easier to execute end-to-end analysis inside the platform.




# Notes


- Re render the script where editing is ongoing <-- As marimo did
	- This is for allowing the external tools to modify the existing codes.
	- I'll decide accepting or not later
- To store the all executed code blocks and depicted pictures as RStudio did.
	- Make this log as a draft Rmd ---> this is not cleaned edition of Rmd but should be remained in anywhere. We R users suffered from the difficulties to reproduce the result because we can run any cells adhoc in RStudio.
- Design
	- It's simple and similar to RStudio
	- But I wanna make it more intuitive.