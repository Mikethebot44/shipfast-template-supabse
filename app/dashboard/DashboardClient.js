'use client';

import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';

const Nav = ({ active, onChange }) => {
  const tabs = [
    { key: 'dashboard', label: 'Dashboard' },
    { key: 'products', label: 'My Products' },
    { key: 'swaps', label: 'Swap Requests' },
    { key: 'settings', label: 'Settings / Profile' },
  ];
  return (
    <div className="tabs tabs-boxed w-full">
      {tabs.map((t) => (
        <a
          key={t.key}
          className={`tab ${active === t.key ? 'tab-active' : ''}`}
          onClick={() => onChange(t.key)}
        >
          {t.label}
        </a>
      ))}
    </div>
  );
};

const QuickStats = ({ stats }) => {
  return (
    <div className="w-full grid grid-cols-1 sm:grid-cols-3 gap-4">
      <div className="stat bg-base-100 shadow rounded-box">
        <div className="stat-title">Completed swaps</div>
        <div className="stat-value text-success">{stats.completed}</div>
      </div>
      <div className="stat bg-base-100 shadow rounded-box">
        <div className="stat-title">Pending swaps</div>
        <div className="stat-value text-warning">{stats.pending}</div>
      </div>
      <div className="stat bg-base-100 shadow rounded-box">
        <div className="stat-title">Credits available</div>
        <div className="stat-value text-info">{stats.credits}</div>
      </div>
    </div>
  );
};

const ProductCard = ({ product, onRequest, requested }) => {
  return (
    <div className="card bg-base-100 shadow">
      <div className="card-body">
        <h3 className="card-title"><a href={product.url} target="_blank" rel="noreferrer" className="link link-primary">{product.name}</a></h3>
        <p className="opacity-80">{product.tagline}</p>
        <div className="flex items-center gap-2">
          <div className="badge badge-outline">{product.platform}</div>
        </div>
        <div className="card-actions justify-end mt-4">
          <button
            className="btn btn-primary btn-sm"
            onClick={() => onRequest(product)}
            disabled={requested}
          >
            {requested ? 'Requested' : 'Request Swap'}
          </button>
        </div>
      </div>
    </div>
  );
};

const ProductForm = ({ onSaved, product }) => {
  const [name, setName] = useState(product?.name || '');
  const [url, setUrl] = useState(product?.url || '');
  const [tagline, setTagline] = useState(product?.tagline || '');
  const [platform, setPlatform] = useState(product?.platform || 'Twitter');
  const [logoUrl, setLogoUrl] = useState(product?.logo_url || '');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setName(product?.name || '');
    setUrl(product?.url || '');
    setTagline(product?.tagline || '');
    setPlatform(product?.platform || 'Twitter');
    setLogoUrl(product?.logo_url || '');
  }, [product]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !url || !tagline || !platform) {
      toast.error('Please fill all required fields');
      return;
    }
    try {
      setSaving(true);
      if (product?.id) {
        await axios.put(`/api/adswap/products/${product.id}`, {
          name,
          url,
          tagline,
          platform,
          logo_url: logoUrl,
        });
        toast.success('Product updated');
      } else {
        await axios.post('/api/adswap/products/mine', {
          name,
          url,
          tagline,
          platform,
          logo_url: logoUrl,
        });
        toast.success('Product added');
      }
      onSaved?.();
    } catch (e) {
      toast.error('Save failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="form-control">
        <label className="label"><span className="label-text">Product Name</span></label>
        <input className="input input-bordered" value={name} onChange={(e) => setName(e.target.value)} required />
      </div>
      <div className="form-control">
        <label className="label"><span className="label-text">URL</span></label>
        <input className="input input-bordered" value={url} onChange={(e) => setUrl(e.target.value)} required />
      </div>
      <div className="form-control">
        <label className="label"><span className="label-text">Tagline</span></label>
        <input className="input input-bordered" value={tagline} onChange={(e) => setTagline(e.target.value)} required />
      </div>
      <div className="form-control">
        <label className="label"><span className="label-text">Platform</span></label>
        <select className="select select-bordered" value={platform} onChange={(e) => setPlatform(e.target.value)}>
          <option>Twitter</option>
          <option>Newsletter</option>
          <option>Blog</option>
          <option>LinkedIn</option>
          <option>Other</option>
        </select>
      </div>
      <div className="form-control">
        <label className="label"><span className="label-text">Logo URL (optional)</span></label>
        <input className="input input-bordered" value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)} />
      </div>
      <div className="pt-2">
        <button className={`btn btn-primary ${saving ? 'btn-disabled' : ''}`} type="submit">
          {saving ? 'Saving...' : 'Save'}
        </button>
      </div>
    </form>
  );
};

