import { constant } from "./constant.js";
import { reposit } from "./reposit.js";
import { status } from "./status.js";
import { canceler } from "./canceler.js";

/**
 * 그리드 삭제 관련 객체
 */
export const deleter = {

    /**
     * 그리드 삭제 관련 객체 초기설정
     * @param {*} self
     * @returns 
     */
    init: (self) => init(self),

    /**
     * 삭제 상태로 변경(index)
     * @param {*} self
     * @param {number/string}                   행 IDX
     * @param {boolean} option.isDisabled       비활성화 여부(기본값 true)
     * @param {array} option.exceptDisabledList 비활성화 제외 항목
     */
    removeRowIdx: (self, rowIdx, option) => removeRow(self, rowIdx, status.getIdxSequence(self, rowIdx), option),

    /**
     * 삭제 상태로 변경(sequence)
     * @param {*} self
     * @param {number/string}                   행 시퀀스
     * @param {boolean} option.isDisabled       비활성화 여부(기본값 true)
     * @param {array} option.exceptDisabledList 비활성화 제외 항목
     */
    removeRowSeq: (self, rowSeq, option) => removeRow(self, status.getSeqIndex(self, rowSeq), rowSeq, option),

    /**
     * 삭제 상태로 변경
     * @param {*} self
     * @param {number} rowIdx     행 IDX
     * @param {number} rowSeq     행 시퀀스
     * @param {*} option          설정값
     * @param {array} option.exceptDisabledList 비활성화 제외 항목
     */
    removeRow: (self, rowIdx, rowSeq, option) => removeRow(self, rowIdx, rowSeq, option),

    /**
     * 선택한 체크박스의 행을 삭제상태로 변환
     * @param {*} self
     * @param {string} name 필드명
     * @returns 
     */
    removeRowCheckedElement: (self, name) => removeRowElement(self, null, status.getNameCheckedSeqs(self, name)),

    /**
     * 행을 삭제상태 또는 삭제 진행(rowIdxList)
     * @param {*} self 
     * @param {*} rowIdxList 
     * @param {*} rowSeqList 
     */
    removeRowElementRowIdxs: (self, rowIdxList) => removeRowElement(self, rowIdxList, null),

    /**
     * 행을 삭제상태 또는 삭제 진행(rowSeqList)
     * @param {*} self 
     * @param {*} rowIdxList 
     * @param {*} rowSeqList 
     */
    removeRowElementRowSeqs: (self, rowSeqList) => removeRowElement(self, null, rowSeqList),

    /**
     * 행을 삭제상태 또는 삭제 진행(rowIdx)
     * @param {*} self 
     * @param {*} rowIdxList 
     * @param {*} rowSeqList 
     */
    removeRowElementRowIdx: (self, rowIdx) => removeRowElement(self, [rowIdx], null),

    /**
     * 행을 삭제상태 또는 삭제 진행(rowSeq)
     * @param {*} self 
     * @param {*} rowIdxList 
     * @param {*} rowSeqList 
     */
    removeRowElementRowSeq: (self, rowSeq) => removeRowElement(self, null, [rowSeq]),

    /**
     * 행을 삭제상태 또는 삭제 진행
     * @param {*} self 
     * @param {*} rowIdxList 
     * @param {*} rowSeqList 
     */
    removeRowElement: (self, rowIdx, rowSeq) => removeRowElement(self, [rowIdx], [rowSeq]),

    /**
     * 행삭제(데이터, 엘리먼트), 삭제데이터 재 인덱싱(rowIdx)
     * @param {*} self 
     * @param {*} rowIdx 
     * @returns 
     */
    deleteRowIdx: (self, rowIdx) => deleteRow(self, rowIdx, status.getIdxSequence(self, rowIdx)),

    /**
     * 행삭제(데이터, 엘리먼트), 삭제데이터 재 인덱싱(rowSeq)
     * @param {*} self 
     * @param {*} rowSeq 
     * @returns 
     */
    deleteRowSeq: (self, rowSeq) => deleteRow(self, status.getSeqIndex(self, rowSeq), rowSeq),

    /**
     * 행삭제(데이터, 엘리먼트), 삭제데이터 재 인덱싱
     * @param {*} self 
     * @param {*} rowIdx 
     * @param {*} rowSeq 
     */
    deleteRow: (self, rowIdx, rowSeq) => deleteRow(self, rowIdx, rowSeq)
}

