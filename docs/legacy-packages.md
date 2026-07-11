# Legacy npm Package Names

The following deprecated `@cap/*` npm identities are historical names for
current CAP Node.js packages. They are not separate implementations and should
not be used by new applications.

| Deprecated package                    | Canonical replacement                          |
| ------------------------------------- | ---------------------------------------------- |
| `@cap/cap-nest`                       | `@mikara89/cap-nest`                           |
| `@cap/cap-dashboard`                  | `@mikara89/cap-dashboard-nest`                 |
| `@cap/mikroorm-storage`               | `@mikara89/cap-storage-mikro-orm`              |
| `@cap/azure-servicebus-transport`     | `@mikara89/cap-transport-azure-servicebus`     |
| `@cap/nestjs-microservices-transport` | `@mikara89/cap-transport-nestjs-microservices` |

Update imports and dependencies to the canonical names. The repository keeps
the current `libs/cap-dashboard` folder because it publishes
`@mikara89/cap-dashboard`, a compatibility alias for the current Nest dashboard
package. It is not the deprecated `@cap/cap-dashboard` package.

Historical changelog and migration references are retained for upgrade context.
Active source, configuration, examples, package manifests, and current package
READMEs are checked by `npm run verify:legacy-package-names`.
