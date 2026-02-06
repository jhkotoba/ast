import { util } from './util.js';
import { constant } from "./constant.js";
import { status } from "./status.js";
import { creator } from "./creator.js";

// 그리드 번호
let sequence = 1;

// 데이터
let data = {};

// 기본값 데이터
let basic = {};

// 파라미터
let parameter = {}

// 필드 데이터
let fields = {};

/**
 * 그리드 데이터 관련 객체
 */
export const reposit = {

    /**
     * 그리드 데이터 초기설정
     * @params {*} self 
     * @returns 
     */
    init: (self, params) => init(self, params),

    /**
     * 그리드 필드 데이터 가져오기
     * @params {*} self 
     * @returns 
     */
    getFields: (self) => fields[self.sequence],

    /**
     * 그리드 데이터 세팅
     * @params {*} self 
     * @returns 
     */
    setData: (self, list, params) => setData(self, list, params),

    /**
     * 그리드 데이터 추가
     * @params {*} self 
     * @params {*} data 
     * @returns 
     */
    appendData: (self, row) => data[self.sequence].data.push(row),

    /**
     * 그리드 데이터 가져오기(깊은복사)
     * @params {*} self 
     * @params {*} index 
     * @returns 
     */
    getDeepData: (self, index) => getDeepData(self, index),

    /**
     * 그리드 데이터 가져오기(얕은복사)
     * @params {*} self 
     * @params {*} index 
     * @returns 
     */
    getData: (self, index) => getData(self, index),

    /**
     * 그리드 오리지널 데이터 가져오기
     * @param {*} self 
     * @returns 
     */
    getOriginData: (self) => data[self.sequence].originData,

    /**
     * 그리드 데이터 길이 가져오기
     * @params {*} self 
     * @returns 
     */
    getDataSize: (self) => data[self.sequence].data.length,

    /**
     * 그리드 시퀀스 값으로 데이터 인덱스 구하기
     * @params {*} self 
     * @params {string/number} rowSeq 
     * @returns 
     */
    getDataRowSeq: (self, rowSeq) => data[self.sequence][status.getSeqIndex(self, rowSeq)],
    
    /**
     * 그리드 인자의 인덱스에 해당되는 데이터 가져오기
     * @params {*} self 
     * @params {number} index 
     * @returns 
     */
    getDataIndex: (self, index) => data[self.sequence][index],

    /**
     * 상태가 조회(SELECT)인 데이터 가져오기
     * @returns 
     */
    getSelectData: (self) => data[self.sequence].data.filter(item => isSelect(item._state)),

    /**
     * 상태가 추가(INSERT)인 데이터 가져오기
     * @returns 
     */
    getInsertData: (self) => data[self.sequence].data.filter(item => isInsert(item._state)),

    /**
     * 상태가 수정(UPDATE)인 데이터 가져오기
     * @returns 
     */
    getUpdateData: (self) => data[self.sequence].data.filter(item => isUpdate(item._state)),

    /**
     * 상태가 삭제(DELETE)인 데이터 가져오기
     * @returns 
     */
    getDeleteData: (self) => data[self.sequence].data.filter(item => isDelete(item._state)),
    
    /**
     * 상태가 변경(INSERT, UPDATE, DELETE)인 데이터 가져오기
     * @returns 
     */
    getApplyData: (self) => data[self.sequence].data.filter(item => !isSelect(item._state)),

    /**
     * 기본값(insert) 데이터 가져오기
     * @param {*} self 
     * @returns 
     */
    getBasicInsertData: (self) => basic[self.sequence].insert,
    
    /**
     * 조회 데이터 가져오기(페이징 포함)
     * @param {*} self 
     * @returns 
     */
    getParameter: (self) => parameter[self.sequence],

    /**
     * 조회 데이터중 페이징 데이터 가져오기
     * @param {*} self 
     * @returns 
     */
    getPagingData: (self) => parameter[self.sequence].paging
}

/**
 * 그리드 데이터 관련 객체
 * @params {*} self 
 */
const init = (self, params) => {

    // 그리드 순번
    self.sequence = sequence++;

    // 기본 데이터 생성
    data[self.sequence] = {
        // 그리드 목록
        data: [],
        // 기존 데이터
        originData: {},
        // 편집 진행시 데이터
        editData: {}
    };

    // 기본값 데이터 저장
    basic[self.sequence] = {}
    basic[self.sequence].insert = params?.data?.insert === undefined ? null : params.data.insert;

    // 필드 데이터 저장
    fields[self.sequence] = params.fields;
}

/**
 * 그리드 데이터 가져오기(깊은복사)
 * @params {*} self  그리드 객체
 * @params {*} index 데이터 인덱스 값 - 해당값 존재시 해당 인덱스 데이터만 반환
 * @returns 
 */
const getDeepData = (self, index) => {
    if(util.isEmpty(index)){
        return JSON.parse(JSON.stringify(data[self.sequence].data));
    }else{
        return JSON.parse(JSON.stringify(data[self.sequence].data[index]));
    }
}

/**
 * 그리드 데이터 가져오기(얕은복사)
 * @params {*} self  그리드 객체
 * @params {*} index 데이터 인덱스 값 - 해당값 존재시 해당 인덱스 데이터만 반환
 * @returns 
 */
const getData = (self, index) => {

    if(util.isEmpty(index)){
        return data[self.sequence].data;
    }else{
        return data[self.sequence].data[index];
    }
}

/**
 * 그리드 데이터 세팅
 * @params {*} self 
 * @params {*} list 
 * @params {*} params 
 * @returns 
 */
const setData = (self, list, params) => {

    // 데이터를 그리드에 삽입
    for(let item of list){
        // 기본 데이터 세
        item._rowSeq = status.getNextSeq(self);
        item._state = constant.row.status.select;
    }

    // 페이징 데이터 세팅
    if(self.option.isPaging === true){
        parameter[self.sequence] = params;
    }

    // 데이터 저장
    data[self.sequence].data = list;

    // 초기데이터 보존
    data[self.sequence].data.forEach(item => data[self.sequence].originData[item._rowSeq] = JSON.parse(JSON.stringify(item)));

    // 그리드 필드 새로고침
    creator.refresh(self);
}

// 상태체크 SELECT
const isSelect = state => constant.row.status.select === state;
// 상태체크 INSERT
const isInsert = state => constant.row.status.insert === state;
// 상태체크 UPDATE
const isUpdate = state => constant.row.status.update === state;
// 상태체크 REMOVE
const isRemove = state => constant.row.status.remove === state;