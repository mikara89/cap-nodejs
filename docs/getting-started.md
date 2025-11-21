# Getting Started — CAP NestJS Library

Quick start to use the CAP library in a NestJS application.

1. Install (if using this monorepo, add the library via workspace path)

2. Use the in-memory bundle for local development or tests

```ts
import { Module } from "@nestjs/common";
import { CapModule } from "@cap/cap-nest";

@Module({
    imports: [CapModule.forInMemory()],
})
export class AppModule {}
```

3. Publish a message via `CapService`

```ts
// in a controller or service
constructor(private readonly cap: CapService) {}

await this.cap.publish('user.created', { id: 'u1', name: 'Alice' });
```

4. Subscribe using `@CapSubscribe`

```ts
import { CapSubscribe } from "@cap/cap-nest";

class ExampleHandler {
    @CapSubscribe({ topic: "user.created", group: "mail-service" })
    async handle(payload: any) {
        // process
    }
}
```

5. For production use adaptors: implement and provide `PUBLISH_STORAGE`,
   `RECEIVED_STORAGE`, `PUBLISHER`, `SUBSCRIBER` and use
   `CapModule.forRoot(...)` or `forAdapters()`.
