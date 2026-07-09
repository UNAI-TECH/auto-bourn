const { createClient } = require('@supabase/supabase-js');

const url = 'https://njvgqybtgakgevnxmetf.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5qdmdxeWJ0Z2FrZ2V2bnhtZXRmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDAyNzM5MSwiZXhwIjoyMDk1NjAzMzkxfQ.-8caovDXcU79s6rbiQ63XxhOb6h1Y-bTHRuyyzHFKlg';

const supabase = createClient(url, key);

async function run() {
  console.log('Checking biometric_devices table existence and registration...');
  const { data, error } = await supabase.from('biometric_devices').select('*');
  if (error) {
    console.error('Error fetching biometric_devices:', error.message);
    if (error.message.includes('relation "public.biometric_devices" does not exist')) {
      console.log('--> ERROR: The table biometric_devices does not exist. You must run the biometric-attendance-migration.sql script first!');
    }
  } else {
    console.log('SUCCESS! biometric_devices table exists. Current devices in table:');
    console.log(data);
    if (data.length === 0) {
      console.log('--> WARNING: The table is empty! You must insert your device into the biometric_devices table.');
    } else {
      const match = data.find(d => d.device_id === 'BT19TRF20101316');
      if (match) {
        console.log('--> MATCH FOUND! Device BT19TRF20101316 is registered and active:', match);
      } else {
        console.log('--> WARNING: Device BT19TRF20101316 is NOT registered. Registered device IDs are:', data.map(d => d.device_id));
      }
    }
  }
}

run();
