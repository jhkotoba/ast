const logger = require(`${basePath}/config/logger.js`);
const menuRepository = require(`${basePath}/repository/menuRepository.js`);
const db = require(`${basePath}/config/database.js`);

/**
 * 사용자 메뉴 권한 체크
 * @param {*} params 
 * @returns 
 */
exports.isUserMenuAuth = async params => {
    let path = '/' + params.path.substring(0, params.path.indexOf('.'));
    let authCd = params.request.session.user.authCd;
    let result =  await menuRepository.getUserMenuAuthCnt({path, authCd})
    return result.count > 0;
}

/**
 * 사용자 메뉴목록 조회
 * @param {object} params 
 * @returns 
 */
exports.getUserMenuList = async params => await menuRepository.selectUserMenuList(params);

/**
 * 메뉴목록 조회
 * @param {object} params 
 * @returns 
 */
exports.getMenuList = async () => {
    let menuList = await menuRepository.selectMenuList();
    if(menuList.length < 1){
        throw new Error('NO_SEARCH_MENU');
    }

    return menuList;
}

/**
 * 메뉴정보 등록/수정/삭제 적용
 * @param {*} param 
 */
exports.applyMenu = async (params) => {

    // 상위하위 메뉴 구분(1:상위, 2:하위)
    const level = params.menuLv;
    const userNo = params.userNo;
    let insertList = [];
    let updateList = [];
    let deleteList = [];
    
    // 데이터 세팅
    for(let item of params.applyList){
        switch(item._state){
        case 'INSERT': insertList.push(item); break;
        case 'UPDATE': updateList.push(item); break;
        case 'REMOVE': deleteList.push(item); break;
        }
    }
    const cnts = {insertCnt: insertList.length, updateCnt: updateList.length, deleteCnt: deleteList.length};

    // DB연결
    let conn = await db.getConnection();
    // 트랜잭션
    await conn.beginTransaction();

    try{
        // 적용사항 저장/수정/삭제
        const values = await Promise.all([
            cnts.insertCnt > 0 ? menuRepository.insertMenuList({insertList, userNo, level}, conn) : null,
            cnts.updateCnt > 0 ? menuRepository.updateMenuList({updateList, userNo, level}, conn) : null,
            cnts.deleteCnt > 0 ? menuRepository.deleteMenuList({deleteList, userNo, level}, conn) : null
        ]);

        // 적용 수량 검증
        const insertAffected = values[0]?.affectedRows ?? 0;
        const updateAffected = values[1]?.affectedRows ?? 0;
        const deleteAffected = values[2]?.affectedRows ?? 0;

        if(cnts.insertCnt !== insertAffected){
            throw new Error('ISNERT_COUNT_DIFFERENT');
        }
        if(cnts.updateCnt !== updateAffected){
            throw new Error('UPDATE_COUNT_DIFFERENT');
        }
        if(cnts.deleteCnt !== deleteAffected){
            throw new Error('DELETE_COUNT_DIFFERENT');
        }

        await conn.commit();
        return cnts;
    }catch(error){
        logger.error('applyMenu ERROR ::', error);
        await conn.rollback();
        throw error;
    }finally{
        conn.release();
    }
}
