import { sender } from "/script/common/sender.js";
import { isEmpty } from "/script/common/validation.js";
import { modal } from "/script/common/modal.js";

// 공동코드 맵핑
const mappingCode = __code.reduce((acc, curr) => {
    acc[curr.code] = curr.codeNm;
    return acc;
}, {});

// 페이지 로드 완료 실행 로직
window.addEventListener('DOMContentLoaded', function(event){
    
    // 계좌목록 세팅
    initAcctList();
});

// 은행코드 목록
const bankCd = __code.filter(f => f.groupCd === 'GRP_CD_BANK');
// 계좌유형코드 목록
const acctTpCd = __code.filter(f => f.groupCd === 'GRP_CD_ACCT_TYPE');
__code = undefined;

// 계좌목록 그리드 선언
const account = new wGrid('account', {
    fields: [
        {title: null, element:'checkbox', name: 'check', edit: 'checkbox', width:'3%', align:'center'},
        {title:'번호', element: 'text', name: 'acctNo', width: '3%'},
        {title:'은행', element: 'text', name: 'bankCd', edit:'select', width: '10%', 
            data: {mapping: mappingCode, select: {list: bankCd, value: 'code', text: 'codeNm'}}
        },
        {title:'계좌유형', element: 'text', name: 'acctTpCd', edit: 'select', width: '8%',
            data: {mapping: mappingCode, select: {list: acctTpCd, value: 'code', text: 'codeNm'}}
        },
        {title:'계좌명', element: 'text', name: 'acctNm', edit: 'text', width: '16%'},
        {title:'계좌번호', element: 'text', name: 'acctNum', edit: 'text', width: '15%'},        
        {title:'순번', element: 'number', name: 'acctSeq', edit:'text', width: '5%'},
        {title:'사용여부', element: 'text', name: 'useYn', edit:'select', width: '6%', 
            data: {
                mapping: {'Y': '사용', 'N': '미사용'},
                select: {list: [{value:'Y', text:'사용'}, {value:'N', text:'미사용'}]}
            },
        },
        {title:'등록자', element: 'text', name: 'insNo', width: '7%'},
        {title:'등록일시', element: 'text', name: 'insDttm', width: '10%'},
        {title:'수정자', element: 'text', name: 'uptNo', width: '7%'},
        {title:'수정일시', element: 'text', name: 'uptDttm', width: '10%'}                
    ],
    option: { 
        isPaging: true,
        isDblClick: true,
        style: {
            height: (window.innerHeight - 205), overflow: { y: 'scroll'},
            row:{
                cursor: 'pointer'
            }
        },  
        data: { insert: {acctNum: '', acctNm: '', bankCd:'', acctSeq: 0} }
    },
    search: async (params) => {

        // 기본값 세팅
        if(params === undefined) params = {};
        if(params.paging === undefined){
            params.paging = {pageNo: 1, pageSize: 50, pageBlock: 10, totalCount: 0};
        }

        // 계좌목록 조회
        let response = await sender.request({url: '/account/getAccountList', body: params});

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
    },
    event: {
        dblclick: (e, data) => data._state === 'SELECT' ? acctModal.open(data) : null
    }
});

// 계좌 상세팝업
const acctModal = modal.create('acctModal', 'acctClose', {
    option: {
        dimensions: {
            height: '500px',
            width: '700px'
        }
    },
    beforeOpenFn: function(data){

        // 계좌상세 모달 데이터 비우기
        cleanAcctModal();
        // 계좌상세 모달 데이터 세팅
        setAcctModal(data);
    }
});

/**
 * 계좌목록 세팅
 */
function initAcctList(){
    // 계좌목록 조회
    account.search().then(data => account.setData(data.list, data.params));

    // 버튼 이벤트 등록
    btnAdd.addEventListener('click', () => account.prependRow());

    // 편집 버튼
    btnEdit.addEventListener('click', () => account.modifyRowCheckedElement('check'));

    // 저장버튼 클릭 이벤트
    btnSave.addEventListener('click', applyAccount);
}

// 계좌목록 적용(추가, 수정, 삭제)
function applyAccount(event){

    let applyList = account.getApplyData();

    let isValidation = true;
    let element = null;
    let message = null;

    for(let item of applyList){
        
        // 계좌번호 체크
        if(isEmpty(item.acctNum) === true){
            isValidation = false;
            element = account.getSeqCellElement(item._rowSeq, 'acctNum');
            message = '계좌번호를 입력해 주세요.';
        }

        // 계좌명 체크
        if(isEmpty(item.acctNm) === true){
            isValidation = false;
            element = account.getSeqCellElement(item._rowSeq, 'acctNm');
            message = '계좌명을 입력해 주세요.';
        }

        // 은행코드 체크
        if(isEmpty(item.bankCd) === true){
            isValidation = false;
            element = account.getSeqCellElement(item._rowSeq, 'bankCd');
            message = '은행코드를 선택해 주세요.';
        }
    }

    if(isValidation === true){
        if(confirm('적용하시겠습니까?') == false) return false;

        // 저장
        sender.request({url: '/account/applyAccount', body: {applyList}})
        .then(response => {
            if(response.resultCode == 'SUCCESS'){
                alert('적용되었습니다.');                
                account.search().then(data => account.setData(data.list, data.params));
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

/**
 * 계좌상세팝업 클린
 */
function cleanAcctModal(){
    console.log('function cleanModal');


}

/**
 * 계좌상세팝업 데이터 세팅
 */
function setAcctModal(data){
    console.log('function setAcctModal ::', data);


}