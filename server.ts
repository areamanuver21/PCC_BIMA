import express from "express";
import fs from "fs";
import path from "path";
import { createServer as createViteServer } from "vite";
import {
  INITIAL_LOGPRODUKSI_CSV,
  DEFAULT_OPR_COST_ACTUAL,
  DEFAULT_OPR_COST_TARGET,
  DEFAULT_SALES_REVENUE_ACTUAL,
  DEFAULT_SALES_REVENUE_TARGET,
  DEFAULT_PTY,
} from "./src/db/initialData";
import { LogProduksi, EquipmentProductivity, SalesRevenue, OperatingCost, UploadLog, PnlReport, PnlSummaryItem } from "./src/types";

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "50mb" }));

// DB File Paths
const DB_DIR = path.join(process.cwd(), "scratch", "db");
const DB_FILE = path.join(DB_DIR, "database.json");

interface User {
  id: string;
  username: string;
  name: string;
  role: string;
  password?: string;
}

interface Database {
  LOGPRODUKSI: LogProduksi[];
  PTY: EquipmentProductivity[];
  SALES_REVENUE_ACTUAL: SalesRevenue[];
  SALES_REVENUE_TARGET: SalesRevenue[];
  OPR_COST_ACTUAL: OperatingCost[];
  OPR_COST_TARGET: OperatingCost[];
  UPLOAD_LOGS: UploadLog[];
  USERS: User[];
}

// Utility to parse Indonesian formatted numbers (e.g., "21.757,12" or " 5.423,50 " or "-")
function parseIndoNumber(str: any): number {
  if (str === undefined || str === null) return 0;
  if (typeof str === "number") return str;
  let s = String(str).trim();
  if (s === "-" || s === "" || s === " - ") return 0;
  // Remove dots (thousands separators), replace commas with dots (decimal separators)
  s = s.replace(/\./g, "").replace(/,/g, ".");
  const num = parseFloat(s);
  return isNaN(num) ? 0 : num;
}

// Initialize Database
function initDatabase() {
  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }

  let db: Database = {
    LOGPRODUKSI: [],
    PTY: [],
    SALES_REVENUE_ACTUAL: [],
    SALES_REVENUE_TARGET: [],
    OPR_COST_ACTUAL: [],
    OPR_COST_TARGET: [],
    UPLOAD_LOGS: [],
    USERS: [],
  };

  if (fs.existsSync(DB_FILE)) {
    try {
      db = JSON.parse(fs.readFileSync(DB_FILE, "utf-8"));
    } catch (e) {
      console.error("Error reading database file, resetting...", e);
    }
  }

  let updated = false;

  // Seeding Users
  if (!db.USERS || db.USERS.length === 0) {
    console.log("Seeding default users...");
    db.USERS = [
      { id: "usr-admin", username: "admin", name: "Bima Admin", role: "Administrator", password: "admin123" },
      { id: "usr-opr", username: "bima", name: "Bima Operator", role: "Operator", password: "bima123" }
    ];
    updated = true;
  }

  // Seeding LogProduksi if empty
  if (db.LOGPRODUKSI.length === 0) {
    console.log("Seeding LogProduksi from initial CSV...");
    const lines = INITIAL_LOGPRODUKSI_CSV.trim().split("\n");
    const headers = lines[0].split(";").map(h => h.trim());
    
    const records: LogProduksi[] = [];
    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue;
      const cols = lines[i].split(";");
      if (cols.length < headers.length) continue;

      records.push({
        id: `lp-seed-${i}`,
        Date: cols[0].trim(), // Row format e.g., "1-Jan-26"
        PlanDailyProduction: parseIndoNumber(cols[1]),
        ActualDailyProduction: parseIndoNumber(cols[2]),
        ActualDailyDistance: parseIndoNumber(cols[3]),
        PlanMTDProduction: parseIndoNumber(cols[4]),
        ActualMTDProduction: parseIndoNumber(cols[5]),
        ActualMTDDistance: parseIndoNumber(cols[6]),
        ActualFuelUsage: parseIndoNumber(cols[7]),
        ActualMTDFuelUsage: parseIndoNumber(cols[8]),
        PlanDailyRain: parseIndoNumber(cols[9]),
        ActualDailyRain: parseIndoNumber(cols[10]),
        PlanDailySlippery: parseIndoNumber(cols[11]),
        ActualDailySlippery: parseIndoNumber(cols[12]),
        ActualDailyFuelRatio: parseIndoNumber(cols[13]),
        ActualMTDFuelRatio: parseIndoNumber(cols[14]),
        Jobsite: cols[15]?.trim() || "BIMA - Susubang",
        Activity: (cols[16]?.trim() || "OB") as any,
      });
    }
    db.LOGPRODUKSI = records;
    updated = true;
  }

  // Seeding templates if empty
  if (db.OPR_COST_ACTUAL.length === 0) {
    db.OPR_COST_ACTUAL = DEFAULT_OPR_COST_ACTUAL;
    updated = true;
  }
  if (db.OPR_COST_TARGET.length === 0) {
    db.OPR_COST_TARGET = DEFAULT_OPR_COST_TARGET;
    updated = true;
  }
  if (db.SALES_REVENUE_ACTUAL.length === 0) {
    db.SALES_REVENUE_ACTUAL = DEFAULT_SALES_REVENUE_ACTUAL;
    updated = true;
  }
  if (db.SALES_REVENUE_TARGET.length === 0) {
    db.SALES_REVENUE_TARGET = DEFAULT_SALES_REVENUE_TARGET;
    updated = true;
  }
  if (db.PTY.length === 0) {
    db.PTY = DEFAULT_PTY;
    updated = true;
  }

  if (updated) {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), "utf-8");
    console.log("Database initialized and written to disk.");
  }
}

initDatabase();

// Load DB Helper
function loadDb(): Database {
  try {
    const data = JSON.parse(fs.readFileSync(DB_FILE, "utf-8"));
    if (!data.USERS) data.USERS = [];
    return data;
  } catch (e) {
    return {
      LOGPRODUKSI: [],
      PTY: [],
      SALES_REVENUE_ACTUAL: [],
      SALES_REVENUE_TARGET: [],
      OPR_COST_ACTUAL: [],
      OPR_COST_TARGET: [],
      UPLOAD_LOGS: [],
      USERS: [],
    };
  }
}

// Save DB Helper
function saveDb(db: Database) {
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), "utf-8");
}

// REST APIs
// 1. GET ALL
app.get("/api/data/:sheet", (req, res) => {
  const { sheet } = req.params;
  const db = loadDb();
  if (sheet in db) {
    res.json((db as any)[sheet]);
  } else {
    res.status(404).json({ error: `Sheet ${sheet} not found` });
  }
});

// 2. ADD ONE
app.post("/api/data/:sheet", (req, res) => {
  const { sheet } = req.params;
  const db = loadDb();
  if (sheet in db) {
    const newItem = { id: `${sheet.toLowerCase()}-${Date.now()}`, ...req.body };
    (db as any)[sheet].unshift(newItem);
    saveDb(db);
    res.status(201).json(newItem);
  } else {
    res.status(404).json({ error: `Sheet ${sheet} not found` });
  }
});

// 3. UPDATE ONE
app.put("/api/data/:sheet/:id", (req, res) => {
  const { sheet, id } = req.params;
  const db = loadDb();
  if (sheet in db) {
    const items = (db as any)[sheet] as any[];
    const idx = items.findIndex(item => item.id === id);
    if (idx !== -1) {
      items[idx] = { ...items[idx], ...req.body };
      saveDb(db);
      res.json(items[idx]);
    } else {
      res.status(404).json({ error: `Item with id ${id} not found` });
    }
  } else {
    res.status(404).json({ error: `Sheet ${sheet} not found` });
  }
});

