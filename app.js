const sheetUrl = "https://docs.google.com/spreadsheets/d/1iedzv4R7oyw1x7mjAAsAGlVHan7eFBAOVfgaoIWYWkU/edit#gid=424242002";

const planStart = new Date(2026, 6, 1);
const planDays = 31;
const storageKey = "production-master-plan-orders-v2";

const machineSummary = [
  { machine: "10# OCP-260 T", orders: 30, remain: 18282, forecastDays: 24 },
  { machine: "11# 200T", orders: 20, remain: 60000, forecastDays: 47 },
  { machine: "12# 200T", orders: 24, remain: 20056, forecastDays: 9 },
  { machine: "7# GTX-300T", orders: 3, remain: 11701, forecastDays: 1 },
  { machine: "8# GTX-500T", orders: 1, remain: 5288, forecastDays: 2 },
  { machine: "9# OCP-110T", orders: 6, remain: 8155, forecastDays: 8 },
  { machine: "Bending #1", orders: 14, remain: 2293, forecastDays: 13 },
  { machine: "Bending #2", orders: 7, remain: 7920, forecastDays: 6 },
  { machine: "SW4 NMS", orders: 6, remain: 9839, forecastDays: 2 },
  { machine: "SW6 NLC", orders: 5, remain: 2080, forecastDays: 6 },
  { machine: "SW7 LC 600", orders: 7, remain: 5824, forecastDays: 3 },
  { machine: "SW8 Door LC", orders: 1, remain: 1243, forecastDays: 1 },
  { machine: "Tapping", orders: 9, remain: 6824, forecastDays: 11 }
];

