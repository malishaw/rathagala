/**
 * Utility to build SEO-friendly ad URLs.
 *
 * Vehicles: /ads/{brand}/{seoSlug}
 * Auto Parts: /ads/{seoSlug}
 * Fallback: /ads/{id}
 */

const vehicleCategoryMap: Record<string, string> = {
  CAR: "car",
  VAN: "van",
  MOTORCYCLE: "motorcycle",
  BICYCLE: "bicycle",
  THREE_WHEEL: "three-wheel",
  BUS: "bus",
  LORRY: "lorry",
  HEAVY_DUTY: "heavy-duty",
  TRACTOR: "tractor",
  AUTO_SERVICE: "auto-service",
  RENTAL: "rental",
  AUTO_PARTS: "auto-parts",
  MAINTENANCE: "maintenance",
  BOAT: "boat",
  SUV_JEEP: "suv-jeep",
  CREW_CAB: "crew-cab",
  PICKUP_DOUBLE_CAB: "pickup-double-cab",
  OTHER: "other",
};

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/**
 * Build a SEO-friendly URL for an ad.
 * Supports both vehicle ads and auto parts ads with slug-based URLs.
 */
export function buildAdUrl(ad: {
  id: string;
  type?: string | null;
  brand?: string | null;
  model?: string | null;
  partName?: string | null;
  partCategory?: { slug?: string } | null;
  seoSlug?: string | null;
}): string {
  const slug = ad.seoSlug || null;

  // AUTO_PARTS handling - simple slug-based URL
  if (ad.type === "AUTO_PARTS" && slug) {
    return `/ads/${slug}`;
  }

  // VEHICLE handling (CAR, VAN, MOTORCYCLE, etc.)
  const brand = ad.brand ? slugify(ad.brand) : null;

  if (brand && slug) {
    return `/ads/${brand}/${slug}`;
  }

  // Fallback: use MongoDB ObjectId
  return `/ads/${ad.id}`;
}