// 4. DELETE ONE
app.delete("/api/data/:sheet/:id", (req, res) => {
  const { sheet, id } = req.params;
  const db = loadDb();
  if (sheet in db) {
    const items = (db as any)[sheet] as any[];
    const idx = items.findIndex(item => item.id === id);
    if (idx !== -1) {
      items.splice(idx, 1);
      saveDb(db);
      res.json({ success: true });
    } else {
      res.status(404).json({ error: `Item with id ${id} not found` });
    }
  } else {
    res.status(404).json({ error: `Sheet ${sheet} not found` });
  }
});

// 5. BATCH DELETE
app.post("/api/data/:sheet/batch-delete", (req, res) => {
  const { sheet } = req.params;
  const { ids } = req.body;
  if (!ids || !Array.isArray(ids)) {
    return res.status(400).json({ error: "Format ID tidak valid." });
  }
  const db = loadDb();
  if (sheet in db) {
    const items = (db as any)[sheet] as any[];
    const updatedItems = items.filter(item => !ids.includes(item.id));
    const deletedCount = items.length - updatedItems.length;
    (db as any)[sheet] = updatedItems;
    saveDb(db);
    res.json({ success: true, deletedCount });
  } else {
    res.status(404).json({ error: `Sheet ${sheet} tidak ditemukan` });
  }
});

// Full Database Backup & Restore for Google Drive Integration
app.get("/api/data-all/export", (req, res) => {
  try {
    const db = loadDb();
    res.json(db);
  } catch (error: any) {
    res.status(500).json({ error: "Gagal mengekspor database: " + error.message });
  }
});

app.post("/api/data-all/restore", (req, res) => {
  try {
    const { dbContent } = req.body;
    if (!dbContent) {
      return res.status(400).json({ error: "Konten database kosong." });
    }
    
    // Simple structural validation
    if (!dbContent.LOGPRODUKSI || !dbContent.USERS) {
      return res.status(400).json({ error: "Format database tidak valid (harus mengandung LOGPRODUKSI dan USERS)." });
    }

    saveDb(dbContent);
    res.json({ success: true, message: "Database berhasil direstore sepenuhnya!" });
  } catch (error: any) {
    res.status(500).json({ error: "Gagal merestore database: " + error.message });
  }
});

// Auth & Users API
app.post("/api/auth/login", (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: "Username dan password wajib diisi!" });
  }
  const db = loadDb();
  const users = db.USERS || [];
  const user = users.find(u => u.username.toLowerCase() === username.toLowerCase() && u.password === password);
  if (!user) {
    return res.status(401).json({ error: "Username atau password salah!" });
  }
  const { password: _, ...userWithoutPassword } = user;
  res.json({ success: true, user: userWithoutPassword });
});

app.get("/api/auth/users", (req, res) => {
  const db = loadDb();
  const users = db.USERS || [];
  const sanitized = users.map(({ password, ...u }) => u);
  res.json(sanitized);
});

app.post("/api/auth/users", (req, res) => {
  const { username, name, role, password } = req.body;
  if (!username || !name || !role || !password) {
    return res.status(400).json({ error: "Semua field (username, name, role, password) wajib diisi!" });
  }
  const db = loadDb();
  if (!db.USERS) db.USERS = [];
  const exists = db.USERS.some(u => u.username.toLowerCase() === username.toLowerCase());
  if (exists) {
    return res.status(400).json({ error: "Username sudah terdaftar!" });
  }
  const newUser: User = {
    id: `usr-${Date.now()}`,
    username: username.trim(),
    name: name.trim(),
    role: role.trim(),
    password: password.trim()
  };
  db.USERS.push(newUser);
  saveDb(db);
  const { password: _, ...sanitized } = newUser;
  res.status(201).json(sanitized);
});

app.delete("/api/auth/users/:id", (req, res) => {
  const { id } = req.params;
  const db = loadDb();
  if (!db.USERS) db.USERS = [];
  const idx = db.USERS.findIndex(u => u.id === id);
  if (idx === -1) {
    return res.status(404).json({ error: "User tidak ditemukan!" });
  }
  if (db.USERS[idx].username === "admin") {
    return res.status(400).json({ error: "User 'admin' tidak dapat dihapus!" });
  }
  db.USERS.splice(idx, 1);
  saveDb(db);
  res.json({ success: true, message: "User berhasil dihapus" });
});

