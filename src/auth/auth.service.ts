import { BadRequestException, Injectable, InternalServerErrorException, Logger, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { LoginUserDto, CreateUserDto } from './dto';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from 'src/common/prisma/prisma.service';

@Injectable()
export class AuthService {
  logger = new Logger();

  constructor(
    private readonly prismaService: PrismaService,
    private readonly jwtService: JwtService
  ) { }
  
  async create(createUserDto: CreateUserDto) {
    try {
        const { password, ...userData } = createUserDto;

        const user = await this.prismaService.user.create({
            data: {
                ...userData,
                password: bcrypt.hashSync(password, 10),
            },
        });
        delete user.password;
        return {
            ...user,
            token: this.getJwtToken({ id: user.id }),
        };
    } catch (error) {
        this.handleDBExceptions(error);
    }
}



  async login(loginUserDto: LoginUserDto) {
    const { email, password } = loginUserDto;
    const user = await this.prismaService.user.findUnique({
        where: { email },
        select: { id: true, email: true, password: true },
    });

    if (!user) throw new UnauthorizedException('Credentials are not valid (email)');
    if (!bcrypt.compareSync(password, user.password)) throw new UnauthorizedException('Credentials are not valid (password)');

    delete user.password; // Make sure to remove the password from the response
    return {
        ...user,
        token: this.getJwtToken({ id: user.id }),
    };
  }


  async checkAuthStatus(user:any) {
    return {
      ...user,
      token: this.getJwtToken({id: user.id})
    };
  }

  private getJwtToken(payload: JwtPayload) {
    const token = this.jwtService.sign(payload);
    return token;
  }

  private handleDBExceptions(error: any): never {
    if (error.code === 'P2002') {
        throw new BadRequestException('A conflict occurred with an existing record.');
    }
    this.logger.error(error);
    throw new InternalServerErrorException('Unexpected error, check server logs');
  }

}
