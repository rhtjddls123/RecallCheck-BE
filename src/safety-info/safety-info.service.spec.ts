import { Test, TestingModule } from '@nestjs/testing';
import { SafetyInfoService } from './safety-info.service';

describe('SafetyInfoService', () => {
  let service: SafetyInfoService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SafetyInfoService],
    }).compile();

    service = module.get<SafetyInfoService>(SafetyInfoService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
