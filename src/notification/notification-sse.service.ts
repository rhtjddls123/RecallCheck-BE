import { Injectable } from '@nestjs/common';
import { Subject } from 'rxjs';

@Injectable()
export class NotificationSseService {
  // userId별로 Subject 관리
  private clients = new Map<number, Subject<any>>();

  // 유저 연결 시 Subject 생성
  connect(userId: number): Subject<any> {
    const subject = new Subject();
    this.clients.set(userId, subject);
    return subject;
  }

  // 유저 연결 해제 시 Subject 제거
  disconnect(userId: number) {
    this.clients.get(userId)?.complete();
    this.clients.delete(userId);
  }

  // 알림 전송
  send(userId: number, data: unknown) {
    this.clients.get(userId)?.next({ data: JSON.stringify(data) });
  }
}
