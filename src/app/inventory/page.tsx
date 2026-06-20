import { fetchDbVehicles } from '@/lib/supabase/vehicles';
import InventoryClient from './InventoryClient';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Luxury Car Collection | Used BMW, Mercedes, Audi in Chennai',
  description: 'Browse AUTOBOURN\'s certified pre-owned luxury car collection in Chennai. Used BMW, Mercedes-Benz, Audi, Jaguar, Land Rover, Porsche. Filter by brand, price, body type.',
};

// Revalidate this page every 60 seconds (Incremental Static Regeneration)
// This ensures AI bots and Google always get fast, fresh HTML.
export const revalidate = 60;

export default async function InventoryPage() {
  // 1. Fetch data on the server during the initial request
  const vehicles = await fetchDbVehicles();
  
  // 2. Pass the data to the Client Component
  // This means the initial HTML sent to Google/AI bots will already contain all the vehicles!
  return <InventoryClient initialVehicles={vehicles} />;
}
