import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: admin } = await supabase.from('employees').select('role').eq('auth_user_id', user.id).single();
    if (admin?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    // Total stats
    const { data: cars } = await supabase.from('cars').select('status, brand, employee_id, created_at');
    const { data: employees } = await supabase.from('employees').select('id, name').eq('role', 'employee');

    const allCars = cars || [];
    const total = allCars.length;
    const sold = allCars.filter(c => c.status === 'sold').length;
    const available = allCars.filter(c => c.status === 'available').length;

    // Best employee
    const empCounts: Record<string, number> = {};
    allCars.forEach(c => { if (c.employee_id) empCounts[c.employee_id] = (empCounts[c.employee_id] || 0) + 1; });
    const bestEmpId = Object.entries(empCounts).sort((a, b) => b[1] - a[1])[0]?.[0];
    const bestEmployee = employees?.find(e => e.id === bestEmpId)?.name || 'N/A';

    // Most uploaded brand
    const brandCounts: Record<string, number> = {};
    allCars.forEach(c => { brandCounts[c.brand] = (brandCounts[c.brand] || 0) + 1; });
    const mostUploadedBrand = Object.entries(brandCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';

    // Most sold brand
    const soldBrandCounts: Record<string, number> = {};
    allCars.filter(c => c.status === 'sold').forEach(c => { soldBrandCounts[c.brand] = (soldBrandCounts[c.brand] || 0) + 1; });
    const mostSoldBrand = Object.entries(soldBrandCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';

    // Monthly uploads
    const monthlyUploads = allCars.filter(c => new Date(c.created_at) >= new Date(monthStart)).length;

    // Daily uploads (last 30 days)
    const dailyUploads: { date: string; count: number }[] = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 86400000);
      const ds = d.toISOString().split('T')[0];
      const count = allCars.filter(c => c.created_at.startsWith(ds)).length;
      dailyUploads.push({ date: ds, count });
    }

    return NextResponse.json({
      total, sold, available,
      total_employees: employees?.length || 0,
      best_employee: bestEmployee,
      most_uploaded_brand: mostUploadedBrand,
      most_sold_brand: mostSoldBrand,
      monthly_uploads: monthlyUploads,
      daily_uploads: dailyUploads,
    });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
