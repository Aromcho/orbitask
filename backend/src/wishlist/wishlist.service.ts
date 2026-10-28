import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { Model } from 'mongoose';
import type { CreateWishDto, UpdateWishDto } from './dto/wish.dto.js';
import { type LinkPreview, LinkPreviewService } from './link-preview.service.js';
import { Wish } from './wish.schema.js';

@Injectable()
export class WishlistService {
  private readonly logger = new Logger(WishlistService.name);

  constructor(
    @InjectModel(Wish.name) private readonly wishes: Model<Wish>,
    private readonly linkPreview: LinkPreviewService,
  ) {}

  findAll(userId: string) {
    // Primero lo pendiente, lo más nuevo arriba.
    return this.wishes.find({ userId }).sort({ purchased: 1, createdAt: -1 });
  }

  preview(url: string) {
    return this.linkPreview.fetch(url);
  }

  async create(userId: string, dto: CreateWishDto) {
    if (!dto.url && !dto.title) {
      throw new BadRequestException('Pasá un link o un título');
    }

    // Si hay link y falta info, la completamos con la vista previa.
    let preview: LinkPreview | null = null;
    if (dto.url && (!dto.title || !dto.image)) {
      preview = await this.linkPreview.fetch(dto.url).catch((err: Error) => {
        this.logger.warn(`Sin vista previa para ${dto.url}: ${err.message}`);
        return null;
      });
    }

    return this.wishes.create({
      ...(preview && this.fromPreview(preview)),
      ...dto,
      userId,
      title: dto.title || preview?.title || new URL(dto.url!).hostname,
    });
  }

  async update(userId: string, id: string, dto: UpdateWishDto) {
    const wish = await this.findOne(userId, id);
    if (dto.purchased !== undefined && dto.purchased !== wish.purchased) {
      wish.purchasedAt = dto.purchased ? new Date() : null;
    }
    wish.set(dto);
    return wish.save();
  }

  /** Vuelve a leer el link (por ejemplo, si cambió el precio). */
  async refresh(userId: string, id: string) {
    const wish = await this.findOne(userId, id);
    if (!wish.url) throw new BadRequestException('Este deseo no tiene link');

    const preview = await this.linkPreview.fetch(wish.url);
    wish.set(this.fromPreview(preview));
    return wish.save();
  }

  async remove(userId: string, id: string) {
    const wish = await this.wishes.findOneAndDelete({ _id: id, userId });
    if (!wish) throw new NotFoundException('Deseo no encontrado');
  }

  private fromPreview(preview: LinkPreview): Partial<Wish> {
    return {
      title: preview.title,
      image: preview.image,
      siteName: preview.siteName,
      description: preview.description,
      ...(preview.price !== null && { price: preview.price }),
      ...(preview.currency && { currency: preview.currency }),
    };
  }

  private async findOne(userId: string, id: string) {
    const wish = await this.wishes.findOne({ _id: id, userId });
    if (!wish) throw new NotFoundException('Deseo no encontrado');
    return wish;
  }
}
