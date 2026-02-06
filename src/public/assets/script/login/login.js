import { constant } from "/script/common/common.js";
import { sender } from "/script/common/sender.js";
import { createMenu, defaultMenuList } from "/script/common/menu.js";

const crypt = new JSEncrypt();

window.addEventListener("DOMContentLoaded", () => {
	// 스토리지 전체 초기화
	sessionStorage.clear();

	// 암호화 공개키 세팅
	crypt.setPublicKey(constant.aes256.publicKey);

	// 로그인 버튼
	login.addEventListener("click", loginProcess);
	password.addEventListener("keyup", (event) => (event.keyCode === 13 ? loginProcess() : null));
});

async function loginProcess(){
	const userId = crypt.encrypt(document.getElementById("userId").value);
	const password = crypt.encrypt(document.getElementById("password").value);

	const loginRes = await sender.request({ url: "/login/loginProcess", body: { userId, password } });
	if(loginRes.resultCode !== "SUCCESS"){
		alert(loginRes.message);
		return;
	}

	// 메뉴관리 기능을 사용하지 않으므로 기본 메뉴를 고정 생성
	const menuHtml = createMenu(defaultMenuList);
	sessionStorage.setItem(constant.storage.menu, menuHtml);

	window.location.href = "/";
}

