import { constant } from "./constant.js";
import { util } from './util.js';
import { reposit } from "./reposit.js";
import { status } from "./status.js";

// 엘리먼트 데이터
let elements = {};

// 외부 조회함수
let search = {};
/**
 * 그리드 제작 객체
 */
export const creator = {

    /**
     * 그리드 
     * @param {*} self 
     * @returns 
     */
    init: (self, parameter) => init(self, parameter),

    /**
     * 저장된 조회함수 호출
     * @param {*} self 
     * @param {*} params 
     * @returns 
     */
    search: (self, params) => search[self.sequence](params),

    /**
     * 그리드 생성(최초 1회 실행)
     * @param {*} self 
     * @returns 
     */
    create: (self) => createGrid(self),
   
    /**
     * 그리드 목록 재 생성
     * @param {*} self 
     * @returns 
     */
    refresh: (self) => refresh(self),

    /**
     * 그리드 행 생성
     * @param {*} self 
     * @param {*} row 
     * @param {*} rowIdx 
     * @returns 
     */
    createRow: (self, row, rowIdx) => createBodyRow(self, row, rowIdx),

    /**
     * 그리드 신규행 생성
     * @param {*} self 
     * @returns 
     */
    createNewRow: (self) => createBodyNewRow(self),

    /**
     * 그리드 열 생성
     * @param {*} self 
     * @returns 
     */
    createCell: (self, rowIdx, cell, cellIdx, loaded) => createBodyRowCell(self, rowIdx, cell, cellIdx, loaded),

    /**
     * 신규행 추가(위에서)
     * @param {*} self
     */
    prependRow: (self) => elements[self.sequence].bodyTb.insertBefore(createBodyNewRow(self), elements[self.sequence].bodyTb.firstChild),

    /**
     * 신규행 추가(아래에서)
     * @param {*} self
     */
    appendRow: (self) => elements[self.sequence].bodyTb.appendChild(createBodyNewRow(self)),

    /**
     * 헤드영역 태그 가져오기
     * @param {*} self 
     * @returns 
     */
    getHeadElement: (self) => elements[self.sequence].head,

    /**
     * 바디영역 태그 가져오기
     * @param {*} self 
     * @returns 
     */
    getBodyElement: (self) => elements[self.sequence].body,
    
    /**
     * 바디목록 영역 태그 가져오기
     * @param {*} self 
     * @returns 
     */
    getBodyTbElement: (self) => elements[self.sequence].bodyTb,

    /**
     * 페이지네이션 영역 가져오기
     * @param {*} self 
     * @returns 
     */
    createPagination: (self) => createPagination(self)
}

/**
 * 생성객체 초기화
 * @param {*} self 
 */
const init = (self, parameter) => {
   
    /**
     * 그리드에 사용되는 엘리먼트 생성
     */
    let id = self.id;
    let target = document.getElementById(id);
    let head = document.createElement('div');
    let headTb = document.createElement('table');
    let headTr = document.createElement('tr');
    let body = document.createElement('div');
    let bodyTb = document.createElement('table');
    let bodyEmpty = document.createElement('div');
    let pagination = document.createElement('div');
    
    /**
     * 그리드 CSS 적용
     */
    target.classList.add(constant.class.area.target);
    head.classList.add(constant.class.area.header);
    body.classList.add(constant.class.area.body);
    pagination.classList.add(constant.class.area.pagination);

    /**
     * 그리드 style 적용
     */
    // 그리드 div 영역 설정
    target.style.width = self.option.style.width;
    // 그리드 헤더 영역 설정
    head.style.overflowX = self.option.style.overflow.x;
    head.style.overflowY = self.option.style.overflow.y;
    // 그리드 바디 영역 설정
    body.style.height = `calc(${self.option.style.height}px + 0vh)`;
    body.style.overflowX = self.option.style.overflow.x;
    body.style.overflowY = self.option.style.overflow.y;
    

    // 엘리먼트 연결
    headTb.appendChild(headTr);
    head.appendChild(headTb);

    body.appendChild(bodyTb);
    body.appendChild(bodyEmpty);

    target.appendChild(head);
    target.appendChild(body);
    target.appendChild(pagination);

    // 그리드 엘리먼트 저장
    elements[self.sequence] = {id, target, head, headTb, headTr, body, bodyTb, bodyEmpty, pagination};

    // 호출 함수 저장
    search[self.sequence] = parameter.search;
}

/**
 * 그리드 생성
 */
