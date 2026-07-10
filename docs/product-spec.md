# Mobi Transit Explorer Product Spec (v2)

## Purpose

Mobi Transit Explorer turns nine years of public Mobi trip data — 8+ million rides — into an interactive story about how bike share works in Vancouver and how messy public data becomes trustworthy numbers. It is a portfolio case study demonstrating data engineering (Python + DuckDB pipeline, dimensional modeling, data-quality discipline) and data-product craft (design, cartography, honest analytics) in one artifact.

## Audience

- Mobi by Rogers — the product should read as genuine knowledge of, and affection for, their system.
- Data engineering hiring panels — the pipeline, star schema, and generated quality report are the evidence.
- Urbanism and civic-tech readers who want the story of the network.

## Positioning

Live at `https://mobi-transit-explorer.adnanreza.com`. First person where it earns it: the author lives car-free in Vancouver and rides this network. Quiet, editorial, Apple-inspired visual language — big typography, hairline rules, one Mobi-blue accent, no dashboard tropes. Every number on screen is derived from generated artifacts; nothing is hand-written or estimated silently.

## Current capabilities

- Hero and overview: display-scale statement plus stat row (trips, distance, stations, e-bike share) from `meta.json`.
- Nine Years story: five data-driven chapters — growth, seasonality, the pandemic, e-bike adoption, weather — each a derived headline, full-width chart, and cited caption.
- Interactive map: MapLibre GL on the OpenFreeMap basemap; 262 stations at true GBFS coordinates sized by any year's volume, transit-distance filtering, station finder, connector-score shading, shareable URL state.
- Station profiles: connector score with component breakdown, per-year history, top destinations, docks, nearest rapid transit, first-seen date.
- Opportunities: rule-based findings citing their evidence numbers, linked to methodology definitions.
- Methodology: first-person data-engineering case study with the generated pipeline funnel and the drift catalogue; links to the committed data-quality report.

## Principles

- The app is static; the pipeline runs locally and its artifacts are committed.
- Flag, don't delete: aggregates exclude only the flags that invalidate them.
- Unknown source drift stops the pipeline until a human maps it.
- Every feature ships through the branch lifecycle in `docs/feature-lifecycle.md`, specced in `docs/features/`.
