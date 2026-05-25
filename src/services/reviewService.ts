import type { Review } from '../types';

export const reviewService = {
  async getReviewsForUser(reviews: Review[], userId: string): Promise<Review[]> {
    await new Promise((r) => setTimeout(r, 80));
    return reviews
      .filter((r) => r.toUserId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  async getReviewByTask(
    reviews: Review[],
    taskId: string,
    fromUserId: string
  ): Promise<Review | null> {
    await new Promise((r) => setTimeout(r, 60));
    return (
      reviews.find((r) => r.taskId === taskId && r.fromUserId === fromUserId) ?? null
    );
  },

  async getAverageRating(reviews: Review[], userId: string): Promise<number> {
    await new Promise((r) => setTimeout(r, 60));
    const userReviews = reviews.filter((r) => r.toUserId === userId);
    if (userReviews.length === 0) return 0;
    const total = userReviews.reduce((sum, r) => sum + r.rating, 0);
    return total / userReviews.length;
  },
};
