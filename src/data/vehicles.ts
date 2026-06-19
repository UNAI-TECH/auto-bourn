export interface Vehicle {
  id: string;
  brand: string;
  model: string;
  variant: string;
  year: number;
  price: number;
  originalPrice?: number;
  mileage: number;
  fuelType: string;
  transmission: string;
  bodyType: string;
  engine: string;
  horsepower: number;
  torque: string;
  topSpeed: number;
  acceleration: string;
  drivetrain: string;
  color: string;
  interiorColor: string;
  ownership: string;
  registration: string;
  seatingCapacity: number;
  images: string[];
  featured: boolean;
  recentlyAdded: boolean;
  tags: string[];
  features: string[];
  description: string;
  employee?: {
    name: string;
    employee_id: string;
  };
  status?: 'available' | 'sold' | 'reserved';
}

export interface Brand {
  name: string;
  logo: string;
  count: number;
  slug: string;
}

export interface Testimonial {
  id: string;
  name: string;
  role: string;
  avatar: string;
  content: string;
  rating: number;
  vehicle: string;
}

export const brands: Brand[] = [
  { name: 'Mercedes-Benz', logo: '/Mercedes-Benz-Logo.png', count: 24, slug: 'mercedes-benz' },
  { name: 'BMW', logo: '/bmw.jpeg', count: 18, slug: 'bmw' },
  { name: 'Jaguar', logo: '/jagur.jpeg', count: 8, slug: 'jaguar' },
  { name: 'Land Rover', logo: '/landrover.png', count: 12, slug: 'land-rover' },
  { name: 'Volvo', logo: '/volvo.png', count: 10, slug: 'volvo' },
  { name: 'Lexus', logo: '/lexus.jpeg', count: 6, slug: 'lexus' },
  { name: 'Audi', logo: '/brands/6.png', count: 14, slug: 'audi' },
  { name: 'Lamborghini', logo: '/brands/4.png', count: 4, slug: 'lamborghini' },
  { name: 'Mini', logo: '/brands/10.png', count: 5, slug: 'mini' },
  { name: 'Jeep', logo: '/brands/11.png', count: 7, slug: 'jeep' },
];

