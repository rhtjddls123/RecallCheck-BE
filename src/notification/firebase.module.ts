import { Global, Module } from '@nestjs/common';
import { initializeApp, cert, ServiceAccount } from 'firebase-admin/app';
import { getMessaging } from 'firebase-admin/messaging';

@Global()
@Module({
  providers: [
    {
      provide: 'FIREBASE_ADMIN',
      useFactory: () => {
        const serviceAccount = JSON.parse(
          process.env.FIREBASE_SERVICE_ACCOUNT ?? '',
        ) as ServiceAccount;

        const app = initializeApp({
          credential: cert(serviceAccount),
        });

        return getMessaging(app);
      },
    },
  ],
  exports: ['FIREBASE_ADMIN'],
})
export class FirebaseModule {}
