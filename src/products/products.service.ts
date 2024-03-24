import { IsUUID } from 'class-validator';
import { BadRequestException, Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { PaginationDto } from 'src/common/dtos/pagination.dto';
import { validate as isUUID } from 'uuid';
import { PrismaService } from 'src/common/prisma/prisma.service';

@Injectable()
export class ProductsService {
  private readonly logger = new Logger('ProductsService');
  constructor(
    private readonly prisma: PrismaService
  ) {}

  async create(createProductDto: CreateProductDto, user: any) { // Modify 'any' to your 'User' type
    try {
      const { images = [], ...productDetails } = createProductDto;

      const product = await this.prisma.product.create({
        data: {
          ...productDetails,
          images: {
            create: images.map(image => ({ url: image }))
          },
          user: { connect: { id: user.id } } // Update according to your user id field
        },
        include: { images: true }
      });

      return product;
    } catch (error) {
      this.handleDBExceptions(error);
    }
  }

  async findAll(paginationDto: PaginationDto) {
    const { limit = 10, offset = 0 } = paginationDto;

    const products = await this.prisma.product.findMany({
      take: limit,
      skip: offset,
      include: { images: true }
    });

    return products;
  }

  async findOne(term: string) {
    let product;
    if (isUUID(term)) {
      product = await this.prisma.product.findUnique({
        where: { id: term },
        include: { images: true }
      });
    } else {
      product = await this.prisma.product.findFirst({
        where: { OR: [{ title: { equals: term, mode: 'insensitive' }}] },
        include: { images: true }
      });
    }

    if (!product) throw new NotFoundException(`Product with term ${term} not found`);

    return product;
  }

  /*async findOnePlain(term: string) {
    const {images=[], ...product} = await this.findOne(term);
    return {
      ...product,
      images: images.map(image => image.url)
    }
  }*/

  async update(id: string, updateProductDto: UpdateProductDto, user: any) { // Modify 'any' to your 'User' type
    const { images, ...productToUpdate } = updateProductDto;

    const product = await this.prisma.product.update({
      where: { id },
      data: {
        ...productToUpdate,
        user: { connect: { id: user.id } }, // Update according to your user id field
        images: {
          deleteMany: {}, // Deletes all existing images
          create: images.map(image => ({ url: image })), // Creates new images
        },
      },
      include: { images: true }
    });

    if (!product) throw new NotFoundException(`Product with id: ${id} not found`);

    return product;
  }

  async remove(id: string) {
    await this.prisma.product.delete({
      where: { id },
    });
  }

  async deleteAllProducts() {
    try {
      return await this.prisma.product.deleteMany();
    } catch (error) {
      this.handleDBExceptions(error);
    }
  }

  private handleDBExceptions(error: any): never {
    if (error.code === 'P2002') {
        throw new BadRequestException('A conflict occurred with an existing record.');
    }
    this.logger.error(error);
    throw new InternalServerErrorException('Unexpected error, check server logs');
  }
}
