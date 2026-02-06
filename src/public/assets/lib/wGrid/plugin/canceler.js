import { util } from './util.js';
import { constant } from "./constant.js";
import { reposit } from "./reposit.js";
import { status } from "./status.js";
import { creator } from "./creator.js";
import { deleter } from "./deleter.js";
import { amender } from "./amender.js";

/**
 * 그리드 취소 관련 객체
 */
export const canceler = {

    /**
     * 그리드 취소 관련 객체 초기설정
     * @param {*} self
     * @returns 
     */
    init: (self) => init(self),

    /**
     * 수정/삭제 상태를 취소
     * @param {*} self 
     * @param {number/string} rowSeq    행 시퀀스
     */
    cancelRowSeq: (self, rowSeq) => cancelRow(self, status.getSeqIndex(self, rowSeq), rowSeq),

    /**
     * 수정/삭제 상태를 취소
     * @param {*} self 
     * @param {number} rowIdx    행 IDX
     */
    cancelRowIdx: (self, rowIdx) => cancelRow(self, rowIdx, status.getIdxSequence(self, rowIdx)),

    /**
     * 수정/삭제 상태를 취소
     * @param {*} self 
     * @param {number/string} rowSeq    행 시퀀스
     * @param {number} rowIdx    행 IDX
     */
    cancelRow: (self, rowIdx, rowSeq) => cancelRow(self, rowIdx, rowSeq),

    /**
     * 선택한 체크박스의 행을 편집,삭제 상태로 부터 복원
     * @param {*} self
     * @param {string} name 필드명
     * @returns 
     */
    cancelRowCheckedElement: (self, name) => cancelRowElement(self, null, status.getNameCheckedSeqs(self, name)),

    /**
     * 행을 편집,삭제 상태로 부터 복원 (rowIdxList)
     * @param {*} self
     * @param {Array} rowIdxList 
     */
    cancelRowElementRowIdxs: (self, rowIdxList) => cancelRowElement(self, rowIdxList, null),

    /**
     * 행을 편집,삭제 상태로 부터 복원 (rowSeqList)
     * @param {*} self
     * @param {Array} rowSeqList 
     */
    cancelRowElementRowSeqs: (self, rowSeqList) => cancelRowElement(self, null, rowSeqList),

    /**
     * 행을 편집,삭제 상태로 부터 복원 (rowIdx)
     * @param {*} self
     * @param {number} rowIdx 
     */
    cancelRowElementRowIdx: (self, rowIdx) => cancelRowElement(self, [rowIdx], null),    

    /**
     * 행을 편집,삭제 상태로 부터 복원 (rowSeq)
     * @param {*} self
     * @param {number} rowSeq 
     */
    cancelRowElementRowSeq: (self, rowSeq) => cancelRowElement(self, null, [rowSeq]),    

    /**
     * 행을 편집,삭제 상태로 부터 복원
     * @param {*} self
     * @param {number} rowIdx 
     */
    cancelRowElement: (self, rowIdx, rowSeq) => cancelRowElement(self, [rowIdx], [rowSeq]),
}

/**
 * 취소객체 초기화
 * @param {*} self 
 */
const init = (self) => {}

/**
 * 수정/삭제 상태를 취소
 * @param {*} self 
 * @param {number} rowIdx 행 IDX
 * @param {number/string} rowSeq 행 시퀀스
 */
const cancelRow = (self, rowIdx, rowSeq) => {

    // 행 엘리먼트
    let rowElement = status.getSeqRowElement(self, rowSeq);
    let data = reposit.getData(self);
            
    // style class 삭제
    if(self.option.isRowStatusColor == true){
        if(data[rowIdx]._state == constant.row.status.update){
            rowElement.classList.remove(constant.class.row.update);
        }else if(data[rowIdx]._state == constant.row.status.remove){
            rowElement.classList.remove(constant.class.row.remove);
        }
    }

    // Disabled 해제
    reposit.getFields(self).forEach(field => status.getSeqCellElement(self, rowSeq, field.name).disabled = false);

    // 데이터 행상태 값 변경
    if(rowElement.classList.contains(constant.class.row.update)){
        data[rowIdx]._state = constant.row.status.update;
    }else{
        data[rowIdx]._state = constant.row.status.select;
    }
}

/**
 * 행을 편집,삭제 상태로 부터 복원
 * @param {*} self
 * @param {numberList} rowIdxList
 * @param {stringList} rowSeqList
 */
const cancelRowElement = (self, rowIdxList, rowSeqList) => {

    // 키값 조회
    if(rowIdxList === null){
        rowIdxList = [];
        rowSeqList.forEach(rowSeq => rowIdxList.push(status.getSeqIndex(self, rowSeq)));
    }else if(rowSeqList === null){
        rowSeqList = [];
        rowIdxList.forEach(rowIdx => rowSeqList.push(status.setIdxSequence(self, rowIdx)));
    }

    let row = null;
    let rowIdx = null;
    let rowSeq = null;
    let data = null;
    let editData = amender.getEditData(self);

    for(let i=0; i<rowIdxList.length; i++){

        rowSeq = rowSeqList[i];
        rowIdx = status.getSeqIndex(self, rowSeq);
        row = status.getSeqRowElement(self, rowSeq);
        data = reposit.getData(self, rowIdx);

        switch(data._state){
        // 등록상태 취소(삭제)
        case constant.row.status.insert:
            deleter.removeRowElement(self, rowIdx, rowSeq);
            break;
        // 편집상태 취소(편집의 경우 행 재생성)
        case constant.row.status.update:
            // 원본 데이터로 돌림
            for(let key in editData[rowSeq]){
                data[key] = editData[rowSeq][key];
            }
            delete editData[rowSeq];

            // 데이터 상태 조회로 변경
            data._state = constant.row.status.select;

            // 자식노드 비우기
            util.elementEmpty(row);

            // cell 생성후 태그 연결
            let loaded = [];
            reposit.getFields(self).forEach((field, idx) => row.appendChild(creator.createCell(self, data, rowIdx, field, idx, loaded)));
            // 행생성후 loaded함수 호출
            loaded.forEach(item => item.fn(item.tag, item.row));

            break;
        // 삭제상태 취소
        case constant.row.status.remove:
            // 데이터 상태 조회로 변경
            data._state = constant.row.status.select;
            break;
        }

        if(self.option.isRowStatusColor == true){
            // ROW스타일 row 태그 스타일 삭제            
            row.classList.remove(constant.class.row.update);
            row.classList.remove(constant.class.row.remove);
        }
    }
}
