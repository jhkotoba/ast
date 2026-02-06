import { constant } from "/script/common/common.js";
import { sender } from "/script/common/sender.js";
import { createMenu } from "/script/common/menu.js";

const crypt = new JSEncrypt();
window.addEventListener("DOMContentLoaded", event => {
	// 스토로지 전체 초기화
	sessionStorage.clear();
   
    // 암호화 공개키 세팅
	crypt.setPublicKey(constant.aes256.publicKey);

    // 로그인 버튼
	login.addEventListener('click', loginProcess);
	password.addEventListener('keyup', event => event.keyCode === 13 ? loginProcess(event) : null);
});

/**
 * 로그인 처리
 */
 async function loginProcess(){
	let userId = crypt.encrypt(document.getElementById("userId").value);
	let password = crypt.encrypt(document.getElementById("password").value);
	// 로그인 처리
	let loginRes = await sender.request({url: '/login/loginProcess', body: {userId, password}});
	
	if(loginRes.resultCode === 'SUCCESS'){

		// 사용자 메뉴조회
		let menuRes = await sender.request({url: '/system/getUserMenuList', body: {}});
		if(menuRes.resultCode === 'SUCCESS'){

			// 세션스토로지 초기화
			sessionStorage.removeItem(constant.storage.menu);	
			// 메뉴 태그 생성, 세션스토로지 저장
			sessionStorage.setItem(constant.storage.menu, createMenu(menuRes.data));

			// 메인 페이지 이동
			window.location.href = "/";
		}else{
			alert(menuRes.message);
		}
	}else{
		alert(loginRes.message);
	}
}