import {
  CAP_MESSAGE_ID_HEADER,
  getCapMessageId,
  withCapMessageId,
} from './cap-message-id.util';

describe('cap message id utilities', () => {
  it('adds and reads the cap message id header', () => {
    const headers = withCapMessageId({ traceId: 'trace-1' }, 'message-1');

    expect(headers).toEqual({
      traceId: 'trace-1',
      [CAP_MESSAGE_ID_HEADER]: 'message-1',
    });
    expect(getCapMessageId(headers)).toBe('message-1');
  });
});
