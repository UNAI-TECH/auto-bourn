import { createClient } from './client';
import { Vehicle } from '@/data/vehicles';

export async function fetchDbVehicles(): Promise<Vehicle[]> {
  try {
    const res = await fetch('/api/cars?limit=100');
    if (!res.ok) throw new Error('Failed to fetch vehicles');
    const data = await res.json();
    const cars = data.cars || [];

    return cars.map((car: any) => {
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
      };
    });
  } catch (error) {
    console.error('Error fetching cars:', error);
    return [];
  }
}

export async function fetchDbVehicleById(id: string): Promise<Vehicle | null> {
  try {
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
    };
  } catch (error) {
    console.error('Error fetching car:', error);
    return null;
  }
}

