import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post } from '@nestjs/common';
import { ParseObjectIdPipe } from '@nestjs/mongoose';
import { CreateWishDto, PreviewLinkDto, UpdateWishDto } from './dto/wish.dto.js';
import { WishlistService } from './wishlist.service.js';

@Controller('wishlist')
export class WishlistController {
  constructor(private readonly wishlist: WishlistService) {}

  @Get()
  findAll() {
    return this.wishlist.findAll();
  }

  /** El front lo llama al pegar un link, para mostrar la tarjeta antes de guardar. */
  @Post('preview')
  @HttpCode(200)
  preview(@Body() dto: PreviewLinkDto) {
    return this.wishlist.preview(dto.url);
  }

  @Post()
  create(@Body() dto: CreateWishDto) {
    return this.wishlist.create(dto);
  }

  @Patch(':id')
  update(@Param('id', ParseObjectIdPipe) id: string, @Body() dto: UpdateWishDto) {
    return this.wishlist.update(id, dto);
  }

  @Post(':id/refresh')
  @HttpCode(200)
  refresh(@Param('id', ParseObjectIdPipe) id: string) {
    return this.wishlist.refresh(id);
  }

  @Delete(':id')
  @HttpCode(204)
  remove(@Param('id', ParseObjectIdPipe) id: string) {
    return this.wishlist.remove(id);
  }
}
