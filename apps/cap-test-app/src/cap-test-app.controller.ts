import { Controller, Get, Post, Query } from '@nestjs/common';
import { CapTestAppService } from './cap-test-app.service';
import {
  CapService,
  JsonValue,
  withTransactionAndPostCommit,
} from '@mikara89/cap-nest';
import { MikroORM } from '@mikro-orm/core';

type PostCommitItem = { topic: string; payload: JsonValue };

@Controller()
export class CapTestAppController {
  private shouldFailNextHandler = false;

  constructor(
    private readonly capTestAppService: CapTestAppService,
    private readonly cap: CapService,
    private readonly orm: MikroORM,
  ) {}

  @Get()
  getHello(): string {
    return this.capTestAppService.getHello();
  }

  @Get('demo/health')
  getDemoHealth(): {
    ok: boolean;
    transport: 'servicebus' | 'local';
    dashboardApi: string;
    dashboardUi: string;
  } {
    return {
      ok: true,
      transport:
        process.env.SERVICEBUS_CONNECTION_STRING ||
        process.env.AZURE_SERVICEBUS_CONNECTION_STRING
          ? 'servicebus'
          : 'local',
      dashboardApi: '/api/cap',
      dashboardUi: '/cap-dashboard',
    };
  }

  // Example publish endpoint: /publish?msg=hello
  @Get('publish')
  async publishExample(@Query('msg') msg = 'hello'): Promise<{ ok: boolean }> {
    return this.publishDemo(msg);
  }

  @Post('demo/publish')
  async publishDemo(@Query('msg') msg = 'hello'): Promise<{ ok: boolean }> {
    await this.cap.publish('example.topic', {
      text: msg,
      fail: this.shouldFailNextHandler,
    });
    this.shouldFailNextHandler = false;
    return { ok: true };
  }

  @Post('demo/fail-next-handler')
  failNextHandler(): { ok: boolean } {
    this.shouldFailNextHandler = true;
    return { ok: true };
  }

  // Transactional publish: message is published only after DB commit.
  // Use `?withError=true` to simulate a rollback (message won't be published).
  @Get('publish-tx')
  async publishTransactional(
    @Query('msg') msg = 'hello',
    @Query('withError') withError?: string,
  ): Promise<{ ok: boolean }> {
    return this.publishDemoTransactional(msg, withError);
  }

  @Post('demo/publish-transactional')
  async publishDemoTransactional(
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
          await this.cap.publish(it.topic, it.payload);
        }
      },
    );

    return { ok: true };
  }
}
