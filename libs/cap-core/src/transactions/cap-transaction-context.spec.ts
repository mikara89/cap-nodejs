import { CapTransactionContext } from './cap-transaction-context';

describe('CapTransactionContext', () => {
  it('run makes current context available inside callback', async () => {
    const transactionContext = new CapTransactionContext();
    const ctx = { tx: { id: 'tx-1' } };

    await expect(
      transactionContext.run(ctx, () =>
        Promise.resolve(transactionContext.current()),
      ),
    ).resolves.toBe(ctx);
  });

  it('current returns undefined outside callback', () => {
    const transactionContext = new CapTransactionContext();

    expect(transactionContext.current()).toBeUndefined();
  });

  it('nested contexts do not leak into each other', async () => {
    const transactionContext = new CapTransactionContext();
    const outer = { tx: { id: 'outer' } };
    const inner = { tx: { id: 'inner' } };

    await transactionContext.run(outer, async () => {
      expect(transactionContext.current()).toBe(outer);

      await transactionContext.run(inner, () => {
        expect(transactionContext.current()).toBe(inner);
        return Promise.resolve();
      });

      expect(transactionContext.current()).toBe(outer);
    });

    expect(transactionContext.current()).toBeUndefined();
  });

  it('parallel contexts do not leak into each other', async () => {
    const transactionContext = new CapTransactionContext();
    const first = { tx: { id: 'first' } };
    const second = { tx: { id: 'second' } };

    const [firstSeen, secondSeen] = await Promise.all([
      transactionContext.run(first, async () => {
        await wait(5);
        return transactionContext.current();
      }),
      transactionContext.run(second, async () => {
        await wait(1);
        return transactionContext.current();
      }),
    ]);

    expect(firstSeen).toBe(first);
    expect(secondSeen).toBe(second);
    expect(transactionContext.current()).toBeUndefined();
  });
});

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
