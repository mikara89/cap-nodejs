import { CapModule } from './cap.module';

describe('CapModule.forRoot module imports', () => {
  it('keeps adapter modules as real Nest imports', () => {
    const adaptersModule = { module: class TestAdaptersModule {} };

    const dm = CapModule.forRoot({
      imports: [adaptersModule],
      scheduler: { disabled: true },
    });

    expect(dm.imports).toContain(adaptersModule);
    expect(dm.providers).toBeDefined();
  });
});