const orderText = `
7# GTX-300T|29/06/2026|TH-SCDD2026060768|Metal Box 4-6WAY|BRU30887|4000
7# GTX-300T|10/06/2026|WIP|Metal Box 4-6WAY|BRU30888|2101
7# GTX-300T|10/06/2026|WIP|Resi Cover Bracket|NVE96548|5600
8# GTX-500T|10/06/2026|TH-SCDD2026050476|Gland plate|BRU53717|5288
9# OCP-110T|10/06/2026|TH-SCDD2026030207|Cover LUG100 450mm 18w|BRU53725|163
9# OCP-110T|10/06/2026|TH-SCDD2026030206|Cover LUG100 450mm 12w|BRU53724|145
9# OCP-110T|13/05/2026|TH-SCDD2026050288|LC600 COVER|75170154|2000
9# OCP-110T|10/05/2026|TH-SCDD2026050317|GLAND PLATE|75170148|5447
9# OCP-110T|26/06/2026|TH-SCDD2026030680|Cover LUG100 450mm 18w|BRU53725|250
9# OCP-110T|26/06/2026|TH-SCDD2026030679|Cover LUG100 450mm 12w|BRU53724|150
10# OCP-260 T|29/06/2026|TH-SCDD2026060761|Cover EZ250 750mm 30w|BRU53734|120
10# OCP-260 T|29/06/2026|TH-SCDD2026060760|Cover EZ250 750mm 24w|BRU53732|98
10# OCP-260 T|29/06/2026|TH-SCDD2026060758|Cover EZ100 750mm 36w|BRU53722|200
10# OCP-260 T|29/06/2026|TH-SCDD2026060766|Metal Cover 4WAY|BRU30890|2000
10# OCP-260 T|29/06/2026|TH-SCDD2026060767|Metal Box 6WAY|BRU30891|1000
10# OCP-260 T|10/06/2026|WIP|BOX 2+6, 6 WAY|NVE96520|3132
10# OCP-260 T|10/06/2026|WIP|BOX 2+10, 10 WAY|NVE96528|2691
10# OCP-260 T|10/06/2026|WIP|Door 900mm|BRU53749|89
10# OCP-260 T|10/06/2026|WIP|Cover EZ100 600mm 24w|BRU53720|93
10# OCP-260 T|10/06/2026|WIP|Cover EZ250 600mm 12w|BRU53730|7
10# OCP-260 T|10/06/2026|WIP|Cover EZ250 600mm 18w|BRU53731|12
10# OCP-260 T|10/06/2026|WIP|U BOX 600mm|BRU53715|1207
10# OCP-260 T|10/06/2026|WIP|U BOX 900mm|BRU53771|175
10# OCP-260 T|10/06/2026|WIP|BOX 2+18, 18 WAY|NVE96543|88
10# OCP-260 T|10/03/2026|TH-SCDD2026030207|Cover LUG100 450mm 18w|BRU53725|163
10# OCP-260 T|10/03/2026|TH-SCDD2026030206|Cover LUG100 450mm 12w|BRU53724|145
10# OCP-260 T|05/05/2026|TH-SCDD2026050069|LC600 BOX|75170145|3600
10# OCP-260 T|11/06/2026|TH-SCDD2026060223|Extension BOX|NAT18070|5
10# OCP-260 T|09/06/2026|TH-SCDD2026060150|METAL BOX 8/10 WAY|NMS/BRU30888|1000
10# OCP-260 T|10/06/2026|TH-SCDD2026060193|Extension BOX|NAT18070|5
10# OCP-260 T|13/06/2026|TH-SCDD2026060292|Cover EZ250 600mm 12w|BRU53730|37
10# OCP-260 T|13/06/2026|TH-SCDD2026060293|Cover EZ250 600mm 18w|BRU53731|40
10# OCP-260 T|13/06/2026|TH-SCDD2026060295|Cover EZ250 750mm 24w|BRU53732|68
10# OCP-260 T|19/06/2026|TH-SCDD2026060493|Cover EZ250 750mm 30w|BRU53734|67
10# OCP-260 T|24/06/2026|TH-SCDD2026060613|BOX 2+10, 10 WAY|NVE96528|600
10# OCP-260 T|25/06/2026|TH-SCDD2026060638|Door 450mm|BRU53743|740
10# OCP-260 T|26/06/2026|TH-SCDD2026030680|Cover LUG100 450mm 18w|BRU53725|250
10# OCP-260 T|26/06/2026|TH-SCDD2026030679|Cover LUG100 450mm 12w|BRU53724|150
10# OCP-260 T|26/06/2026|TH-SCDD2026060683|Cover EZ250 600mm 12w|BRU53730|100
10# OCP-260 T|29/06/2026|TH-SCDD2026060743|U BOX 900mm|BRU53771|400
11# 200T|29/06/2026|TH-SCDD2026060747|Cover EZ100 600mm 24w|BRU53720|1500
11# 200T|29/06/2026|TH-SCDD2026060759|Cover LUG100 750mm 42w|BRU53729|23
11# 200T|29/06/2026|TH-SCDD2026060754|Cover EZ100 600mm 24w|BRU53720|194
11# 200T|10/06/2026|WIP|Metal Box 4-6WAY|NMS/BRU30887|4726
11# 200T|10/06/2026|WIP|Cover LUG250 900mm 48w|BRU53746|100
11# 200T|10/06/2026|WIP|Cover EZ250 900mm 36w|BRU53735|127
11# 200T|10/06/2026|WIP|METAL BOX 14WAY|NMS/BRU30889|70
11# 200T|10/06/2026|WIP|Door 600mm|BRU53744|1410
11# 200T|10/06/2026|WIP|Cover EZ100 600mm 18w|BRU53719|596
11# 200T|10/06/2026|WIP|Cover EZ100 600mm 24w|BRU53720|337
11# 200T|10/06/2026|WIP|Cover EZ100 600mm 30w|BRU53721|360
11# 200T|10/06/2026|TH-SCDD2026050476|Gland plate|BRU53717|5288
11# 200T|20/05/2026|TH-SCDD2026050632|Metal Box 4-6WAY|NMS/BRU30887|443
11# 200T|13/06/2026|TH-SCDD2026060292|Cover LUG100 750mm 42w|BRU53729|39
11# 200T|13/06/2026|TH-SCDD2026060298|Cover EZ100 450mm 12w|BRU53718|200
11# 200T|15/06/2026|TH-SCDD2026060323|METAL COVER 4WAY|NMS/BRU30890|35000
11# 200T|15/06/2026|TH-SCDD2026060333|Gland plate|BRU53717|5387
11# 200T|15/06/2026|TH-SCDD202606060334|Metal Box 4-6WAY|NMS/BRU30887|3000
11# 200T|26/06/2026|TH-SCDD202606060681|Cover EZ100 600mm 18w|BRU53719|800
11# 200T|26/06/2026|TH-SCDD202606060682|Cover EZ100 600mm 30w|BRU53721|400
12# 200T|10/06/2026|WIP|Metal Box 8WAY|BRU30892|1000
12# 200T|29/06/2026|TH-SCDD2026060740|U BOX 600mm|BRU53715|800
12# 200T|29/06/2026|TH-SCDD2026060770|METAL BOX|DBF60-8-U|100
12# 200T|29/06/2026|TH-SCDD2026060769|METAL BOX|DBF45-8-U|300
12# 200T|10/06/2026|WIP|Resi Cover 4-Way|QGH11468|1190
12# 200T|10/06/2026|WIP|Resi Cover 14-Way|NVE96533|99
12# 200T|10/06/2026|WIP|Resi Cover 4+4-Way|QGH13944|50
12# 200T|10/06/2026|WIP|Resi Cover 18Way|NVE96542|120
12# 200T|10/06/2026|WIP|Resi Box Bracket|NVE96549|6124
12# 200T|10/06/2026|WIP|Resi Cover 6-Way|NVE96519|836
12# 200T|10/06/2026|WIP|Resi Cover 10-Way|NVE96526|577
12# 200T|10/06/2026|WIP|U BOX 450mm|BRU53714|85
12# 200T|10/06/2026|WIP|U BOX 750mm|BRU53716|13
12# 200T|10/06/2026|WIP|Door 450mm|BRU53743|683
12# 200T|13/05/2026|TH-SCDD2026050301|METAL COVER 6WAY|NMS/BRU30891|2032
12# 200T|18/05/2026|TH-SCDD2026050507|LC600 FLAT DOOR|7517016200|1243
12# 200T|13/05/2026|TH-SCDD2026060288|LC600 COVER|75170154|2000
12# 200T|13/06/2026|TH-SCDD2026060280|METAL BOX|DBF45-8-U|200
12# 200T|13/06/2026|TH-SCDD2026060289|Cover LUG100 600mm 30w|BRU53727|100
12# 200T|25/06/2026|TH-SCDD2026060321|Door 450mm|BRU53743|376
12# 200T|15/06/2026|TH-SCDD2026060320|U BOX 450mm|BRU53714|400
12# 200T|25/06/2026|TH-SCDD2026060039|Door 600mm|BRU53744|564
12# 200T|25/06/2026|TH-SCDD2026060360|U BOX 450mm|BRU53714|564
12# 200T|25/06/2026|TH-SCDD2026060637|U BOX 600mm|BRU53715|600
Bending #1|29/06/2026|TH-SCDD2026060765|Cover EZ250 900 mm 48w|BRU53737|137
Bending #1|29/06/2026|TH-SCDD2026060763|Cover EZ250 900 mm 42w|BRU53736|109
Bending #1|29/06/2026|TH-SCDD2026060755|Cover EZ250 600mm 18w|BRU53731|168
Bending #1|29/06/2026|TH-SCDD2026060756|Cover EZ100 750mm 36w|BRU53722|200
Bending #1|13/06/2026|TH-SCDD2026060289|Cover LUG100 600mm 30w|BRU53727|100
Bending #1|13/06/2026|TH-SCDD2026060292|Cover LUG100 750mm 42w|BRU53729|39
Bending #1|13/06/2026|TH-SCDD2026060292|Cover EZ250 600mm 12w|BRU53730|37
Bending #1|13/06/2026|TH-SCDD2026060293|Cover EZ250 600mm 18w|BRU53731|40
Bending #1|13/06/2026|TH-SCDD2026060298|Cover EZ100 450mm 12w|BRU53718|200
Bending #1|13/06/2026|TH-SCDD2026060295|Cover EZ250 750mm 24w|BRU53732|68
Bending #1|26/06/2026|TH-SCDD202606060681|Cover EZ100 600mm 18w|BRU53719|800
Bending #1|10/06/2026|TH-SCDD2026030206|Cover LUG100 450mm 12w|BRU53724|145
Bending #1|26/06/2026|TH-SCDD2026030679|Cover LUG100 450mm 12w|BRU53724|150
Bending #1|26/06/2026|TH-SCDD2026060683|Cover EZ250 600mm 12w|BRU53730|100
Bending #2|05/05/2026|TH-SCDD2026050069|LC600 BOX|7517014500|3600
Bending #2|18/05/2026|TH-SCDD2026050507|LC600 FLAT DOOR|7517016200|1243
Bending #2|13/05/2026|TH-SCDD2026060288|LC600 COVER|75170154|2000
Bending #2|19/06/2026|TH-SCDD2026060493|Cover EZ250 750mm 30w|BRU53734|67
Bending #2|26/06/2026|TH-SCDD2026030680|Cover LUG100 450mm 18w|BRU53725|250
Bending #2|10/06/2026|WIP|Cover EZ100 600mm 30w|BRU53721|360
Bending #2|26/06/2026|TH-SCDD202606060682|Cover EZ100 600mm 30w|BRU53721|400
Tapping|29/06/2026|TH-SCDD2026060761|U BOX 900mm|BRU53771|400
Tapping|29/06/2026|TH-SCDD2026060741|U BOX 750mm|BRU53716|600
Tapping|05/05/2026|TH-SCDD2026050069|LC600 BOX|7517014500|3600
Tapping|10/06/2026|WIP|U BOX 450mm|BRU53714|85
Tapping|15/06/2026|TH-SCDD2026060320|U BOX 450mm|BRU53714|400
Tapping|25/06/2026|TH-SCDD2026060360|U BOX 450mm|BRU53714|564
Tapping|25/06/2026|TH-SCDD2026060637|U BOX 600mm|BRU53715|600
Tapping|10/06/2026|WIP|U BOX 900mm|BRU53771|175
Tapping|29/06/2026|TH-SCDD2026060743|U BOX 900mm|BRU53771|400
SW4 NMS|10/06/2026|WIP|Metal Box 4-6WAY|NMS/BRU30887|4726
SW4 NMS|10/06/2026|WIP|METAL BOX 14WAY|NMS/BRU30889|70
SW4 NMS|20/05/2026|TH-SCDD2026050632|Metal Box 4-6WAY|NMS/BRU30887|443
SW4 NMS|09/06/2026|TH-SCDD2026060150|METAL BOX 8/10 WAY|NMS/BRU30888|1000
SW4 NMS|15/06/2026|TH-SCDD202606060334|Metal Box 4-6WAY|NMS/BRU30887|3000
SW4 NMS|24/06/2026|TH-SCDD2026060613|BOX 2+10, 10 WAY|NVE96528|600
SW6 NLC|29/06/2026|TH-SCDD2026060738|Door 900mm|BRU53749|200
SW6 NLC|29/06/2026|TH-SCDD2026060743|Door 750mm|BRU53747|200
SW6 NLC|25/06/2026|TH-SCDD2026060321|Door 450mm|BRU53743|376
SW6 NLC|25/06/2026|TH-SCDD20260600390|Door 600mm|BRU53744|564
SW6 NLC|25/06/2026|TH-SCDD2026060638|Door 450mm|BRU53743|740
SW7 LC 600|05/05/2026|TH-SCDD2026050069|LC600 BOX|7517014500|3600
SW7 LC 600|10/06/2026|WIP|U BOX 450mm|BRU53714|85
SW7 LC 600|15/06/2026|TH-SCDD2026060320|U BOX 450mm|BRU53714|400
SW7 LC 600|25/06/2026|TH-SCDD2026060360|U BOX 450mm|BRU53714|564
SW7 LC 600|25/06/2026|TH-SCDD2026060637|U BOX 600mm|BRU53715|600
SW7 LC 600|10/06/2026|WIP|U BOX 900mm|BRU53771|175
SW7 LC 600|29/06/2026|TH-SCDD2026060743|U BOX 900mm|BRU53771|400
SW8 Door LC|18/05/2026|TH-SCDD2026050507|LC600 FLAT DOOR|7517016200|1243
`;