/**
 * 삭제 초기화 객체
 * @param {*} self 
 */
const init = (self) => {}

/**
 * 삭제 상태로 변경
 * @param {*} self
 * @param {number} rowIdx                   행 IDX
 * @param {number} rowSeq                   행 시퀀스
 * @param {boolean} option.isDisabled       비활성화 여부(기본값 true)
 * @param {array} option.exceptDisabledList 비활성화 제외 항목
 */
const removeRow = (self, rowIdx, rowSeq, option) => {

    // 데이터 행상태 값 변경
    reposit.getData(self, rowIdx)._state = constant.row.status.remove;

    // Disabled 여부 확인
    if(option?.isDisabled !== false){

        // Disabled 처리
        for(let field of reposit.getFields(self)){

            // Disabled 제외 항목이 아닌 경우만 비활성화 처리
            if((option?.exceptDisabledList?.length > 0 ? option.exceptDisabledList : []).includes(field.name) == false){
                status.getSeqCellElement(self, rowSeq, field.name).disabled = true;
            }
        }
    }
    
    // 행 삭제상태(색상) 변환
    if(self.option.isRowStatusColor == true){
        status.getSeqRowElement(self, rowSeq)
            .classList.add(constant.class.row.remove);
    }
}

/**
 * 행을 삭제상태 또는 삭제 진행
 * @param {*} self 
 * @param {*} rowIdxList 
 * @param {*} rowSeqList 
 */
const removeRowElement = (self, rowIdxList, rowSeqList) => {

    // 키값 조회
    if(rowIdxList === null){
        rowIdxList = [];
        rowSeqList.forEach(rowSeq => rowIdxList.push(status.getSeqIndex(self, rowSeq)));
    }else if(rowSeqList === null){
        rowSeqList = [];
        rowIdxList.forEach(rowIdx => rowSeqList.push(status.getIdxSequence(self, rowIdx)));
    }

    let row = null;
    let data = null;
    let rowIdx = null;
    let rowSeq = null;

    for(let i=0; i<rowIdxList.length; i++){

        rowSeq = rowSeqList[i];
        rowIdx = status.getSeqIndex(self, rowSeq);
        row = status.getSeqRowElement(self, rowSeq);
        data = reposit.getData(self, rowIdx);

        switch(data._state){
        // 신규행 제거
        case constant.row.status.insert:
            deleteRow(self, rowIdx, rowSeq);
            break;
        // 삭제 상태에서 편집 상태로 변경시 행 상태 원복 진행
        case constant.row.status.update:
            // 취소할 상태값 저장
            canceler.cancelRowElement(self, rowIdx, rowSeq);
            break;
        // 조회상태에서 삭제상태로 변경
        case constant.row.status.select:
            data._state = constant.row.status.remove;
            break;
        }

        // ROW스타일 row 태그 스타일 삭제
        if(self.option.isRowStatusColor == true){
            row.classList.add(constant.class.row.remove);
        }
    }
}

/**
 * 행삭제(데이터, 엘리먼트), 삭제데이터 재 인덱싱
 * @param {*} self 
 * @param {*} rowIdx 
 * @param {*} rowSeq 
 */
const deleteRow = (self, rowIdx, rowSeq) => {

    // 데이터 삭제
    reposit.getData(self).splice(rowIdx, 1);

    // 엘리먼트 삭제
    status.getSeqRowElement(self, rowSeq).remove();

    // 데이터 재 인덱싱
    status.dataReIndexing(self, rowSeq);
}