import "../lib/wGrid/wGrid.js";

const $ = (selector) => document.querySelector(selector);
const logEl = $("#log");

const log = (message, type = "info") => {
  const timestamp = new Date().toISOString().slice(11, 19);
  const tag =
    type === "pass"
      ? "PASS"
      : type === "fail"
      ? "FAIL"
      : type === "warn"
      ? "WARN"
      : type === "error"
      ? "ERR "
      : "INFO";
  logEl.textContent += `[${timestamp}] ${tag} ${message}\n`;
  logEl.parentElement.scrollTop = logEl.parentElement.scrollHeight;
};

const clearLog = () => {
  logEl.textContent = "";
};

const cloneList = (list) => list.map((item) => ({ ...item }));

const sampleData = [
  { id: 1, name: "Alpha", qty: 5, status: "NEW", active: true, date: "2026-02-01" },
  { id: 2, name: "Bravo", qty: 8, status: "NEW", active: false, date: "2026-02-02" },
  { id: 3, name: "Charlie", qty: 12, status: "DONE", active: true, date: "2026-02-03" },
  { id: 4, name: "Delta", qty: 3, status: "HOLD", active: false, date: "" },
  { id: 5, name: "Echo", qty: 9, status: "DONE", active: true, date: "2026-02-05" },
];

const pagingData = Array.from({ length: 27 }, (_, i) => ({
  id: i + 1,
  name: `Item-${String(i + 1).padStart(2, "0")}`,
  qty: (i + 1) * 2,
  status: i % 3 === 0 ? "NEW" : i % 3 === 1 ? "DONE" : "HOLD",
  active: i % 2 === 0,
  date: `2026-02-${String((i % 28) + 1).padStart(2, "0")}`,
}));

const buildFields = (includeButton) => {
  const fields = [
    {
      name: "active",
      title: "",
      element: "checkbox",
      width: "48px",
      event: {
        change: {
          head: (event) => log(`head checkbox change -> ${event.target.checked}`),
          body: (event, row) => log(`row checkbox change -> ${row.id}`),
        },
      },
    },
    { name: "id", title: "ID", element: "text", width: "60px", align: "center" },
    {
      name: "name",
      title: "Name",
      element: "text",
      edit: "text",
      width: "160px",
      emptyText: "(empty)",
    },
    {
      name: "qty",
      title: "Qty",
      element: "number",
      edit: "number",
      width: "80px",
      align: "right",
    },
    {
      name: "status",
      title: "Status",
      element: "select",
      width: "110px",
      data: {
        select: {
          empty: "-",
          list: [
            { value: "NEW", text: "NEW" },
            { value: "DONE", text: "DONE" },
            { value: "HOLD", text: "HOLD" },
          ],
        },
      },
      event: {
        change: {
          body: (event, row) => log(`status change -> ${row.id}=${event.target.value}`),
        },
      },
    },
    { name: "date", title: "Date", element: "date", edit: "date", width: "120px" },
  ];

  if (includeButton) {
    fields.push({
      name: "action",
      title: "Action",
      element: "button",
      text: "Ping",
      width: "90px",
      event: {
        click: {
          body: (event, row) => log(`button click -> ${row.id}`),
        },
      },
    });
  }

  return fields;
};

let grid = null;
let gridMode = "basic";

const resetGrid = () => {
  $("#grid").innerHTML = "";
  grid = null;
};

const createGrid = ({ paging, includeButton }) => {
  resetGrid();
  gridMode = paging ? "paging" : "basic";

  try {
    grid = new window.wGrid("grid", {
      fields: buildFields(includeButton),
      option: {
        isHead: true,
        isPaging: paging,
        isDblClick: true,
        isRowStatusColor: true,
        isRowStatusObserve: true,
        rowStatusObserve: { isRowEditMode: false, exceptList: [] },
        style: {
          width: "100%",
          height: 360,
          overflow: { y: "auto", x: "hidden" },
          row: { cursor: "pointer", isChose: true },
        },
        checkbox: { check: true, uncheck: false },
      },
      event: {
        click: (event, row, index, seq) => {
          log(`outer click -> index=${index} seq=${seq}`);
        },
        change: (event, row, index) => {
          log(`outer change -> index=${index} field=${event.target.name}`);
        },
      },
      search: async (param) => {
        const pagingInfo = param?.paging ?? {
          pageNo: 1,
          pageSize: 5,
          pageBlock: 5,
          totalCount: pagingData.length,
        };
        const start = (pagingInfo.pageNo - 1) * pagingInfo.pageSize;
        const list = cloneList(pagingData.slice(start, start + pagingInfo.pageSize));
        return {
          list,
          param: { paging: { ...pagingInfo, totalCount: pagingData.length } },
        };
      },
      loaded: () => log("grid loaded"),
    });
    log(`grid created (mode=${gridMode}${includeButton ? ", button" : ""})`, "pass");
  } catch (err) {
    log(`grid create failed: ${err.message}`, "error");
    console.error(err);
    grid = null;
  }
};

