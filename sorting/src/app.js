(() => {
  const seed = window.SORTING_SEED;
  const STORAGE_KEY = "sorting-control-v1";
  const WARNING_HOLD_DAYS = 3;
  const app = document.getElementById("app");

  let state = loadState();
  let activeTab = "dashboard";
  let notice = null;
  let installPrompt = null;
  let showInstallGuide = false;
  let draft = {
    issueReceiptNo: "",
    resultIssueNo: ""
  };

  const tabs = [
    { id: "dashboard", label: "ภาพรวม" },
    { id: "receive", label: "รับเข้างาน" },
    { id: "issue", label: "เบิกไปคัด" },
    { id: "result", label: "ผลการคัด" },
    { id: "balance", label: "ยอดคงเหลือ" },
    { id: "data", label: "ข้อมูล" }
  ];

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function blankState() {
    return {
      meta: {
        version: 1,
        sourceWorkbook: seed.sourceWorkbook,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      masters: clone(seed.masters),
      receipts: clone(seed.initialData.receipts),
      issues: clone(seed.initialData.issues),
      results: clone(seed.initialData.results)
    };
  }

  function loadState() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return blankState();
      const parsed = JSON.parse(stored);
      return {
        ...blankState(),
        ...parsed,
        meta: { ...blankState().meta, ...(parsed.meta || {}) },
        masters: { ...clone(seed.masters), ...(parsed.masters || {}) },
        receipts: Array.isArray(parsed.receipts) ? parsed.receipts : [],
        issues: Array.isArray(parsed.issues) ? parsed.issues : [],
        results: Array.isArray(parsed.results) ? parsed.results : []
      };
    } catch (error) {
      console.warn("Failed to load saved state", error);
      return blankState();
    }
  }

  function persist() {
    state.meta.updatedAt = new Date().toISOString();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function setNotice(type, text) {
    notice = { type, text };
  }

  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, (char) => {
      const map = {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
      };
      return map[char];
    });
  }

  function html(value) {
    return { __html: value };
  }

  function todayInput() {
    const date = new Date();
    return [
      date.getFullYear(),
      String(date.getMonth() + 1).padStart(2, "0"),
      String(date.getDate()).padStart(2, "0")
    ].join("-");
  }

  function timeInput() {
    const date = new Date();
    return [
      String(date.getHours()).padStart(2, "0"),
      String(date.getMinutes()).padStart(2, "0")
    ].join(":");
  }

  function idDate() {
    return todayInput().replaceAll("-", "");
  }

  function toNumber(value) {
    const number = Number(value);
    return Number.isFinite(number) ? number : 0;
  }

  function formatNumber(value) {
    return new Intl.NumberFormat("th-TH", { maximumFractionDigits: 2 }).format(toNumber(value));
  }

  function formatDateTime(date, time) {
    return [date, time].filter(Boolean).join(" ");
  }

  function getAgeDays(dateValue) {
    if (!dateValue) return 0;
    const date = new Date(`${dateValue}T00:00:00`);
    if (Number.isNaN(date.getTime())) return 0;
    const today = new Date(`${todayInput()}T00:00:00`);
    return Math.max(0, Math.floor((today - date) / 86400000));
  }

  function generateId(prefix, collection, field) {
    const base = `${prefix}-${idDate()}-`;
    const maxNumber = state[collection].reduce((max, item) => {
      const value = String(item[field] || "");
      if (!value.startsWith(base)) return max;
      const suffix = Number(value.slice(base.length));
      return Number.isFinite(suffix) ? Math.max(max, suffix) : max;
    }, 0);
    return `${base}${String(maxNumber + 1).padStart(3, "0")}`;
  }

  function receiptByNo(receiptNo) {
    return state.receipts.find((receipt) => receipt.receiptNo === receiptNo);
  }

  function issueByNo(issueNo) {
    return state.issues.find((issue) => issue.issueNo === issueNo);
  }

  function issuesForReceipt(receiptNo) {
    return state.issues.filter((issue) => issue.receiptNo === receiptNo);
  }

  function resultsForIssue(issueNo) {
    return state.results.filter((result) => result.issueNo === issueNo);
  }

  function resultsForReceipt(receiptNo) {
    return state.results.filter((result) => result.receiptNo === receiptNo);
  }

  function sumBy(items, field) {
    return items.reduce((sum, item) => sum + toNumber(item[field]), 0);
  }

  function issueSummary(issue) {
    const results = resultsForIssue(issue.issueNo);
    const issueQty = toNumber(issue.issueQty);
    const goodQty = sumBy(results, "goodQty");
    const ngQty = sumBy(results, "ngQty");
    const waitingQty = sumBy(results, "waitingQty");
    const resultTotal = goodQty + ngQty + waitingQty;
    const variance = issueQty - resultTotal;
    let status = "รอผล";
    if (resultTotal > 0 && variance === 0) status = "ครบ";
    if (resultTotal > 0 && variance > 0) status = "รอผลเพิ่ม";
    if (variance < 0) status = "ผลเกิน";
    return {
      issueQty,
      goodQty,
      ngQty,
      waitingQty,
      resultTotal,
      variance,
      inSorting: Math.max(variance, 0),
      status
    };
  }

  function receiptSummary(receipt) {
    const receiptIssues = issuesForReceipt(receipt.receiptNo);
    const receiptResults = resultsForReceipt(receipt.receiptNo);
    const receivedQty = toNumber(receipt.receivedQty);
    const issuedQty = sumBy(receiptIssues, "issueQty");
    const goodQty = sumBy(receiptResults, "goodQty");
    const ngQty = sumBy(receiptResults, "ngQty");
    const waitingQty = sumBy(receiptResults, "waitingQty");
    const resultTotal = goodQty + ngQty + waitingQty;
    const holdBalance = Math.max(receivedQty - issuedQty, 0);
    const overIssued = Math.max(issuedQty - receivedQty, 0);
    const inSorting = Math.max(issuedQty - resultTotal, 0);
    const ageDays = getAgeDays(receipt.receivedDate);
    const alerts = [];

    if (overIssued > 0) alerts.push("เบิกเกินรับเข้า");
    if (holdBalance > 0 && ageDays >= WARNING_HOLD_DAYS) alerts.push(`HOLD เกิน ${WARNING_HOLD_DAYS} วัน`);
    if (inSorting > 0) alerts.push("รอผลคัด");

    let status = "รอคัด";
    if (issuedQty > 0) status = "กำลังคัด";
    if (receivedQty > 0 && holdBalance === 0 && inSorting === 0 && overIssued === 0) status = "ปิดงาน";
    if (overIssued > 0) status = "ตรวจสอบยอด";

    return {
      receivedQty,
      issuedQty,
      holdBalance,
      goodQty,
      ngQty,
      waitingQty,
      resultTotal,
      inSorting,
      overIssued,
      ageDays,
      status,
      alert: alerts.length ? alerts.join(", ") : "ปกติ"
    };
  }

  function allBalances() {
    return state.receipts.map((receipt) => ({ ...receipt, summary: receiptSummary(receipt) }));
  }

  function availableReceipts() {
    return allBalances().filter((row) => row.summary.holdBalance > 0 || row.summary.overIssued > 0);
  }

  function openIssues() {
    return state.issues.filter((issue) => issueSummary(issue).inSorting > 0);
  }

  function dashboardMetrics() {
    const balances = allBalances();
    const receivedQty = balances.reduce((sum, row) => sum + row.summary.receivedQty, 0);
    const holdQty = balances.reduce((sum, row) => sum + row.summary.holdBalance, 0);
    const inSortingQty = balances.reduce((sum, row) => sum + row.summary.inSorting, 0);
    const goodQty = balances.reduce((sum, row) => sum + row.summary.goodQty, 0);
    const ngQty = balances.reduce((sum, row) => sum + row.summary.ngQty, 0);
    const waitingQty = balances.reduce((sum, row) => sum + row.summary.waitingQty, 0);
    const reworkQty = state.results.reduce(
      (sum, result) =>
        String(result.disposition || "").trim().toLowerCase() === "rework" ? sum + toNumber(result.ngQty) : sum,
      0
    );
    return {
      receipts: state.receipts.length,
      issues: state.issues.length,
      results: state.results.length,
      receivedQty,
      holdQty,
      inSortingQty,
      goodQty,
      ngQty,
      waitingQty,
      reworkQty,
      alerts: balances.filter((row) => row.summary.alert !== "ปกติ").length,
      closed: balances.filter((row) => row.summary.status === "ปิดงาน").length
    };
  }

  function groupBalancesBy(field) {
    const groups = new Map();
    allBalances().forEach((row) => {
      const key = row[field] || "ไม่ระบุ";
      const current = groups.get(key) || { key, receivedQty: 0, holdBalance: 0, inSorting: 0, count: 0 };
      current.receivedQty += row.summary.receivedQty;
      current.holdBalance += row.summary.holdBalance;
      current.inSorting += row.summary.inSorting;
      current.count += 1;
      groups.set(key, current);
    });
    return [...groups.values()].sort((a, b) => b.holdBalance + b.inSorting - (a.holdBalance + a.inSorting));
  }

  function optionTags(options, selected, placeholder = "") {
    const lead = placeholder ? `<option value="">${escapeHtml(placeholder)}</option>` : "";
    return `${lead}${options
      .map((option) => {
        const value = String(option);
        return `<option value="${escapeHtml(value)}" ${value === selected ? "selected" : ""}>${escapeHtml(value)}</option>`;
      })
      .join("")}`;
  }

  function render() {
    const metrics = dashboardMetrics();
    app.innerHTML = `
      <div class="app-shell">
        <header class="topbar">
          <div>
            <p class="eyebrow">Sorting Control</p>
            <h1>${escapeHtml(seed.appName)}</h1>
            <p class="company">${escapeHtml(seed.company)}</p>
          </div>
          <div class="topbar-actions">
            <span class="source-chip">${escapeHtml(seed.sourceWorkbook)}</span>
            <button class="primary-button install-button" type="button" data-action="install-app">ดาวน์โหลดลงโทรศัพท์</button>
            <button class="ghost-button" type="button" data-action="export-json">Export JSON</button>
          </div>
        </header>
        ${noticeBanner()}
        <section class="metric-strip" aria-label="สรุปงานคัด">
          ${metricCard("รับเข้าทั้งหมด", metrics.receipts, `${formatNumber(metrics.receivedQty)} pcs`, "blue")}
          ${metricCard("คงเหลือ HOLD", formatNumber(metrics.holdQty), "รอเบิกไปคัด", "amber")}
          ${metricCard("กำลังคัด", formatNumber(metrics.inSortingQty), "รอผลคัด", "teal")}
          ${metricCard("งานรอ Rework", formatNumber(metrics.reworkQty), "รอแก้ไข", "rework")}
          ${metricCard("ปิดงาน", metrics.closed, "รายการ", "green")}
          ${metricCard("ต้องติดตาม", metrics.alerts, "รายการ", metrics.alerts ? "red" : "neutral")}
        </section>
        <nav class="tabs" aria-label="เมนูหลัก">
          ${tabs
            .map(
              (tab) =>
                `<button type="button" class="tab ${activeTab === tab.id ? "is-active" : ""}" data-tab="${tab.id}">${tab.label}</button>`
            )
            .join("")}
        </nav>
        <main>${renderActiveTab()}</main>
      </div>
      ${showInstallGuide ? renderInstallGuide() : ""}
    `;
    bindEvents();
  }

  function noticeBanner() {
    if (!notice) return "";
    const banner = `<div class="notice ${notice.type}" role="status">${escapeHtml(notice.text)}</div>`;
    notice = null;
    return banner;
  }

  function renderInstallGuide() {
    const isAppleMobile = /iPhone|iPad|iPod/i.test(navigator.userAgent);
    return `
      <div class="install-overlay" role="presentation" data-action="close-install-guide">
        <section class="install-dialog" role="dialog" aria-modal="true" aria-labelledby="install-title" data-install-dialog>
          <div class="install-dialog-head">
            <h2 id="install-title">ติดตั้งลงโทรศัพท์</h2>
            <button class="ghost-button" type="button" data-action="close-install-guide">ปิด</button>
          </div>
          <div class="install-steps">
            <span class="install-mark">SC</span>
            <p>${
              isAppleMobile
                ? "เปิดหน้านี้ด้วย Safari กดปุ่มแชร์ แล้วเลือก เพิ่มไปยังหน้าจอโฮม"
                : "เปิดเมนูของเบราว์เซอร์ แล้วเลือก ติดตั้งแอป หรือ เพิ่มไปยังหน้าจอหลัก"
            }</p>
          </div>
        </section>
      </div>
    `;
  }

  function metricCard(label, value, caption, tone) {
    return `
      <article class="metric ${tone}">
        <span>${escapeHtml(label)}</span>
        <strong>${escapeHtml(value)}</strong>
        <em>${escapeHtml(caption)}</em>
      </article>
    `;
  }

  function renderActiveTab() {
    if (activeTab === "receive") return renderReceive();
    if (activeTab === "issue") return renderIssue();
    if (activeTab === "result") return renderResult();
    if (activeTab === "balance") return renderBalance();
    if (activeTab === "data") return renderData();
    return renderDashboard();
  }

  function renderDashboard() {
    const balances = allBalances();
    const queueRows = balances
      .filter((row) => row.summary.status !== "ปิดงาน")
      .sort((a, b) => b.summary.ageDays - a.summary.ageDays)
      .slice(0, 12);
    const alertRows = balances
      .filter((row) => row.summary.alert !== "ปกติ")
      .sort((a, b) => b.summary.ageDays - a.summary.ageDays)
      .slice(0, 8);
    const problemRows = groupBalancesBy("problemType").slice(0, 8);
    const holdRows = groupBalancesBy("holdArea").slice(0, 8);

    return `
      <section class="dashboard-grid">
        <div class="panel wide">
          <div class="panel-head">
            <h2>คิวงานคัด</h2>
            <button type="button" class="primary-button" data-tab="receive">รับเข้าใหม่</button>
          </div>
          ${dataTable(
            ["เลขที่รับเข้า", "Part No.", "Lot No.", "ปัญหา", "HOLD", "กำลังคัด", "อายุ", "สถานะ", ""],
            queueRows.map((row) => [
              row.receiptNo,
              row.partNo,
              row.lotNo,
              row.problemType,
              formatNumber(row.summary.holdBalance),
              formatNumber(row.summary.inSorting),
              `${row.summary.ageDays} วัน`,
              statusBadge(row.summary.status),
              html(`<button type="button" class="table-action" data-action="goto-issue" data-receipt="${escapeHtml(row.receiptNo)}">เบิกคัด</button>`)
            ]),
            "ยังไม่มีคิวงานคัด"
          )}
        </div>
        <div class="panel">
          <div class="panel-head">
            <h2>รายการเตือน</h2>
          </div>
          ${dataTable(
            ["เลขที่", "Part No.", "แจ้งเตือน"],
            alertRows.map((row) => [row.receiptNo, row.partNo, warningBadge(row.summary.alert)]),
            "ไม่มีรายการเตือน"
          )}
        </div>
        <div class="panel">
          <div class="panel-head">
            <h2>ประเภทปัญหา</h2>
          </div>
          ${summaryBars(problemRows, "key", "holdBalance", "inSorting")}
        </div>
        <div class="panel">
          <div class="panel-head">
            <h2>พื้นที่ HOLD</h2>
          </div>
          ${summaryBars(holdRows, "key", "holdBalance", "inSorting")}
        </div>
      </section>
    `;
  }

  function summaryBars(rows, keyField, holdField, sortingField) {
    if (!rows.length) return `<div class="empty-state">ยังไม่มีข้อมูล</div>`;
    const max = Math.max(...rows.map((row) => row[holdField] + row[sortingField]), 1);
    return `
      <div class="bar-list">
        ${rows
          .map((row) => {
            const total = row[holdField] + row[sortingField];
            const width = Math.max(5, Math.round((total / max) * 100));
            return `
              <div class="bar-row">
                <div class="bar-label">
                  <strong>${escapeHtml(row[keyField])}</strong>
                  <span>${formatNumber(total)} pcs</span>
                </div>
                <div class="bar-track"><span style="width:${width}%"></span></div>
              </div>
            `;
          })
          .join("")}
      </div>
    `;
  }

  function renderReceive() {
    return `
      <section class="split-layout">
        <form class="panel form-panel" id="receive-form">
          <div class="panel-head">
            <h2>รับเข้างาน</h2>
          </div>
          <div class="form-grid">
            ${inputField("receiptNo", "เลขที่รับเข้า", generateId("RCV", "receipts", "receiptNo"), "text", "readonly")}
            ${inputField("receivedDate", "วันที่รับเข้า", todayInput(), "date", "required")}
            ${inputField("receivedTime", "เวลา", timeInput(), "time", "required")}
            ${selectField("shift", "กะ", state.masters.shifts, "Day", "required")}
            ${inputField("partNo", "Part No.", "", "text", "required")}
            ${inputField("partName", "ชื่อชิ้นงาน", "", "text")}
            ${inputField("lotNo", "Lot No.", "", "text", "required")}
            ${selectField("problemType", "ประเภทปัญหา", state.masters.problemTypes, "", "required", "เลือกประเภท")}
            ${inputField("receivedQty", "จำนวนรับเข้า", "", "number", "required min=\"1\" step=\"1\"")}
            ${selectField("unit", "หน่วย", state.masters.units, "pcs", "required")}
            ${selectField("holdArea", "พื้นที่ HOLD", state.masters.holdAreas, "", "required", "เลือกพื้นที่")}
            ${inputField("supplier", "ผู้ส่งมอบ", "", "text")}
            ${inputField("receiver", "ผู้รับเข้า/คนนับ", "", "text")}
            ${selectField("status", "สถานะ", state.masters.statuses, "รอคัด", "required")}
            ${textareaField("problemDetail", "รายละเอียดปัญหา")}
            ${textareaField("note", "หมายเหตุ")}
          </div>
          <div class="form-actions">
            <button class="primary-button" type="submit">บันทึกรับเข้า</button>
          </div>
        </form>
        <div class="panel table-panel">
          <div class="panel-head">
            <h2>รายการรับเข้า</h2>
            <button type="button" class="ghost-button" data-action="export-csv" data-export="receipts">CSV</button>
          </div>
          ${dataTable(
            ["เลขที่", "วันที่", "Part No.", "Lot No.", "ปัญหา", "รับเข้า", "HOLD", "สถานะ", ""],
            state.receipts.map((receipt) => {
              const summary = receiptSummary(receipt);
              return [
                receipt.receiptNo,
                formatDateTime(receipt.receivedDate, receipt.receivedTime),
                receipt.partNo,
                receipt.lotNo,
                receipt.problemType,
                formatNumber(summary.receivedQty),
                receipt.holdArea,
                statusBadge(summary.status),
                rowActions("receipt", receipt.receiptNo, summary.holdBalance > 0)
              ];
            }),
            "ยังไม่มีรายการรับเข้า"
          )}
        </div>
      </section>
    `;
  }

  function renderIssue() {
    const choices = availableReceipts();
    const selectedReceiptNo =
      draft.issueReceiptNo && choices.some((row) => row.receiptNo === draft.issueReceiptNo)
        ? draft.issueReceiptNo
        : choices[0]?.receiptNo || "";
    const selectedReceipt = selectedReceiptNo ? receiptByNo(selectedReceiptNo) : null;
    const selectedSummary = selectedReceipt ? receiptSummary(selectedReceipt) : null;

    return `
      <section class="split-layout">
        <form class="panel form-panel" id="issue-form">
          <div class="panel-head">
            <h2>เบิกออกไปคัด</h2>
          </div>
          <div class="form-grid">
            ${inputField("issueNo", "เลขที่เบิก", generateId("ISS", "issues", "issueNo"), "text", "readonly")}
            ${inputField("issueDate", "วันที่เบิก", todayInput(), "date", "required")}
            ${inputField("issueTime", "เวลา", timeInput(), "time", "required")}
            ${selectField("shift", "กะ", state.masters.shifts, "Day", "required")}
            <label class="field">
              <span>เลขที่รับเข้า</span>
              <select id="issue-receipt-no" name="receiptNo" required>
                ${optionTags(
                  choices.map((row) => row.receiptNo),
                  selectedReceiptNo,
                  choices.length ? "" : "ยังไม่มีงานคงเหลือ"
                )}
              </select>
            </label>
            ${inputField("issueQty", "จำนวนเบิกไปคัด", "", "number", "required min=\"1\" step=\"1\"")}
            ${selectField("unit", "หน่วย", state.masters.units, "pcs", "required")}
            ${selectField("sortingArea", "พื้นที่คัด", state.masters.sortingAreas, "", "required", "เลือกพื้นที่")}
            ${inputField("outCounter", "คนนับงานออก", "", "text")}
            ${inputField("sortingReceiver", "ผู้รับไปคัด", "", "text", "required")}
            ${inputField("supervisor", "หัวหน้ารับรอง", "", "text")}
            ${textareaField("note", "หมายเหตุ")}
          </div>
          <div class="form-summary" id="issue-receipt-info">
            ${renderReceiptInfo(selectedReceipt, selectedSummary)}
          </div>
          <div class="form-actions">
            <button class="primary-button" type="submit" ${choices.length ? "" : "disabled"}>บันทึกเบิกคัด</button>
          </div>
        </form>
        <div class="panel table-panel">
          <div class="panel-head">
            <h2>รายการเบิกคัด</h2>
            <button type="button" class="ghost-button" data-action="export-csv" data-export="issues">CSV</button>
          </div>
          ${dataTable(
            ["เลขที่เบิก", "วันที่", "รับเข้า", "Part No.", "Lot No.", "เบิก", "คงค้างผล", "สถานะ", ""],
            state.issues.map((issue) => {
              const receipt = receiptByNo(issue.receiptNo) || {};
              const summary = issueSummary(issue);
              return [
                issue.issueNo,
                formatDateTime(issue.issueDate, issue.issueTime),
                issue.receiptNo,
                receipt.partNo || issue.partNo,
                receipt.lotNo || issue.lotNo,
                formatNumber(summary.issueQty),
                formatNumber(summary.inSorting),
                statusBadge(summary.status),
                rowActions("issue", issue.issueNo, summary.inSorting > 0)
              ];
            }),
            "ยังไม่มีรายการเบิกคัด"
          )}
        </div>
      </section>
    `;
  }

  function renderReceiptInfo(receipt, summary) {
    if (!receipt || !summary) {
      return `<span>ไม่มีงาน HOLD ที่พร้อมเบิก</span>`;
    }
    return `
      <span>Part No. <strong>${escapeHtml(receipt.partNo)}</strong></span>
      <span>Lot <strong>${escapeHtml(receipt.lotNo)}</strong></span>
      <span>รับเข้า <strong>${formatNumber(summary.receivedQty)}</strong></span>
      <span>เบิกแล้ว <strong>${formatNumber(summary.issuedQty)}</strong></span>
      <span>คงเหลือก่อนเบิก <strong>${formatNumber(summary.holdBalance)}</strong></span>
    `;
  }

  function renderResult() {
    const choices = openIssues();
    const selectedIssueNo =
      draft.resultIssueNo && choices.some((issue) => issue.issueNo === draft.resultIssueNo)
        ? draft.resultIssueNo
        : choices[0]?.issueNo || "";
    const selectedIssue = selectedIssueNo ? issueByNo(selectedIssueNo) : null;
    const selectedSummary = selectedIssue ? issueSummary(selectedIssue) : null;

    return `
      <section class="split-layout">
        <form class="panel form-panel" id="result-form">
          <div class="panel-head">
            <h2>บันทึกผลการคัด</h2>
          </div>
          <div class="form-grid">
            ${inputField("resultNo", "เลขที่ผลคัด", generateId("RES", "results", "resultNo"), "text", "readonly")}
            ${inputField("resultDate", "วันที่", todayInput(), "date", "required")}
            <label class="field">
              <span>เลขที่เบิก</span>
              <select id="result-issue-no" name="issueNo" required>
                ${optionTags(
                  choices.map((issue) => issue.issueNo),
                  selectedIssueNo,
                  choices.length ? "" : "ยังไม่มีงานรอผลคัด"
                )}
              </select>
            </label>
            ${inputField("goodQty", "งานดี", "", "number", "required min=\"0\" step=\"1\"")}
            ${inputField("ngQty", "งานเสีย", "", "number", "required min=\"0\" step=\"1\"")}
            ${inputField("waitingQty", "รอตัดสินใจ", "", "number", "required min=\"0\" step=\"1\"")}
            ${inputField("sortedBy", "ผู้คัด", "", "text", "required")}
            ${inputField("checkedBy", "ผู้ตรวจสอบ", "", "text")}
            ${textareaField("ngDetail", "รายละเอียด NG")}
            ${selectField("disposition", "Disposition", state.masters.dispositions, "", "", "เลือก disposition")}
            ${textareaField("note", "หมายเหตุ")}
          </div>
          <div class="form-summary" id="result-issue-info">
            ${renderIssueInfo(selectedIssue, selectedSummary)}
          </div>
          <div class="form-actions">
            <button class="primary-button" type="submit" ${choices.length ? "" : "disabled"}>บันทึกผลคัด</button>
          </div>
        </form>
        <div class="panel table-panel">
          <div class="panel-head">
            <h2>ผลการคัด</h2>
            <button type="button" class="ghost-button" data-action="export-csv" data-export="results">CSV</button>
          </div>
          ${dataTable(
            ["เลขที่ผล", "วันที่", "เบิก", "รับเข้า", "ดี", "เสีย", "รอตัดสินใจ", "ส่วนต่าง", "สถานะ", ""],
            state.results.map((result) => [
              result.resultNo,
              result.resultDate,
              result.issueNo,
              result.receiptNo,
              formatNumber(result.goodQty),
              formatNumber(result.ngQty),
              formatNumber(result.waitingQty),
              formatNumber(result.differenceAfter),
              statusBadge(result.resultStatus),
              rowActions("result", result.resultNo, false)
            ]),
            "ยังไม่มีผลการคัด"
          )}
        </div>
      </section>
    `;
  }

  function renderIssueInfo(issue, summary) {
    if (!issue || !summary) {
      return `<span>ไม่มีรายการเบิกที่รอผลคัด</span>`;
    }
    const receipt = receiptByNo(issue.receiptNo) || {};
    return `
      <span>รับเข้า <strong>${escapeHtml(issue.receiptNo)}</strong></span>
      <span>Part No. <strong>${escapeHtml(receipt.partNo || issue.partNo)}</strong></span>
      <span>Lot <strong>${escapeHtml(receipt.lotNo || issue.lotNo)}</strong></span>
      <span>เบิก <strong>${formatNumber(summary.issueQty)}</strong></span>
      <span>คงค้างผล <strong>${formatNumber(summary.inSorting)}</strong></span>
    `;
  }

  function renderBalance() {
    const balances = allBalances();
    return `
      <section class="panel">
        <div class="panel-head">
          <h2>ยอดคงเหลือ</h2>
          <button type="button" class="ghost-button" data-action="export-csv" data-export="balance">CSV</button>
        </div>
        ${dataTable(
          ["รับเข้า", "วันที่", "Part No.", "Lot No.", "ปัญหา", "รับเข้า", "เบิก", "HOLD", "ดี", "เสีย", "รอ", "กำลังคัด", "อายุ", "แจ้งเตือน", ""],
          balances.map((row) => [
            row.receiptNo,
            row.receivedDate,
            row.partNo,
            row.lotNo,
            row.problemType,
            formatNumber(row.summary.receivedQty),
            formatNumber(row.summary.issuedQty),
            formatNumber(row.summary.holdBalance),
            formatNumber(row.summary.goodQty),
            formatNumber(row.summary.ngQty),
            formatNumber(row.summary.waitingQty),
            formatNumber(row.summary.inSorting),
            `${row.summary.ageDays} วัน`,
            row.summary.alert === "ปกติ" ? statusBadge("ปกติ") : warningBadge(row.summary.alert),
            row.summary.holdBalance > 0
              ? html(`<button type="button" class="table-action" data-action="goto-issue" data-receipt="${escapeHtml(row.receiptNo)}">เบิกคัด</button>`)
              : ""
          ]),
          "ยังไม่มีข้อมูลยอดคงเหลือ",
          "dense"
        )}
      </section>
    `;
  }

  function renderData() {
    return `
      <section class="data-grid">
        <div class="panel">
          <div class="panel-head">
            <h2>สำรองข้อมูล</h2>
          </div>
          <div class="button-stack">
            <button type="button" class="primary-button" data-action="export-json">ส่งออก JSON</button>
            <label class="file-button">
              <span>นำเข้า JSON</span>
              <input type="file" id="import-json" accept="application/json,.json" />
            </label>
            <button type="button" class="danger-button" data-action="reset-data">ล้างข้อมูล</button>
          </div>
        </div>
        <div class="panel">
          <div class="panel-head">
            <h2>ส่งออกตาราง</h2>
          </div>
          <div class="button-grid">
            <button type="button" class="ghost-button" data-action="export-csv" data-export="receipts">รับเข้า CSV</button>
            <button type="button" class="ghost-button" data-action="export-csv" data-export="issues">เบิกคัด CSV</button>
            <button type="button" class="ghost-button" data-action="export-csv" data-export="results">ผลคัด CSV</button>
            <button type="button" class="ghost-button" data-action="export-csv" data-export="balance">ยอดคงเหลือ CSV</button>
          </div>
        </div>
        <div class="panel wide">
          <div class="panel-head">
            <h2>Master</h2>
          </div>
          ${dataTable(
            ["กะ", "สถานะ", "ประเภทปัญหา", "พื้นที่ HOLD", "พื้นที่คัด"],
            maxMasterRows().map((_, index) => [
              state.masters.shifts[index] || "",
              state.masters.statuses[index] || "",
              state.masters.problemTypes[index] || "",
              state.masters.holdAreas[index] || "",
              state.masters.sortingAreas[index] || ""
            ]),
            "ไม่มี master"
          )}
        </div>
      </section>
    `;
  }

  function maxMasterRows() {
    const max = Math.max(
      state.masters.shifts.length,
      state.masters.statuses.length,
      state.masters.problemTypes.length,
      state.masters.holdAreas.length,
      state.masters.sortingAreas.length
    );
    return Array.from({ length: max });
  }

  function inputField(name, label, value = "", type = "text", attrs = "") {
    return `
      <label class="field">
        <span>${escapeHtml(label)}</span>
        <input type="${escapeHtml(type)}" name="${escapeHtml(name)}" value="${escapeHtml(value)}" ${attrs} />
      </label>
    `;
  }

  function selectField(name, label, options, value = "", attrs = "", placeholder = "") {
    return `
      <label class="field">
        <span>${escapeHtml(label)}</span>
        <select name="${escapeHtml(name)}" ${attrs}>
          ${optionTags(options, value, placeholder)}
        </select>
      </label>
    `;
  }

  function textareaField(name, label) {
    return `
      <label class="field full">
        <span>${escapeHtml(label)}</span>
        <textarea name="${escapeHtml(name)}" rows="3"></textarea>
      </label>
    `;
  }

  function dataTable(headers, rows, emptyText, density = "") {
    if (!rows.length) return `<div class="empty-state">${escapeHtml(emptyText)}</div>`;
    return `
      <div class="table-wrap ${density}">
        <table>
          <thead>
            <tr>${headers.map((header) => `<th>${escapeHtml(header)}</th>`).join("")}</tr>
          </thead>
          <tbody>
            ${rows
              .map(
                (row) =>
                  `<tr>${row
                    .map(
                      (cell, index) =>
                        `<td data-label="${escapeHtml(headers[index] || "")}">${
                          cell && typeof cell === "object" && "__html" in cell ? cell.__html : escapeHtml(cell)
                        }</td>`
                    )
                    .join("")}</tr>`
              )
              .join("")}
          </tbody>
        </table>
      </div>
    `;
  }

  function statusBadge(text) {
    const value = String(text || "");
    const tone =
      value.includes("ปิด") || value === "ครบ" || value === "ปกติ"
        ? "ok"
        : value.includes("เกิน") || value.includes("ผลต่าง") || value.includes("ตรวจ")
          ? "bad"
          : value.includes("รอ")
            ? "wait"
            : "active";
    return html(`<span class="badge ${tone}">${escapeHtml(value)}</span>`);
  }

  function warningBadge(text) {
    return html(`<span class="badge bad">${escapeHtml(text)}</span>`);
  }

  function rowActions(type, id, canMoveNext) {
    const safeId = escapeHtml(id);
    const nextAction =
      type === "receipt" && canMoveNext
        ? `<button type="button" class="table-action" data-action="goto-issue" data-receipt="${safeId}">เบิกคัด</button>`
        : type === "issue" && canMoveNext
          ? `<button type="button" class="table-action" data-action="goto-result" data-issue="${safeId}">ลงผล</button>`
          : "";
    return html(`
      <div class="row-actions">
        ${nextAction}
        <button type="button" class="table-action muted" data-action="delete-${type}" data-id="${safeId}">ลบ</button>
      </div>
    `);
  }

  function bindEvents() {
    document.querySelectorAll("[data-tab]").forEach((button) => {
      button.addEventListener("click", () => {
        activeTab = button.dataset.tab;
        render();
      });
    });

    document.querySelectorAll("[data-action]").forEach((button) => {
      button.addEventListener("click", () => handleAction(button));
    });

    document.getElementById("receive-form")?.addEventListener("submit", handleReceiveSubmit);
    document.getElementById("issue-form")?.addEventListener("submit", handleIssueSubmit);
    document.getElementById("result-form")?.addEventListener("submit", handleResultSubmit);
    document.getElementById("issue-receipt-no")?.addEventListener("change", (event) => {
      draft.issueReceiptNo = event.target.value;
      const receipt = receiptByNo(draft.issueReceiptNo);
      document.getElementById("issue-receipt-info").innerHTML = renderReceiptInfo(
        receipt,
        receipt ? receiptSummary(receipt) : null
      );
    });
    document.getElementById("result-issue-no")?.addEventListener("change", (event) => {
      draft.resultIssueNo = event.target.value;
      const issue = issueByNo(draft.resultIssueNo);
      document.getElementById("result-issue-info").innerHTML = renderIssueInfo(issue, issue ? issueSummary(issue) : null);
    });
    document.getElementById("import-json")?.addEventListener("change", handleImportJson);
  }

  function handleAction(button) {
    const action = button.dataset.action;
    if (action === "install-app") return installApp();
    if (action === "close-install-guide") {
      showInstallGuide = false;
      return render();
    }
    if (action === "export-json") return exportJson();
    if (action === "export-csv") return exportCsv(button.dataset.export);
    if (action === "reset-data") return resetData();
    if (action === "goto-issue") {
      draft.issueReceiptNo = button.dataset.receipt || "";
      activeTab = "issue";
      return render();
    }
    if (action === "goto-result") {
      draft.resultIssueNo = button.dataset.issue || "";
      activeTab = "result";
      return render();
    }
    if (action === "delete-receipt") return deleteReceipt(button.dataset.id);
    if (action === "delete-issue") return deleteIssue(button.dataset.id);
    if (action === "delete-result") return deleteResult(button.dataset.id);
  }

  function formData(form) {
    return Object.fromEntries(new FormData(form).entries());
  }

  function handleReceiveSubmit(event) {
    event.preventDefault();
    const data = formData(event.currentTarget);
    const qty = toNumber(data.receivedQty);
    if (qty <= 0) {
      setNotice("error", "จำนวนรับเข้าต้องมากกว่า 0");
      return render();
    }
    if (state.receipts.some((receipt) => receipt.receiptNo === data.receiptNo)) {
      setNotice("error", "เลขที่รับเข้าซ้ำ");
      return render();
    }
    state.receipts.push({
      receiptNo: data.receiptNo,
      receivedDate: data.receivedDate,
      receivedTime: data.receivedTime,
      shift: data.shift,
      partNo: data.partNo.trim(),
      partName: data.partName.trim(),
      lotNo: data.lotNo.trim(),
      problemType: data.problemType,
      problemDetail: data.problemDetail.trim(),
      receivedQty: qty,
      unit: data.unit || "pcs",
      holdArea: data.holdArea,
      supplier: data.supplier.trim(),
      receiver: data.receiver.trim(),
      status: data.status,
      note: data.note.trim(),
      createdAt: new Date().toISOString()
    });
    persist();
    setNotice("success", `บันทึกรับเข้า ${data.receiptNo} แล้ว`);
    activeTab = "receive";
    render();
  }

  function handleIssueSubmit(event) {
    event.preventDefault();
    const data = formData(event.currentTarget);
    const receipt = receiptByNo(data.receiptNo);
    if (!receipt) {
      setNotice("error", "ไม่พบเลขที่รับเข้า");
      return render();
    }
    const summary = receiptSummary(receipt);
    const qty = toNumber(data.issueQty);
    if (qty <= 0) {
      setNotice("error", "จำนวนเบิกต้องมากกว่า 0");
      return render();
    }
    if (qty > summary.holdBalance) {
      setNotice("error", `เบิกได้ไม่เกินคงเหลือ HOLD ${formatNumber(summary.holdBalance)} pcs`);
      return render();
    }
    state.issues.push({
      issueNo: data.issueNo,
      issueDate: data.issueDate,
      issueTime: data.issueTime,
      shift: data.shift,
      receiptNo: data.receiptNo,
      partNo: receipt.partNo,
      lotNo: receipt.lotNo,
      issueQty: qty,
      unit: data.unit || "pcs",
      sortingArea: data.sortingArea,
      outCounter: data.outCounter.trim(),
      sortingReceiver: data.sortingReceiver.trim(),
      supervisor: data.supervisor.trim(),
      receivedQty: summary.receivedQty,
      issuedBefore: summary.issuedQty,
      balanceBefore: summary.holdBalance,
      checkStatus: "ผ่าน",
      note: data.note.trim(),
      createdAt: new Date().toISOString()
    });
    draft.issueReceiptNo = data.receiptNo;
    persist();
    setNotice("success", `บันทึกเบิกคัด ${data.issueNo} แล้ว`);
    activeTab = "issue";
    render();
  }

  function handleResultSubmit(event) {
    event.preventDefault();
    const data = formData(event.currentTarget);
    const issue = issueByNo(data.issueNo);
    if (!issue) {
      setNotice("error", "ไม่พบเลขที่เบิก");
      return render();
    }
    const before = issueSummary(issue);
    const goodQty = toNumber(data.goodQty);
    const ngQty = toNumber(data.ngQty);
    const waitingQty = toNumber(data.waitingQty);
    const resultTotal = goodQty + ngQty + waitingQty;
    if (resultTotal <= 0) {
      setNotice("error", "ผลคัดรวมต้องมากกว่า 0");
      return render();
    }
    if (resultTotal > before.inSorting) {
      setNotice("error", `บันทึกผลได้ไม่เกินคงค้าง ${formatNumber(before.inSorting)} pcs`);
      return render();
    }
    const receipt = receiptByNo(issue.receiptNo) || {};
    const differenceAfter = before.inSorting - resultTotal;
    const resultStatus = differenceAfter === 0 ? "ครบ" : "รอผลเพิ่ม";
    state.results.push({
      resultNo: data.resultNo,
      resultDate: data.resultDate,
      issueNo: data.issueNo,
      receiptNo: issue.receiptNo,
      partNo: receipt.partNo || issue.partNo,
      lotNo: receipt.lotNo || issue.lotNo,
      issueQty: issue.issueQty,
      goodQty,
      ngQty,
      waitingQty,
      resultTotal,
      differenceAfter,
      resultStatus,
      sortedBy: data.sortedBy.trim(),
      checkedBy: data.checkedBy.trim(),
      ngDetail: data.ngDetail.trim(),
      disposition: data.disposition,
      note: data.note.trim(),
      createdAt: new Date().toISOString()
    });
    draft.resultIssueNo = data.issueNo;
    persist();
    setNotice("success", `บันทึกผลคัด ${data.resultNo} แล้ว`);
    activeTab = "result";
    render();
  }

  function deleteReceipt(receiptNo) {
    if (issuesForReceipt(receiptNo).length) {
      setNotice("error", "ลบไม่ได้: รายการรับเข้านี้มีการเบิกคัดแล้ว");
      return render();
    }
    if (!confirm(`ลบรายการรับเข้า ${receiptNo}?`)) return;
    state.receipts = state.receipts.filter((receipt) => receipt.receiptNo !== receiptNo);
    persist();
    setNotice("success", `ลบรายการรับเข้า ${receiptNo} แล้ว`);
    render();
  }

  function deleteIssue(issueNo) {
    if (resultsForIssue(issueNo).length) {
      setNotice("error", "ลบไม่ได้: รายการเบิกนี้มีผลคัดแล้ว");
      return render();
    }
    if (!confirm(`ลบรายการเบิก ${issueNo}?`)) return;
    state.issues = state.issues.filter((issue) => issue.issueNo !== issueNo);
    persist();
    setNotice("success", `ลบรายการเบิก ${issueNo} แล้ว`);
    render();
  }

  function deleteResult(resultNo) {
    if (!confirm(`ลบผลคัด ${resultNo}?`)) return;
    state.results = state.results.filter((result) => result.resultNo !== resultNo);
    persist();
    setNotice("success", `ลบผลคัด ${resultNo} แล้ว`);
    render();
  }

  function resetData() {
    if (!confirm("ล้างข้อมูลรับเข้า เบิกคัด และผลคัดทั้งหมด?")) return;
    state = blankState();
    persist();
    setNotice("success", "ล้างข้อมูลแล้ว");
    activeTab = "dashboard";
    render();
  }

  function exportJson() {
    const payload = {
      ...state,
      exportedAt: new Date().toISOString()
    };
    downloadFile(`sorting-control-backup-${idDate()}.json`, JSON.stringify(payload, null, 2), "application/json");
  }

  function handleImportJson(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result));
        if (!Array.isArray(parsed.receipts) || !Array.isArray(parsed.issues) || !Array.isArray(parsed.results)) {
          throw new Error("Invalid backup shape");
        }
        if (!confirm("แทนที่ข้อมูลปัจจุบันด้วยไฟล์นี้?")) return;
        state = {
          ...blankState(),
          ...parsed,
          meta: { ...blankState().meta, ...(parsed.meta || {}), importedAt: new Date().toISOString() },
          masters: { ...clone(seed.masters), ...(parsed.masters || {}) }
        };
        persist();
        setNotice("success", "นำเข้าข้อมูลแล้ว");
        activeTab = "dashboard";
        render();
      } catch (error) {
        console.error(error);
        setNotice("error", "นำเข้าไฟล์ไม่ได้");
        render();
      }
    };
    reader.readAsText(file);
  }

  function exportCsv(type) {
    const config = csvConfig(type);
    if (!config) return;
    downloadFile(config.filename, toCsv(config.headers, config.rows), "text/csv;charset=utf-8");
  }

  function csvConfig(type) {
    if (type === "receipts") {
      return {
        filename: `sorting-receipts-${idDate()}.csv`,
        headers: seed.columns.receipts,
        rows: state.receipts.map((receipt) => [
          receipt.receiptNo,
          receipt.receivedDate,
          receipt.receivedTime,
          receipt.shift,
          receipt.partNo,
          receipt.partName,
          receipt.lotNo,
          receipt.problemType,
          receipt.problemDetail,
          receipt.receivedQty,
          receipt.unit,
          receipt.holdArea,
          receipt.supplier,
          receipt.receiver,
          receiptSummary(receipt).status,
          receipt.note
        ])
      };
    }
    if (type === "issues") {
      return {
        filename: `sorting-issues-${idDate()}.csv`,
        headers: seed.columns.issues,
        rows: state.issues.map((issue) => [
          issue.issueNo,
          issue.issueDate,
          issue.issueTime,
          issue.shift,
          issue.receiptNo,
          issue.partNo,
          issue.lotNo,
          issue.issueQty,
          issue.unit,
          issue.sortingArea,
          issue.outCounter,
          issue.sortingReceiver,
          issue.supervisor,
          issue.receivedQty,
          issue.issuedBefore,
          issue.balanceBefore,
          issue.checkStatus,
          issue.note
        ])
      };
    }
    if (type === "results") {
      return {
        filename: `sorting-results-${idDate()}.csv`,
        headers: seed.columns.results,
        rows: state.results.map((result) => [
          result.resultNo,
          result.resultDate,
          result.issueNo,
          result.receiptNo,
          result.partNo,
          result.lotNo,
          result.issueQty,
          result.goodQty,
          result.ngQty,
          result.waitingQty,
          result.resultTotal,
          result.differenceAfter,
          result.resultStatus,
          result.sortedBy,
          result.checkedBy,
          result.ngDetail,
          result.disposition,
          result.note
        ])
      };
    }
    if (type === "balance") {
      return {
        filename: `sorting-balance-${idDate()}.csv`,
        headers: seed.columns.balance,
        rows: allBalances().map((row) => [
          row.receiptNo,
          row.receivedDate,
          row.partNo,
          row.partName,
          row.lotNo,
          row.problemType,
          row.summary.receivedQty,
          row.summary.issuedQty,
          row.summary.holdBalance,
          row.summary.goodQty,
          row.summary.ngQty,
          row.summary.waitingQty,
          row.summary.resultTotal,
          row.summary.inSorting,
          row.summary.status,
          row.holdArea,
          row.summary.ageDays,
          row.summary.alert
        ])
      };
    }
    return null;
  }

  function toCsv(headers, rows) {
    const lines = [headers, ...rows].map((row) => row.map(csvCell).join(","));
    return `\ufeff${lines.join("\r\n")}`;
  }

  function csvCell(value) {
    const text = String(value ?? "");
    if (/[",\r\n]/.test(text)) return `"${text.replaceAll('"', '""')}"`;
    return text;
  }

  function downloadFile(filename, content, type) {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  async function installApp() {
    const isInstalled = window.matchMedia("(display-mode: standalone)").matches || navigator.standalone === true;
    if (isInstalled) {
      setNotice("success", "ติดตั้งแอปในโทรศัพท์เครื่องนี้แล้ว");
      return render();
    }
    if (installPrompt) {
      installPrompt.prompt();
      await installPrompt.userChoice;
      installPrompt = null;
      document.body.classList.remove("can-install");
      return;
    }
    showInstallGuide = true;
    render();
  }

  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    installPrompt = event;
    document.body.classList.add("can-install");
  });

  window.addEventListener("appinstalled", () => {
    installPrompt = null;
    document.body.classList.remove("can-install");
  });

  if ("serviceWorker" in navigator && location.protocol.startsWith("http")) {
    window.addEventListener("load", () => navigator.serviceWorker.register("sw.js"));
  }

  render();
})();
