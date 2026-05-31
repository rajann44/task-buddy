import { useState } from 'react';
import { Button } from '../ui/Button';
import { Input, Textarea } from '../ui/Input';
import { Send } from 'lucide-react';
import type { Offer } from '../../types';

interface OfferFormProps {
  taskId: string;
  coTaskerId: string;
  existingOffer?: Offer;
  onSubmit: (data: { price: number; message: string; estimatedHours: number }) => Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
}

export function OfferForm({ taskId: _taskId, coTaskerId: _coTaskerId, existingOffer, onSubmit, onCancel, isLoading }: OfferFormProps) {
  const [price, setPrice] = useState(existingOffer?.price?.toString() ?? '');
  const [message, setMessage] = useState(existingOffer?.message ?? '');
  const [estimatedHours, setEstimatedHours] = useState(existingOffer?.estimatedHours?.toString() ?? '');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!price || Number(price) <= 0) newErrors.price = 'Please enter a valid price';
    if (!message.trim() || message.length < 20) newErrors.message = 'Message must be at least 20 characters';
    if (!estimatedHours || Number(estimatedHours) <= 0) newErrors.estimatedHours = 'Please enter estimated hours';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    await onSubmit({
      price: Number(price),
      message: message.trim(),
      estimatedHours: Number(estimatedHours),
    });
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
        <Input
          label="Your Price (€)"
          type="number"
          min="1"
          step="1"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          error={errors.price}
          required
          placeholder="e.g. 150"
        />
        <Input
          label="Estimated Hours"
          type="number"
          min="1"
          step="1"
          value={estimatedHours}
          onChange={(e) => setEstimatedHours(e.target.value)}
          error={errors.estimatedHours}
          required
          placeholder="e.g. 3"
        />
      </div>
      <Textarea
        label="Your Message"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        error={errors.message}
        required
        placeholder="Describe your experience, why you're a great fit, and any questions about the task..."
        rows={4}
        hint="Tip: Mention your experience and relevant skills. Be specific!"
      />
      <div style={{ display: 'flex', gap: 'var(--space-2)', justifyContent: 'flex-end' }}>
        {onCancel && (
          <Button type="button" variant="ghost" onClick={onCancel} disabled={isLoading}>
            Cancel
          </Button>
        )}
        <Button type="submit" variant="primary" isLoading={isLoading} leftIcon={<Send size={16} />}>
          {existingOffer ? 'Update Offer' : 'Send Offer'}
        </Button>
      </div>
    </form>
  );
}
