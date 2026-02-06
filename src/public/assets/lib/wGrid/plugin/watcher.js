import { util } from './util.js';
import { constant } from "./constant.js";
import { reposit } from "./reposit.js";
import { status } from "./status.js";
import { creator } from "./creator.js";
import { amender } from "./amender.js";
import { canceler } from "./canceler.js";


/**
 * 그리드 이벤트 관련 객체
 */
export const watcher = {

    /**
     * 그리드 상태 객체 초기설정
     * @param {*} self
     * @returns 
     */
    init: (self, outerEvent) => init(self, outerEvent)
}

/**
 * 그리드 이벤트 관련 초기설정
 * @param {*} self
 * @param {*} outerEvent
 */
const init = (self, outerEvent) => {

    // 생성할 이벤트 종류
    let evList = ['click', 'change', 'keyup', 'dblclick'];
    // 내부 연결 이벤트
    let innerEvent = {};
    // 필드 데이터
    let fields = reposit.getFields(self);

    // 필드 이벤트 세팅
    for(let i=0; i<fields.length; i++){
        
        let field = fields[i];
        
        // 빈값이면 통과
        if(field.event == undefined || field.event == null){
            continue;
        }

        // 그리드 내부 연결 이벤트 세팅
        evList.forEach(evName => {                
            if(field.event[evName]){

                // 빈값체크
                if(!innerEvent[evName]) innerEvent[evName] = {};

                // 이벤트 등록
                innerEvent[evName][field.name] = {
                    head: field.event[evName].head ? field.event[evName].head : null,
                    body: field.event[evName].body ? field.event[evName].body : null
                }
            }
        });
    }

    // 그리드 HEAD HTML
    let headElement = creator.getHeadElement(self);
    // 그리드 BODY HTML
    let bodyElement = creator.getBodyElement(self);
    // 그리드 BODY Table HTML
    let bodyTbElement = creator.getBodyTbElement(self);

    // 헤드 이벤트 세팅
    for(let i=0; i<evList.length; i++){

        // 헤드쪽에서는 더블클릭 이벤트 미사용
        if(evList[i] === 'dblclick'){
            continue;
        }

        // 이벤트 등록
        headElement.addEventListener(evList[i], event => {

            // 헤드 체크박스 전체선택
            if(event.target.type == 'checkbox' && evList[i] == 'change'){
                self.setAllChecked(event.target.name, event.target.checked);
            }
            
            if(innerEvent[evList[i]]
                && innerEvent[evList[i]][event.target.name]
                && innerEvent[evList[i]][event.target.name].head ){
                // 연결된 이벤트 호출
                innerEvent[evList[i]][event.target.name].head(event);
            }
            event.stopPropagation();
        });
    }

    // 바디 이벤트 세팅
    for(let i=0; i<evList.length; i++){

        // 더블클릭 이벤트 미사용일 경우 통과
        if(evList[i] === 'dblclick' && self.option.isDblClick !== true){
            continue;
        }

        bodyElement.addEventListener(evList[i], event => {

            // 체크박스 클릭이벤트 강제 종료
            if(event.type == 'click' && event.target.dataset.sync == 'checkbox') return;
            
            // 행과 셀 타겟 가져오기
            let row = util.closest("TR", event.target);
            if(!row)return;
            let cell = util.closest("TD", event.target);
            if(!cell)return;

            // 셀 이름 가져오기
            let name = cell.dataset.cellName;
            
            // 목록 데이터관련 변수
            let sequence = row.dataset.rowSeq;
            let index = status.getSeqIndex(self, sequence);
            let data = reposit.getData(self, index);

            // 데이터 동기화
            switch(event.target.dataset.sync){
            case 'checkbox':
                data[name] = 
                    event.target.checked == true ? self.option.checkbox.check : self.option.checkbox.uncheck;
                break;
            case 'number':
                let number = Number(event.target.value.replace('/[^0-9]/g', ''));
                let value = Number.isNaN(number) ? data[name] : number;
                data[name] = value;
                event.target.value = value;
                break;
            case 'text': case 'select': case 'date': case 'dateTime':
                data[name] = event.target.value;
                break;
            }

            // 연결할 이벤트 체크
            if(innerEvent[evList[i]]
                && innerEvent[evList[i]][name]
                && innerEvent[evList[i]][name].body ){
                // 연결된 이벤트 호출
                innerEvent[evList[i]][name].body(
                    event,
                    reposit.getDeepData(self, index),
                    index,
                    sequence
                );
            }

            // 외부 이벤트 체크
            if(outerEvent && outerEvent[evList[i]]){
                // 정의된 외부 이벤트 호출
                outerEvent[evList[i]](
                    event,
                    reposit.getDeepData(self, index),
                    index,
                    sequence
                );
            }

            // 자동 행 상태변경 활성화 된 경우
            if(self.option.isRowStatusObserve === true){
                // keyup, change 이벤트만 적용
                if(evList[i] == 'keyup' || evList[i] == 'change'){
                    // 예외 필드명 실행막기
                    if(self.option.rowStatusObserve.exceptList.includes(event.target.name) === false){
                        // 변경사항 체크
                        if(amender.isRowModify(self, index, sequence, self.option.rowStatusObserve)){
                            // 단순 행상태 변경인지 태그재생성인지 여부 분기
                            if(self.option.rowStatusObserve.isRowEditMode === true){
                                // 편집모드상태 변경(태그변경)
                                amender.modifyRowElement(self, index, sequence);
                            }else{
                                // 편집상태 변경(스타일 변경)
                                amender.modifyRow(self, index, sequence);
                            }
                        }else{
                            // 단순 행상태 변경인지 태그재생성인지 여부 분기
                            if(self.option.rowStatusObserve.isRowEditMode == true){
                                // 편집모드상태를 취소(태그변경)
                                canceler.cancelRowElement(self, index, sequence);
                            }else{
                                // 편집상태를 취소(스타일 변경)
                                canceler.cancelRow(self, index, sequence);
                            }
                        }
                    }
                }
            }

            /**
             * 그리드 내부 이벤트 
             */
            // 행선택 chose 옵션 설정시
            if(evList[i] == 'click' 
            && ['INPUT', 'SELECT', 'BUTTON'].includes(event.target.tagName) == false
            && self.option.style.row.isChose == true){
                bodyTbElement.childNodes.forEach(item => item.classList.remove(constant.class.row.choose));
                row.classList.add(constant.class.row.choose);
            }

            event.stopPropagation();
        });
    }
}