const createGrid = (self) => {

    // 헤더 생성
    if(self.option.isHead === true) createHead(self);

    // 바디 생성
    createBody(self);
    
    // // 데이터 없을 경우 표시 메시지 영역
    // if(this.option.empty.message) {
    //     this.element.bodyEmpty.textContent = this.option.empty.message;
    // }
    // this.element.bodyEmpty.classList.add('wgrid-empty-message');
    // this.emptyMessageDisply();
    // this.element.body.appendChild(this.element.bodyEmpty);

    // 페이징 영역 생성
    // if(self.option.isPaging === true) createPagination(self);
}

/**
 * 그리드 새로고침
 */
const refresh = (self) => {

    // 그리드 상태 초기화
    status.clean(self);

    // 필드 비우기
    let bodyTb = elements[self.sequence].bodyTb;
    util.elementEmpty(bodyTb);

    // 필드 재생성
    reposit.getData(self).forEach((row, rIdx) => bodyTb.appendChild(createBodyRow(self, row, rIdx)));

    // 페이징 영역 생성
    if(self.option.isPaging === true) createPagination(self);
}

/**
 * 그리드 생성 - 해더
 */
const createHead = (self) => {

    // 변수 정의
    let th = null, div = null, tag = null;
    let headTr = elements[self.sequence].headTr;
    util.elementEmpty(headTr);

    // 헤드영역 생성
    let fields = reposit.getFields(self);
    for(let i=0; i<fields.length; i++){

        let field = fields[i];

        // 태그생성
        th = document.createElement('th');
        div = document.createElement('div');

        // 헤더 테이블 내용 생성
        if(field.title){
            // 제목이 있는 경우 태그타입을 무시하고 제목 표시
            div.textContent = field.title;           
        }else if(field.element == 'checkbox'){
            // 체크박스 생성
            tag = document.createElement('input');
            tag.setAttribute('type', 'checkbox');
            tag.setAttribute('name', field.name);
            div.appendChild(tag);
        }else if(field.element == 'button'){
            // 버튼생성
            tag = document.createElement('button');
            tag.classList.add(self.constant.class.button);
            tag.setAttribute('name', field.name);
            tag.textContent = field.button.title;
            div.appendChild(tag);
        }else{
            // 제목적용
            tag = document.createElement('span');
            tag.textContent = field.title;
            div.appendChild(tag);
        }

        // 스타일 적용
        field.width ? th.style.width = field.width : null;
        div.style.textAlign = 'center';

        // 태그연결
        th.appendChild(div);
        headTr.appendChild(th);
    }
}

/**
 * 그리드 생성 - 바디
 */
const createBody = (self) => {

    // body 초기화
    util.elementEmpty(elements[self.sequence].bodyTb);

    // ROW 생성
    reposit.getData(self).forEach((item, idx) => self.element.bodyTb.appendChild(createBodyRow(self, item, idx)));
}

/**
 * 그리드 신규행 생성
 * @param {*} self 
 */
const createBodyNewRow = (self) => {

    // 신규행 ROW 데이터 세팅
    let row = {
        //  self.getNextSeq(),
        _rowSeq: status.getNextSeq(self),
        _state: constant.row.status.insert
    };

    // 신규행 기본값 설정되어있으면 세팅
    let insertData = reposit.getBasicInsertData(self);
    if(insertData){
        for(let key in insertData){
            row[key] = insertData[key];
        }
    }

    // 필드값 세팅
    let fields = reposit.getFields(self);
    for(let field of fields){
        
        // 신규행 추가시 기본값 세팅
        switch(field.element){
        case 'text': case 'select': default:
            row[field.name] = "";
            break;
        case 'number':
            row[field.name] = 0;
            break;
        case 'checkbox':
            row[field.name] = self.option.checkbox.check;
            break;
        }

        // 해당 행에 셀렉트박스 데이터가 있는 경우, 셀렉트박스 empty값이 없거나 false일 경우
        if(field.data && field.data.select 
            && (!field.data.select.empty || field.data.select === false)
            && field.data.select.list?.length > 0){

            if(field.data.select.value){
                row[field.name] = field.data.select.list[0][field.data.select.value];
            }else{
                row[field.name] = field.data.select.list[0].value;
            }
        }
    }

    // 신규 데이터 추가
    reposit.appendData(self, row);

    // 신규행 추가
    let tr = creator.createRow(self, row, reposit.getDataSize(self)-1);

    if(self.option.isRowStatusColor == true){
        tr.classList.add(constant.class.row.insert);
    }
    
    return tr;
}