const summaryRows = document.querySelector("#summaryRows");
const orderRows = document.querySelector("#orderRows");
const laneTrack = document.querySelector("#laneTrack");
const searchInput = document.querySelector("#searchInput");
const statusFilter = document.querySelector("#statusFilter");
const machineFilter = document.querySelector("#machineFilter");
const resetButton = document.querySelector("#resetButton");
const calendarHeader = document.querySelector("#calendarHeader");
const scheduleBoard = document.querySelector("#scheduleBoard");
const detailTitle = document.querySelector("#detailTitle");
const machineInsights = document.querySelector("#machineInsights");
const orderCards = document.querySelector("#orderCards");
const orderSearchInput = document.querySelector("#orderSearchInput");
const orderSearchCount = document.querySelector("#orderSearchCount");
const addOrderButton = document.querySelector("#addOrderButton");
const savePlanButton = document.querySelector("#savePlanButton");
const resetPlanButton = document.querySelector("#resetPlanButton");
const saveStatus = document.querySelector("#saveStatus");
const orderDialog = document.querySelector("#orderDialog");
const addOrderForm = document.querySelector("#addOrderForm");
const newOrderMachine = document.querySelector("#newOrderMachine");
const cancelOrderButton = document.querySelector("#cancelOrderButton");
const dismissOrderButton = document.querySelector("#dismissOrderButton");

