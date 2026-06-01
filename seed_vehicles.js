const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const env = fs.readFileSync('.env.local', 'utf-8');
const url = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.+)/)[1].trim();
const key = env.match(/SUPABASE_SERVICE_ROLE_KEY=(.+)/)[1].trim();

const supabase = createClient(url, key);

const vehicles = [
  {
    brand: 'Mercedes-Benz',
    model: 'GLE 300d',
    variant: '4MATIC AMG Line',
    year: 2024,
    price: 5800000,
    originalPrice: 8900000,
    mileage: 12000,
    fuelType: 'Diesel',
    transmission: 'Automatic',
    bodyType: 'SUV',
    engine: '2.0L Inline-4 Turbo',
    horsepower: 245,
    color: 'Obsidian Black',
    interiorColor: 'Macchiato Beige',
    ownership: '1st Owner',
    registration: 'KA-01',
    images: ['/vehicles/gle-1.png', '/vehicles/gle-1.png', '/vehicles/gle-1.png'],
    featured: true,
    recentlyAdded: true,
    features: [
      'MBUX Infotainment', 'Panoramic Sunroof', 'Burmester Sound System',
      '360° Camera', 'Air Suspension', 'Wireless Charging', 'Head-Up Display',
      'Ambient Lighting', 'Memory Seats', 'Heated Seats'
    ],
    description: 'Immaculately maintained Mercedes-Benz GLE 300d with the prestigious AMG Line package. This luxury SUV combines commanding presence with refined elegance.'
  },
  {
    brand: 'BMW',
    model: 'X5',
    variant: 'xDrive30d M Sport',
    year: 2023,
    price: 6200000,
    originalPrice: 9500000,
    mileage: 18000,
    fuelType: 'Diesel',
    transmission: 'Automatic',
    bodyType: 'SUV',
    engine: '3.0L Inline-6 Turbo',
    horsepower: 286,
    color: 'Mineral White',
    interiorColor: 'Cognac Vernasca Leather',
    ownership: '1st Owner',
    registration: 'MH-01',
    images: ['/vehicles/x5-1.png', '/vehicles/x5-1.png', '/vehicles/x5-1.png'],
    featured: true,
    recentlyAdded: false,
    features: [
      'BMW Live Cockpit Professional', 'Panoramic Glass Roof', 'Harman Kardon',
      'Parking Assistant Plus', 'Adaptive LED Headlights', 'Gesture Control',
      'Comfort Access', 'Active Cruise Control', 'Driving Assistant Professional'
    ],
    description: 'Powerful and sophisticated BMW X5 xDrive30d with the coveted M Sport package. A perfect blend of performance, luxury, and versatility.'
  },
  {
    brand: 'Audi',
    model: 'Q7',
    variant: 'Technology 55 TFSI',
    year: 2023,
    price: 5500000,
    originalPrice: 8600000,
    mileage: 22000,
    fuelType: 'Petrol',
    transmission: 'Automatic',
    bodyType: 'SUV',
    engine: '3.0L V6 TFSI',
    horsepower: 340,
    color: 'Glacier White',
    interiorColor: 'Atlas Beige',
    ownership: '1st Owner',
    registration: 'DL-01',
    images: ['/vehicles/q7-1.png', '/vehicles/q7-1.png', '/vehicles/q7-1.png'],
    featured: true,
    recentlyAdded: true,
    features: [
      'MMI Navigation Plus', 'Virtual Cockpit', 'Bang & Olufsen 3D Sound',
      'Matrix LED Headlights', 'Adaptive Air Suspension', 'Four-Zone Climate',
      'Panoramic Sunroof', 'Head-Up Display', 'Night Vision Assistant'
    ],
    description: 'The epitome of Audi luxury — the Q7 Technology 55 TFSI with quattro all-wheel drive. Seven seats, three rows, and endless refinement.'
  },
  {
    brand: 'Jaguar',
    model: 'F-PACE',
    variant: 'R-Dynamic HSE',
    year: 2024,
    price: 4800000,
    originalPrice: 7200000,
    mileage: 8000,
    fuelType: 'Petrol',
    transmission: 'Automatic',
    bodyType: 'SUV',
    engine: '2.0L Ingenium Turbo',
    horsepower: 250,
    color: 'Eiger Grey',
    interiorColor: 'Ebony/Light Oyster',
    ownership: '1st Owner',
    registration: 'KA-05',
    images: ['/vehicles/fpace-1.png', '/vehicles/fpace-1.png', '/vehicles/fpace-1.png'],
    featured: true,
    recentlyAdded: true,
    features: [
      'Pivi Pro Infotainment', 'Meridian Surround Sound', 'Activity Key',
      '360° Parking Aid', 'Configurable Ambient Lighting', 'Wireless Charging',
      'ClearSight Interior Mirror', 'Adaptive Dynamics', 'Terrain Response 2'
    ],
    description: 'Strikingly beautiful Jaguar F-PACE R-Dynamic HSE with barely 8,000 km on the clock. British luxury meets athletic performance.'
  },
  {
    brand: 'Land Rover',
    model: 'Defender',
    variant: '110 X-Dynamic HSE',
    year: 2023,
    price: 7200000,
    originalPrice: 10500000,
    mileage: 15000,
    fuelType: 'Diesel',
    transmission: 'Automatic',
    bodyType: 'SUV',
    engine: '3.0L Inline-6 Turbo MHEV',
    horsepower: 300,
    color: 'Gondwana Stone',
    interiorColor: 'Vintage Tan/Ebony',
    ownership: '1st Owner',
    registration: 'TN-01',
    images: ['/vehicles/defender-1.png', '/vehicles/defender-1.png', '/vehicles/defender-1.png'],
    featured: true,
    recentlyAdded: false,
    features: [
      'Pivi Pro Navigation', 'Meridian Sound System', 'ClearSight Ground View',
      'Terrain Response', 'Air Suspension', 'Wade Sensing', 'Head-Up Display',
      '360° Camera', 'Configurable Terrain Response'
    ],
    description: 'The legendary Land Rover Defender reimagined for modern luxury. Capable anywhere, comfortable everywhere, unmistakable always.'
  },
  {
    brand: 'Volvo',
    model: 'XC90',
    variant: 'B6 Ultimate',
    year: 2024,
    price: 5600000,
    originalPrice: 8400000,
    mileage: 10000,
    fuelType: 'Petrol Mild-Hybrid',
    transmission: 'Automatic',
    bodyType: 'SUV',
    engine: '2.0L Turbo + Supercharged MHEV',
    horsepower: 300,
    color: 'Crystal White',
    interiorColor: 'Blonde Nappa Leather',
    ownership: '1st Owner',
    registration: 'KA-03',
    images: ['/vehicles/xc90-1.png', '/vehicles/xc90-1.png', '/vehicles/xc90-1.png'],
    featured: false,
    recentlyAdded: true,
    features: [
      'Google Built-In', 'Bowers & Wilkins Audio', 'Pilot Assist',
      'Air Quality System', '360° Camera', 'Crystal Gear Lever',
      'Orrefors Crystal', 'Head-Up Display', 'Nappa Leather'
    ],
    description: 'Scandinavian luxury at its finest. The Volvo XC90 Ultimate edition with Bowers & Wilkins audio and the world\'s safest driving experience.'
  },
  {
    brand: 'Mercedes-Benz',
    model: 'C-Class',
    variant: 'C 300d AMG Line',
    year: 2024,
    price: 3800000,
    originalPrice: 5800000,
    mileage: 9000,
    fuelType: 'Diesel',
    transmission: 'Automatic',
    bodyType: 'Sedan',
    engine: '2.0L Inline-4 Turbo',
    horsepower: 265,
    color: 'Nautic Blue',
    interiorColor: 'Black/Sienna Brown',
    ownership: '1st Owner',
    registration: 'KA-01',
    images: ['/vehicles/cclass-1.png', '/vehicles/cclass-1.png', '/vehicles/cclass-1.png'],
    featured: false,
    recentlyAdded: true,
    features: [
      'MBUX with AR Navigation', '11.9" OLED Central Display', 'Burmester Sound',
      'Digital Light', 'Rear Axle Steering', 'Energizing Comfort',
      'Ambient Lighting (64 colors)', 'Wireless Charging', 'KEYLESS-GO'
    ],
    description: 'The new generation C-Class C 300d — setting new benchmarks in the luxury sedan segment with technology borrowed from the S-Class.'
  },
  {
    brand: 'BMW',
    model: '5 Series',
    variant: '530d M Sport',
    year: 2023,
    price: 4500000,
    originalPrice: 7200000,
    mileage: 20000,
    fuelType: 'Diesel',
    transmission: 'Automatic',
    bodyType: 'Sedan',
    engine: '3.0L Inline-6 Turbo',
    horsepower: 286,
    color: 'Phytonic Blue',
    interiorColor: 'Canberra Beige',
    ownership: '1st Owner',
    registration: 'MH-02',
    images: ['/vehicles/530d-1.png', '/vehicles/530d-1.png', '/vehicles/530d-1.png'],
    featured: false,
    recentlyAdded: false,
    features: [
      'BMW Curved Display', 'Bowers & Wilkins Diamond', 'Parking Assistant Pro',
      'Driving Assistant Pro', 'Comfort Seats', 'Executive Lounge',
      'Sky Lounge Panoramic Roof', 'Soft-Close Doors', 'Remote Parking'
    ],
    description: 'The ultimate business sedan — BMW 530d M Sport with unparalleled comfort and driving dynamics. A true driver\'s executive car.'
  }
];

