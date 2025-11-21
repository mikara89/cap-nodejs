# Contributing & Development

Local workflow

```powershell
# Install dependencies (monorepo workspace)
npm install

# Lint (auto-fix where possible)
npm run lint

# Run unit tests
npm test

# Build
npm run build
```

Coding guidelines

- Maintain compatibility with NestJS DI patterns — prefer Symbol tokens for the
  CAP abstractions.
- Keep runtime code free of `eslint-disable` unless absolutely necessary; prefer
  fixing tests/helpers types.
- Add unit tests for new behavior and update `docs/` pages when you change
  public APIs.

Pull request checklist

- [ ] Lint passes (`npm run lint`).
- [ ] Unit tests pass (`npm test`).
- [ ] Update `docs/` where public API or behavior changed.
