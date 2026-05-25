import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useAppContext, createTaskAction } from '../../context/AppContext';
import { useToast } from '../../context/ToastContext';
import { Input, Textarea, Select } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { TASK_CATEGORIES, AUSTRALIAN_CITIES } from '../../utils/constants';
import { generateId } from '../../utils/formatters';
import type { Task } from '../../types';

export function NewTaskPage() {
  const { currentUser } = useAuth();
  const { dispatch } = useAppContext();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    title: '',
    description: '',
    category: '',
    location: '',
    address: '',
    date: '',
    time: '',
    budgetType: 'fixed' as 'fixed' | 'open_to_offers',
    budget: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  const update = (key: keyof typeof form) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!form.title.trim()) newErrors.title = 'Title is required';
    if (!form.description.trim() || form.description.length < 30) newErrors.description = 'Description must be at least 30 characters';
    if (!form.category) newErrors.category = 'Category is required';
    if (!form.location) newErrors.location = 'City is required';
    if (!form.address.trim()) newErrors.address = 'Address is required';
    if (!form.date) newErrors.date = 'Date is required';
    if (form.budgetType === 'fixed' && (!form.budget || Number(form.budget) <= 0)) {
      newErrors.budget = 'Please enter a valid budget amount';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setIsLoading(true);

    await new Promise((r) => setTimeout(r, 500)); // Simulate API

    const newTask: Task = {
      id: generateId('task'),
      title: form.title.trim(),
      description: form.description.trim(),
      category: form.category as Task['category'],
      location: form.location,
      address: form.address.trim(),
      date: form.date,
      time: form.time || undefined,
      budgetType: form.budgetType,
      budget: form.budgetType === 'fixed' ? Number(form.budget) : undefined,
      images: [],
      clientId: currentUser!.id,
      status: 'open',
      createdAt: new Date().toISOString(),
      offersCount: 0,
    };

    dispatch(createTaskAction(newTask));
    showToast('Task posted successfully! You\'ll receive offers soon.', 'success');
    setIsLoading(false);
    navigate(`/client/tasks/${newTask.id}`);
  };

  return (
    <div style={{ maxWidth: '720px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-6)' }}>
        <button onClick={() => navigate(-1)} className="btn btn-ghost btn-icon">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-headline-lg">Post a New Task</h1>
          <p style={{ color: 'var(--color-on-surface-variant)', marginTop: 'var(--space-1)' }}>
            Describe what you need done and receive offers from trusted providers
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Task Details */}
        <div className="card" style={{ marginBottom: 'var(--space-4)' }}>
          <div className="card-header">
            <h2 className="text-headline-sm">Task Details</h2>
          </div>
          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <Input
              label="Task Title"
              value={form.title}
              onChange={update('title')}
              error={errors.title}
              required
              placeholder="e.g. Assemble IKEA furniture in living room"
              hint="Keep it clear and specific"
            />
            <Textarea
              label="Description"
              value={form.description}
              onChange={update('description')}
              error={errors.description}
              required
              rows={5}
              placeholder="Describe what needs to be done, any special requirements, and important details..."
              hint={`${form.description.length}/30 characters minimum`}
            />
            <Select
              label="Category"
              value={form.category}
              onChange={update('category')}
              error={errors.category}
              required
              placeholder="Select a category"
              options={TASK_CATEGORIES.map((c) => ({ value: c, label: c }))}
            />
          </div>
        </div>

        {/* Location & Time */}
        <div className="card" style={{ marginBottom: 'var(--space-4)' }}>
          <div className="card-header">
            <h2 className="text-headline-sm">Location & Schedule</h2>
          </div>
          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
              <Select
                label="City"
                value={form.location}
                onChange={update('location')}
                error={errors.location}
                required
                placeholder="Select city"
                options={AUSTRALIAN_CITIES.map((c) => ({ value: c, label: c }))}
              />
              <Input
                label="Address / Area"
                value={form.address}
                onChange={update('address')}
                error={errors.address}
                required
                placeholder="e.g. Mitte, Berlin"
              />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
              <Input
                label="Preferred Date"
                type="date"
                value={form.date}
                onChange={update('date')}
                error={errors.date}
                required
                min={new Date().toISOString().split('T')[0]}
              />
              <Input
                label="Preferred Time (optional)"
                type="time"
                value={form.time}
                onChange={update('time')}
              />
            </div>
          </div>
        </div>

        {/* Budget */}
        <div className="card" style={{ marginBottom: 'var(--space-6)' }}>
          <div className="card-header">
            <h2 className="text-headline-sm">Budget</h2>
          </div>
          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
              {[
                { value: 'fixed', label: 'Fixed Price', desc: "I have a set budget in mind" },
                { value: 'open_to_offers', label: 'Open to Offers', desc: "Let providers suggest a price" },
              ].map((opt) => (
                <label
                  key={opt.value}
                  style={{
                    flex: 1,
                    padding: 'var(--space-4)',
                    border: `2px solid ${form.budgetType === opt.value ? 'var(--color-secondary)' : 'var(--color-outline-variant)'}`,
                    borderRadius: 'var(--radius)',
                    cursor: 'pointer',
                    background: form.budgetType === opt.value ? 'var(--color-surface-container-low)' : 'transparent',
                    transition: 'all var(--transition-fast)',
                  }}
                >
                  <input
                    type="radio"
                    name="budgetType"
                    value={opt.value}
                    checked={form.budgetType === opt.value}
                    onChange={update('budgetType')}
                    style={{ display: 'none' }}
                  />
                  <div style={{ fontWeight: 600, fontSize: 'var(--text-body-sm)', marginBottom: '4px' }}>{opt.label}</div>
                  <div style={{ fontSize: 'var(--text-label-md)', color: 'var(--color-on-surface-variant)' }}>{opt.desc}</div>
                </label>
              ))}
            </div>
            {form.budgetType === 'fixed' && (
              <Input
                label="Budget Amount (€)"
                type="number"
                min="10"
                step="5"
                value={form.budget}
                onChange={update('budget')}
                error={errors.budget}
                required
                placeholder="e.g. 150"
                hint="This is what you're willing to pay in total"
              />
            )}
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'flex-end' }}>
          <Button type="button" variant="ghost" onClick={() => navigate(-1)} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" size="lg" isLoading={isLoading}>
            Post Task
          </Button>
        </div>
      </form>
    </div>
  );
}
