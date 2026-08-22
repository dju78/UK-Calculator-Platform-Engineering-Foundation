# FX Provider Architecture

## Overview
The FX Provider abstraction (`FXProvider`) enables external currency exchange rate retrieval for the Calculation Engine (CON-010).

## Design Choices
- **Provider Interface**: Allows dependency injection of mock providers for testing, preventing flaky CI builds.
- **Cache Policy**: Reduces rate limiting and latency. `staleTimeMs` defaults to 1 hour.
- **Network Resilience**: Basic error handling and response validation ensure the engine fails gracefully on network errors.

## Selected API
We selected [Frankfurter](https://api.frankfurter.app) as the default free public API. It does not require authentication and has reliable uptime.

## Integration
- Engine handles asynchronous handler `calculate` executions.
- Rates can also be passed via `inputs` for deterministic benchmarking without network calls.