async function seed() {
  console.log('Seeding vehicles to database...');
  
  // 1. Get employee ID of the admin or any employee
  const { data: emps, error: empErr } = await supabase
    .from('employees')
    .select('id')
    .limit(1);
    
  if (empErr || !emps || emps.length === 0) {
    console.error('Error fetching employee:', empErr);
    return;
  }
  
  const employeeId = emps[0].id;
  console.log('Using employee ID:', employeeId);
  
  for (const v of vehicles) {
    // Check if it already exists to avoid duplicates
    const { data: existing } = await supabase
      .from('cars')
      .select('id')
      .eq('brand', v.brand)
      .eq('model', v.model)
      .eq('year', v.year)
      .limit(1);
      
    if (existing && existing.length > 0) {
      console.log(`Car already exists: ${v.brand} ${v.model}`);
      continue;
    }
    
    // Insert car
    const { data: car, error: carErr } = await supabase
      .from('cars')
      .insert({
        employee_id: employeeId,
        brand: v.brand,
        model: v.model,
        variant: v.variant,
        year: v.year,
        fuel_type: v.fuelType,
        transmission: v.transmission,
        km_driven: v.mileage,
        ownership: v.ownership,
        price: v.price,
        original_price: v.originalPrice || null,
        description: v.description,
        features: v.features,
        insurance_validity: 'Dec 2026',
        registration_number: v.registration,
        location: 'Bangalore',
        body_type: v.bodyType,
        color: v.color,
        interior_color: v.interiorColor,
        engine: v.engine,
        horsepower: v.horsepower,
        status: 'available',
        thumbnail: v.images[0],
        featured: v.featured
      })
      .select()
      .single();
      
    if (carErr) {
      console.error(`Error inserting ${v.brand} ${v.model}:`, carErr);
      continue;
    }
    
    console.log(`Inserted ${v.brand} ${v.model} with ID: ${car.id}`);
    
    // Insert other gallery images if any
    for (let i = 0; i < v.images.length; i++) {
      const { error: imgErr } = await supabase
        .from('car_images')
        .insert({
          car_id: car.id,
          image_url: v.images[i],
          display_order: i
        });
      if (imgErr) {
        console.error(`Error inserting image for ${v.brand} ${v.model}:`, imgErr);
      }
    }
  }
  
  console.log('Seeding completed!');
}

seed();
