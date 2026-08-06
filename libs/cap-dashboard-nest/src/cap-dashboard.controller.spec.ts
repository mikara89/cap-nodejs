import { Test } from '@nestjs/testing';

describe('CapDashboardController (stub)', () => {
  it('creates testing module', async () => {
    const moduleRef = await Test.createTestingModule({}).compile();
    expect(moduleRef).toBeDefined();
  });
});
