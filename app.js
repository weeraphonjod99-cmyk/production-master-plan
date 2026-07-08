let planData = window.PRODUCTION_PLAN_DATA ?? {
  sourceUrl: "#",
  generatedAt: "",
  planYear: 2026,
  planMonth: 7,
  machines: [],
  orders: []
};

const capacityData = window.PRODUCTION_CAPACITY_DATA ?? {
  sourceUrl: "#",
  generatedAt: "",
  records: []
};

const visiblePlanDays = 30;
const currentDateTime = new Date();
const planStart = startOfDay(currentDateTime);
const planDays = visiblePlanDays;
const planEnd = addDays(planStart, planDays - 1);
const orderStorageKey = `production-master-plan-orders-${planData.planYear}-${planData.planMonth}-v6`;
const sourceSignatureKey = `${orderStorageKey}-source-signature`;
const capacityStorageKey = `production-master-plan-capacity-${planData.planYear}-${planData.planMonth}-v1`;
const capacityPercentStorageKey = "production-master-plan-capacity-percent-v1";
const activeMachineKey = "production-master-plan-active-machine-v1";
const liveSheetConfig = {
  spreadsheetId: "1gR-a77vkgVxDu0jdSZ9RPhnGLC5OabIRHSRGBN0hZ18",
  refreshMs: 60000,
  retryMs: 300000,
  range: "A1:W1000",
  sheets: [
    "#1 Arc \u00b7Stack",
    "#2 Arc \u00b7Stack",
    "#3 Cut Chamber",
    "#4 GV2",
    "#5 Arc Chute",
    "#6 Arc Chute",
    "#7 Arc Chute",
    "#8 Arc Chute",
    "1#-OCP-80T",
    "2# MHS-80T",
    "3# OCP-110T",
    "4# SN1-110T",
    "5# OCP-110T",
    "6# STD-150T",
    "7# GTX-300T",
    "8# GTX-500T",
    "9# OCP-110T",
    "10# OCP-260 T",
    "11# 200T",
    "12# 200T",
    "#1 RW",
    "#2 RW",
    "#3 RW",
    "#8 Rubber Cap",
    "Bending #1",
    "Bending #2",
    "Tapping",
    "Riveting",
    "CNC-C1",
    "CNC-C2",
    "CNC-C3",
    "CNC-C4",
    "CNC-C5",
    "CNC-C6",
    "RV1",
    "RV2",
    "SW1# spot",
    "SW#2 Spot",
    "SW#3 Spot",
    "SW4 NMS",
    "SW5 CU",
    "SW6 NLC",
    "SW7 LC 600",
    "SW8 Door LC"
  ]
};

const palette = ["#2f6f8f", "#1f7a5a", "#a46819", "#7558a7", "#b84f3a", "#496a38", "#3b67a0", "#8a4d7b"];
const numberFormat = new Intl.NumberFormat("th-TH");
const dayFormat = new Intl.NumberFormat("th-TH", { maximumFractionDigits: 1 });
const percentFormat = new Intl.NumberFormat("th-TH", { style: "percent", maximumFractionDigits: 0 });
const weekdayFormat = new Intl.DateTimeFormat("th-TH", { weekday: "short" });
const timeFormat = new Intl.DateTimeFormat("th-TH", { hour: "2-digit", minute: "2-digit" });
const monthNames = [
  "มกราคม",
  "กุมภาพันธ์",
  "มีนาคม",
  "เมษายน",
  "พฤษภาคม",
  "มิถุนายน",
  "กรกฎาคม",
  "สิงหาคม",
  "กันยายน",
  "ตุลาคม",
  "พฤศจิกายน",
  "ธันวาคม"
];

const priorityPalette = ["#b42318", "#b45309", "#92720a", "#16735a", "#236a93", "#6a4f9f", "#7a4f6f"];

let machines = buildMachines(planData);
let sourceOrders = buildSourceOrders(planData);

const machineCount = document.querySelector("#machineCount");
const busyMachineCount = document.querySelector("#busyMachineCount");
const orderCount = document.querySelector("#orderCount");
const overCapacity = document.querySelector("#overCapacity");
const saveStatus = document.querySelector("#saveStatus");
const dataStamp = document.querySelector("#dataStamp");
const sourceSheetLink = document.querySelector("#sourceSheetLink");
const globalSearch = document.querySelector("#globalSearch");
const statusFilter = document.querySelector("#statusFilter");
const resetFilterButton = document.querySelector("#resetFilterButton");
const machineMenu = document.querySelector("#machineMenu");
const selectedMachineName = document.querySelector("#selectedMachineName");
const machineKpis = document.querySelector("#machineKpis");
const capacityPercentInput = document.querySelector("#capacityPercent");
const capacityInput = document.querySelector("#capacityInput");
const calendarHeader = document.querySelector("#calendarHeader");
const selectedTimeline = document.querySelector("#selectedTimeline");
const orderSearchInput = document.querySelector("#orderSearchInput");
const orderSearchCount = document.querySelector("#orderSearchCount");
const orderCards = document.querySelector("#orderCards");
const orderRows = document.querySelector("#orderRows");
const summaryRows = document.querySelector("#summaryRows");
const summaryCount = document.querySelector("#summaryCount");
const addOrderButton = document.querySelector("#addOrderButton");
const savePlanButton = document.querySelector("#savePlanButton");
const resetPlanButton = document.querySelector("#resetPlanButton");
const orderDialog = document.querySelector("#orderDialog");
const addOrderForm = document.querySelector("#addOrderForm");
const newOrderMachine = document.querySelector("#newOrderMachine");
const newOrderStartDate = document.querySelector("#newOrderStartDate");
const newOrderFinishDate = document.querySelector("#newOrderFinishDate");
const cancelOrderButton = document.querySelector("#cancelOrderButton");
const dismissOrderButton = document.querySelector("#dismissOrderButton");

const machineAliasKeys = {
  [normalizeKey("1#-OCP-80T")]: normalizeKey("1# OCP-80T"),
  [normalizeKey("SW1# spot")]: normalizeKey("SW#1 Spot"),
  [normalizeKey("Tapping")]: normalizeKey("Tapping LCNLC Box"),
  [normalizeKey("Riveting")]: normalizeKey("Riveting PDB"),
  [normalizeKey("SW4 NMS")]: normalizeKey("SW4 NMSCU Box"),
  [normalizeKey("SW5 CU")]: normalizeKey("SW5 CU Cover"),
  [normalizeKey("SW6 NLC")]: normalizeKey("SW6 NLC Door"),
  [normalizeKey("SW7 LC 600")]: normalizeKey("SW7 LC NLC Box"),
  [normalizeKey("SW8 Door LC")]: normalizeKey("SW8 LC Door")
};

let plannerOrders = loadPlannerOrders();
let capacityOverrides = loadCapacityOverrides();
let capacityPercent = loadCapacityPercent();
const capacityLookup = buildCapacityLookup(capacityData.records);
let schedules = buildSchedules();
let activeMachine = pickInitialMachine();

capacityPercentInput.value = String(capacityPercent);

sourceSheetLink.href = planData.sourceUrl;
updateDataStamp("โหลดข้อมูล snapshot");

function parseNumber(value) {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  const number = Number(String(value ?? "").replace(/[^\d.-]/g, ""));
  return Number.isFinite(number) ? number : 0;
}