// 5. IMPORT CSV (Upload with headers, types, rollback)
app.post("/api/import/:sheet", (req, res) => {
  const { sheet } = req.params;
  const { csvText, fileName } = req.body;

  if (!csvText) {
    return res.status(400).json({ error: "CSV text is required." });
  }

  const db = loadDb();
  if (!(sheet in db)) {
    return res.status(404).json({ error: `Sheet ${sheet} not found` });
  }

  const backup = JSON.stringify(db); // Create deep-copy backup for atomic rollbacks

  try {
    const lines = csvText.trim().split("\n");
    if (lines.length === 0 || !lines[0]) {
      throw new Error("CSV file is empty.");
    }

    // Determine separator (; or ,)
    let separator = ";";
    if (lines[0].indexOf(",") !== -1 && lines[0].indexOf(";") === -1) {
      separator = ",";
    }

    const headers = lines[0].split(separator).map((h: string) => h.trim().replace(/^"|"$/g, ""));

    // Validation matching sheet columns
    let expectedHeaders: string[] = [];
    if (sheet === "LOGPRODUKSI") {
      expectedHeaders = ["Date", "Plan Daily Production", "Actual Daily Production", "Actual Daily Distance", "Plan MTD Production", "Actual MTD Production", "Actual MTD Distance", "Actual Fuel Usage", "Actual MTD Fuel Usage", "Plan Daily Rain", "Actual Daily Rain", "Plan Daily Slippery", "Actual Daily Slippery", "Actual Daily Fuel Ratio", "Actual MTD Fuel Ratio", "Jobsite", "Activity"];
    } else if (sheet === "PTY") {
      expectedHeaders = ["DATE", "JOBSITE", "UNIT_NO", "WORKGROUP", "MODEL", "EWH", "STB", "BD", "MOHH", "EWH OB", "EWH CO", "PROD OB TTL", "PROD COAL TTL", "PRODUCTIVITY_OB", "PRODUCTIVITY_COAL", "PHYSICAL AVAILABILITY (PA)", "USE OF AVAILABILITY (UA)"];
    } else if (sheet === "SALES_REVENUE_ACTUAL" || sheet === "SALES_REVENUE_TARGET") {
      expectedHeaders = ["Date", "Site", "Workgroup", "Price Coal ($/Ton)", "Price Overburden ($/BCM)", "Price Mud ($/BCM)", "Price Topsoil ($/BCM)", "Kurs Rp per USD", "Coal", "Overburden", "Mud", "Topsoil", "Rental Excavator", "Rental Dozer", "Sediment Trap", "Revenue Coal", "Revenue OB", "Revenue Topsoil", "Revenue Mud", "Revenue Fuel Compensation", "Revenue Over Distance", "Revenue Rental", "Revenue Sediment Trap", "PPh 23", "Deposit 1% (Overburden Revenue)"];
    } else if (sheet === "OPR_COST_ACTUAL" || sheet === "OPR_COST_TARGET") {
      expectedHeaders = ["Date", "Site", "Workgroup", "Repair & Maintenance Cost", "Employee Cost Direct", "Drill & Blasting Cost", "Leasing, Capex & Investation", "HRD & GA Operasional", "Logistik", "IT & Engineering", "Safety", "Biaya HO Balikpapan", "Lain-Lain (HO)"];
    }

    // Check header overlap (flexible checks ignoring casing)
    const unmatched = expectedHeaders.filter(
      eh => !headers.some((h: string) => h.toLowerCase() === eh.toLowerCase())
    );

    if (unmatched.length > 0) {
      throw new Error(`Validasi Header Gagal! Kolom berikut tidak ditemukan: ${unmatched.join(", ")}`);
    }

    const records: any[] = [];
    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue;
      const cols = lines[i].split(separator).map((c: string) => c.trim().replace(/^"|"$/g, ""));
      
      const getVal = (expectedHeader: string) => {
        const hIdx = headers.findIndex((h: string) => h.toLowerCase() === expectedHeader.toLowerCase());
        return hIdx !== -1 ? cols[hIdx] : "";
      };

      if (sheet === "LOGPRODUKSI") {
        records.push({
          id: `lp-csv-${Date.now()}-${i}`,
          Date: getVal("Date"),
          PlanDailyProduction: parseIndoNumber(getVal("Plan Daily Production")),
          ActualDailyProduction: parseIndoNumber(getVal("Actual Daily Production")),
          ActualDailyDistance: parseIndoNumber(getVal("Actual Daily Distance")),
          PlanMTDProduction: parseIndoNumber(getVal("Plan MTD Production")),
          ActualMTDProduction: parseIndoNumber(getVal("Actual MTD Production")),
          ActualMTDDistance: parseIndoNumber(getVal("Actual MTD Distance")),
          ActualFuelUsage: parseIndoNumber(getVal("Actual Fuel Usage")),
          ActualMTDFuelUsage: parseIndoNumber(getVal("Actual MTD Fuel Usage")),
          PlanDailyRain: parseIndoNumber(getVal("Plan Daily Rain")),
          ActualDailyRain: parseIndoNumber(getVal("Actual Daily Rain")),
          PlanDailySlippery: parseIndoNumber(getVal("Plan Daily Slippery")),
          ActualDailySlippery: parseIndoNumber(getVal("Actual Daily Slippery")),
          ActualDailyFuelRatio: parseIndoNumber(getVal("Actual Daily Fuel Ratio")),
          ActualMTDFuelRatio: parseIndoNumber(getVal("Actual MTD Fuel Ratio")),
          Jobsite: getVal("Jobsite") || "BIMA - Susubang",
          Activity: getVal("Activity") || "OB"
        });
      } else if (sheet === "PTY") {
        records.push({
          id: `pty-csv-${Date.now()}-${i}`,
          DATE: getVal("DATE"),
          JOBSITE: getVal("JOBSITE"),
          UNIT_NO: getVal("UNIT_NO"),
          WORKGROUP: getVal("WORKGROUP"),
          MODEL: getVal("MODEL"),
          EWH: parseIndoNumber(getVal("EWH")),
          STB: parseIndoNumber(getVal("STB")),
          BD: parseIndoNumber(getVal("BD")),
          MOHH: parseIndoNumber(getVal("MOHH")),
          EWH_OB: parseIndoNumber(getVal("EWH OB")),
          EWH_CO: parseIndoNumber(getVal("EWH CO")),
          PROD_OB_TTL: parseIndoNumber(getVal("PROD OB TTL")),
          PROD_COAL_TTL: parseIndoNumber(getVal("PROD COAL TTL")),
          PRODUCTIVITY_OB: parseIndoNumber(getVal("PRODUCTIVITY_OB")),
          PRODUCTIVITY_COAL: parseIndoNumber(getVal("PRODUCTIVITY_COAL")),
          PHYSICAL_AVAILABILITY: parseIndoNumber(getVal("PHYSICAL AVAILABILITY (PA)")),
          USE_OF_AVAILABILITY: parseIndoNumber(getVal("USE OF AVAILABILITY (UA)"))
        });
      } else if (sheet === "SALES_REVENUE_ACTUAL" || sheet === "SALES_REVENUE_TARGET") {
        records.push({
          id: `sr-csv-${Date.now()}-${i}`,
          Date: getVal("Date"),
          Site: getVal("Site"),
          Workgroup: getVal("Workgroup"),
          PriceCoal: parseIndoNumber(getVal("Price Coal ($/Ton)")),
          PriceOverburden: parseIndoNumber(getVal("Price Overburden ($/BCM)")),
          PriceMud: parseIndoNumber(getVal("Price Mud ($/BCM)")),
          PriceTopsoil: parseIndoNumber(getVal("Price Topsoil ($/BCM)")),
          Kurs: parseIndoNumber(getVal("Kurs Rp per USD")),
          Coal: parseIndoNumber(getVal("Coal")),
          Overburden: parseIndoNumber(getVal("Overburden")),
          Mud: parseIndoNumber(getVal("Mud")),
          Topsoil: parseIndoNumber(getVal("Topsoil")),
          RentalExcavator: parseIndoNumber(getVal("Rental Excavator")),
          RentalDozer: parseIndoNumber(getVal("Rental Dozer")),
          SedimentTrap: parseIndoNumber(getVal("Sediment Trap")),
          RevenueCoal: parseIndoNumber(getVal("Revenue Coal")),
          RevenueOB: parseIndoNumber(getVal("Revenue OB")),
          RevenueTopsoil: parseIndoNumber(getVal("Revenue Topsoil")),
          RevenueMud: parseIndoNumber(getVal("Revenue Mud")),
          RevenueFuelCompensation: parseIndoNumber(getVal("Revenue Fuel Compensation")),
          RevenueOverDistance: parseIndoNumber(getVal("Revenue Over Distance")),
          RevenueRental: parseIndoNumber(getVal("Revenue Rental")),
          RevenueSedimentTrap: parseIndoNumber(getVal("Revenue Sediment Trap")),
          PPh23: parseIndoNumber(getVal("PPh 23")),
          Deposit1Percent: parseIndoNumber(getVal("Deposit 1% (Overburden Revenue)"))
        });
      } else if (sheet === "OPR_COST_ACTUAL" || sheet === "OPR_COST_TARGET") {
        records.push({
          id: `oc-csv-${Date.now()}-${i}`,
          Date: getVal("Date"),
          Site: getVal("Site"),
          Workgroup: getVal("Workgroup"),
          RepairMaintenanceCost: parseIndoNumber(getVal("Repair & Maintenance Cost")),
          EmployeeCostDirect: parseIndoNumber(getVal("Employee Cost Direct")),
          DrillBlastingCost: parseIndoNumber(getVal("Drill & Blasting Cost")),
          LeasingCapexInvestation: parseIndoNumber(getVal("Leasing, Capex & Investation")),
          HRDGAOperasional: parseIndoNumber(getVal("HRD & GA Operasional")),
          Logistik: parseIndoNumber(getVal("Logistik")),
          ITEngineering: parseIndoNumber(getVal("IT & Engineering")),
          Safety: parseIndoNumber(getVal("Safety")),
          BiayaHOBalikpapan: parseIndoNumber(getVal("Biaya HO Balikpapan")),
          LainLainHO: parseIndoNumber(getVal("Lain-Lain (HO)"))
        });
      }
    }

    // Validation passes, insert data & save DB
    (db as any)[sheet] = [...records, ...(db as any)[sheet]];
    
    // Log success
    const log: UploadLog = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      fileName,
      sheet,
      rowsCount: records.length,
      status: "SUCCESS"
    };
    db.UPLOAD_LOGS.unshift(log);
    saveDb(db);

    return res.json({ success: true, rowsCount: records.length, log });
  } catch (error: any) {
    console.error("CSV Import Error:", error);
    // Rollback DB to initial state
    const rolledBackDb = JSON.parse(backup);
    const log: UploadLog = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      fileName,
      sheet,
      rowsCount: 0,
      status: "ERROR",
      errorMessage: error.message
    };
    rolledBackDb.UPLOAD_LOGS.unshift(log);
    saveDb(rolledBackDb);

    return res.status(400).json({ error: error.message, rollback: true, log });
  }
});

// 6. GET UPLOAD LOGS
app.get("/api/logs", (req, res) => {
  const db = loadDb();
  res.json(db.UPLOAD_LOGS || []);
});

