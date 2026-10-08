export interface Subtopic {
  id: string;
  topicId: string;
  title: string;
  slug: string;
  orderIndex: number;
  summary: string;
}

export interface Topic {
  id: string;
  level: number;
  title: string;
  slug: string;
  description: string;
  icon: string;
  orderIndex: number;
  subtopics: Subtopic[];
}

export const TOPICS: Topic[] = [
  // Level 1 – Basics
  {
    id: "select-basics",
    level: 1,
    title: "SQL & SELECT Basics",
    slug: "select-basics",
    description: "Introduction to relational tables, SELECT expressions, and column projections.",
    icon: "Database",
    orderIndex: 1,
    subtopics: [
      { id: "select-cols", topicId: "select-basics", title: "Selecting Columns", slug: "selecting-columns", orderIndex: 1, summary: "Project specific columns from a table" },
      { id: "select-all", topicId: "select-basics", title: "Selecting All Columns", slug: "select-all", orderIndex: 2, summary: "Using SELECT * correctly" },
    ],
  },
  {
    id: "distinct",
    level: 1,
    title: "DISTINCT Values",
    slug: "distinct",
    description: "Eliminating duplicate rows from query result sets.",
    icon: "Filter",
    orderIndex: 2,
    subtopics: [
      { id: "distinct-single", topicId: "distinct", title: "Single Column Distinct", slug: "distinct-single", orderIndex: 1, summary: "Unique values in a column" },
      { id: "distinct-multi", topicId: "distinct", title: "Multi-Column Distinct", slug: "distinct-multi", orderIndex: 2, summary: "Unique combinations across multiple columns" },
    ],
  },
  {
    id: "where-filtering",
    level: 1,
    title: "WHERE & Logical Operators",
    slug: "where-filtering",
    description: "Row filtering using comparison operators, AND, OR, and NOT.",
    icon: "SlidersHorizontal",
    orderIndex: 3,
    subtopics: [
      { id: "where-comparison", topicId: "where-filtering", title: "Comparison Operators", slug: "comparisons", orderIndex: 1, summary: "=, !=, <, >, <=, >=" },
      { id: "where-boolean", topicId: "where-filtering", title: "AND / OR / NOT", slug: "boolean-logic", orderIndex: 2, summary: "Compound conditions and precedence" },
    ],
  },
  {
    id: "between-in",
    level: 1,
    title: "BETWEEN & IN Operators",
    slug: "between-in",
    description: "Range filtering with BETWEEN and discrete membership filtering with IN / NOT IN.",
    icon: "ListFilter",
    orderIndex: 4,
    subtopics: [
      { id: "between-range", topicId: "between-in", title: "BETWEEN Ranges", slug: "between-ranges", orderIndex: 1, summary: "Inclusive range checks for numbers and dates" },
      { id: "in-membership", topicId: "between-in", title: "IN / NOT IN Sets", slug: "in-sets", orderIndex: 2, summary: "Matching against lists of values" },
    ],
  },
  {
    id: "like-wildcards",
    level: 1,
    title: "LIKE & Pattern Matching",
    slug: "like-wildcards",
    description: "String pattern matching using % and _ wildcards and ILIKE in PostgreSQL.",
    icon: "Search",
    orderIndex: 5,
    subtopics: [
      { id: "like-percent", topicId: "like-wildcards", title: "% Wildcard", slug: "percent-wildcard", orderIndex: 1, summary: "Zero or more characters" },
      { id: "like-underscore", topicId: "like-wildcards", title: "_ Wildcard", slug: "underscore-wildcard", orderIndex: 2, summary: "Single character matching" },
    ],
  },
  {
    id: "null-handling",
    level: 1,
    title: "NULL Values & Three-Valued Logic",
    slug: "null-handling",
    description: "Filtering unknown and missing values with IS NULL and IS NOT NULL.",
    icon: "HelpCircle",
    orderIndex: 6,
    subtopics: [
      { id: "null-is", topicId: "null-handling", title: "IS NULL", slug: "is-null", orderIndex: 1, summary: "Detecting missing values" },
      { id: "null-not", topicId: "null-handling", title: "IS NOT NULL", slug: "is-not-null", orderIndex: 2, summary: "Filtering populated attributes" },
    ],
  },
  {
    id: "order-by",
    level: 1,
    title: "ORDER BY & Sorting",
    slug: "order-by",
    description: "Sorting query results ascending, descending, with ties, and NULLS FIRST/LAST.",
    icon: "ArrowDownUp",
    orderIndex: 7,
    subtopics: [
      { id: "order-asc-desc", topicId: "order-by", title: "ASC & DESC", slug: "asc-desc", orderIndex: 1, summary: "Directional sorting" },
      { id: "order-multi", topicId: "order-by", title: "Multi-Column Sorting", slug: "multi-sort", orderIndex: 2, summary: "Hierarchical sort criteria" },
    ],
  },
  {
    id: "limit-offset",
    level: 1,
    title: "LIMIT & OFFSET Pagination",
    slug: "limit-offset",
    description: "Restricting output size and implementing deterministic result pagination.",
    icon: "Rows",
    orderIndex: 8,
    subtopics: [
      { id: "limit-top", topicId: "limit-offset", title: "LIMIT Clause", slug: "limit-clause", orderIndex: 1, summary: "Capping returned rows" },
      { id: "offset-paging", topicId: "limit-offset", title: "OFFSET Clause", slug: "offset-clause", orderIndex: 2, summary: "Skipping leading rows" },
    ],
  },
  {
    id: "aliases",
    level: 1,
    title: "Column & Table Aliases",
    slug: "aliases",
    description: "Renaming output headers with AS and qualifying expressions with table abbreviations.",
    icon: "Tag",
    orderIndex: 9,
    subtopics: [
      { id: "alias-col", topicId: "aliases", title: "Column Aliases", slug: "column-aliases", orderIndex: 1, summary: "Renaming calculated expressions" },
      { id: "alias-tbl", topicId: "aliases", title: "Table Aliases", slug: "table-aliases", orderIndex: 2, summary: "Clean table prefixes" },
    ],
  },

  // Level 2 – Functions
  {
    id: "aggregates",
    level: 2,
    title: "Aggregate Functions",
    slug: "aggregates",
    description: "Summary computations using COUNT, SUM, AVG, MIN, and MAX.",
    icon: "Sigma",
    orderIndex: 10,
    subtopics: [
      { id: "agg-count", topicId: "aggregates", title: "COUNT Variations", slug: "count-variations", orderIndex: 1, summary: "COUNT(*), COUNT(col), COUNT(DISTINCT col)" },
      { id: "agg-stats", topicId: "aggregates", title: "SUM & AVG & Extremes", slug: "stats-functions", orderIndex: 2, summary: "Numeric aggregation" },
    ],
  },
  {
    id: "string-functions",
    level: 2,
    title: "String Functions",
    slug: "string-functions",
    description: "Text manipulation with CONCAT, LENGTH, LOWER, UPPER, SUBSTRING, TRIM, and REPLACE.",
    icon: "Type",
    orderIndex: 11,
    subtopics: [
      { id: "str-transform", topicId: "string-functions", title: "Transformations", slug: "transformations", orderIndex: 1, summary: "Case conversion, trimming, and length" },
      { id: "str-extract", topicId: "string-functions", title: "Extraction & Substrings", slug: "substrings", orderIndex: 2, summary: "Slicing text" },
    ],
  },
  {
    id: "numeric-functions",
    level: 2,
    title: "Numeric & Math Functions",
    slug: "numeric-functions",
    description: "Mathematical operations with ROUND, CEIL, FLOOR, ABS, and MOD.",
    icon: "Calculator",
    orderIndex: 12,
    subtopics: [
      { id: "num-round", topicId: "numeric-functions", title: "Rounding & Precision", slug: "rounding", orderIndex: 1, summary: "ROUND, CEIL, FLOOR" },
      { id: "num-math", topicId: "numeric-functions", title: "Mathematical Utilities", slug: "math-utils", orderIndex: 2, summary: "ABS, power, modulus" },
    ],
  },
  {
    id: "date-time",
    level: 2,
    title: "Date & Time Functions",
    slug: "date-time",
    description: "Date arithmetic, EXTRACT, DATE_TRUNC, AGE, and intervals in PostgreSQL.",
    icon: "Calendar",
    orderIndex: 13,
    subtopics: [
      { id: "dt-current", topicId: "date-time", title: "Current Date & Truncation", slug: "current-date-trunc", orderIndex: 1, summary: "CURRENT_DATE, DATE_TRUNC" },
      { id: "dt-extract", topicId: "date-time", title: "EXTRACT & Intervals", slug: "extract-intervals", orderIndex: 2, summary: "Extracting parts and time arithmetic" },
    ],
  },
  {
    id: "conditionals",
    level: 2,
    title: "Conditional Logic (CASE & COALESCE)",
    slug: "conditionals",
    description: "Branching logic with CASE, fallback defaults with COALESCE, and NULLIF safety.",
    icon: "GitBranch",
    orderIndex: 14,
    subtopics: [
      { id: "cond-case", topicId: "conditionals", title: "CASE Expressions", slug: "case-when", orderIndex: 1, summary: "WHEN ... THEN ... ELSE logic" },
      { id: "cond-coalesce", topicId: "conditionals", title: "COALESCE & NULLIF", slug: "coalesce-nullif", orderIndex: 2, summary: "Default values and division guards" },
    ],
  },

  // Level 3 – Grouping
  {
    id: "group-by",
    level: 3,
    title: "GROUP BY Clause",
    slug: "group-by",
    description: "Partitioning result sets into grouped summary buckets.",
    icon: "Boxes",
    orderIndex: 15,
    subtopics: [
      { id: "grp-single", topicId: "group-by", title: "Single Column Grouping", slug: "single-group", orderIndex: 1, summary: "Aggregating by one dimension" },
    ],
  },
  {
    id: "multi-column-group-by",
    level: 3,
    title: "Multi-Column Grouping",
    slug: "multi-column-group-by",
    description: "Multi-dimensional summaries across compound group keys.",
    icon: "LayoutGrid",
    orderIndex: 16,
    subtopics: [
      { id: "grp-multi", topicId: "multi-column-group-by", title: "Multi-Level Aggregates", slug: "multi-group", orderIndex: 1, summary: "Grouping across 2+ columns" },
    ],
  },
  {
    id: "having",
    level: 3,
    title: "HAVING Clause",
    slug: "having",
    description: "Filtering aggregated groups post-calculation versus row-level WHERE filtering.",
    icon: "Sliders",
    orderIndex: 17,
    subtopics: [
      { id: "hav-filters", topicId: "having", title: "Aggregate Filters", slug: "having-filters", orderIndex: 1, summary: "HAVING COUNT(*) > N, HAVING SUM > X" },
    ],
  },
  {
    id: "conditional-aggregation",
    level: 3,
    title: "Conditional Aggregation",
    slug: "conditional-aggregation",
    description: "Selective aggregation using FILTER (WHERE ...) and SUM(CASE ...) pivoting.",
    icon: "PieChart",
    orderIndex: 18,
    subtopics: [
      { id: "cagg-filter", topicId: "conditional-aggregation", title: "FILTER & CASE Aggregation", slug: "filter-case", orderIndex: 1, summary: "Conditional counts and sums" },
    ],
  },

  // Level 4 – Joins
  {
    id: "inner-join",
    level: 4,
    title: "INNER JOIN",
    slug: "inner-join",
    description: "Matching rows between two related tables on shared foreign keys.",
    icon: "Combine",
    orderIndex: 19,
    subtopics: [
      { id: "join-inner", topicId: "inner-join", title: "Inner Joins", slug: "inner-join-basic", orderIndex: 1, summary: "Exact relational matches" },
    ],
  },
  {
    id: "left-right-outer-join",
    level: 4,
    title: "LEFT, RIGHT & FULL OUTER JOIN",
    slug: "outer-joins",
    description: "Preserving unmatched rows from one or both tables.",
    icon: "Splits",
    orderIndex: 20,
    subtopics: [
      { id: "join-left", topicId: "left-right-outer-join", title: "LEFT JOIN", slug: "left-join", orderIndex: 1, summary: "Preserving all left records" },
      { id: "join-full", topicId: "left-right-outer-join", title: "FULL OUTER JOIN", slug: "full-join", orderIndex: 2, summary: "Complete outer union of tables" },
    ],
  },
  {
    id: "cross-self-join",
    level: 4,
    title: "CROSS & SELF JOIN",
    slug: "cross-self-join",
    description: "Cartesian product generation and hierarchical self-referential relationships (manager-employee).",
    icon: "GitFork",
    orderIndex: 21,
    subtopics: [
      { id: "join-self", topicId: "cross-self-join", title: "Self Joins", slug: "self-join", orderIndex: 1, summary: "Joining a table to itself" },
      { id: "join-cross", topicId: "cross-self-join", title: "Cross Joins", slug: "cross-join", orderIndex: 2, summary: "Permutations and Cartesian products" },
    ],
  },
  {
    id: "multi-table-joins",
    level: 4,
    title: "Multi-Table Joins & Complex Joins",
    slug: "multi-table-joins",
    description: "Connecting three or more tables with GROUP BY, HAVING, and filtering.",
    icon: "Network",
    orderIndex: 22,
    subtopics: [
      { id: "join-chain", topicId: "multi-table-joins", title: "Joined Chains", slug: "chained-joins", orderIndex: 1, summary: "A -> B -> C relational joins" },
    ],
  },
  {
    id: "anti-joins",
    level: 4,
    title: "Anti-Joins & Exclusion Queries",
    slug: "anti-joins",
    description: "Identifying orphan rows and missing relational records using LEFT JOIN ... WHERE right.id IS NULL.",
    icon: "UserMinus",
    orderIndex: 23,
    subtopics: [
      { id: "join-anti", topicId: "anti-joins", title: "Anti-Join Patterns", slug: "anti-join-patterns", orderIndex: 1, summary: "Finding records with no match" },
    ],
  },

  // Level 5 – Subqueries
  {
    id: "scalar-subqueries",
    level: 5,
    title: "Scalar & Nested Subqueries",
    slug: "scalar-subqueries",
    description: "Single-value subqueries in SELECT and comparison WHERE predicates.",
    icon: "FolderSearch",
    orderIndex: 24,
    subtopics: [
      { id: "sub-scalar", topicId: "scalar-subqueries", title: "Scalar Subqueries", slug: "scalar-subquery", orderIndex: 1, summary: "Comparing against calculated scalars" },
    ],
  },
  {
    id: "in-exists",
    level: 5,
    title: "IN & EXISTS / NOT EXISTS",
    slug: "in-exists",
    description: "Multi-row membership and semi-join existence predicates.",
    icon: "CheckSquare",
    orderIndex: 25,
    subtopics: [
      { id: "sub-exists", topicId: "in-exists", title: "EXISTS & NOT EXISTS", slug: "exists-predicate", orderIndex: 1, summary: "Subquery existence checks" },
    ],
  },
  {
    id: "correlated-subqueries",
    level: 5,
    title: "Correlated Subqueries",
    slug: "correlated-subqueries",
    description: "Row-by-row subquery evaluation referencing outer query columns.",
    icon: "RefreshCw",
    orderIndex: 26,
    subtopics: [
      { id: "sub-corr", topicId: "correlated-subqueries", title: "Correlated Logic", slug: "correlated-logic", orderIndex: 1, summary: "Subqueries tied to outer rows" },
    ],
  },
  {
    id: "subqueries-in-from",
    level: 5,
    title: "Derived Tables (Subqueries in FROM)",
    slug: "subqueries-in-from",
    description: "Treating subquery result sets as inline derived tables with aliases.",
    icon: "Layers",
    orderIndex: 27,
    subtopics: [
      { id: "sub-from", topicId: "subqueries-in-from", title: "Derived Tables", slug: "derived-tables", orderIndex: 1, summary: "Subquery in FROM clause" },
    ],
  },

  // Level 6 – Set operators
  {
    id: "union-union-all",
    level: 6,
    title: "UNION & UNION ALL",
    slug: "union-union-all",
    description: "Combining results vertically with and without duplicate removal.",
    icon: "PlusCircle",
    orderIndex: 28,
    subtopics: [
      { id: "set-union", topicId: "union-union-all", title: "Union Operations", slug: "union-ops", orderIndex: 1, summary: "Stacking compatible row sets" },
    ],
  },
  {
    id: "intersect-except",
    level: 6,
    title: "INTERSECT & EXCEPT",
    slug: "intersect-except",
    description: "Set intersection and set difference operators in relational querying.",
    icon: "MinusCircle",
    orderIndex: 29,
    subtopics: [
      { id: "set-diff", topicId: "intersect-except", title: "Set Difference & Intersection", slug: "set-difference", orderIndex: 1, summary: "Finding overlaps and differences" },
    ],
  },

  // Level 7 – Intermediate
  {
    id: "ctes",
    level: 7,
    title: "Common Table Expressions (WITH)",
    slug: "ctes",
    description: "Modular query construction with single and chained CTEs.",
    icon: "Binary",
    orderIndex: 30,
    subtopics: [
      { id: "cte-basic", topicId: "ctes", title: "Single & Multiple CTEs", slug: "with-ctes", orderIndex: 1, summary: "WITH clause structuring" },
    ],
  },
  {
    id: "recursive-ctes",
    level: 7,
    title: "Recursive CTEs",
    slug: "recursive-ctes",
    description: "Querying hierarchical trees, organizational reporting paths, and graph sequences.",
    icon: "Repeat",
    orderIndex: 31,
    subtopics: [
      { id: "cte-recurse", topicId: "recursive-ctes", title: "Recursive Graphs & Trees", slug: "recursive-trees", orderIndex: 1, summary: "Anchor and recursive query members" },
    ],
  },
  {
    id: "views",
    level: 7,
    title: "Views & Virtual Tables",
    slug: "views",
    description: "Encapsulating complex queries into reusable virtual table definitions.",
    icon: "Eye",
    orderIndex: 32,
    subtopics: [
      { id: "view-create", topicId: "views", title: "CREATE VIEW", slug: "create-view", orderIndex: 1, summary: "Defining virtual tables" },
    ],
  },
  {
    id: "temporary-tables",
    level: 7,
    title: "Temporary Tables & Staging",
    slug: "temporary-tables",
    description: "Creating session-scoped temporary tables for multi-step pipeline transformation.",
    icon: "Clock",
    orderIndex: 33,
    subtopics: [
      { id: "temp-tbl", topicId: "temporary-tables", title: "Temporary Tables", slug: "temp-tables", orderIndex: 1, summary: "CREATE TEMP TABLE usage" },
    ],
  },

  // Level 8 – Window functions
  {
    id: "window-ranking",
    level: 8,
    title: "Window Ranking Functions",
    slug: "window-ranking",
    description: "ROW_NUMBER, RANK, DENSE_RANK, and NTILE over partitions.",
    icon: "Award",
    orderIndex: 34,
    subtopics: [
      { id: "win-rank", topicId: "window-ranking", title: "Ranking Across Partitions", slug: "rank-dense-rank", orderIndex: 1, summary: "Top-N and rank without collapsing rows" },
    ],
  },
  {
    id: "window-offset",
    level: 8,
    title: "Window Value Offsets (LAG & LEAD)",
    slug: "window-offset",
    description: "Accessing previous and following rows with LAG, LEAD, FIRST_VALUE, and LAST_VALUE.",
    icon: "MoveHorizontal",
    orderIndex: 35,
    subtopics: [
      { id: "win-offset", topicId: "window-offset", title: "LAG & LEAD", slug: "lag-lead", orderIndex: 1, summary: "Period-over-period differences" },
    ],
  },
  {
    id: "window-aggregates",
    level: 8,
    title: "Window Aggregates & Frame Clauses",
    slug: "window-aggregates",
    description: "Running totals, moving averages, and ROWS / RANGE BETWEEN window frames.",
    icon: "TrendingUp",
    orderIndex: 36,
    subtopics: [
      { id: "win-frames", topicId: "window-aggregates", title: "Running Totals & Frames", slug: "running-totals", orderIndex: 1, summary: "Cumulative sums and moving averages" },
    ],
  },

  // Level 9 – Advanced
  {
    id: "advanced-ctes-hierarchies",
    level: 9,
    title: "Advanced Hierarchies & Graph Queries",
    slug: "advanced-hierarchies",
    description: "Multi-level organizational hierarchy traversal, cycle detection, and depth tracking.",
    icon: "GitMerge",
    orderIndex: 37,
    subtopics: [
      { id: "adv-graph", topicId: "advanced-ctes-hierarchies", title: "Hierarchical Traversal", slug: "hierarchy-depth", orderIndex: 1, summary: "Tracking levels in graphs" },
    ],
  },
  {
    id: "gaps-and-islands",
    level: 9,
    title: "Gaps and Islands Problems",
    slug: "gaps-and-islands",
    description: "Identifying contiguous groups of records and missing ranges in sequence data.",
    icon: "Activity",
    orderIndex: 38,
    subtopics: [
      { id: "adv-gaps", topicId: "gaps-and-islands", title: "Contiguous Sequences", slug: "islands-detection", orderIndex: 1, summary: "Grouping consecutive ranges" },
    ],
  },
  {
    id: "query-optimization",
    level: 9,
    title: "EXPLAIN & Query Optimization",
    slug: "query-optimization",
    description: "Reading execution plans, index scans, cost estimation, and optimization techniques.",
    icon: "Zap",
    orderIndex: 39,
    subtopics: [
      { id: "adv-explain", topicId: "query-optimization", title: "EXPLAIN ANALYZE", slug: "explain-plans", orderIndex: 1, summary: "Understanding execution metrics" },
    ],
  },

  // Level 10 – Real-world scenarios
  {
    id: "scenario-banking",
    level: 10,
    title: "Banking & Financial Services",
    slug: "banking-scenarios",
    description: "High-value transactions, account balance calculations, and credit risk analysis.",
    icon: "Landmark",
    orderIndex: 40,
    subtopics: [
      { id: "sc-bank", topicId: "scenario-banking", title: "Banking Analytics", slug: "banking-analytics", orderIndex: 1, summary: "Audit trails and liquidity" },
    ],
  },
  {
    id: "scenario-hospital",
    level: 10,
    title: "Hospital & Healthcare",
    slug: "hospital-scenarios",
    description: "Patient appointment frequency, doctor workloads, and prescription timelines.",
    icon: "HeartPulse",
    orderIndex: 41,
    subtopics: [
      { id: "sc-hosp", topicId: "scenario-hospital", title: "Clinical Operations", slug: "clinical-operations", orderIndex: 1, summary: "Appointment and medical records" },
    ],
  },
  {
    id: "scenario-food-delivery",
    level: 10,
    title: "Food Delivery & Logistics",
    slug: "food-delivery-scenarios",
    description: "Fleet driver performance, restaurant order volumes, and average ticket size.",
    icon: "Utensils",
    orderIndex: 42,
    subtopics: [
      { id: "sc-food", topicId: "scenario-food-delivery", title: "Delivery Operations", slug: "food-logistics", orderIndex: 1, summary: "Dispatcher metrics and sales" },
    ],
  },
  {
    id: "scenario-movie-streaming",
    level: 10,
    title: "Movie Streaming & Subscriptions",
    slug: "movie-streaming-scenarios",
    description: "User watch completion percentages, top genres, and churn analysis.",
    icon: "Film",
    orderIndex: 43,
    subtopics: [
      { id: "sc-movie", topicId: "scenario-movie-streaming", title: "Streaming Analytics", slug: "streaming-analytics", orderIndex: 1, summary: "Viewing habits and retention" },
    ],
  },
  {
    id: "scenario-social-media",
    level: 10,
    title: "Social Media & Networks",
    slug: "social-media-scenarios",
    description: "Engagement metrics, follower network analysis, and trending content.",
    icon: "Share2",
    orderIndex: 44,
    subtopics: [
      { id: "sc-social", topicId: "scenario-social-media", title: "Social Metrics", slug: "social-engagement", orderIndex: 1, summary: "Viral posts and relationships" },
    ],
  },
  {
    id: "scenario-airline",
    level: 10,
    title: "Airlines & Aviation",
    slug: "airline-scenarios",
    description: "Flight scheduling, delay rates, passenger ticket classes, and loyalty miles.",
    icon: "Plane",
    orderIndex: 45,
    subtopics: [
      { id: "sc-air", topicId: "scenario-airline", title: "Flight Operations", slug: "flight-analytics", orderIndex: 1, summary: "Route profitability and delays" },
    ],
  },
  {
    id: "scenario-hotel",
    level: 10,
    title: "Hospitality & Hotels",
    slug: "hotel-scenarios",
    description: "Occupancy rates, room revenue (RevPAR), guest loyalty, and incidental service fees.",
    icon: "Hotel",
    orderIndex: 46,
    subtopics: [
      { id: "sc-hotel", topicId: "scenario-hotel", title: "Hotel Operations", slug: "hospitality-analytics", orderIndex: 1, summary: "Bookings and room revenues" },
    ],
  },
  {
    id: "scenario-library",
    level: 10,
    title: "Library Management",
    slug: "library-scenarios",
    description: "Book circulation, overdue tracking, most-borrowed authors, and membership activity.",
    icon: "BookOpen",
    orderIndex: 47,
    subtopics: [
      { id: "sc-lib", topicId: "scenario-library", title: "Circulation Analytics", slug: "circulation-analytics", orderIndex: 1, summary: "Loan durations and popular books" },
    ],
  },
  {
    id: "scenario-inventory",
    level: 10,
    title: "Supply Chain & Inventory",
    slug: "inventory-scenarios",
    description: "Warehouse capacity utilization, stock reorder triggers, and supplier lead times.",
    icon: "PackageCheck",
    orderIndex: 48,
    subtopics: [
      { id: "sc-inv", topicId: "scenario-inventory", title: "Inventory Auditing", slug: "stock-audits", orderIndex: 1, summary: "Reorder points and stockouts" },
    ],
  },
  {
    id: "scenario-finance",
    level: 10,
    title: "Trading & Asset Management",
    slug: "finance-scenarios",
    description: "Portfolio valuation, realized gains, dividend income, and trade velocity.",
    icon: "CandlestickChart",
    orderIndex: 49,
    subtopics: [
      { id: "sc-fin", topicId: "scenario-finance", title: "Portfolio Metrics", slug: "portfolio-valuations", orderIndex: 1, summary: "Holdings and dividend yield" },
    ],
  },
  {
    id: "scenario-hr",
    level: 10,
    title: "Talent Acquisition & HR",
    slug: "hr-scenarios",
    description: "Recruitment funnel progression, offer acceptance rates, and candidate interview scores.",
    icon: "Users",
    orderIndex: 50,
    subtopics: [
      { id: "sc-hr", topicId: "scenario-hr", title: "Hiring Funnels", slug: "recruitment-analytics", orderIndex: 1, summary: "Interview pass rates and compensation" },
    ],
  },
  {
    id: "scenario-sales",
    level: 10,
    title: "Enterprise Sales & CRM",
    slug: "sales-scenarios",
    description: "Deal win rates, sales quota attainment, pipeline velocity, and contract ARR.",
    icon: "Briefcase",
    orderIndex: 51,
    subtopics: [
      { id: "sc-sales", topicId: "scenario-sales", title: "Sales Performance", slug: "pipeline-analytics", orderIndex: 1, summary: "Quota attainment and deal conversion" },
    ],
  },
];
