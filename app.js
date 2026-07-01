const planData = window.PRODUCTION_PLAN_DATA ?? {
  sourceUrl: "#",
  generatedAt: "",
  planYear: 2026,
  planMonth: 7,
  machines: [],
  orders: []
};

const planStart = new Date(planData.planYear, planData.planMonth - 1, 1);
const planDays = new Date(planData.planYear, planData.planMonth, 0).getDate();
const orderStorageKey = `production-master-plan-orders-${planData.planYear}-${planData.planMonth}-v3`;
const capacityStorageKey = `production-master-plan-capacity-${planData.planYear}-${planData.planMonth}-v1`;
const activeMachineKey = "production-master-plan-active-machine-v1";

const palette = ["#2f6f8f", "#1f7a5a", "#a46819", "#7558a7", "#b84f3a", "#496a38", "#3b67a0", "#8a4d7b"];
const numberFormat = new Intl.NumberFormat("th-TH");
const dayFormat = new Intl.NumberFormat("th-TH", { maximumFractionDigits: 1 });
const percentFormat = new Intl.NumberFormat("th-TH", { style: "percent", maximumFractionDigits: 0 });
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

const machines = planData.machines.map((machine, index) => ({
  name: machine.name,
  defaultCapacity: Number(machine.defaultCapacity) || 1000,
  sheetOrder: Number(machine.sheetOrder ?? index)
}));

const sourceOrders = planData.orders.map((order, index) => ({
  id: order.id || `base-${index}`,
  machine: order.machine,
  openDate: order.openDate || "",
  orderNo: order.orderNo || "-",
  partName: order.partName || "-",
  partNo: order.partNo || "",
  rmNo: order.rmNo || "",
  qty: parseNumber(order.qty),
  unit: order.unit || "pcs",
  dueDate: order.dueDate || "",
  plannedStart: order.plannedStart || "",
  plannedFinish: order.plannedFinish || "",
  produced: parseNumber(order.produced),
  remaining: parseNumber(order.remaining || order.qty),
  productionStatus: order.productionStatus || "",
  progress: order.progress || "",
  sourceIndex: Number(order.sourceIndex ?? index)
}));

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
const cancelOrderButton = document.querySelector("#cancelOrderButton");
const dismissOrderButton = document.querySelector("#dismissOrderButton");

let plannerOrders = loadPlannerOrders();
let capacityOverrides = loadCapacityOverrides();
let schedules = buildSchedules();
let activeMachine = pickInitialMachine();

sourceSheetLink.href = planData.sourceUrl;
dataStamp.textContent = `${numberFormat.format(sourceOrders.length)} orders · ${monthNames[planData.planMonth - 1]} ${planData.planYear}`;