// Helper to filter items based on filters (jobsite, month, year, date range)
function filterItems(items: any[], jobsite: string, month: string, year: string, startDate?: string, endDate?: string, siteKey = "Site", dateKey = "Date") {
  return items.filter(item => {
    // 1. Filter Jobsite
    if (jobsite && jobsite !== "ALL" && String(item[siteKey]).toLowerCase() !== jobsite.toLowerCase()) {
      return false;
    }

    // Parse date
    const dStr = item[dateKey];
    if (!dStr) return true;

    // Handle formats like "1-Jan-26", "01-Jan-26", "2026-01-15", etc.
    let d = new Date(dStr);
    if (isNaN(d.getTime())) {
      // Manual parse for "1-Jan-26" format
      const parts = String(dStr).split("-");
      if (parts.length === 3) {
        const months: any = { jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5, jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11 };
        const day = parseInt(parts[0]);
        const m = months[parts[1].toLowerCase().substring(0, 3)];
        let y = parseInt(parts[2]);
        if (y < 100) y += 2000;
        d = new Date(y, m, day);
      }
    }

    if (isNaN(d.getTime())) return true;

    // 2. Filter Month
    if (month && month !== "ALL" && (d.getMonth() + 1) !== parseInt(month)) {
      return false;
    }

    // 3. Filter Year
    if (year && year !== "ALL" && d.getFullYear() !== parseInt(year)) {
      return false;
    }

    // 4. Filter Date Range
    if (startDate) {
      const sDate = new Date(startDate);
      if (!isNaN(sDate.getTime()) && d < sDate) return false;
    }
    if (endDate) {
      const eDate = new Date(endDate);
      if (!isNaN(eDate.getTime()) && d > eDate) return false;
    }

    return true;
  });
}

