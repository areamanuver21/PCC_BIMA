// Seeding Google Apps Script (Code.gs and Index.html) for copy-paste exports.

export const CODE_GS = `/**
 * Google Apps Script - Mine Cost Control ERP Backend
 * Author: Senior Google Apps Script Developer & Mining Cost Specialist
 * Instruction: Copy-paste this entire file into 'Code.gs' in your GAS Script Editor.
 */

function doGet(e) {
  return HtmlService.createTemplateFromFile('Index')
    .evaluate()
    .setTitle('Coal Mine Cost Control System')
    .setSandboxMode(HtmlService.SandboxMode.IFRAME)
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

/**
 * Setup sheet tabs with initial headers if they don't exist
 */
function setupSheets() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheets = {
    'LOGPRODUKSI': ['Date', 'Plan Daily Production', 'Actual Daily Production', 'Actual Daily Distance', 'Plan MTD Production', 'Actual MTD Production', 'Actual MTD Distance', 'Actual Fuel Usage', 'Actual MTD Fuel Usage', 'Plan Daily Rain', 'Actual Daily Rain', 'Plan Daily Slippery', 'Actual Daily Slippery', 'Actual Daily Fuel Ratio', 'Actual MTD Fuel Ratio', 'Jobsite', 'Activity'],
    'PTY': ['DATE', 'JOBSITE', 'UNIT_NO', 'WORKGROUP', 'MODEL', 'EWH', 'STB', 'BD', 'MOHH', 'EWH OB', 'EWH CO', 'PROD OB TTL', 'PROD COAL TTL', 'PRODUCTIVITY_OB', 'PRODUCTIVITY_COAL', 'PHYSICAL AVAILABILITY (PA)', 'USE OF AVAILABILITY (UA)'],
    'SALES_REVENUE_ACTUAL': ['Date', 'Site', 'Workgroup', 'Price Coal ($/Ton)', 'Price Overburden ($/BCM)', 'Price Mud ($/BCM)', 'Price Topsoil ($/BCM)', 'Kurs Rp per USD', 'Coal', 'Overburden', 'Mud', 'Topsoil', 'Rental Excavator', 'Rental Dozer', 'Sediment Trap', 'Revenue Coal', 'Revenue OB', 'Revenue Topsoil', 'Revenue Mud', 'Revenue Fuel Compensation', 'Revenue Over Distance', 'Revenue Rental', 'Revenue Sediment Trap', 'PPh 23', 'Deposit 1% (Overburden Revenue)'],
    'SALES_REVENUE_TARGET': ['Date', 'Site', 'Workgroup', 'Price Coal ($/Ton)', 'Price Overburden ($/BCM)', 'Price Mud ($/BCM)', 'Price Topsoil ($/BCM)', 'Kurs Rp per USD', 'Coal', 'Overburden', 'Mud', 'Topsoil', 'Rental Excavator', 'Rental Dozer', 'Sediment Trap', 'Revenue Coal', 'Revenue OB', 'Revenue Topsoil', 'Revenue Mud', 'Revenue Fuel Compensation', 'Revenue Over Distance', 'Revenue Rental', 'Revenue Sediment Trap', 'PPh 23', 'Deposit 1% (Overburden Revenue)'],
    'OPR_COST_ACTUAL': ['Date', 'Site', 'Workgroup', 'Repair & Maintenance Cost', 'Employee Cost Direct', 'Drill & Blasting Cost', 'Leasing, Capex & Investation', 'HRD & GA Operasional', 'Logistik', 'IT & Engineering', 'Safety', 'Biaya HO Balikpapan', 'Lain-Lain (HO)'],
    'OPR_COST_TARGET': ['Date', 'Site', 'Workgroup', 'Repair & Maintenance Cost', 'Employee Cost Direct', 'Drill & Blasting Cost', 'Leasing, Capex & Investation', 'HRD & GA Operasional', 'Logistik', 'IT & Engineering', 'Safety', 'Biaya HO Balikpapan', 'Lain-Lain (HO)'],
    'UPLOAD_LOGS': ['Timestamp', 'FileName', 'Sheet', 'RowsCount', 'Status', 'ErrorMessage']
  };

  for (var name in sheets) {
    var sheet = ss.getSheetByName(name);
    if (!sheet) {
      sheet = ss.insertSheet(name);
      sheet.appendRow(sheets[name]);
      // Format headers
      sheet.getRange(1, 1, 1, sheets[name].length)
           .setBackground('#0d6efd')
           .setFontColor('#ffffff')
           .setFontWeight('bold');
    }
  }
  return "All sheets verified and ready.";
}

/**
 * Helper to parse Indonesian formatted numbers (thousands separator '.', decimal ',')
 */
function parseIndoNumber(val) {
  if (val === undefined || val === null) return 0;
  if (typeof val === 'number') return val;
  var s = String(val).trim();
  if (s === '-' || s === '' || s === ' - ') return 0;
  s = s.replace(/\\./g, '').replace(/,/g, '.');
  var num = parseFloat(s);
  return isNaN(num) ? 0 : num;
}

/**
 * Get all rows of a sheet as JSON array
 */
function getSheetData(sheetName) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) return [];
  
  var values = sheet.getDataRange().getValues();
  if (values.length <= 1) return [];
  
  var headers = values[0];
  var list = [];
  for (var i = 1; i < values.length; i++) {
    var row = values[i];
    var obj = { id: sheetName.toLowerCase() + '-' + i, rowNum: i + 1 };
    var hasData = false;
    for (var j = 0; j < headers.length; j++) {
      var val = row[j];
      obj[headers[j]] = val;
      if (val !== "") hasData = true;
    }
    if (hasData) {
      list.push(obj);
    }
  }
  return list;
}

/**
 * Add or Update data in a sheet
 */
function saveRecord(sheetName, obj, rowNum) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) throw new Error("Sheet not found");

  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  var rowValues = [];
  
  for (var i = 0; i < headers.length; i++) {
    var h = headers[i];
    rowValues.push(obj[h] !== undefined ? obj[h] : "");
  }

  if (rowNum) {
    sheet.getRange(rowNum, 1, 1, headers.length).setValues([rowValues]);
  } else {
    sheet.appendRow(rowValues);
  }
  return { success: true };
}

/**
 * Delete data in a sheet
 */
function deleteRecordByRow(sheetName, rowNum) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) throw new Error("Sheet not found");
  sheet.deleteRow(rowNum);
  return { success: true };
}

/**
 * Parse CSV and import with rollback safety
 */
function importCSVData(sheetName, csvText, fileName) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) throw new Error("Sheet " + sheetName + " not found.");

  var initialLastRow = sheet.getLastRow();
  var backupRange = null;
  var backupValues = null;

  if (initialLastRow > 1) {
    backupRange = sheet.getRange(2, 1, initialLastRow - 1, sheet.getLastColumn());
    backupValues = backupRange.getValues();
  }

  try {
    var lines = Utilities.parseCsv(csvText, ';');
    if (lines.length <= 1) {
      lines = Utilities.parseCsv(csvText, ',');
    }
    
    if (lines.length <= 1) {
      throw new Error("CSV file is empty or formatting is incorrect.");
    }

    var csvHeaders = lines[0].map(function(h) { return h.trim(); });
    var sheetHeaders = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];

    // Check header overlap
    for (var k = 0; h = sheetHeaders[k], k < sheetHeaders.length; k++) {
      var found = csvHeaders.some(function(ch) { return ch.toLowerCase() === h.toLowerCase(); });
      if (!found && h !== "") {
        throw new Error("Kolom mandatory '" + h + "' tidak ditemukan dalam CSV.");
      }
    }

    // Append rows
    for (var i = 1; i < lines.length; i++) {
      var line = lines[i];
      if (line.length === 0 || (line.length === 1 && line[0] === "")) continue;
      
      var row = [];
      for (var j = 0; j < sheetHeaders.length; j++) {
        var sh = sheetHeaders[j];
        var csvIdx = csvHeaders.findIndex(function(ch) { return ch.toLowerCase() === sh.toLowerCase(); });
        var val = csvIdx !== -1 ? line[csvIdx] : "";
        
        // Handle number conversions on import
        if (sh !== "Date" && sh !== "DATE" && sh !== "Jobsite" && sh !== "JOBSITE" && sh !== "Activity" && sh !== "UNIT_NO" && sh !== "WORKGROUP" && sh !== "MODEL" && sh !== "Site") {
          row.push(parseIndoNumber(val));
        } else {
          row.push(val);
        }
      }
      sheet.appendRow(row);
    }

    // Log success
    logUpload(fileName, sheetName, lines.length - 1, "SUCCESS", "");
    return { success: true, count: lines.length - 1 };

  } catch (err) {
    // ROLLBACK
    if (sheet.getLastRow() > initialLastRow) {
      var rowsToDelete = sheet.getLastRow() - initialLastRow;
      sheet.deleteRows(initialLastRow + 1, rowsToDelete);
    }
    if (backupValues) {
      sheet.getRange(2, 1, backupValues.length, sheet.getLastColumn()).setValues(backupValues);
    }
    
    logUpload(fileName, sheetName, 0, "ERROR", err.message);
    throw err;
  }
}

function logUpload(fileName, sheetName, count, status, errorMsg) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var logSheet = ss.getSheetByName("UPLOAD_LOGS");
  if (!logSheet) return;
  logSheet.appendRow([new Date(), fileName, sheetName, count, status, errorMsg]);
}
`;