const numberFormat = new Intl.NumberFormat("th-TH");
const dayFormat = new Intl.NumberFormat("th-TH", { maximumFractionDigits: 1 });
const percentFormat = new Intl.NumberFormat("th-TH", { style: "percent", maximumFractionDigits: 0 });
const palette = ["#3b6ea8", "#197a56", "#9b6a00", "#8f4f9f", "#c44b2f", "#2f7f8f", "#5f6b2e", "#7562a9"];

const sourceOrders = orderText
  .trim()
  .split("\n")
  .map((line, index) => {
    const [machine, openDate, orderNo, partName, partNo, qty] = line.split("|");
    return {
      id: `base-${index}`,
      machine,
      openDate,
      orderNo,
      partName,
      partNo,
      qty: parseNumber(qty),
      remaining: parseNumber(qty),
      sourceIndex: index
    };
  });

let plannerOrders = loadPlannerOrders();
let schedules = buildSchedules();
let activeMachine = "11# 200T";

function parseNumber(value) {
  const number = Number(String(value ?? "").replace(/[^\d.-]/g, ""));
  return Number.isFinite(number) ? number : 0;
}

function cloneOrder(order) {
  return {
    id: order.id,
    machine: order.machine,
    openDate: order.openDate,
    orderNo: order.orderNo,
    partName: order.partName,
    partNo: order.partNo,
    qty: Number(order.qty) || 0,
    remaining: Number(order.remaining ?? order.qty) || 0,
    sourceIndex: Number(order.sourceIndex) || 0,
    created: Boolean(order.created)
  };
}

function getStorage() {
  try {
    return typeof window !== "undefined" ? window.localStorage : null;
  } catch {
    return null;
  }
}

function loadPlannerOrders() {
  const storage = getStorage();
  if (!storage) return sourceOrders.map(cloneOrder);

  try {
    const stored = JSON.parse(storage.getItem(storageKey) || "null");
    if (!Array.isArray(stored) || !stored.length) return sourceOrders.map(cloneOrder);
    return stored
      .filter((order) => order && order.id && order.machine && order.orderNo)
      .map((order, index) => ({
        ...cloneOrder(order),
        sourceIndex: Number.isFinite(Number(order.sourceIndex)) ? Number(order.sourceIndex) : index
      }));
  } catch {
    return sourceOrders.map(cloneOrder);
  }
}