function normalizeKey(value) {
  return String(value ?? "")
    .toLowerCase()
    .replace(/[·ยท]/g, "")
    .replace(/[^a-z0-9#]+/g, "");
}

function normalizePartNo(value) {
  return normalizeKey(value).replace(/^0+(?=\d)/, "");
}

function roundNumber(value, digits = 1) {
  const factor = 10 ** digits;
  return Math.round((Number(value) || 0) * factor) / factor;
}

function machineKeys(machineName) {
  const primary = normalizeKey(machineName);
  const alias = machineAliasKeys[primary];
  return alias ? [primary, alias] : [primary];
}

function valueAtPercent(values, percent) {
  const exact = parseNumber(values?.[String(percent)]);
  if (exact > 0) return exact;
  const base100 = parseNumber(values?.["100"]);
  if (base100 > 0) return base100 * (percent / 100);
  const base85 = parseNumber(values?.["85"]);
  if (base85 > 0) return base85 * (percent / 85);
  return 0;
}

function buildCapacityLookup(records = []) {
  const byMachinePart = new Map();
  for (const record of records) {
    const partKey = normalizePartNo(record.partNo);
    if (!partKey) continue;
    for (const machineKey of machineKeys(record.machine)) {
      const key = `${machineKey}|${partKey}`;
      if (!byMachinePart.has(key)) byMachinePart.set(key, []);
      byMachinePart.get(key).push(record);
    }
  }
  return byMachinePart;
}

function findCapacityRecord(machineName, partNo, percent = capacityPercent) {
  const partKey = normalizePartNo(partNo);
  if (!partKey) return null;

  const candidates = machineKeys(machineName).flatMap((machineKey) => capacityLookup.get(`${machineKey}|${partKey}`) ?? []);
  if (!candidates.length) return null;

  return candidates.reduce((slowest, record) => {
    const slowestCapacity = valueAtPercent(slowest.perDay8Hours, percent);
    const recordCapacity = valueAtPercent(record.perDay8Hours, percent);
    if (!slowestCapacity) return record;
    if (!recordCapacity) return slowest;
    return recordCapacity < slowestCapacity ? record : slowest;
  }, candidates[0]);
}

function scaledFallbackCapacity(machine, totalRemain, orderCount, percent = capacityPercent) {
  const baseCapacity = capacityFor(machine, totalRemain, orderCount);
  return Math.max(1, baseCapacity * (percent / 85));
}

function capacityForOrder(order, machine, totalRemain, orderCount, percent = capacityPercent) {
  const record = findCapacityRecord(machine.name, order.partNo, percent);
  if (record) {
    const dailyCapacity = valueAtPercent(record.perDay8Hours, percent);
    return {
      dailyCapacity: Math.max(1, dailyCapacity),
      piecesPerMinute: valueAtPercent(record.piecesPerMinute, percent),
      capacitySource: `${record.machine} row ${record.sourceRow}`,
      capacityMatched: true,
      capacityRecord: record
    };
  }

  return {
    dailyCapacity: scaledFallbackCapacity(machine, totalRemain, orderCount, percent),
    piecesPerMinute: 0,
    capacitySource: "fallback",
    capacityMatched: false,
    capacityRecord: null
  };
}

function buildMachines(data) {
  return (data.machines ?? []).map((machine, index) => ({
    name: machine.name,
    defaultCapacity: Number(machine.defaultCapacity) || 1000,
    sheetOrder: Number(machine.sheetOrder ?? index)
  }));
}

function buildSourceOrders(data) {
  return (data.orders ?? []).map((order, index) => ({
    id: `source-${index}`,
    machine: order.machine,
    openDate: order.openDate || "",
    orderNo: order.orderNo || "-",
    partName: order.partName || "-",
    partNo: order.partNo || "",
    rmNo: order.rmNo || "",
    priorityNo: parseNumber(order.priorityNo),
    qty: parseNumber(order.qty),
    unit: order.unit || "pcs",
    dueDate: order.dueDate || "",
    plannedStart: order.plannedStart || "",
    plannedFinish: order.plannedFinish || "",
    targetFinish: order.targetFinish || "",
    targetFinishTime: order.targetFinishTime || "",
    produced: parseNumber(order.produced),
    remaining: parseNumber(order.remaining || order.qty),
    productionStatus: order.productionStatus || "",
    progress: order.progress || "",
    sourceIndex: Number(order.sourceIndex ?? index)
  }));
}

function cleanText(value) {
  return String(value ?? "").trim().replace(/\s+/g, " ");
}

function normalizeHeader(value) {
  return cleanText(value).toLowerCase().replace(/[.:]/g, "");
}

function cellText(cell) {
  return cleanText(cell?.f ?? cell?.v ?? "");
}

function cellNumber(cell) {
  if (typeof cell?.v === "number") return Number.isFinite(cell.v) ? cell.v : 0;
  return parseNumber(cellText(cell));
}

function normalizeSheetDate(cell) {
  const raw = cell?.v ?? "";
  const formatted = cell?.f ?? "";
  const value = cleanText(raw || formatted);
  if (!value) return "";

  if (typeof raw === "number" && raw > 20000) {
    const utc = Date.UTC(1899, 11, 30) + raw * 86400000;
    return new Date(utc).toISOString().slice(0, 10);
  }

  const googleDate = String(raw).match(/^Date\((\d{4}),(\d{1,2}),(\d{1,2})\)/);
  if (googleDate) {
    const [, year, month, day] = googleDate;
    return `${year}-${String(Number(month) + 1).padStart(2, "0")}-${day.padStart(2, "0")}`;
  }

  const iso = value.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
  if (iso) {
    const [, year, month, day] = iso;
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  }

  const dmy = value.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{2,4})/);
  if (dmy) {
    const [, day, month, yearText] = dmy;
    const year = yearText.length === 2 ? `20${yearText}` : yearText;
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  }

  return value;
}

function findHeaderIndex(headers, labels, fallback) {
  const normalizedLabels = labels.map(normalizeHeader);
  const index = headers.findIndex((header) => {
    const normalized = normalizeHeader(header);
    return normalizedLabels.some((label) => normalized.includes(label));
  });
  return index >= 0 ? index : fallback;
}

