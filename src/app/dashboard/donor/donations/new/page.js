'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/Toast';

function NewDonationForm() {
  const { user, getToken } = useAuth();
  const { showSuccess, showError } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [step, setStep] = useState(1);
  const [categories, setCategories] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [pickupSlots, setPickupSlots] = useState([]);
  const [prohibitedItems, setProhibitedItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [smartMatches, setSmartMatches] = useState([]);
  const [loadingMatches, setLoadingMatches] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    category_id: searchParams.get('category_id') ? Number(searchParams.get('category_id')) : '',
    item_type: searchParams.get('item_type') || '',
    quantity: 1,
    condition: 'good',
    description: '',
    size_weight: '',
    organization_id: searchParams.get('org_id') ? Number(searchParams.get('org_id')) : '',
    pickup_address: user?.city ? `${user.name}'s Residence, ${user.city}` : '',
    pickup_city: user?.city || 'Mumbai',
    pickup_pin_code: user?.pin_code || '400001',
    pickup_date: '',
    pickup_time_slot: '',
    pickup_instructions: '',
    pickup_contact_phone: user?.phone || '',
    landmark: '',
    num_packages: 1,
  });

  useEffect(() => {
    async function loadFormMetadata() {
      try {
        const [catRes, orgRes, slotRes, proRes] = await Promise.all([
          fetch('/api/categories'),
          fetch('/api/organizations?status=verified'),
          fetch('/api/pickup-slots'),
          fetch('/api/prohibited-items'),
        ]);

        if (catRes.ok) {
          const catData = await catRes.json();
          setCategories(catData.categories || []);
        }
        if (orgRes.ok) {
          const orgData = await orgRes.json();
          setOrganizations(orgData.organizations || []);
        }
        if (slotRes.ok) {
          const slotData = await slotRes.json();
          setPickupSlots(slotData.slots || []);
          if (slotData.slots?.length > 0) {
            setFormData((prev) => ({ ...prev, pickup_time_slot: slotData.slots[0].slot_label }));
          }
        }
        if (proRes.ok) {
          const proData = await proRes.json();
          setProhibitedItems(proData.items || []);
        }
      } catch (err) {
        console.error('Failed to load donation form metadata:', err);
      } finally {
        setLoading(false);
      }
    }

    loadFormMetadata();

    // Default pickup date to tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.toISOString().split('T')[0];
    setFormData((prev) => ({ ...prev, pickup_date: dateStr }));
  }, [user]);

  const selectedCategory = categories.find((c) => c.id === Number(formData.category_id));

  const handleNext = () => {
    if (step === 1) {
      if (!formData.category_id || !formData.item_type) {
        showError('Please select a category and item type.');
        return;
      }
    } else if (step === 2) {
      if (!formData.quantity || formData.quantity < 1) {
        showError('Quantity must be at least 1.');
        return;
      }
      // Load Smart Matches when transitioning to step 3
      fetchSmartMatches();
    } else if (step === 4) {
      if (!formData.pickup_address || !formData.pickup_city || !formData.pickup_date) {
        showError('Please fill in required pickup details.');
        return;
      }
    }
    setStep((prev) => Math.min(5, prev + 1));
  };

  const fetchSmartMatches = async () => {
    setLoadingMatches(true);
    try {
      const query = new URLSearchParams({
        category_id: formData.category_id,
        item_type: formData.item_type,
        city: formData.pickup_city || 'Mumbai',
      });
      const res = await fetch(`/api/donations/match?${query.toString()}`);
      if (res.ok) {
        const matchData = await res.json();
        setSmartMatches(matchData.matches || []);
        // Pre-select the best match if any are available
        if (matchData.matches && matchData.matches.length > 0) {
          setFormData((prev) => ({ ...prev, organization_id: matchData.matches[0].id }));
        }
      }
    } catch (err) {
      console.error('Failed to load smart matches:', err);
    } finally {
      setLoadingMatches(false);
    }
  };

  const handlePrev = () => {
    setStep((prev) => Math.max(1, prev - 1));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const token = getToken();
      const res = await fetch('/api/donations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (res.ok) {
        showSuccess(`Donation submitted! Reference: ${data.donation.donation_id}`);
        router.push(`/dashboard/donor/donations/${data.donation.id}`);
      } else {
        showError(data.error || 'Failed to create donation.');
      }
    } catch (err) {
      showError('Network error. Failed to submit donation.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-center">
        <div className="spinner spinner-lg" />
      </div>
    );
  }

  return (
    <>
      <div className="dashboard-content-header">
        <h1>Create a New Donation</h1>
        <p>Follow the simple steps below to schedule doorstep collection for your items.</p>
      </div>

      {/* Steps Progress Indicator */}
      <div className="steps">
        <div className={`step ${step === 1 ? 'active' : ''} ${step > 1 ? 'completed' : ''}`}>
          <div className="step-number">1</div>
          <div className="step-label">Category</div>
        </div>
        <div className="step-connector" />

        <div className={`step ${step === 2 ? 'active' : ''} ${step > 2 ? 'completed' : ''}`}>
          <div className="step-number">2</div>
          <div className="step-label">Details</div>
        </div>
        <div className="step-connector" />

        <div className={`step ${step === 3 ? 'active' : ''} ${step > 3 ? 'completed' : ''}`}>
          <div className="step-number">3</div>
          <div className="step-label">Select NGO</div>
        </div>
        <div className="step-connector" />

        <div className={`step ${step === 4 ? 'active' : ''} ${step > 4 ? 'completed' : ''}`}>
          <div className="step-number">4</div>
          <div className="step-label">Pickup</div>
        </div>
        <div className="step-connector" />

        <div className={`step ${step === 5 ? 'active' : ''}`}>
          <div className="step-number">5</div>
          <div className="step-label">Review</div>
        </div>
      </div>

      <div className="card container-narrow mx-auto p-8">
        {/* Step 1: Category & Item Type */}
        {step === 1 && (
          <div className="animate-fade-in flex flex-col gap-6">
            <h3 className="text-xl">Step 1: What would you like to donate?</h3>

            <div className="form-group">
              <label className="form-label">Select Category *</label>
              <div className="grid grid-3 gap-3">
                {categories.map((cat) => (
                  <div
                    key={cat.id}
                    className={`category-card ${Number(formData.category_id) === cat.id ? 'selected' : ''}`}
                    onClick={() => {
                      setFormData({ ...formData, category_id: cat.id, item_type: '' });
                    }}
                  >
                    <div className="category-icon">{cat.icon}</div>
                    <h4>{cat.name}</h4>
                  </div>
                ))}
              </div>
            </div>

            {selectedCategory && (
              <div className="form-group animate-slide-down">
                <label className="form-label">Select Specific Item Type *</label>
                <div className="flex flex-wrap gap-2">
                  {selectedCategory.item_types?.map((it) => (
                    <button
                      key={it.id}
                      type="button"
                      className={`btn btn-sm ${formData.item_type === it.name ? 'btn-primary' : 'btn-secondary'}`}
                      onClick={() => setFormData({ ...formData, item_type: it.name })}
                    >
                      {it.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Prohibited items warning */}
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-xs">
              <div className="font-semibold text-warning mb-1">⚠️ Prohibited Items Check</div>
              <p className="text-secondary">
                We cannot accept hazardous chemicals, weapons, severely damaged/torn items, or expired food products.
              </p>
            </div>
          </div>
        )}

        {/* Step 2: Quantity & Condition */}
        {step === 2 && (
          <div className="animate-fade-in flex flex-col gap-6">
            <h3 className="text-xl">Step 2: Item Details & Condition</h3>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Quantity *</label>
                <input
                  type="number"
                  min="1"
                  className="form-input"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 1 })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Size / Weight Estimate</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Medium bag, 5 kg"
                  value={formData.size_weight}
                  onChange={(e) => setFormData({ ...formData, size_weight: e.target.value })}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Item Condition *</label>
              <div className="condition-options">
                {[
                  { id: 'new', label: 'Brand New', desc: 'Unused with tags' },
                  { id: 'like_new', label: 'Like New', desc: 'Minimal wear, perfect' },
                  { id: 'good', label: 'Good', desc: 'Gently used, clean' },
                  { id: 'fair', label: 'Fair', desc: 'Usable, visible wear' },
                ].map((cond) => (
                  <div
                    key={cond.id}
                    className={`condition-option ${formData.condition === cond.id ? 'selected' : ''}`}
                    onClick={() => setFormData({ ...formData, condition: cond.id })}
                  >
                    <h5>{cond.label}</h5>
                    <p>{cond.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Item Description & Notes</label>
              <textarea
                className="form-textarea"
                placeholder="Describe the items (color, brand, sizes, hygiene status)..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
          </div>
        )}

        {/* Step 3: NGO Selection */}
        {step === 3 && (
          <div className="animate-fade-in flex flex-col gap-6">
            <h3 className="text-xl">Step 3: Select Recipient NGO (Optional)</h3>
            <p className="text-xs text-secondary">
              You can choose a preferred verified NGO in your city, or let our platform auto-match with organizations in greatest need.
            </p>

            {/* Smart Matching Recommendations */}
            <div>
              <h4 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-1.5">
                ✨ System Recommended Best Matches
              </h4>
              {loadingMatches ? (
                <div className="p-4 bg-white border border-dashed rounded-xl flex justify-center items-center">
                  <div className="spinner spinner-sm mr-2" />
                  <span className="text-xs text-tertiary">Analyzing demands & calculating distances...</span>
                </div>
              ) : smartMatches.length === 0 ? (
                <div className="p-4 bg-gray-50 border rounded-xl text-center text-xs text-tertiary">
                  No direct demands found in your city. Select an NGO below or use Automatic Matching.
                </div>
              ) : (
                <div className="grid grid-3 gap-3 mb-4">
                  {smartMatches.map((match, idx) => {
                    const medals = ['🥇', '🥈', '🥉'];
                    const isSelected = Number(formData.organization_id) === match.id;
                    return (
                      <div
                        key={match.id}
                        onClick={() => setFormData({ ...formData, organization_id: match.id })}
                        className={`p-4 border-2 rounded-xl cursor-pointer transition-all flex flex-col justify-between ${
                          isSelected ? 'border-primary-500 bg-primary-50' : 'border-gray-200 bg-white hover:border-gray-300'
                        }`}
                      >
                        <div>
                          <div className="flex items-center gap-1 text-base mb-1">
                            <span>{medals[idx]}</span>
                            <span className="font-bold text-xs text-gray-900 line-clamp-1">{match.org_name}</span>
                          </div>
                          <div className="text-[11px] text-tertiary mb-2">
                            📍 {match.distance} km away • {match.city}
                          </div>
                          <div className="text-[11px] font-semibold text-secondary mb-1">
                            {match.needText || 'Accepts items in this category'}
                          </div>
                        </div>
                        <div className="mt-3 pt-2 border-t border-gray-100 flex items-center justify-between">
                          <span className={`text-[10px] uppercase font-bold badge ${
                            match.priority === 'urgent' ? 'badge-error' : match.priority === 'high' ? 'badge-warning' : 'badge-info'
                          }`}>
                            {match.priority} Urgency
                          </span>
                          <button
                            type="button"
                            className={`btn btn-xs ${isSelected ? 'btn-primary' : 'btn-outline'}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              setFormData({ ...formData, organization_id: match.id });
                            }}
                          >
                            {isSelected ? 'Selected' : 'Select'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="flex flex-col gap-3">
              <div
                className={`p-4 border-2 rounded-xl cursor-pointer ${!formData.organization_id ? 'border-primary-500 bg-primary-50' : 'border-gray-200'}`}
                onClick={() => setFormData({ ...formData, organization_id: '' })}
              >
                <div className="font-semibold text-sm">✨ Automatic NGO Matching (Fallback)</div>
                <div className="text-xs text-tertiary">Our algorithm matches your items to NGOs with active urgent needs in your area.</div>
              </div>

              {organizations.map((org) => (
                <div
                  key={org.id}
                  className={`p-4 border-2 rounded-xl cursor-pointer ${Number(formData.organization_id) === org.id ? 'border-primary-500 bg-primary-50' : 'border-gray-200'}`}
                  onClick={() => setFormData({ ...formData, organization_id: org.id })}
                >
                  <div className="flex items-center justify-between">
                    <div className="font-semibold text-sm">{org.org_name}</div>
                    <span className="badge badge-success text-xs">Verified</span>
                  </div>
                  <div className="text-xs text-tertiary mt-1">📍 {org.city} • Type: {org.org_type}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step 4: Pickup Scheduling */}
        {step === 4 && (
          <div className="animate-fade-in flex flex-col gap-6">
            <h3 className="text-xl">Step 4: Doorstep Pickup Details</h3>

            <div className="form-group">
              <label className="form-label">Pickup Address *</label>
              <textarea
                className="form-textarea"
                rows={2}
                placeholder="Full street address, apartment number..."
                value={formData.pickup_address}
                onChange={(e) => setFormData({ ...formData, pickup_address: e.target.value })}
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">City *</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.pickup_city}
                  onChange={(e) => setFormData({ ...formData, pickup_city: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">PIN Code *</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.pickup_pin_code}
                  onChange={(e) => setFormData({ ...formData, pickup_pin_code: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Preferred Date *</label>
                <input
                  type="date"
                  className="form-input"
                  value={formData.pickup_date}
                  onChange={(e) => setFormData({ ...formData, pickup_date: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Time Slot *</label>
                <select
                  className="form-select"
                  value={formData.pickup_time_slot}
                  onChange={(e) => setFormData({ ...formData, pickup_time_slot: e.target.value })}
                >
                  {pickupSlots.map((slot) => (
                    <option key={slot.id} value={slot.slot_label}>
                      {slot.slot_label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Contact Phone Number *</label>
              <input
                type="tel"
                className="form-input"
                value={formData.pickup_contact_phone}
                onChange={(e) => setFormData({ ...formData, pickup_contact_phone: e.target.value })}
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Landmark</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Near Main Market, Opp. ICICI Bank"
                  value={formData.landmark}
                  onChange={(e) => setFormData({ ...formData, landmark: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Number of Packages *</label>
                <input
                  type="number"
                  min="1"
                  className="form-input"
                  value={formData.num_packages}
                  onChange={(e) => setFormData({ ...formData, num_packages: parseInt(e.target.value) || 1 })}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Special Pickup Instructions</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Ring bell on 2nd floor, call before arriving..."
                value={formData.pickup_instructions}
                onChange={(e) => setFormData({ ...formData, pickup_instructions: e.target.value })}
              />
            </div>
          </div>
        )}

        {/* Step 5: Review & Submit */}
        {step === 5 && (
          <div className="animate-fade-in flex flex-col gap-6">
            <h3 className="text-xl">Step 5: Review Your Donation</h3>

            <div className="p-4 bg-gray-50 rounded-xl flex flex-col gap-3 text-sm">
              <div className="flex justify-between border-b pb-2">
                <span className="text-tertiary">Category & Type</span>
                <span className="font-semibold">{selectedCategory?.name} → {formData.item_type}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-tertiary">Quantity & Condition</span>
                <span className="font-semibold">{formData.quantity} items ({formData.condition})</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-tertiary">Target NGO</span>
                <span className="font-semibold">
                  {formData.organization_id
                    ? organizations.find((o) => o.id === Number(formData.organization_id))?.org_name
                    : 'Auto-match by platform'}
                </span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-tertiary">Pickup Address</span>
                <span className="font-semibold text-right">
                  {formData.pickup_address}, {formData.pickup_city} ({formData.pickup_pin_code})
                  {formData.landmark && <span className="display-block text-xs font-normal text-tertiary">Landmark: {formData.landmark}</span>}
                </span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-tertiary">Packages & Est. Weight</span>
                <span className="font-semibold">{formData.num_packages} pkg • {formData.size_weight || 'Not specified'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-tertiary">Scheduled Slot</span>
                <span className="font-semibold">{formData.pickup_date} @ {formData.pickup_time_slot}</span>
              </div>
            </div>

            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-primary-800">
              🤝 By submitting, you confirm that items are clean, usable, and accurately described.
            </div>
          </div>
        )}

        {/* Form Actions */}
        <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-100">
          {step > 1 ? (
            <button type="button" className="btn btn-secondary" onClick={handlePrev}>
              ← Back
            </button>
          ) : (
            <div />
          )}

          {step < 5 ? (
            <button type="button" className="btn btn-primary" onClick={handleNext}>
              Continue →
            </button>
          ) : (
            <button
              type="button"
              className="btn btn-primary btn-lg"
              onClick={handleSubmit}
              disabled={submitting}
            >
              {submitting ? <span className="spinner" /> : 'Confirm & Submit Donation'}
            </button>
          )}
        </div>
      </div>
    </>
  );
}

export default function NewDonationPage() {
  return (
    <DashboardLayout allowedRoles={['donor']}>
      <Suspense fallback={<div className="loading-center"><div className="spinner spinner-lg" /></div>}>
        <NewDonationForm />
      </Suspense>
    </DashboardLayout>
  );
}
