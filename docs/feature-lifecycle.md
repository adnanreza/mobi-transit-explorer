# Feature Lifecycle

Every feature must follow this workflow exactly:

1. LOAD
2. START
3. TEST
4. REVIEW
5. COMPLETE

## LOAD

- Clone or use the existing local repository.
- Ensure the working branch starts from `main`.
- Pull the latest changes from `origin`.
- Create one feature branch for the work.
- Create or update required documentation before or alongside implementation.

## START

- Implement exactly one feature per branch.
- Use React, Vite, TypeScript, Tailwind CSS, shadcn/ui patterns, and lucide-react where useful.
- Keep the app front-end only.
- Keep styling in Tailwind and shadcn/ui component patterns.
- Do not introduce Bootstrap, Material UI, Chakra, DaisyUI, CSS modules, or backend code.

## TEST

- Use Vitest for unit and component tests.
- Add or update tests for the feature behavior.
- Run the full test suite before review.
- Use Playwright MCP for browser review of the local app.

## REVIEW

Review the feature against:

- Product spec alignment.
- Visual polish and responsive layout.
- Tailwind and shadcn/ui consistency.
- TypeScript correctness.
- Working imports and build health.
- Browser console errors.
- README and documentation quality.
- Unnecessary files, screenshots, debug output, or generated artifacts.

## COMPLETE

Only after tests and review pass:

1. Commit the feature branch with a clear message.
2. Merge the feature branch into `main` locally.
3. Push `main` to `origin`.
4. Delete the local feature branch.
5. Clean temporary artifacts such as screenshots, debug files, generated notes, and unused test artifacts.
6. Do not delete any remote feature branch unless explicitly instructed.
