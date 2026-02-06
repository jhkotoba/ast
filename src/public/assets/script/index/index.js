import { constant } from "/script/common/common.js";

/**
 * 사이드 메뉴 및 이벤트 생성
 */
const aside = document.getElementsByTagName('aside')[0];
aside.innerHTML = sessionStorage.getItem(constant.storage.menu);
aside.addEventListener('click', event => {
    if(event.target.dataset.lv == 1){
        let childNodes = event.target.nextSibling.childNodes;
        if(childNodes.length > 0 && childNodes[0].classList.contains('off')){
            childNodes.forEach(el => el.classList.remove('off'));
        }else{
            childNodes.forEach(el => el.classList.add('off'));
        }
    }else{
        sessionStorage.setItem(constant.storage.menu, document.getElementsByTagName('aside')[0].innerHTML);
        event.target.dataset.url ? document.location.href = event.target.dataset.url : null;
    }
});
