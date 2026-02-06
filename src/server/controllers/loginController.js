const userService = require(`${basePath}/services/userService.js`);
const jsencrypt = require('nodejs-jsencrypt');
const logger = require(`${basePath}/config/logger.js`);

// 로그인 처리
exports.loginProcess = async (request, response, next) => {

    // 회원정보 조회 및 비밀번호체크 
    userService.getLoginUser(request.body)
        .then(user => {
            if(user == null){
                response.status(200).json({message: '로그인에 실패하였습니다.', resultCode: 'FAIL'});
            }else{
                request.session.user = {userNo: user.userNo, userId: user.userId, email: user.email, authCd: user.authCd}
                response.status(200).json({message: 'SUCCESS', resultCode: 'SUCCESS'});
            }
        }).catch(error => {
            logger.error(error);
            switch(error.message){
                case 'ID_OR_PASSWORD_NOT_MATCH':
                    response.status(200).json({message: '로그인에 실패하였습니다.', resultCode: 'FAIL'});
                    break;
                default :
                    response.status(500).json({resultCode: 'SYSTEM_ERROR', message: `시스템 오류가 발생하였습니다.`});
                    break;
            }
            
        });
}

/**
 * 회원가입 처리
 * @param {*} request 
 * @param {*} response 
 * @param {*} next 
 */
exports.joinProcess = async (request, response, next) => {

    // 복호화 객체 생성
    const crypt = new jsencrypt.JSEncrypt();
    crypt.setPrivateKey(process.env.AES256_PRIVATE_KEY);
    
    // 회원 아이디
    let userId = request.body.userId;
    // 회원 비밀번호
    let password = crypt.decrypt(request.body.password);
    // 회원 이메일
    let email = crypt.decrypt(request.body.email);

    // 회원등록
    userService.joinUser({userId, password, email}).then(value => {
        // 회원등록 성공 응답 처리
        response.status(200).json({resultCode: 'SUCCESS', message: '회원가입이 처리되었습니다.'});

    // 회원등록 예외 및 오류
    }).catch(error => {
        switch(error.message){
            case 'ALREADY_EXISTS_ID': 
                response.status(200).json({resultCode: error.message, message: '이미 존재하는 아이디 입니다.'});
            break;
            case 'EMPTY_PARAMETER': 
                response.status(200).json({resultCode: error.message, message: '입력값이 누락되었습니다.'});
            break;
            case 'NOT_EMAIL_FORMAT': 
                response.status(200).json({resultCode: error.message, message: '이메일 형식이 올바르지 않습니다.'});
            break;
            case 'INSERT_FAIL':
                response.status(200).json({resultCode: error.message, message: '저장에 실패하였습니다.'});
            break;
            default:
                response.status(500).json({resultCode: 'SYSTEM_ERROR', message: `시스템 오류가 발생하였습니다.`});
            break;
        }
    });
}