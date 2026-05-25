import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Star, MapPin, Clock, CheckCircle, Calendar, Briefcase, 
  Tag, ShieldCheck, Languages, Truck, Edit, Plus, Trash2, X, Save 
} from 'lucide-react';
import { profileService } from '../../services/profileService';
import { useAppContext } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { Avatar } from '../../components/ui/Avatar';
import { ProfileBadge } from '../../components/ui/Badge';
import { formatCurrency, formatDate, formatRelativeTime } from '../../utils/formatters';
import type { User, CoTaskerProfile, ClientProfile } from '../../types';

export function ProfilePage() {
  const { id } = useParams<{ id: string }>();
  const { state } = useAppContext();
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const [user, setUser] = useState<User | null>(null);
  const [coTaskerProfile, setCoTaskerProfile] = useState<CoTaskerProfile | null>(null);
  const [clientProfile, setClientProfile] = useState<ClientProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Edit states
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editLocation, setEditLocation] = useState('');
  const [editHourlyRate, setEditHourlyRate] = useState<number>(0);
  const [editTransport, setEditTransport] = useState('');
  const [editQualifications, setEditQualifications] = useState<string[]>([]);
  const [editLanguages, setEditLanguages] = useState<string[]>([]);
  const [editSkills, setEditSkills] = useState<string[]>([]);
  const [editCategories, setEditCategories] = useState<string[]>([]);
  const [editPortfolio, setEditPortfolio] = useState<{ title: string; imageUrl: string; description?: string }[]>([]);

  // Local helper input states
  const [newQualification, setNewQualification] = useState('');
  const [newLanguage, setNewLanguage] = useState('');
  const [newSkill, setNewSkill] = useState('');
  const [newPortfolioItem, setNewPortfolioItem] = useState({
    title: '',
    description: '',
    imageUrl: '',
  });

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      setIsLoading(true);
      const [u, co, cl] = await Promise.all([
        profileService.getUserById(id),
        profileService.getCoTaskerProfile(id),
        profileService.getClientProfile(id),
      ]);
      setUser(u);
      setCoTaskerProfile(co);
      setClientProfile(cl);
      setIsLoading(false);
    };
    load();
  }, [id]);

  useEffect(() => {
    if (user) {
      setEditName(user.name);
    }
    if (coTaskerProfile) {
      setEditBio(coTaskerProfile.bio);
      setEditLocation(coTaskerProfile.location);
      setEditHourlyRate(coTaskerProfile.hourlyRate || 0);
      setEditTransport(coTaskerProfile.transport || '');
      setEditQualifications(coTaskerProfile.qualifications || []);
      setEditLanguages(coTaskerProfile.languages || []);
      setEditSkills(coTaskerProfile.skills || []);
      setEditCategories(coTaskerProfile.categories || []);
      setEditPortfolio(coTaskerProfile.portfolio || []);
    } else if (clientProfile) {
      setEditBio(clientProfile.bio || '');
      setEditLocation(clientProfile.location);
    }
  }, [user, coTaskerProfile, clientProfile, isEditing]);

  const handleSave = async () => {
    if (!user) return;
    try {
      setIsLoading(true);
      // Update basic User name
      if (editName.trim() && editName !== user.name) {
        await profileService.updateUser(user.id, { name: editName });
        setUser(prev => prev ? { ...prev, name: editName } : null);
      }

      if (coTaskerProfile) {
        const updated = await profileService.updateCoTaskerProfile(user.id, {
          bio: editBio,
          location: editLocation,
          hourlyRate: editHourlyRate,
          transport: editTransport,
          qualifications: editQualifications,
          languages: editLanguages,
          skills: editSkills,
          categories: editCategories,
          portfolio: editPortfolio,
        });
        setCoTaskerProfile(updated);
      } else if (clientProfile) {
        const updated = await profileService.updateClientProfile(user.id, {
          bio: editBio,
          location: editLocation,
        });
        setClientProfile(updated);
      }
      setIsEditing(false);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  // Helper actions for arrays
  const addQualification = () => {
    if (newQualification.trim() && !editQualifications.includes(newQualification.trim())) {
      setEditQualifications([...editQualifications, newQualification.trim()]);
      setNewQualification('');
    }
  };

  const removeQualification = (index: number) => {
    setEditQualifications(editQualifications.filter((_, i) => i !== index));
  };

  const addLanguage = () => {
    if (newLanguage.trim() && !editLanguages.includes(newLanguage.trim())) {
      setEditLanguages([...editLanguages, newLanguage.trim()]);
      setNewLanguage('');
    }
  };

  const removeLanguage = (index: number) => {
    setEditLanguages(editLanguages.filter((_, i) => i !== index));
  };

  const addSkill = () => {
    if (newSkill.trim() && !editSkills.includes(newSkill.trim())) {
      setEditSkills([...editSkills, newSkill.trim()]);
      setNewSkill('');
    }
  };

  const removeSkill = (index: number) => {
    setEditSkills(editSkills.filter((_, i) => i !== index));
  };

  const toggleCategory = (cat: string) => {
    if (editCategories.includes(cat)) {
      setEditCategories(editCategories.filter(c => c !== cat));
    } else {
      setEditCategories([...editCategories, cat]);
    }
  };

  const addPortfolioItem = () => {
    if (newPortfolioItem.title.trim() && newPortfolioItem.imageUrl.trim()) {
      setEditPortfolio([...editPortfolio, { ...newPortfolioItem }]);
      setNewPortfolioItem({ title: '', description: '', imageUrl: '' });
    }
  };

  const removePortfolioItem = (index: number) => {
    setEditPortfolio(editPortfolio.filter((_, i) => i !== index));
  };

  const reviews = state.reviews.filter((r) => r.toUserId === id);
  const avgRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : null;

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-12)' }}>
        <div className="spinner" style={{ width: 40, height: 40 }} />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="empty-state">
        <h3>User not found</h3>
      </div>
    );
  }

  const isOwnProfile = currentUser?.id === user.id;

  const AVAILABLE_CATEGORIES = [
    'Moving',
    'Cleaning',
    'Furniture Assembly',
    'Painting',
    'Repairs',
    'Delivery',
    'Personal Assistance'
  ];

  return (
    <div>
      {/* Header */}
      <div className="page-topbar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
          <button onClick={() => navigate(-1)} className="btn btn-ghost btn-icon">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-headline-md" style={{ margin: 0, fontWeight: 700 }}>
              {isEditing ? 'Edit Profile' : user.name}
            </h1>
            <p style={{ color: 'var(--color-on-surface-variant)', fontSize: 'var(--text-body-sm)', margin: '4px 0 0 0', textTransform: 'capitalize' }}>
              {user.role === 'cotasker' ? 'Service Provider' : 'Client Profile'}
            </p>
          </div>
        </div>

        {isOwnProfile && (
          <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
            {isEditing ? (
              <>
                <button onClick={handleCancel} className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <X size={15} /> Cancel
                </button>
                <button onClick={handleSave} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Save size={15} /> Save Changes
                </button>
              </>
            ) : (
              <button onClick={() => setIsEditing(true)} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Edit size={16} /> Edit Profile
              </button>
            )}
          </div>
        )}
      </div>

      <div className="page-inner">
        {isEditing ? (
          <div className="bento-grid">
            {/* Editing Left Column */}
            <div className="bento-col-8 flex flex-col gap-6">
              {/* Basic Editing Card */}
              <div className="card">
                <div className="card-header">
                  <h3 className="text-headline-sm" style={{ fontWeight: 700 }}>Basic Information</h3>
                </div>
                <div className="card-body flex flex-col gap-4" style={{ padding: 'var(--space-5)' }}>
                  <div className="form-group">
                    <label className="form-label">Full Name</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Location / City</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      value={editLocation}
                      onChange={(e) => setEditLocation(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">About / Bio</label>
                    <textarea 
                      className="form-control" 
                      rows={4}
                      value={editBio}
                      onChange={(e) => setEditBio(e.target.value)}
                      placeholder="Write a brief intro about yourself, your services, and experience..."
                    />
                  </div>

                  {coTaskerProfile && (
                    <div className="form-group">
                      <label className="form-label">Hourly Rate (€/hr)</label>
                      <input 
                        type="number" 
                        className="form-control" 
                        value={editHourlyRate}
                        onChange={(e) => setEditHourlyRate(Number(e.target.value))}
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Certified Qualifications Edit */}
              {coTaskerProfile && (
                <div className="card">
                  <div className="card-header">
                    <h3 className="text-headline-sm" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700 }}>
                      <ShieldCheck size={18} style={{ color: 'var(--color-secondary-mid)' }} />
                      Certified Qualifications
                    </h3>
                  </div>
                  <div className="card-body flex flex-col gap-4" style={{ padding: 'var(--space-5)' }}>
                    <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                      <input 
                        type="text" 
                        className="form-control" 
                        placeholder="Add a certification (e.g. Certified Handyman IHK)"
                        value={newQualification}
                        onChange={(e) => setNewQualification(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && addQualification()}
                      />
                      <button onClick={addQualification} className="btn btn-outline" style={{ whiteSpace: 'nowrap' }}>
                        <Plus size={16} /> Add
                      </button>
                    </div>

                    <div className="flex flex-col gap-2">
                      {editQualifications.map((q, idx) => (
                        <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 'var(--space-2) var(--space-3)', background: 'var(--color-surface-container-low)', border: '1px solid var(--color-outline-variant)', borderRadius: 'var(--radius)' }}>
                          <span style={{ fontSize: 'var(--text-body-sm)' }}>{q}</span>
                          <button onClick={() => removeQualification(idx)} className="btn btn-ghost btn-icon" style={{ padding: 4, height: 'auto', width: 'auto' }}>
                            <X size={14} style={{ color: 'var(--color-status-error)' }} />
                          </button>
                        </div>
                      ))}
                      {editQualifications.length === 0 && (
                        <p style={{ fontSize: 'var(--text-body-sm)', color: 'var(--color-on-surface-variant)', fontStyle: 'italic', margin: 0 }}>
                          No qualifications added yet.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Portfolio & Past Work Edit */}
              {coTaskerProfile && (
                <div className="card">
                  <div className="card-header">
                    <h3 className="text-headline-sm" style={{ fontWeight: 700 }}>Portfolio & Past Work</h3>
                  </div>
                  <div className="card-body flex flex-col gap-5" style={{ padding: 'var(--space-5)' }}>
                    {/* Add new portfolio item */}
                    <div style={{ border: '1px dashed var(--color-outline)', borderRadius: 'var(--radius)', padding: 'var(--space-4)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                      <h4 style={{ fontWeight: 600, fontSize: '13.5px', margin: 0 }}>Add New Portfolio Item</h4>
                      
                      <div className="form-group">
                        <label className="form-label" style={{ fontSize: '11px' }}>Project Title</label>
                        <input 
                          type="text" 
                          className="form-control" 
                          placeholder="e.g. Wardrobe assembly"
                          value={newPortfolioItem.title}
                          onChange={(e) => setNewPortfolioItem({ ...newPortfolioItem, title: e.target.value })}
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label" style={{ fontSize: '11px' }}>Description</label>
                        <textarea 
                          className="form-control" 
                          rows={2}
                          placeholder="Explain what work was done..."
                          value={newPortfolioItem.description}
                          onChange={(e) => setNewPortfolioItem({ ...newPortfolioItem, description: e.target.value })}
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label" style={{ fontSize: '11px' }}>Image URL</label>
                        <input 
                          type="text" 
                          className="form-control" 
                          placeholder="https://images.unsplash.com/..."
                          value={newPortfolioItem.imageUrl}
                          onChange={(e) => setNewPortfolioItem({ ...newPortfolioItem, imageUrl: e.target.value })}
                        />
                      </div>

                      <button onClick={addPortfolioItem} className="btn btn-outline" style={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Plus size={15} /> Add to Portfolio
                      </button>
                    </div>

                    {/* Current Portfolio list */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 'var(--space-3)' }}>
                      {editPortfolio.map((item, idx) => (
                        <div key={idx} className="card" style={{ display: 'flex', flexDirection: 'column', position: 'relative' }}>
                          <div style={{ overflow: 'hidden', height: '120px', background: 'var(--color-surface-container-high)' }}>
                            <img
                              src={item.imageUrl}
                              alt={item.title}
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                          </div>
                          <div className="card-body" style={{ padding: 'var(--space-3)', flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <h5 style={{ fontWeight: 700, fontSize: '13px', margin: 0 }}>{item.title}</h5>
                            <button 
                              onClick={() => removePortfolioItem(idx)}
                              className="btn btn-ghost btn-icon"
                              style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(255,255,255,0.9)', boxShadow: 'var(--shadow-sm)' }}
                            >
                              <Trash2 size={14} style={{ color: 'var(--color-status-error)' }} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Editing Right Column */}
            <div className="bento-col-4 flex flex-col gap-6">
              {/* Logistics & Communication Edit */}
              {coTaskerProfile && (
                <div className="card">
                  <div className="card-header">
                    <h3 className="text-headline-sm" style={{ fontWeight: 700 }}>Logistics & Langs</h3>
                  </div>
                  <div className="card-body flex flex-col gap-4" style={{ padding: 'var(--space-4)' }}>
                    {/* Transport Edit */}
                    <div className="form-group">
                      <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Truck size={14} /> Transport Info
                      </label>
                      <input 
                        type="text" 
                        className="form-control" 
                        placeholder="e.g. SUV, Mercedes Sprinter Van, Cargo Straps"
                        value={editTransport}
                        onChange={(e) => setEditTransport(e.target.value)}
                      />
                    </div>

                    {/* Languages Edit */}
                    <div className="form-group">
                      <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Languages size={14} /> Languages
                      </label>
                      <div style={{ display: 'flex', gap: 'var(--space-1.5)', marginBottom: '8px' }}>
                        <input 
                          type="text" 
                          className="form-control" 
                          placeholder="e.g. Spanish (Basic)"
                          value={newLanguage}
                          onChange={(e) => setNewLanguage(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && addLanguage()}
                        />
                        <button onClick={addLanguage} className="btn btn-outline" style={{ padding: '0 var(--space-3)' }}>
                          <Plus size={14} />
                        </button>
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                        {editLanguages.map((l, idx) => (
                          <span key={idx} className="chip" style={{ display: 'flex', alignItems: 'center', gap: '4px', textTransform: 'none', letterSpacing: 'normal', fontSize: '10px' }}>
                            {l}
                            <X size={10} style={{ cursor: 'pointer', color: 'var(--color-status-error)' }} onClick={() => removeLanguage(idx)} />
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Skills & Categories Edit */}
              {coTaskerProfile && (
                <div className="card">
                  <div className="card-header">
                    <h3 className="text-headline-sm" style={{ fontWeight: 700 }}>Skills & Categories</h3>
                  </div>
                  <div className="card-body flex flex-col gap-4" style={{ padding: 'var(--space-4)' }}>
                    {/* Categories Checkboxes */}
                    <div>
                      <div className="section-label" style={{ fontSize: '10px', marginBottom: '6px' }}>Core Categories</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {AVAILABLE_CATEGORIES.map(cat => (
                          <label key={cat} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: 'var(--text-body-sm)', cursor: 'pointer' }}>
                            <input 
                              type="checkbox" 
                              checked={editCategories.includes(cat)}
                              onChange={() => toggleCategory(cat)}
                            />
                            {cat}
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Specialist Skills Edit */}
                    <div>
                      <div className="section-label" style={{ fontSize: '10px', marginBottom: '6px' }}>Specialist Skills</div>
                      <div style={{ display: 'flex', gap: 'var(--space-1.5)', marginBottom: '8px' }}>
                        <input 
                          type="text" 
                          className="form-control" 
                          placeholder="e.g. Smart Home Setup"
                          value={newSkill}
                          onChange={(e) => setNewSkill(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && addSkill()}
                        />
                        <button onClick={addSkill} className="btn btn-outline" style={{ padding: '0 var(--space-3)' }}>
                          <Plus size={14} />
                        </button>
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                        {editSkills.map((sk, idx) => (
                          <span key={idx} className="chip" style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px' }}>
                            {sk}
                            <X size={10} style={{ cursor: 'pointer', color: 'var(--color-status-error)' }} onClick={() => removeSkill(idx)} />
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="bento-grid">
            {/* View Mode Left Column */}
            <div className="bento-col-8 flex flex-col gap-6">
              {/* Main profile card */}
              <div className="card">
                <div style={{ background: 'var(--color-secondary)', height: '120px', position: 'relative' }}>
                  <div style={{ position: 'absolute', right: 20, bottom: 20, width: 80, height: 80, borderRadius: '50%', background: 'rgba(255,215,0,0.08)' }} />
                </div>
                <div className="card-body" style={{ position: 'relative', paddingTop: 0, paddingBottom: 'var(--space-6)' }}>
                  <div style={{ marginTop: -48, marginBottom: 'var(--space-4)', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap' }}>
                    <div style={{ display: 'inline-flex', borderRadius: '50%', border: '4px solid var(--color-surface-white)', boxShadow: 'var(--shadow-sm)', overflow: 'hidden' }}>
                      <Avatar name={user.name} avatarUrl={user.avatarUrl} size="xl" />
                    </div>
                    
                    {avgRating && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontFamily: 'var(--font-headline)', fontWeight: 700, fontSize: '24px', color: 'var(--color-secondary)' }}>
                        <Star size={22} fill="var(--color-primary-container)" color="var(--color-primary)" />
                        <span>{avgRating}</span>
                        <span style={{ fontSize: 'var(--text-body-sm)', color: 'var(--color-on-surface-variant)', fontWeight: 400, fontFamily: 'var(--font-body)', marginLeft: '2px' }}>
                          ({reviews.length} reviews)
                        </span>
                      </div>
                    )}
                  </div>

                  {coTaskerProfile && (
                    <div className="flex flex-col gap-4">
                      <p style={{ color: 'var(--color-on-surface-variant)', lineHeight: '1.6', margin: 0, fontSize: 'var(--text-body-md)' }}>
                        {coTaskerProfile.bio || 'No bio provided yet.'}
                      </p>
                      <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
                        {coTaskerProfile.isVerified && <ProfileBadge type="verified" />}
                        {coTaskerProfile.isTopRated && <ProfileBadge type="top-rated" />}
                        {coTaskerProfile.isFastResponder && <ProfileBadge type="fast" />}
                      </div>
                      <div style={{ display: 'flex', gap: 'var(--space-5)', flexWrap: 'wrap', fontSize: 'var(--text-body-sm)', color: 'var(--color-on-surface-variant)', borderTop: '1px solid var(--color-surface-container-highest)', paddingTop: 'var(--space-4)', marginTop: 'var(--space-2)' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <MapPin size={16} style={{ color: 'var(--color-secondary-mid)' }} />
                          {coTaskerProfile.location}
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Clock size={16} style={{ color: 'var(--color-secondary-mid)' }} />
                          Responds {coTaskerProfile.responseTime}
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Briefcase size={16} style={{ color: 'var(--color-secondary-mid)' }} />
                          {coTaskerProfile.completedJobs} jobs completed
                        </span>
                      </div>
                    </div>
                  )}

                  {clientProfile && user.role === 'client' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                      <p style={{ color: 'var(--color-on-surface-variant)', lineHeight: '1.6', margin: 0 }}>
                        {clientProfile.bio || 'No bio provided.'}
                      </p>
                      <div style={{ display: 'flex', gap: 'var(--space-5)', flexWrap: 'wrap', fontSize: 'var(--text-body-sm)', color: 'var(--color-on-surface-variant)', borderTop: '1px solid var(--color-surface-container-highest)', paddingTop: 'var(--space-4)', marginTop: 'var(--space-2)' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <MapPin size={16} style={{ color: 'var(--color-secondary-mid)' }} />
                          {clientProfile.location}
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Calendar size={16} style={{ color: 'var(--color-secondary-mid)' }} />
                          Member since {formatDate(clientProfile.createdAt)}
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <CheckCircle size={16} style={{ color: 'var(--color-secondary-mid)' }} />
                          {clientProfile.tasksPosted} tasks posted
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Qualifications Section */}
              {coTaskerProfile && coTaskerProfile.qualifications && coTaskerProfile.qualifications.length > 0 && (
                <div className="card">
                  <div className="card-header" style={{ padding: 'var(--space-4) var(--space-6)' }}>
                    <h3 className="text-headline-sm" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '16px', fontWeight: 700 }}>
                      <ShieldCheck size={18} style={{ color: 'var(--color-secondary-mid)' }} />
                      Certified Qualifications
                    </h3>
                  </div>
                  <div className="card-body flex flex-col gap-3" style={{ padding: 'var(--space-5)' }}>
                    {coTaskerProfile.qualifications.map((q) => (
                      <div key={q} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <CheckCircle size={16} style={{ color: 'var(--color-status-success)', flexShrink: 0 }} />
                        <span style={{ fontSize: 'var(--text-body-md)', color: 'var(--color-on-surface)', fontWeight: 500 }}>{q}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Portfolio Section */}
              {coTaskerProfile && coTaskerProfile.portfolio && coTaskerProfile.portfolio.length > 0 && (
                <div>
                  <div className="section-label">Portfolio & Past Work</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--space-4)' }}>
                    {coTaskerProfile.portfolio.map((item) => (
                      <div key={item.title} className="card" style={{ display: 'flex', flexDirection: 'column' }}>
                        <div style={{ overflow: 'hidden', height: '170px', background: 'var(--color-surface-container-high)' }}>
                          <img
                            src={item.imageUrl}
                            alt={item.title}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        </div>
                        <div className="card-body" style={{ padding: 'var(--space-4)', flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          <h4 style={{ fontWeight: 700, fontSize: '14.5px', color: 'var(--color-secondary)' }}>{item.title}</h4>
                          {item.description && (
                            <p style={{ fontSize: 'var(--text-body-sm)', color: 'var(--color-on-surface-variant)', lineHeight: '18px', margin: 0 }}>
                              {item.description}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Reviews */}
              <div>
                <div className="section-label">Client Reviews ({reviews.length})</div>
                {reviews.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                    {reviews.map((review) => (
                      <div key={review.id} className="card">
                        <div className="card-body" style={{ padding: 'var(--space-4)' }}>
                          <div style={{ display: 'flex', gap: '2px', marginBottom: 'var(--space-2)' }}>
                            {[1, 2, 3, 4, 5].map(s => (
                              <span key={s} className={`star ${s <= review.rating ? '' : 'star-empty'}`}>★</span>
                            ))}
                          </div>
                          <p style={{ color: 'var(--color-on-surface-variant)', fontStyle: 'italic', margin: 0, fontSize: 'var(--text-body-sm)' }}>
                            "{review.comment}"
                          </p>
                          <div style={{ fontSize: 'var(--text-label-md)', color: 'var(--color-on-surface-variant)', marginTop: 'var(--space-2)' }}>
                            {formatRelativeTime(review.createdAt)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="card">
                    <div className="empty-state">
                      <h3 className="text-headline-sm" style={{ marginBottom: 'var(--space-2)' }}>No reviews yet</h3>
                      <p>Reviews will appear here after completing tasks on the platform.</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* View Mode Right Column */}
            <div className="bento-col-4 flex flex-col gap-6">
              {coTaskerProfile && (
                <>
                  {/* Stats Card */}
                  <div className="card">
                    <div className="card-header">
                      <h3 className="text-headline-sm" style={{ fontWeight: 700 }}>Performance</h3>
                    </div>
                    <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', padding: 'var(--space-4)' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-2)' }}>
                        <div className="stat-card" style={{ padding: 'var(--space-3)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                          <div className="stat-value" style={{ fontSize: '20px' }}>{coTaskerProfile.rating}</div>
                          <div className="stat-label" style={{ fontSize: '10px' }}>Rating</div>
                        </div>
                        <div className="stat-card" style={{ padding: 'var(--space-3)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                          <div className="stat-value" style={{ fontSize: '20px' }}>{coTaskerProfile.completedJobs}</div>
                          <div className="stat-label" style={{ fontSize: '10px' }}>Jobs Done</div>
                        </div>
                      </div>

                      {coTaskerProfile.hourlyRate && (
                        <div style={{ padding: 'var(--space-3)', background: 'var(--color-surface-container-low)', borderRadius: 'var(--radius)', border: '1px solid var(--color-outline-variant)' }}>
                          <div className="section-label" style={{ fontSize: '10px', marginBottom: '4px' }}>Hourly Rate</div>
                          <div style={{ fontFamily: 'var(--font-headline)', fontWeight: 700, fontSize: '22px', color: 'var(--color-secondary)' }}>
                            {formatCurrency(coTaskerProfile.hourlyRate)}/hr
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Logistics & Communication Card */}
                  <div className="card">
                    <div className="card-header">
                      <h3 className="text-headline-sm" style={{ fontWeight: 700 }}>Logistics</h3>
                    </div>
                    <div className="card-body flex flex-col gap-4" style={{ padding: 'var(--space-4)' }}>
                      {coTaskerProfile.transport && (
                        <div>
                          <div className="section-label" style={{ fontSize: '10px', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Truck size={12} style={{ color: 'var(--color-secondary-mid)' }} />
                            Transport
                          </div>
                          <div style={{ fontSize: 'var(--text-body-sm)', color: 'var(--color-on-surface)', lineHeight: '18px', fontWeight: 500 }}>
                            {coTaskerProfile.transport}
                          </div>
                        </div>
                      )}
                      {coTaskerProfile.languages && coTaskerProfile.languages.length > 0 && (
                        <div>
                          <div className="section-label" style={{ fontSize: '10px', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Languages size={12} style={{ color: 'var(--color-secondary-mid)' }} />
                            Languages Spoken
                          </div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                            {coTaskerProfile.languages.map((l) => (
                              <span key={l} className="chip" style={{ fontSize: '10px', textTransform: 'none', letterSpacing: 'normal', padding: '3px 8px' }}>
                                {l}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Skills/Categories */}
                  <div className="card">
                    <div className="card-header">
                      <h3 className="text-headline-sm" style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Tag size={16} style={{ color: 'var(--color-secondary-mid)' }} />
                        Skills & Categories
                      </h3>
                    </div>
                    <div className="card-body" style={{ padding: 'var(--space-4)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                      <div>
                        <div className="section-label" style={{ fontSize: '10px', marginBottom: '6px' }}>Core Categories</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-1.5)' }}>
                          {coTaskerProfile.categories.map((cat) => (
                            <span key={cat} className="chip chip-active" style={{ fontSize: '10px' }}>{cat}</span>
                          ))}
                        </div>
                      </div>
                      {coTaskerProfile.skills && coTaskerProfile.skills.length > 0 && (
                        <div>
                          <div className="section-label" style={{ fontSize: '10px', marginBottom: '6px' }}>Specialist Skills</div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-1.5)' }}>
                            {coTaskerProfile.skills.map((skill) => (
                              <span key={skill} className="chip" style={{ fontSize: '10px', background: 'var(--color-surface-container-low)' }}>{skill}</span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}

              {clientProfile && user.role === 'client' && (
                <div className="card">
                  <div className="card-header">
                    <h3 className="text-headline-sm" style={{ fontWeight: 700 }}>Activity</h3>
                  </div>
                  <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', padding: 'var(--space-4)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-body-sm)' }}>
                      <span style={{ color: 'var(--color-on-surface-variant)' }}>Tasks Posted</span>
                      <strong style={{ color: 'var(--color-secondary)' }}>{clientProfile.tasksPosted}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-body-sm)' }}>
                      <span style={{ color: 'var(--color-on-surface-variant)' }}>Completed Tasks</span>
                      <strong style={{ color: 'var(--color-secondary)' }}>{clientProfile.completedTasks}</strong>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
