'use client';

import { useState, useMemo, Suspense, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Vehicle, brands } from '@/data/vehicles';
import VehicleCard from '@/components/VehicleCard';
import { fetchDbVehicles } from '@/lib/supabase/vehicles';

const ITEMS_PER_PAGE = 6;

function InventoryContent() {
  const searchParams = useSearchParams();
  const initialBrand = searchParams.get('brand') || 'all';

  const [vehiclesList, setVehiclesList] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [brandFilter, setBrandFilter] = useState(initialBrand);
  const [bodyFilter, setBodyFilter] = useState('all');
  const [fuelFilter, setFuelFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    async function load() {
      const data = await fetchDbVehicles();
      setVehiclesList(data);
      setLoading(false);
    }
    load();
  }, []);

  const filtered = useMemo(() => {
    let result = [...vehiclesList];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(v =>
        v.brand.toLowerCase().includes(q) ||
        v.model.toLowerCase().includes(q) ||
        v.variant.toLowerCase().includes(q) ||
        v.color.toLowerCase().includes(q)
      );
    }
    if (brandFilter !== 'all') result = result.filter(v => v.brand.toLowerCase().replace(/\s+/g, '-') === brandFilter);
    if (bodyFilter !== 'all') result = result.filter(v => v.bodyType.toLowerCase() === bodyFilter);
    if (fuelFilter !== 'all') result = result.filter(v => v.fuelType.toLowerCase().includes(fuelFilter));
    switch (sortBy) {
      case 'price-low': result.sort((a, b) => a.price - b.price); break;
      case 'price-high': result.sort((a, b) => b.price - a.price); break;
      case 'year': result.sort((a, b) => b.year - a.year); break;
      case 'mileage': result.sort((a, b) => a.mileage - b.mileage); break;
      default: result.sort((a, b) => (b.recentlyAdded ? 1 : 0) - (a.recentlyAdded ? 1 : 0));
    }
    return result;
  }, [brandFilter, bodyFilter, fuelFilter, sortBy, searchQuery, vehiclesList]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginatedVehicles = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  // Reset page on filter change
  const handleFilterChange = (setter: (v: string) => void) => (e: React.ChangeEvent<HTMLSelectElement>) => {
    setter(e.target.value);
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setBrandFilter('all');
    setBodyFilter('all');
    setFuelFilter('all');
    setSearchQuery('');
    setSortBy('newest');
    setCurrentPage(1);
  };

  const selectStyle: React.CSSProperties = {
    padding: '0.75rem 1rem', border: '1px solid #ECECEC', borderRadius: '10px',
    background: '#FAFAFA', fontSize: '0.875rem', color: '#2A2A2A',
    fontFamily: 'var(--font-secondary)', outline: 'none', cursor: 'pointer', minWidth: '150px',
    transition: 'border-color 0.3s',
  };

  const activeFilters = [brandFilter, bodyFilter, fuelFilter].filter(f => f !== 'all').length + (searchQuery ? 1 : 0);

  return (
    <>
      {/* Header */}
      <section style={{ padding: 'clamp(3rem, 6vw, 5rem) 0 2rem', background: '#FFFFFF' }}>
        <div className="container">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
            <p className="text-overline" style={{ marginBottom: '0.5rem' }}>Our Collection</p>
            <h1 className="headline-section">Luxury Inventory</h1>
            <p style={{ fontSize: '1rem', color: '#8A8A8A', marginTop: '0.5rem' }}>
              {filtered.length} vehicle{filtered.length !== 1 ? 's' : ''} available
            </p>
          </motion.div>
        </div>
      </section>

      {/* Filters */}
      <section style={{ padding: '0 0 1rem', position: 'sticky', top: '70px', zIndex: 50, background: '#FFFFFF', borderBottom: '1px solid #ECECEC' }}>
        <div className="container">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }}
            style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1rem 0' }}>
            {/* Search */}
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                placeholder="Search by brand, model, color..."
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                style={{
                  width: '100%', padding: '0.875rem 1rem 0.875rem 2.75rem',
                  border: '1px solid #ECECEC', borderRadius: '12px',
                  background: '#FAFAFA', fontSize: '0.9375rem', color: '#2A2A2A',
                  fontFamily: 'var(--font-secondary)', outline: 'none',
                  transition: 'border-color 0.3s, box-shadow 0.3s',
                }}
              />
              <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', fontSize: '1rem', color: '#B0B0B0' }}>🔍</span>
            </div>
            {/* Filter row */}
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
              <select style={selectStyle} value={brandFilter} onChange={handleFilterChange(setBrandFilter)}>
                <option value="all">All Brands</option>
                {brands.map(b => <option key={b.slug} value={b.slug}>{b.name}</option>)}
              </select>
              <select style={selectStyle} value={bodyFilter} onChange={handleFilterChange(setBodyFilter)}>
                <option value="all">All Body Types</option>
                <option value="suv">SUV</option>
                <option value="sedan">Sedan</option>
                <option value="coupe">Coupé</option>
              </select>
              <select style={selectStyle} value={fuelFilter} onChange={handleFilterChange(setFuelFilter)}>
                <option value="all">All Fuel Types</option>
                <option value="diesel">Diesel</option>
                <option value="petrol">Petrol</option>
                <option value="hybrid">Hybrid</option>
              </select>
              {activeFilters > 0 && (
                <button onClick={clearFilters} style={{
                  padding: '0.625rem 1rem', border: '1px solid #E10613', borderRadius: '10px',
                  background: 'rgba(225,6,19,0.05)', fontSize: '0.8125rem', color: '#E10613',
                  cursor: 'pointer', fontWeight: 500, transition: 'all 0.3s',
                  fontFamily: 'var(--font-secondary)',
                }}>
                  Clear Filters ({activeFilters})
                </button>
              )}
              <div style={{ marginLeft: 'auto' }}>
                <select style={selectStyle} value={sortBy} onChange={handleFilterChange(setSortBy)}>
                  <option value="newest">Newest First</option>
                  <option value="price-low">Price: Low → High</option>
                  <option value="price-high">Price: High → Low</option>
                  <option value="year">Year</option>
                  <option value="mileage">Mileage</option>
                </select>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Vehicle Grid */}
      <section className="section" style={{ background: '#FFFFFF', paddingTop: '2rem' }}>
        <div className="container">
          <AnimatePresence mode="wait">
            {loading ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 'clamp(1.5rem, 2vw, 2rem)' }}>
                {Array(6).fill(0).map((_, i) => (
                  <div key={i} className="shimmer" style={{ height: '380px', borderRadius: '16px' }} />
                ))}
              </div>
            ) : paginatedVehicles.length > 0 ? (
              <motion.div
                key={`page-${currentPage}-${brandFilter}-${bodyFilter}-${fuelFilter}-${sortBy}-${searchQuery}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4 }}
              >
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 'clamp(1.5rem, 2vw, 2rem)' }}>
                  {paginatedVehicles.map((v, i) => <VehicleCard key={v.id} vehicle={v} index={i} />)}
                </div>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                style={{ textAlign: 'center', padding: '4rem 0' }}
              >
                <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: '#F5F5F5', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', fontSize: '2rem' }}>
                  🔍
                </div>
                <p style={{ fontSize: '1.5rem', fontFamily: 'var(--font-primary)', color: '#2A2A2A', marginBottom: '0.5rem' }}>No vehicles found</p>
                <p style={{ color: '#8A8A8A', marginBottom: '1.5rem' }}>Try adjusting your filters or search query</p>
                <button onClick={clearFilters} className="btn btn-secondary btn-sm">Clear All Filters</button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Pagination */}
          {totalPages > 1 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              style={{
                display: 'flex', justifyContent: 'center', alignItems: 'center',
                gap: '0.5rem', marginTop: '3rem', paddingTop: '2rem',
                borderTop: '1px solid #F0F0F0',
              }}
            >
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                style={{
                  padding: '0.625rem 1rem', borderRadius: '10px', border: '1px solid #ECECEC',
                  background: currentPage === 1 ? '#F5F5F5' : '#fff',
                  color: currentPage === 1 ? '#DADADA' : '#2A2A2A',
                  cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                  fontSize: '0.875rem', fontWeight: 500, transition: 'all 0.3s',
                  fontFamily: 'var(--font-secondary)',
                }}
              >
                ← Prev
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  style={{
                    width: '40px', height: '40px', borderRadius: '10px',
                    border: page === currentPage ? '1px solid #E10613' : '1px solid #ECECEC',
                    background: page === currentPage ? '#E10613' : '#fff',
                    color: page === currentPage ? '#fff' : '#2A2A2A',
                    cursor: 'pointer', fontSize: '0.875rem', fontWeight: 600,
                    transition: 'all 0.3s ease',
                    fontFamily: 'var(--font-secondary)',
                  }}
                >
                  {page}
                </button>
              ))}
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                style={{
                  padding: '0.625rem 1rem', borderRadius: '10px', border: '1px solid #ECECEC',
                  background: currentPage === totalPages ? '#F5F5F5' : '#fff',
                  color: currentPage === totalPages ? '#DADADA' : '#2A2A2A',
                  cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                  fontSize: '0.875rem', fontWeight: 500, transition: 'all 0.3s',
                  fontFamily: 'var(--font-secondary)',
                }}
              >
                Next →
              </button>
            </motion.div>
          )}

          {/* Results info */}
          <p style={{
            textAlign: 'center', fontSize: '0.8125rem', color: '#B0B0B0',
            marginTop: '1rem',
          }}>
            Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1}–{Math.min(currentPage * ITEMS_PER_PAGE, filtered.length)} of {filtered.length} vehicles
          </p>
        </div>
      </section>

      <style jsx global>{`
        input:focus, select:focus { border-color: #E10613 !important; box-shadow: 0 0 0 3px rgba(225,6,19,0.08) !important; }
      `}</style>
    </>
  );
}

export default function InventoryPage() {
  return (
    <Suspense fallback={
      <div className="container" style={{ textAlign: 'center', padding: '8rem 0' }}>
        <div className="shimmer" style={{ width: '200px', height: '24px', borderRadius: '8px', margin: '0 auto 1rem' }} />
        <div className="shimmer" style={{ width: '300px', height: '16px', borderRadius: '8px', margin: '0 auto' }} />
      </div>
    }>
      <InventoryContent />
    </Suspense>
  );
}