const MySwaps = ({ swaps, onConfirm }) => {
  const [tab, setTab] = useState('pending');
  const pending = useMemo(() => swaps.filter((s) => s.status === 'pending'), [swaps]);
  const completed = useMemo(() => swaps.filter((s) => s.status === 'completed'), [swaps]);
  const renderCard = (s) => (
    <div key={s.id} className="card bg-base-100 shadow">
      <div className="card-body">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="card-title">{s.product?.name || 'Product'}</h3>
            <p className="opacity-80">{s.product?.platform || s.platform}</p>
          </div>
          <div>
            {s.status === 'completed' ? (
              <div className="badge badge-success">Completed</div>
            ) : (
              <div className="badge badge-warning">Pending</div>
            )}
          </div>
        </div>
        <div className="text-sm opacity-60">{new Date(s.created_at).toLocaleString()}</div>
        {s.status === 'pending' && (
          <div className="card-actions justify-end mt-4">
            <button className="btn btn-outline btn-sm" onClick={() => onConfirm(s)}>
              Confirm promotion done
            </button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="tabs tabs-boxed">
        <a className={`tab ${tab === 'pending' ? 'tab-active' : ''}`} onClick={() => setTab('pending')}>Pending</a>
        <a className={`tab ${tab === 'completed' ? 'tab-active' : ''}`} onClick={() => setTab('completed')}>Completed</a>
      </div>
      <div className="grid grid-cols-1 gap-4">
        {(tab === 'pending' ? pending : completed).map(renderCard)}
        {(tab === 'pending' ? pending : completed).length === 0 && (
          <div className="opacity-60">No swaps here yet.</div>
        )}
      </div>
    </div>
  );
};

const DashboardClient = () => {
  const [active, setActive] = useState('dashboard');
  const [stats, setStats] = useState({ completed: 0, pending: 0, credits: 0 });
  const [feed, setFeed] = useState([]);
  const [requestedSet, setRequestedSet] = useState(new Set());
  const [swaps, setSwaps] = useState([]);
  const [myProducts, setMyProducts] = useState([]);
  const [editingProduct, setEditingProduct] = useState(null);

  const refreshAll = async () => {
    await Promise.all([
      refreshStats(),
      refreshFeed(),
      refreshSwaps(),
      refreshMyProducts(),
    ]);
  };

  const refreshStats = async () => {
    try {
      const { data } = await axios.get('/api/adswap/stats');
      setStats(data || { completed: 0, pending: 0, credits: 0 });
    } catch (e) {
      setStats({ completed: 0, pending: 0, credits: 0 });
    }
  };

  const refreshFeed = async () => {
    try {
      const { data } = await axios.get('/api/adswap/products/feed');
      setFeed(Array.isArray(data?.data) ? data.data : []);
    } catch (e) {
      setFeed([]);
    }
  };

  const refreshSwaps = async () => {
    try {
      const { data } = await axios.get('/api/adswap/swaps');
      setSwaps(Array.isArray(data?.data) ? data.data : []);
    } catch (e) {
      setSwaps([]);
    }
  };

  const refreshMyProducts = async () => {
    try {
      const { data } = await axios.get('/api/adswap/products/mine');
      setMyProducts(Array.isArray(data?.data) ? data.data : []);
    } catch (e) {
      setMyProducts([]);
    }
  };

  useEffect(() => {
    refreshAll();
  }, []);

  const requestSwap = async (product) => {
    try {
      await axios.post('/api/adswap/swaps', { productId: product.id });
      const next = new Set(Array.from(requestedSet));
      next.add(product.id);
      setRequestedSet(next);
      toast.success('Swap requested');
      await Promise.all([refreshSwaps(), refreshStats()]);
    } catch (e) {
      toast.error('Request failed');
    }
  };

  const confirmSwap = async (swap) => {
    try {
      await axios.post('/api/adswap/swaps/confirm', { swapId: swap.id });
      toast.success('Swap confirmed');
      await Promise.all([refreshSwaps(), refreshStats()]);
    } catch (e) {
      toast.error('Confirm failed');
    }
  };

  const onSavedProduct = async () => {
    setEditingProduct(null);
    await Promise.all([refreshMyProducts(), refreshFeed()]);
  };

  return (
    <div className="space-y-8">
      <Nav active={active} onChange={setActive} />

      {active === 'dashboard' && (
        <>
          <QuickStats stats={stats} />

          <div className="divider" />

          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Swap Opportunities</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {feed.map((p) => (
                <ProductCard
                  key={p.id}
                  product={p}
                  onRequest={requestSwap}
                  requested={requestedSet.has(p.id)}
                />
              ))}
              {feed.length === 0 && (
                <div className="opacity-60">No products available yet.</div>
              )}
            </div>
          </div>

          <div className="divider" />

          <div className="space-y-4">
            <h2 className="text-xl font-semibold">My Swaps</h2>
            <MySwaps swaps={swaps} onConfirm={confirmSwap} />
          </div>

          <div className="divider" />

          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Add / Edit My Product</h2>
            <ProductForm onSaved={onSavedProduct} product={editingProduct} />
            {myProducts.length > 0 && (
              <div className="space-y-2">
                <div className="text-sm opacity-60">Your products:</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {myProducts.map((p) => (
                    <div key={p.id} className="card bg-base-100 shadow">
                      <div className="card-body">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium">{p.name}</div>
                            <div className="text-sm opacity-70">{p.platform}</div>
                          </div>
                          <div className="card-actions">
                            <button className="btn btn-ghost btn-xs" onClick={() => setEditingProduct(p)}>Edit</button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {active === 'products' && (
        <>
          <QuickStats stats={stats} />
          <div className="divider" />
          <div className="space-y-4">
            <ProductForm onSaved={onSavedProduct} product={editingProduct} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {myProducts.map((p) => (
                <div key={p.id} className="card bg-base-100 shadow">
                  <div className="card-body">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">{p.name}</div>
                        <div className="text-sm opacity-70">{p.platform}</div>
                      </div>
                      <div className="card-actions">
                        <button className="btn btn-ghost btn-xs" onClick={() => setEditingProduct(p)}>Edit</button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {myProducts.length === 0 && (
                <div className="opacity-60">No products yet.</div>
              )}
            </div>
          </div>
        </>
      )}

      {active === 'swaps' && (
        <>
          <QuickStats stats={stats} />
          <div className="divider" />
          <MySwaps swaps={swaps} onConfirm={confirmSwap} />
        </>
      )}

      {active === 'settings' && (
        <div className="opacity-70">Settings/Profile will be available soon.</div>
      )}
    </div>
  );
};

export default DashboardClient;

