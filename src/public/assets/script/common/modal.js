/**
 * 모달 제어
 */
export const modal = {

    /**
     * 모달 팝업 생성
     * @param {*} openId 
     * @param {*} closeId
     * @param {*} parameter 
     * @returns 
     */
    create: (openId, closeId, parameter) => new Modal(openId, closeId, parameter)
}

/**
 * 모달 객체
 */
class Modal {
    // 생성자
    constructor(openId, closeId, parameter){
        
        // 모달의 타켓
        this.modalTarget = document.getElementById(openId);
        // 모달의 닫기 타겟
        this.closeTarget = document.getElementById(closeId);
        // 모달의 content
        this.modalContent = this.modalTarget.querySelector('.content');

        /**
         * 옵션 세팅
         */
        // z-index 세팅
        if(parameter?.option?.zIndex){
            this.modalTarget.style.zIndex = parameter.option.zIndex;
        }
        // open 콜백 세팅
        if(parameter?.beforeOpenFn && typeof parameter.beforeOpenFn == 'function'){
            this.beforeOpenFn = parameter.beforeOpenFn;
        }
        if(parameter?.afterOpenFn && typeof parameter.afterOpenFn == 'function'){
            this.afterOpenFn = parameter.afterOpenFn;
        }
        // close 콜백 세팅
        if(parameter?.beforeCloseFn && typeof parameter.beforeCloseFn == 'function'){
            this.beforeCloseFn = parameter.beforeCloseFn;
        }
        if(parameter?.afterCloseFn && typeof parameter.afterCloseFn == 'function'){
            this.afterCloseFn = parameter.afterCloseFn;
        }

        

        // 높이, 넓이 설정
        if(parameter?.option?.dimensions){
            // 높이 설정
            if(parameter?.option?.dimensions?.height){
                this.modalContent.style.height = parameter.option.dimensions.height;
                this.modalContent.style.margin = ((window.innerHeight - Number(String(parameter.option.dimensions.height).replace(/\D/g, '')))/2) + 'px auto';
            }
            // 넓이 설정
            if(parameter?.option?.width){
                this.modalContent.style.width = parameter.option.width;
            }
        }

        // 닫기 이벤트 생성
        this.closeTarget.addEventListener('click', e => this.close(e));

        

        // const openModalButton = document.getElementById("openModal");
        // const modal = document.getElementById("modal");
        // const closeModalButton = document.getElementById("closeModal");

        // openModalButton.addEventListener("click", () => {
        //   modal.style.display = "block";
        // });

        // closeModalButton.addEventListener("click", () => {
        //   modal.style.display = "none";
        // });

        // window.addEventListener("click", (event) => {
        //   if (event.target === modal) {
        //     modal.style.display = "none";
        //   }
        // });


    }

    /**
     * 모달팝업 열기
     */
    open = (parameter) => {

        // 모달창 열기 전 콜백함수 호출
        if(typeof this.beforeOpenFn === 'function'){
            this.beforeOpenFn(parameter);
        }

        // 모달팝업 표시
        this.modalTarget.classList.add('on');

        // 모달창 표시 후 콜백함수 호출
        if(typeof this.afterOpenFn === 'function'){
            this.afterOpenFn(parameter);
        }
    }

    /**
     * 모달팝업 닫기
     */
    close = (parameter) => {

        // 모달창 열기 전 콜백함수 호출
        if(typeof this.beforeCloseFn === 'function'){
            this.beforeCloseFn(parameter);
        }

        // 모달팝업 표시
        this.modalTarget.classList.remove('on');

        // 모달창 표시 후 콜백함수 호출
        if(typeof this.afterCloseFn === 'function'){
            this.afterCloseFn(parameter);
        }
    }
}