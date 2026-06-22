import { normalizeError } from './error.util';

describe('normalizeError', () => {
  it('preserves Error messages and stringifies non-Error values', () => {
    expect(normalizeError(new Error('boom'))).toBe('boom');
    expect(normalizeError('plain')).toBe('plain');
  });
});
