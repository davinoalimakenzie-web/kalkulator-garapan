export interface Service {
  id: string;
  name: string;
  price: number;
}

export interface Job {
  id: string;
  employeeId: string;
  employeeName: string;
  date: string;
  serviceId: string;
  quantity: number;
  deliveryFee: number;
}

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: "owner" | "admin" | "karyawan";
}

export interface SalaryTransaction {
  id: string;
  employeeId: string;
  type: "titip" | "pelunasan";
  amount: number;
  date: string;
  note?: string;
  createdAt: number;
}
