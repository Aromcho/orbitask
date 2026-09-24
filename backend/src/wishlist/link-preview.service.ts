import { BadGatewayException, Injectable } from '@nestjs/common';
import { type CheerioAPI, load } from 'cheerio';

export interface LinkPreview {
  url: string;
  title: string;
  description: string;
  image: string;
  siteName: string;
  price: number | null;
  currency: string | null;
}

// Muchos sitios devuelven una página vacía si no parece un navegador.
const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0 Safari/537.36';
const TIMEOUT_MS = 8000;
const MAX_HTML_CHARS = 1_500_000;
const BLOCKED_PATTERN = /account-verification|validateCaptcha|captcha-delivery|cf-challenge/i;

type JsonLd = Record<string, any>;

/**
 * Descarga una página y saca título, imagen y precio de sus metadatos:
 * Open Graph (og:*), Twitter cards y JSON-LD de tipo Product (lo usan
 * Mercado Libre, Amazon, la mayoría de las tiendas).
 */
@Injectable()
export class LinkPreviewService {
  async fetch(rawUrl: string): Promise<LinkPreview> {
    let res: Response;
    try {
      res = await fetch(rawUrl, {
        redirect: 'follow',
        signal: AbortSignal.timeout(TIMEOUT_MS),
        headers: {
          'user-agent': USER_AGENT,
          accept: 'text/html,application/xhtml+xml',
          'accept-language': 'es-AR,es;q=0.9,en;q=0.8',
        },
      });
    } catch {
      throw new BadGatewayException('No se pudo acceder al link');
    }
    if (!res.ok) throw new BadGatewayException(`El sitio respondió ${res.status}`);

    const finalUrl = res.url || rawUrl;
    const html = (await res.text()).slice(0, MAX_HTML_CHARS);
    // Algunas tiendas (ej. Mercado Libre) redirigen a un captcha cuando no ven un navegador real.
    if (BLOCKED_PATTERN.test(finalUrl) || BLOCKED_PATTERN.test(html.slice(0, 5000))) {
      throw new BadGatewayException('El sitio bloquea las vistas previas: completá los datos a mano');
    }
    const $ = load(html);
    const product = findJsonLdProduct($);
    const offer: JsonLd | undefined = [product?.offers].flat()[0];

    const meta = (...names: string[]) => {
      for (const name of names) {
        const value = $(`meta[property="${name}"], meta[name="${name}"], meta[itemprop="${name}"]`)
          .attr('content')
          ?.trim();
        if (value) return value;
      }
      return '';
    };

    const image =
      meta('og:image:secure_url', 'og:image', 'twitter:image', 'twitter:image:src') ||
      firstString(product?.image) ||
      $('link[rel="image_src"]').attr('href') ||
      $('#landingImage').attr('data-old-hires') || // Amazon
      $('#landingImage').attr('src') ||
      '';

    return {
      url: finalUrl,
      title:
        meta('og:title', 'twitter:title') ||
        product?.name ||
        $('title').first().text().trim() ||
        new URL(finalUrl).hostname,
      description: meta('og:description', 'twitter:description', 'description').slice(0, 300),
      image: image ? toAbsolute(image, finalUrl) : '',
      siteName: meta('og:site_name') || new URL(finalUrl).hostname.replace(/^www\./, ''),
      price: parsePrice(
        meta('product:price:amount', 'og:price:amount', 'price') ||
          offer?.price ||
          offer?.lowPrice ||
          $('#corePrice_feature_div .a-offscreen').first().text(), // Amazon
      ),
      currency:
        meta('product:price:currency', 'og:price:currency', 'priceCurrency') ||
        offer?.priceCurrency ||
        null,
    };
  }
}

function findJsonLdProduct($: CheerioAPI): JsonLd | null {
  for (const el of $('script[type="application/ld+json"]').toArray()) {
    try {
      const data: unknown = JSON.parse($(el).text());
      const nodes = [data].flat().flatMap((n: any) => n?.['@graph'] ?? [n]);
      const product = nodes.find((n: any) => [n?.['@type']].flat().includes('Product'));
      if (product) return product;
    } catch {
      // JSON-LD mal formado: lo ignoramos y seguimos con el siguiente
    }
  }
  return null;
}

function firstString(value: unknown): string {
  const first = [value].flat()[0];
  if (typeof first === 'string') return first;
  if (first && typeof first === 'object' && 'url' in first) return String(first.url);
  return '';
}

function toAbsolute(url: string, base: string): string {
  try {
    return new URL(url, base).href;
  } catch {
    return '';
  }
}

function parsePrice(value: unknown): number | null {
  if (typeof value === 'number') return value > 0 ? value : null;
  if (typeof value !== 'string' || value === '') return null;
  const n = Number(value.replace(/[^\d.]/g, ''));
  return Number.isFinite(n) && n > 0 ? n : null;
}
