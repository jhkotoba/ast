# wgrid API Guide (AI-Oriented)

Source of truth: `src/wgrid.js` (version `0.12.2`)

## Quick Start

```js
import wgrid from "./src/wgrid.js";

const grid = new wgrid("grid", {
  fields: [
    { name: "id", title: "ID", element: "text" },
    { name: "name", title: "Name", element: "text-edit" },
  ],
  option: {
    isHead: true,
    isPaging: false,
    isRowStatusColor: true,
    style: {
      width: "100%",
      height: 360,
      overflow: { y: "auto", x: "hidden" },
      row: { cursor: "default", isChose: false },
    },
  },
  event: {
    change: (event, row, rowIdx, rowSeq) => {
      console.log(event.type, row, rowIdx, rowSeq);
    },
  },
  loaded: (instance) => {
    console.log("wgrid loaded", instance);
  },
});

grid.setData([{ id: 1, name: "Alpha" }], {});
```

## Core Concepts

- `rowIdx`: current row index in rendered data (0-based).
- `rowSeq`: internal stable sequence key (`_rowSeq`) assigned by wgrid.
- `_state`: row state string.
  - `SELECT`: unchanged/base row
  - `INSERT`: newly added row
  - `UPDATE`: modified row
  - `REMOVE`: marked for delete

## Constructor

### `new wgrid(target, parameter)`
- Signature: `new wgrid(target: string, parameter: object)`
- Params:
  - `target`: DOM element id.
  - `parameter.fields`: column schema array.
  - `parameter.option`: grid options.
  - `parameter.event`: global row/cell event callbacks (`click`, `change`, `keyup`, `dblclick`).
  - `parameter.search`: async search callback used by `search()` and pagination.
  - `parameter.data.insert`: optional default values for newly inserted rows.
  - `parameter.loaded`: callback invoked after initial render.
- Returns: `wgrid` instance.
- State change: initializes repository, status, option, plugins, event watchers.
- Side effects: builds grid DOM under target; binds listeners; exposes `window.wgrid` in browser builds.
- Example:
  ```js
  const grid = new wgrid("grid", { fields, option, event, search, loaded });
  ```
- Related methods: `setData`, `search`, `getData`, `getPagingData`.

## API Reference

### `search`

#### `search(params)`
- Signature: `search(params: any)`
- Params: user-defined search param object.
- Returns: whatever `parameter.search` returns (typically `Promise<{ list, param }>`).
- State change: none by itself.
- Side effects: calls the registered `parameter.search` callback.
- Example:
  ```js
  const result = await grid.search({ filter: {}, paging: { pageNo: 1, pageSize: 20 } });
  grid.setData(result.list, result.param);
  ```
- Related methods: `setData`, `getPagingData`.

### Data Access and Loading

#### `getData()`
- Signature: `getData()`
- Params: none.
- Returns: deep-cloned row list.
- State change: none.
- Side effects: none.
- Example:
  ```js
  const rows = grid.getData();
  ```
- Related methods: `getDataRowSeq`, `getDataIndex`.

#### `getPagingData()`
- Signature: `getPagingData()`
- Params: none.
- Returns: paging object from repository param (`pageNo`, `pageSize`, `pageBlock`, `totalCount`) when available.
- State change: none.
- Side effects: none.
- Example:
  ```js
  const paging = grid.getPagingData();
  ```
- Related methods: `search`, `setData`.

#### `setData(list, param)`
- Signature: `setData(list: array, param?: object)`
- Params:
  - `list`: source rows.
  - `param`: request/result metadata; for paging, include `param.paging`.
- Returns: `void`.
- State change:
  - assigns `_rowSeq`, `_state = SELECT` to loaded rows.
  - resets origin snapshot.
  - in client paging mode, stores full source in paging cache.
- Side effects: rerenders grid body and pagination.
- Example:
  ```js
  grid.setData(data.list, { paging: { pageNo: 1, pageSize: 20, totalCount: 120 } });
  ```
- Related methods: `search`, `getPagingData`, `getApplyData`.

#### `getDataRowSeq(rowSeq)`
- Signature: `getDataRowSeq(rowSeq: string | number)`
- Params: `rowSeq`.
- Returns: row object for given sequence.
- State change: none.
- Side effects: none.
- Example:
  ```js
  const row = grid.getDataRowSeq(12);
  ```
- Related methods: `getRowElementRowSeq`, `getSeqCellElement`.

