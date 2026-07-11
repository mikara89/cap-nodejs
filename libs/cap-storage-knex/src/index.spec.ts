describe('@mikara89/cap-storage-knex root exports', () => {
  it('loads without reaching the optional NestJS integration', () => {
    jest.isolateModules(() => {
      jest.doMock('@nestjs/common', () => {
        throw new Error('NestJS must not be loaded by the package root');
      });
      expect(() => jest.requireActual('./index')).not.toThrow();
    });
  });
});
