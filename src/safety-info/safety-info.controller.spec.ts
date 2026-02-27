import { Test, TestingModule } from '@nestjs/testing';
import { SafetyInfoController } from './safety-info.controller';
import { SafetyInfoService } from './safety-info.service';

describe('SafetyInfoController', () => {
  let controller: SafetyInfoController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SafetyInfoController],
      providers: [SafetyInfoService],
    }).compile();

    controller = module.get<SafetyInfoController>(SafetyInfoController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