function buildSheetColumns(headers) {
  const rmNo = findHeaderIndex(headers, ["rm no"], 5);
  const step = headers.findIndex(
    (header, index) => index > rmNo && index <= rmNo + 2 && normalizeHeader(header).includes("step")
  );
  const hasStep = step >= 0;
  const qtyFallback = hasStep ? step + 1 : rmNo + 1;
  const unitFallback = qtyFallback + 1;
  const dueFallback = unitFallback + 1;
  const shiftFallback = dueFallback + 1;
  const kpiFallback = shiftFallback + 1;
  const targetFallback = kpiFallback + 1;
  const finishDateFallback = targetFallback + 1;
  const finishTimeFallback = finishDateFallback + 1;
  const startFallback = finishTimeFallback + 1;
  const endFallback = startFallback + 1;
  const producedFallback = endFallback + 1;
  const remainingFallback = hasStep ? producedFallback + 1 : producedFallback + 2;
  const readyFallback = hasStep ? producedFallback + 2 : producedFallback + 1;
  const ngFallback = Math.max(remainingFallback, readyFallback) + 1;

  return {
    openDate: findHeaderIndex(headers, ["วันที่เปิดออเดอร์", "วันที่เปิด", "open"], 1),
    orderNo: findHeaderIndex(headers, ["order no"], 2),
    partName: findHeaderIndex(headers, ["part name"], 3),
    partNo: findHeaderIndex(headers, ["part no"], 4),
    rmNo,
    qty: findHeaderIndex(headers, ["ยอดสั่งซื้อ", "order qty", "qty"], qtyFallback),
    unit: findHeaderIndex(headers, ["unit"], unitFallback),
    dueDate: findHeaderIndex(headers, ["วันที่ต้องการ", "due"], dueFallback),
    shift: findHeaderIndex(headers, ["กะ", "shift"], shiftFallback),
    targetFinish: findHeaderIndex(headers, ["วันที่เสร็จสิ้น", "finish date"], finishDateFallback),
    targetFinishTime: findHeaderIndex(headers, ["เวลาเสร็จสิ้น", "finish time"], finishTimeFallback),
    plannedStart: findHeaderIndex(headers, ["วันที่เริ่ม", "planned start", "start"], startFallback),
    plannedFinish: findHeaderIndex(headers, ["วันที่จบ", "planned finish", "end"], endFallback),
    produced: findHeaderIndex(headers, ["ยอดการผลิต", "ผลิตแล้ว", "produced"], producedFallback),
    readyForPainting: findHeaderIndex(headers, ["ready for painting", "พร้อม", "ready"], readyFallback),
    remaining: findHeaderIndex(headers, ["ยอดค้างส่ง", "ค้างผลิต", "remain"], remainingFallback),
    ngRework: findHeaderIndex(headers, ["ng/rework", "rework"], ngFallback),
    productionStatus: findHeaderIndex(headers, ["สถานะการผลิต", "สถานะ", "status"], ngFallback + 1),
    progress: findHeaderIndex(headers, ["ความคืบหน้า", "progress"], ngFallback + 2),
    stock: findHeaderIndex(headers, ["stock"], ngFallback + 3)
  };
}

function knownCapacityFor(machineName, totalRemain, orderCount) {
  const existing = machines.find((machine) => machine.name === machineName);
  if (existing?.defaultCapacity > 0) return existing.defaultCapacity;
  if (/Bending/i.test(machineName)) return 250;
  if (/Tapping|Riveting|RV/i.test(machineName)) return 650;
  if (/CNC/i.test(machineName)) return 900;
  if (/SW|Spot|NMS|NLC|LC/i.test(machineName)) return 1400;
  if (/Arc|Chute|Stack|Cut Chamber|GV2/i.test(machineName)) return 850;
  if (/OCP|MHS|SN1|STD|GTX|80T|110T|150T|200T|260/i.test(machineName)) return 1200;
  if (!orderCount) return 1000;
  return Math.max(250, Math.ceil(totalRemain / Math.max(6, Math.min(20, orderCount * 2))));
}

function tableToOrders(table, machineName, machineIndex) {
  const rows = table?.rows ?? [];
  let headers = (table?.cols ?? []).map((column) => cleanText(column?.label || column?.id || ""));
  let dataRows = rows;
  const hasUsefulHeaders = headers.some((header) => {
    const normalized = normalizeHeader(header);
    return normalized.includes("order") || normalized.includes("part") || header.includes("วันที่") || header.includes("ยอด");
  });

  if (!hasUsefulHeaders) {
    const headerRow = rows[0]?.c ?? [];
    headers = headerRow.map(cellText);
    dataRows = rows.slice(1);
  }

  const column = buildSheetColumns(headers);

  const orders = [];
  for (let rowIndex = 0; rowIndex < dataRows.length; rowIndex += 1) {
    const row = dataRows[rowIndex]?.c ?? [];
    const orderNo = cellText(row[column.orderNo]);
    const partNo = cellText(row[column.partNo]);
    const partName = cellText(row[column.partName]) || partNo || "-";
    const qty = cellNumber(row[column.qty]);
    if (!orderNo || qty <= 0 || (!partName && !partNo)) continue;

    const produced = cellNumber(row[column.produced]);
    const explicitRemain = cellNumber(row[column.remaining]);
    const remaining = explicitRemain > 0 ? explicitRemain : Math.max(0, qty - produced) || qty;

    orders.push({
      id: `live-${machineIndex}-${rowIndex + 1}`,
      machine: machineName,
      openDate: normalizeSheetDate(row[column.openDate]),
      orderNo,
      partName,
      partNo,
      rmNo: cellText(row[column.rmNo]),
      priorityNo: cellNumber(row[0]),
      qty,
      unit: cellText(row[column.unit]) || "pcs",
      dueDate: normalizeSheetDate(row[column.dueDate]),
      shift: cellText(row[column.shift]),
      targetFinish: normalizeSheetDate(row[column.targetFinish]),
      targetFinishTime: cellText(row[column.targetFinishTime]),
      plannedStart: normalizeSheetDate(row[column.plannedStart]),
      plannedFinish: normalizeSheetDate(row[column.plannedFinish]),
      produced,
      readyForPainting: cellNumber(row[column.readyForPainting]),
      remaining,
      ngRework: cellNumber(row[column.ngRework]),
      productionStatus: cellText(row[column.productionStatus]),
      progress: cellText(row[column.progress]),
      stock: cellText(row[column.stock]),
      sourceIndex: orders.length
    });
  }
  return orders;
}

function loadGvizTable(sheetName) {
  return new Promise((resolve, reject) => {
    const callbackName = `__productionPlan_${Date.now()}_${Math.random().toString(16).slice(2)}`;
    const script = document.createElement("script");
    const timeout = window.setTimeout(() => {
      cleanup();
      reject(new Error(`โหลด Google Sheet ไม่สำเร็จ: ${sheetName}`));
    }, 12000);

    function cleanup() {
      window.clearTimeout(timeout);
      delete window[callbackName];
      script.remove();
    }

    window[callbackName] = (response) => {
      cleanup();
      if (response?.status === "ok" && response.table) {
        resolve(response.table);
        return;
      }
      reject(new Error(response?.errors?.[0]?.detailed_message || `อ่านชีตไม่ได้: ${sheetName}`));
    };

    const params = new URLSearchParams({
      sheet: sheetName,
      range: liveSheetConfig.range,
      headers: "1",
      tqx: `out:json;responseHandler:${callbackName}`,
      cache: String(Date.now())
    });
    script.onerror = () => {
      cleanup();
      reject(new Error(`เชื่อมต่อ Google Sheet ไม่ได้: ${sheetName}`));
    };
    script.src = `https://docs.google.com/spreadsheets/d/${liveSheetConfig.spreadsheetId}/gviz/tq?${params}`;
    document.head.appendChild(script);
  });
}

