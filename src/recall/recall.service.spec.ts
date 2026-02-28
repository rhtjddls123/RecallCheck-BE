import { Test, TestingModule } from '@nestjs/testing';
import { RecallService } from './recall.service';

describe('RecallService', () => {
  let service: RecallService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RecallService],
    }).compile();

    service = module.get<RecallService>(RecallService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
