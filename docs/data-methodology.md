# Data Methodology

## MVP Data Approach

The MVP uses sample data and explanatory placeholders. This keeps the first feature focused on product structure, visual direction, and implementation quality before introducing real-world data cleaning complexity.

## Sample Data Principles

- Sample values should be plausible for Vancouver bike share and transit use cases.
- Sample data must be clearly labeled as sample data in product copy or documentation.
- Charts, maps, and opportunity scores added in future features should disclose assumptions.

## Future Mobi CSV Integration

A future real-data version can integrate Mobi CSV exports in the browser. That implementation should define:

- CSV source and access method.
- File schema and required columns.
- Station identity and coordinate handling.
- Date range and seasonality assumptions.
- Data cleaning rules.
- Derived metrics such as transit proximity, network gaps, and opportunity areas.
- Known limitations and edge cases.

## Transit Context

Transit context should be treated as a front-end data layer. Future features may use curated sample transit stop or route data first, then document any transition to real public data sources.