/**
 * 그리드 생성 - 바디 - 행
 * @param {*} row       행 엘리먼트
 * @param {*} rIdx      행 IDX
 */
const createBodyRow = (self, row, rIdx) => {

    // ROW 생성
    let tr = document.createElement('tr');
    tr.dataset.rowSeq = row._rowSeq;

    // 앞키 뒤값
    status.setSeqIndex(self, row._rowSeq, rIdx);
    status.setIdxSequence(self, rIdx, row._rowSeq);

    // 행 엘리먼트 인덱싱
    status.setSeqRowElement(self, row._rowSeq, tr);

    // CELL 생성        
    let loaded = [];
    reposit.getFields(self).forEach((field, cIdx) => tr.appendChild(createBodyRowCell(self, row, rIdx, field, cIdx, loaded)));

    // ROW 커서 옵션 적용
    tr.style.cursor = self.option.style.row.cursor;

    // ROW 생성후 loaded함수 호출
    loaded.forEach(item => item.loaded(item.element, item.row));

    // 행 반환
    return tr;
}

/**
 * 그리드 생성 - 바디 - 행 - 열
 * @param {*} row 
 * @param {*} rIdx 
 * @param {*} cell 
 * @param {*} cIdx 
 * @param {*} loaded 
 */
const createBodyRowCell = (self, row, rIdx, cell, cIdx, loaded) => {

    // 생성할 태그 타입, 생성할 태그 변수들
    let type = null, tag = null, td = null, div = null, option = null; 

    // 태그생성
    td = document.createElement('td');
    div = document.createElement('div');

    // 태그 생성전 엘리먼트 타입 구분
    if(row._state == constant.row.status.insert || row._state == constant.row.status.update){
        if(cell.edit){
            if(cell.edit == 'text') type = 'text-edit';
            else if(cell.edit == 'number') type = 'number-edit';
            else if(cell.edit == 'date') type = 'date-edit';
            else if(cell.edit == 'dateTime') type = 'dateTime-edit';
            else type = cell.edit;
        }else{
            type = cell.element;
        }
    }else{
        type = cell.element;
    }

    // 태그 생성
    if(type == 'checkbox'){
        // 체크박스 생성
        tag = document.createElement('input');
        tag.setAttribute('type', 'checkbox');
        tag.setAttribute('name', cell.name);
        if(self.option.checkbox.check == row[cell.name]){
            tag.checked = true;
        }else{
            tag.checked = false;
        }
        tag.dataset.sync = 'checkbox';
        div.appendChild(tag);
    }else if(type == 'button'){            
        // 버튼 생성
        tag = document.createElement('button');
        tag.classList.add('wgrid-btn');
        tag.setAttribute('name', cell.name);
        tag.textContent = cell.text;
        div.appendChild(tag);
    }else if(type == 'select'){
        // 셀릭트박스 생성
        tag = document.createElement('select');
        tag.classList.add('wgrid-select');            
        tag.classList.add('wgrid-wth100p');
        tag.setAttribute('name', cell.name);
        tag.dataset.sync = 'select';

        // 초기 빈값이 존재할 경우 추가
        if(cell?.data?.select?.empty){
            option = document.createElement('option');
            option.textContent = cell.data.select.empty;
            tag.appendChild(option);
        }

        // 셀릭트박스 옵션 태그 추가
        if(cell?.data?.select?.list){
            cell.data.select.list.forEach(item => {
                option = document.createElement('option');
                option.value = item[cell.data.select.value ? cell.data.select.value : 'value'];
                option.textContent = item[cell.data.select.text ? cell.data.select.text : 'text'];

                if(option.value == row[cell.name]){
                    option.selected = true;
                }

                tag.appendChild(option);
            });
        // 셀릭트박스 옵션 태그 추가(코드)
        }else if(cell?.data?.select?.codeList){
            cell.data.select.codeList.forEach(item => {
                option = document.createElement('option');
                option.value = item.code
                option.textContent = item.codeNm

                if(option.value == row[cell.name]){
                    option.selected = true;
                }

                tag.appendChild(option);
            });
        }
        div.appendChild(tag);
    // 날짜표시
    }else if(type == 'date'){
        tag = document.createElement('span');
        tag.textContent = row[cell.name];
        div.appendChild(tag);
    }else if(type == 'date-edit'){
        // 날짜 입력박스 표시
        tag = document.createElement('input');
        tag.classList.add('wgrid-input');
        tag.classList.add('wgrid-wth');
        tag.setAttribute('maxlength', 10);
        tag.setAttribute('name', cell.name);
        tag.dataset.sync = 'date';
        tag.value = row[cell.name];
        div.appendChild(tag);
    }else if(type == 'dateTime'){
        /* 개발중 */
    }else if(type == 'dateTime-edit'){
        /* 개발중 */
    }else if(type == 'text' || type == 'number' || !type){
        tag = document.createElement('span');
        tag.setAttribute('name', cell.name);
        // 코드맵핑
        if(cell.data && cell.data.mapping){
            tag.textContent = cell.data.mapping[row[cell.name]];
        }else{
            tag.textContent = row[cell.name];
        }
        div.appendChild(tag);
    }else if(type == 'text-edit'){
        // 입력내용 표시
        tag = document.createElement('input');
        tag.classList.add('wgrid-input');
        tag.classList.add('wgrid-wth-edit');
        tag.setAttribute('name', cell.name);
        tag.dataset.sync = 'text';
        tag.value = row[cell.name];
        div.appendChild(tag);
    }else if(type == 'number-edit'){
        tag = document.createElement('input');
        tag.classList.add('wgrid-input');
        tag.classList.add('wgrid-wth-edit');
        tag.setAttribute('name', cell.name);
        tag.setAttribute('maxlength', cell.maxlength ? cell.maxlength : 3);
        tag.dataset.sync = 'number';
        tag.value = row[cell.name];
        div.appendChild(tag);
    }

    // 텍스트, 날짜데이터가 비어있고 비어있을경우 표시하는 값이 정해지면 표시
    if((cell.emptyText && type == 'text' || type == 'dateTime' || type == 'date') 
        && !row[cell.name]){                    
        // 정의된 빈값 표시
        div.textContent = cell.emptyText;
    }
    
    // 셀 엘리먼트 인덱싱
    status.setSeqCellElement(self, row._rowSeq, cell.name, tag);

    // 태그연결
    td.appendChild(div);

    // cell 이름설정
    if(cell.name){
        td.dataset.cellName = cell.name;
    }

    // 행 직후 콜백함수 호출 세팅
    if(cell.loaded){
        loaded.push({loaded: cell.loaded, element: tag, row: Object.assign({}, row)});
    } 

    // 스타일 적용
    cell.width ? td.style.width = cell.width : null;
    div.style.align = cell.align ? cell.align : 'center';
    return td;
}

