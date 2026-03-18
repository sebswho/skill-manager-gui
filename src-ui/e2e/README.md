# E2E Tests

This directory contains end-to-end tests using Playwright.

## Running Tests

```bash
# Run all tests
bun run test:e2e

# Run with UI mode (for debugging)
bun run test:e2e:ui

# Run specific test file
bun run test:e2e smoke.spec.ts

# Debug mode
bun run test:e2e:debug
```

## Test Structure

- `smoke.spec.ts` - Basic smoke tests (app loads, elements visible)
- `settings.spec.ts` - Settings panel tests
- `agents.spec.ts` - Agent management tests

## Prerequisites

The tests expect the dev server to be running at `http://localhost:1420`.

Run the dev server in a separate terminal:
```bash
bun run dev
```

Or use the with_server.py helper script from the skill documentation.
