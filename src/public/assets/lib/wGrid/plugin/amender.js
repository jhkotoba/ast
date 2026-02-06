import { util } from './util.js';
import { constant } from "./constant.js";
import { reposit } from "./reposit.js";
import { status } from "./status.js";
import { creator } from "./creator.js";
import { canceler } from "./canceler.js";

let editData = {};

/**
 * 그리드 수정 관련 객체
 */
export const amender = {

    /**
     * 그리드 수정 관련 객체 초기설정
     * @param {*} self
     * @returns 
     */
    init: (self) => init(self),

    /**
     * 수정 데이터 조회
     * @param {*} self 
     * @returns 
     */
    getEditData: (self) => editData[self.sequence],

    /**
     * 행의 변경상태를 체크 (index)
     * @param {*} self
     * @param {number} rowIdx 
     * @param {*} option
     * @returns 
     */
    isRowModifyRowIdx: (self, rowIdx, option) => isRowModify(self, rowIdx, status.getIdxSequence(self, rowIdx), option),

    /**
     * 행의 변경상태를 체크 (sequence)
     * @param {*} self
     * @param {string/number} rowSeq 
     * @param {*} option
     * @returns 
     */
    isRowModifyRowSeq: (self, rowSeq, option) => isRowModify(self, status.getSeqIndex(self, rowSeq), rowSeq, option),

    /**    
     * 행의 변경상태를 체크
     * @param {*} self
     * @param {number} rowIdx 
     * @param {string/number} rowSeq 
     * @param {*} option
     * @returns 
     */
    isRowModify: (self, rowIdx, rowSeq, option) => isRowModify(self, rowIdx, rowSeq, option),

    /**
     * 수정 상태로 변경(index)
     * @param {*} self
     * @param {*} rowIdx
     */
    modifyRowIdx: (self, rowIdx) => modifyRow(self, rowIdx, status.getIdxSequence(self, rowIdx)),

    /**
     * 수정 상태로 변경(sequence)
     * @param {*} self
     * @param {*} rowSeq
     */
    modifyRowSeq: (self, rowSeq) => modifyRow(self, status.getSeqIndex(self, rowSeq), rowSeq),

    /**
     * 수정 상태로 변경
     * @param {*} self
     * @param {*} rowIdx
     * @param {*} rowSeq
     */
    modifyRow: (self, rowIdx, rowSeq) => modifyRow(self, rowIdx, rowSeq),

    /**
     * 선택한 체크박스의 행을 편집상태로 변환 - 태그 재생성
     * @param {*} self
     * @param {string} name 
     */
    modifyRowCheckedElement: (self, name) => modifyElementRow(self, null, status.getNameCheckedSeqs(self, name)),

    /**
     * 행 편집상태로 변경 (rowIdxList) - 태그 재생성
     * @param {*} self
     * @param {Array} rowIdxList 
     */
    modifyRowElementRowIdxs: (self, rowIdxList) => modifyElementRow(self, rowIdxList, null),

    /**
     * 행 편집상태로 변경(rowSeqList) - 태그 재생성
     * @param {*} self
     * @param {Array} rowSeqList 
     */
    modifyRowElementRowSeqs: (self, rowSeqList) => modifyElementRow(self, null, rowSeqList),

    /**
     * 행 편집상태로 변경 (rowIdx) - 태그 재생성
     * @param {*} self
     * @param {number} rowIdx 
     */
    modifyRowElementRowIdx: (self, rowIdx) => cancelRowElement(self, [rowIdx], null),

    /**
     * 행 편집상태로 변경 (seq) - 태그 재생성
     * @param {*} self
     * @param {string/number} rowSeq 
     */
    modifyRowElementRowSeq: (self, rowSeq) => cancelRowElement(self, null, [rowSeq]),  

    /**
     * 행 편집상태로 변경 - 태그 재생성
     * @param {*} rowIdx 
     * @param {*} rowSeq 
     * @returns 
     */
    modifyRowElement: (self, rowIdx, rowSeq) => modifyElementRow(self, [rowIdx], [rowSeq])
}

/**
 * 그리드 수정 관련 객체 초기설정
 * @param {*} self
 * @returns 
 */
const init = (self) => {}

/**    
 * 행의 변경상태를 체크
 * @param {*} self
 * @param {number} rowIdx 
 * @param {string/number} rowSeq 
 * @param {*} option
 * @returns 
 */
const isRowModify = (self, rowIdx, rowSeq, option) => {
    
    let isModify = false;
    let data = reposit.getData(self);
    let originData = reposit.getOriginData(self);

    for(let key in data[rowIdx]){
        if(key.indexOf("_") != 0 
            && (option?.exceptList?.length > 0 ? option.exceptList : []).includes(key) == false
            && data[rowIdx][key] != originData[rowSeq][key]){
            isModify = true;
            break;
        }
    }

    return isModify;
}

/**
 * 수정 상태로 변경
 * @param {*} self
 * @param {number} rowIdx 
 * @param {string/number} rowSeq
 */
const modifyRow = (self, rowIdx, rowSeq) => {

    // 데이터 행상태 값 변경
    reposit.getData(self, rowIdx)._state = constant.row.status.update;

    // 행 색상 변경
    if(self.option.isRowStatusColor == true){
        status.getSeqRowElement(self, rowSeq)
            .classList.add(constant.class.row.update);
    }
}

/**
 * 행 편집상태로 변경(태그 재생성)
 * @param {*} rowIdx 
 * @param {*} rowSeq 
 * @returns 
 */
const modifyElementRow = (self, rowIdxList, rowSeqList) => {

    // 키값 조회
    if(rowIdxList === null){
        rowIdxList = [];
        rowSeqList.forEach(rowSeq => rowIdxList.push(status.getSeqIndex(self, rowSeq)));
    }else if(rowSeqList === null){
        rowSeqList = [];
        rowIdxList.forEach(rowIdx => rowSeqList.push(status.setIdxSequence(self, rowIdx)));
    }

    // 데이터
    let row = null;
    let loaded = null;
    let rowIdx = null;
    let rowSeq = null;
    let data = null;

    for(let i=0; i<rowIdxList.length; i++){

        rowSeq = rowSeqList[i];
        rowIdx = status.getSeqIndex(self, rowSeq);
        data = reposit.getData(self, rowIdx);

        // 편집할 행 엘리먼트
        row = status.getSeqRowElement(self, rowSeqList[i]);

        // 이전상태 분기처리
        switch(data._state){
        case constant.row.status.insert:
        case constant.row.status.update:
            return;
        case constant.row.status.remove:
            // 삭제 상태에서 편집 상태로 변경시 행 상태 원복 진행
            canceler.cancelRowElement(self, rowIdx, rowSeq);
            break;
        }

        // 편집모드 변경전 본래값 저장
        if(editData[self.sequence] == undefined){
            editData[self.sequence] = {};
        }
        editData[self.sequence][rowSeq] = {};
        for(let key in data){
            editData[self.sequence][rowSeq][key] = data[key];
        }

        // 데이터 행상태 값 변경
        data._state = constant.row.status.update;

        // 자식노드 비우기
        util.elementEmpty(row);

        // CELL 생성   
        loaded = [];
        reposit.getFields(self).forEach((field, idx) => row.appendChild(creator.createCell(self, data, rowIdx, field, idx, loaded)));

        // 행생성후 loaded함수 호출
        loaded.forEach(item => item.fn(item.tag, item.row));
        
        // 업데이트 스타일 적용
        if(self.option.isRowStatusColor == true){
            row.classList.add(constant.class.row.update);
        }
    }
}