// 7. GET PROFIT & LOSS REPORT ENGINE
app.get("/api/pnl", (req, res) => {
  const { jobsite, month, year, startDate, endDate } = req.query as any;
  const db = loadDb();

  // Filter Target and Actual records
  const actSales = filterItems(db.SALES_REVENUE_ACTUAL, jobsite, month, year, startDate, endDate, "Site", "Date");
  const tgtSales = filterItems(db.SALES_REVENUE_TARGET, jobsite, month, year, startDate, endDate, "Site", "Date");
  const actCost = filterItems(db.OPR_COST_ACTUAL, jobsite, month, year, startDate, endDate, "Site", "Date");
  const tgtCost = filterItems(db.OPR_COST_TARGET, jobsite, month, year, startDate, endDate, "Site", "Date");

  // Sum Sales Revenue items
  const sumFields = (list: any[], field: string) => list.reduce((sum, item) => sum + (item[field] || 0), 0);

  // Quantities
  const coalAct = sumFields(actSales, "Coal");
  const coalTgt = sumFields(tgtSales, "Coal");
  const obAct = sumFields(actSales, "Overburden");
  const obTgt = sumFields(tgtSales, "Overburden");
  const mudAct = sumFields(actSales, "Mud");
  const mudTgt = sumFields(tgtSales, "Mud");
  const tsAct = sumFields(actSales, "Topsoil");
  const tsTgt = sumFields(tgtSales, "Topsoil");

  const density = 1.3;
  // Total Volume (Bcm+ [Coal/Density]) : (Overburden+Mud+Topsoil)+(Coal / 1,3)
  const volAct = (obAct + mudAct + tsAct) + (coalAct / density);
  const volTgt = (obTgt + mudTgt + tsTgt) + (coalTgt / density);

  // Revenue Columns in Sales Revenue
  const revCoalAct = sumFields(actSales, "RevenueCoal");
  const revCoalTgt = sumFields(tgtSales, "RevenueCoal");
  const revObAct = sumFields(actSales, "RevenueOB");
  const revObTgt = sumFields(tgtSales, "RevenueOB");
  const revTsAct = sumFields(actSales, "RevenueTopsoil");
  const revTsTgt = sumFields(tgtSales, "RevenueTopsoil");
  const revMudAct = sumFields(actSales, "RevenueMud");
  const revMudTgt = sumFields(tgtSales, "RevenueMud");
  
  const revFuelCompAct = sumFields(actSales, "RevenueFuelCompensation");
  const revFuelCompTgt = sumFields(tgtSales, "RevenueFuelCompensation");
  const revOverDistAct = sumFields(actSales, "RevenueOverDistance");
  const revOverDistTgt = sumFields(tgtSales, "RevenueOverDistance");
  const revRentalAct = sumFields(actSales, "RevenueRental");
  const revRentalTgt = sumFields(tgtSales, "RevenueRental");
  const revSedAct = sumFields(actSales, "RevenueSedimentTrap");
  const revSedTgt = sumFields(tgtSales, "RevenueSedimentTrap");

  // Total Gross Revenue
  const grossRevAct = revCoalAct + revObAct + revTsAct + revMudAct + revFuelCompAct + revOverDistAct + revRentalAct + revSedAct;
  const grossRevTgt = revCoalTgt + revObTgt + revTsTgt + revMudTgt + revFuelCompTgt + revOverDistTgt + revRentalTgt + revSedTgt;

  // Deductions
  const pphAct = sumFields(actSales, "PPh23");
  const pphTgt = sumFields(tgtSales, "PPh23");
  const depAct = sumFields(actSales, "Deposit1Percent");
  const depTgt = sumFields(tgtSales, "Deposit1Percent");
  
  const totalDedAct = pphAct + depAct;
  const totalDedTgt = pphTgt + depTgt;

  // Net Revenue
  const netRevAct = grossRevAct - totalDedAct;
  const netRevTgt = grossRevTgt - totalDedTgt;

  // Direct Cost (COGS)
  const rmAct = sumFields(actCost, "RepairMaintenanceCost");
  const rmTgt = sumFields(tgtCost, "RepairMaintenanceCost");
  const empDirectAct = sumFields(actCost, "EmployeeCostDirect");
  const empDirectTgt = sumFields(tgtCost, "EmployeeCostDirect");
  const dbAct = sumFields(actCost, "DrillBlastingCost");
  const dbTgt = sumFields(tgtCost, "DrillBlastingCost");
  const leaseAct = sumFields(actCost, "LeasingCapexInvestation");
  const leaseTgt = sumFields(tgtCost, "LeasingCapexInvestation");

  const totalDirectAct = rmAct + empDirectAct + dbAct + leaseAct;
  const totalDirectTgt = rmTgt + empDirectTgt + dbTgt + leaseTgt;

  // Gross Profit
  const grossProfitAct = netRevAct - totalDirectAct;
  const grossProfitTgt = netRevTgt - totalDirectTgt;

  // Indirect Cost
  const hrdAct = sumFields(actCost, "HRDGAOperasional");
  const hrdTgt = sumFields(tgtCost, "HRDGAOperasional");
  const logistAct = sumFields(actCost, "Logistik");
  const logistTgt = sumFields(tgtCost, "Logistik");
  const itAct = sumFields(actCost, "ITEngineering");
  const itTgt = sumFields(tgtCost, "ITEngineering");
  const safetyAct = sumFields(actCost, "Safety");
  const safetyTgt = sumFields(tgtCost, "Safety");

  const totalIndirectAct = hrdAct + logistAct + itAct + safetyAct;
  const totalIndirectTgt = hrdTgt + logistTgt + itTgt + safetyTgt;

  // Total Cost (F+G)
  const totalCostAct = totalDirectAct + totalIndirectAct;
  const totalCostTgt = totalDirectTgt + totalIndirectTgt;

  // EBITDA
  const ebitdaAct = grossProfitAct - totalIndirectAct;
  const ebitdaTgt = grossProfitTgt - totalIndirectTgt;

  // HO Cost
  const hoAct = sumFields(actCost, "BiayaHOBalikpapan");
  const hoTgt = sumFields(tgtCost, "BiayaHOBalikpapan");
  const hoLainAct = sumFields(actCost, "LainLainHO");
  const hoLainTgt = sumFields(tgtCost, "LainLainHO");

  const totalHoAct = hoAct + hoLainAct;
  const totalHoTgt = hoTgt + hoLainTgt;

  // Total All Cost (Direct + Indirect + HO Cost)
  const totalAllAct = totalCostAct + totalHoAct;
  const totalAllTgt = totalCostTgt + totalHoTgt;

  // Operating Profit (After HO Cost)
  const npvOperatingAct = ebitdaAct - totalHoAct;
  const npvOperatingTgt = ebitdaTgt - totalHoTgt;

  // Currency Exchange Rate (Average or representative)
  const kursAct = actSales.length > 0 ? (actSales[0].Kurs || 16796) : 16796;
  const kursTgt = tgtSales.length > 0 ? (tgtSales[0].Kurs || 16000) : 16000;

  // Prices for BEP / average prices formula:
  const getAvgPrice = (list: any[]) => {
    if (list.length === 0) return { coal: 3.3, ob: 1.794, mud: 1.96, ts: 1.345, avg: 2.14 };
    const pCoal = list[0].PriceCoal || 3.3;
    const pOB = list[0].PriceOverburden || 1.794;
    const pMud = list[0].PriceMud || 1.96;
    const pTS = list[0].PriceTopsoil || 1.345;

    // Scale prices to BCM equivalent
    const scaledCoal = pCoal * (1 / density); // Price Coal ($/Ton) x (1:1.3)
    const scaledOB = pOB * 1.0;
    const scaledMud = pMud * 1.0;
    const scaledTS = pTS * 1.0;

    // Average price calculation (user's formula sums scaled prices and divides by count)
    const activePrices = [scaledCoal, scaledOB, scaledMud, scaledTS];
    const avg = activePrices.reduce((sum, p) => sum + p, 0) / activePrices.length;

    return { coal: pCoal, ob: pOB, mud: pMud, ts: pTS, avg };
  };

  const pricesAct = getAvgPrice(actSales);
  const pricesTgt = getAvgPrice(tgtSales);

  // BEP: TOTAL COST / (Average scaled BCM Price) / KURS
  // Let's implement EXACTLY as instructed: BEP = TOTAL COST / (Average BCM Price) / KURS
  // Total Cost is in IDR. Average Price is in USD. So TOTAL COST / Average BCM Price gives USD-equivalent cost.
  // Then dividing by KURS? Wait:
  // "TOTAL COST / (sumproduct(semua price/ Total Production)) / KURS"
  // Let's divide by average price in IDR: TOTAL COST / (Average scaled BCM Price * KURS)
  const bepAct = pricesAct.avg > 0 ? totalCostAct / (pricesAct.avg * kursAct) : 0;
  const bepTgt = pricesTgt.avg > 0 ? totalCostTgt / (pricesTgt.avg * kursTgt) : 0;

  // BEP NPV: (TOTAL COST + HEAD OFFICE COST) / (Average scaled BCM Price * KURS)
  const bepNpvAct = pricesAct.avg > 0 ? (totalCostAct + totalHoAct) / (pricesAct.avg * kursAct) : 0;
  const bepNpvTgt = pricesTgt.avg > 0 ? (totalCostTgt + totalHoTgt) / (pricesTgt.avg * kursTgt) : 0;

  // COST PER BCM: TOTAL ALL COST / (Total Production (Bcm+ [Coal/Density]) + ((Revenue Fuel Compensation + Revenue Over Distance)/Price Overburden/KURS))/KURS
  // Let's write this formula clearly:
  const getCostPerBcm = (totalAllCost: number, totalProd: number, fuelComp: number, overDist: number, priceOb: number, kurs: number) => {
    if (priceOb === 0) priceOb = 1.794;
    const extraVol = (fuelComp + overDist) / (priceOb * kurs);
    const denom = totalProd + extraVol;
    if (denom === 0) return 0;
    return (totalAllCost / denom) / kurs;
  };

  const costPerBcmAct = getCostPerBcm(totalAllAct, volAct, revFuelCompAct, revOverDistAct, obAct > 0 ? (revObAct/obAct/kursAct || 1.812) : 1.812, kursAct);
  const costPerBcmTgt = getCostPerBcm(totalAllTgt, volTgt, revFuelCompTgt, revOverDistTgt, obTgt > 0 ? (revObTgt/obTgt/kursTgt || 1.794) : 1.794, kursTgt);

  // Generate complete structured Profit & Loss table items
  const items: PnlSummaryItem[] = [
    { name: "A. BASE RATE & EXCHANGE RATE", unit: "", target: 0, actual: 0, variance: 0, variancePercent: 0, isHeader: true, indent: 0 },
    { name: "Price Coal ($/Ton)", unit: "USD", target: pricesTgt.coal, actual: pricesAct.coal, variance: pricesAct.coal - pricesTgt.coal, variancePercent: pricesTgt.coal > 0 ? (pricesAct.coal - pricesTgt.coal)/pricesTgt.coal*100 : 0, indent: 1 },
    { name: "Price Overburden ($/BCM)", unit: "USD", target: pricesTgt.ob, actual: pricesAct.ob, variance: pricesAct.ob - pricesTgt.ob, variancePercent: pricesTgt.ob > 0 ? (pricesAct.ob - pricesTgt.ob)/pricesTgt.ob*100 : 0, indent: 1 },
    { name: "Price Mud ($/BCM)", unit: "USD", target: pricesTgt.mud, actual: pricesAct.mud, variance: pricesAct.mud - pricesTgt.mud, variancePercent: pricesTgt.mud > 0 ? (pricesAct.mud - pricesTgt.mud)/pricesTgt.mud*100 : 0, indent: 1 },
    { name: "Price Topsoil ($/BCM)", unit: "USD", target: pricesTgt.ts, actual: pricesAct.ts, variance: pricesAct.ts - pricesTgt.ts, variancePercent: pricesTgt.ts > 0 ? (pricesAct.ts - pricesTgt.ts)/pricesTgt.ts*100 : 0, indent: 1 },
    { name: "Kurs Rp per USD", unit: "IDR", target: kursTgt, actual: kursAct, variance: kursAct - kursTgt, variancePercent: kursTgt > 0 ? (kursAct - kursTgt)/kursTgt*100 : 0, indent: 1 },

    { name: "B. PRODUCTION", unit: "", target: 0, actual: 0, variance: 0, variancePercent: 0, isHeader: true, indent: 0 },
    { name: "Coal", unit: "TON", target: coalTgt, actual: coalAct, variance: coalAct - coalTgt, variancePercent: coalTgt > 0 ? (coalAct - coalTgt)/coalTgt*100 : 0, indent: 1 },
    { name: "Overburden", unit: "BCM", target: obTgt, actual: obAct, variance: obAct - obTgt, variancePercent: obTgt > 0 ? (obAct - obTgt)/obTgt*100 : 0, indent: 1 },
    { name: "Mud", unit: "BCM", target: mudTgt, actual: mudAct, variance: mudAct - mudTgt, variancePercent: mudTgt > 0 ? (mudAct - mudTgt)/mudTgt*100 : 0, indent: 1 },
    { name: "Topsoil", unit: "BCM", target: tsTgt, actual: tsAct, variance: tsAct - tsTgt, variancePercent: tsTgt > 0 ? (tsAct - tsTgt)/tsTgt*100 : 0, indent: 1 },
    { name: "Total Volume (Bcm+ [Coal/Density])", unit: "BCM", target: volTgt, actual: volAct, variance: volAct - volTgt, variancePercent: volTgt > 0 ? (volAct - volTgt)/volTgt*100 : 0, indent: 1 },

    { name: "C. NON PRODUCTION", unit: "", target: 0, actual: 0, variance: 0, variancePercent: 0, isHeader: true, indent: 0 },
    { name: "Rental Excavator", unit: "HRS", target: sumFields(tgtSales, "RentalExcavator"), actual: sumFields(actSales, "RentalExcavator"), variance: sumFields(actSales, "RentalExcavator") - sumFields(tgtSales, "RentalExcavator"), variancePercent: sumFields(tgtSales, "RentalExcavator") > 0 ? (sumFields(actSales, "RentalExcavator") - sumFields(tgtSales, "RentalExcavator"))/sumFields(tgtSales, "RentalExcavator")*100 : 0, indent: 1 },
    { name: "Rental Dozer", unit: "HRS", target: sumFields(tgtSales, "RentalDozer"), actual: sumFields(actSales, "RentalDozer"), variance: sumFields(actSales, "RentalDozer") - sumFields(tgtSales, "RentalDozer"), variancePercent: sumFields(tgtSales, "RentalDozer") > 0 ? (sumFields(actSales, "RentalDozer") - sumFields(tgtSales, "RentalDozer"))/sumFields(tgtSales, "RentalDozer")*100 : 0, indent: 1 },
    { name: "Sediment Trap", unit: "HRS", target: sumFields(tgtSales, "SedimentTrap"), actual: sumFields(actSales, "SedimentTrap"), variance: sumFields(actSales, "SedimentTrap") - sumFields(tgtSales, "SedimentTrap"), variancePercent: sumFields(tgtSales, "SedimentTrap") > 0 ? (sumFields(actSales, "SedimentTrap") - sumFields(tgtSales, "SedimentTrap"))/sumFields(tgtSales, "SedimentTrap")*100 : 0, indent: 1 },

    { name: "D. GROSS REVENUE", unit: "", target: 0, actual: 0, variance: 0, variancePercent: 0, isHeader: true, indent: 0 },
    { name: "Revenue Coal", unit: "IDR", target: revCoalTgt, actual: revCoalAct, variance: revCoalAct - revCoalTgt, variancePercent: revCoalTgt > 0 ? (revCoalAct - revCoalTgt)/revCoalTgt*100 : 0, indent: 1 },
    { name: "Revenue OB", unit: "IDR", target: revObTgt, actual: revObAct, variance: revObAct - revObTgt, variancePercent: revObTgt > 0 ? (revObAct - revObTgt)/revObTgt*100 : 0, indent: 1 },
    { name: "Revenue Topsoil", unit: "IDR", target: revTsTgt, actual: revTsAct, variance: revTsAct - revTsTgt, variancePercent: revTsTgt > 0 ? (revTsAct - revTsTgt)/revTsTgt*100 : 0, indent: 1 },
    { name: "Revenue Mud", unit: "IDR", target: revMudTgt, actual: revMudAct, variance: revMudAct - revMudTgt, variancePercent: revMudTgt > 0 ? (revMudAct - revMudTgt)/revMudTgt*100 : 0, indent: 1 },
    { name: "Revenue Fuel Compensation", unit: "IDR", target: revFuelCompTgt, actual: revFuelCompAct, variance: revFuelCompAct - revFuelCompTgt, variancePercent: Math.abs(revFuelCompTgt) > 0 ? (revFuelCompAct - revFuelCompTgt)/Math.abs(revFuelCompTgt)*100 : 0, indent: 1 },
    { name: "Revenue Over Distance", unit: "IDR", target: revOverDistTgt, actual: revOverDistAct, variance: revOverDistAct - revOverDistTgt, variancePercent: revOverDistTgt > 0 ? (revOverDistAct - revOverDistTgt)/revOverDistTgt*100 : 0, indent: 1 },
    { name: "Revenue Rental", unit: "IDR", target: revRentalTgt, actual: revRentalAct, variance: revRentalAct - revRentalTgt, variancePercent: revRentalTgt > 0 ? (revRentalAct - revRentalTgt)/revRentalTgt*100 : 0, indent: 1 },
    { name: "Revenue Sediment Trap", unit: "IDR", target: revSedTgt, actual: revSedAct, variance: revSedAct - revSedTgt, variancePercent: revSedTgt > 0 ? (revSedAct - revSedTgt)/revSedTgt*100 : 0, indent: 1 },
    { name: "Total Gross Revenue", unit: "IDR", target: grossRevTgt, actual: grossRevAct, variance: grossRevAct - grossRevTgt, variancePercent: grossRevTgt > 0 ? (grossRevAct - grossRevTgt)/grossRevTgt*100 : 0, indent: 1, isHeader: true },

    { name: "E. DEDUCTION", unit: "", target: 0, actual: 0, variance: 0, variancePercent: 0, isHeader: true, indent: 0 },
    { name: "PPh 23", unit: "IDR", target: pphTgt, actual: pphAct, variance: pphAct - pphTgt, variancePercent: pphTgt > 0 ? (pphAct - pphTgt)/pphTgt*100 : 0, indent: 1 },
    { name: "Deposit 1% (Overburden Revenue)", unit: "IDR", target: depTgt, actual: depAct, variance: depAct - depTgt, variancePercent: depTgt > 0 ? (depAct - depTgt)/depTgt*100 : 0, indent: 1 },
    { name: "Total Deduction", unit: "IDR", target: totalDedTgt, actual: totalDedAct, variance: totalDedAct - totalDedTgt, variancePercent: totalDedTgt > 0 ? (totalDedAct - totalDedTgt)/totalDedTgt*100 : 0, indent: 1, isHeader: true },

    { name: "NET REVENUE", unit: "IDR", target: netRevTgt, actual: netRevAct, variance: netRevAct - netRevTgt, variancePercent: netRevTgt > 0 ? (netRevAct - netRevTgt)/netRevTgt*100 : 0, isHeader: true, indent: 0 },

    { name: "F. DIRECT COST (COGS)", unit: "", target: 0, actual: 0, variance: 0, variancePercent: 0, isHeader: true, indent: 0 },
    { name: "Repair & Maintenance Cost", unit: "IDR", target: rmTgt, actual: rmAct, variance: rmAct - rmTgt, variancePercent: rmTgt > 0 ? (rmAct - rmTgt)/rmTgt*100 : 0, indent: 1 },
    { name: "Employee Cost Direct", unit: "IDR", target: empDirectTgt, actual: empDirectAct, variance: empDirectAct - empDirectTgt, variancePercent: empDirectTgt > 0 ? (empDirectAct - empDirectTgt)/empDirectTgt*100 : 0, indent: 1 },
    { name: "Drill & Blasting Cost", unit: "IDR", target: dbTgt, actual: dbAct, variance: dbAct - dbTgt, variancePercent: dbTgt > 0 ? (dbAct - dbTgt)/dbTgt*100 : 0, indent: 1 },
    { name: "Leasing, Capex & Investation", unit: "IDR", target: leaseTgt, actual: leaseAct, variance: leaseAct - leaseTgt, variancePercent: leaseTgt > 0 ? (leaseAct - leaseTgt)/leaseTgt*100 : 0, indent: 1 },
    { name: "Total Direct Cost", unit: "IDR", target: totalDirectTgt, actual: totalDirectAct, variance: totalDirectAct - totalDirectTgt, variancePercent: totalDirectTgt > 0 ? (totalDirectAct - totalDirectTgt)/totalDirectTgt*100 : 0, indent: 1, isHeader: true },

    { name: "GROSS PROFIT", unit: "IDR", target: grossProfitTgt, actual: grossProfitAct, variance: grossProfitAct - grossProfitTgt, variancePercent: grossProfitTgt > 0 ? (grossProfitAct - grossProfitTgt)/grossProfitTgt*100 : 0, isHeader: true, indent: 0 },

    { name: "G. INDIRECT COST (OPERATING EXPENSE)", unit: "", target: 0, actual: 0, variance: 0, variancePercent: 0, isHeader: true, indent: 0 },
    { name: "HRD & GA Operasional", unit: "IDR", target: hrdTgt, actual: hrdAct, variance: hrdAct - hrdTgt, variancePercent: hrdTgt > 0 ? (hrdAct - hrdTgt)/hrdTgt*100 : 0, indent: 1 },
    { name: "Logistik", unit: "IDR", target: logistTgt, actual: logistAct, variance: logistAct - logistTgt, variancePercent: logistTgt > 0 ? (logistAct - logistTgt)/logistTgt*100 : 0, indent: 1 },
    { name: "IT & Engineering", unit: "IDR", target: itTgt, actual: itAct, variance: itAct - itTgt, variancePercent: itTgt > 0 ? (itAct - itTgt)/itTgt*100 : 0, indent: 1 },
    { name: "Safety", unit: "IDR", target: safetyTgt, actual: safetyAct, variance: safetyAct - safetyTgt, variancePercent: safetyTgt > 0 ? (safetyAct - safetyTgt)/safetyTgt*100 : 0, indent: 1 },
    { name: "Total Indirect Cost", unit: "IDR", target: totalIndirectTgt, actual: totalIndirectAct, variance: totalIndirectAct - totalIndirectTgt, variancePercent: totalIndirectTgt > 0 ? (totalIndirectAct - totalIndirectTgt)/totalIndirectTgt*100 : 0, indent: 1, isHeader: true },

    { name: "TOTAL COST (F+G)", unit: "IDR", target: totalCostTgt, actual: totalCostAct, variance: totalCostAct - totalCostTgt, variancePercent: totalCostTgt > 0 ? (totalCostAct - totalCostTgt)/totalCostTgt*100 : 0, isHeader: true, indent: 0 },

    { name: "EBITDA", unit: "IDR", target: ebitdaTgt, actual: ebitdaAct, variance: ebitdaAct - ebitdaTgt, variancePercent: ebitdaTgt > 0 ? (ebitdaAct - ebitdaTgt)/ebitdaTgt*100 : 0, isHeader: true, indent: 0 },

    { name: "H. HEAD OFFICE COST", unit: "", target: 0, actual: 0, variance: 0, variancePercent: 0, isHeader: true, indent: 0 },
    { name: "Biaya HO Balikpapan", unit: "IDR", target: hoTgt, actual: hoAct, variance: hoAct - hoTgt, variancePercent: hoTgt > 0 ? (hoAct - hoTgt)/hoTgt*100 : 0, indent: 1 },
    { name: "Lain-Lain (HO)", unit: "IDR", target: hoLainTgt, actual: hoLainAct, variance: hoLainAct - hoLainTgt, variancePercent: hoLainTgt > 0 ? (hoLainAct - hoLainTgt)/hoLainTgt*100 : 0, indent: 1 },
    { name: "Total Head Office Cost", unit: "IDR", target: totalHoTgt, actual: totalHoAct, variance: totalHoAct - totalHoTgt, variancePercent: totalHoTgt > 0 ? (totalHoAct - totalHoTgt)/totalHoTgt*100 : 0, indent: 1, isHeader: true },

    { name: "TOTAL ALL COST", unit: "IDR", target: totalAllTgt, actual: totalAllAct, variance: totalAllAct - totalAllTgt, variancePercent: totalAllTgt > 0 ? (totalAllAct - totalAllTgt)/totalAllTgt*100 : 0, isHeader: true, indent: 0 },
    { name: "BEP", unit: "BCM", target: bepTgt, actual: bepAct, variance: bepAct - bepTgt, variancePercent: bepTgt > 0 ? (bepAct - bepTgt)/bepTgt*100 : 0, indent: 0 },
    { name: "BEP NPV", unit: "BCM", target: bepNpvTgt, actual: bepNpvAct, variance: bepNpvAct - bepNpvTgt, variancePercent: bepNpvTgt > 0 ? (bepNpvAct - bepNpvTgt)/bepNpvTgt*100 : 0, indent: 0 },
    { name: "COST PER BCM AFTER HO COST ($/BCM)", unit: "USD", target: costPerBcmTgt, actual: costPerBcmAct, variance: costPerBcmAct - costPerBcmTgt, variancePercent: costPerBcmTgt > 0 ? (costPerBcmAct - costPerBcmTgt)/costPerBcmTgt*100 : 0, indent: 0 },
    { name: "NPV / OPERATING PROFIT (After HO Cost)", unit: "IDR", target: npvOperatingTgt, actual: npvOperatingAct, variance: npvOperatingAct - npvOperatingTgt, variancePercent: Math.abs(npvOperatingTgt) > 0 ? (npvOperatingAct - npvOperatingTgt)/Math.abs(npvOperatingTgt)*100 : 0, isHeader: true, indent: 0 },
  ];

  const report: PnlReport = {
    totalProduction: volAct,
    totalGrossRevenue: grossRevAct,
    totalDeduction: totalDedAct,
    netRevenue: netRevAct,
    totalDirectCost: totalDirectAct,
    totalIndirectCost: totalIndirectAct,
    grossProfit: grossProfitAct,
    totalCost: totalCostAct,
    ebitda: ebitdaAct,
    totalAllCost: totalAllAct,
    bep: bepAct,
    bepNpv: bepNpvAct,
    costPerBcm: costPerBcmAct,
    npvOperatingProfit: npvOperatingAct,
    items
  };

  res.json(report);
});

