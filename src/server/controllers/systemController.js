const logger = require(`${basePath}/config/logger.js`);
const menuService = require(`${basePath}/services/menuService.js`);
const codeService = require(`${basePath}/services/codeService.js`);
const userService = require(`${basePath}/services/userService.js`);

/**
 * 사용자 메뉴목록 조회
 * @param {*} request 
 * @param {*} response 
 * @param {*} next 
 */
exports.getUserMenuList = async (request, response, next) => {

    // 메뉴목록 조회
    await menuService.getUserMenuList({authCd: request.session.user.authCd}).then(value => {
        response.status(200).json({
            message: 'SUCCESS',
            resultCode: 'SUCCESS',
            data: value
        });
    }).catch(error => {
        logger.error('getUserMenuList:', error);
        // 예외 응답
        switch(error.message){
            case 'NO_SEARCH_MENU':
                response.status(200).json({resultCode: error.message, message: `시스템 오류가 발생하였습니다. (${error.message})`});
            break;
            default:
                response.status(500).json({resultCode: 'SYSTEM_ERROR', message: `시스템 오류가 발생하였습니다.`});
            break;
        }
    });
}

/**
 * 메뉴목록 조회
 * @param {*} request 
 * @param {*} response 
 * @param {*} next 
 */
exports.getMenuList = async (request, response, next) => {

    // 메뉴목록 조회
    await menuService.getMenuList().then(value => {
        response.status(200).json({
            message: 'SUCCESS',
            resultCode: 'SUCCESS',
            data: value
        });
    }).catch(error => {

        // 로그아웃 처리
        request.session.destroy();

        // 예외 응답
        switch(error.message){
            case 'NO_SEARCH_MENU':
                response.status(200).json({resultCode: error.message, message: `시스템 오류가 발생하였습니다. (${error.message})`});
            break;
            default:
                response.status(500).json({resultCode: 'SYSTEM_ERROR', message: `시스템 오류가 발생하였습니다.`});
            break;
        }
    });
}

/**
 * 메뉴정보 등록/수정/삭제 적용
 * @param {*} request 
 * @param {*} response 
 * @param {*} next 
 */
exports.applyMenu = async (request, response, next) => {

    await menuService.applyMenu({  
        applyList: request.body.applyList,
        menuLv: request.body.menuLv,
        userNo: request.session.user.userNo
    }).then(result => {
        response.status(200).json({
            message: 'SUCCESS',
            resultCode: 'SUCCESS',
            data: result
        });
    }).catch(error => {
        // 예외 응답
        logger.error(`systemController.applyMenu catch ERROR::[${error}]`);
        switch(error.message){
            case 'ISNERT_COUNT_DIFFERENT' :
                response.status(200).json({resultCode: error.message, message: `등록 수량이 일치하지 않습니다.`});
                break
            case 'UPDATE_COUNT_DIFFERENT' :
                response.status(200).json({resultCode: error.message, message: `수정 수량이 일치하지 않습니다.`});
                break
            case 'DELETE_COUNT_DIFFERENT' :
                response.status(500).json({resultCode: error.message, message: `삭제 수량이 일치하지 않습니다.`});
                break;
            default:
                response.status(500).json({resultCode: 'SYSTEM_ERROR', message: `시스템 오류가 발생하였습니다.`});
                break;
        }
    });
}

/**
 * 공통코드 목록 조회
 * @param {*} request 
 * @param {*} response 
 * @param {*} next 
 */
 exports.getCodeList = async (request, response, next) => {
    
    /**
     * 파라미터 세팅
     */
    // 조회 타입
    let srhType = request.body.srhType;
    // 조회 문구
    let srhWord = request.body.srhWord;
    // 사용여부
    let useYn = request.body.useYn;
    // 페이징 정보
    let paging = request.body.paging;

    // 메뉴목록 조회
    await codeService.getCodeList({srhType, srhWord, useYn, paging}).then(value => {
        response.status(200).json({
            message: 'SUCCESS',
            resultCode: 'SUCCESS',
            data: value
        });
    }).catch(error => {
        // 예외 응답
        switch(error.message){
            case 'NO_SEARCH_MENU':
                response.status(200).json({resultCode: error.message, message: `시스템 오류가 발생하였습니다. (${error.message})`});
            break;
            default:
                response.status(500).json({resultCode: 'SYSTEM_ERROR', message: `시스템 오류가 발생하였습니다.`});
            break;
        }
    });
}

/**
 * 코드 등록/수정/삭제 적용
 * @param {*} request 
 * @param {*} response 
 * @param {*} next 
 */
 exports.applyCode = async (request, response, next) => {

    await codeService.applyCode({  
        applyList: request.body.applyList,
        userNo: request.session.user.userNo
    }).then(result => {
        response.status(200).json({
            message: 'SUCCESS',
            resultCode: 'SUCCESS',
            data: result
        });
    }).catch(error => {
        // 예외 응답
        logger.error(`systemController.applyMenu catch ERROR::[${error}]`);
        switch(error.message){
            case 'ISNERT_COUNT_DIFFERENT' :
                response.status(200).json({resultCode: error.message, message: `등록 수량이 일치하지 않습니다.`});
                break
            case 'UPDATE_COUNT_DIFFERENT' :
                response.status(200).json({resultCode: error.message, message: `수정 수량이 일치하지 않습니다.`});
                break
            case 'DELETE_COUNT_DIFFERENT' :
                response.status(500).json({resultCode: error.message, message: `삭제 수량이 일치하지 않습니다.`});
                break;
            default:
                response.status(500).json({resultCode: 'SYSTEM_ERROR', message: `시스템 오류가 발생하였습니다.`});
                break;
        }
    });
}

/**
 * 사용자목록 조회
 * @param {*} request 
 * @param {*} response 
 * @param {*} next 
 */
exports.getUserList = async (request, response, next) => {

    /**
     * 파라미터 세팅
     */
    // 조회 타입
    let srhType = request.body.srhType;
    // 조회 문구
    let srhWord = request.body.srhWord;
    // 권한
    let auth = request.body.auth;
    // 페이징 정보
    let paging = request.body.paging;

    // 메뉴목록 조회
    await userService.getUserList({srhType, srhWord, auth, paging}).then(value => {
        response.status(200).json({
            message: 'SUCCESS',
            resultCode: 'SUCCESS',
            data: value
        });
    }).catch(error => {
        // 예외 응답
        switch(error.message){
            default:
                console.error('SYSTEM_ERROR::', error.message);
                response.status(500).json({resultCode: 'SYSTEM_ERROR', message: `시스템 오류가 발생하였습니다.`});
            break;
        }
    });
}

