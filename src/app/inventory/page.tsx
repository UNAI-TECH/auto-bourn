'use client';

import { useState, useMemo, Suspense, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Vehicle, brands } from '@/data/vehicles';
import VehicleCard from '@/components/VehicleCard';
import { fetchDbVehicles } from '@/lib/supabase/vehicles';

const ITEMS_PER_PAGE = 6;

interface Option {
  value: string;
  label: string;
}

interface CustomSelectProps {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  minWidth?: string;
}

function CustomSelect({ options, value, onChange, placeholder, minWidth = '160px' }: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOption = options.find(opt => opt.value === value) || { label: placeholder, value };

  return (
    <div ref={containerRef} style={{ position: 'relative', minWidth, fontFamily: 'var(--font-secondary)' }}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0.75rem 1.25rem',
          border: isOpen ? '1.5px solid #E10613' : '1px solid #ECECEC',
          borderRadius: '12px',
          background: '#FFFFFF',
          fontSize: '0.875rem',
          color: '#2A2A2A',
          cursor: 'pointer',
          outline: 'none',
          boxShadow: isOpen ? '0 4px 15px rgba(225,6,19,0.05)' : '0 2px 8px rgba(0,0,0,0.01)',
          transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
          fontWeight: value !== 'all' && value !== 'newest' ? 600 : 400
        }}
        onMouseEnter={(e) => {
          if (!isOpen) e.currentTarget.style.borderColor = '#C0C0C0';
        }}
        onMouseLeave={(e) => {
          if (!isOpen) e.currentTarget.style.borderColor = '#ECECEC';
        }}
      >
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginRight: '8px' }}>
          {selectedOption.label}
        </span>
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#8A8A8A"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
            flexShrink: 0
          }}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.2 }}
            style={{
              position: 'absolute',
              top: 'calc(100% + 6px)',
              left: 0,
              right: 0,
              background: '#FFFFFF',
              border: '1px solid #ECECEC',
              borderRadius: '12px',
              boxShadow: '0 10px 30px rgba(0,0,0,0.08)',
              zIndex: 100,
              maxHeight: '260px',
              overflowY: 'auto',
              padding: '4px'
            }}
          >
            {options.map((option) => {
              const isSelected = option.value === value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    onChange(option.value);
                    setIsOpen(false);
                  }}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    padding: '0.625rem 1rem',
                    border: 'none',
                    borderRadius: '8px',
                    background: isSelected ? 'rgba(225,6,19,0.05)' : 'transparent',
                    color: isSelected ? '#E10613' : '#4A4A4A',
                    fontSize: '0.875rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    fontWeight: isSelected ? 600 : 400,
                    outline: 'none',
                    display: 'block'
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.background = '#F5F5F5';
                      e.currentTarget.style.color = '#2A2A2A';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.color = '#4A4A4A';
                    }
                  }}
                >
                  {option.label}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

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
  const handleFilterChange = (setter: (v: string) => void) => (val: string) => {
    setter(val);
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
            <div style={{ position: 'relative', width: '100%', maxWidth: '800px', margin: '0 auto' }}>
              <input
                type="text"
                placeholder="Search by brand, model, color..."
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                style={{
                  width: '100%',
                  padding: '1rem 3.25rem 1rem 3.25rem',
                  border: '1.5px solid #EAEAEA',
                  borderRadius: '16px',
                  background: '#FFFFFF',
                  fontSize: '0.9375rem',
                  color: '#2A2A2A',
                  fontFamily: 'var(--font-secondary)',
                  outline: 'none',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.02)',
                  transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                }}
                className="modern-search-input"
              />
              <span style={{ position: 'absolute', left: '1.25rem', top: '50%', transform: 'translateY(-50%)', display: 'flex', alignItems: 'center' }}>
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke={searchQuery ? '#E10613' : '#8A8A8A'}
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{ transition: 'stroke 0.3s ease' }}
                >
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </span>
              {searchQuery && (
                <button
                  onClick={() => { setSearchQuery(''); setCurrentPage(1); }}
                  style={{
                    position: 'absolute',
                    right: '1.25rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    border: 'none',
                    background: 'rgba(0,0,0,0.04)',
                    borderRadius: '50%',
                    width: '24px',
                    height: '24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    color: '#8A8A8A',
                    transition: 'all 0.2s',
                    padding: 0
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(225,6,19,0.1)'; e.currentTarget.style.color = '#E10613'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(0,0,0,0.04)'; e.currentTarget.style.color = '#8A8A8A'; }}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              )}
            </div>
            {/* Filter row */}
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
              <CustomSelect
                options={[
                  { value: 'all', label: 'All Brands' },
                  ...brands.map(b => ({ value: b.slug, label: b.name }))
                ]}
                value={brandFilter}
                onChange={handleFilterChange(setBrandFilter)}
                placeholder="All Brands"
                minWidth="160px"
              />
              <CustomSelect
                options={[
                  { value: 'all', label: 'All Body Types' },
                  { value: 'suv', label: 'SUV' },
                  { value: 'sedan', label: 'Sedan' },
                  { value: 'coupe', label: 'Coupé' }
                ]}
                value={bodyFilter}
                onChange={handleFilterChange(setBodyFilter)}
                placeholder="All Body Types"
                minWidth="160px"
              />
              <CustomSelect
                options={[
                  { value: 'all', label: 'All Fuel Types' },
                  { value: 'diesel', label: 'Diesel' },
                  { value: 'petrol', label: 'Petrol' },
                  { value: 'hybrid', label: 'Hybrid' }
                ]}
                value={fuelFilter}
                onChange={handleFilterChange(setFuelFilter)}
                placeholder="All Fuel Types"
                minWidth="160px"
              />
              {activeFilters > 0 && (
                <button onClick={clearFilters} style={{
                  padding: '0.625rem 1.25rem', border: '1.5px solid #E10613', borderRadius: '12px',
                  background: 'rgba(225,6,19,0.04)', fontSize: '0.8125rem', color: '#E10613',
                  cursor: 'pointer', fontWeight: 600, transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                  fontFamily: 'var(--font-secondary)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = '#E10613'; e.currentTarget.style.color = '#FFFFFF'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(225,6,19,0.04)'; e.currentTarget.style.color = '#E10613'; }}
                >
                  Clear Filters ({activeFilters})
                </button>
              )}
              <div style={{ marginLeft: 'auto' }}>
                <CustomSelect
                  options={[
                    { value: 'newest', label: 'Newest First' },
                    { value: 'price-low', label: 'Price: Low → High' },
                    { value: 'price-high', label: 'Price: High → Low' },
                    { value: 'year', label: 'Year' },
                    { value: 'mileage', label: 'Mileage' }
                  ]}
                  value={sortBy}
                  onChange={handleFilterChange(setSortBy)}
                  placeholder="Newest First"
                  minWidth="180px"
                />
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
        input:focus, select:focus { border-color: #E10613 !important; }
        .modern-search-input:focus {
          border-color: #E10613 !important;
          box-shadow: 0 10px 30px rgba(225,6,19,0.06) !important;
          transform: translateY(-1px);
        }
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