function setSaveStatus(message) {
  if (!saveStatus) return;
  saveStatus.textContent = message;
}

function savePlannerOrders(message = "บันทึกแผนแล้ว") {
  const storage = getStorage();
  if (storage) storage.setItem(storageKey, JSON.stringify(plannerOrders));
  setSaveStatus(message);
}

function clearPlannerOrders() {
  const storage = getStorage();
  if (storage) storage.removeItem(storageKey);
}

function addDays(date, days) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function formatDate(date) {
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${day}/${month}/${date.getFullYear()}`;
}

function formatDateShort(date) {
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${day}/${month}`;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function statusClass(status) {
  if (status === "Over capacity") return "over";
  if (status === "Tight") return "tight";
  return "ok";
}

function statusText(status) {
  if (status === "Over capacity") return "เกินกำลัง";
  if (status === "Tight") return "แน่น";
  return "OK";
}

function formatMachineDays(value) {
  if (value >= 10 || Number.isInteger(value)) return dayFormat.format(Math.round(value));
  return dayFormat.format(Math.max(0.1, value));
}

function orderLabel(order) {
  return order.orderNo === "WIP" ? `${order.partName} (${order.partNo})` : order.orderNo;
}

function orderTooltip(order) {
  return [
    `Order: ${order.orderNo}`,
    `Part: ${order.partName}`,
    `Part No.: ${order.partNo}`,
    `Qty: ${numberFormat.format(order.remaining)} pcs`,
    `Days: ${formatMachineDays(order.machineDays)}`
  ].join("\n");
}

function buildSchedules(planOrders = plannerOrders) {
  const ordersByMachine = new Map();
  for (const order of planOrders) {
    if (!ordersByMachine.has(order.machine)) ordersByMachine.set(order.machine, []);
    ordersByMachine.get(order.machine).push(order);
  }

  return machineSummary.map((summary, machineIndex) => {
    const machineOrders = ordersByMachine.get(summary.machine) ?? [];
    const totalRemain = machineOrders.reduce((sum, order) => sum + order.remaining, 0);
    const capacityPerDay = summary.forecastDays ? summary.remain / summary.forecastDays : totalRemain || 1;
    let cursor = 0;

    const scheduledOrders = machineOrders.map((order, orderIndex) => {
      const machineDays = capacityPerDay ? order.remaining / capacityPerDay : 0;
      const startOffset = cursor;
      const finishOffset = cursor + machineDays;
      const startDay = Math.max(1, Math.floor(startOffset) + 1);
      const finishDay = Math.max(1, Math.ceil(finishOffset));
      cursor = finishOffset;

      return {
        ...order,
        sequence: orderIndex + 1,
        machineDays,
        startDay,
        finishDay,
        startDate: addDays(planStart, startDay - 1),
        finishDate: addDays(planStart, finishDay - 1),
        overMonth: finishDay > planDays,
        color: palette[(machineIndex + orderIndex) % palette.length]
      };
    });

    const totalDays = cursor;
    const utilization = totalDays / planDays;
    const overDays = Math.max(0, Math.ceil(totalDays - planDays));
    const idleDays = Math.max(0, Math.floor(planDays - totalDays));
    const status = totalDays > planDays ? "Over capacity" : totalDays >= planDays * 0.85 ? "Tight" : "OK";

    return {
      ...summary,
      totalRemain,
      totalDays,
      capacityPerDay,
      utilization,
      overDays,
      idleDays,
      status,
      finishDate: totalDays ? addDays(planStart, Math.ceil(totalDays) - 1) : planStart,
      orders: scheduledOrders
    };
  });
}

function machineOptionList(selectedMachine = "") {
  return machineSummary
    .map((summary) => {
      const selected = summary.machine === selectedMachine ? " selected" : "";
      return `<option value="${escapeHtml(summary.machine)}"${selected}>${escapeHtml(summary.machine)}</option>`;
    })
    .join("");
}

function populateMachineFilter(selectedValue = machineFilter.value || "all") {
  machineFilter.innerHTML = [
    `<option value="all"${selectedValue === "all" ? " selected" : ""}>ทุกเครื่อง</option>`,
    machineOptionList(selectedValue)
  ].join("");
}

function populateNewOrderMachine(selectedMachine = activeMachine) {
  if (!newOrderMachine) return;
  newOrderMachine.innerHTML = machineOptionList(selectedMachine);
}

function matchesQuery(schedule, query) {
  if (!query) return true;
  const machineMatch = `${schedule.machine} ${schedule.status}`.toLowerCase().includes(query);
  const orderMatch = schedule.orders.some((order) =>
    `${order.orderNo} ${order.partName} ${order.partNo}`.toLowerCase().includes(query)
  );
  return machineMatch || orderMatch;
}

function filteredSchedules() {
  const query = searchInput.value.trim().toLowerCase();
  const selectedStatus = statusFilter.value;
  const selectedMachine = machineFilter.value;

  return schedules.filter((schedule) => {
    const statusMatch = selectedStatus === "all" || schedule.status === selectedStatus;
    const machineMatch = selectedMachine === "all" || schedule.machine === selectedMachine;
    return statusMatch && machineMatch && matchesQuery(schedule, query);
  });
}

function renderMetrics(items) {
  const totals = items.reduce(
    (acc, item) => {
      acc.orders += item.orders.length;
      acc.remaining += item.totalRemain;
      if (item.status === "Over capacity") acc.over += 1;
      return acc;
    },
    { orders: 0, remaining: 0, over: 0 }
  );

  document.querySelector("#machineCount").textContent = numberFormat.format(items.length);
  document.querySelector("#orderCount").textContent = numberFormat.format(totals.orders);
  document.querySelector("#remainingQty").textContent = numberFormat.format(totals.remaining);
  document.querySelector("#overCapacity").textContent = numberFormat.format(totals.over);
  document.querySelector("#monthDaysLabel").textContent = `${planDays} วัน`;
}

function renderCalendarHeader() {
  calendarHeader.innerHTML = [
    '<span class="calendar-spacer">Machine</span>',
    ...Array.from({ length: planDays }, (_, index) => `<span>${index + 1}</span>`)
  ].join("");
}

function renderLanes(items) {
  const top = [...items].sort((a, b) => b.utilization - a.utilization).slice(0, 8);
  laneTrack.innerHTML = top
    .map((item) => {
      const fill = Math.min(100, Math.round(item.utilization * 100));
      return `
        <button class="lane" type="button" data-machine="${escapeHtml(item.machine)}" style="--fill:${fill}%; --lane-color:${laneColor(item)}">
          <span title="${escapeHtml(item.machine)}">${escapeHtml(item.machine)}</span>
          <strong>${percentFormat.format(item.utilization)}</strong>
        </button>
      `;
    })
    .join("");
}

function laneColor(machine) {
  if (machine.status === "Over capacity") return "#b42318";
  if (machine.status === "Tight") return "#9b6a00";
  return "#197a56";
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
    return { ...block, lane: lane + 1, laneCount: laneEnds.length };
  });
}

