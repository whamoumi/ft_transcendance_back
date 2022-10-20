import { Module } from '@nestjs/common';
import { MessagesService } from './messages.service';
import { MessagesGateway } from './messages.gateway';
import { UserService } from 'src/user/user.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { JwtStrategy } from 'src/auth/Strategy/jwt.strategy';
import { AuthService } from 'src/auth/auth.service';
import { JwtModule } from '@nestjs/jwt';

@Module({
  providers: [MessagesGateway, MessagesService, UserService, PrismaService, JwtStrategy, {
      provide: 'AUTH_SERVICE',
      useClass: AuthService}],
  imports: [JwtModule.register({
			secret: process.env.SECRET_JWT,
			signOptions: { expiresIn: '1d' },
		})]
})
export class MessagesModule {}
