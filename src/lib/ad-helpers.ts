import { vehicleTypeLabels } from "./vehicle-constants";

export interface BaseAd {
  id: string;
  type: string;
  listingType?: string;
  brand?: string | null;
  model?: string | null;
  manufacturedYear?: string | null;
  partName?: string;
  compatibleVehicleType?: string;
  createdAt: string | Date;
  updatedAt?: string | Date;
  bumpActive?: boolean;
  topAdActive?: boolean;
  featuredActive?: boolean;
  urgentActive?: boolean;
  bumpStartAt?: string | null;
  boostStartAt?: string | null;
  boostRequestedAt?: string | null;
  published?: boolean;
  status?: string;
}

export const shuffleArray = <T,>(items: T[]): T[] => {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
};

export const getRotatingSlice = <T,>(items: T[], startIndex: number, count: number): T[] => {
  if (items.length === 0 || count <= 0) return [];
  const normalizedStart = ((startIndex % items.length) + items.length) % items.length;
  const limit = Math.min(count, items.length);
  return Array.from({ length: limit }, (_, i) => items[(normalizedStart + i) % items.length]);
};

export const formatAdTitle = (ad: BaseAd): string => {
  // AUTO_PARTS: use part-specific title format
  if (ad.type === 'AUTO_PARTS') {
    const partName = ad.partName || 'Auto Part';
    const compatLabel = vehicleTypeLabels[ad.compatibleVehicleType || ''] || ad.compatibleVehicleType || '';
    const forParts = [ad.brand, ad.model, compatLabel].filter(Boolean).join(' ');
    return forParts ? `${partName} for ${forParts}` : partName;
  }

  // Vehicle: build standard title
  const typeLabel = vehicleTypeLabels[ad.type] || '';
  const vehicleInfo = [ad.brand, ad.model, ad.manufacturedYear, typeLabel]
    .filter(Boolean)
    .join(' ');

  if (ad.listingType === 'WANT') {
    return `Want ${vehicleInfo}`;
  } else if (ad.listingType === 'RENT') {
    return `${vehicleInfo} for Rent`;
  } else if (ad.listingType === 'HIRE') {
    return `${vehicleInfo} for Hire`;
  }
  return vehicleInfo;
};

export const getAdSortTime = (ad: BaseAd, now = Date.now()): number => {
  const createdAtMs = ad.createdAt ? new Date(ad.createdAt).getTime() : 0;
  const isBumpOnly = Boolean(ad.bumpActive && !ad.topAdActive && !ad.featuredActive && !ad.urgentActive);
  
  if (!isBumpOnly) return createdAtMs;

  const bumpStart = ad.bumpStartAt || ad.boostStartAt || ad.boostRequestedAt || ad.updatedAt || ad.createdAt;
  const bumpStartMs = bumpStart ? new Date(bumpStart).getTime() : createdAtMs;
  if (!Number.isFinite(bumpStartMs)) return createdAtMs;

  const dayMs = 24 * 60 * 60 * 1000;
  const elapsed = Math.max(0, now - bumpStartMs);
  const cycles = Math.floor(elapsed / dayMs);
  const lastBumpMs = bumpStartMs + cycles * dayMs;
  return Math.max(createdAtMs, lastBumpMs);
};

export const interleaveFeaturedAds = <T extends BaseAd>(
  baseAds: T[],
  featuredInsertPool: T[],
  rotationIndex: number,
  interval = 16
): T[] => {
  if (baseAds.length === 0) return [];
  if (featuredInsertPool.length === 0) return baseAds;

  const result: any[] = [];
  const insertCount = Math.min(2, featuredInsertPool.length);
  const poolLength = featuredInsertPool.length;
  const startOffset = (rotationIndex * insertCount) % poolLength;
  let insertOffset = 0;

  baseAds.forEach((ad, index) => {
    result.push(ad);
    if ((index + 1) % interval === 0) {
      for (let i = 0; i < insertCount; i += 1) {
        const pos = (startOffset + insertOffset + i) % poolLength;
        const insertAd = featuredInsertPool[pos];
        if (!result.some((r) => r.id === insertAd.id)) {
          result.push({ ...insertAd, _isFeaturedInsert: true });
        }
      }
      insertOffset += insertCount;
    }
  });

  return result;
};