#### `getDataIndex(index)`
- Signature: `getDataIndex(index: number)`
- Params: `index`.
- Returns: row object at index.
- State change: none.
- Side effects: none.
- Example:
  ```js
  const first = grid.getDataIndex(0);
  ```
- Related methods: `getDataRowSeq`.

#### `getSelectData()`
- Signature: `getSelectData()`
- Params: none.
- Returns: rows with `_state === "SELECT"`.
- State change: none.
- Side effects: none.
- Example:
  ```js
  const unchanged = grid.getSelectData();
  ```
- Related methods: `getInsertData`, `getUpdateData`, `getDeleteData`, `getApplyData`.

#### `getInsertData()`
- Signature: `getInsertData()`
- Params: none.
- Returns: rows with `_state === "INSERT"`.
- State change: none.
- Side effects: none.
- Example:
  ```js
  const inserts = grid.getInsertData();
  ```
- Related methods: `appendRow`, `prependRow`.

#### `getUpdateData()`
- Signature: `getUpdateData()`
- Params: none.
- Returns: rows with `_state === "UPDATE"`.
- State change: none.
- Side effects: none.
- Example:
  ```js
  const updates = grid.getUpdateData();
  ```
- Related methods: `modifyRow`, `modifyRowElement`.

#### `getDeleteData()`
- Signature: `getDeleteData()`
- Params: none.
- Returns: rows with `_state === "REMOVE"`.
- State change: none.
- Side effects: none.
- Example:
  ```js
  const removes = grid.getDeleteData();
  ```
- Related methods: `removeRow`, `removeRowElement`.

#### `getApplyData()`
- Signature: `getApplyData()`
- Params: none.
- Returns: rows where `_state !== "SELECT"`.
- State change: none.
- Side effects: none.
- Example:
  ```js
  const pending = grid.getApplyData();
  ```
- Related methods: `getInsertData`, `getUpdateData`, `getDeleteData`.

### Row Creation

#### `prependRow()`
- Signature: `prependRow()`
- Params: none.
- Returns: `void`.
- State change: creates a new row with `_state = INSERT` and default values.
- Side effects: inserts a new row element at top of tbody.
- Example:
  ```js
  grid.prependRow();
  ```
- Related methods: `appendRow`, `getInsertData`.

#### `appendRow()`
- Signature: `appendRow()`
- Params: none.
- Returns: `void`.
- State change: creates a new row with `_state = INSERT` and default values.
- Side effects: appends a new row element at bottom of tbody.
- Example:
  ```js
  grid.appendRow();
  ```
- Related methods: `prependRow`, `getInsertData`.

### DOM and Cell Access

#### `getFirstRowElement()`
- Signature: `getFirstRowElement()`
- Params: none.
- Returns: first row `TR` element.
- State change: none.
- Side effects: none.
- Example:
  ```js
  const tr = grid.getFirstRowElement();
  ```
- Related methods: `getFirstRowSeq`.

#### `getFirstRowSeq()`
- Signature: `getFirstRowSeq()`
- Params: none.
- Returns: first row sequence.
- State change: none.
- Side effects: none.
- Example:
  ```js
  const seq = grid.getFirstRowSeq();
  ```
- Related methods: `getFirstRowElement`, `getRowElementRowSeq`.

#### `getRowElementRowSeq(rowSeq)`
- Signature: `getRowElementRowSeq(rowSeq: string | number)`
- Params: `rowSeq`.
- Returns: `TR` element for the row.
- State change: none.
- Side effects: none.
- Example:
  ```js
  const tr = grid.getRowElementRowSeq(15);
  ```
- Related methods: `getDataRowSeq`, `getSeqCellElement`.

#### `getSeqCellElement(rowSeq, name)`
- Signature: `getSeqCellElement(rowSeq: string | number, name: string)`
- Params: `rowSeq`, column `name`.
- Returns: cell input/select/button/span element.
- State change: none.
- Side effects: none.
- Example:
  ```js
  const input = grid.getSeqCellElement(15, "name");
  ```
- Related methods: `getCheckedElement`, `setAllChecked`.

### Checkbox and Selection Helpers

#### `getCheckedElement(name)`
- Signature: `getCheckedElement(name: string)`
- Params: checkbox field name.
- Returns: list of checked checkbox elements.
- State change: none.
- Side effects: none.
- Example:
  ```js
  const checkedEls = grid.getCheckedElement("checked");
  ```
