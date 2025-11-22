import { Controller, Get, Query } from '@nestjs/common';
import { CapTestAppService } from './cap-test-app.service';
import { CapService, withTransactionAndPostCommit } from '@cap/cap-nest';
import { MikroORM } from '@mikro-orm/core';

type PostCommitItem = { topic: string; payload: unknown };

@Controller()
export class CapTestAppController {
  constructor(
    private readonly capTestAppService: CapTestAppService,
    private readonly cap: CapService,
    private readonly orm: MikroORM,
  ) {}

  @Get()
  getHello(): string {
    return this.capTestAppService.getHello();
  }

  // Example publish endpoint: /publish?msg=hello
  @Get('publish')
  async publishExample(@Query('msg') msg = 'hello'): Promise<{ ok: boolean }> {
    return await this.orm.em.transactional(async (em) => {
      await this.cap.publish('example.topic', { text: msg }, undefined, em);
      // throw new Error('simulated error to test transaction rollback');
      return { ok: true };
    });
  }

  // Transactional publish: message is published only after DB commit.
  // Use `?withError=true` to simulate a rollback (message won't be published).
  @Get('publish-tx')
  async publishTransactional(
    @Query('msg') msg = 'hello',
    @Query('withError') withError?: string,
  ): Promise<{ ok: boolean }> {
    await withTransactionAndPostCommit<void, PostCommitItem>(
      this.orm,
      async (_em, queueForPostCommit) => {
        // register a post-commit action to publish the message
        queueForPostCommit({ topic: 'example.topic', payload: { text: msg } });

        // simulate an error to force rollback when query param `withError` is present
        if (withError) {
          throw new Error('simulated transaction error');
        }

        // ensure async signature
        await Promise.resolve();
        return undefined;
      },
      async (items: PostCommitItem[]) => {
        for (const it of items) {
          await this.cap.publish(it.topic, it.payload, { tx: 'true' });
        }
      },
    );

    return { ok: true };
  }
}
