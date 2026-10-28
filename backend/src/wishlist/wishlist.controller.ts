import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post } from '@nestjs/common';
import { ParseObjectIdPipe } from '@nestjs/mongoose';
import { CurrentUser } from '../auth/current-user.decorator.js';
import type { JwtPayload } from '../auth/auth.types.js';
import { CreateWishDto, PreviewLinkDto, UpdateWishDto } from './dto/wish.dto.js';
import { WishlistService } from './wishlist.service.js';

@Controller('wishlist')
export class WishlistController {
  constructor(private readonly wishlist: WishlistService) {}

  @Get()
  findAll(@CurrentUser() user: JwtPayload) {
    return this.wishlist.findAll(user.sub);
  }

  /** El front lo llama al pegar un link, para mostrar la tarjeta antes de guardar. */
  @Post('preview')
  @HttpCode(200)
  preview(@Body() dto: PreviewLinkDto) {
    return this.wishlist.preview(dto.url);
  }

  @Post()
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreateWishDto) {
    return this.wishlist.create(user.sub, dto);
  }

  @Patch(':id')
  update(@CurrentUser() user: JwtPayload, @Param('id', ParseObjectIdPipe) id: string, @Body() dto: UpdateWishDto) {
    return this.wishlist.update(user.sub, id, dto);
  }

  @Post(':id/refresh')
  @HttpCode(200)
  refresh(@CurrentUser() user: JwtPayload, @Param('id', ParseObjectIdPipe) id: string) {
    return this.wishlist.refresh(user.sub, id);
  }

  @Delete(':id')
  @HttpCode(204)
  remove(@CurrentUser() user: JwtPayload, @Param('id', ParseObjectIdPipe) id: string) {
    return this.wishlist.remove(user.sub, id);
  }
}
