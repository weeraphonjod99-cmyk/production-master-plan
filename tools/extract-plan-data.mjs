import fs from "node:fs/promises";
import { FileBlob, SpreadsheetFile } from "@oai/artifact-tool";

const sourceWorkbook = "Planing Production.xlsx";
const outputFile = "plan-data.js";
const sourceUrl =
  "https://docs.google.com/spreadsheets/d/1gR-a77vkgVxDu0jdSZ9RPhnGLC5OabIRHSRGBN0hZ18/edit?gid=659565457#gid=659565457";

const sheetNames = [
  "#1 Arc ·Stack",
  "#2 Arc ·Stack",
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
];

const knownCapacity = {
  "7# GTX-300T": 11701,
  "8# GTX-500T": 2644,
  "9# OCP-110T": 1019,
  "10# OCP-260 T": 762,
  "11# 200T": 1277,
  "12# 200T": 2228,
  "Bending #1": 176,
  "Bending #2": 1320,
  Tapping: 620,
  "SW4 NMS": 4920,
  "SW6 NLC": 347,
  "SW7 LC 600": 1941,
  "SW8 Door LC": 1243
};

function parseNumber(value) {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  const normalized = String(value ?? "").replace(/[^\d.-]/g, "");
  const number = Number(normalized);
  return Number.isFinite(number) ? number : 0;
}

function serialDateToIso(value) {
  const utc = Date.UTC(1899, 11, 30) + value * 86400000;
  return new Date(utc).toISOString().slice(0, 10);
}

function normalizeDate(value) {
  if (!value) return "";
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  if (typeof value === "number" && value > 20000) return serialDateToIso(value);

  const text = String(value).trim();
  const iso = text.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (iso) {
    const [, year, month, day] = iso;
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  }

  const thai = text.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (thai) {
    const [, day, month, year] = thai;
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  }

  return text;
}

function compact(value) {
  return String(value ?? "").trim();
}

function inferCapacity(machine, totalQty, orderCount) {
  if (knownCapacity[machine]) return knownCapacity[machine];
  if (/Bending/i.test(machine)) return 250;
  if (/Tapping|Riveting|RV/i.test(machine)) return 650;
  if (/CNC/i.test(machine)) return 900;
  if (/SW|Spot|NMS|NLC|LC/i.test(machine)) return 1400;
  if (/Arc|Chute|Stack|Cut Chamber|GV2/i.test(machine)) return 850;
  if (/OCP|MHS|SN1|STD|GTX|80T|110T|150T|200T|260/i.test(machine)) return 1200;
  if (!orderCount) return 1000;
  return Math.max(250, Math.ceil(totalQty / Math.max(6, Math.min(20, orderCount * 2))));
}

function isOrderRow(row) {
  const orderNo = compact(row[2]);
  const partName = compact(row[3]);
  const qty = parseNumber(row[6]);
  return Boolean(orderNo && partName && qty > 0);
}

const input = await FileBlob.load(sourceWorkbook);
const workbook = await SpreadsheetFile.importXlsx(input);
const orders = [];
const machines = [];

for (const machine of sheetNames) {
  const sheet = workbook.worksheets.getItem(machine);
  const values = sheet.getRange("A1:S120").values;
  const machineOrders = [];

  for (let rowIndex = 2; rowIndex < values.length; rowIndex += 1) {
    const row = values[rowIndex] ?? [];
    if (!isOrderRow(row)) continue;

    const qty = parseNumber(row[6]);
    const produced = parseNumber(row[12]);
    const explicitRemain = parseNumber(row[14]);
    const remaining = explicitRemain > 0 ? explicitRemain : Math.max(0, qty - produced) || qty;

    machineOrders.push({
      id: `base-${orders.length}`,
      machine,
      openDate: normalizeDate(row[1]),
      orderNo: compact(row[2]),
      partName: compact(row[3]),
      partNo: compact(row[4]),
      rmNo: compact(row[5]),
      qty,
      unit: compact(row[7]) || "pcs",
      dueDate: normalizeDate(row[8]),
      shift: compact(row[9]),
      plannedStart: normalizeDate(row[10]),
      plannedFinish: normalizeDate(row[11]),
      produced,
      readyForPainting: parseNumber(row[13]),
      remaining,
      ngRework: parseNumber(row[15]),
      productionStatus: compact(row[16]),
      progress: compact(row[17]),
      stock: compact(row[18]),
      sourceIndex: orders.length
    });
  }

  const totalQty = machineOrders.reduce((sum, order) => sum + order.remaining, 0);
  machines.push({
    name: machine,
    defaultCapacity: inferCapacity(machine, totalQty, machineOrders.length),
    sheetOrder: machines.length
  });
  orders.push(...machineOrders);
}

const data = {
  sourceUrl,
  generatedAt: new Date().toISOString(),
  planYear: 2026,
  planMonth: 7,
  machines,
  orders
};

await fs.writeFile(
  outputFile,
  `window.PRODUCTION_PLAN_DATA = ${JSON.stringify(data, null, 2)};\n`,
  "utf8"
);

console.log(
  JSON.stringify(
    {
      machines: machines.length,
      machinesWithOrders: machines.filter((machine) =>
        orders.some((order) => order.machine === machine.name)
      ).length,
      orders: orders.length,
      outputFile
    },
    null,
    2
  )
);
