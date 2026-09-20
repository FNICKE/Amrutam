# Observability

## Current Baseline

- `/health` endpoint returns service status, version, environment, and timestamp.
- `X-Request-ID` is generated or propagated for every request.
- Morgan HTTP logs are routed through Winston.
- Prisma query events log slow queries over 100 ms.
- Operational errors are centralized through Express error middleware.

## Production Setup

Add OpenTelemetry instrumentation for Express, HTTP, and Prisma. Export traces to an OpenTelemetry Collector and forward them to a backend such as Jaeger, Tempo, Datadog, or New Relic.

Recommended RED metrics:

- Request rate by route, method, and status.
- Error rate by route and dependency.
- Duration histograms with p50, p95, p99.

Recommended USE metrics:

- Node.js event loop lag.
- Memory and CPU saturation.
- PostgreSQL connection pool utilization.
- Redis latency and error rate.

## Alerts

- p95 reads > 200 ms for 10 minutes.
- p95 writes > 500 ms for 10 minutes.
- 5xx rate > 1% for 5 minutes.
- Database connection errors > 0 for 5 minutes.
- Booking conflict spike above baseline.
- Failed login spike by IP or account.
- Audit log write failures.

## Logging

Logs should be JSON in production and include:

- `requestId`
- `userId` when authenticated
- `route`
- `statusCode`
- `durationMs`
- `error.code`
- safe resource IDs

Never log passwords, tokens, MFA secrets, full prescriptions, or full consultation notes.