export const vehicles: Vehicle[] = [
  {
    id: 'mb-gle-300d-2024',
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
    torque: '500 Nm',
    topSpeed: 230,
    acceleration: '7.2s',
    drivetrain: 'AWD',
    color: 'Obsidian Black',
    interiorColor: 'Macchiato Beige',
    ownership: '1st Owner',
    registration: 'KA-01',
    seatingCapacity: 5,
    images: ['/vehicles/gle-1.png', '/vehicles/gle-1.png', '/vehicles/gle-1.png'],
    featured: true,
    recentlyAdded: true,
    tags: ['Premium', 'AMG Line', 'Certified'],
    features: [
      'MBUX Infotainment', 'Panoramic Sunroof', 'Burmester Sound System',
      '360° Camera', 'Air Suspension', 'Wireless Charging', 'Head-Up Display',
      'Ambient Lighting', 'Memory Seats', 'Heated Seats'
    ],
    description: 'Immaculately maintained Mercedes-Benz GLE 300d with the prestigious AMG Line package. This luxury SUV combines commanding presence with refined elegance.'
  },
  {
    id: 'bmw-x5-30d-2023',
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
    torque: '650 Nm',
    topSpeed: 245,
    acceleration: '6.1s',
    drivetrain: 'AWD',
    color: 'Mineral White',
    interiorColor: 'Cognac Vernasca Leather',
    ownership: '1st Owner',
    registration: 'MH-01',
    seatingCapacity: 5,
    images: ['/vehicles/x5-1.png', '/vehicles/x5-1.png', '/vehicles/x5-1.png'],
    featured: true,
    recentlyAdded: false,
    tags: ['M Sport', 'Premium', 'Low Mileage'],
    features: [
      'BMW Live Cockpit Professional', 'Panoramic Glass Roof', 'Harman Kardon',
      'Parking Assistant Plus', 'Adaptive LED Headlights', 'Gesture Control',
      'Comfort Access', 'Active Cruise Control', 'Driving Assistant Professional'
    ],
    description: 'Powerful and sophisticated BMW X5 xDrive30d with the coveted M Sport package. A perfect blend of performance, luxury, and versatility.'
  },
  {
    id: 'audi-q7-2023',
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
    torque: '500 Nm',
    topSpeed: 250,
    acceleration: '5.9s',
    drivetrain: 'AWD',
    color: 'Glacier White',
    interiorColor: 'Atlas Beige',
    ownership: '1st Owner',
    registration: 'DL-01',
    seatingCapacity: 7,
    images: ['/vehicles/q7-1.png', '/vehicles/q7-1.png', '/vehicles/q7-1.png'],
    featured: true,
    recentlyAdded: true,
    tags: ['7-Seater', 'Technology', 'Certified'],
    features: [
      'MMI Navigation Plus', 'Virtual Cockpit', 'Bang & Olufsen 3D Sound',
      'Matrix LED Headlights', 'Adaptive Air Suspension', 'Four-Zone Climate',
      'Panoramic Sunroof', 'Head-Up Display', 'Night Vision Assistant'
    ],
    description: 'The epitome of Audi luxury — the Q7 Technology 55 TFSI with quattro all-wheel drive. Seven seats, three rows, and endless refinement.'
  },
  {
    id: 'jag-fpace-2024',
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
    torque: '365 Nm',
    topSpeed: 235,
    acceleration: '7.0s',
    drivetrain: 'AWD',
    color: 'Eiger Grey',
    interiorColor: 'Ebony/Light Oyster',
    ownership: '1st Owner',
    registration: 'KA-05',
    seatingCapacity: 5,
    images: ['/vehicles/fpace-1.png', '/vehicles/fpace-1.png', '/vehicles/fpace-1.png'],
    featured: true,
    recentlyAdded: true,
    tags: ['R-Dynamic', 'Low Mileage', 'Almost New'],
    features: [
      'Pivi Pro Infotainment', 'Meridian Surround Sound', 'Activity Key',
      '360° Parking Aid', 'Configurable Ambient Lighting', 'Wireless Charging',
      'ClearSight Interior Mirror', 'Adaptive Dynamics', 'Terrain Response 2'
    ],
    description: 'Strikingly beautiful Jaguar F-PACE R-Dynamic HSE with barely 8,000 km on the clock. British luxury meets athletic performance.'
  },
  {
    id: 'lr-defender-2023',
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
    torque: '650 Nm',
    topSpeed: 191,
    acceleration: '6.7s',
    drivetrain: 'AWD',
    color: 'Gondwana Stone',
    interiorColor: 'Vintage Tan/Ebony',
    ownership: '1st Owner',
    registration: 'TN-01',
    seatingCapacity: 5,
    images: ['/vehicles/defender-1.png', '/vehicles/defender-1.png', '/vehicles/defender-1.png'],
    featured: true,
    recentlyAdded: false,
    tags: ['Iconic', 'Adventure Ready', 'Premium'],
    features: [
      'Pivi Pro Navigation', 'Meridian Sound System', 'ClearSight Ground View',
      'Terrain Response', 'Air Suspension', 'Wade Sensing', 'Head-Up Display',
      '360° Camera', 'Configurable Terrain Response'
    ],
    description: 'The legendary Land Rover Defender reimagined for modern luxury. Capable anywhere, comfortable everywhere, unmistakable always.'
  },
  {
    id: 'volvo-xc90-2024',
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
    torque: '420 Nm',
    topSpeed: 210,
    acceleration: '6.7s',
    drivetrain: 'AWD',
    color: 'Crystal White',
    interiorColor: 'Blonde Nappa Leather',
    ownership: '1st Owner',
    registration: 'KA-03',
    seatingCapacity: 7,
    images: ['/vehicles/xc90-1.png', '/vehicles/xc90-1.png', '/vehicles/xc90-1.png'],
    featured: false,
    recentlyAdded: true,
    tags: ['Safest SUV', '7-Seater', 'Hybrid'],
    features: [
      'Google Built-In', 'Bowers & Wilkins Audio', 'Pilot Assist',
      'Air Quality System', '360° Camera', 'Crystal Gear Lever',
      'Orrefors Crystal', 'Head-Up Display', 'Nappa Leather'
    ],
    description: 'Scandinavian luxury at its finest. The Volvo XC90 Ultimate edition with Bowers & Wilkins audio and the world\'s safest driving experience.'
  },
  {
    id: 'mb-c300d-2024',
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
    torque: '550 Nm',
    topSpeed: 250,
    acceleration: '5.7s',
    drivetrain: 'RWD',
    color: 'Nautic Blue',
    interiorColor: 'Black/Sienna Brown',
    ownership: '1st Owner',
    registration: 'KA-01',
    seatingCapacity: 5,
    images: ['/vehicles/cclass-1.png', '/vehicles/cclass-1.png', '/vehicles/cclass-1.png'],
    featured: false,
    recentlyAdded: true,
    tags: ['AMG Line', 'Low KM', 'Like New'],
    features: [
      'MBUX with AR Navigation', '11.9" OLED Central Display', 'Burmester Sound',
      'Digital Light', 'Rear Axle Steering', 'Energizing Comfort',
      'Ambient Lighting (64 colors)', 'Wireless Charging', 'KEYLESS-GO'
    ],
    description: 'The new generation C-Class C 300d — setting new benchmarks in the luxury sedan segment with technology borrowed from the S-Class.'
  },
  {
    id: 'bmw-530d-2023',
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
    torque: '650 Nm',
    topSpeed: 250,
    acceleration: '5.4s',
    drivetrain: 'RWD',
    color: 'Phytonic Blue',
    interiorColor: 'Canberra Beige',
    ownership: '1st Owner',
    registration: 'MH-02',
    seatingCapacity: 5,
    images: ['/vehicles/530d-1.png', '/vehicles/530d-1.png', '/vehicles/530d-1.png'],
    featured: false,
    recentlyAdded: false,
    tags: ['M Sport', 'Business Class', 'Certified'],
    features: [
      'BMW Curved Display', 'Bowers & Wilkins Diamond', 'Parking Assistant Pro',
      'Driving Assistant Pro', 'Comfort Seats', 'Executive Lounge',
      'Sky Lounge Panoramic Roof', 'Soft-Close Doors', 'Remote Parking'
    ],
    description: 'The ultimate business sedan — BMW 530d M Sport with unparalleled comfort and driving dynamics. A true driver\'s executive car.'
  },
];

