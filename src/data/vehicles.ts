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
    name: 'Dr. Madhu Sachin',
    role: 'Verified Google Reviewer',
    avatar: '/testimonials/avatar1.jpg',
    content: 'U will find lot of showroom like this but nothing compared to AUTO BOURN. When u buy 2nd hand luxury car, u have lot of questions and enquiry, but people here NIRMAL and PRASANNA will guide u and help u to select suitable car. Even post sales support is excellent.',
    rating: 5,
    vehicle: 'Exceptional Service'
  },
  {
    id: '2',
    name: 'SELVA KUMAR',
    role: 'Verified Google Reviewer',
    avatar: '/testimonials/avatar2.jpg',
    content: 'Great used car dealer and great owner Prasanna. A professional team will select the best option for you according to your taste and budget. I took an AUDI A3, which is in amazing condition. Enjoying my dream car from Autobourn.',
    rating: 5,
    vehicle: 'Audi A3'
  },
  {
    id: '3',
    name: 'Raja Christopher',
    role: 'Verified Google Reviewer',
    avatar: '/testimonials/avatar3.jpg',
    content: 'Recently, we bought BMW X5 from Autobourn in a good deal. It was really an amazing experience with the whole team Prasanna, Gowtham and special mention to Raghav who kept us updated on the progress everyday until the delivery.',
    rating: 5,
    vehicle: 'BMW X5'
  },
  {
    id: '4',
    name: 'Haran Pramoth',
    role: 'Verified Google Reviewer',
    avatar: '/testimonials/avatar4.jpg',
    content: 'I took a BMW 3 series, which is in amazing condition. Enjoying my dream car from Autobourn. They do service also with their well trained technicians. I have never seen such after sale support.',
    rating: 5,
    vehicle: 'BMW 3 Series'
  },
  {
    id: '5',
    name: 'NITHISH KANNA K P',
    role: 'Verified Google Reviewer',
    avatar: '/testimonials/avatar1.jpg',
    content: 'We just bought a car before a week. They handled it very professionally and the process was so easy with them, as they explained it very clearly. We are so satisfied by their service provided and their product too.',
    rating: 5,
    vehicle: '5-Star Experience'
  },
  {
    id: '6',
    name: 'Joseph Arun',
    role: 'Verified Google Reviewer',
    avatar: '/testimonials/avatar2.jpg',
    content: 'Buying your dream car surely adds enjoyment and fulfillment to your life. I am writing this review after 10 months I bought my car from Auto Bourn. I wanted to use the car, experience it, and write a review. Best decision.',
    rating: 5,
    vehicle: 'Premium Quality'
  },
  {
    id: '7',
    name: 'Hari Arun',
    role: 'Verified Google Reviewer',
    avatar: '/testimonials/avatar3.jpg',
    content: 'AUTO BOURN Pre owned car situated at Velachery. Good car collection and reasonable price, very supportive staff. The car was in excellent condition. Thank you Mr. Prasanna for making the process smooth and easy.',
    rating: 5,
    vehicle: 'Velachery Showroom'
  },
  {
    id: '8',
    name: 'Gokul Raj',
    role: 'Verified Google Reviewer',
    avatar: '/testimonials/avatar4.jpg',
    content: 'Really satisfied with the purchase! I nearly took a month to write this review as to experience the driving and feel of the car as I was out of town during the purchase of the car, but it didn\'t disappoint.',
    rating: 5,
    vehicle: 'Highly Satisfied'
  },
  {
    id: '9',
    name: 'Rajah',
    role: 'Verified Google Reviewer',
    avatar: '/testimonials/avatar1.jpg',
    content: 'I had a fantastic experience at the car showroom! They have an impressive range of luxury options to choose from, making it easy to find the perfect fit. The process was smooth and efficient, and the delivery was surprisingly fast.',
    rating: 5,
    vehicle: 'Fast Delivery'
  },
  {
    id: '10',
    name: 'DR VISHNU',
    role: 'Verified Google Reviewer',
    avatar: '/testimonials/avatar2.jpg',
    content: 'Very happy with Auto Bourn Cars. I think one of the best premium used car dealers in Velachery Chennai. Staffs and showroom also very good. Best collection of cars. Thank you Auto Bourn Cars.',
    rating: 5,
    vehicle: 'Premium Dealer'
  },
  {
    id: '11',
    name: 'Shankar Subramanian',
    role: 'Verified Google Reviewer',
    avatar: '/testimonials/avatar3.jpg',
    content: 'I had a fantastic experience with Autobourn. They had wide ranges of Luxury vehicles. The approach is very easy and they clearly explained each and every thing.',
    rating: 5,
    vehicle: 'Wide Selection'
  },
  {
    id: '12',
    name: 'Naveen Kumar',
    role: 'Verified Google Reviewer',
    avatar: '/testimonials/avatar4.jpg',
    content: 'First to Say, Thank you so much for the perfect guidance of Mr. Prasanna who helped us get the Vento model. The car looks nice, and the way of welcoming was so warm.',
    rating: 5,
    vehicle: 'VW Vento'
  },
  {
    id: '13',
    name: 'Robin Fernando',
    role: 'Verified Google Reviewer',
    avatar: '/testimonials/avatar1.jpg',
    content: 'I have taken 2013 VW Vento 1.6 High Line - awesome car, around I have driven 150,000 km with no issue yet. Thank you Prasanna, Auto Bourn.',
    rating: 5,
    vehicle: 'VW Vento'
  },
  {
    id: '14',
    name: 'Anand Kumar',
    role: 'Verified Google Reviewer',
    avatar: '/testimonials/avatar2.jpg',
    content: 'Recently purchased a car in Auto bourn. Nirmal was coordinating well and made my purchase hassle free. Got a good deal on my purchase. Really recommend for used cars. Keep up the good service.',
    rating: 5,
    vehicle: 'Hassle-Free Deal'
  },
  {
    id: '15',
    name: 'DR Builders',
    role: 'Verified Google Reviewer',
    avatar: '/testimonials/avatar3.jpg',
    content: 'I truly appreciate the time and effort you and your team put into ensuring that the entire process went smoothly. Your attention to detail and willingness to address all my questions and concerns made me feel confident.',
    rating: 5,
    vehicle: 'Smooth Delivery'
  },
  {
    id: '16',
    name: 'Ravan Tr',
    role: 'Verified Google Reviewer',
    avatar: '/testimonials/avatar4.jpg',
    content: 'Good hospitality!! Well maintained cars!! Cars are at reasonable price!! Highly reasonable price was offered by Auto Bourn!! Kindly and genuine vehicle evaluation and customer service. We were fully satisfied.',
    rating: 5,
    vehicle: 'Reasonable Pricing'
  },
  {
    id: '17',
    name: 'Dileepan Nithyanandan',
    role: 'Verified Google Reviewer',
    avatar: '/testimonials/avatar1.jpg',
    content: 'I had a nice experience with Auto Bourn. Right from choosing the vehicle to delivering the vehicle they took utmost care. Their professionalism is outstanding and I recommend Auto Bourn without a thought.',
    rating: 5,
    vehicle: 'Utmost Care'
  },
  {
    id: '18',
    name: 'Alan Boris',
    role: 'Verified Google Reviewer',
    avatar: '/testimonials/avatar2.jpg',
    content: 'Excellent service was provided for buying my Honda Civic. Trustworthy and very friendly staff. Perfect destination for buying and selling cars. Loved it.',
    rating: 5,
    vehicle: 'Honda Civic'
  },
  {
    id: '19',
    name: 'Saravana Kumar Varadharaj',
    role: 'Verified Google Reviewer',
    avatar: '/testimonials/avatar3.jpg',
    content: 'We purchased a used car from AutoBourn and the entire experience was first rate - the service, the vehicles, the value and the follow through all exceeded our expectations. I would recommend them.',
    rating: 5,
    vehicle: 'First Rate Value'
  },
  {
    id: '20',
    name: 'P. Pari Pari',
    role: 'Verified Google Reviewer',
    avatar: '/testimonials/avatar4.jpg',
    content: 'Excellent service where we can purchase luxury cars at an affordable price. They give end to end support. They make us feel so excited and super happy when delivering the car.',
    rating: 5,
    vehicle: 'Affordable Luxury'
  },
  {
    id: '21',
    name: 'Asraf Abbas',
    role: 'Verified Google Reviewer',
    avatar: '/testimonials/avatar1.jpg',
    content: 'Auto Bourn is one of the best showrooms for used cars. You will get a good collection of cars at the best price and quality.',
    rating: 5,
    vehicle: 'Highly Trusted'
  },
  {
    id: '22',
    name: 'Vinay Sharma',
    role: 'Verified Google Reviewer',
    avatar: '/testimonials/avatar2.jpg',
    content: 'Got my brand new A3 from them. It\'s been more than 3 months and it\'s running good. I\'ll recommend all my friends.',
    rating: 5,
    vehicle: 'Audi A3'
  },
  {
    id: '23',
    name: 'Suhasini Saravanan',
    role: 'Verified Google Reviewer',
    avatar: '/testimonials/avatar3.jpg',
    content: 'We can rely on them completely when we want to go for pre owned cars. Had a great experience and our search hunt completed with them.',
    rating: 5,
    vehicle: 'Highly Reliable'
  },
  {
    id: '24',
    name: 'Ragul Ram S',
    role: 'Verified Google Reviewer',
    avatar: '/testimonials/avatar4.jpg',
    content: 'Very supportive team right from the selection till delivery. Very happy with the quality of the car and also the price quoted was also on the right margin.',
    rating: 5,
    vehicle: 'Quality Cars'
  },
  {
    id: '25',
    name: 'Amsa Devarani',
    role: 'Verified Google Reviewer',
    avatar: '/testimonials/avatar1.jpg',
    content: 'The employee really took a lot of initiative to reduce the work procedure. They took care of insurance and other paperwork. Excellent staff. I had a great experience in this place.',
    rating: 5,
    vehicle: 'Great Support'
  },
  {
    id: '26',
    name: 'Dharani Kumar Parthiban',
    role: 'Verified Google Reviewer',
    avatar: '/testimonials/avatar2.jpg',
    content: 'Very good customer service by Ms. Pratheeba. She was excellent in answering all our queries.',
    rating: 5,
    vehicle: 'Customer First'
  },
  {
    id: '27',
    name: 'Sivson Wilson',
    role: 'Verified Google Reviewer',
    avatar: '/testimonials/avatar3.jpg',
    content: 'Excellent response and very good customer satisfaction from owner and workers.',
    rating: 5,
    vehicle: 'Customer Delight'
  },
  {
    id: '28',
    name: 'PARTHA BANIK',
    role: 'Verified Google Reviewer',
    avatar: '/testimonials/avatar4.jpg',
    content: 'Professional team, efficient and transparent - what else do you need!!',
    rating: 5,
    vehicle: 'Transparent Deal'
  }
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