const loadSampleData = () => {
  if (!grid) {
    log("init grid first", "warn");
    return;
  }
  if (gridMode === "paging") {
    const param = {
      paging: { pageNo: 1, pageSize: 5, pageBlock: 5, totalCount: pagingData.length },
    };
    grid.setData(cloneList(pagingData.slice(0, 5)), param);
  } else {
    grid.setData(cloneList(sampleData), {});
  }
  log("setData called");
};

const getRowSeqByIndex = (rowIdx) => {
  const rows = document.querySelectorAll("#grid .body table tr");
  if (!rows[rowIdx]) return null;
  return rows[rowIdx].dataset.rowSeq;
};

const runSmokeTests = () => {
  clearLog();
  log("smoke tests start");
  createGrid({ paging: false, includeButton: false });

  const step = (name, fn, expectError = false) => {
    try {
      fn();
      if (expectError) {
        log(`${name} expected error but passed`, "fail");
      } else {
        log(`${name}`, "pass");
      }
    } catch (err) {
      if (expectError) {
        log(`${name} threw as expected: ${err.message}`, "pass");
      } else {
        log(`${name} failed: ${err.message}`, "fail");
      }
    }
  };

  step("setData", () => grid.setData(cloneList(sampleData), {}));
  step("getData length", () => {
    const data = grid.getData();
    if (data.length !== sampleData.length) throw new Error(`length=${data.length}`);
  });

  step("getDataRowSeq (should be object)", () => {
    const seq = getRowSeqByIndex(0);
    const row = grid.getDataRowSeq(seq);
    if (!row) throw new Error("undefined row");
  });

  step("modifyRowIdx (expected error)", () => grid.modifyRowIdx(0), true);
  step("modifyRow (rowIdx+rowSeq)", () => {
    const seq = getRowSeqByIndex(0);
    if (!seq) throw new Error("missing rowSeq");
    grid.modifyRow(0, seq);
  });

  step("removeRowIdx (expected error)", () => grid.removeRowIdx(0), true);
  step("removeRow (rowIdx+rowSeq)", () => {
    const seq = getRowSeqByIndex(0);
    if (!seq) throw new Error("missing rowSeq");
    grid.removeRow(0, seq, { isDisabled: true });
  });

  step("cancelRow (rowIdx+rowSeq)", () => {
    const seq = getRowSeqByIndex(0);
    if (!seq) throw new Error("missing rowSeq");
    grid.cancelRow(0, seq);
  });

  step("deleteRow (rowIdx+rowSeq)", () => {
    const seq = getRowSeqByIndex(0);
    if (!seq) throw new Error("missing rowSeq");
    grid.deleteRow(0, seq);
  });

  step("getDeleteData (expected error)", () => grid.getDeleteData(), true);

  log("smoke tests end");
};

$("#btn-init").addEventListener("click", () =>
  createGrid({ paging: false, includeButton: false })
);
$("#btn-init-paging").addEventListener("click", () =>
  createGrid({ paging: true, includeButton: false })
);
$("#btn-init-button").addEventListener("click", () =>
  createGrid({ paging: false, includeButton: true })
);
$("#btn-load").addEventListener("click", loadSampleData);
$("#btn-append").addEventListener("click", () => {
  if (!grid) return log("init grid first", "warn");
  grid.appendRow();
  log("appendRow called");
});
$("#btn-prepend").addEventListener("click", () => {
  if (!grid) return log("init grid first", "warn");
  grid.prependRow();
  log("prependRow called");
});
$("#btn-modify").addEventListener("click", () => {
  if (!grid) return log("init grid first", "warn");
  const seq = getRowSeqByIndex(0);
  if (!seq) return log("row not found", "warn");
  grid.modifyRow(0, seq);
  log("modifyRow called");
});
$("#btn-modify-idx").addEventListener("click", () => {
  if (!grid) return log("init grid first", "warn");
  grid.modifyRowIdx(0);
  log("modifyRowIdx called");
});
$("#btn-remove").addEventListener("click", () => {
  if (!grid) return log("init grid first", "warn");
  const seq = getRowSeqByIndex(0);
  if (!seq) return log("row not found", "warn");
  grid.removeRow(0, seq, { isDisabled: true });
  log("removeRow called");
});
$("#btn-remove-idx").addEventListener("click", () => {
  if (!grid) return log("init grid first", "warn");
  grid.removeRowIdx(0);
  log("removeRowIdx called");
});
$("#btn-cancel").addEventListener("click", () => {
  if (!grid) return log("init grid first", "warn");
  const seq = getRowSeqByIndex(0);
  if (!seq) return log("row not found", "warn");
  grid.cancelRow(0, seq);
  log("cancelRow called");
});
$("#btn-delete").addEventListener("click", () => {
  if (!grid) return log("init grid first", "warn");
  const seq = getRowSeqByIndex(0);
  if (!seq) return log("row not found", "warn");
  grid.deleteRow(0, seq);
  log("deleteRow called");
});
$("#btn-get").addEventListener("click", () => {
  if (!grid) return log("init grid first", "warn");
  const data = grid.getData();
  log(`getData -> ${JSON.stringify(data, null, 2)}`);
});
$("#btn-tests").addEventListener("click", runSmokeTests);
$("#btn-clear-log").addEventListener("click", clearLog);
