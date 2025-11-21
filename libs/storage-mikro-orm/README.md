# MikroORM Storage Adapter

MikroORM-based storage implementation for the CAP NestJS library. Provides
persistent outbox and inbox storage using relational databases (PostgreSQL,
MySQL, SQLite, etc.).

## Installation

```bash
npm install @cap/mikroorm-storage @mikro-orm/core @mikro-orm/nestjs
```

Install the appropriate driver for your database:

```bash
# PostgreSQL
npm install @mikro-orm/postgresql

# MySQL
npm install @mikro-orm/mysql

# SQLite
npm install @mikro-orm/sqlite
```

## Usage

```ts
import { Module } from "@nestjs/common";
import { MikroOrmModule } from "@mikro-orm/nestjs";
import { CapModule } from "@cap/cap-nest";
import { MikroStorageModule } from "@cap/mikroorm-storage";

@Module({
    imports: [
        MikroOrmModule.forRoot({
            type: "postgresql",
            host: "localhost",
            dbName: "capdb",
            entities: ["./dist/**/*.entity.js"],
            entitiesTs: ["./src/**/*.entity.ts"],
        }),
        CapModule.forAdapters(MikroStorageModule, transportModule),
    ],
})
export class AppModule {}
```

## Database Schema

The adapter creates two tables:

### `cap_publish` (Outbox)

- `id` (UUID, PK)
- `topic` (string)
- `payload` (JSON)
- `headers` (JSON, nullable)
- `status` ('published' | 'failed' | null)
- `retryCount` (number)
- `createdAt` (datetime)
- `updatedAt` (datetime)

### `cap_received` (Inbox)

- `id` (UUID, PK)
- `topic` (string)
- `group` (string)
- `payload` (JSON)
- `headers` (JSON, nullable)
- `processed` (boolean)
- `retryCount` (number)
- `nextRetry` (datetime, nullable)
- `createdAt` (datetime)
- `updatedAt` (datetime)

## Migrations

Generate and run migrations to create the schema:

```bash
npx mikro-orm migration:create
npx mikro-orm migration:up
```

## Performance Considerations

- Indexes are created on `status` and `createdAt` for efficient outbox queries
- Indexes are created on `processed` and `nextRetry` for inbox retry queries
- Consider partitioning tables by date for high-volume workloads
- Use connection pooling for optimal database performance