/**
 * 그리드 생성 - 페이징
 */
const createPagination = (self) => {

    // 페이지네이션 엘리먼트
    let pagination = elements[self.sequence].pagination;
    // 초기화
    util.elementEmpty(pagination);

    // 페이징 정보 가져오기
    let parameter = reposit.getParameter(self);
    let pageBlock = parameter.paging.pageBlock;
    let pageSize = parameter.paging.pageSize;
    let pageNo = parameter.paging.pageNo;
    let totalCount = parameter.paging.totalCount;

    // 페이징 데이터 세팅
    let currentBlock = Math.ceil(pageNo/pageBlock);
    let startPageNo = (currentBlock - 1) * pageBlock + 1;
    let endPageNo = currentBlock * pageBlock;
    let maxEndPageNo = Math.ceil(totalCount/pageSize);
    if(endPageNo > maxEndPageNo){
        endPageNo = maxEndPageNo;
    }
    
    // 이전 블록 페이지 가기 버튼생성
    if(startPageNo > pageBlock){
        let btn = document.createElement('button');
        btn.textContent = '<';
        btn.addEventListener('click', e => {
            parameter.paging.pageNo = startPageNo - pageBlock;
            search[self.sequence](parameter).then(data => reposit.setData(self, data.list, data.param));
        });
        pagination.appendChild(btn);        
    }
    
    // 페이지네이션 버튼 생성
    for(let i=startPageNo; i<=endPageNo; i++){
        let btn = document.createElement('button');
        btn.textContent = i;

        if(i === pageNo){
            btn.classList.add(constant.class.pagination.current);
        }else{
            btn.addEventListener('click', e => {
                parameter.paging.pageNo = i;
                search[self.sequence](parameter).then(data => reposit.setData(self, data.list, data.param));
            });
        }
        pagination.appendChild(btn);
    }
   
    // 다음 블록 페이지 가기 버튼생성
    if(endPageNo < maxEndPageNo){
        let btn = document.createElement('button');
        btn.textContent = '>';
        btn.addEventListener('click', e => {
            parameter.paging.pageNo = startPageNo + pageBlock;
            search[self.sequence](parameter).then(data => reposit.setData(self, data.list, data.param));
        });
        pagination.appendChild(btn);
    }
}