# Mobi Transit Explorer Product Spec

## Product Purpose

Mobi Transit Explorer is a front-end data product that explores how Vancouver's Mobi bike share network can extend and complement public transit. The product presents a polished portfolio experience that turns mobility data into clear, inspectable insights.

## Target Audience

- Hiring managers and product teams evaluating Adnan Reza's front-end product work.
- Transit, mobility, and civic technology audiences interested in multimodal access.
- Portfolio visitors who want to see product thinking, data visualization, and implementation quality in one project.

## Portfolio Positioning

This project is designed as a public portfolio case study at `https://mobi-transit-explorer.adnanreza.com`. It should read as a focused front-end data product, not a generic template or dashboard. Each feature branch should add one clearly scoped capability while preserving a polished product feel.

## MVP Features

- Project scaffold using React, Vite, TypeScript, Tailwind CSS, shadcn/ui patterns, lucide-react, and Vitest.
- Responsive app shell with header, navigation, hero copy, and placeholder sections.
- Sample-data-first narrative that explains future real Mobi CSV integration.
- Initial documentation describing the product, methodology, lifecycle, and review standards.

## Non-Goals

- No backend service or server-side persistence.
- No authentication, user accounts, or admin tools.
- No live production Mobi data ingestion in the MVP.
- No UI libraries outside Tailwind CSS, shadcn/ui patterns, and lucide-react icons.
- No Bootstrap, Material UI, Chakra, DaisyUI, or plain CSS modules.

## Future Real-Data Version

A later feature can replace sample data with real Mobi CSV inputs. That version should document source files, update cadence, cleaning assumptions, field mappings, station matching logic, and limitations. The app should continue to run fully in the browser unless a future spec explicitly changes the no-backend constraint.
