import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { JwtPayload } from "../interfaces/jwt-payload.interface";
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from 'src/common/prisma/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(
        private readonly prismaService: PrismaService,
        configService:ConfigService
    ) {
        super({
            secretOrKey: configService.get('JWT_SECRET'),
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken()
        });
    }

    async validate(payload: JwtPayload): Promise<any> { // Change return type if you have a custom User model
        const { id } = payload;
        const user = await this.prismaService.user.findUnique({
            where: { id },
        });

        if (!user) throw new UnauthorizedException('Token not valid');

        if (!user.isActive) throw new UnauthorizedException('User is inactive, talk with an admin');

        return user; // Return the user object (make sure to adhere to any expected interface or type)
    }
}