export const INDEX_HTML = `<!DOCTYPE html>
<html>
  <head>
    <base target="_top">
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Coal Mine Cost Control Dashboard</title>
    <!-- Bootstrap 5, Font Awesome, DataTables & Chart.js -->
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <link rel="stylesheet" href="https://cdn.datatables.net/1.13.4/css/dataTables.bootstrap5.min.css">
    <script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>
    <style>
      body { background-color: #f4f6f9; font-family: 'Inter', sans-serif; transition: background-color 0.3s; }
      body.dark-mode { background-color: #121212; color: #e0e0e0; }
      .dark-mode .card { background-color: #1e1e1e; border-color: #333; color: #fff; }
      .dark-mode table { color: #fff; }
      .dark-mode .modal-content { background-color: #1e1e1e; color: #fff; }
      .kpi-card { border-radius: 12px; border: none; box-shadow: 0 4px 15px rgba(0,0,0,0.05); transition: transform 0.2s; cursor: pointer; }
      .kpi-card:hover { transform: translateY(-3px); }
      .sidebar { background-color: #1e293b; color: white; min-height: 100vh; }
      .nav-link { color: rgba(255,255,255,0.7); border-radius: 8px; margin: 4px 10px; }
      .nav-link.active { background-color: #3b82f6 !important; color: white !important; }
      .nav-link:hover { color: white; background-color: rgba(255,255,255,0.1); }
    </style>
  </head>
  <body>
    <div class="container-fluid">
      <div class="row">
        <!-- Sidebar -->
        <div class="col-md-2 p-0 sidebar d-flex flex-column">
          <div class="p-3 text-center border-bottom border-secondary">
            <h5 class="m-0 text-white"><i class="fa-solid fa-industry text-warning me-2"></i>PCC-BIMA ERP</h5>
            <small class="text-secondary">Cost Control Engine</small>
          </div>
          <ul class="nav nav-pills flex-column mb-auto mt-3" id="menuTabs">
            <li class="nav-item">
              <a href="#dashboard" class="nav-link active" onclick="switchView('dashboard')"><i class="fa-solid fa-chart-line me-2"></i>Dashboard</a>
            </li>
            <li class="nav-item">
              <a href="#pnl" class="nav-link" onclick="switchView('pnl')"><i class="fa-solid fa-file-invoice-dollar me-2"></i>Profit & Loss</a>
            </li>
            <li class="nav-item">
              <a href="#production" class="nav-link" onclick="switchView('production')"><i class="fa-solid fa-truck-monter me-2"></i>Log Produksi</a>
            </li>
            <li class="nav-item">
              <a href="#finance" class="nav-link" onclick="switchView('finance')"><i class="fa-solid fa-wallet me-2"></i>Finance / Revenue</a>
            </li>
            <li class="nav-item">
              <a href="#upload" class="nav-link" onclick="switchView('upload')"><i class="fa-solid fa-cloud-arrow-up me-2"></i>Upload CSV</a>
            </li>
          </ul>
          <div class="p-3 border-top border-secondary text-center">
            <button class="btn btn-outline-light btn-sm w-100" onclick="toggleDarkMode()"><i class="fa-solid fa-moon me-2"></i>Dark / Light</button>
          </div>
        </div>

        <!-- Main Content -->
        <div class="col-md-10 p-4" id="main-content">
          <div class="d-flex justify-content-between align-items-center mb-4 border-bottom pb-3">
            <h2 id="view-title">Dashboard Overview</h2>
            <div class="d-flex gap-2">
              <select class="form-select btn-sm" id="filterJobsite" onchange="loadAllData()"></select>
              <select class="form-select btn-sm" id="filterMonth" onchange="loadAllData()"></select>
              <select class="form-select btn-sm" id="filterYear" onchange="loadAllData()"></select>
            </div>
          </div>
          
          <!-- Views injection container -->
          <div id="viewContainer">
             <!-- Interactive widgets and forms live here -->
          </div>
        </div>
      </div>
    </div>

    <!-- Scripts -->
    <script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
    <script src="https://cdn.datatables.net/1.13.4/js/jquery.dataTables.min.js"></script>
    <script src="https://cdn.datatables.net/1.13.4/js/dataTables.bootstrap5.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <script>
      function toggleDarkMode() {
        $('body').toggleClass('dark-mode');
      }
      function switchView(viewName) {
        $('.nav-link').removeClass('active');
        $('a[onclick="switchView(\\'' + viewName + '\\')"]').addClass('active');
        $('#view-title').text(viewName.toUpperCase());
        // Load target view content dynamically
      }
    </script>
  </body>
</html>`;
