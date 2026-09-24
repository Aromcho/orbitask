import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { LinkPreviewService } from './link-preview.service.js';
import { Wish, WishSchema } from './wish.schema.js';
import { WishlistController } from './wishlist.controller.js';
import { WishlistService } from './wishlist.service.js';

@Module({
  imports: [MongooseModule.forFeature([{ name: Wish.name, schema: WishSchema }])],
  controllers: [WishlistController],
  providers: [WishlistService, LinkPreviewService],
})
export class WishlistModule {}
