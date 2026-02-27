import { Test, TestingModule } from '@nestjs/testing';
import { Consumer24Service } from './consumer24.service';

describe('Consumer24Service', () => {
  let service: Consumer24Service;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [Consumer24Service],
    }).compile();

    service = module.get<Consumer24Service>(Consumer24Service);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