function parseNumber(value) {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  const number = Number(String(value ?? "").replace(/[^\d.-]/g, ""));
  return Number.isFinite(number) ? number : 0;
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
    qty: parseNumber(order.qty),
    unit: order.unit || "pcs",
    dueDate: order.dueDate || "",
    plannedStart: order.plannedStart || "",
    plannedFinish: order.plannedFinish || "",
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

function savePlan(message = "บันทึกแผนแล้ว") {
  const storage = getStorage();
  if (storage) {
    storage.setItem(orderStorageKey, JSON.stringify(plannerOrders));
    storage.setItem(capacityStorageKey, JSON.stringify(capacityOverrides));
  }
  setSaveStatus(message);
}

function clearPlan() {
  const storage = getStorage();
  if (storage) {
    storage.removeItem(orderStorageKey);
    storage.removeItem(capacityStorageKey);
  }
}

function setSaveStatus(message) {
  saveStatus.textContent = message;
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

function isoToDate(iso) {
  if (!iso || !/^\d{4}-\d{2}-\d{2}/.test(iso)) return null;
  const [year, month, day] = iso.slice(0, 10).split("-").map(Number);
  return new Date(year, month - 1, day);
}

function formatIsoDate(iso) {
  return formatDate(isoToDate(iso));
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

function statusClass(status) {
  if (status === "Over capacity") return "over";
  if (status === "Tight") return "tight";
  if (status === "No order") return "idle";
  return "ok";
}

function statusText(status) {
  if (status === "Over capacity") return "เกินเดือน";
  if (status === "Tight") return "แน่น";
  if (status === "No order") return "ยังไม่มีงาน";
  return "OK";
}

function orderStatusText(order) {
  return order.overMonth ? "ล้นเดือน" : "ในเดือน";
}

function orderLabel(order) {
  if (!order.orderNo || order.orderNo === "-" || order.orderNo === "WIP") {
    return order.partNo ? `${order.partName} (${order.partNo})` : order.partName;
  }
  return order.orderNo;
}

function orderTooltip(order) {
  return [
    `Order: ${order.orderNo}`,
    `Part: ${order.partName}`,
    `Part No.: ${order.partNo || "-"}`,
    `Qty: ${numberFormat.format(order.remaining)} ${order.unit || "pcs"}`,
    `Days: ${formatMachineDays(order.machineDays)}`,
    `Finish: ${formatDate(order.finishDate)}`
  ].join("\n");
}

function colorFor(text, index) {
  let hash = index;
  for (const char of String(text)) hash = (hash * 31 + char.charCodeAt(0)) % 9973;
  return palette[Math.abs(hash) % palette.length];
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
    const machineOrders = (ordersByMachine.get(machine.name) ?? []).map(cloneOrder);
    const totalRemain = machineOrders.reduce((sum, order) => sum + order.remaining, 0);
    const capacityPerDay = capacityFor(machine, totalRemain, machineOrders.length);
    let cursor = 0;

    const orders = machineOrders.map((order, orderIndex) => {
      const machineDays = capacityPerDay ? order.remaining / capacityPerDay : 0;
      const startOffset = cursor;
      const finishOffset = cursor + machineDays;
      const startDay = Math.max(1, Math.floor(startOffset) + 1);
      const finishDay = Math.max(startDay, Math.ceil(finishOffset));
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
        color: colorFor(`${order.orderNo}-${order.partNo}`, machineIndex + orderIndex)
      };
    });

    const totalDays = cursor;
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

function renderCalendarHeader() {
  calendarHeader.innerHTML = Array.from({ length: planDays }, (_, index) => `<span>${index + 1}</span>`).join("");
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
      <div class="timeline-grid empty-drop" data-drop-machine="${escapeHtml(schedule.name)}" style="--lane-count:1">
        <div class="empty-state timeline-empty">ยังไม่มีออเดอร์ในเครื่องนี้</div>
      </div>
    `;
    return;
  }

  selectedTimeline.innerHTML = `
    <div class="timeline-grid" data-drop-machine="${escapeHtml(schedule.name)}" style="--lane-count:${laneCount}">
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

  selectedMachineName.textContent = schedule.name;
  capacityInput.value = Math.round(schedule.capacityPerDay);
  machineKpis.innerHTML = `
    <span>${numberFormat.format(schedule.orders.length)} orders</span>
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
              <span>#${numberFormat.format(order.sequence)}</span>
              <strong>${escapeHtml(orderLabel(order))}</strong>
              <small>${escapeHtml(order.partName)}</small>
              <b>${numberFormat.format(order.remaining)} ${escapeHtml(order.unit || "pcs")} · ${formatMachineDays(order.machineDays)} วัน</b>
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
              <td>${numberFormat.format(order.sequence)}</td>
              <td>
                <strong>${escapeHtml(order.orderNo)}</strong>
                <span class="muted-line">${formatIsoDate(order.openDate)}</span>
              </td>
              <td>
                <strong>${escapeHtml(order.partName)}</strong>
                <span class="muted-line">${escapeHtml(order.partNo || "-")}</span>
              </td>
              <td class="numeric">${numberFormat.format(order.remaining)}</td>
              <td class="numeric">${formatMachineDays(order.machineDays)}</td>
              <td>${formatDate(order.startDate)}</td>
              <td>${formatDate(order.finishDate)}</td>
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
    : '<tr><td colspan="10"><div class="empty-state">ไม่มีออเดอร์ตามคำค้นหา</div></td></tr>';
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
      `${planData.planYear}-${String(planData.planMonth).padStart(2, "0")}-01`,
    orderNo: document.querySelector("#newOrderNo").value.trim(),
    partName: document.querySelector("#newOrderPart").value.trim(),
    partNo: document.querySelector("#newOrderPartNo").value.trim(),
    rmNo: "",
    qty,
    unit: "pcs",
    dueDate: "",
    plannedStart: "",
    plannedFinish: "",
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
    capacityOverrides[activeMachine] = value;
    refreshPlanner("ปรับกำลังผลิตต่อวันแล้ว");
  }
});

addOrderButton.addEventListener("click", () => {
  populateNewOrderMachine(activeMachine);
  document.querySelector("#newOrderDate").value = `${planData.planYear}-${String(planData.planMonth).padStart(2, "0")}-01`;
  orderDialog.showModal();
});

savePlanButton.addEventListener("click", () => savePlan("บันทึกแผนแล้ว"));
resetPlanButton.addEventListener("click", () => {
  if (!window.confirm("ต้องการรีเซ็ตกลับไปใช้ข้อมูลจากชีตใหม่หรือไม่?")) return;
  clearPlan();
  plannerOrders = sourceOrders.map(cloneOrder);
  capacityOverrides = {};
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
