import { clsx, type ClassValue } from 'clsx';

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatPrice(price: number): string {
  if (price >= 10000000) {
    return `₹ ${(price / 10000000).toFixed(2)} Cr`;
  }
  if (price >= 100000) {
    return `₹ ${(price / 100000).toFixed(2)} L`;
  }
  return `₹ ${price.toLocaleString('en-IN')}`;
}

export function formatMileage(km: number): string {
  if (km >= 1000) {
    return `${(km / 1000).toFixed(0)}k km`;
  }
  return `${km} km`;
}

export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatDateTime(dateString: string): string {
  return new Date(dateString).toLocaleString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function timeAgo(dateString: string): string {
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  return formatDate(dateString);
}

export function generateEmployeeId(): string {
  const prefix = 'AB';
  const num = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}${num}`;
}

export function getProxiedImageUrl(url: string | null | undefined): string {
  if (!url) return '/vehicles/placeholder.png';
  if (url.startsWith('https://njvgqybtgakgevnxmetf.supabase.co/')) {
    return `/api/images?url=${encodeURIComponent(url)}`;
  }
  return url;
}

export function serializeNoteFollowUp(noteText: string, followUpDateTime: string | null): string {
  if (!followUpDateTime) return noteText;
  return `__FOLLOWUP_DATE__:${followUpDateTime}__${noteText}`;
}

export interface ParsedNote {
  hasFollowUp: boolean;
  followUpDate: Date | null;
  noteText: string;
  rawDateStr: string | null;
}

export function parseNoteFollowUp(noteText: string): ParsedNote {
  if (noteText && noteText.startsWith('__FOLLOWUP_DATE__:')) {
    const idx = noteText.indexOf('__', 18);
    if (idx !== -1) {
      const dateStr = noteText.substring(18, idx);
      const actualNote = noteText.substring(idx + 2);
      return {
        hasFollowUp: true,
        followUpDate: new Date(dateStr),
        noteText: actualNote,
        rawDateStr: dateStr
      };
    }
  }
  return {
    hasFollowUp: false,
    followUpDate: null,
    noteText: noteText || '',
    rawDateStr: null
  };
}

export function sortNotesWithFollowUps(notes: any[]): any[] {
  return [...notes].sort((a, b) => {
    const aParse = parseNoteFollowUp(a.note);
    const bParse = parseNoteFollowUp(b.note);

    const aTime = aParse.followUpDate ? aParse.followUpDate.getTime() : 0;
    const bTime = bParse.followUpDate ? bParse.followUpDate.getTime() : 0;
    const now = Date.now();

    // Determine if follow ups are active/future or past
    const aActive = aTime > now;
    const bActive = bTime > now;

    if (aActive && !bActive) return -1;
    if (!aActive && bActive) return 1;

    if (aActive && bActive) {
      // Both active follow-ups, sort ascending by follow-up time (nearest first)
      return aTime - bTime;
    }

    // Neither is active, sort by note created_at descending (newest first)
    const aCreated = new Date(a.created_at).getTime();
    const bCreated = new Date(b.created_at).getTime();
    return bCreated - aCreated;
  });
}