function renderScheduleBoard(items) {
  if (!items.length) {
    scheduleBoard.innerHTML = '<div class="empty-state">ไม่มีข้อมูลตามตัวกรอง</div>';
    return;
  }

  scheduleBoard.innerHTML = items
    .map((schedule) => {
      const visibleBlocks = schedule.orders
        .filter((order) => order.startDay <= planDays)
        .map((order) => ({
          ...order,
          start: Math.max(1, order.startDay),
          end: Math.min(planDays, Math.max(order.startDay, order.finishDay))
        }));
      const stacked = assignLanes(visibleBlocks);
      const laneCount = Math.max(1, ...stacked.map((block) => block.lane));
      const overNote = schedule.overDays ? `<span class="over-note">+${numberFormat.format(schedule.overDays)} วัน</span>` : "";

      return `
        <article class="schedule-row ${activeMachine === schedule.machine ? "active" : ""}">
          <button class="machine-label" type="button" data-machine="${escapeHtml(schedule.machine)}">
            <strong>${escapeHtml(schedule.machine)}</strong>
            <span>${schedule.orders.length} orders · ${formatMachineDays(schedule.totalDays)} วัน ${overNote}</span>
          </button>
          <div class="timeline-grid" data-drop-machine="${escapeHtml(schedule.machine)}" style="--lane-count:${laneCount}">
            ${stacked
              .map((order) => {
                const span = Math.max(1, order.end - order.start + 1);
                return `
                  <button
                    class="order-block ${order.overMonth ? "is-over" : ""}"
                    type="button"
                    draggable="true"
                    data-order-id="${escapeHtml(order.id)}"
                    data-machine="${escapeHtml(schedule.machine)}"
                    data-tooltip="${escapeHtml(orderTooltip(order))}"
                    style="grid-column:${order.start} / span ${span}; grid-row:${order.lane}; --order-color:${order.color}"
                  >
                    <span>${escapeHtml(orderLabel(order))}</span>
                  </button>
                `;
              })
              .join("")}
          </div>
        </article>
      `;
    })
    .join("");
}

function renderSummaryRows(items) {
  summaryRows.innerHTML = items
    .map(
      (item) => `
        <tr>
          <td><button class="link-button" type="button" data-machine="${escapeHtml(item.machine)}">${escapeHtml(item.machine)}</button></td>
          <td class="numeric">${numberFormat.format(item.orders.length)}</td>
          <td class="numeric">${numberFormat.format(item.totalRemain)}</td>
          <td class="numeric">${formatMachineDays(item.totalDays)}</td>
          <td class="numeric">${numberFormat.format(Math.round(item.capacityPerDay))}</td>
          <td>${formatDate(item.finishDate)}</td>
          <td><span class="pill ${statusClass(item.status)}">${statusText(item.status)}</span></td>
        </tr>
      `
    )
    .join("");
}

