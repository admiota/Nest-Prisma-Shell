import { Module } from '@nestjs/common';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { AuthModule } from 'src/auth/auth.module';
import { PrismaModule } from 'src/common/prisma/prisma.module';

@Module({
  controllers: [ProductsController],
  providers: [ProductsService],
  imports: [AuthModule, PrismaModule],
  exports: [
    ProductsService
  ]
})
export class ProductsModule {}
