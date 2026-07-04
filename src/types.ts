export interface LogProduksi {
  id: string;
  Date: string; // ISO or String Format
  PlanDailyProduction: number;
  ActualDailyProduction: number;
  ActualDailyDistance: number;
  PlanMTDProduction: number;
  ActualMTDProduction: number;
  ActualMTDDistance: number;
  ActualFuelUsage: number;
  ActualMTDFuelUsage: number;
  PlanDailyRain: number;
  ActualDailyRain: number;
  PlanDailySlippery: number;
  ActualDailySlippery: number;
  ActualDailyFuelRatio: number;
  ActualMTDFuelRatio: number;
  Jobsite: string;
  Activity: 'OB' | 'COAL' | 'MUD' | 'TS'; // Activity types
}

export interface EquipmentProductivity {
  id: string;
  DATE: string;
  JOBSITE: string;
  UNIT_NO: string;
  WORKGROUP: string;
  MODEL: string;
  EWH: number;
  STB: number;
  BD: number;
  MOHH: number;
  EWH_OB: number;
  EWH_CO: number;
  PROD_OB_TTL: number;
  PROD_COAL_TTL: number;
  PRODUCTIVITY_OB: number;
  PRODUCTIVITY_COAL: number;
  PHYSICAL_AVAILABILITY: number; // PA
  USE_OF_AVAILABILITY: number; // UA
}

export interface SalesRevenue {
  id: string;
  Date: string;
  Site: string;
  Workgroup: string;
  PriceCoal: number; // $/Ton
  PriceOverburden: number; // $/BCM
  PriceMud: number; // $/BCM
  PriceTopsoil: number; // $/BCM
  Kurs: number; // Rp per USD
  Coal: number; // Ton
  Overburden: number; // BCM
  Mud: number; // BCM
  Topsoil: number; // BCM
  RentalExcavator: number; // Hours
  RentalDozer: number; // Hours
  SedimentTrap: number; // Hours
  RevenueCoal: number; // IDR
  RevenueOB: number; // IDR
  RevenueTopsoil: number; // IDR
  RevenueMud: number; // IDR
  RevenueFuelCompensation: number; // IDR
  RevenueOverDistance: number; // IDR
  RevenueRental: number; // IDR
  RevenueSedimentTrap: number; // IDR
  PPh23: number; // IDR
  Deposit1Percent: number; // IDR
}

export interface OperatingCost {
  id: string;
  Date: string;
  Site: string;
  Workgroup: string;
  RepairMaintenanceCost: number; // IDR
  EmployeeCostDirect: number; // IDR
  DrillBlastingCost: number; // IDR
  LeasingCapexInvestation: number; // IDR
  HRDGAOperasional: number; // IDR
  Logistik: number; // IDR
  ITEngineering: number; // IDR
  Safety: number; // IDR
  BiayaHOBalikpapan: number; // IDR
  LainLainHO: number; // IDR
}

export interface UploadLog {
  id: string;
  timestamp: string;
  fileName: string;
  sheet: string;
  rowsCount: number;
  status: 'SUCCESS' | 'ERROR';
  errorMessage?: string;
}

export interface PnlSummaryItem {
  name: string;
  unit: string;
  target: number;
  actual: number;
  variance: number;
  variancePercent: number;
  isHeader?: boolean;
  indent?: number;
}

export interface PnlReport {
  totalProduction: number; // Total Production (Bcm+ [Coal/Density])
  totalGrossRevenue: number;
  totalDeduction: number;
  netRevenue: number;
  totalDirectCost: number;
  totalIndirectCost: number;
  grossProfit: number;
  totalCost: number;
  ebitda: number;
  totalAllCost: number;
  bep: number;
  bepNpv: number;
  costPerBcm: number;
  npvOperatingProfit: number;
  items: PnlSummaryItem[];
}

export interface User {
  id: string;
  username: string;
  name: string;
  role: string;
}