- Related methods: `getNameCheckedSeqs`, `getNameCheckedItems`.

#### `setAllChecked(name, bool)`
- Signature: `setAllChecked(name: string, bool: boolean)`
- Params: checkbox field `name`, target checked state.
- Returns: `void`.
- State change: updates row data for the checkbox field.
- Side effects: toggles checkbox DOM elements for all rows.
- Example:
  ```js
  grid.setAllChecked("checked", true);
  ```
- Related methods: `getCheckedElement`, `getNameCheckedSeqs`.

#### `getNameCheckedSeqs(name)`
- Signature: `getNameCheckedSeqs(name: string)`
- Params: checkbox field name.
- Returns: `rowSeq[]` for checked rows.
- State change: none.
- Side effects: none.
- Example:
  ```js
  const seqs = grid.getNameCheckedSeqs("checked");
  ```
- Related methods: `getNameCheckedItems`, `removeRowCheckedElement`.

#### `getNameCheckedItems(name)`
- Signature: `getNameCheckedItems(name: string)`
- Params: checkbox field name.
- Returns: deep-cloned checked row item list.
- State change: none.
- Side effects: none.
- Example:
  ```js
  const items = grid.getNameCheckedItems("checked");
  ```
- Related methods: `getNameCheckedSeqs`, `cancelRowCheckedElement`, `modifyRowCheckedElement`.

### Option Mutation

#### `changeOption(optionName, value)`
- Signature: `changeOption(optionName: string, value: any)`
- Params:
  - `optionName`: property path after `self.` (for example `option.isHead`).
  - `value`: value to assign. Primitive/object values are supported directly. String inputs still accept legacy forms like `"'client'"` or `"false"`.
- Returns: `void`.
- State change: mutates runtime option value.
- Side effects: throws on invalid/unsafe path (for example `__proto__` path segments).
- Example:
  ```js
  grid.changeOption("option.pagingMode", "client");
  grid.changeOption("option.isRowStatusColor", false);
  // legacy input format still works:
  grid.changeOption("option.pagingMode", "'client'");
  ```
- Related methods: constructor options.

### Cancel APIs

#### `cancelRowSeq(rowSeq)`, `cancelRowIdx(rowIdx)`, `cancelRow(rowIdx, rowSeq)`
- Signature:
  - `cancelRowSeq(rowSeq: string | number)`
  - `cancelRowIdx(rowIdx: number)`
  - `cancelRow(rowIdx: number, rowSeq: string | number)`
- Params: row identifier by seq, idx, or both.
- Returns: `void`.
- State change: cancels row status mark (`UPDATE` or `REMOVE`) back to `SELECT` where applicable.
- Side effects: removes row status classes, re-enables disabled cells.
- Example:
  ```js
  grid.cancelRowSeq(10);
  ```
- Related methods: `cancelRowElement*`, `applyModifyAndCancel*`.

#### `cancelRowCheckedElement(name)`
- Signature: `cancelRowCheckedElement(name: string)`
- Params: checkbox field name.
- Returns: `void`.
- State change:
  - `INSERT` row: physically deleted.
  - `UPDATE` row: restores snapshot and becomes `SELECT`.
  - `REMOVE` row: becomes `SELECT`.
- Side effects: may rebuild row cells and remove status classes.
- Example:
  ```js
  grid.cancelRowCheckedElement("checked");
  ```
- Related methods: `cancelRowElementRowSeqs`, `cancelRowElementRowIdxs`.

#### `cancelRowElementRowSeqs(rowSeqList)`, `cancelRowElementRowIdxs(rowIdxList)`, `cancelRowElementRowSeq(rowSeq)`, `cancelRowElementRowIdx(rowIdx)`
- Signature:
  - `cancelRowElementRowSeqs(rowSeqList: (string | number)[])`
  - `cancelRowElementRowIdxs(rowIdxList: number[])`
  - `cancelRowElementRowSeq(rowSeq: string | number)`
  - `cancelRowElementRowIdx(rowIdx: number)`
- Params: row collections or single row identifiers.
- Returns: `void`.
- State change: same cancel semantics as above, with row-element-aware flow.
- Side effects: row DOM may be rebuilt from stored edit snapshots.
- Example:
  ```js
  grid.cancelRowElementRowIdxs([0, 2, 3]);
  ```
- Related methods: `modifyRowElement*`, `removeRowElement*`.

