import { createClient } from './client';
import { Vehicle } from '@/data/vehicles';

let cachedVehicles: Vehicle[] | null = null;
let lastFetchTime = 0;
const CACHE_TTL = 60000; // Cache for 60 seconds

const cachedVehicleById: Record<string, { data: Vehicle; timestamp: number }> = {};

export async function fetchDbVehicles(forceRefresh = false): Promise<Vehicle[]> {
  try {
    const now = Date.now();
    if (!forceRefresh && cachedVehicles && (now - lastFetchTime < CACHE_TTL)) {
      return cachedVehicles;
    }

    const res = await fetch('/api/cars?limit=100&status=available_or_reserved');
    if (!res.ok) throw new Error('Failed to fetch vehicles');
    const data = await res.json();
    const cars = data.cars || [];

    const mapped = cars.map((car: any) => {
      const rawImages = car.car_images && car.car_images.length > 0
        ? car.car_images.sort((a: any, b: any) => a.display_order - b.display_order).map((img: any) => img.image_url)
        : [];

      const images = car.thumbnail
        ? [car.thumbnail, ...rawImages.filter((img: string) => img !== car.thumbnail)]
        : (rawImages.length > 0 ? rawImages : ['/vehicles/placeholder.png']);

      return {
        id: car.id,
        brand: car.brand,
        model: car.model,
        variant: car.variant || '',
        year: car.year,
        price: car.price,
        originalPrice: car.original_price || undefined,
        mileage: car.km_driven || 0,
        fuelType: car.fuel_type || '',
        transmission: car.transmission || '',
        bodyType: car.body_type || '',
        engine: car.engine || '',
        horsepower: car.horsepower || 0,
        torque: '',
        topSpeed: 0,
        acceleration: '',
        drivetrain: '',
        color: car.color || '',
        interiorColor: car.interior_color || '',
        ownership: car.ownership || '',
        registration: car.registration_number || '',
        seatingCapacity: 5,
        images,
        featured: car.featured || false,
        recentlyAdded: new Date(car.created_at).getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000,
        tags: car.featured ? ['Featured'] : [],
        features: car.features || [],
        description: car.description || '',
        employee: car.employee ? { name: car.employee.name, employee_id: car.employee.employee_id } : undefined,
        status: car.status,
      };
    });

    cachedVehicles = mapped;
    lastFetchTime = now;
    return mapped;
  } catch (error) {
    console.error('Error fetching cars:', error);
    return cachedVehicles || [];
  }
}

export async function fetchDbVehicleById(id: string, forceRefresh = false): Promise<Vehicle | null> {
  try {
    const now = Date.now();
    if (!forceRefresh && cachedVehicleById[id] && (now - cachedVehicleById[id].timestamp < CACHE_TTL)) {
      return cachedVehicleById[id].data;
    }

    const res = await fetch(`/api/cars?id=${encodeURIComponent(id)}`);
    if (!res.ok) throw new Error('Failed to fetch vehicle');
    const data = await res.json();
    const car = data.car;
    if (!car) return null;

    const rawImages = car.car_images && car.car_images.length > 0
      ? car.car_images.sort((a: any, b: any) => a.display_order - b.display_order).map((img: any) => img.image_url)
      : [];

    const images = car.thumbnail
      ? [car.thumbnail, ...rawImages.filter((img: string) => img !== car.thumbnail)]
      : (rawImages.length > 0 ? rawImages : ['/vehicles/placeholder.png']);

    const mapped: Vehicle = {
      id: car.id,
      brand: car.brand,
      model: car.model,
      variant: car.variant || '',
      year: car.year,
      price: car.price,
      originalPrice: car.original_price || undefined,
      mileage: car.km_driven || 0,
      fuelType: car.fuel_type || '',
      transmission: car.transmission || '',
      bodyType: car.body_type || '',
      engine: car.engine || '',
      horsepower: car.horsepower || 0,
      torque: '',
      topSpeed: 0,
      acceleration: '',
      drivetrain: '',
      color: car.color || '',
      interiorColor: car.interior_color || '',
      ownership: car.ownership || '',
      registration: car.registration_number || '',
      seatingCapacity: 5,
      images,
      featured: car.featured || false,
      recentlyAdded: new Date(car.created_at).getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000,
      tags: car.featured ? ['Featured'] : [],
      features: car.features || [],
      description: car.description || '',
      employee: car.employee ? { name: car.employee.name, employee_id: car.employee.employee_id } : undefined,
      status: car.status,
    };

    cachedVehicleById[id] = { data: mapped, timestamp: now };
    return mapped;
  } catch (error) {
    console.error('Error fetching car:', error);
    return cachedVehicleById[id]?.data || null;
  }
}


