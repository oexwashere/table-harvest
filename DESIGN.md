# Design notes

## Scope

Export the tables you choose into clean, correctly escaped CSV files.

## Implementation decisions

CSV fields are always quoted, embedded quotes are doubled, and line breaks are preserved. Formula-like cell contents receive an apostrophe by default before export. Extraction is triggered only through the userscript menu.

## Boundaries

Only actual HTML tables in the top-level page are detected. Merged cells are exported once, not expanded; virtualized rows and canvas grids are not scraped. Formula protection changes values that begin with `=`, `+`, `-`, or `@`; you can opt out when you trust the data.

## Verification

Pure functions are tested with the Node built-in test runner; the drawer is checked in a simulated userscript browser environment.

Tests describe expected behavior rather than depending on a live external service. CI configuration is included, but remote CI execution is not implied by local test results.