// 8. GET DASHBOARD METRICS
app.get("/api/dashboard", (req, res) => {
  const { jobsite, month, year, startDate, endDate } = req.query as any;
  const db = loadDb();

  // Filter lists based on widgets
  const filteredLP = filterItems(db.LOGPRODUKSI, jobsite, month, year, startDate, endDate, "Jobsite", "Date");
  const filteredPTY = filterItems(db.PTY, jobsite, month, year, startDate, endDate, "JOBSITE", "DATE");
  const filteredActCost = filterItems(db.OPR_COST_ACTUAL, jobsite, month, year, startDate, endDate, "Site", "Date");
  const filteredTgtCost = filterItems(db.OPR_COST_TARGET, jobsite, month, year, startDate, endDate, "Site", "Date");
  const filteredActSales = filterItems(db.SALES_REVENUE_ACTUAL, jobsite, month, year, startDate, endDate, "Site", "Date");

  // Summarize production targets vs actuals from log produksi
  const obRows = filteredLP.filter(item => item.Activity === "OB");
  const coalRows = filteredLP.filter(item => item.Activity === "COAL");
  const rainRows = filteredLP; // Rain is recorded on daily logs regardless of activity (usually repeated or shared)
  
  // Dedup rain/slippery hours by Date + Jobsite to avoid double-counting if OB and Coal rows exist for same day
  const dailyUniqueLogs: any[] = [];
  const uniqueKeys = new Set();
  filteredLP.forEach(row => {
    const key = `${row.Date}_${row.Jobsite}`;
    if (!uniqueKeys.has(key)) {
      uniqueKeys.add(key);
      dailyUniqueLogs.push(row);
    }
  });

  const sumLP = (list: any[], field: string) => list.reduce((sum, item) => sum + (item[field] || 0), 0);

  const targetOB = sumLP(obRows, "PlanDailyProduction");
  const actualOB = sumLP(obRows, "ActualDailyProduction");
  const achOB = targetOB > 0 ? (actualOB / targetOB) * 100 : 100;

  const targetCoal = sumLP(coalRows, "PlanDailyProduction");
  const actualCoal = sumLP(coalRows, "ActualDailyProduction");
  const achCoal = targetCoal > 0 ? (actualCoal / targetCoal) * 100 : 100;

  const targetRain = sumLP(dailyUniqueLogs, "PlanDailyRain");
  const actualRain = sumLP(dailyUniqueLogs, "ActualDailyRain");
  const achRain = targetRain > 0 ? (actualRain / targetRain) * 100 : 100;

  const targetSlippery = sumLP(dailyUniqueLogs, "PlanDailySlippery");
  const actualSlippery = sumLP(dailyUniqueLogs, "ActualDailySlippery");
  const achSlippery = targetSlippery > 0 ? (actualSlippery / targetSlippery) * 100 : 100;

  // Fuel indicators
  const totalFuelUsage = sumLP(dailyUniqueLogs, "ActualFuelUsage");
  // Fuel ratio OB = Actual Fuel Usage for OB / Actual OB Production
  const obFuel = sumLP(obRows, "ActualFuelUsage");
  const fuelRatioOB = actualOB > 0 ? obFuel / actualOB : 0;
  
  const coalFuel = sumLP(coalRows, "ActualFuelUsage");
  const fuelRatioCoal = actualCoal > 0 ? coalFuel / actualCoal : 0;

  // Productivity metrics (from PTY sheet)
  const sumPTY = (list: any[], field: string) => list.reduce((sum, item) => sum + (item[field] || 0), 0);
  const prodOBTotal = sumPTY(filteredPTY, "PROD_OB_TTL");
  const ewhOBTotal = sumPTY(filteredPTY, "EWH_OB");
  const productivityOB = ewhOBTotal > 0 ? prodOBTotal / ewhOBTotal : 0;

  const prodCoalTotal = sumPTY(filteredPTY, "PROD_COAL_TTL");
  const ewhCoalTotal = sumPTY(filteredPTY, "EWH_CO");
  const productivityCoal = ewhCoalTotal > 0 ? prodCoalTotal / ewhCoalTotal : 0;

  // Financial cards from Cost and Sales sheets
  const sumCost = (list: any[], field: string) => list.reduce((sum, item) => sum + (item[field] || 0), 0);
  const totalAllCostAct = sumCost(filteredActCost, "RepairMaintenanceCost") +
                          sumCost(filteredActCost, "EmployeeCostDirect") +
                          sumCost(filteredActCost, "DrillBlastingCost") +
                          sumCost(filteredActCost, "LeasingCapexInvestation") +
                          sumCost(filteredActCost, "HRDGAOperasional") +
                          sumCost(filteredActCost, "Logistik") +
                          sumCost(filteredActCost, "ITEngineering") +
                          sumCost(filteredActCost, "Safety") +
                          sumCost(filteredActCost, "BiayaHOBalikpapan") +
                          sumCost(filteredActCost, "LainLainHO");

  const totalAllCostTgt = sumCost(filteredTgtCost, "RepairMaintenanceCost") +
                          sumCost(filteredTgtCost, "EmployeeCostDirect") +
                          sumCost(filteredTgtCost, "DrillBlastingCost") +
                          sumCost(filteredTgtCost, "LeasingCapexInvestation") +
                          sumCost(filteredTgtCost, "HRDGAOperasional") +
                          sumCost(filteredTgtCost, "Logistik") +
                          sumCost(filteredTgtCost, "ITEngineering") +
                          sumCost(filteredTgtCost, "Safety") +
                          sumCost(filteredTgtCost, "BiayaHOBalikpapan") +
                          sumCost(filteredTgtCost, "LainLainHO");

  const sumSales = (list: any[], field: string) => list.reduce((sum, item) => sum + (item[field] || 0), 0);
  const totalRevenue = sumSales(filteredActSales, "RevenueCoal") +
                       sumSales(filteredActSales, "RevenueOB") +
                       sumSales(filteredActSales, "RevenueTopsoil") +
                       sumSales(filteredActSales, "RevenueMud") +
                       sumSales(filteredActSales, "RevenueFuelCompensation") +
                       sumSales(filteredActSales, "RevenueOverDistance") +
                       sumSales(filteredActSales, "RevenueRental") +
                       sumSales(filteredActSales, "RevenueSedimentTrap") -
                       sumSales(filteredActSales, "PPh23") -
                       sumSales(filteredActSales, "Deposit1Percent"); // Net Revenue

  const grossProfit = totalRevenue - totalAllCostAct;
  const profitMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;
  const budgetRemaining = totalAllCostTgt - totalAllCostAct;
  const costRM = sumCost(filteredActCost, "RepairMaintenanceCost");

  // Cost per BCM and Cost per Ton (In USD)
  const kurs = filteredActSales.length > 0 ? (filteredActSales[0].Kurs || 16796) : 16796;
  const totalProdBcmEq = (obAct() + mudAct() + tsAct()) + (coalAct() / 1.3);
  function obAct() { return sumSales(filteredActSales, "Overburden"); }
  function mudAct() { return sumSales(filteredActSales, "Mud"); }
  function tsAct() { return sumSales(filteredActSales, "Topsoil"); }
  function coalAct() { return sumSales(filteredActSales, "Coal"); }

  const costPerBcmUSD = getCostPerBcm(totalAllCostAct, totalProdBcmEq, sumSales(filteredActSales, "RevenueFuelCompensation"), sumSales(filteredActSales, "RevenueOverDistance"), obAct() > 0 ? (sumSales(filteredActSales, "RevenueOB")/obAct()/kurs || 1.812) : 1.812, kurs);
  const costPerTonUSD = coalAct() > 0 ? (totalAllCostAct / coalAct()) / kurs : 0;

  function getCostPerBcm(totalAllCost: number, totalProd: number, fuelComp: number, overDist: number, priceOb: number, kurs: number) {
    if (priceOb === 0) priceOb = 1.794;
    const extraVol = (fuelComp + overDist) / (priceOb * kurs);
    const denom = totalProd + extraVol;
    if (denom === 0) return 0;
    return (totalAllCost / denom) / kurs;
  }

  // Generate trend data for Chart
  // Group LogProduksi by Date to show production trend
  const dailyProductionMap: any = {};
  filteredLP.forEach(row => {
    if (!dailyProductionMap[row.Date]) {
      dailyProductionMap[row.Date] = { Date: row.Date, OB_Actual: 0, OB_Target: 0, Coal_Actual: 0, Coal_Target: 0 };
    }
    if (row.Activity === "OB") {
      dailyProductionMap[row.Date].OB_Actual += row.ActualDailyProduction;
      dailyProductionMap[row.Date].OB_Target += row.PlanDailyProduction;
    } else if (row.Activity === "COAL") {
      dailyProductionMap[row.Date].Coal_Actual += row.ActualDailyProduction;
      dailyProductionMap[row.Date].Coal_Target += row.PlanDailyProduction;
    }
  });

  const productionTrend = Object.values(dailyProductionMap).sort((a: any, b: any) => {
    return new Date(a.Date).getTime() - new Date(b.Date).getTime();
  }).slice(-15); // limit to last 15 days

  res.json({
    kpis: {
      targetOB, actualOB, achOB,
      targetCoal, actualCoal, achCoal,
      targetRain, actualRain, achRain,
      targetSlippery, actualSlippery, achSlippery,
      fuelRatioOB, fuelRatioCoal, totalFuelUsage,
      productivityOB, productivityCoal,
      totalRevenue, totalCost: totalAllCostAct, grossProfit, profitMargin,
      budgetRemaining, costRM, costPerBcm: costPerBcmUSD, costPerTon: costPerTonUSD
    },
    trendData: dailyUniqueLogs.map(item => ({
      date: item.Date,
      rain: item.ActualDailyRain,
      slippery: item.ActualDailySlippery,
      fuelRatio: item.ActualDailyFuelRatio || (item.ActualFuelUsage / (item.ActualDailyProduction || 1))
    })).slice(-15),
    productionTrend
  });
});

// Setup Vite & App Serving
async function startServer() {
  // Vite integration in development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Static serving in production
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Mine Cost Control Server running on http://localhost:${PORT}`);
  });
}

startServer();
