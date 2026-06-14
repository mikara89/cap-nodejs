# Security Policy

## Supported Versions

The project is currently preparing the `0.7.0-beta.0` package line for public
validation. Security fixes should target the latest beta or release candidate
unless maintainers document additional supported versions.

## Reporting a Vulnerability

Please do not report security vulnerabilities in public GitHub issues.

TODO before public launch: configure GitHub private vulnerability reporting or
add a dedicated security contact email.

When reporting, include:

- Affected package and version.
- Steps to reproduce or a minimal proof of concept.
- Expected impact.
- Any relevant configuration, transport, storage adapter, or dashboard exposure
  details.

## Security Notes for Users

- Do not commit Service Bus connection strings, database credentials, npm
  tokens, or local registry credentials.
- Protect `@cap/cap-dashboard` with a production NestJS guard before exposing
  it outside local development.
- Treat dashboard retry, mark, and flush routes as privileged admin actions.
- Prefer migrations and infrastructure tooling for production schema and broker
  provisioning.
