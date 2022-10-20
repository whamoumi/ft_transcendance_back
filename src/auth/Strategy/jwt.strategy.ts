import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException, Inject} from '@nestjs/common';
import { AuthService } from '../auth.service';
import { UserService } from 'src/user/user.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(@Inject('AUTH_SERVICE')
  private authservice: AuthService,
  private userservice: UserService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.SECRET_JWT,
    });
  }

  async validate(payload: any) {
    const isin = await this.authservice.findUserByIdDb(payload.sub)  
    if (!isin)
      return null;
    return {payload};
  }
}