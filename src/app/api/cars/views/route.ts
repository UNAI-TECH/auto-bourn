import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';
import fs from 'fs';
import path from 'path';

function logDebug(message: string) {
  const logPath = path.join(process.cwd(), 'views_debug.log');
  const timestamp = new Date().toISOString();
  fs.appendFileSync(logPath, `[${timestamp}] ${message}\n`);
}

export async function POST(request: NextRequest) {
  try {
    let body;
    try {
      body = await request.json();
    } catch (e: any) {
      logDebug(`Failed to parse request JSON body: ${e.message}`);
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const { id } = body;
    logDebug(`Received view increment request for car ID: ${id}`);
    
    if (!id) {
      logDebug('Car ID is missing in request body');
      return NextResponse.json({ error: 'Car ID is required' }, { status: 400 });
    }

    const supabase = await createServiceRoleClient();
    
    // Get current views
    const { data: car, error: fetchError } = await supabase
      .from('cars')
      .select('views')
      .eq('id', id)
      .single();

    if (fetchError || !car) {
      logDebug(`Failed to fetch car views for ID ${id}: ${fetchError?.message || 'Car not found'}`);
      return NextResponse.json({ error: fetchError?.message || 'Car not found' }, { status: 404 });
    }

    logDebug(`Current views count for car ID ${id} is: ${car.views}`);

    // Increment and update views
    const { error: updateError } = await supabase
      .from('cars')
      .update({ views: (car.views || 0) + 1 })
      .eq('id', id);

    if (updateError) {
      logDebug(`Failed to update car views for ID ${id}: ${updateError.message}`);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    logDebug(`Successfully incremented views count for car ID ${id} to: ${(car.views || 0) + 1}`);
    return NextResponse.json({ success: true, newViews: (car.views || 0) + 1 });
  } catch (err: any) {
    logDebug(`Unhandled error: ${err.stack || err.message}`);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
