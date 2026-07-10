console.log('=== ENVIRONMENT VARIABLES ===');
console.log('SUPABASE_URL:', process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || 'Not Set');
console.log('SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Present (length: ' + process.env.SUPABASE_SERVICE_ROLE_KEY.length + ')' : 'Not Set');
console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'Present' : 'Not Set');
console.log('Keys starting with SUPABASE:', Object.keys(process.env).filter(k => k.startsWith('SUPABASE')));
console.log('Keys starting with NEXT_PUBLIC:', Object.keys(process.env).filter(k => k.startsWith('NEXT_PUBLIC')));