function selectedSchedule(items) {
  const forcedMachine = machineFilter.value !== "all" ? machineFilter.value : activeMachine;
  return schedules.find((schedule) => schedule.machine === forcedMachine) ?? items[0] ?? schedules[0];
}

function orderMatchesDetailSearch(order, query) {
  if (!query) return true;
  return `${order.orderNo} ${order.partName} ${order.partNo}`.toLowerCase().includes(query);
}

function renderMachineDetail(schedule) {
  activeMachine = schedule.machine;
  const orderQuery = orderSearchInput.value.trim().toLowerCase();
  const visibleOrders = schedule.orders.filter((order) => orderMatchesDetailSearch(order, orderQuery));
  detailTitle.textContent = schedule.machine;
  machineInsights.innerHTML = `
    <span>${numberFormat.format(schedule.orders.length)} orders</span>
    <span>${formatMachineDays(schedule.totalDays)} วันเครื่อง</span>
    <span>${numberFormat.format(Math.round(schedule.capacityPerDay))} pcs/วัน</span>
    <span>จบ ${formatDate(schedule.finishDate)}</span>
  `;
  orderSearchCount.textContent = orderQuery
    ? `${numberFormat.format(visibleOrders.length)} / ${numberFormat.format(schedule.orders.length)} orders`
    : `${numberFormat.format(schedule.orders.length)} orders`;

  orderCards.innerHTML = visibleOrders.slice(0, 4).map((order) => `
    <article class="order-card">
      <span>${escapeHtml(order.orderNo)}</span>
      <strong>${escapeHtml(order.partName)}</strong>
      <small>${numberFormat.format(order.remaining)} pcs · ${formatMachineDays(order.machineDays)} วัน · จบ ${formatDateShort(order.finishDate)}</small>
    </article>
  `).join("") || '<div class="empty-state order-empty">ไม่พบออเดอร์ที่ค้นหา</div>';

  orderRows.innerHTML = visibleOrders.map((order) => `
    <tr>
      <td>${numberFormat.format(order.sequence)}</td>
      <td>${escapeHtml(order.orderNo)}</td>
      <td>
        <strong>${escapeHtml(order.partName)}</strong>
        <span class="muted-line">${escapeHtml(order.partNo)}</span>
      </td>
      <td class="numeric">${numberFormat.format(order.remaining)}</td>
      <td class="numeric">${formatMachineDays(order.machineDays)}</td>
      <td>${formatDate(order.startDate)}</td>
      <td>${formatDate(order.finishDate)}</td>
      <td><span class="pill ${order.overMonth ? "over" : "ok"}">${order.overMonth ? "ล้นเดือน" : "ในเดือน"}</span></td>
      <td>
        <select class="inline-select" data-order-machine="${escapeHtml(order.id)}">
          ${machineOptionList(order.machine)}
        </select>
      </td>
      <td>
        <div class="order-actions">
          <button class="icon-button" type="button" data-reorder-order="${escapeHtml(order.id)}" data-direction="up" title="เลื่อนขึ้น">↑</button>
          <button class="icon-button" type="button" data-reorder-order="${escapeHtml(order.id)}" data-direction="down" title="เลื่อนลง">↓</button>
        </div>
      </td>
    </tr>
  `).join("") || `
    <tr>
      <td colspan="10" class="empty-cell">ไม่พบออเดอร์ที่ค้นหา</td>
    </tr>
  `;
}

function refreshPlanner(message) {
  const selectedValue = machineFilter.value;
  schedules = buildSchedules();
  populateMachineFilter(selectedValue);
  populateNewOrderMachine(activeMachine);
  render();
  if (message) setSaveStatus(message);
}

function findOrderIndex(orderId) {
  return plannerOrders.findIndex((order) => order.id === orderId);
}

function moveOrderToMachine(orderId, targetMachine) {
  if (!machineSummary.some((summary) => summary.machine === targetMachine)) return;
  const orderIndex = findOrderIndex(orderId);
  if (orderIndex < 0) return;

  const [order] = plannerOrders.splice(orderIndex, 1);
  order.machine = targetMachine;
  const lastTargetIndex = plannerOrders.reduce((lastIndex, currentOrder, index) => {
    return currentOrder.machine === targetMachine ? index : lastIndex;
  }, -1);

  plannerOrders.splice(lastTargetIndex + 1, 0, order);
  activeMachine = targetMachine;
  machineFilter.value = targetMachine;
  savePlannerOrders("ย้ายออเดอร์แล้ว");
  refreshPlanner();
}

