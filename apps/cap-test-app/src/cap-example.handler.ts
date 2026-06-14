import { Injectable, Logger } from '@nestjs/common';
import { CapSubscribe, CapHeaders } from '@mikara89/cap-nest';

@Injectable()
export class CapExampleHandler {
  private readonly log = new Logger(CapExampleHandler.name);

  @CapSubscribe({ topic: 'example.topic', group: 'example-group' })
  async onExample(payload: unknown, headers?: CapHeaders): Promise<void> {
    this.log.log(
      `CapExampleHandler received payload: ${JSON.stringify(payload)} and headers: ${JSON.stringify(headers)}`,
    );
    if (payload && typeof payload === 'object' && 'fail' in payload) {
      const maybeFailingPayload = payload as { fail?: boolean };
      if (maybeFailingPayload.fail) {
        throw new Error('Demo handler failure requested');
      }
    }
    return Promise.resolve();
  }
  @CapSubscribe({ topic: 'example.topic2', group: 'example-group' })
  async onExample2(payload: unknown, headers?: CapHeaders): Promise<void> {
    this.log.log(
      `CapExampleHandler received payload: ${JSON.stringify(payload)} and headers: ${JSON.stringify(headers)}`,
    );
    return Promise.resolve();
  }
  @CapSubscribe({ topic: 'example.topic3', group: 'example-group' })
  async onExample3(payload: unknown, headers?: CapHeaders): Promise<void> {
    this.log.log(
      `CapExampleHandler received payload: ${JSON.stringify(payload)} and headers: ${JSON.stringify(headers)}`,
    );
    return Promise.resolve();
  }
}