async function loadLivePlanData() {
  const results = await Promise.allSettled(
    liveSheetConfig.sheets.map((sheetName, index) =>
      loadGvizTable(sheetName).then((table) => ({ sheetName, index, orders: tableToOrders(table, sheetName, index) }))
    )
  );
  const fulfilled = results
    .filter((result) => result.status === "fulfilled")
    .map((result) => result.value);

  if (fulfilled.length < Math.ceil(liveSheetConfig.sheets.length * 0.8)) {
    throw new Error("Google Sheet ยังไม่อนุญาตให้เว็บอ่านข้อมูลสด");
  }

  const orders = fulfilled.flatMap((sheet) =>
    sheet.orders.map((order, sourceIndex) => ({ ...order, sourceIndex }))
  );
  let runningIndex = 0;
  for (const order of orders) {
    order.id = `live-${runningIndex}`;
    order.sourceIndex = runningIndex;
    runningIndex += 1;
  }

  const machinesFromSheet = liveSheetConfig.sheets.map((sheetName, index) => {
    const machineOrders = orders.filter((order) => order.machine === sheetName);
    const totalRemain = machineOrders.reduce((sum, order) => sum + order.remaining, 0);
    return {
      name: sheetName,
      defaultCapacity: knownCapacityFor(sheetName, totalRemain, machineOrders.length),
      sheetOrder: index
    };
  });

  return {
    sourceUrl: planData.sourceUrl,
    generatedAt: new Date().toISOString(),
    planYear: planData.planYear,
    planMonth: planData.planMonth,
    machines: machinesFromSheet,
    orders
  };
}

function planSignature(orders) {
  return orders
    .map(
      (order) =>
        `${order.machine}|${order.orderNo}|${order.partNo}|${order.priorityNo}|${order.qty}|${order.remaining}|${order.plannedStart}|${order.plannedFinish}|${order.targetFinish}|${order.targetFinishTime}|${order.produced}|${order.productionStatus}`
    )
    .join(";");
}

function applyLivePlanData(nextPlanData) {
  const previousSignature = planSignature(sourceOrders);
  const nextSourceOrders = buildSourceOrders(nextPlanData);
  const nextSignature = planSignature(nextSourceOrders);

  planData = nextPlanData;
  machines = buildMachines(planData);
  sourceOrders = nextSourceOrders;
  plannerOrders = sourceOrders.map(cloneOrder);
  schedules = buildSchedules();
  if (!schedules.some((schedule) => schedule.name === activeMachine)) activeMachine = pickInitialMachine();
  sourceSheetLink.href = planData.sourceUrl;
  updateDataStamp("อัปเดตจาก Google Sheet อัตโนมัติ");
  if (previousSignature !== nextSignature) setSaveStatus("อัปเดตข้อมูลใหม่จาก Google Sheet แล้ว");
  render();
}

async function refreshLiveSheet() {
  try {
    const nextPlanData = await loadLivePlanData();
    applyLivePlanData(nextPlanData);
    window.setTimeout(refreshLiveSheet, liveSheetConfig.refreshMs);
  } catch (error) {
    updateDataStamp("รอสิทธิ์อ่าน Google Sheet สด");
    window.setTimeout(refreshLiveSheet, liveSheetConfig.retryMs);
  }
}

function updateDataStamp(status = "") {
  const suffix = status ? ` · ${status}` : "";
  dataStamp.textContent = `${numberFormat.format(sourceOrders.length)} orders · แผน ${formatDate(planStart)} - ${formatDate(planEnd)} · ${timeFormat.format(new Date())}${suffix}`;
}

function getStorage() {
  try {
    return typeof window !== "undefined" ? window.localStorage : null;
  } catch {
    return null;
  }
}

function cloneOrder(order, index = 0) {
  return {
    id: order.id || `order-${index}`,
    machine: order.machine,
    openDate: order.openDate || "",
    orderNo: order.orderNo || "-",
    partName: order.partName || "-",
    partNo: order.partNo || "",
    rmNo: order.rmNo || "",
    priorityNo: parseNumber(order.priorityNo),
    qty: parseNumber(order.qty),
    unit: order.unit || "pcs",
    dueDate: order.dueDate || "",
    plannedStart: order.plannedStart || "",
    plannedFinish: order.plannedFinish || "",
    targetFinish: order.targetFinish || "",
    targetFinishTime: order.targetFinishTime || "",
    produced: parseNumber(order.produced),
    remaining: parseNumber(order.remaining || order.qty),
    productionStatus: order.productionStatus || "",
    progress: order.progress || "",
    sourceIndex: Number(order.sourceIndex ?? index),
    created: Boolean(order.created)
  };
}

function loadPlannerOrders() {
  const storage = getStorage();
  if (!storage) return sourceOrders.map(cloneOrder);

  try {
    const storedSignature = storage.getItem(sourceSignatureKey);
    if (storedSignature && storedSignature !== planSignature(sourceOrders)) return sourceOrders.map(cloneOrder);

    const stored = JSON.parse(storage.getItem(orderStorageKey) || "null");
    if (!Array.isArray(stored) || !stored.length) return sourceOrders.map(cloneOrder);
    return stored
      .filter((order) => order && order.id && order.machine && order.partName)
      .map((order, index) => cloneOrder(order, index));
  } catch {
    return sourceOrders.map(cloneOrder);
  }
}

function loadCapacityOverrides() {
  const storage = getStorage();
  if (!storage) return {};

  try {
    const stored = JSON.parse(storage.getItem(capacityStorageKey) || "{}");
    return stored && typeof stored === "object" ? stored : {};
  } catch {
    return {};
  }
}

function loadCapacityPercent() {
  const storage = getStorage();
  const stored = parseNumber(storage?.getItem(capacityPercentStorageKey));
  return stored > 0 ? stored : 85;
}

function savePlan(message = "บันทึกแผนแล้ว") {
  const storage = getStorage();
  if (storage) {
    storage.setItem(orderStorageKey, JSON.stringify(plannerOrders));
    storage.setItem(sourceSignatureKey, planSignature(sourceOrders));
    storage.setItem(capacityStorageKey, JSON.stringify(capacityOverrides));
    storage.setItem(capacityPercentStorageKey, String(capacityPercent));
  }
  setSaveStatus(message);
}

function clearPlan() {
  const storage = getStorage();
  if (storage) {
    storage.removeItem(orderStorageKey);
    storage.removeItem(sourceSignatureKey);
    storage.removeItem(capacityStorageKey);
    storage.removeItem(capacityPercentStorageKey);
  }
}

function setSaveStatus(message) {
  saveStatus.textContent = message;
}