### Modify Detection and Conditional Apply

#### `isRowModifyRowSeq(rowSeq, option)`, `isRowModifyRowIdx(rowIdx, option)`, `isRowModify(rowIdx, rowSeq, option)`
- Signature:
  - `isRowModifyRowSeq(rowSeq: string | number, option?: { exceptList?: string[] })`
  - `isRowModifyRowIdx(rowIdx: number, option?: { exceptList?: string[] })`
  - `isRowModify(rowIdx: number, rowSeq: string | number, option?: { exceptList?: string[] })`
- Params: row key(s), optional compare option.
- Returns: `boolean`.
- State change: none.
- Side effects: compares current data against origin snapshot.
- Example:
  ```js
  const changed = grid.isRowModifyRowSeq(12, { exceptList: ["updatedAt"] });
  ```
- Related methods: `applyModifyAndCancel*`, `modifyRow*`, `cancelRow*`.

#### `applyModifyAndCancelRowIdx(rowIdx, option)`, `applyModifyAndCancelRowSeq(rowSeq, option)`, `applyModifyAndCancel(rowIdx, rowSeq, option)`
- Signature:
  - `applyModifyAndCancelRowIdx(rowIdx: number, option?: { exceptList?: string[], isRowEditMode?: boolean })`
  - `applyModifyAndCancelRowSeq(rowSeq: string | number, option?: { exceptList?: string[], isRowEditMode?: boolean })`
  - `applyModifyAndCancel(rowIdx: number, rowSeq: string | number, option?: { exceptList?: string[], isRowEditMode?: boolean })`
- Params: row identifier(s), compare/apply option.
- Returns: `void`.
- State change:
  - if modified: marks row as `UPDATE`.
  - if not modified: cancels update/remove mark to `SELECT`.
- Side effects: may switch row into element edit mode when `isRowEditMode === true`.
- Example:
  ```js
  grid.applyModifyAndCancelRowSeq(12, { exceptList: ["updatedAt"], isRowEditMode: false });
  ```
- Related methods: `isRowModify*`, `modifyRow*`, `cancelRow*`.

### Modify State APIs

#### `modifyRowIdx(rowIdx)`, `modifyRowSeq(rowSeq)`, `modifyRow(rowIdx, rowSeq)`
- Signature:
  - `modifyRowIdx(rowIdx: number)`
  - `modifyRowSeq(rowSeq: string | number)`
  - `modifyRow(rowIdx: number, rowSeq: string | number)`
- Params: row identifier(s).
- Returns: `void`.
- State change: sets row `_state = UPDATE`.
- Side effects: applies update status CSS class when enabled.
- Example:
  ```js
  grid.modifyRowIdx(0);
  ```
- Related methods: `isRowModify*`, `modifyRowElement*`.

#### `modifyRowCheckedElement(name)`
- Signature: `modifyRowCheckedElement(name: string)`
- Params: checkbox field name.
- Returns: `void`.
- State change: checked rows become `UPDATE` (except rows already `INSERT`).
- Side effects: stores per-row edit snapshots; rebuilds row cells in edit mode.
- Example:
  ```js
  grid.modifyRowCheckedElement("checked");
  ```
- Related methods: `modifyRowElement*`, `cancelRowElement*`.

#### `modifyRowElementRowIdxs(rowIdxList)`, `modifyRowElementRowSeqs(rowSeqList)`, `modifyRowElementRowIdx(rowIdx)`, `modifyRowElementRowSeq(rowSeq)`, `modifyRowElement(rowIdx, rowSeq)`
- Signature:
  - `modifyRowElementRowIdxs(rowIdxList: number[])`
  - `modifyRowElementRowSeqs(rowSeqList: (string | number)[])`
  - `modifyRowElementRowIdx(rowIdx: number)`
  - `modifyRowElementRowSeq(rowSeq: string | number)`
  - `modifyRowElement(rowIdx: number, rowSeq: string | number)`
- Params: row collection/single identifiers.
- Returns: `void`.
- State change: switches rows to `_state = UPDATE` (with insert/remove special handling).
- Side effects: stores original values in edit snapshot; rebuilds row DOM using edit cell types.
- Example:
  ```js
  grid.modifyRowElementRowSeqs([11, 12]);
  ```
- Related methods: `cancelRowElement*`, `applyModifyAndCancel*`.

### Remove and Delete APIs

