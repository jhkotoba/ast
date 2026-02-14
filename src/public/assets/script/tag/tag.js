import { showToast } from "/ast/script/common/toast.js";

const btnAdd = document.getElementById("btnAdd");
const btnEdit = document.getElementById("btnEdit");
const btnRemove = document.getElementById("btnRemove");
const btnCancel = document.getElementById("btnCancel");
const btnApply = document.getElementById("btnApply");

function setStatus(message, isError = false) {
  showToast(message, { type: isError ? "error" : "success" });
}

async function apiRequest(method, url, body) {
  const response = await fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  if (response.status === 204) {
    return null;
  }

  const data = await response.json();
  if (!response.ok) {
    const message = data && data.error && data.error.message ? data.error.message : `HTTP ${response.status}`;
    throw new Error(message);
  }
  return data;
}

function normalizeCreateOrUpdate(row, requireName) {
  const tagName = String(row.tag_name || "")
    .trim()
    .replace(/\s+/g, " ");
  if (requireName && !tagName) {
    throw new Error("태그명은 필수입니다.");
  }

  const displayOrderRaw = row.display_order;
  const displayOrder =
    displayOrderRaw === undefined || displayOrderRaw === null || displayOrderRaw === ""
      ? 0
      : Number.parseInt(displayOrderRaw, 10);
  if (!Number.isFinite(displayOrder)) {
    throw new Error("정렬 순서는 정수여야 합니다.");
  }

  const payload = { display_order: displayOrder };
  if (tagName) {
    payload.tag_name = tagName;
  } else if (requireName) {
    payload.tag_name = tagName;
  }

  return payload;
}

const tagGrid = new window.wgrid("tag", {
  fields: [
    { title: null, element: "checkbox", name: "checked", edit: "checkbox", width: "4%", align: "center" },
    { title: "태그ID", element: "text", name: "tag_id", width: "10%" },
    { title: "태그명", element: "text", name: "tag_name", edit: "text", width: "32%" },
    { title: "정렬순서", element: "text", name: "display_order", edit: "text", width: "12%" },
    { title: "활성", element: "text", name: "is_active", width: "8%" },
    { title: "등록일시", element: "text", name: "created_at", width: "17%" },
    { title: "수정일시", element: "text", name: "updated_at", width: "17%" },
  ],
  option: {
    isPaging: true,
    pagingMode: "server",
    style: {
      height: 560,
      overflow: { y: "auto", x: "auto" },
      row: { cursor: "default" },
    },
  },
  data: {
    insert: {
      checked: false,
      display_order: 0,
      is_active: "true",
    },
  },
  search: async (params = {}) => {
    const paging = params.paging || { pageNo: 1, pageSize: 20, pageBlock: 5 };
    const query = new URLSearchParams({
      page_no: String(paging.pageNo || 1),
      page_size: String(paging.pageSize || 20),
      sort: "tag_id:desc",
    });

    const response = await apiRequest("GET", `/ast-api/tags?${query.toString()}`);
    const list = (response.data.list || []).map((item) => ({
      ...item,
      checked: false,
      is_active: String(item.is_active),
    }));
    return {
      list,
      param: {
        paging: {
          pageNo: response.data.page_no,
          pageSize: response.data.page_size,
          pageBlock: paging.pageBlock || 5,
          totalCount: response.data.total_count,
        },
      },
    };
  },
});

async function reloadList() {
  const result = await tagGrid.search();
  tagGrid.setData(result.list, result.param);
}

async function applyChanges() {
  const inserts = tagGrid.getInsertData();
  const updates = tagGrid.getUpdateData();
  const deletes = tagGrid.getDeleteData();

  if (inserts.length === 0 && updates.length === 0 && deletes.length === 0) {
    setStatus("변경사항이 없습니다.");
    return;
  }

  if (!window.confirm("변경사항을 반영할까요?")) {
    return;
  }

  try {
    for (const row of inserts) {
      const payload = normalizeCreateOrUpdate(row, true);
      await apiRequest("POST", "/ast-api/tags", payload);
    }

    for (const row of updates) {
      const payload = normalizeCreateOrUpdate(row, false);
      await apiRequest("PATCH", `/ast-api/tags/${row.tag_id}`, payload);
    }

    for (const row of deletes) {
      await apiRequest("DELETE", `/ast-api/tags/${row.tag_id}`);
    }

    await reloadList();
    setStatus(`반영 완료: 추가 ${inserts.length}, 수정 ${updates.length}, 삭제 ${deletes.length}`);
  } catch (error) {
    setStatus(error.message || "반영 실패", true);
  }
}

btnAdd.addEventListener("click", () => {
  tagGrid.prependRow();
  setStatus("행을 추가했습니다.");
});

btnEdit.addEventListener("click", () => {
  tagGrid.modifyRowCheckedElement("checked");
  setStatus("선택 행을 수정 모드로 전환했습니다.");
});

btnRemove.addEventListener("click", () => {
  if (!window.confirm("선택 행을 삭제 대상으로 표시할까요?")) {
    return;
  }
  tagGrid.removeRowCheckedElement("checked");
  setStatus("선택 행을 삭제 대상으로 표시했습니다.");
});

btnCancel.addEventListener("click", () => {
  tagGrid.cancelRowCheckedElement("checked");
  setStatus("선택 행 변경을 취소했습니다.");
});

btnApply.addEventListener("click", applyChanges);

window.addEventListener("DOMContentLoaded", async () => {
  try {
    await reloadList();
    setStatus("조회 완료");
  } catch (error) {
    setStatus(error.message || "조회 실패", true);
  }
});
