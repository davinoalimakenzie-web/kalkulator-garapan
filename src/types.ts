export interface Service {
  id: string;
  name: string;
  price: number;
  isSetEnabled?: boolean;
  itemsPerSet?: number;
  pricePerSet?: number;
}

export interface Job {
  id: string;
  employeeId: string;
  employeeName: string;
  date: string;
  serviceId: string;
  quantity: number;
  deliveryFee: number;
  status?: "pending" | "lunas";
}

export interface UserProfile {
  id: string;
  name: string;
  role: "owner" | "admin" | "karyawan";
  pin: string;
  email?: string;
  whatsapp?: string;
  bankAccount?: string;
}

export interface PaymentRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  amount: number;
  date: string;
  status: "pending" | "lunas" | "ditolak";
  proofUrl?: string; // Standard text representation of the Transfer Proof (e.g. text/image description or link)
  createdAt: number;
  updatedAt?: number;
}

export interface SalaryTransaction {
  id: string;
  employeeId: string;
  type: "titip" | "pelunasan" | "penarikan";
  amount: number;
  date: string;
  note?: string;
  proofUrl?: string;
  createdAt: number;
}
