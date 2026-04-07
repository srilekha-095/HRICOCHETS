export interface Product {
  id: number;
  name: string;
  description: string;
  price: string; // You're using string format like "Rs.490"
  image: string;
  category: string;
  details: string;
  dimensions: string;
  customizable: boolean;
  images?: string[]; // Additional images for gallery
}