function startOfDay(date) {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

function addDays(date, days) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function formatDate(date) {
  if (!date) return "-";
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${day}/${month}/${date.getFullYear()}`;
}

function formatShortDate(date) {
  if (!date) return "-";
  return `${date.getDate()}/${date.getMonth() + 1}`;
}

function dateToIso(date) {
  if (!date) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function isoToDate(iso) {
  if (!iso || !/^\d{4}-\d{2}-\d{2}/.test(iso)) return null;
  const [year, month, day] = iso.slice(0, 10).split("-").map(Number);
  return new Date(year, month - 1, day);
}

function formatIsoDate(iso) {
  return formatDate(isoToDate(iso));
}

function daysBetween(startDate, endDate) {
  return Math.round((startOfDay(endDate) - startOfDay(startDate)) / 86400000);
}

function plannedFinishDateFor(order) {
  return isoToDate(order.plannedFinish) ?? isoToDate(order.targetFinish);
}

function plannedStartDateFor(order, machineDays) {
  const plannedStartDate = isoToDate(order.plannedStart);
  if (plannedStartDate) return plannedStartDate;

  const plannedFinishDate = plannedFinishDateFor(order);
  if (!plannedFinishDate) return null;

  return addDays(plannedFinishDate, -Math.max(0, Math.ceil(machineDays) - 1));
}

function plannedOrderSortValue(order) {
  const plannedStartDate = isoToDate(order.plannedStart);
  const plannedFinishDate = plannedFinishDateFor(order);
  const referenceDate = plannedStartDate ?? plannedFinishDate;
  return {
    hasPlan: Boolean(referenceDate),
    time: referenceDate ? startOfDay(referenceDate).getTime() : Number.MAX_SAFE_INTEGER
  };
}

function priorityNoFor(order) {
  return parseNumber(order.priorityNo);
}

function prioritySortValue(order) {
  const priorityNo = priorityNoFor(order);
  return priorityNo > 0 ? priorityNo : Number.MAX_SAFE_INTEGER;
}

function priorityLabel(order) {
  const priorityNo = priorityNoFor(order);
  return priorityNo > 0 ? numberFormat.format(priorityNo) : "-";
}

function nextPriorityNoForMachine(machine) {
  const machinePriorities = plannerOrders
    .filter((order) => order.machine === machine)
    .map(priorityNoFor)
    .filter((priorityNo) => priorityNo > 0);
  return machinePriorities.length ? Math.max(...machinePriorities) + 1 : 1;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formatMachineDays(value) {
  if (!value) return "0";
  if (value >= 10 || Number.isInteger(value)) return dayFormat.format(Math.round(value));
  return dayFormat.format(Math.max(0.1, value));
}

function formatCapacityDay(value) {
  if (!value) return "-";
  return numberFormat.format(Math.round(value));
}

function formatPiecesPerMinute(value) {
  if (!value) return "-";
  return dayFormat.format(roundNumber(value, 2));
}

function statusClass(status) {
  if (status === "Over capacity") return "over";
  if (status === "Tight") return "tight";
  if (status === "No order") return "idle";
  return "ok";
}

function statusText(status) {
  if (status === "Over capacity") return "เกิน 30 วัน";
  if (status === "Tight") return "แน่น";
  if (status === "No order") return "ยังไม่มีงาน";
  return "OK";
}

function orderStatusText(order) {
  return order.overMonth ? "เกิน 30 วัน" : "ใน 30 วัน";
}

function orderLabel(order) {
  if (!order.orderNo || order.orderNo === "-" || order.orderNo === "WIP") {
    return order.partNo ? `${order.partName} (${order.partNo})` : order.partName;
  }
  return order.orderNo;
}

function orderTooltip(order) {
  const unit = order.unit || "pcs";
  return [
    `No. เร่งด่วน: ${priorityLabel(order)}`,
    `Part No.: ${order.partNo || "-"}`,
    `ยอดต้องผลิต: ${numberFormat.format(order.qty)} ${unit}`,
    `ค้างผลิต: ${numberFormat.format(order.remaining)} ${unit}`,
    `KPI: ${formatPiecesPerMinute(order.piecesPerMinute)} pcs/min`,
    `กำลังผลิต: ${formatCapacityDay(order.dailyCapacity)} pcs/day`,
    `Order: ${order.orderNo}`,
    `Part: ${order.partName}`,
    `วันเครื่อง: ${formatMachineDays(order.machineDays)}`,
    `เริ่ม: ${formatDate(order.startDate)}`,
    `จบ: ${formatDate(order.finishDate)}`,
    `แผน Sheet: ${order.sheetPlanUsed ? formatDate(order.sheetPlanDate) : "-"}`,
    `วันที่เสร็จสิ้น Sheet: ${order.sheetFinishDate ? formatDate(order.sheetFinishDate) : "-"}`,
    `ข้อมูล: ${order.capacityMatched ? order.capacitySource : "ใช้ค่า fallback"}`
  ].join("\n");
}

function colorFor(text, index) {
  let hash = index;
  for (const char of String(text)) hash = (hash * 31 + char.charCodeAt(0)) % 9973;
  return palette[Math.abs(hash) % palette.length];
}

function colorForPriority(order, fallbackIndex) {
  const priorityNo = priorityNoFor(order);
  if (!priorityNo) return colorFor(`${order.orderNo}-${order.partNo}`, fallbackIndex);
  return priorityPalette[(Math.max(1, Math.round(priorityNo)) - 1) % priorityPalette.length];
}

function capacityFor(machine, totalRemain, orderCount) {
  const override = parseNumber(capacityOverrides[machine.name]);
  if (override > 0) return override;
  if (machine.defaultCapacity > 0) return machine.defaultCapacity;
  if (!orderCount) return 1000;
  return Math.max(250, Math.ceil(totalRemain / Math.max(6, Math.min(20, orderCount * 2))));
}

function buildSchedules() {
  const ordersByMachine = new Map();
  for (const order of plannerOrders) {
    if (!ordersByMachine.has(order.machine)) ordersByMachine.set(order.machine, []);
    ordersByMachine.get(order.machine).push(order);
  }

  return machines.map((machine, machineIndex) => {
    const machineOrders = (ordersByMachine.get(machine.name) ?? [])
      .map(cloneOrder)
      .sort((a, b) => {
        const aPriority = prioritySortValue(a);
        const bPriority = prioritySortValue(b);
        if (aPriority !== bPriority) return aPriority - bPriority;
        const aPlan = plannedOrderSortValue(a);
        const bPlan = plannedOrderSortValue(b);
        if (aPlan.hasPlan !== bPlan.hasPlan) return Number(!aPlan.hasPlan) - Number(!bPlan.hasPlan);
        if (aPlan.time !== bPlan.time) return aPlan.time - bPlan.time;
        return a.sourceIndex - b.sourceIndex;
      });
    const totalRemain = machineOrders.reduce((sum, order) => sum + order.remaining, 0);
    const fallbackCapacityPerDay = scaledFallbackCapacity(machine, totalRemain, machineOrders.length);
    let cursor = 0;

    const orders = machineOrders.map((order, orderIndex) => {
      const orderCapacity = capacityForOrder(order, machine, totalRemain, machineOrders.length);
      const machineDays = orderCapacity.dailyCapacity ? order.remaining / orderCapacity.dailyCapacity : 0;
      const sheetPlanDate = plannedStartDateFor(order, machineDays);
      const sheetFinishDate = plannedFinishDateFor(order);
      const sheetPlanOffset = sheetPlanDate ? Math.max(0, daysBetween(planStart, sheetPlanDate)) : cursor;
      const startOffset = Math.max(cursor, sheetPlanOffset);
      const finishOffset = startOffset + machineDays;
      const startDay = Math.max(1, Math.floor(startOffset) + 1);
      const finishDay = Math.max(startDay, Math.ceil(finishOffset));
      cursor = finishOffset;

      return {
        ...order,
        sequence: orderIndex + 1,
        machineDays,
        dailyCapacity: orderCapacity.dailyCapacity,
        piecesPerMinute: orderCapacity.piecesPerMinute,
        capacitySource: orderCapacity.capacitySource,
        capacityMatched: orderCapacity.capacityMatched,
        capacityRecord: orderCapacity.capacityRecord,
        sheetPlanDate,
        sheetFinishDate,
        sheetPlanUsed: Boolean(sheetPlanDate || sheetFinishDate),
        startDay,
        finishDay,
        startDate: addDays(planStart, startDay - 1),
        finishDate: addDays(planStart, finishDay - 1),
        overMonth: finishDay > planDays,
        color: colorForPriority(order, machineIndex + orderIndex)
      };
    });

    const totalDays = cursor;
    const capacityPerDay = totalDays > 0 ? totalRemain / totalDays : fallbackCapacityPerDay;
    const utilization = totalDays / planDays;
    const overDays = Math.max(0, Math.ceil(totalDays - planDays));
    const idleDays = Math.max(0, Math.floor(planDays - totalDays));
    const status = !orders.length
      ? "No order"
      : totalDays > planDays
        ? "Over capacity"
        : totalDays >= planDays * 0.85
          ? "Tight"
          : "OK";

    return {
      ...machine,
      orders,
      totalRemain,
      capacityPerDay,
      fallbackCapacityPerDay,
      totalDays,
      utilization,
      overDays,
      idleDays,
      status,
      finishDate: totalDays ? addDays(planStart, Math.ceil(totalDays) - 1) : null
    };
  });
}

function pickInitialMachine() {
  const storage = getStorage();
  const stored = storage?.getItem(activeMachineKey);
  if (stored && schedules.some((schedule) => schedule.name === stored)) return stored;
  const busy = schedules.find((schedule) => schedule.orders.length);
  return busy?.name ?? schedules[0]?.name ?? "";
}

function machineOptionList(selectedMachine = "") {
  return machines
    .map((machine) => {
      const selected = machine.name === selectedMachine ? " selected" : "";
      return `<option value="${escapeHtml(machine.name)}"${selected}>${escapeHtml(machine.name)}</option>`;
    })
    .join("");
}

function populateNewOrderMachine(selectedMachine = activeMachine) {
  newOrderMachine.innerHTML = machineOptionList(selectedMachine);
}

function matchesQuery(schedule, query) {
  if (!query) return true;
  const machineText = `${schedule.name} ${schedule.status}`.toLowerCase();
  const orderText = schedule.orders
    .map((order) => `${order.orderNo} ${order.partName} ${order.partNo} ${order.rmNo}`)
    .join(" ")
    .toLowerCase();
  return machineText.includes(query) || orderText.includes(query);
}

function filteredSchedules() {
  const query = globalSearch.value.trim().toLowerCase();
  const status = statusFilter.value;
  return schedules.filter((schedule) => {
    const statusMatch = status === "all" || schedule.status === status;
    return statusMatch && matchesQuery(schedule, query);
  });
}

function sortSchedules(items) {
  return [...items].sort((a, b) => {
    const busySort = Number(!a.orders.length) - Number(!b.orders.length);
    if (busySort) return busySort;
    return a.sheetOrder - b.sheetOrder;
  });
}

function selectedSchedule() {
  return schedules.find((schedule) => schedule.name === activeMachine) ?? schedules[0];
}

function orderMatchesSearch(order, query) {
  if (!query) return true;
  return `${order.orderNo} ${order.partName} ${order.partNo} ${order.rmNo}`.toLowerCase().includes(query);
}

function assignLanes(blocks) {
  const laneEnds = [];
  return blocks.map((block) => {
    let lane = laneEnds.findIndex((end) => end < block.start);
    if (lane === -1) {
      lane = laneEnds.length;
      laneEnds.push(0);
    }
    laneEnds[lane] = block.end;
    return { ...block, lane: lane + 1 };
  });
}

function isoWeekInfo(date) {
  const target = startOfDay(date);
  target.setDate(target.getDate() + 3 - ((target.getDay() + 6) % 7));
  const weekYear = target.getFullYear();
  const firstThursday = new Date(weekYear, 0, 4);
  firstThursday.setDate(firstThursday.getDate() + 3 - ((firstThursday.getDay() + 6) % 7));
  const week = 1 + Math.round((target - firstThursday) / 604800000);
  return { week, weekYear };
}

function renderCalendarHeader() {
  const dates = Array.from({ length: planDays }, (_, index) => addDays(planStart, index));
  const weekGroups = [];

  dates.forEach((date, index) => {
    const { week, weekYear } = isoWeekInfo(date);
    const label = `W${String(week).padStart(2, "0")}`;
    const last = weekGroups[weekGroups.length - 1];
    if (last && last.week === week && last.weekYear === weekYear) {
      last.span += 1;
      last.endDate = date;
    } else {
      weekGroups.push({ week, weekYear, label, start: index + 1, span: 1, startDate: date, endDate: date });
    }
  });

  calendarHeader.style.setProperty("--timeline-days", planDays);
  calendarHeader.innerHTML = `
    <div class="calendar-week-row" style="--timeline-days:${planDays}">
      ${weekGroups
        .map(
          (group) => `
            <span
              class="calendar-week"
              style="grid-column:${group.start} / span ${group.span}"
              title="${escapeHtml(formatDate(group.startDate))} - ${escapeHtml(formatDate(group.endDate))}"
            >
              ${escapeHtml(group.label)}
            </span>
          `
        )
        .join("")}
    </div>
    <div class="calendar-day-row" style="--timeline-days:${planDays}">
      ${dates
        .map((date) => {
          const isToday = date.getTime() === planStart.getTime() ? " is-today" : "";
          return `
            <span class="calendar-day${isToday}" title="${escapeHtml(formatDate(date))}">
              <strong>${escapeHtml(formatShortDate(date))}</strong>
              <small>${escapeHtml(weekdayFormat.format(date))}</small>
            </span>
          `;
        })
        .join("")}
    </div>
  `;
}

function renderMetrics() {
  const busy = schedules.filter((schedule) => schedule.orders.length);
  const totalOrders = schedules.reduce((sum, schedule) => sum + schedule.orders.length, 0);
  const over = schedules.filter((schedule) => schedule.status === "Over capacity").length;
  machineCount.textContent = numberFormat.format(schedules.length);
  busyMachineCount.textContent = numberFormat.format(busy.length);
  orderCount.textContent = numberFormat.format(totalOrders);
  overCapacity.textContent = numberFormat.format(over);
}

function renderMachineMenu(items) {
  if (!items.length) {
    machineMenu.innerHTML = '<div class="empty-state">ไม่มีเครื่องตามตัวกรอง</div>';
    return;
  }

  machineMenu.innerHTML = items
    .map((schedule) => {
      const fill = Math.min(100, Math.round(schedule.utilization * 100));
      const active = schedule.name === activeMachine ? " active" : "";
      return `
        <button
          class="machine-item ${statusClass(schedule.status)}${active}"
          type="button"
          data-machine="${escapeHtml(schedule.name)}"
          data-drop-machine="${escapeHtml(schedule.name)}"
          style="--load:${fill}%"
        >
          <span class="machine-name">${escapeHtml(schedule.name)}</span>
          <span class="machine-meta">
            ${numberFormat.format(schedule.orders.length)} orders · ${formatMachineDays(schedule.totalDays)} วัน
          </span>
          <span class="machine-load"><i></i></span>
        </button>
      `;
    })
    .join("");
}

function renderSelectedTimeline(schedule) {
  if (!schedule) {
    selectedTimeline.innerHTML = '<div class="empty-state">ไม่มีข้อมูลเครื่องจักร</div>';
    return;
  }

  const visibleBlocks = schedule.orders
    .filter((order) => order.startDay <= planDays)
    .map((order) => ({
      ...order,
      start: Math.max(1, order.startDay),
      end: Math.min(planDays, Math.max(order.startDay, order.finishDay))
    }));
  const stacked = assignLanes(visibleBlocks);
  const laneCount = Math.max(1, ...stacked.map((block) => block.lane));

  if (!stacked.length) {
    selectedTimeline.innerHTML = `
      <div class="timeline-grid empty-drop" data-drop-machine="${escapeHtml(schedule.name)}" style="--lane-count:1; --timeline-days:${planDays}">
        <div class="empty-state timeline-empty">ยังไม่มีออเดอร์ในเครื่องนี้</div>
      </div>
    `;
    return;
  }

  selectedTimeline.innerHTML = `
    <div class="timeline-grid" data-drop-machine="${escapeHtml(schedule.name)}" style="--lane-count:${laneCount}; --timeline-days:${planDays}">
      ${stacked
        .map((order) => {
          const span = Math.max(1, order.end - order.start + 1);
          return `
            <button
              class="order-block ${order.overMonth ? "is-over" : ""}"
              type="button"
              draggable="true"
              data-order-id="${escapeHtml(order.id)}"
              data-tooltip="${escapeHtml(orderTooltip(order))}"
              style="grid-column:${order.start} / span ${span}; grid-row:${order.lane}; --order-color:${order.color}"
            >
              <span>${escapeHtml(orderLabel(order))}</span>
            </button>
          `;
        })
        .join("")}
    </div>
  `;
}

function renderMachineDetail(schedule) {
  if (!schedule) return;

  activeMachine = schedule.name;
  const orderQuery = orderSearchInput.value.trim().toLowerCase();
  const visibleOrders = schedule.orders.filter((order) => orderMatchesSearch(order, orderQuery));
  const matchedCapacityOrders = schedule.orders.filter((order) => order.capacityMatched).length;

  selectedMachineName.textContent = schedule.name;
  capacityInput.value = Math.round(schedule.fallbackCapacityPerDay ?? schedule.capacityPerDay);
  machineKpis.innerHTML = `
    <span>${numberFormat.format(schedule.orders.length)} orders</span>
    <span>KPI ${numberFormat.format(capacityPercent)}%</span>
    <span>เรียง No. 1→2</span>
    <span>${numberFormat.format(matchedCapacityOrders)}/${numberFormat.format(schedule.orders.length)} Part match</span>
    <span>${formatMachineDays(schedule.totalDays)} วันเครื่อง</span>
    <span>จบ ${formatDate(schedule.finishDate)}</span>
    <span class="pill ${statusClass(schedule.status)}">${statusText(schedule.status)}</span>
  `;

  orderSearchCount.textContent = orderQuery
    ? `${numberFormat.format(visibleOrders.length)} / ${numberFormat.format(schedule.orders.length)} orders`
    : `${numberFormat.format(schedule.orders.length)} orders`;

  orderCards.innerHTML = visibleOrders.length
    ? visibleOrders
        .slice(0, 5)
        .map(
          (order) => `
            <article class="order-card">
              <span>No. ${escapeHtml(priorityLabel(order))}</span>
              <strong>${escapeHtml(orderLabel(order))}</strong>
              <small>Part No. ${escapeHtml(order.partNo || "-")}</small>
              <small>${escapeHtml(order.partName)}</small>
              <b>ยอดต้องผลิต ${numberFormat.format(order.qty)} ${escapeHtml(order.unit || "pcs")}</b>
              <small>KPI ${formatPiecesPerMinute(order.piecesPerMinute)} pcs/min · ${formatCapacityDay(order.dailyCapacity)} pcs/day</small>
              <small>ค้างผลิต ${numberFormat.format(order.remaining)} ${escapeHtml(order.unit || "pcs")} · ${formatMachineDays(order.machineDays)} วัน</small>
            </article>
          `
        )
        .join("")
    : '<div class="empty-state order-empty">ไม่มีออเดอร์ตามคำค้นหา</div>';

  orderRows.innerHTML = visibleOrders.length
    ? visibleOrders
        .map(
          (order) => `
            <tr>
              <td>
                <strong>${escapeHtml(priorityLabel(order))}</strong>
                <span class="muted-line">คิว ${numberFormat.format(order.sequence)}</span>
              </td>
              <td>
                <strong>${escapeHtml(order.orderNo)}</strong>
                <span class="muted-line">${formatIsoDate(order.openDate)}</span>
              </td>
              <td>
                <strong>${escapeHtml(order.partName)}</strong>
                <span class="muted-line">${escapeHtml(order.partNo || "-")}</span>
              </td>
              <td class="numeric">
                <strong>${numberFormat.format(order.qty)}</strong>
                <span class="muted-line">ค้าง ${numberFormat.format(order.remaining)}</span>
              </td>
              <td class="numeric">
                <strong>${formatPiecesPerMinute(order.piecesPerMinute)}</strong>
                <span class="muted-line">pcs/min</span>
              </td>
              <td class="numeric">
                <strong>${formatCapacityDay(order.dailyCapacity)}</strong>
                <span class="muted-line">${order.capacityMatched ? "capacity" : "fallback"}</span>
              </td>
              <td class="numeric">${formatMachineDays(order.machineDays)}</td>
              <td>${formatDate(order.startDate)}</td>
              <td>
                ${formatDate(order.finishDate)}
                <span class="muted-line">Sheet ${order.sheetFinishDate ? formatDate(order.sheetFinishDate) : "-"}</span>
              </td>
              <td><span class="pill ${order.overMonth ? "over" : "ok"}">${orderStatusText(order)}</span></td>
              <td>
                <select class="machine-move" data-order-machine="${escapeHtml(order.id)}">
                  ${machineOptionList(order.machine)}
                </select>
              </td>
              <td>
                <div class="row-actions">
                  <button class="icon-button" type="button" data-reorder-order="${escapeHtml(order.id)}" data-direction="up" aria-label="เลื่อนขึ้น">↑</button>
                  <button class="icon-button" type="button" data-reorder-order="${escapeHtml(order.id)}" data-direction="down" aria-label="เลื่อนลง">↓</button>
                </div>
              </td>
            </tr>
          `
        )
        .join("")
    : '<tr><td colspan="12"><div class="empty-state">ไม่มีออเดอร์ตามคำค้นหา</div></td></tr>';
}

function renderSummaryRows(items) {
  summaryCount.textContent = `${numberFormat.format(items.length)} เครื่อง`;
  summaryRows.innerHTML = items
    .map(
      (schedule) => `
        <tr>
          <td><button class="link-button" type="button" data-machine="${escapeHtml(schedule.name)}">${escapeHtml(schedule.name)}</button></td>
          <td class="numeric">${numberFormat.format(schedule.orders.length)}</td>
          <td class="numeric">${numberFormat.format(schedule.totalRemain)}</td>
          <td class="numeric">${formatMachineDays(schedule.totalDays)}</td>
          <td class="numeric">${numberFormat.format(Math.round(schedule.capacityPerDay))}</td>
          <td>${formatDate(schedule.finishDate)}</td>
          <td><span class="pill ${statusClass(schedule.status)}">${statusText(schedule.status)}</span></td>
        </tr>
      `
    )
    .join("");
}

function render() {
  const items = sortSchedules(filteredSchedules());
  const schedule = selectedSchedule();
  renderMetrics();
  renderMachineMenu(items);
  renderSelectedTimeline(schedule);
  renderMachineDetail(schedule);
  renderSummaryRows(items);
}

function refreshPlanner(message, shouldSave = true) {
  schedules = buildSchedules();
  if (shouldSave) savePlan(message);
  render();
}

function setActiveMachine(machine) {
  activeMachine = machine;
  orderSearchInput.value = "";
  const storage = getStorage();
  if (storage) storage.setItem(activeMachineKey, machine);
  render();
}

function findOrderIndex(orderId) {
  return plannerOrders.findIndex((order) => order.id === orderId);
}

function moveOrderToMachine(orderId, targetMachine) {
  const orderIndex = findOrderIndex(orderId);
  if (orderIndex === -1 || !targetMachine) return;
  if (plannerOrders[orderIndex].machine === targetMachine) {
    setActiveMachine(targetMachine);
    return;
  }

  const [order] = plannerOrders.splice(orderIndex, 1);
  order.machine = targetMachine;
  const insertIndex = plannerOrders.reduce(
    (lastIndex, currentOrder, index) => (currentOrder.machine === targetMachine ? index : lastIndex),
    -1
  );
  plannerOrders.splice(insertIndex + 1, 0, order);
  activeMachine = targetMachine;
  refreshPlanner(`ย้ายออเดอร์ไป ${targetMachine} แล้ว`);
}

function reorderOrder(orderId, direction) {
  const orderIndex = findOrderIndex(orderId);
  if (orderIndex === -1) return;

  const machine = plannerOrders[orderIndex].machine;
  const machineOrderIndexes = plannerOrders
    .map((order, index) => (order.machine === machine ? index : -1))
    .filter((index) => index >= 0);
  const position = machineOrderIndexes.indexOf(orderIndex);
  const targetPosition = direction === "up" ? position - 1 : position + 1;
  if (targetPosition < 0 || targetPosition >= machineOrderIndexes.length) return;

  const targetIndex = machineOrderIndexes[targetPosition];
  [plannerOrders[orderIndex], plannerOrders[targetIndex]] = [plannerOrders[targetIndex], plannerOrders[orderIndex]];
  refreshPlanner("เรียงลำดับออเดอร์แล้ว");
}

function addPlannerOrder(event) {
  event.preventDefault();
  const qty = parseNumber(document.querySelector("#newOrderQty").value);
  const machine = newOrderMachine.value;
  if (!qty || !machine) return;

  const order = {
    id: `new-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    machine,
    openDate:
      document.querySelector("#newOrderDate").value ||
      dateToIso(planStart),
    orderNo: document.querySelector("#newOrderNo").value.trim(),
    partName: document.querySelector("#newOrderPart").value.trim(),
    partNo: document.querySelector("#newOrderPartNo").value.trim(),
    rmNo: "",
    priorityNo: nextPriorityNoForMachine(machine),
    qty,
    unit: "pcs",
    dueDate: "",
    plannedStart: newOrderStartDate?.value || "",
    plannedFinish: newOrderFinishDate?.value || "",
    targetFinish: newOrderFinishDate?.value || "",
    targetFinishTime: "",
    produced: 0,
    remaining: qty,
    productionStatus: "Added",
    progress: "",
    sourceIndex: plannerOrders.length + 1,
    created: true
  };

  plannerOrders.push(order);
  activeMachine = machine;
  orderDialog.close();
  addOrderForm.reset();
  refreshPlanner("เพิ่มออเดอร์เข้าแผนแล้ว");
}

