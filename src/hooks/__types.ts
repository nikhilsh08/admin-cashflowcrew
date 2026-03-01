export type User = {
  _id: string; // Mapped from 'id' in backend
  id?: string;
  name: string;
  email: string;
  image?: string;
  phone?: string;
  role?: string;
  createdAt?: string;
  updatedAt?: string;
  // Legacy fields that might still be needed or mapped
  firstName?: string; // Will try to Map name to firstName if needed or use name directly
  lastName?: string;
  isAdmin?: boolean;
};

export interface Masterclass {
  email: string;
  title: string;
  description: string;
  instructor: string;
  date: string;
  start_time: string;
  end_time: string;
  duration: string;
  price: number;
  location: string;
  meeting_link: string;
  currency: string;
  isRegistrationOpen: boolean;
  status: string;
  createdAt: string;
  updatedAt: string;
  _id: string;
}

export interface Transaction {
  _id: string;
  orderId: string; // The order ID from Order table
  paymentId: string;
  status: "PENDING" | "FAILED" | "SUCCESS" | "USER_DROPPED"; // From PaymentTransaction
  state?: "PENDING" | "FAILED" | "SUCCESS"; // Keeping for compatibility if needed, map status to state
  amount: number;
  currency: string;
  createdAt: string; // Transaction date
  updatedAt?: string;
  userId: User; // The user associated with the order
  paymentMethod?: string;
  // Legacy fields
  paymentTime?: string;
  paymentDetails?: Array<{
    paymentMode: string;
    transactionId: string;
    timestamp: number;
  }>;
}