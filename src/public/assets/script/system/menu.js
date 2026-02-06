import { sender } from "/script/common/sender.js";
import { isEmpty } from "/script/common/validation.js";

window.addEventListener('DOMContentLoaded', function(event){
    // 메뉴생성
    menu.createGrid();
    // 메뉴조회
    menu.selectMenu();
    // 메뉴관리 이벤트 생성
    menu.createEvent();
});
window.addEventListener('load', function(event){});

const menu = {

    data: {
        topMenuNo: null,
        isSubMenuApply: false,
        origin: [], topList: [], subList: [],
        mapping: {
            mapping: {Y: '사용', N: '미사용'},
            select: {list: [{value:'Y', text:'사용'}, {value:'N', text:'미사용'}]}
        },
        newRow: {
            top: {check: false, menuNm: '', menuLv: 1, menuSeq: 0, groupNo: 0, dispYn: 'Y', useYn: 'Y'},
            sub: {check: false, menuUrl: '', menuLv: 2, menuSeq: 0, groupNo: 0, dispYn: 'Y', useYn: 'Y'}
        },
        code: {
            mapping: __code.reduce((acc, curr) => {
                acc[curr.code] = curr.codeNm;
                return acc;
            }, {}),
            select: {codeList: __code}
        }
    },
    grid: {
        top: null, sub: null,
    },

    /**
     * 메뉴목록 조회, 조회데이터 세팅
     */
    selectMenu(){
        sender.request({url: '/system/getMenuList', body: {}})
            .then(res => res.resultCode == 'SUCCESS' ? this.data.origin = res.data : Promise.reject(new Error(res.message)))
            .then(() => this.initGrid())
            .catch(err => console.error(err));
    },

    /**
     * 메뉴 데이터 초기화
     */
    initGrid(){
        this.data.topList = [];
        this.data.subList = [];
        this.grid.top.setData([]);
        this.grid.sub.setData([]);

        // 상위메뉴 하위메뉴 분리
        this.data.origin.forEach(item => {
            item.check = false;
            item.menuLv == 1 ? this.data.topList.push(item) : this.data.subList.push(item)
        });

        // 그리드 데이터 세팅
        this.grid.top.setData(JSON.parse(JSON.stringify(this.data.topList)), true);

        // 상위메뉴 첫행 혹은 이전에 선택한 행 클릭
        let item = this.grid.top.getData().filter(f => f.menuNo == this.data.topMenuNo)[0];
        
        if(item?.menuNo){
            this.data.topMenuNo = item.menuNo;
            this.grid.top.getRowElementRowSeq(item._rowSeq).click();
        }else{
            this.grid.top.getFirstRowElement().children[0].click();
        }
    },

    /**
     *  그리드 최초생성
     */
    createGrid() {

        // 그리드 높이 설정
        let gridHeight = window.innerHeight - 294;

        // 상위메뉴 그리드 생성
        this.grid.top = new wGrid('topMenu', {
            fields: [
                {title: null, element:'checkbox', name: 'check', edit: 'checkbox', width:'3%', align:'center'},
                {title:'메뉴번호', element: 'text', name: 'menuNo', width: '5%'},
                {title:'메뉴명', element: 'text', name: 'menuNm', edit: 'text', width: '30%'},
                {title:'메뉴순번', element: 'number', name: 'menuSeq', edit: 'number', width: '5%'},
                {title:'권한', element: 'text', name: 'authCd', edit: 'select', width: '8%', data: this.data.code},
                {title:'전시여부', element: 'text', name: 'dispYn', edit:'select', width: '7%', data: this.data.mapping},
                {title:'사용여부', element: 'text', name: 'useYn', edit:'select', width: '7%', data: this.data.mapping},
                {title:'등록자', element: 'text', name: 'insNo', width: '5%'},
                {title:'등록일시', element: 'text', name: 'insDttm', width: '10%'},
                {title:'수정자', element: 'text', name: 'uptNo', width: '5%'},
                {title:'수정일시', element: 'text', name: 'uptDttm', width: '10%'}                
            ],
            option: { 
                style: { 
                    height: Number(gridHeight/2)+13, 
                    overflow: { y: 'scroll'},
                    row:{cursor: 'pointer'}
                },
                body: { state: true },
            },
            data: { insert: this.data.newRow.top },
            event: {
                click: (event, item, index, sequence) => {
                    // 변경 진행상태에서 정지
                    if(this.data.isSubMenuApply == true && confirm('하위메뉴 변경사항이 있습니다. 무시하고 진행하시겠습니까?') == false){
                        return false;
                    // 행선택 복원, 진행상태 여부 복원
                    }else{
                        this.grid.top.chageOption('option.style.row.isChose', true);
                        this.data.isSubMenuApply = false;
                    }
                    // 하위메뉴 목록 출력
                    if(['INPUT', 'SELECT', 'BUTTON'].includes(event.target.tagName) == false){
                        // 최상위 메뉴번호 세팅
                        this.data.topMenuNo = item.menuNo;
                        this.data.newRow.sub.groupNo = item.menuNo;
                        // 하위메뉴 출력
                        let list = this.data.subList.filter(f => item.menuNo == f.groupNo);
                        this.grid.sub.setData(JSON.parse(JSON.stringify(list)));
                    }
                }
            }            
        });

        // 하위메뉴 그리드 생성
        this.grid.sub = new wGrid('subMenu', {
            fields: [
                {title: null, element:'checkbox', name: 'check', edit: 'checkbox', width:'3%', align:'center'},
                {title:'메뉴번호', element: 'text', name: 'menuNo', width: '5%'},
                {title:'메뉴명', element: 'text', name: 'menuNm', edit: 'text', width: '16%'},
                {title:'메뉴URL', element: 'text', name: 'menuUrl', edit: 'text', width: '20%'},                
                {title:'메뉴순번', element: 'number', name: 'menuSeq', edit: 'number', width: '5%'},
                {title:'권한', element: 'text', name: 'authCd', edit: 'select', width: '8%', data: this.data.code},
                {title:'전시여부', element: 'text', name: 'dispYn', edit:'select', width: '7%', data: this.data.mapping},
                {title:'사용여부', element: 'text', name: 'useYn', edit:'select', width: '7%', data: this.data.mapping},
                {title:'등록자', element: 'text', name: 'insNo', width: '5%'},
                {title:'등록일시', element: 'text', name: 'insDttm', width: '10%'},
                {title:'수정자', element: 'text', name: 'uptNo', width: '5%'},
                {title:'수정일시', element: 'text', name: 'uptDttm', width: '10%'},
            ],
            option: { 
                style: { height: Number(gridHeight/2)+13, overflow: { y: 'scroll'}},
            },
            data: { insert: this.data.newRow.sub }
        });
    },

    /**
     * 메뉴 이벤트 생성
     */
    createEvent(){
        // 상위 메뉴 추가 버튼
        btnTopAdd.addEventListener('click', () => this.grid.top.prependRow());
        // 상위 메뉴 편집 버튼
        btnTopEdit.addEventListener('click', () => this.grid.top.modifyRowCheckedElement('check'));
        // 상위 메뉴 삭제 버튼
        btnTopRemove.addEventListener('click', () => this.grid.top.removeRowCheckedElement('check'));
        // 상위 메뉴 취소 버튼
        btnTopCancel.addEventListener('click', () => this.grid.top.cancelRowCheckedElement('check'));        
        // 상위 메뉴 저장 버튼
        btnTopSave.addEventListener('click', () => this.applyTopMenu(this.grid.top.getApplyData()));

        // 하위 메뉴 추가 버튼
        btnSubAdd.addEventListener('click', () => this.subMenuEvent(this.grid.sub.prependRow));
        // 하위 메뉴 편집 버튼
        btnSubEdit.addEventListener('click', () => this.subMenuEvent(this.grid.sub.modifyRowCheckedElement, 'check'));
        // 하위 메뉴 삭제 버튼
        btnSubRemove.addEventListener('click', () => this.subMenuEvent(this.grid.sub.removeRowCheckedElement, 'check'));
        // 하위 메뉴 취소 버튼
        btnSubCancel.addEventListener('click', () => this.subMenuEvent(this.grid.sub.cancelRowCheckedElement, 'check'));        
        // 하위 메뉴 저장 버튼
        btnSubSave.addEventListener('click', () => this.applySubMenu(this.grid.sub.getApplyData()));
    },

    /**
     * 하위메뉴 메뉴 이벤트 공통 실행
     */
    subMenuEvent(callFunction, value){
        callFunction(value);
        if(this.grid.sub.getApplyData().length > 0){
            this.data.isSubMenuApply = true;
            this.grid.top.chageOption('option.style.row.isChose', false);
        }else{
            this.data.isSubMenuApply = false;
            this.grid.top.chageOption('option.style.row.isChose', true);
        }
    },

    /**
     * 상위 메뉴정보 등록/수정/삭제 적용
     * @param {array<object>} list 
     */
    applyTopMenu(list){

        // 유효성 검사
        if(this.applyValidation(list, 1) == false) return false;

        // 삭제 알림
        if(list.filter(f => f._state == 'REMOVE').length > 0){
            if(confirm('상위메뉴 삭제시 하위메뉴도 삭제됩니다. 진행하시겠습니까?') == false){
                return false;
            }
        // 진행확인
        }else{
            if(confirm('등록 및 수정 내역을 저장하시겠습니까?') == false){
                return false;
            }
        }

        // 작업내용 저장 호출
        sender.request({url: '/system/applyMenu', body: {menuLv: 1, applyList: list}})
            .then(response => {
                if(response.resultCode == 'SUCCESS'){
                    alert('적용되었습니다.');
                    this.data.isSubMenuApply = false;
                    this.grid.top.chageOption('option.style.row.isChose', true);
                    this.selectMenu();
                }else{
                    alert(response.message);
                }
            })
            .catch(error => alert(error));
    },

    /**
     * 상위 메뉴정보 등록/수정/삭제 적용
     * @param {*} list 
     */
    applySubMenu(list){

        // 유효성 검사
        if(this.applyValidation(list, 2) == false) return false;

        // 진행 확인
        if(confirm('등록/수정/삭제 내역을 저장하시겠습니까?') == false){
            return false;
        }

        // 작업내용 저장 호출
        sender.request({url: '/system/applyMenu', body: {menuLv: 2, applyList: list}})
            .then(response => {
                if(response.resultCode == 'SUCCESS'){
                    alert('적용되었습니다.');
                    this.data.isSubMenuApply = false;
                    this.grid.top.chageOption('option.style.row.isChose', true);
                    this.selectMenu();
                }else{
                    alert(response.message);
                }
            })
            .catch(error => alert(error));
    },

    /**
     * 메뉴관리 유효성 검사
     * @param {*} list 
     * @returns 
     */
    applyValidation(list, menuLv){

        let isValidation = true;
        let message = null;
        let element = null;

        for(let item of list){
            if(item._state == 'INSERT' || item._state == 'UPDATE'){
                // 메뉴명 빈값체크
                if(menuLv == 1 && isEmpty(item.menuNm) == true){
                    isValidation = false;
                    element = this.grid[menuLv == 1 ? 'top' : 'sub'].getSeqCellElement(item._rowSeq, 'menuNm');
                    message = '메뉴명을 입력해 주세요.';
                    break;
                }
                // 메뉴URL 빈값체크
                if(menuLv == 2 && isEmpty(item.menuUrl) == true){
                    isValidation = false;
                    element = this.grid[menuLv == 1 ? 'top' : 'sub'].getSeqCellElement(item._rowSeq, 'menuUrl');
                    message = '메뉴URL을 입력해 주세요.';
                    break;
                }
                // 메뉴순번 빈값체크
                if(isEmpty(item.menuSeq) == true){
                    isValidation = false;
                    element = this.grid[menuLv == 1 ? 'top' : 'sub'].getSeqCellElement(item._rowSeq, 'menuSeq');
                    message = '메뉴순번을 입력해 주세요.';
                    break;
                }
            }
        }

        // 얼럿표시 및 포커스 이동
        if(isValidation == false){
            alert(message);
            element.focus();
        }

        return isValidation;
    }
}