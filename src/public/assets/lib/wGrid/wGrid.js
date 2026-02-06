import { status } from "./plugin/status.js";
import { reposit } from "./plugin/reposit.js";
import { watcher } from "./plugin/watcher.js";
import { creator } from "./plugin/creator.js";
import { canceler } from "./plugin/canceler.js";
import { amender } from "./plugin/amender.js";
import { deleter } from "./plugin/deleter.js";

/**
 * wGrid
 * @author JeHoon 
 * @version 0.11.2
 */
window.wGrid = class wGrid {

    // 생성자
    constructor(target, parameter){

         // 그리드 아이디 저장
        this.id = target;
        // 자신 값 저장
        this.self = this;

        // 데이터 관리 객체 생성
        reposit.init(this, parameter);
        // 상태 관리 객체 생성
        status.init(this);
        // 그리드 옵션세팅
        status.settingOption(this, parameter.option);

        // 제작 관리 객체 생성
        creator.init(this, parameter);
        canceler.init(this);
        amender.init(this);
        deleter.init(this);

        // 이벤트 관리 객체 생성
        watcher.init(this, parameter.event);

        // 그리드 생성
        creator.create(this);

        // 생성 완료 후 함수 호출
        if(typeof parameter.loaded === 'function'){
            parameter.loaded(this);
        }
        return this;
    }

    /**
     * 조회함수 연결
     * @param {*} params 
     * @returns 
     */
    search = params => creator.search(this, params);

    /**
     * 그리드 데이터 가져오기
     * @returns 
     */
    getData = () => reposit.getDeepData(this);

    /**
     * 그리드 데이터 추가
     * @param {array} list 
     * @param {object} param
     */
    setData = function(list, param){

        // 그리드 데이터 추가
        reposit.setData(this, list, param);

        // 필드 새로고침
        creator.refresh(this);
    }

    /**
     * 그리드 시퀀스 값으로 데이터 인덱스 구하기
     * @param {string/number} rowSeq 
     * @returns 
     */
    getDataRowSeq = rowSeq => reposit.getDataRowSeq(this, rowSeq);
    
    /**
     * 그리드 인자의 인덱스에 해당되는 데이터 가져오기
     * @param {number} index 
     * @returns 
     */
    getDataIndex = index => reposit.getDataIndex(this, index);

    /**
     * 상태가 조회(SELECT)인 데이터 가져오기
     * @returns 
     */
    getSelectData = () => reposit.getSelectData(this);

    /**
     * 상태가 추가(INSERT)인 데이터 가져오기
     * @returns 
     */
    getInsertData = () => reposit.getInsertData(this);

    /**
     * 상태가 수정(UPDATE)인 데이터 가져오기
     * @returns 
     */
    getUpdateData = () => reposit.getUpdateData(this);

    /**
     * 상태가 삭제(DELETE)인 데이터 가져오기
     * @returns 
     */
    getDeleteData = () => reposit.getDeleteData(this);
    
    /**
     * 상태가 변경(INSERT, UPDATE, DELETE)인 데이터 가져오기
     * @returns 
     */
    getApplyData = () => reposit.getApplyData(this);
   
    /**
     * 신규행 추가(위에서)
     */
    prependRow = () => creator.prependRow(this);

    /**
     * 신규행 추가(아래에서)
     */
    appendRow = () => creator.appendRow(this);

    /**
     * 최상위 rowElement 반환
     * @returns
     */
    getFirstRowElement = () => status.getFirstRowElement(this);

    /**
     * 최상위 rowSeq 반환
     * @returns
     */
    getFirstRowSeq = () => status.getFirstRowSeq(this);

    /**
     * rowSeq 값으로 행 엘리먼트 가져오기
     * @param {string/number} rowSeq 
     * @returns 
     */    
    getRowElementRowSeq = rowSeq => status.getSeqRowElement(this, rowSeq);

    /**
     * name값으로 엘리먼트 가져오기
     * @param {string} name 
     * @returns
     */
    getSeqCellElement = (rowSeq, name) => status.getSeqCellElement(this, rowSeq, name);

    /**
     * name값으로 체크된 체크박스된 엘리먼트 가져오기
     * @param {string} name 
     * @returns
     */
    getCheckedElement = name => status.getCheckedCellElement(this, name);

    /**
     * name값으로 body 체크박스 전체 선택/해제
     * @param {string} name 
     * @param {boolean} bool 
     * @returns 
     */
    setAllChecked = (name, bool) => status.setAllChecked(this, name, bool);

    /**
     * name값으로 체크된 체크박스 seq(list)번호 가져오기
     * @param {string} name 
     * @returns 
     */
    getNameCheckedSeqs = (name) => status.getNameCheckedSeqs(this, name);

    /**
     * name값으로 체크된 체크박스 행 데이터(itemList) 가져오기
     * @param {string} name 
     * @returns 
     */
    getNameCheckedItems = (name) => status.getNameCheckedItems(this, name);

    /**
     * 옵션변경
     * @param {*} optionName 
     * @param {*} value 
     * @returns 
     */
    chageOption = (optionName, value) => status.chageOption(this, optionName, value);

    /**
     * 수정/삭제 상태를 취소
     * @param {number/string} rowSeq    행 시퀀스
     */
    cancelRowSeq = rowSeq => canceler.cancelRowSeq(this, rowSeq);

    /**
     * 수정/삭제 상태를 취소
     * @param {number} rowIdx    행 IDX
     */
    cancelRowIdx = rowIdx => canceler.cancelRowIdx(this, rowIdx);
 
    /**
     * 수정/삭제 상태를 취소
     * @param {number} rowIdx 행 IDX
     * @param {number/string} rowSeq 행 시퀀스
     */
    cancelRow = (rowIdx, rowSeq) => canceler.cancelRowIdx(this, rowIdx, rowSeq);

    /**
     * 선택한 체크박스의 행을 편집,삭제 상태로 부터 복원
     * @param {string} name 필드명
     * @returns 
     */
    cancelRowCheckedElement = name => canceler.cancelRowCheckedElement(this, name);

    /**
     * 행을 편집,삭제 상태로 부터 복원 (rowSeqList)
     * @param {Array} rowSeqList 
     */
    cancelRowElementRowSeqs = rowSeqList => canceler.cancelRowCheckedElement(this, null, rowSeqList);

    /**
     * 행을 편집,삭제 상태로 부터 복원 (rowIdxList)
     * @param {Array} rowIdxList 
     */
    cancelRowElementRowIdxs = rowIdxList => canceler.cancelRowElementRowIdxs(this, rowIdxList, null);

    /**
     * 행을 편집,삭제 상태로 부터 복원 (rowSeq)
     * @param {number} rowSeq 
     */
    cancelRowElementRowSeq = rowSeq => canceler.cancelRowCheckedElement(this, null, rowSeq);

    /**
     * 행을 편집,삭제 상태로 부터 복원 (rowIdx)
     * @param {number} rowIdx 
     */
    cancelRowElementRowIdx = rowIdx => canceler.cancelRowElementRowIdxs(this, rowIdx, null);
    
    /**
     * 행의 변경상태를 체크 (index)
     * @param {number} rowIdx 
     * @param {*} option
     * @returns 
     */
    isRowModifyRowSeq = (rowIdx, option) => amender.isRowModifyRowSeq(this, rowIdx, option);

    /**
     * 행의 변경상태를 체크 (sequence)
     * @param {string/number} rowSeq 
     * @param {*} option
     * @returns 
     */
    isRowModifyRowIdx = (rowSeq, option) => amender.isRowModifyRowIdx(this, rowSeq, option);

    /**
     * 행의 변경상태를 체크
     * @param {number} rowIdx 
     * @param {string/number} rowSeq 
     * @param {*} option
     * @returns 
     */
    isRowModify = (rowIdx, rowSeq, option) => amender.isRowModify(this, rowIdx, rowSeq, option);

    /**
     * 데이터가 변경 되었을시 행 상태변경, 같은경우 취소(rowIdx)
     * @param {number} rowIdx 
     * @param {*} option
     * @returns 
     */
    applyModifyAndCancelRowIdx = (rowIdx, option) => this.applyModifyAndCancel(rowIdx, status.getIdxSequence(this, rowIdx), option);

    /**
     * 데이터가 변경 되었을시 행 상태변경, 같은경우 취소(rowSeq)
     * @param {number} rowSeq 
     * @param {object} option
     * @returns 
     */
    applyModifyAndCancelRowSeq = (rowSeq, option) => this.applyModifyAndCancel(status.getSeqIndex(this, rowSeq), rowSeq, option);

    /**
     * 데이터가 변경 되었을시 행 상태변경, 같은경우 취소
     * @param {number} rowIdx 
     * @param {number/string} rowSeq 
     * @param {object} option
     */
    applyModifyAndCancel(rowIdx, rowSeq, option){
        if(amender.isRowModify(this, rowIdx, rowSeq, option)){
            if(option?.isRowEditMode == true){
                amender.modifyRowElement(this, rowIdx, rowSeq);
            }else{
                amender.modifyRow(this, rowIdx, rowSeq);
            }
        }else{
            if(option?.isRowEditMode == true){
                canceler.cancelRowElement(this, rowIdx, rowSeq);
            }else{
                canceler.cancelRow(this, rowIdx, rowSeq);
            }
        }
    }

    /**
     * 수정 상태로 변경(index)
     * @param {*} rowIdx
     */
    modifyRowIdx = rowIdx => amender.modifyRow(this, rowIdx);

    /**
     * 수정 상태로 변경(sequence)
     * @param {*} rowSeq
     */
    modifyRowSeq = rowSeq => amender.modifyRow(this, rowSeq);

    /**
     * 수정 상태로 변경
     * @param {*} rowIdx 
     */
    modifyRow = (rowIdx, rowSeq) => amender.modifyRow(this, rowIdx, rowSeq);
    /**
     * 선택한 체크박스의 행을 편집상태로 변환
     * @param {string} name 
     */
    modifyRowCheckedElement = name => amender.modifyRowCheckedElement(this, name);

    /**
     * 행 편집상태로 변경 (rowIdxList)
     * @param {Array} rowIdxList 
     */
    modifyRowElementRowIdxs = rowIdxList => amender.modifyRowElementRowIdxs(this, rowIdxList);

    /**
     * 행 편집상태로 변경(rowSeqList)
     * @param {Array} rowSeqList 
     */
    modifyRowElementRowSeqs = rowSeqList => amender.modifyRowElementRowSeqs(this, rowSeqList);

    /**
     * 행 편집상태로 변경 (rowIdx)
     * @param {number} rowIdx 
     */
    modifyRowElementRowIdx = rowIdx => amender.modifyRowElementRowIdx(this, rowIdx);
    
    /**
     * 행 편집상태로 변경 (seq)
     * @param {string/number} rowSeq 
     */
    modifyRowElementRowSeq = rowSeq => amender.modifyRowElementRowSeq(this, rowSeq);

    /**
     * 행 편집상태로 변경
     * @param {*} rowIdx 
     * @param {*} rowSeq 
     * @returns 
     */
    modifyRowElement = (rowIdx, rowSeq) => amender(this, rowIdx, rowSeq);

    /**
     * 삭제 상태로 변경(index)
     * @param {number} rowIdx                   행IDX
     * @param {boolean} option.isDisabled       비활성화 여부(기본값 true)
     * @param {array} option.exceptDisabledList 비활성화 제외 항목
     */
    removeRowIdx = rowIdx => deleter.removeRowIdx(this, rowIdx, option);

    /**
     * 삭제 상태로 변경(sequence)
     * @param {number/string}                   행 시퀀스
     * @param {boolean} option.isDisabled       비활성화 여부(기본값 true)
     * @param {array} option.exceptDisabledList 비활성화 제외 항목
     */
    removeRowSeq = rowSeq => deleter.removeRowSeq(this, rowSeq, option);
 
    /**
     * 삭제 상태로 변경
     * @param {number} rowIdx                   행 IDX
     * @param {number} rowSeq                   행 시퀀스
     * @param {boolean} option.isDisabled       비활성화 여부(기본값 true)
     * @param {array} option.exceptDisabledList 비활성화 제외 항목
     */
    removeRow = (rowIdx, rowSeq, option) => deleter.removeRow(this, rowIdx, rowSeq, option);

    /**
     * 선택한 체크박스의 행을 삭제상태로 변환
     * @param {string} name 
     */
    removeRowCheckedElement = name => deleter.removeRowCheckedElement(this, name);

    /**
     * 행 삭제상태로 변경 (rowIdxList)
     * @param {Array} rowIdxList 
     * @returns 
     */
    removeRowElementRowIdxs = rowIdxList => deleter.removeRowElementRowIdxs(this, rowIdxList);

    /**
     * 행 삭제상태로 변경 (rowSeqList)
     * @param {Array} rowSeqList 
     * @returns 
     */
    removeRowElementRowSeqs = rowSeqList => deleter.removeRowElementRowSeqs(this, rowSeqList);

    /**
     * 행 삭제상태로 변경 (rowIdx)
     * @param {number} rowIdx 
     * @returns 
     */
    removeRowElementRowIdx = rowIdx => deleter.removeRowElementRowIdx(this, rowIdx);

    /**
     * 행 삭제상태로 변경 (rowSeq)
     * @param {string/number} rowSeq 
     * @returns 
     */
    removeRowElementRowSeq = rowSeq => deleter.removeRowElementRowSeq(this, rowSeq);
   
    /**
     *  행 삭제상태로 변경
     * @param {number} rowIdx 
     * @param {string/number} rowSeq 
     */
    removeRowElement = (rowIdx, rowSeq) => deleter.removeRowElementRowSeq(this, rowIdx, rowSeq);

    /**
     * 한개의 행 삭제 (rowIdx)
     * @param {number} rowIdx 
     */
    deleteRowIdx = rowIdx => deleter.deleteRow(this, rowIdx);

    /**
     * 한개의 행 삭제 (rowSeq)
     * @param {string/number} rowSeq 
     */
    deleteRowSeq = rowSeq => deleter.deleteRowSeq(this, rowSeq);

    /**
     * 한개의 행 삭제
     * @param {number} rowIdx 
     * @param {string/number} rowSeq 
     */
    deleteRow = (rowIdx, rowSeq) => deleter.deleteRow(this, rowIdx, rowSeq);    
}