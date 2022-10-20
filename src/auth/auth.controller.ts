import { Controller, Get, UseGuards, Req, Res, Inject, Post, Body, Param, Put, Delete } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport'
import { from } from 'rxjs';
import { AuthService } from './auth.service';
import { UserService } from '../user/user.service';

@Controller('auth')
export class AuthController {
	
	constructor(@Inject('AUTH_SERVICE')
	private authservice: AuthService) { }
	private userservice:UserService
	
	@Put('2fa/:id')
	async twoFactorCreate(@Param('id') id) {
		return this.authservice.twoFactorCreate(parseInt(id))
		//stocker le code dans la db
	}

	@Delete('2fa/:id')
	async twoFactorRemove(@Param('id') id) {
		return this.authservice.twoFactorRemove(parseInt(id))
	}

	@Post('2fa')
	async twoFactorVerify(@Body() body) {
		let user = await this.authservice.twoFactorVerify(body)
		// if (!user)
		// {
		// 	res.sendStatus(401);
		// 	return ;	
		// }	
		let json_response = await this.authservice.jwtGeneration(user, false)
		return {jwt: json_response,
			id: user.id,
			username: user.username,
			picture: user.picture,
			profile_completed: true,
			twofa_enabled: true,
			twovalid:true
		};
	}
  	@Post('42')
  	async login_auth(@Body() body) {
  		let user = await this.authservice.send(body.code);
		let find = await this.authservice.findOne(user.id)
		let json_response;
		let twofa=false
		if (find.isTwoFactorEnabled == true)
		{
  	  		json_response = await this.authservice.jwtGeneration(user, true)
			twofa = true
		}
		else
		{
  	  		json_response = await this.authservice.jwtGeneration(user, false)
		}
  	  	return {
			jwt: json_response,
			id: user.id,
			username: user.username,
			picture: user.picture,
			profile_completed: user.profile_completed,
			twofa_enabled: twofa,
			twovalid:false
		};
 	 }
	@Get('user:id')
  	async user_tfa(@Param('id') id) {
		let user = await this.userservice.findOne(id);
		return user
		};
}