#### `removeRowIdx(rowIdx, option)`, `removeRowSeq(rowSeq, option)`, `removeRow(rowIdx, rowSeq, option)`
- Signature:
  - `removeRowIdx(rowIdx: number, option?: { isDisabled?: boolean, exceptDisabledList?: string[] })`
  - `removeRowSeq(rowSeq: string | number, option?: { isDisabled?: boolean, exceptDisabledList?: string[] })`
  - `removeRow(rowIdx: number, rowSeq: string | number, option?: { isDisabled?: boolean, exceptDisabledList?: string[] })`
- Params: row identifier(s), optional disable rules.
- Returns: `void`.
- State change: sets row `_state = REMOVE`.
- Side effects: disables row cell elements by default; applies remove CSS class.
- Example:
  ```js
  grid.removeRowSeq(21, { isDisabled: true, exceptDisabledList: ["checked"] });
  ```
- Related methods: `getDeleteData`, `removeRowElement*`, `deleteRow*`.

#### `removeRowCheckedElement(name)`
- Signature: `removeRowCheckedElement(name: string)`
- Params: checkbox field name.
- Returns: `void`.
- State change: checked rows follow remove-row-element logic.
- Side effects: row class/UI updates, and insert rows may be physically deleted.
- Example:
  ```js
  grid.removeRowCheckedElement("checked");
  ```
- Related methods: `removeRowElementRowSeqs`, `removeRowElementRowIdxs`.

#### `removeRowElementRowIdxs(rowIdxList)`, `removeRowElementRowSeqs(rowSeqList)`, `removeRowElementRowIdx(rowIdx)`, `removeRowElementRowSeq(rowSeq)`, `removeRowElement(rowIdx, rowSeq)`
- Signature:
  - `removeRowElementRowIdxs(rowIdxList: number[])`
  - `removeRowElementRowSeqs(rowSeqList: (string | number)[])`
  - `removeRowElementRowIdx(rowIdx: number)`
  - `removeRowElementRowSeq(rowSeq: string | number)`
  - `removeRowElement(rowIdx: number, rowSeq: string | number)`
- Params: row collection/single identifiers.
- Returns: `void`.
- State change:
  - `INSERT` row: physically deleted.
  - `SELECT` row: becomes `REMOVE`.
  - `UPDATE` row: transitions through cancel/remove element flow.
- Side effects: updates row classes and may remove row DOM.
- Example:
  ```js
  grid.removeRowElementRowIdxs([0, 1]);
  ```
- Related methods: `removeRow*`, `cancelRowElement*`, `deleteRow*`.

#### `deleteRowIdx(rowIdx)`, `deleteRowSeq(rowSeq)`, `deleteRow(rowIdx, rowSeq)`
- Signature:
  - `deleteRowIdx(rowIdx: number)`
  - `deleteRowSeq(rowSeq: string | number)`
  - `deleteRow(rowIdx: number, rowSeq: string | number)`
- Params: row identifier(s).
- Returns: `void`.
- State change: permanently removes row from in-memory data.
- Side effects: removes row DOM immediately and reindexes internal maps.
- Example:
  ```js
  grid.deleteRowSeq(33);
  ```
- Related methods: `removeRow*`, `removeRowElement*`.

## Paging Notes

- To use paging UI:
  - set `option.isPaging = true`.
  - set `option.pagingMode = "client" | "server"`.
  - pass paging metadata through `setData(list, { paging })`.
- Server mode pagination buttons call `parameter.search(parameter)` and then `setData(result.list, result.param)` internally.
- Client mode stores full source data and slices rows by `pageNo`/`pageSize`.

## Recommended AI Usage Recipes

### Recipe: Load and apply changes
```js
const result = await grid.search({ filter, paging: { pageNo: 1, pageSize: 20 } });
grid.setData(result.list, result.param);

// ... user edits / insert / remove ...
const applyList = grid.getApplyData();
await api.apply(applyList);
```

### Recipe: Auto update/cancel based on actual changes
```js
grid.applyModifyAndCancelRowSeq(rowSeq, {
  exceptList: ["updatedAt"],
  isRowEditMode: false,
});
```

## Known Caveats

- For row modification checks, `isRowModifyRowSeq` and `isRowModifyRowIdx` should be called by their method intent (`rowSeq` vs `rowIdx`).
- `deleteRow*` is hard delete in memory/DOM; use `removeRow*` when you need soft delete state (`REMOVE`).
