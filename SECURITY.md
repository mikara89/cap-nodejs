# Security Policy

## Supported Versions

The project is currently preparing the `0.7.0-beta.0` package line for public
validation. Security fixes should target the latest beta or release candidate
unless maintainers document additional supported versions.

## Reporting a Vulnerability

Please do not report security vulnerabilities in public GitHub issues.

Use GitHub private vulnerability reporting:

1. Open the repository on GitHub.
2. Go to the **Security** tab.
3. Choose **Report a vulnerability**.
4. Submit the report privately with enough detail for maintainers to reproduce
   and assess the issue.

Repository administrators must enable this before public launch:

1. Open **Settings** for the repository.
2. Go to **Code security and analysis**.
3. Enable **Private vulnerability reporting**.

This cannot be enabled from `SECURITY.md`; it is a GitHub repository setting.
Once enabled, reports create private security advisories visible only to
maintainers and the reporter.

When reporting, include:

- Affected package and version.
- Steps to reproduce or a minimal proof of concept.
- Expected impact.
- Any relevant configuration, transport, storage adapter, or dashboard exposure
  details.

## Security Notes for Users

- Do not commit Service Bus connection strings, database credentials, npm
  tokens, or local registry credentials.
- Protect `@mikara89/cap-dashboard` with a production NestJS guard before exposing
  it outside local development.
- Treat dashboard retry, mark, and flush routes as privileged admin actions.
- Prefer migrations and infrastructure tooling for production schema and broker
  provisioning.
