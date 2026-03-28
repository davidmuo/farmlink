export interface User {
  id: number;
  name: string;
  email: string;
  role: 'buyer' | 'farmer' | 'admin';
  phone?: string;
  buyer?: Buyer;
  farmer?: Farmer;
  admin?: Admin;
}

export interface Buyer {
  id: number;
  userId: number;
  businessName: string;
  businessType: string;
}

export interface Farmer {
  id: number;
  userId: number;
  farmLocation: string;
  farmSize: number;
  cropsGrown: string; // JSON string
  isVerified?: boolean;
}

export interface Admin {
  id: number;
  userId: number;
  accessLevel: string;
}

export interface Crop {
  id: number;
  cropName: string;
  category: string;
  seasonality: string;
  storageRequirements: string;
  guidance?: Guidance[];
  marketPrice?: MarketPrice;
}

export interface Guidance {
  id: number;
  cropId: number;
  guidanceType: string;
  content: string;
  growthStage: string;
}

export interface Demand {
  id: number;
  buyerId: number;
  cropId: number;
  quantity: number;
  pricePerUnit: number;
  qualityStandard: string;
  deliveryStart: string;
  deliveryEnd: string;
  status: 'open' | 'partially_filled' | 'closed';
  notes?: string;
  isRecurring?: boolean;
  recurrenceNote?: string;
  createdAt: string;
  crop: Crop;
  buyer: Buyer & { user: { name: string } };
  commitments?: Commitment[];
}

export interface Commitment {
  id: number;
  farmerId: number;
  demandId: number;
  committedQuantity: number;
  commitmentType: 'full' | 'partial';
  status: 'pending' | 'accepted' | 'rejected' | 'cancelled';
  deliveryStatus: 'pending' | 'in_transit' | 'delivered' | 'completed';
  committedAt: string;
  demand?: Demand;
  farmer?: Farmer & { user: { name: string } };
  review?: Review;
  messages?: Message[];
}

export interface FarmRecord {
  id: number;
  farmerId: number;
  cropId: number;
  plantingDate: string;
  areaPlanted: number;
  notes?: string;
  createdAt: string;
  crop: Crop;
}

export interface AuditLog {
  id: number;
  userId: number;
  action: string;
  details: string;
  timestamp: string;
  user: { name: string; email: string; role: string };
}

export interface Review {
  id: number;
  reviewerId: number;
  revieweeId: number;
  commitmentId: number;
  rating: number;
  comment?: string;
  createdAt: string;
  reviewer?: { name: string };
  reviewee?: { name: string };
}

export interface Message {
  id: number;
  commitmentId: number;
  senderId: number;
  content: string;
  createdAt: string;
  sender?: { name: string };
}

export interface Notification {
  id: number;
  userId: number;
  type: string;
  title: string;
  body: string;
  link?: string;
  read: boolean;
  createdAt: string;
}

export interface MarketPrice {
  id: number;
  cropId: number;
  priceMin: number;
  priceMax: number;
  unit: string;
  updatedAt: string;
  crop?: Crop;
}