export const testimonials: Testimonial[] = [
  {
    id: '1',
    name: 'Rajesh Kumar',
    role: 'Tech Entrepreneur',
    avatar: '/testimonials/avatar1.jpg',
    content: 'Auto Bourn redefined my car buying experience. The GLE 300d I purchased was in impeccable condition, and the entire process felt like visiting a luxury boutique, not a dealership.',
    rating: 5,
    vehicle: 'Mercedes-Benz GLE 300d'
  },
  {
    id: '2',
    name: 'Priya Sharma',
    role: 'Creative Director',
    avatar: '/testimonials/avatar2.jpg',
    content: 'The attention to detail at Auto Bourn is remarkable. Every vehicle is presented museum-quality, and the team\'s knowledge of luxury cars is unmatched.',
    rating: 5,
    vehicle: 'BMW X5 xDrive30d'
  },
  {
    id: '3',
    name: 'Arjun Mehta',
    role: 'Investment Banker',
    avatar: '/testimonials/avatar3.jpg',
    content: 'Finding a certified pre-owned luxury SUV with warranty was my priority. Auto Bourn delivered beyond expectations — transparent pricing, immaculate vehicle, seamless finance.',
    rating: 5,
    vehicle: 'Audi Q7 55 TFSI'
  },
  {
    id: '4',
    name: 'Ananya Desai',
    role: 'Fashion Designer',
    avatar: '/testimonials/avatar4.jpg',
    content: 'I sold my Range Rover through Auto Bourn and the valuation was the best in the market. Professional, transparent, and incredibly efficient.',
    rating: 5,
    vehicle: 'Land Rover Defender 110'
  },
  {
    id: '5',
    name: 'Vikram Malhotra',
    role: 'Real Estate Developer',
    avatar: '/testimonials/avatar1.jpg',
    content: 'Purchasing my Audi A8 L from Auto Bourn was a breeze. Extremely professional staff, transparent history reports, and seamless delivery. Highly recommended for luxury car enthusiasts.',
    rating: 5,
    vehicle: 'Audi A8 L'
  },
  {
    id: '6',
    name: 'Dr. Sandeep Sen',
    role: 'Cardiologist',
    avatar: '/testimonials/avatar2.jpg',
    content: 'The team at Auto Bourn went above and beyond to source the exact Mercedes-Benz E-Class configuration I wanted. The car drives like it just rolled out of the showroom.',
    rating: 5,
    vehicle: 'Mercedes-Benz E-Class'
  },
  {
    id: '7',
    name: 'Kavita Rao',
    role: 'Executive VP',
    avatar: '/testimonials/avatar3.jpg',
    content: 'Auto Bourn makes luxury vehicle acquisition a seamless pleasure. Excellent finance assistance, zero-hassle documentation, and pristine-condition inventory.',
    rating: 5,
    vehicle: 'BMW 5 Series'
  },
];

export const statistics = [
  { value: 3000, suffix: '+', label: 'Luxury Vehicles Delivered' },
  { value: 98, suffix: '%', label: 'Customer Satisfaction' },
  { value: 150, suffix: 'Cr+', label: 'Finance Processed' },
  { value: 50, suffix: '+', label: 'Premium Brands' },
];

export const whyAutoBourn = [
  {
    icon: 'shield',
    title: 'Certified Vehicles',
    description: 'Every vehicle undergoes a rigorous 200+ point inspection by certified technicians before joining our collection.',
  },
  {
    icon: 'search',
    title: 'Multi-Point Inspection',
    description: 'Comprehensive mechanical, electrical, and cosmetic evaluation ensures only the finest vehicles carry our certification.',
  },
  {
    icon: 'warranty',
    title: 'Warranty Support',
    description: 'Extended warranty options up to 3 years, covering engine, transmission, and critical components for complete peace of mind.',
  },
  {
    icon: 'finance',
    title: 'Finance Assistance',
    description: 'Partnerships with premium banks and NBFCs offering competitive rates and hassle-free loan processing for luxury purchases.',
  },
  {
    icon: 'insurance',
    title: 'Insurance Support',
    description: 'Comprehensive insurance solutions with premium comparison, best rates, and seamless policy issuance at the point of purchase.',
  },
  {
    icon: 'crown',
    title: 'Luxury Experience',
    description: 'From white-glove delivery to dedicated relationship managers — every touchpoint is designed for a premium ownership journey.',
  },
];

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
