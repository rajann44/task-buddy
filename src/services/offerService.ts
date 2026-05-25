import type { Offer } from '../types';

export const offerService = {
  async getOffersForTask(offers: Offer[], taskId: string): Promise<Offer[]> {
    await new Promise((r) => setTimeout(r, 80));
    return offers
      .filter((o) => o.taskId === taskId)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  },

  async getOffersByCoTasker(offers: Offer[], coTaskerId: string): Promise<Offer[]> {
    await new Promise((r) => setTimeout(r, 80));
    return offers
      .filter((o) => o.coTaskerId === coTaskerId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  async getAcceptedOfferForTask(offers: Offer[], taskId: string): Promise<Offer | null> {
    await new Promise((r) => setTimeout(r, 60));
    return offers.find((o) => o.taskId === taskId && o.status === 'accepted') ?? null;
  },

  async hasCoTaskerOffered(
    offers: Offer[],
    taskId: string,
    coTaskerId: string
  ): Promise<boolean> {
    await new Promise((r) => setTimeout(r, 60));
    return offers.some(
      (o) =>
        o.taskId === taskId &&
        o.coTaskerId === coTaskerId &&
        o.status !== 'withdrawn'
    );
  },
};
