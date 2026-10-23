interface Offer {
  type: 'percentage' | 'fixed' | 'bogo';
  value: number;
  isActive: boolean;
  startDate?: Date | string;
  endDate?: Date | string;
  repeatWeekly?: boolean;
  appliesTo: { type: 'all' | 'category' | 'product'; targetId?: { toString(): string } | string };
}

export function isOfferActive(offer: Offer, now = Date.now()) {
  if (!offer.isActive) return false;
  const start = offer.startDate ? new Date(offer.startDate).getTime() : -Infinity;
  const end = offer.endDate ? new Date(offer.endDate).getTime() : Infinity;
  if (Number.isNaN(start) || Number.isNaN(end) || end < start || now < start) return false;
  if (offer.repeatWeekly && Number.isFinite(start) && Number.isFinite(end)) {
    return (now - start) % (7 * 86400000) <= end - start;
  }
  return now <= end;
}

// Apply the best valid offer per product. Never stack offers or produce negative prices.
export function offerSavings(cents: number, quantity: number, productId: string, categoryId: string, offers: Offer[], now = Date.now()) {
  let best = 0;
  const total = cents * quantity;
  for (const offer of offers) {
    if (!isOfferActive(offer, now) || !Number.isFinite(offer.value) || offer.value < 0) continue;
    const target = offer.appliesTo?.targetId?.toString();
    if (offer.appliesTo?.type !== 'all' && !(offer.appliesTo?.type === 'product' && target === productId) && !(offer.appliesTo?.type === 'category' && target === categoryId)) continue;
    const savings = offer.type === 'percentage' ? Math.round(total * Math.min(100, offer.value) / 100)
      : offer.type === 'fixed' ? Math.round(offer.value * 100) * quantity
      : offer.type === 'bogo' ? Math.floor(quantity / 2) * cents : 0;
    best = Math.max(best, Math.min(total, savings));
  }
  return best;
}
