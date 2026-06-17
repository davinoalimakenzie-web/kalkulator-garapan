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
  status?: "pending" | "lunas";
}

export interface UserProfile {
  id: string;
  name: string;
  role: "owner" | "admin" | "karyawan";
  pin: string;
  email?: string;
}

export interface SalaryTransaction {
  id: string;
  employeeId: string;
  type: "titip" | "pelunasan" | "penarikan";
  amount: number;
  date: string;
  note?: string;
  createdAt: number;
}