renderCalendarHeader();
render();
refreshLiveSheet();

globalSearch.addEventListener("input", render);
statusFilter.addEventListener("change", render);
orderSearchInput.addEventListener("input", render);

resetFilterButton.addEventListener("click", () => {
  globalSearch.value = "";
  statusFilter.value = "all";
  render();
});

capacityInput.addEventListener("change", () => {
  const value = parseNumber(capacityInput.value);
  if (value > 0) {
    capacityOverrides[activeMachine] = value * (85 / capacityPercent);
    refreshPlanner("ปรับกำลังผลิตต่อวันแล้ว");
  }
});

capacityPercentInput.addEventListener("change", () => {
  const value = parseNumber(capacityPercentInput.value);
  if (value > 0) {
    capacityPercent = value;
    refreshPlanner(`ปรับ KPI กำลังผลิตเป็น ${numberFormat.format(value)}% แล้ว`);
  }
});

addOrderButton.addEventListener("click", () => {
  populateNewOrderMachine(activeMachine);
  document.querySelector("#newOrderDate").value = dateToIso(planStart);
  if (newOrderStartDate) newOrderStartDate.value = dateToIso(planStart);
  if (newOrderFinishDate) newOrderFinishDate.value = "";
  orderDialog.showModal();
});

savePlanButton.addEventListener("click", () => savePlan("บันทึกแผนแล้ว"));
resetPlanButton.addEventListener("click", () => {
  if (!window.confirm("ต้องการรีเซ็ตกลับไปใช้ข้อมูลจากชีตใหม่หรือไม่?")) return;
  clearPlan();
  plannerOrders = sourceOrders.map(cloneOrder);
  capacityOverrides = {};
  capacityPercent = 85;
  capacityPercentInput.value = String(capacityPercent);
  schedules = buildSchedules();
  activeMachine = pickInitialMachine();
  savePlan("รีเซ็ตแผนแล้ว");
  render();
});

