# Testing Strategy

This project uses [Jest](https://jestjs.io/) with `ts-jest` to execute both unit and integration tests across the workflow phases. The testing stack is designed to run locally and in continuous integration environments without requiring network access or live agent invocations.

## Test Categories

### Unit Tests
- **Utility helpers** – Modules under `src/lib/` have targeted coverage verifying file IO helpers, Agent OS mirroring, task parsing, and context extraction logic.
- **Phase handlers** – Behaviour-focused tests exercise individual phases with mocked agent responses to ensure generated artifacts and context updates are correct.
- **Factories** – Common fixtures live in `tests/factories.ts` to generate consistent spec, plan, and task markdown structures across tests.

### Integration Tests
- `tests/WorkflowIntegration.test.ts` drives the full orchestrator through end-to-end scenarios with mocked agents. Cases cover:
  - Running the complete phase sequence and asserting artifact creation.
  - Resuming from intermediate phases and resuming individual tasks.
  - Handling agent failures and ensuring analytics metrics capture success/failure results.

## Running the Test Suite

```bash
npm test
```

Tests default to collecting coverage. Output is written to the `coverage/` directory.

## Adding New Tests

1. **Prefer factories**: Import helpers from `tests/factories.ts` to build spec/plan/task fixtures instead of hard-coding markdown strings.
2. **Mock external services**: Use `jest.mock` to stub agent invocations (`invokeAgent`) and MCP integrations (`registerRunMcpCommand`, `registerAnalyticsRunner`, `recordMetrics`). Avoid network calls in tests.
3. **Use temporary workspaces**: When a test needs filesystem interaction, create a temporary directory with `fs.mkdtemp` and clean it up in `afterEach`.
4. **Validate analytics**: For phases or workflows that report metrics, assert the mocked runner receives the expected payload so analytics coverage remains high.

## Known Gaps

- Browser/UI flows are not exercised because the workflow primarily targets CLI interactions.
- Analytics coverage metrics currently use a simple ratio derived from requirements or task completion; more sophisticated metrics may warrant additional tests when implemented.

## Offline Workflows

During local development you can run the orchestrator with mocked agents by setting the appropriate Jest mocks or by executing the tests. For manual dry runs, pass the `--dry-run` flag to skip agent execution entirely. This mirrors the approach used in tests where agent outputs are simulated.
