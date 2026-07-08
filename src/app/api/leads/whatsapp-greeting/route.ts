import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  return NextResponse.json({ error: 'Twilio WhatsApp automation is disabled.' }, { status: 503 });
}
