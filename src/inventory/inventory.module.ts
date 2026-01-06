import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { InventoryService } from "./inventory.service";
import { InventoryController } from "./inventory.controller";
import { Inventory } from "../entities/inventory.entity";
import { AuthModule } from "../auth/auth.module";
import { User } from "../entities/user.entity";

@Module({
  imports: [TypeOrmModule.forFeature([Inventory, User]), AuthModule],
  controllers: [InventoryController],
  providers: [InventoryService],
  exports: [InventoryService, TypeOrmModule],
})
export class InventoryModule {}
