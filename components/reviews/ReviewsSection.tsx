'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Review } from '@/types/database';
import { getReviewsAction, submitReviewAction } from '@/lib/actions/review-actions';
import { createClient } from '@/lib/supabase/client';
import {
  Star,
  MessageSquarePlus,
  CheckCircle2,
  Sparkles,
  Quote,
} from 'lucide-react';

export function ReviewsSection() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [modalOpen, setModalOpen] = useState(false);

  // Review submission state
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function fetchLatest() {
      try {
        const res = await getReviewsAction();
        if (mounted && res.success && res.data) {
          setReviews(res.data);
        }
      } catch {
        // Ignore
      }
    }

    fetchLatest();

    // Setup Supabase Real-Time WebSocket Channel
    const supabase = createClient();
    const channel = supabase
      .channel('realtime_reviews_channel')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'reviews' },
        (payload) => {
          if (!mounted) return;
          const newRev = payload.new as Review;
          setReviews((prev) => {
            if (prev.some((r) => r.id === newRev.id)) return prev;
            return [newRev, ...prev];
          });
        }
      )
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, []);

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !comment.trim()) {
      setSubmitError('Please enter your name and write a brief review.');
      return;
    }

    setSubmitting(true);
    setSubmitError(null);

    // 0ms Optimistic local review insertion
    const tempId = `optimistic-${Date.now()}`;
    const optimisticReview: Review = {
      id: tempId,
      name: name.trim(),
      role: role.trim() || 'Verified User',
      rating,
      comment: comment.trim(),
      is_verified: true,
      created_at: new Date().toISOString(),
    };

    setReviews((prev) => [optimisticReview, ...prev]);

    try {
      const res = await submitReviewAction({
        name: name.trim(),
        role: role.trim() || undefined,
        rating,
        comment: comment.trim(),
      });

      if (res.success && res.data) {
        setSubmitSuccess(true);
        setName('');
        setRole('');
        setComment('');
        setRating(5);
        setTimeout(() => {
          setSubmitSuccess(false);
          setModalOpen(false);
        }, 1200);
      } else {
        setSubmitError(res.error || 'Failed to submit review.');
        // Revert optimistic if failed
        setReviews((prev) => prev.filter((r) => r.id !== tempId));
      }
    } catch (err: unknown) {
      setSubmitError(err instanceof Error ? err.message : 'Submission failed.');
      setReviews((prev) => prev.filter((r) => r.id !== tempId));
    } finally {
      setSubmitting(false);
    }
  };

  const averageRating =
    reviews.length > 0
      ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
      : '5.0';

  return (
    <section id="reviews" className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-10 py-6">
      {/* Section Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-slate-200">
        <div className="space-y-3 max-w-2xl">
          <Badge variant="info" size="md">
            <Sparkles className="w-3.5 h-3.5" />
            Real-Time Customer Feedback
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Trusted by Developers & Privacy Teams
          </h2>
          <p className="text-sm text-slate-500">
            Real experiences from developers, security analysts, and teams sharing confidential files with 6-digit PINs.
          </p>
        </div>

        {/* Aggregate Score & Action Button */}
        <div className="flex flex-wrap items-center gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50 border border-amber-200 text-amber-500 font-black text-lg">
              {averageRating}
            </div>
            <div>
              <div className="flex text-amber-400">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-amber-400" />
                ))}
              </div>
              <p className="text-xs font-semibold text-slate-700 mt-0.5">
                Based on {reviews.length}+ verified reviews
              </p>
            </div>
          </div>

          <Button
            variant="glow"
            size="md"
            onClick={() => setModalOpen(true)}
            leftIcon={<MessageSquarePlus className="w-4 h-4" />}
            shakeOnHover={true}
          >
            Leave a Review
          </Button>
        </div>
      </div>

      {/* Reviews Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {reviews.map((rev) => (
          <Card
            key={rev.id}
            hoverEffect
            className="p-6 bg-white border-slate-200 shadow-2xs hover:shadow-lg transition-all flex flex-col justify-between space-y-4 relative"
          >
            <div className="space-y-3">
              {/* Star Rating & Quote Icon */}
              <div className="flex items-center justify-between">
                <div className="flex text-amber-400">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${
                        i < rev.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'
                      }`}
                    />
                  ))}
                </div>
                <Quote className="w-5 h-5 text-slate-200" />
              </div>

              {/* Review Text */}
              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-normal">
                &ldquo;{rev.comment}&rdquo;
              </p>
            </div>

            {/* Author Info */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600 font-black text-xs border border-blue-200 shadow-2xs">
                  {rev.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-1">
                    <span className="text-xs font-bold text-slate-900">{rev.name}</span>
                    {rev.is_verified && (
                      <span title="Verified User" className="inline-flex items-center">
                        <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-slate-400 block">{rev.role}</span>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Write a Review Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Write a Customer Review"
        description="Share your experience with DeploShare. Your review will be published in real-time."
      >
        <form onSubmit={handleSubmitReview} className="space-y-4 pt-2">
          {/* Star Selector */}
          <div className="space-y-1.5 text-center sm:text-left">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Your Rating
            </label>
            <div className="flex items-center justify-center sm:justify-start gap-2 pt-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  type="button"
                  key={star}
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="p-1 text-amber-400 hover:scale-125 transition-transform cursor-pointer"
                >
                  <Star
                    className={`w-7 h-7 ${
                      (hoverRating || rating) >= star
                        ? 'fill-amber-400 text-amber-400'
                        : 'text-slate-300'
                    }`}
                  />
                </button>
              ))}
              <span className="text-xs font-bold text-amber-600 ml-2">
                {rating} / 5 Stars
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Your Full Name"
              placeholder="e.g. Alex Vance"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            <Input
              label="Role or Company (Optional)"
              placeholder="e.g. DevOps Engineer"
              value={role}
              onChange={(e) => setRole(e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Your Feedback & Experience
            </label>
            <textarea
              rows={4}
              maxLength={500}
              placeholder="What do you like most about DeploShare's 6-digit PIN transfers and security features?"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              required
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-3 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white resize-none"
            />
            <div className="flex justify-between text-[11px] text-slate-400">
              <span>Publicly visible to all users in real-time</span>
              <span>{comment.length} / 500</span>
            </div>
          </div>

          {submitError && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700">
              {submitError}
            </div>
          )}

          {submitSuccess && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-700 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Review submitted and published live in real-time!</span>
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="glow"
              size="sm"
              isLoading={submitting}
              leftIcon={<CheckCircle2 className="w-4 h-4" />}
            >
              Publish Review Live
            </Button>
          </div>
        </form>
      </Modal>
    </section>
  );
}
