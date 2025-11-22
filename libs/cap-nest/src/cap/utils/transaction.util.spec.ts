import { withTransactionAndPostCommit } from './transaction.util';

describe('withTransactionAndPostCommit', () => {
  it('queues items during transaction and runs afterCommitFn after commit', async () => {
    const calls: string[] = [];

    // fake orm that provides em.transactional
    const orm: any = {
      em: {
        transactional: async (fn: (em: any) => Promise<any>) => {
          const em = { __em: true };
          calls.push('transaction-start');
          const res = await fn(em);
          calls.push('transaction-end');
          return res;
        },
      },
    };

    const storage = {
      savePublishWithTx: jest.fn().mockResolvedValue('saved-id'),
    };

    const publisher = { emit: jest.fn().mockResolvedValue(undefined) };

    const evt = { id: 'evt-1' };

    await withTransactionAndPostCommit(
      orm,
      async (em, queueForPostCommit) => {
        // inside txn: persist with tx and queue the send
        await (storage as any).savePublishWithTx(evt, em);
        queueForPostCommit({ topic: 'topic.x', payload: { id: evt.id } });
        // assert that emit hasn't been called yet
        expect(publisher.emit).not.toHaveBeenCalled();
        calls.push('queued');
        return 'ok';
      },
      async (items: any[]) => {
        calls.push('after-commit-start');
        for (const it of items) {
          await publisher.emit(it.topic, it.payload);
        }
        calls.push('after-commit-end');
      },
    );

    // verify sequence and calls
    expect(storage.savePublishWithTx).toHaveBeenCalledWith(
      evt,
      expect.any(Object),
    );
    expect(publisher.emit).toHaveBeenCalledWith('topic.x', { id: evt.id });
    // verify ordering: transaction-start -> queued -> transaction-end -> after-commit-start
    expect(calls).toEqual([
      'transaction-start',
      'queued',
      'transaction-end',
      'after-commit-start',
      'after-commit-end',
    ]);
  });
});
