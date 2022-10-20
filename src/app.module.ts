import { HelmetMiddleware } from '@nest-middlewares/helmet';
import { MiddlewareConsumer, Module, NestModule, RequestMethod} from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { logger } from './middlewares/logger.middleware';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { PassportModule } from '@nestjs/passport';
import { HttpModule } from '@nestjs/axios';
import { PrismaModule } from './prisma/prisma.module';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { MessagesModule } from './messages/messages.module';

@Module({
  imports: [
    HttpModule,
    ConfigModule.forRoot({ isGlobal: true}),
    PassportModule.register({session: true}),
    PrismaModule,
    AuthModule,
    UserModule,
    MessagesModule,
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'avatar'),
      serveStaticOptions: {
        setHeaders: (res, path, stat) => {
          res.set('Access-Control-Allow-Origin', '*');
        }
      }
    })],
  controllers: [AppController],
  providers: [AppService],
  exports: [AppService]
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): any {
    consumer
      .apply(logger).forRoutes('')
      .apply(HelmetMiddleware).forRoutes('')
    ;
  }
}
