import { Injectable } from '@nestjs/common';
import { ProductsService } from 'src/products/products.service';
import { initialData } from './data/seed-data';
import { PrismaService } from 'src/common/prisma/prisma.service';

@Injectable()
export class SeedService {
  constructor(
    private readonly productsService: ProductsService,
    private readonly prisma: PrismaService
  ) {
    
  }


  async runSeed() {
    await this.deleteTables();
    const adminUser = await this.insertUsers();
    await this.insertNewProducts(adminUser);
    return 'SEED EXECUTED';
  }

  private async deleteTables() {
    // Call a specific method from the productsService that utilizes Prisma to delete all products
    await this.productsService.deleteAllProducts();

    // Use Prisma to delete all users
    await this.prisma.user.deleteMany({});
  }

  private async insertUsers() {
    const seedUsers = initialData.users;
    
    // Insert users and return the first one (assuming this is the admin for this context)
    const dbUsers = await this.prisma.user.createMany({
      data: seedUsers,
    });

    // Since createMany does not return the inserted objects, if you need the first user, 
    // you might need to fetch it explicitly assuming you have a field to identify it like 'email' or 'username'.
    const adminUser = await this.prisma.user.findFirst({
      where: { email: seedUsers[0].email }, // or any unique identifier
    });

    return adminUser;
  }
  

  private async insertNewProducts(user: any) { // Replace 'any' with your User type
    await this.productsService.deleteAllProducts(); // Assuring the table is empty before inserting new data
    const seedProducts = initialData.products;
    
    const insertPromises = seedProducts.map(product => 
      this.productsService.create(product, user)
    );

    await Promise.all(insertPromises);
    return true;
  }
}
