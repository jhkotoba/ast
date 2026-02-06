const logger = require(`${basePath}/config/logger.js`);
const accountService = require(`${basePath}/services/accountService.js`);

exports.getAccountList = async (request, response, next) => {

    /**
     * 파라미터 세팅
     */
    // 회원번호
    let userNo = request.session.user.userNo;
    // 페이징 정보
    let paging = request.body.paging;

    // 계좌목록 조회
    await accountService.getAccountList({userNo, paging}).then(value => {
        response.status(200).json({
            message: 'SUCCESS',
            resultCode: 'SUCCESS',
            data: value
        });
    }).catch(error => {
        logger.error('getAccountList:', error);
        // 예외 응답
        switch(error.message){
            default:
                response.status(500).json({resultCode: 'SYSTEM_ERROR', message: `시스템 오류가 발생하였습니다.`});
            break;
        }
    });
}

/**
 * 계좌 등록/수정/삭제 적용
 * @param {*} request 
 * @param {*} response 
 * @param {*} next 
 */
exports.applyAccount = async (request, response, next) => {

    // 적용목록
    let applyList = request.body.applyList;

    // 회원번호
    let userNo = request.session.user.userNo;

    await accountService.applyAccount({applyList, userNo}).then(result => {
        response.status(200).json({
            message: 'SUCCESS',
            resultCode: 'SUCCESS',
            data: result
        });
    }).catch(error => {
        // 예외 응답
        logger.error(`accountController.applyAccount catch ERROR::[${error}]`);
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