function reorderOrder(orderId, direction) {
  const orderIndex = findOrderIndex(orderId);
  if (orderIndex < 0) return;
  const machine = plannerOrders[orderIndex].machine;
  const machineOrderIndexes = plannerOrders
    .map((order, index) => ({ order, index }))
    .filter((item) => item.order.machine === machine)
    .map((item) => item.index);
  const position = machineOrderIndexes.indexOf(orderIndex);
  const targetPosition = direction === "up" ? position - 1 : position + 1;
  if (targetPosition < 0 || targetPosition >= machineOrderIndexes.length) return;

  const targetIndex = machineOrderIndexes[targetPosition];
  [plannerOrders[orderIndex], plannerOrders[targetIndex]] = [plannerOrders[targetIndex], plannerOrders[orderIndex]];
  activeMachine = machine;
  savePlannerOrders("จัดลำดับออเดอร์แล้ว");
  refreshPlanner();
}

function addPlannerOrder(event) {
  event.preventDefault();
  const qty = parseNumber(document.querySelector("#newOrderQty").value);
  if (qty <= 0) {
    setSaveStatus("ใส่จำนวนผลิตมากกว่า 0");
    return;
  }

  const machine = newOrderMachine.value;
  const order = {
    id: `new-${Date.now()}`,
    machine,
    openDate: document.querySelector("#newOrderDate").value || formatDate(planStart),
    orderNo: document.querySelector("#newOrderNo").value.trim(),
    partName: document.querySelector("#newOrderPart").value.trim(),
    partNo: document.querySelector("#newOrderPartNo").value.trim() || "-",
    qty,
    remaining: qty,
    sourceIndex: plannerOrders.length,
    created: true
  };

  plannerOrders.push(order);
  activeMachine = machine;
  machineFilter.value = machine;
  savePlannerOrders("เพิ่มออเดอร์แล้ว");
  addOrderForm.reset();
  populateNewOrderMachine(machine);
  orderDialog.close();
  refreshPlanner();
}

function render() {
  const items = filteredSchedules();
  const detail = selectedSchedule(items);
  activeMachine = detail.machine;
  renderMetrics(items);
  renderLanes(items);
  renderScheduleBoard(items);
  renderSummaryRows(items);
  renderMachineDetail(detail);
}

function setActiveMachine(machine) {
  activeMachine = machine;
  if (machineFilter.value !== "all") machineFilter.value = machine;
  render();
  document.querySelector(".detail-panel")?.scrollIntoView({ behavior: "smooth", block: "start" });
}

populateMachineFilter();
populateNewOrderMachine();
renderCalendarHeader();
render();
setSaveStatus(getStorage()?.getItem(storageKey) ? "โหลดแผนที่แก้ไว้" : "พร้อมแก้แผน");

searchInput.addEventListener("input", render);
orderSearchInput.addEventListener("input", render);
statusFilter.addEventListener("change", render);
machineFilter.addEventListener("change", render);
resetButton.addEventListener("click", () => {
  searchInput.value = "";
  orderSearchInput.value = "";
  statusFilter.value = "all";
  machineFilter.value = "all";
  render();
});

addOrderButton.addEventListener("click", () => {
  populateNewOrderMachine(activeMachine);
  orderDialog.showModal();
});

cancelOrderButton.addEventListener("click", () => orderDialog.close());
dismissOrderButton.addEventListener("click", () => orderDialog.close());
addOrderForm.addEventListener("submit", addPlannerOrder);

savePlanButton.addEventListener("click", () => savePlannerOrders("บันทึกแผนแล้ว"));
resetPlanButton.addEventListener("click", () => {
  if (typeof window !== "undefined" && !window.confirm("รีเซ็ตกลับข้อมูลตั้งต้นทั้งหมด?")) return;
  plannerOrders = sourceOrders.map(cloneOrder);
  clearPlannerOrders();
  activeMachine = "11# 200T";
  machineFilter.value = "all";
  refreshPlanner("รีเซ็ตแผนแล้ว");
});

document.addEventListener("dragstart", (event) => {
  const block = event.target.closest("[data-order-id]");
  if (!block) return;
  event.dataTransfer.setData("text/plain", block.dataset.orderId);
  event.dataTransfer.effectAllowed = "move";
  block.classList.add("dragging");
});

document.addEventListener("dragend", (event) => {
  event.target.closest("[data-order-id]")?.classList.remove("dragging");
  document.querySelectorAll(".timeline-grid.drag-over").forEach((grid) => grid.classList.remove("drag-over"));
});

document.addEventListener("dragover", (event) => {
  const targetGrid = event.target.closest("[data-drop-machine]");
  if (!targetGrid) return;
  event.preventDefault();
  targetGrid.classList.add("drag-over");
});

document.addEventListener("dragleave", (event) => {
  const targetGrid = event.target.closest("[data-drop-machine]");
  if (!targetGrid || targetGrid.contains(event.relatedTarget)) return;
  targetGrid.classList.remove("drag-over");
});

document.addEventListener("drop", (event) => {
  const targetGrid = event.target.closest("[data-drop-machine]");
  if (!targetGrid) return;
  event.preventDefault();
  targetGrid.classList.remove("drag-over");
  const orderId = event.dataTransfer.getData("text/plain");
  moveOrderToMachine(orderId, targetGrid.dataset.dropMachine);
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

  const target = event.target.closest("[data-machine]");
  if (!target) return;
  setActiveMachine(target.dataset.machine);
});
