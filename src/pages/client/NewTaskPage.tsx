import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Calendar, Clock, MapPin, Plus, X,
  Check, FileText, DollarSign, Image as ImageIcon, Sparkles,
  HelpCircle, MoreHorizontal, Search, Wallet
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useAppContext, createTaskAction } from '../../context/AppContext';
import { useToast } from '../../context/ToastContext';
import { Input, Textarea, Select } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { TASK_CATEGORIES, AUSTRALIAN_CITIES, CATEGORY_LUCIDE_ICONS } from '../../utils/constants';
import { Modal } from '../../components/ui/Modal';
import { generateId, formatCurrency, formatDate } from '../../utils/formatters';
import { useTranslation } from '../../context/LanguageContext';
import type { Task, TaskCategory } from '../../types';
import posthog from '../../utils/posthogClient';

const PRESET_IMAGES = [
  { label: 'Cleaning', url: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=600' },
  { label: 'Moving', url: 'https://images.unsplash.com/photo-1527689368864-3a821dbccc34?w=600' },
  { label: 'Furniture Assembly', url: 'https://images.unsplash.com/photo-1595428774223-ef52624120d2?w=600' },
  { label: 'Painting', url: 'https://images.unsplash.com/photo-1562259949-e8e7689d7828?w=600' },
  { label: 'Repairs & Mounting', url: 'https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?w=600' },
];
const POPULAR_CATEGORIES = [
  'Cleaning',
  'Handy Person',
  'Furniture Assembly',
  'Transport & Removals',
  'Delivery',
];

export function NewTaskPage() {
  const { currentUser } = useAuth();
  const { dispatch } = useAppContext();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const { t } = useTranslation();

  // Wizard state: Step 1 (Details), Step 2 (Schedule), Step 3 (Budget), Step 4 (Confirm)
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  const [form, setForm] = useState({
    title: '',
    description: '',
    category: '' as TaskCategory | '',
    taskType: 'in_person' as 'in_person' | 'remote',
    location: 'Berlin', // Default city
    address: '',
    mustHaves: [] as string[],
    imageUrl: '',
    scheduleType: 'asap' as 'asap' | 'specific',
    date: '',
    time: '',
    budgetType: 'fixed' as 'fixed' | 'hourly' | 'open_to_offers',
    budget: '',
  });

  const [newMustHave, setNewMustHave] = useState('');
  const [customImageMode, setCustomImageMode] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [categorySearchQuery, setCategorySearchQuery] = useState('');

  const update = (key: keyof typeof form) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setForm((prev) => ({ ...prev, [key]: e.target.value }));
    // Clear error for that key
    if (errors[key]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  };

  const setFormVal = (key: keyof typeof form, value: any) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  };

  const addMustHave = () => {
    if (newMustHave.trim() && !form.mustHaves.includes(newMustHave.trim())) {
      setFormVal('mustHaves', [...form.mustHaves, newMustHave.trim()]);
      setNewMustHave('');
    }
  };

  const removeMustHave = (idx: number) => {
    setFormVal('mustHaves', form.mustHaves.filter((_, i) => i !== idx));
  };

  // Step-level Validation
  const validateStep = (currentStep: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (currentStep === 1) {
      if (!form.title.trim()) newErrors.title = t('new_task.title_error');
      if (!form.description.trim() || form.description.length < 30) {
        newErrors.description = t('new_task.desc_error');
      }
      if (!form.category) newErrors.category = t('new_task.cat_error');
      if (form.taskType === 'in_person') {
        if (!form.location) newErrors.location = t('new_task.city_error');
        if (!form.address.trim()) newErrors.address = t('new_task.addr_error');
      }
    } else if (currentStep === 2) {
      if (form.scheduleType === 'specific') {
        if (!form.date) {
          newErrors.date = t('new_task.date_error');
        } else {
          const selected = new Date(form.date);
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          if (selected < today) {
            newErrors.date = t('new_task.date_past_error');
          }
        }
      }
    } else if (currentStep === 3) {
      if (form.budgetType !== 'open_to_offers') {
        if (!form.budget || Number(form.budget) <= 0) {
          newErrors.budget = t('new_task.budget_error');
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(step)) {
      setStep((prev) => (prev + 1) as any);
    }
  };

  const handleBack = () => {
    setStep((prev) => (prev - 1) as any);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep(3)) return;
    setIsLoading(true);

    await new Promise((r) => setTimeout(r, 600)); // Simulate API

    // Default values based on choices
    const taskDate = form.scheduleType === 'asap' 
      ? new Date().toISOString().split('T')[0] 
      : form.date;
    const taskTime = form.scheduleType === 'asap' ? 'ASAP' : form.time;

    const newTask: Task = {
      id: generateId('task'),
      title: form.title.trim(),
      description: form.description.trim(),
      category: form.category as TaskCategory,
      taskType: form.taskType,
      location: form.taskType === 'remote' ? 'Remote' : form.location,
      address: form.taskType === 'remote' ? 'Remote Task' : form.address.trim(),
      date: taskDate,
      time: taskTime || undefined,
      budgetType: form.budgetType,
      budget: form.budgetType !== 'open_to_offers' ? Number(form.budget) : undefined,
      images: form.imageUrl ? [form.imageUrl] : [],
      mustHaves: form.mustHaves,
      clientId: currentUser!.id,
      status: 'open',
      createdAt: new Date().toISOString(),
      offersCount: 0,
      moderationStatus: 'pending',
    };

    dispatch(createTaskAction(newTask));
    posthog.capture('task_posted', {
      task_id: newTask.id,
      category: newTask.category,
      task_type: newTask.taskType,
      budget_type: newTask.budgetType,
      budget: newTask.budget,
      location: newTask.location,
      schedule_type: form.scheduleType,
    });
    showToast(t('new_task.post_success') || 'Task posted successfully! It will be visible in the marketplace once approved by moderation.', 'success');
    setIsLoading(false);
    navigate(`/tasks/${newTask.id}`);
  };

  const getStepStatus = (itemStep: number) => {
    if (step === itemStep) return 'active';
    if (step > itemStep) return 'completed';
    return 'pending';
  };

  return (
    <div>
      {/* Header */}
      <div className="page-topbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
          <button onClick={() => navigate(-1)} className="btn btn-ghost btn-icon">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-headline-md" style={{ margin: 0, fontWeight: 700 }}>{t('new_task.title')}</h1>
            <p style={{ color: 'var(--color-on-surface-variant)', fontSize: 'var(--text-body-sm)', margin: '4px 0 0 0' }}>
              {t('new_task.subtitle')}
            </p>
          </div>
        </div>
      </div>

      <div className="page-inner">
        
        {/* Stepper Progress bar */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 'var(--space-8)',
          background: 'var(--color-surface-white)',
          padding: 'var(--space-4) var(--space-6)',
          border: '1px solid var(--color-outline-variant)',
          borderRadius: 'var(--radius)',
        }}>
          {[
            { stepNum: 1, label: t('new_task.step_details'), icon: <FileText size={16} /> },
            { stepNum: 2, label: t('new_task.step_schedule'), icon: <Calendar size={16} /> },
            { stepNum: 3, label: t('new_task.step_budget'), icon: <DollarSign size={16} /> },
            { stepNum: 4, label: t('new_task.step_confirm'), icon: <Check size={16} /> }
          ].map((item, idx, arr) => {
            const status = getStepStatus(item.stepNum);
            const isCompleted = status === 'completed';
            const isActive = status === 'active';
            
            return (
              <div key={item.stepNum} style={{ display: 'flex', alignItems: 'center', flex: idx < arr.length - 1 ? 1 : 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    background: isCompleted ? 'var(--color-status-success)' : isActive ? 'var(--color-primary)' : 'var(--color-surface-container-high)',
                    color: isActive ? 'var(--color-on-primary)' : isCompleted ? '#ffffff' : 'var(--color-on-surface-variant)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    fontSize: '13px',
                    transition: 'all var(--transition-fast)',
                    boxShadow: isActive ? '0 0 0 4px rgba(255, 215, 0, 0.25)' : 'none',
                  }}>
                    {isCompleted ? <Check size={16} /> : item.icon}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ 
                      fontSize: '12px', 
                      fontWeight: isActive || isCompleted ? 700 : 500,
                      color: isActive ? 'var(--color-secondary)' : 'var(--color-on-surface-variant)',
                      whiteSpace: 'nowrap'
                    }}>
                      {item.label}
                    </span>
                    <span style={{ fontSize: '9px', color: 'var(--color-on-surface-variant)', opacity: 0.8 }}>{t('new_task.step_num_prefix')}{item.stepNum}</span>
                  </div>
                </div>
                {idx < arr.length - 1 && (
                  <div style={{
                    height: '2px',
                    flex: 1,
                    background: isCompleted ? 'var(--color-status-success)' : 'var(--color-outline-variant)',
                    margin: '0 16px',
                    minWidth: '20px'
                  }} />
                )}
              </div>
            );
          })}
        </div>

        {/* STEP 1: TASK DETAILS */}
        {step === 1 && (
          <div className="flex flex-col gap-6">
            <div className="bento-grid" style={{ gap: 'var(--space-6)' }}>
              {/* Left Column: Core Info */}
              <div className="bento-col-8 card" style={{ height: 'fit-content' }}>
                <div className="card-header">
                  <h2 className="text-headline-sm" style={{ fontSize: '16px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FileText size={18} style={{ color: 'var(--color-secondary-mid)' }} />
                    {t('new_task.step1_title')}
                  </h2>
                </div>
                <div className="card-body flex flex-col gap-5" style={{ padding: 'var(--space-6)' }}>
                  <Input
                    label={t('new_task.task_title')}
                    value={form.title}
                    onChange={update('title')}
                    error={errors.title}
                    required
                    placeholder={t('new_task.title_placeholder')}
                    hint={t('new_task.title_hint')}
                  />

                  <Textarea
                    label={t('new_task.description')}
                    value={form.description}
                    onChange={update('description')}
                    error={errors.description}
                    required
                    rows={5}
                    placeholder={t('new_task.desc_placeholder')}
                    hint={`${form.description.length}/30${t('new_task.desc_hint_suffix')}`}
                  />

                  <div className="form-group">
                    <label className="form-label">{t('new_task.type_of_task')}</label>
                    <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
                      {[
                        { value: 'in_person', label: t('new_task.in_person'), desc: t('new_task.in_person_desc') },
                        { value: 'remote', label: t('new_task.remote'), desc: t('new_task.remote_desc') },
                      ].map((tVal) => (
                        <label
                          key={tVal.value}
                          style={{
                            flex: 1,
                            padding: 'var(--space-4)',
                            border: `1.5px solid ${form.taskType === tVal.value ? 'var(--color-secondary)' : 'var(--color-outline-variant)'}`,
                            borderRadius: 'var(--radius-lg)',
                            cursor: 'pointer',
                            background: form.taskType === tVal.value ? 'var(--color-surface-container-low)' : 'transparent',
                            transition: 'all var(--transition-fast)',
                          }}
                        >
                          <input
                            type="radio"
                            name="taskType"
                            checked={form.taskType === tVal.value}
                            onChange={() => setFormVal('taskType', tVal.value)}
                            style={{ display: 'none' }}
                          />
                          <div style={{ fontWeight: 700, fontSize: 'var(--text-body-sm)', color: 'var(--color-secondary)', marginBottom: '2px' }}>{tVal.label}</div>
                          <div style={{ fontSize: 'var(--text-label-md)', color: 'var(--color-on-surface-variant)' }}>{tVal.desc}</div>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Conditional Location details */}
                  {form.taskType === 'in_person' && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 'var(--space-3)', background: 'var(--color-surface-container-lowest)', padding: 'var(--space-4)', borderRadius: 'var(--radius)', border: '1px solid var(--color-outline-variant)' }}>
                      <Select
                        label={t('new_task.city')}
                        value={form.location}
                        onChange={update('location')}
                        error={errors.location}
                        required
                        options={AUSTRALIAN_CITIES.map((c) => ({ value: c, label: c }))}
                      />
                      <Input
                        label={t('new_task.address')}
                        value={form.address}
                        onChange={update('address')}
                        error={errors.address}
                        required
                        placeholder={t('new_task.address_placeholder')}
                      />
                    </div>
                  )}

                  <div className="form-group">
                    <label className="form-label required">{t('new_task.category_required')}</label>
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))',
                      gap: 'var(--space-4) var(--space-2)',
                      marginTop: '12px'
                    }}>
                      {(() => {
                        const isSelectedPopular = form.category ? POPULAR_CATEGORIES.includes(form.category as any) : true;
                        const displayedCategories = [...POPULAR_CATEGORIES];
                        if (form.category && !isSelectedPopular) {
                          displayedCategories.push(form.category);
                        }
                        return (
                          <>
                            {displayedCategories.map((c) => {
                              const isSelected = form.category === c;
                              const IconComponent = CATEGORY_LUCIDE_ICONS[c] || HelpCircle;
                              return (
                                <button
                                  key={c}
                                  type="button"
                                  onClick={() => setFormVal('category', c)}
                                  className={`category-grid-item${isSelected ? ' is-selected' : ''}`}
                                >
                                  <div className="category-icon-circle">
                                    <IconComponent size={24} strokeWidth={1.8} />
                                  </div>
                                  <span className="category-label">
                                    {c}
                                  </span>
                                </button>
                              );
                            })}

                            {/* More Categories Trigger */}
                            <button
                              type="button"
                              onClick={() => {
                                setCategorySearchQuery('');
                                setIsCategoryModalOpen(true);
                              }}
                              className="category-grid-item"
                            >
                              <div className="category-icon-circle">
                                <MoreHorizontal size={24} strokeWidth={1.8} />
                              </div>
                              <span className="category-label">
                                {t('new_task.more_categories')}
                              </span>
                            </button>
                          </>
                        );
                      })()}
                    </div>
                    {errors.category && (
                      <span style={{ color: 'var(--color-status-error)', fontSize: '11px', marginTop: '4px' }}>{errors.category}</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Column: Extras (Requirements & Image) */}
              <div className="bento-col-4 flex flex-col gap-6">
                {/* Requirements Card */}
                <div className="card">
                  <div className="card-header">
                    <h2 className="text-headline-sm" style={{ fontSize: '15px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Sparkles size={16} style={{ color: 'var(--color-secondary-mid)' }} />
                      {t('new_task.requirements_title')}
                    </h2>
                  </div>
                  <div className="card-body flex flex-col gap-4" style={{ padding: 'var(--space-5)' }}>
                    <p style={{ fontSize: '12px', color: 'var(--color-on-surface-variant)', margin: 0 }}>
                      {t('new_task.requirements_desc')}
                    </p>
                    <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                      <input
                        type="text"
                        className="form-input"
                        placeholder={t('new_task.requirements_placeholder')}
                        value={newMustHave}
                        onChange={(e) => setNewMustHave(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addMustHave())}
                        style={{ flex: 1, fontSize: '13px' }}
                      />
                      <button
                        type="button"
                        onClick={addMustHave}
                        className="btn btn-secondary btn-sm"
                        style={{
                          whiteSpace: 'nowrap',
                          padding: '10px 14px',
                          borderRadius: 'var(--radius-full)'
                        }}
                      >
                        <Plus size={14} /> {t('new_task.add_btn')}
                      </button>
                    </div>

                    {form.mustHaves.length > 0 && (
                      <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 'var(--space-2)',
                        marginTop: '4px'
                      }}>
                        {form.mustHaves.map((m, idx) => (
                          <div
                            key={idx}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              padding: '8px var(--space-3)',
                              background: 'var(--color-surface-container-low)',
                              border: '1px solid var(--color-outline-variant)',
                              borderRadius: 'var(--radius)',
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                              <div
                                className="transaction-initials-badge"
                                style={{
                                  width: '20px',
                                  height: '20px',
                                  fontSize: '9px',
                                  flexShrink: 0,
                                  background: 'var(--color-primary-container)',
                                  borderColor: 'var(--color-outline-variant)',
                                  color: 'var(--color-secondary)'
                                }}
                              >
                                ✓
                              </div>
                              <span style={{ fontSize: '12px', color: 'var(--color-on-surface)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {m}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeMustHave(idx)}
                              style={{
                                color: 'var(--color-on-surface-variant)',
                                padding: '2px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                borderRadius: '50%',
                                background: 'none',
                                border: 'none',
                                transition: 'all var(--transition-fast)'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.color = 'var(--color-status-error)';
                                e.currentTarget.style.background = 'rgba(211,47,47,0.08)';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.color = 'var(--color-on-surface-variant)';
                                e.currentTarget.style.background = 'none';
                              }}
                            >
                              <X size={13} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Photo Selection Card */}
                <div className="card">
                  <div className="card-header">
                    <h2 className="text-headline-sm" style={{ fontSize: '15px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <ImageIcon size={16} style={{ color: 'var(--color-secondary-mid)' }} />
                      {t('new_task.ref_photo')}
                    </h2>
                  </div>
                  <div className="card-body flex flex-col gap-4" style={{ padding: 'var(--space-5)' }}>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button 
                        type="button" 
                        className={`btn btn-sm ${!customImageMode ? 'btn-primary' : 'btn-outlined'}`}
                        onClick={() => setCustomImageMode(false)}
                        style={{ padding: '4px 10px', fontSize: '11px' }}
                      >
                        {t('new_task.preset')}
                      </button>
                      <button 
                        type="button" 
                        className={`btn btn-sm ${customImageMode ? 'btn-primary' : 'btn-outlined'}`}
                        onClick={() => setCustomImageMode(true)}
                        style={{ padding: '4px 10px', fontSize: '11px' }}
                      >
                        {t('new_task.paste_url')}
                      </button>
                    </div>

                    {!customImageMode ? (
                      <div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
                          {PRESET_IMAGES.map((img) => (
                            <div 
                              key={img.label}
                              onClick={() => setFormVal('imageUrl', img.url)}
                              style={{
                                cursor: 'pointer',
                                borderRadius: 'var(--radius)',
                                overflow: 'hidden',
                                border: `2px solid ${form.imageUrl === img.url ? 'var(--color-primary)' : 'var(--color-outline-variant)'}`,
                                transition: 'all var(--transition-fast)',
                                position: 'relative'
                              }}
                            >
                              <img src={img.url} alt={img.label} style={{ width: '100%', height: '52px', objectFit: 'cover', display: 'block' }} />
                              <div style={{ fontSize: '8px', fontWeight: 600, textAlign: 'center', padding: '2px', background: 'var(--color-surface-container-low)', color: 'var(--color-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {img.label}
                              </div>
                              {form.imageUrl === img.url && (
                                <div style={{ position: 'absolute', top: 2, right: 2, background: 'var(--color-primary)', color: 'var(--color-on-primary)', borderRadius: '50%', width: 14, height: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                  <Check size={8} />
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <Input
                        value={form.imageUrl}
                        onChange={update('imageUrl')}
                        placeholder="https://images.unsplash.com/photo-..."
                        hint={t('new_task.paste_hint')}
                        style={{ fontSize: '12px' }}
                      />
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* All Categories Modal Popup */}
            <Modal
              isOpen={isCategoryModalOpen}
              onClose={() => setIsCategoryModalOpen(false)}
              title={t('new_task.modal_title')}
              size="lg"
            >
              {/* Search Bar */}
              <div className="category-search-container">
                <input
                  type="text"
                  className="category-search-input"
                  placeholder={t('new_task.search_categories')}
                  value={categorySearchQuery}
                  onChange={(e) => setCategorySearchQuery(e.target.value)}
                  autoFocus
                />
                {categorySearchQuery ? (
                  <div 
                     className="category-search-icon" 
                     onClick={() => setCategorySearchQuery('')}
                     role="button"
                     aria-label="Clear search"
                  >
                    <X size={16} />
                  </div>
                ) : (
                  <div className="category-search-icon" style={{ cursor: 'default', pointerEvents: 'none' }}>
                    <Search size={16} />
                  </div>
                )}
              </div>

              {/* Grid */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))',
                gap: 'var(--space-4) var(--space-2)',
                maxHeight: '340px',
                overflowY: 'auto',
                padding: 'var(--space-2)'
              }}>
                {(() => {
                  const filtered = TASK_CATEGORIES.filter((c) =>
                    c.toLowerCase().includes(categorySearchQuery.toLowerCase())
                  );
                  
                  if (filtered.length === 0) {
                    return (
                      <div style={{
                        gridColumn: '1 / -1',
                        textAlign: 'center',
                        padding: 'var(--space-8) 0',
                        color: 'var(--color-on-surface-variant)',
                        fontSize: 'var(--text-body-sm)'
                      }}>
                        <HelpCircle size={32} style={{ color: 'var(--color-outline)', marginBottom: '8px', opacity: 0.7 }} />
                        <div>{t('new_task.no_matching_categories')} "{categorySearchQuery}"</div>
                      </div>
                    );
                  }

                  return filtered.map((c) => {
                    const isSelected = form.category === c;
                    const IconComponent = CATEGORY_LUCIDE_ICONS[c] || HelpCircle;
                    return (
                      <button
                        key={c}
                        type="button"
                        onClick={() => {
                          setFormVal('category', c);
                          setIsCategoryModalOpen(false);
                        }}
                        className={`category-grid-item${isSelected ? ' is-selected' : ''}`}
                      >
                        <div className="category-icon-circle">
                          <IconComponent size={24} strokeWidth={1.8} />
                        </div>
                        <span className="category-label">
                          {c}
                        </span>
                      </button>
                    );
                  });
                })()}
              </div>
            </Modal>

            {/* Stepper Navigation bar at bottom */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              background: 'var(--color-surface-white)',
              padding: 'var(--space-4) var(--space-6)',
              border: '1px solid var(--color-outline-variant)',
              borderRadius: 'var(--radius-lg)',
              marginTop: 'var(--space-2)'
            }}>
              <Button type="button" variant="ghost" onClick={() => navigate(-1)}>
                {t('new_task.cancel')}
              </Button>
              <Button type="button" variant="primary" onClick={handleNext}>
                {t('new_task.next_step')}
              </Button>
            </div>
          </div>
        )}

        {/* STEP 2: DATE & TIME */}
        {step === 2 && (
          <div className="flex flex-col gap-6">
            <div className="bento-grid" style={{ gap: 'var(--space-6)' }}>
              {/* Left Column: Schedule inputs */}
              <div className="bento-col-8 card" style={{ height: 'fit-content' }}>
                <div className="card-header">
                  <h2 className="text-headline-sm" style={{ fontSize: '16px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Calendar size={18} style={{ color: 'var(--color-secondary-mid)' }} />
                    {t('new_task.step2_title')}
                  </h2>
                </div>
                <div className="card-body flex flex-col gap-5" style={{ padding: 'var(--space-6)' }}>
                  <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
                    {[
                      { value: 'asap', label: t('new_task.schedule_asap'), desc: t('new_task.schedule_asap_desc') },
                      { value: 'specific', label: t('new_task.schedule_specific'), desc: t('new_task.schedule_specific_desc') },
                    ].map((s) => (
                      <label
                        key={s.value}
                        style={{
                          flex: 1,
                          padding: 'var(--space-5)',
                          border: `1.5px solid ${form.scheduleType === s.value ? 'var(--color-secondary)' : 'var(--color-outline-variant)'}`,
                          borderRadius: 'var(--radius-lg)',
                          cursor: 'pointer',
                          background: form.scheduleType === s.value ? 'var(--color-surface-container-low)' : 'transparent',
                          transition: 'all var(--transition-fast)',
                        }}
                      >
                        <input
                          type="radio"
                          name="scheduleType"
                          checked={form.scheduleType === s.value}
                          onChange={() => setFormVal('scheduleType', s.value)}
                          style={{ display: 'none' }}
                        />
                        <div style={{ fontWeight: 700, fontSize: 'var(--text-body-sm)', color: 'var(--color-secondary)', marginBottom: '4px' }}>{s.label}</div>
                        <div style={{ fontSize: 'var(--text-label-md)', color: 'var(--color-on-surface-variant)' }}>{s.desc}</div>
                      </label>
                    ))}
                  </div>

                  {form.scheduleType === 'specific' && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)', background: 'var(--color-surface-container-lowest)', padding: 'var(--space-4)', borderRadius: 'var(--radius)', border: '1px solid var(--color-outline-variant)' }}>
                      <Input
                        label={t('new_task.pref_date')}
                        type="date"
                        value={form.date}
                        onChange={update('date')}
                        error={errors.date}
                        required
                        min={new Date().toISOString().split('T')[0]}
                      />
                      <Input
                        label={t('new_task.pref_time')}
                        type="time"
                        value={form.time}
                        onChange={update('time')}
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: Schedule Guide Info */}
              <div className="bento-col-4 card" style={{ height: 'fit-content' }}>
                <div className="card-header">
                  <h2 className="text-headline-sm" style={{ fontSize: '15px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Clock size={16} style={{ color: 'var(--color-secondary-mid)' }} />
                    {t('new_task.guide_title')}
                  </h2>
                </div>
                <div className="card-body flex flex-col gap-4" style={{ padding: 'var(--space-5)', fontSize: 'var(--text-body-sm)', color: 'var(--color-on-surface-variant)', lineHeight: '1.6' }}>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                    <div style={{ color: 'var(--color-primary)', fontWeight: 'bold' }}>⚡</div>
                    <div>
                      <strong>{t('new_task.asap_tasks')}</strong> {t('new_task.asap_tasks_desc')}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                    <div style={{ color: 'var(--color-secondary-mid)', fontWeight: 'bold' }}>📅</div>
                    <div>
                      <strong>{t('new_task.planned_tasks')}</strong> {t('new_task.planned_tasks_desc')}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Stepper Navigation bar at bottom */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              background: 'var(--color-surface-white)',
              padding: 'var(--space-4) var(--space-6)',
              border: '1px solid var(--color-outline-variant)',
              borderRadius: 'var(--radius-lg)',
              marginTop: 'var(--space-2)'
            }}>
              <Button type="button" variant="outlined" onClick={handleBack}>
                {t('new_task.back')}
              </Button>
              <Button type="button" variant="primary" onClick={handleNext}>
                {t('new_task.next_step')}
              </Button>
            </div>
          </div>
        )}

        {/* STEP 3: BUDGET */}
        {step === 3 && (
          <div className="flex flex-col gap-6">
            <div className="bento-grid" style={{ gap: 'var(--space-6)' }}>
              {/* Left Column: Budget inputs */}
              <div className="bento-col-8 card" style={{ height: 'fit-content' }}>
                <div className="card-header">
                  <h2 className="text-headline-sm" style={{ fontSize: '16px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <DollarSign size={18} style={{ color: 'var(--color-secondary-mid)' }} />
                    {t('new_task.step3_title')}
                  </h2>
                </div>
                <div className="card-body flex flex-col gap-5" style={{ padding: 'var(--space-6)' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                    {[
                      { value: 'fixed', label: t('new_task.budget_fixed'), desc: t('new_task.budget_fixed_desc') },
                      { value: 'hourly', label: t('new_task.budget_hourly'), desc: t('new_task.budget_hourly_desc') },
                      { value: 'open_to_offers', label: t('new_task.budget_offers'), desc: t('new_task.budget_offers_desc') },
                    ].map((b) => (
                      <label
                        key={b.value}
                        style={{
                          padding: 'var(--space-4) var(--space-5)',
                          border: `1.5px solid ${form.budgetType === b.value ? 'var(--color-secondary)' : 'var(--color-outline-variant)'}`,
                          borderRadius: 'var(--radius-lg)',
                          cursor: 'pointer',
                          background: form.budgetType === b.value ? 'var(--color-surface-container-low)' : 'transparent',
                          transition: 'all var(--transition-fast)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between'
                        }}
                      >
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <input
                            type="radio"
                            name="budgetType"
                            checked={form.budgetType === b.value}
                            onChange={() => setFormVal('budgetType', b.value)}
                            style={{ display: 'none' }}
                          />
                          <div style={{ fontWeight: 700, fontSize: 'var(--text-body-sm)', color: 'var(--color-secondary)', marginBottom: '2px' }}>{b.label}</div>
                          <div style={{ fontSize: 'var(--text-label-md)', color: 'var(--color-on-surface-variant)' }}>{b.desc}</div>
                        </div>
                        {form.budgetType === b.value && (
                          <div style={{ background: 'var(--color-primary)', color: 'var(--color-on-primary)', borderRadius: '50%', width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Check size={14} />
                          </div>
                        )}
                      </label>
                    ))}
                  </div>

                  {form.budgetType !== 'open_to_offers' && (
                    <div style={{ background: 'var(--color-surface-container-lowest)', padding: 'var(--space-4)', borderRadius: 'var(--radius)', border: '1px solid var(--color-outline-variant)', marginTop: '4px' }}>
                      <Input
                        label={form.budgetType === 'fixed' ? t('new_task.budget_amt') : t('new_task.budget_rate')}
                        type="number"
                        min="5"
                        step="5"
                        value={form.budget}
                        onChange={update('budget')}
                        error={errors.budget}
                        required
                        placeholder={form.budgetType === 'fixed' ? t('new_task.budget_amt_placeholder') : t('new_task.budget_rate_placeholder')}
                        hint={form.budgetType === 'fixed' ? t('new_task.budget_amt_hint') : t('new_task.budget_rate_hint')}
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: Secure Payments info */}
              <div className="bento-col-4 card" style={{ height: 'fit-content' }}>
                <div className="card-header">
                  <h2 className="text-headline-sm" style={{ fontSize: '15px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Wallet size={16} style={{ color: 'var(--color-secondary-mid)' }} />
                    {t('new_task.sec_payments')}
                  </h2>
                </div>
                <div className="card-body flex flex-col gap-4" style={{ padding: 'var(--space-5)', fontSize: 'var(--text-body-sm)', color: 'var(--color-on-surface-variant)', lineHeight: '1.6' }}>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                    <div style={{ color: 'var(--color-status-success)', fontWeight: 'bold' }}>✓</div>
                    <div>
                      <strong>{t('new_task.escrow_trust')}</strong> {t('new_task.escrow_trust_desc')}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                    <div style={{ color: 'var(--color-status-success)', fontWeight: 'bold' }}>✓</div>
                    <div>
                      <strong>{t('new_task.fair_bids')}</strong> {t('new_task.fair_bids_desc')}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Stepper Navigation bar at bottom */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              background: 'var(--color-surface-white)',
              padding: 'var(--space-4) var(--space-6)',
              border: '1px solid var(--color-outline-variant)',
              borderRadius: 'var(--radius-lg)',
              marginTop: 'var(--space-2)'
            }}>
              <Button type="button" variant="outlined" onClick={handleBack}>
                {t('new_task.back')}
              </Button>
              <Button type="button" variant="primary" onClick={handleNext}>
                {t('new_task.review_details')}
              </Button>
            </div>
          </div>
        )}

        {/* STEP 4: CONFIRMATION SCREEN */}
        {step === 4 && (
          <form onSubmit={handleSubmit}>
            <div className="card">
              <div className="card-header">
                <h2 className="text-headline-sm" style={{ fontSize: '16px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Check size={18} style={{ color: 'var(--color-status-success)' }} />
                  {t('new_task.step4_title')}
                </h2>
              </div>
              <div className="card-body" style={{ padding: 'var(--space-6)' }}>
                <p style={{ fontSize: 'var(--text-body-sm)', color: 'var(--color-on-surface-variant)', marginBottom: 'var(--space-5)' }}>
                  {t('new_task.step4_desc')}
                </p>

                <div className="bento-grid" style={{ gap: 'var(--space-4)' }}>
                  {/* Left Summary Card */}
                  <div className="bento-col-8 flex flex-col gap-4">
                    <div style={{ background: 'var(--color-surface-container-low)', padding: 'var(--space-4)', borderRadius: 'var(--radius)', border: '1px solid var(--color-outline-variant)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                        <span className="chip chip-active" style={{ fontSize: '10px' }}>{form.category}</span>
                        <span className="chip" style={{ fontSize: '10px', textTransform: 'uppercase' }}>
                          {form.taskType === 'in_person' ? t('new_task.in_person') : t('new_task.remote')}
                        </span>
                      </div>
                      
                      <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--color-secondary)', margin: '0 0 10px 0' }}>
                        {form.title}
                      </h3>
                      
                      <div style={{ fontSize: 'var(--text-body-sm)', color: 'var(--color-on-surface)', lineHeight: '1.6', whiteSpace: 'pre-wrap', borderBottom: '1px solid var(--color-outline-variant)', paddingBottom: '12px', marginBottom: '12px' }}>
                        {form.description}
                      </div>

                      {form.mustHaves.length > 0 && (
                        <div style={{ marginBottom: '12px' }}>
                          <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-secondary-mid)', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>
                            {t('new_task.confirm_must_haves')}
                          </span>
                          <ul style={{ margin: 0, paddingLeft: '18px', fontSize: 'var(--text-body-sm)', color: 'var(--color-on-surface)' }}>
                            {form.mustHaves.map((m, i) => (
                              <li key={i} style={{ marginBottom: '4px' }}>{m}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {form.taskType === 'in_person' && (
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: 'var(--text-body-sm)', color: 'var(--color-on-surface-variant)' }}>
                          <MapPin size={16} style={{ color: 'var(--color-secondary-mid)', flexShrink: 0, marginTop: 2 }} />
                          <div>
                            <strong>{t('new_task.confirm_location')}:</strong> {form.address}, {form.location}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Summary Card */}
                  <div className="bento-col-4 flex flex-col gap-4">
                    {/* Image Preview if selected */}
                    {form.imageUrl && (
                      <div style={{ borderRadius: 'var(--radius)', overflow: 'hidden', height: '140px', border: '1px solid var(--color-outline-variant)' }}>
                        <img src={form.imageUrl} alt="Reference photo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>
                    )}

                    {/* Logistics Box */}
                    <div style={{ background: 'var(--color-surface-container-low)', padding: 'var(--space-4)', borderRadius: 'var(--radius)', border: '1px solid var(--color-outline-variant)', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                      <div>
                        <span style={{ fontSize: '10px', fontWeight: 600, color: 'var(--color-on-surface-variant)', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
                          {t('new_task.confirm_schedule')}
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: 'var(--text-body-sm)', fontWeight: 600, color: 'var(--color-secondary)' }}>
                          <Calendar size={15} />
                          {form.scheduleType === 'asap' ? t('new_task.schedule_asap') : formatDate(form.date)}
                        </div>
                        {form.scheduleType === 'specific' && form.time && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--color-on-surface-variant)', marginTop: '4px' }}>
                            <Clock size={13} />
                            {form.time}
                          </div>
                        )}
                      </div>

                      <div style={{ borderTop: '1px solid var(--color-outline-variant)', paddingTop: '12px' }}>
                        <span style={{ fontSize: '10px', fontWeight: 600, color: 'var(--color-on-surface-variant)', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
                          {t('new_task.confirm_budget')}
                        </span>
                        <div style={{ fontSize: '20px', fontFamily: 'var(--font-headline)', fontWeight: 700, color: 'var(--color-secondary)' }}>
                          {form.budgetType === 'open_to_offers' 
                            ? t('new_task.open_for_offers') 
                            : form.budgetType === 'fixed' 
                              ? formatCurrency(Number(form.budget)) 
                              : `${formatCurrency(Number(form.budget))}/hr`
                          }
                        </div>
                        <span style={{ fontSize: '11px', color: 'var(--color-on-surface-variant)' }}>
                          {form.budgetType === 'fixed' 
                            ? t('new_task.contract_fixed') 
                            : form.budgetType === 'hourly' 
                              ? t('new_task.contract_hourly') 
                              : t('new_task.contract_open')
                          }
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
              <div className="card-footer" style={{ display: 'flex', justifyContent: 'space-between', padding: 'var(--space-4) var(--space-6)' }}>
                <Button type="button" variant="outlined" onClick={handleBack} disabled={isLoading}>
                  {t('new_task.back')}
                </Button>
                <Button type="submit" variant="primary" size="lg" isLoading={isLoading} style={{ minWidth: '150px' }}>
                  {t('new_task.post_now')}
                </Button>
              </div>
            </div>
          </form>
        )}

      </div>
    </div>
  );
}
