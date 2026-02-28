import { Test, TestingModule } from '@nestjs/testing';
import { RecallController } from './recall.controller';
import { RecallService } from './recall.service';

describe('RecallController', () => {
  let controller: RecallController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RecallController],
      providers: [RecallService],
    }).compile();

    controller = module.get<RecallController>(RecallController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
