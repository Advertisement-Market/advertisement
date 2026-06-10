import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axiosInstance';
import './BillboardOwnerDashboard.css';

const ASSET_TYPES = ['BILLBOARD', 'HOARDING', 'DIGITAL', 'BUS_SHELTER'];

const STATUS_META = {
  PENDING_REVIEW: { label: 'Pending Review', color: 'status-pending' },
  ACTIVE:         { label: 'Active',          color: 'status-active'  },
  INACTIVE:       { label: 'Inactive',        color: 'status-inactive'},
  REJECTED:       { label: 'Rejected',        color: 'status-rejected'},
};

const TYPE_ICONS = {
  BILLBOARD:   '🏙️',
  HOARDING:    '🖼️',
  DIGITAL:     '📺',
  BUS_SHELTER: '🚌',
};

const EMPTY_FORM = { assetType: '', address: '', additionalInfo: '' };

const BillboardOwnerDashboard = () => {
  const { user } = useAuth();
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');

  // Create modal state
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState({});
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');

  // Image upload state per asset
  const [uploadingId, setUploadingId] = useState(null);
  const [uploadMsg, setUploadMsg] = useState('');
  const fileInputRefs = useRef({});

  const fetchAssets = async () => {
    try {
      setFetchError('');
      const res = await api.get('/api/v1/assets');
      setAssets(res.data);
    } catch (err) {
      setFetchError(
        err.response?.data?.message ||
        'Could not load assets. Make sure the backend is running.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssets();
  }, []);

  // Stats
  const total   = assets.length;
  const active  = assets.filter(a => a.status === 'ACTIVE').length;
  const pending = assets.filter(a => a.status === 'PENDING_REVIEW').length;

  // Create asset
  const validateForm = () => {
    const errors = {};
    if (!form.assetType) errors.assetType = 'Select an asset type.';
    if (!form.address.trim()) errors.address = 'Address is required.';
    return errors;
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    const errors = validateForm();
    if (Object.keys(errors).length > 0) { setFormErrors(errors); return; }

    setCreating(true);
    setCreateError('');
    try {
      const res = await api.post('/api/v1/assets', {
        assetType: form.assetType,
        address: form.address,
        additionalInfo: form.additionalInfo || null,
      });
      setAssets(prev => [res.data, ...prev]);
      setShowModal(false);
      setForm(EMPTY_FORM);
      setFormErrors({});
    } catch (err) {
      setCreateError(err.response?.data?.message || 'Failed to create asset.');
    } finally {
      setCreating(false);
    }
  };

  // Upload images
  const handleUploadImages = async (assetId, files) => {
    if (!files || files.length === 0) return;
    setUploadingId(assetId);
    setUploadMsg('');

    const formData = new FormData();
    Array.from(files).forEach(f => formData.append('files', f));

    try {
      const res = await api.post(`/api/v1/assets/${assetId}/images`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      // Update the asset in local state
      setAssets(prev => prev.map(a => a.assetId === assetId ? res.data : a));
      setUploadMsg(`✓ ${files.length} image(s) uploaded`);
    } catch (err) {
      setUploadMsg(err.response?.data?.message || '✗ Upload failed');
    } finally {
      setUploadingId(null);
      // Reset the file input
      if (fileInputRefs.current[assetId]) {
        fileInputRefs.current[assetId].value = '';
      }
      setTimeout(() => setUploadMsg(''), 3000);
    }
  };

  return (
    <div className="owner-dashboard">
      {/* Page Header */}
      <div className="dash-header">
        <div className="dash-header-inner">
          <div className="dash-welcome">
            <h1 className="dash-title">My Billboard Assets</h1>
            <p className="dash-subtitle">
              Welcome back, <strong>{user?.email}</strong>
              <span className="role-tag">Billboard Owner</span>
            </p>
          </div>
          <button className="add-asset-btn" onClick={() => { setShowModal(true); setCreateError(''); setForm(EMPTY_FORM); setFormErrors({}); }}>
            <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"/>
            </svg>
            Add New Asset
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-row">
        <div className="stat-card">
          <span className="stat-value">{total}</span>
          <span className="stat-label">Total Assets</span>
        </div>
        <div className="stat-card stat-card-green">
          <span className="stat-value">{active}</span>
          <span className="stat-label">Active</span>
        </div>
        <div className="stat-card stat-card-amber">
          <span className="stat-value">{pending}</span>
          <span className="stat-label">Pending Review</span>
        </div>
        <div className="stat-card stat-card-blue">
          <span className="stat-value">{total - active - pending}</span>
          <span className="stat-label">Other</span>
        </div>
      </div>

      {/* Info banner */}
      <div className="info-banner">
        <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
        </svg>
        Assets become <strong>Active</strong> automatically once you upload at least 3 images.
      </div>

      {/* Assets Grid */}
      <div className="assets-section">
        {loading ? (
          <div className="dash-loading">
            <div className="dash-spinner" />
            Loading your assets...
          </div>
        ) : fetchError ? (
          <div className="dash-error">
            <span>⚠️ {fetchError}</span>
            <button onClick={fetchAssets} className="retry-btn">Retry</button>
          </div>
        ) : assets.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🏙️</div>
            <h3>No assets yet</h3>
            <p>Click "Add New Asset" to list your first billboard location.</p>
            <button className="add-asset-btn" onClick={() => setShowModal(true)}>
              + Add First Asset
            </button>
          </div>
        ) : (
          <div className="assets-grid">
            {assets.map(asset => {
              const statusMeta = STATUS_META[asset.status] || STATUS_META.PENDING_REVIEW;
              const isUploading = uploadingId === asset.assetId;
              return (
                <div key={asset.assetId} className="asset-card">
                  {/* Image preview */}
                  <div className="asset-image-area">
                    {asset.imageUrls && asset.imageUrls.length > 0 ? (
                      <img
                        src={asset.imageUrls[0]}
                        alt={asset.address}
                        className="asset-thumb"
                        onError={e => { e.target.style.display = 'none'; }}
                      />
                    ) : (
                      <div className="asset-no-image">
                        <span className="asset-type-big-icon">{TYPE_ICONS[asset.assetType] || '📍'}</span>
                        <span>No images yet</span>
                      </div>
                    )}
                    <span className={`asset-status-badge ${statusMeta.color}`}>
                      {statusMeta.label}
                    </span>
                  </div>

                  {/* Asset info */}
                  <div className="asset-body">
                    <div className="asset-type-row">
                      <span className="asset-type-icon">{TYPE_ICONS[asset.assetType]}</span>
                      <span className="asset-type-label">
                        {asset.assetType.replace('_', ' ')}
                      </span>
                      <span className="asset-img-count">
                        🖼 {asset.imageUrls?.length || 0} image{asset.imageUrls?.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                    <p className="asset-address">{asset.address}</p>
                    {asset.additionalInfo && (
                      <p className="asset-info">{asset.additionalInfo}</p>
                    )}
                    <p className="asset-date">
                      Added {new Date(asset.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric', month: 'short', year: 'numeric'
                      })}
                    </p>
                  </div>

                  {/* Upload images section */}
                  <div className="asset-upload-section">
                    <label
                      htmlFor={`upload-${asset.assetId}`}
                      className={`upload-label ${isUploading ? 'uploading' : ''}`}
                    >
                      {isUploading ? (
                        <>
                          <span className="upload-spinner" /> Uploading...
                        </>
                      ) : (
                        <>
                          <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/>
                          </svg>
                          Upload Images
                        </>
                      )}
                    </label>
                    <input
                      id={`upload-${asset.assetId}`}
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      multiple
                      className="upload-input"
                      ref={el => fileInputRefs.current[asset.assetId] = el}
                      onChange={e => handleUploadImages(asset.assetId, e.target.files)}
                      disabled={isUploading}
                    />
                    {uploadingId === null && uploadMsg && assets[0]?.assetId === asset.assetId && (
                      <span className="upload-msg">{uploadMsg}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Upload message toast */}
      {uploadMsg && uploadingId === null && (
        <div className={`upload-toast ${uploadMsg.startsWith('✓') ? 'toast-success' : 'toast-error'}`}>
          {uploadMsg}
        </div>
      )}

      {/* Create Asset Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false); }}>
          <div className="modal">
            <div className="modal-header">
              <h2>Add New Billboard Asset</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>

            {createError && (
              <div className="modal-error">⚠️ {createError}</div>
            )}

            <form onSubmit={handleCreate} className="modal-form">
              <div className="modal-form-group">
                <label className="form-label">Asset Type <span className="req">*</span></label>
                <div className="type-grid">
                  {ASSET_TYPES.map(type => (
                    <button
                      key={type}
                      type="button"
                      className={`type-btn ${form.assetType === type ? 'selected' : ''}`}
                      onClick={() => { setForm({ ...form, assetType: type }); setFormErrors(p => ({ ...p, assetType: '' })); }}
                    >
                      <span>{TYPE_ICONS[type]}</span>
                      <span>{type.replace('_', ' ')}</span>
                    </button>
                  ))}
                </div>
                {formErrors.assetType && <span className="fe">{formErrors.assetType}</span>}
              </div>

              <div className="modal-form-group">
                <label className="form-label">Location / Address <span className="req">*</span></label>
                <textarea
                  value={form.address}
                  onChange={e => { setForm({ ...form, address: e.target.value }); setFormErrors(p => ({ ...p, address: '' })); }}
                  className={`modal-textarea ${formErrors.address ? 'input-err' : ''}`}
                  placeholder="Full address of the billboard location"
                  rows={3}
                />
                {formErrors.address && <span className="fe">{formErrors.address}</span>}
              </div>

              <div className="modal-form-group">
                <label className="form-label">
                  Additional Info
                  <span className="opt">Optional</span>
                </label>
                <textarea
                  value={form.additionalInfo}
                  onChange={e => setForm({ ...form, additionalInfo: e.target.value })}
                  className="modal-textarea"
                  placeholder="Dimensions, visibility notes, traffic data, etc."
                  rows={2}
                />
              </div>

              <div className="modal-actions">
                <button type="button" className="modal-cancel" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="modal-submit" disabled={creating}>
                  {creating ? (
                    <><span className="upload-spinner" /> Creating...</>
                  ) : (
                    'Create Asset'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BillboardOwnerDashboard;
