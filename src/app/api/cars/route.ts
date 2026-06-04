import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const isPlaceholder = !process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder');
    if (isPlaceholder) {
      return NextResponse.json({ cars: [], total: 0, warning: 'Database connection not configured' });
    }

    const supabase = await createServiceRoleClient();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (id) {
      const { data: car, error } = await supabase
        .from('cars')
        .select('*, car_images(image_url, display_order), employee:employees!employee_id(name, employee_id)')
        .eq('id', id)
        .single();

      if (error || !car) {
        return NextResponse.json({ error: error?.message || 'Car not found' }, { status: 404 });
      }
      return NextResponse.json({ car });
    }

    const brand = searchParams.get('brand');
    const status = searchParams.get('status') || 'available';
    const featured = searchParams.get('featured');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const sort = searchParams.get('sort') || 'created_at';
    const order = searchParams.get('order') || 'desc';

    let query = supabase.from('cars')
      .select('*, car_images(image_url, display_order), employee:employees!employee_id(name, employee_id)', { count: 'exact' })
      .eq('status', status);

    if (brand) query = query.eq('brand', brand);
    if (featured === 'true') query = query.eq('featured', true);

    query = query.order(sort, { ascending: order === 'asc' })
      .range(offset, offset + limit - 1);

    const { data, count, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ cars: data, total: count });
  } catch (err: any) {
    console.error('API Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
