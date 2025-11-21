import { Injectable, Logger } from '@nestjs/common';
import { CapSubscribe } from '@cap/cap-nest';

@Injectable()
export class CapExampleHandler {
  private readonly log = new Logger(CapExampleHandler.name);

  @CapSubscribe({ topic: 'example.topic', group: 'example-group' })
  async onExample(payload: unknown): Promise<void> {
    this.log.log(
      `CapExampleHandler received payload: ${JSON.stringify(payload)}`,
    );
    return Promise.resolve();
  }
}
