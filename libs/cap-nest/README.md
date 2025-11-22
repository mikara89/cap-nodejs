# cap-nest (library)

This library implements a Cloud Access Pattern (CAP) for NestJS providing an
outbox/inbox pattern with pluggable storage and transport adapters.

Quick guide for contributors

- Tokens & interfaces
  - `PUBLISH_STORAGE` / `RECEIVED_STORAGE` (from
    `abstractions/storage.interface.ts`): implement `IPublishStorage` /
    `IReceivedStorage`.
  - `PUBLISHER` / `SUBSCRIBER` (from `abstractions/transport.interface.ts`):
    implement `IPublisher` / `ISubscriber`.

- Adapter provider shape
  - Adapters should export a `providers` array (Nest `Provider[]`).
  - A Value, Class, or Factory provider is accepted as long as one of the
    providers in the array binds the required token(s). Example:

    ```ts
    export const providers = [
      { provide: PUBLISH_STORAGE, useClass: TypeOrmPublishStorage },
      { provide: RECEIVED_STORAGE, useClass: TypeOrmReceivedStorage },
      { provide: PUBLISHER, useClass: RabbitPublisher },
      { provide: SUBSCRIBER, useExisting: PUBLISHER },
    ];
    ```

- `@CapSubscribe` and DTOs
  - Use `@CapSubscribe({ topic, group, dto })` to annotate handler methods.
  - `dto` must be a `new () => T` constructor (class) so `CapValidatePipe` can
    instantiate and validate it.

- Testing helpers
  - The library contains typed test helpers under
    `src/cap/testing/test-helpers.ts` used by specs to reduce `any` usage.

- TypeScript strictness
  - `libs/cap-nest/tsconfig.lib.json` has stricter compiler options enabled
    (`strict`, `noImplicitAny`) to improve library quality.
  - When modifying public APIs or adapters, run the library build and unit
    tests:

    ```powershell
    npm run build
    npm test
    ```

- Adding adapters
  1. Implement storage/transport classes that conform to the interfaces in
     `abstractions/`.
  2. Export a `providers` array with appropriate `provide` tokens.
  3. Register your module with `CapModule.forAdapters()`.

- Initialization options (new)
  - The module supports an optional `init` object that lets adapters perform
    one-time setup during application bootstrap (create DB schema, create
    queues/topics, run migrations, etc.). The shape is defined as `InitOptions`
    in `abstractions/initializer.interface.ts` with flags:
    - `autoInit?: boolean` — shorthand to request default initialization.
    - `createSchema?: boolean` — storage adapters should create schema/tables.
    - `createQueues?: boolean` — transport adapters should create queues/topics.

  - Usage examples:

    ```ts
    // using raw provider arrays
    CapModule.forRoot({
      storage: storageProviders,
      transport: transportProviders,
      init: { createSchema: true, createQueues: true },
    });

    // using adapter modules convenience helper
    CapModule.forAdapters(
      StorageAdapterModule,
      TransportAdapterModule,
      { createSchema: true }, // forwarded to forRoot()
    );
    ```

  - Notes:
    - Adapters opt-in by implementing an
      `initialize(options?: InitOptions): Promise<void>` method on the classes
      they expose (e.g. your `useClass` implementations).
    - The core module will detect `initialize` and call it with the `init`
      options if provided. Adapters that don't implement `initialize` are
      unaffected.

- Contributing
  - Keep runtime library code free of `any` where possible; use `unknown` for
    opaque payload types and narrow with type guards.
  - Tests may use typed fixtures and minimal `as any` casts for Nest shims;
    prefer the `test-helpers` utilities.

If you'd like, I can also add a `CONTRIBUTING.md` with PR template and checklist
for upgrading adapter typings and enabling repo-wide strict flags.
