import { Test, type TestingModule } from '@nestjs/testing';
import { CapTestAppController } from './cap-test-app.controller';
import { CapTestAppService } from './cap-test-app.service';
import { CapService } from '@cap/cap-nest';

describe('CapTestAppController', () => {
  let capTestAppController: CapTestAppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [CapTestAppController],
      providers: [
        CapTestAppService,
        { provide: CapService, useValue: { publish: jest.fn() } },
      ],
    }).compile();

    capTestAppController = app.get<CapTestAppController>(CapTestAppController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(capTestAppController.getHello()).toBe('Hello World!');
    });
  });
});