cancelOrderButton.addEventListener("click", () => orderDialog.close());
dismissOrderButton.addEventListener("click", () => orderDialog.close());
addOrderForm.addEventListener("submit", addPlannerOrder);

document.addEventListener("dragstart", (event) => {
  const block = event.target.closest("[data-order-id]");
  if (!block) return;
  event.dataTransfer.setData("text/plain", block.dataset.orderId);
  event.dataTransfer.effectAllowed = "move";
  block.classList.add("dragging");
});

document.addEventListener("dragend", (event) => {
  event.target.closest("[data-order-id]")?.classList.remove("dragging");
  document.querySelectorAll(".drag-over").forEach((element) => element.classList.remove("drag-over"));
});

document.addEventListener("dragover", (event) => {
  const target = event.target.closest("[data-drop-machine]");
  if (!target) return;
  event.preventDefault();
  target.classList.add("drag-over");
});

document.addEventListener("dragleave", (event) => {
  const target = event.target.closest("[data-drop-machine]");
  if (!target || target.contains(event.relatedTarget)) return;
  target.classList.remove("drag-over");
});

document.addEventListener("drop", (event) => {
  const target = event.target.closest("[data-drop-machine]");
  if (!target) return;
  event.preventDefault();
  document.querySelectorAll(".drag-over").forEach((element) => element.classList.remove("drag-over"));
  const orderId = event.dataTransfer.getData("text/plain");
  moveOrderToMachine(orderId, target.dataset.dropMachine);
});

document.addEventListener("change", (event) => {
  const selector = event.target.closest("[data-order-machine]");
  if (!selector) return;
  moveOrderToMachine(selector.dataset.orderMachine, selector.value);
});

document.addEventListener("click", (event) => {
  const reorderButton = event.target.closest("[data-reorder-order]");
  if (reorderButton) {
    reorderOrder(reorderButton.dataset.reorderOrder, reorderButton.dataset.direction);
    return;
  }

  const machineButton = event.target.closest("[data-machine]");
  if (machineButton) setActiveMachine(machineButton.dataset.machine);
});
