import { sender } from "/script/common/sender.js";
import { isEmpty } from "/script/common/validation.js";

// 코드 객체
const code = {};

// 최초실행
window.addEventListener('DOMContentLoaded', async event => {

    // 공통코드 목록 조회
    let response = await code.search();

    // 그리드 생성
    code.createGrid();

    // 그리드 데이터 세팅
    code.grid.setData(response.list, response.params);

    // 조회버튼 클릭 이벤트
    btnSearch.addEventListener('click', e => code.search({
            srhType: sbSrhType.value,
            srhWord: iptSrhWord.value,
            useYn: document.querySelector('input[name="useYn"]:checked').value
        }).then(data => code.grid.setData(data.list, data.params)));
    
    // 추가버튼 클릭 이벤트
    btnAdd.addEventListener('click', e => code.grid.prependRow());
    // 새로고침 클릭 이벤트
    btnRefresh.addEventListener('click', e => code.search().then(data => code.grid.setData(data.list, data.params)));
    // 저장버튼 클릭 이벤트
    btnSave.addEventListener('click', code.applyCode);
});

// 공통코드 조회
code.search = async function(params){

    // 파라미터가 없을 경우 빈 객체 생성
    if(params === undefined) params = {};

    // 페이징 정보가 없을 경우 기본 페이징 세팅
    if(params.paging === undefined){
        params.paging = {pageNo: 1, pageSize: Number(sbPageSize.value), pageBlock: 10, totalCount: 0}
    }

    // 코드목록 조회
    let response = await sender.request({url: '/system/getCodeList', body: params});

    // 응답 성공 시
    if(response.resultCode == 'SUCCESS'){
        response.data.list.forEach(item => item.check = false);
        return response.data;
    // 응답 실패 시
    }else{
        console.error(response.message);
        alert(response.message);

        // 빈값 반환
        return {list:[], params:{}};
    }
};

// 코드목록 생성
code.createGrid = function(){

    // 그리드 높이 설정
    let gridHeight = window.innerHeight - 294;

    this.grid = new wGrid('commonCode', {
        // 필드 설정
        fields: [
            {title:'삭제', element:'checkbox', name: 'check', width:'4%', align:'center'},
            {title:'코드번호', element: 'text', name: 'codeNo', width: '5%'},
            {title:'코드', element: 'text-edit', name: 'code', width: '18%', maxlength: 50},
            {title:'코드명', element: 'text-edit', name: 'codeNm', width: '18%', maxlength: 100},
            {title:'그룹코드', element: 'text-edit', name: 'groupCd', width: '18%', maxlength: 50},
            {title:'사용여부', element: 'select', name: 'useYn', width: '7%', data: {
                select: {list: [{value:'Y', text:'사용'}, {value:'N', text:'미사용'}]}}
            },
            {title:'등록자', element: 'text', name: 'insNo', width: '5%'},
            {title:'등록일시', element: 'text', name: 'insDttm', width: '10%'},
            {title:'수정자', element: 'text', name: 'uptNo', width: '5%'},
            {title:'수정일시', element: 'text', name: 'uptDttm', width: '10%'},
        ],
        option: { 
            // 그리드 스타일 설정
            style: { height: gridHeight ? gridHeight : 635, overflow: {y: 'scroll'}},
            // 페이징 여부
            isPaging: true,
            // 행 상태변경 체크 옵션
            isRowStatusObserve: true,
            // 행 상태변경 옵션 설정
            rowStatusObserve: {
                // 단순 행상태 변경인지 태그재생성인지 여부 설정
                isRowEditMode: false,
                // 예외설정 field의 name
                exceptList: ['check']
            }
        },
        // 목록 조회함수 설정
        search: code.search,
        // 그리드에 사용되는 데이터
        data: {
            // 신규행 생성시 기본 데이터
            insert: {code: '', codeNm: '', groupCd:'', useYn: 'Y'},
        },
        event: {
            change: (event, item, index, sequence) => {
                // 삭제 체크박스 클릭시 행 삭제상태, 체크해제시 행 삭제상태 취소
                if(event.target.name == 'check'){
                    if(event.target.checked){
                        this.grid.removeRow(index, sequence, {exceptDisabledList: ['check']});
                    }else{
                        this.grid.cancelRow(index, sequence);
                    }
                }
            }
        }
    });
}

// 코드 등록
code.applyCode = function(){

    // 적용대상 목록
    let applyList = code.grid.getApplyData();

    // 체크여부
    let isValidation = true;
    let element = null;
    let message = null;

    // 중복코드 체크
    let overlap = new Set();
    for(let item of code.grid.getData()){
        if(overlap.has(item.code) == true){
            isValidation = false;
            element = code.grid.getSeqCellElement(item._rowSeq, 'code');
            message = '중복되는 코드가 존재 합니다.';
            applyList = [];
            break;
        }else{
            overlap.add(item.code);
        }
    }

    for(let item of applyList){
        if(item._state == 'INSERT' || item._state == 'UPDATE'){
            // 코드 빈값 체크
            if(isEmpty(item.code) == true){
                isValidation = false;
                element = code.grid.getSeqCellElement(item._rowSeq, 'code');
                message = '코드를 입력해주세요.';
                break;
            }
            // 코드명 빈값 체크
            if(isEmpty(item.codeNm) == true){
                isValidation = false;
                element = code.grid.getSeqCellElement(item._rowSeq, 'codeNm');
                message = '코드명를 입력해주세요.';
                break;
            }
            if(isEmpty(item.groupCd) == true){
                isValidation = false;
                element = code.grid.getSeqCellElement(item._rowSeq, 'groupCd');
                message = '그룹코드를 입력해주세요.';
                break;
            }
        }
    }

    if(isValidation){

        if(confirm('적용하시겠습니까?') == false) return false;

        // 저장
        sender.request({url: '/system/applyCode', body: {applyList}})
        .then(response => {
            if(response.resultCode == 'SUCCESS'){
                alert('적용되었습니다.');                

                sbPageSize.value = 20;
                code.search().then(data => code.grid.setData(data.list, data.params));
            }else{
                alert(response.message);
            }
        })
        .catch(error => alert(error));
    }else{
        // 얼럿표시 및 포커스 이동
        alert(message);
        element.focus();
        return isValidation;
    }
}