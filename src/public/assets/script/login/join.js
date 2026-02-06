import { constant } from "/script/common/common.js";
import { isEmpty, isPassword, isEmail } from "/script/common/validation.js";
import { sender } from "/script/common/sender.js";

const crypt = new JSEncrypt();
window.addEventListener("DOMContentLoaded", event => {
   
    // 암호화 공개키 세팅
	crypt.setPublicKey(constant.aes256.publicKey);

    // 회원가입
    join.addEventListener('click', joinProcess);
});

/**
 * 유효성 검사
 * @param {object} params 
 */
function joinValidation(params){

    // 타겟명
	let paramName = {userId : "아이디", password : "비밀번호", email : "이메일"};
		
	// 빈값 체크
	for(let key in params){
    	if(isEmpty(params[key])){
			alert(paramName[key] + "을(를) 입력해주십시오.");
			document.getElementById(key).focus();
			return false;
		}
	}

    // 비밀번호 확인
	if(params.password !== params.confirm){
		alert("비밀번호가 일치하지 않습니다.");
		document.getElementById("password").focus();
		return false;	
	}
	
	// 비밀번호 체크
	if(isPassword(params.password) == false){
		alert("비밀번호가 올바르지 않습니다. \n (8~20자리, 영문, 숫자 포합되어야 합니다.)");
		document.getElementById("password").focus();
		return false;
	} 
	
	// 이메일 체크
	if(isEmail(params.email) == false){
		alert("이메일이 올바르지 않습니다.");
		document.getElementById("email").focus();
		return false;
	}

    return true;
}

/**
 * 회원가입
 */
function joinProcess(){

    let params = {
        userId: document.getElementById("userId").value,
        password: document.getElementById("password").value,
        confirm: document.getElementById("confirm").value,
        email: document.getElementById("email").value
    }

    // 유효성 검사
	if(joinValidation(params) == false){
		return;
	}

    // 암호화
	params.password = crypt.encrypt(params.password);
    params.email = crypt.encrypt(params.email);
	params.confirm = null;

    // 회원가입
	sender.request({
		url: '/login/joinProcess',
		body: params
	}).then(data => {
		if(data.resultCode === "SUCCESS"){
			alert(data.message);
			window.location.replace('/login');
		}else{
			alert(data.message);
		}
	}).catch(function(error){
		console.error("error:", error);
	});
}