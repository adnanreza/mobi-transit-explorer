# Review Checklist

Use this checklist before completing any feature branch.

## Product

- The feature supports the product purpose in `docs/product-spec.md`.
- The experience feels like a polished portfolio product.
- MVP limitations and sample-data assumptions are clear.
- Non-goals remain out of scope.

## Engineering

- React, Vite, and TypeScript are used.
- Styling stays within Tailwind CSS and shadcn/ui patterns.
- lucide-react icons are used where they add clarity.
- No backend code is introduced.
- No prohibited UI libraries are added.
- Path alias `@/` works.

## Testing

- Vitest tests cover the feature.
- Tests pass locally.
- TypeScript and production build pass.
- Playwright MCP browser review confirms the local app renders.
- Browser console has no unexpected errors.

## Completion

- Temporary artifacts are removed.
- README and docs are current.
- Feature branch has a clear commit.
- Feature branch is merged into `main` locally.
- `main` is pushed to `origin`.
- Local feature branch is deleted.
