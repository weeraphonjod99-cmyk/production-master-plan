const sheetUrl = "https://docs.google.com/spreadsheets/d/1iedzv4R7oyw1x7mjAAsAGlVHan7eFBAOVfgaoIWYWkU/edit#gid=424242002";

const machines = [
  { machine: "10# OCP-260 T", orders: 30, orderQty: 18282, remain: 18282, forecastDays: 24, utilization: 0.77, status: "OK" },
  { machine: "11# 200T", orders: 20, orderQty: 60000, remain: 60000, forecastDays: 47, utilization: 1.52, status: "Over capacity" },
  { machine: "12# 200T", orders: 24, orderQty: 20056, remain: 20056, forecastDays: 9, utilization: 0.29, status: "OK" },
  { machine: "7# GTX-300T", orders: 3, orderQty: 11701, remain: 11701, forecastDays: 1, utilization: 0.03, status: "OK" },
  { machine: "8# GTX-500T", orders: 1, orderQty: 5288, remain: 5288, forecastDays: 2, utilization: 0.06, status: "OK" },
  { machine: "9# OCP-110T", orders: 6, orderQty: 8155, remain: 8155, forecastDays: 8, utilization: 0.26, status: "OK" },
  { machine: "Bending #1", orders: 14, orderQty: 2293, remain: 2293, forecastDays: 13, utilization: 0.42, status: "OK" },
  { machine: "Bending #2", orders: 7, orderQty: 7920, remain: 7920, forecastDays: 6, utilization: 0.19, status: "OK" },
  { machine: "SW4 NMS", orders: 6, orderQty: 9839, remain: 9839, forecastDays: 2, utilization: 0.06, status: "OK" },
  { machine: "SW6 NLC", orders: 5, orderQty: 2080, remain: 2080, forecastDays: 6, utilization: 0.19, status: "OK" },
  { machine: "SW7 LC 600", orders: 7, orderQty: 5824, remain: 5824, forecastDays: 3, utilization: 0.10, status: "OK" },
  { machine: "SW8 Door LC", orders: 1, orderQty: 1243, remain: 1243, forecastDays: 0, utilization: 0, status: "OK" },
  { machine: "Tapping", orders: 9, orderQty: 6824, remain: 6824, forecastDays: 11, utilization: 0.35, status: "OK" }
];

const summaryRows = document.querySelector("#summaryRows");
const laneTrack = document.querySelector("#laneTrack");
const searchInput = document.querySelector("#searchInput");
const statusFilter = document.querySelector("#statusFilter");
const resetButton = document.querySelector("#resetButton");

const numberFormat = new Intl.NumberFormat("th-TH");
const percentFormat = new Intl.NumberFormat("th-TH", { style: "percent", maximumFractionDigits: 0 });

function statusClass(status) {
  if (status === "Over capacity") return "over";
  if (status === "Tight") return "tight";
  return "ok";
}

function laneColor(machine) {
  if (machine.utilization >= 1) return "#b42318";
  if (machine.utilization >= 0.85) return "#9b6a00";
  return "#197a56";
}

function filteredMachines() {
  const query = searchInput.value.trim().toLowerCase();
  const selectedStatus = statusFilter.value;

  return machines.filter((item) => {
    const matchesSearch = !query || `${item.machine} ${item.status}`.toLowerCase().includes(query);
    const matchesStatus = selectedStatus === "all" || item.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });
}

function renderMetrics(items) {
  const totals = items.reduce(
    (acc, item) => {
      acc.orders += item.orders;
      acc.remaining += item.remain;
      if (item.status === "Over capacity") acc.over += 1;
      return acc;
    },
    { orders: 0, remaining: 0, over: 0 }
  );

  document.querySelector("#machineCount").textContent = numberFormat.format(items.length);
  document.querySelector("#orderCount").textContent = numberFormat.format(totals.orders);
  document.querySelector("#remainingQty").textContent = numberFormat.format(totals.remaining);
  document.querySelector("#overCapacity").textContent = numberFormat.format(totals.over);
}

function renderRows(items) {
  summaryRows.innerHTML = items
    .map(
      (item) => `
        <tr>
          <td><a href="${sheetUrl}" target="_blank" rel="noreferrer">${item.machine}</a></td>
          <td class="numeric">${numberFormat.format(item.orders)}</td>
          <td class="numeric">${numberFormat.format(item.orderQty)}</td>
          <td class="numeric">${numberFormat.format(item.remain)}</td>
          <td class="numeric">${numberFormat.format(item.forecastDays)}</td>
          <td class="numeric">${percentFormat.format(item.utilization)}</td>
          <td><span class="pill ${statusClass(item.status)}">${item.status}</span></td>
        </tr>
      `
    )
    .join("");
}

function renderLanes(items) {
  const top = [...items].sort((a, b) => b.utilization - a.utilization).slice(0, 8);
  laneTrack.innerHTML = top
    .map((item) => {
      const fill = Math.min(100, Math.round(item.utilization * 100));
      return `
        <div class="lane" style="--fill:${fill}%; --lane-color:${laneColor(item)}">
          <span title="${item.machine}">${item.machine}</span>
          <strong>${percentFormat.format(item.utilization)}</strong>
        </div>
      `;
    })
    .join("");
}

function render() {
  const items = filteredMachines();
  renderMetrics(items);
  renderRows(items);
  renderLanes(items);
}

searchInput.addEventListener("input", render);
statusFilter.addEventListener("change", render);
resetButton.addEventListener("click", () => {
  searchInput.value = "";
  statusFilter.value = "all";
  render();
});

render();
