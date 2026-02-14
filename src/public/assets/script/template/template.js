import { showToast } from "/script/common/toast.js";

const AUTH_HEADERS = {
  "X-Auth-User-Id": "1",
  "X-Auth-Provider": "oe",
};

const mappingResultEl = document.getElementById("mappingResult");
const templateIdEl = document.getElementById("templateId");
const tagIdEl = document.getElementById("tagId");
const tagIdsEl = document.getElementById("tagIds");

const btnAdd = document.getElementById("btnAdd");
const btnEdit = document.getElementById("btnEdit");
const btnRemove = document.getElementById("btnRemove");
const btnCancel = document.getElementById("btnCancel");
const btnApply = document.getElementById("btnApply");
const btnUseChecked = document.getElementById("btnUseChecked");
const btnMapLoad = document.getElementById("btnMapLoad");
const btnMapAdd = document.getElementById("btnMapAdd");
const btnMapRemove = document.getElementById("btnMapRemove");
const btnMapReplace = document.getElementById("btnMapReplace");

function setStatus(message, isError = false) {
  showToast(message, { type: isError ? "error" : "success" });
}

function setMappingResult(value) {
  mappingResultEl.textContent = value;
}

async function apiRequest(method, url, body) {
  const response = await fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...AUTH_HEADERS,
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

function normalizeTemplatePayload(row, requireName) {
  const templateName = String(row.template_name || "").trim();
  if (requireName && !templateName) {
    throw new Error("템플릿명은 필수입니다.");
  }
  const defaultTitle = row.default_title === undefined || row.default_title === "" ? null : String(row.default_title);
  const defaultMemo = row.default_memo === undefined || row.default_memo === "" ? null : String(row.default_memo);

  const payload = {};
  if (templateName) payload.template_name = templateName;
  if (requireName && !payload.template_name) payload.template_name = templateName;
  payload.default_title = defaultTitle;
  payload.default_memo = defaultMemo;
  return payload;
}

const templateGrid = new window.wgrid("template", {
  fields: [
    { title: null, element: "checkbox", name: "checked", edit: "checkbox", width: "4%", align: "center" },
    { title: "template_id", element: "text", name: "template_id", width: "8%" },
    { title: "template_name", element: "text", name: "template_name", edit: "text", width: "24%" },
    { title: "default_title", element: "text", name: "default_title", edit: "text", width: "20%" },
    { title: "default_memo", element: "text", name: "default_memo", edit: "text", width: "20%" },
    { title: "is_active", element: "text", name: "is_active", width: "8%" },
    { title: "created_at", element: "text", name: "created_at", width: "14%" },
    { title: "updated_at", element: "text", name: "updated_at", width: "14%" },
  ],
  option: {
    isPaging: true,
    pagingMode: "server",
    style: {
      height: 400,
      overflow: { y: "auto", x: "auto" },
      row: { cursor: "default" },
    },
  },
  data: {
    insert: {
      checked: false,
      is_active: "true",
    },
  },
  search: async (params = {}) => {
    const paging = params.paging || { pageNo: 1, pageSize: 20, pageBlock: 5 };
    const query = new URLSearchParams({
      page_no: String(paging.pageNo || 1),
      page_size: String(paging.pageSize || 20),
      sort: "template_id:desc",
    });
    const response = await apiRequest("GET", `/api/transaction_templates?${query.toString()}`);
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
  const result = await templateGrid.search();
  templateGrid.setData(result.list, result.param);
}

async function applyChanges() {
  const inserts = templateGrid.getInsertData();
  const updates = templateGrid.getUpdateData();
  const deletes = templateGrid.getDeleteData();

  if (inserts.length === 0 && updates.length === 0 && deletes.length === 0) {
    setStatus("변경사항이 없습니다.");
    return;
  }

  if (!window.confirm("변경사항을 반영할까요?")) {
    return;
  }

  try {
    for (const row of inserts) {
      const payload = normalizeTemplatePayload(row, true);
      await apiRequest("POST", "/api/transaction_templates", payload);
    }

    for (const row of updates) {
      const payload = normalizeTemplatePayload(row, false);
      await apiRequest("PATCH", `/api/transaction_templates/${row.template_id}`, payload);
    }

    for (const row of deletes) {
      await apiRequest("DELETE", `/api/transaction_templates/${row.template_id}`);
    }

    await reloadList();
    setStatus(`반영 완료: 추가 ${inserts.length}, 수정 ${updates.length}, 삭제 ${deletes.length}`);
  } catch (error) {
    setStatus(error.message || "반영 실패", true);
  }
}

function getTemplateIdOrThrow() {
  const templateId = String(templateIdEl.value || "").trim();
  if (!templateId) {
    throw new Error("template_id를 입력하세요.");
  }
  return templateId;
}

function parseTagIdsText() {
  const text = String(tagIdsEl.value || "").trim();
  if (!text) {
    return [];
  }
  return text
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

async function loadMappings() {
  const templateId = getTemplateIdOrThrow();
  const response = await apiRequest("GET", `/api/transaction_templates/${templateId}/tags?page_no=1&page_size=100`);
  setMappingResult(JSON.stringify(response.data.list || [], null, 2));
}

async function addMapping() {
  const templateId = getTemplateIdOrThrow();
  const tagId = String(tagIdEl.value || "").trim();
  if (!tagId) {
    throw new Error("tag_id를 입력하세요.");
  }
  await apiRequest("POST", `/api/transaction_templates/${templateId}/tags`, { tag_id: tagId });
  await loadMappings();
}

async function removeMapping() {
  const templateId = getTemplateIdOrThrow();
  const tagId = String(tagIdEl.value || "").trim();
  if (!tagId) {
    throw new Error("tag_id를 입력하세요.");
  }
  await apiRequest("DELETE", `/api/transaction_templates/${templateId}/tags/${tagId}`);
  await loadMappings();
}

async function replaceMappings() {
  const templateId = getTemplateIdOrThrow();
  const tagIds = parseTagIdsText();
  await apiRequest("PATCH", `/api/transaction_templates/${templateId}/tags`, { tag_ids: tagIds });
  await loadMappings();
}

function useCheckedTemplateId() {
  try {
    const checked = templateGrid.getNameCheckedItems("checked");
    if (Array.isArray(checked) && checked.length > 0) {
      templateIdEl.value = checked[0].template_id || "";
      setStatus("선택 행 template_id를 입력했습니다.");
      return;
    }
  } catch (error) {
    // no-op fallback below
  }
  setStatus("체크된 행이 없습니다.", true);
}

btnAdd.addEventListener("click", () => {
  templateGrid.prependRow();
  setStatus("행을 추가했습니다.");
});
btnEdit.addEventListener("click", () => {
  templateGrid.modifyRowCheckedElement("checked");
  setStatus("선택 행을 수정 모드로 전환했습니다.");
});
btnRemove.addEventListener("click", () => {
  if (!window.confirm("선택 행을 삭제 대상으로 표시할까요?")) return;
  templateGrid.removeRowCheckedElement("checked");
  setStatus("선택 행을 삭제 대상으로 표시했습니다.");
});
btnCancel.addEventListener("click", () => {
  templateGrid.cancelRowCheckedElement("checked");
  setStatus("선택 행 변경을 취소했습니다.");
});
btnApply.addEventListener("click", applyChanges);
btnUseChecked.addEventListener("click", useCheckedTemplateId);

btnMapLoad.addEventListener("click", async () => {
  try {
    await loadMappings();
    setStatus("매핑 조회 완료");
  } catch (error) {
    setStatus(error.message || "매핑 조회 실패", true);
  }
});

btnMapAdd.addEventListener("click", async () => {
  try {
    await addMapping();
    setStatus("매핑 추가 완료");
  } catch (error) {
    setStatus(error.message || "매핑 추가 실패", true);
  }
});

btnMapRemove.addEventListener("click", async () => {
  try {
    await removeMapping();
    setStatus("매핑 삭제 완료");
  } catch (error) {
    setStatus(error.message || "매핑 삭제 실패", true);
  }
});

btnMapReplace.addEventListener("click", async () => {
  try {
    await replaceMappings();
    setStatus("매핑 세트 교체 완료");
  } catch (error) {
    setStatus(error.message || "매핑 교체 실패", true);
  }
});

window.addEventListener("DOMContentLoaded", async () => {
  try {
    await reloadList();
    setMappingResult("[]");
    setStatus("조회 완료");
  } catch (error) {
    setStatus(error.message || "조회 실패", true);
  }
});

