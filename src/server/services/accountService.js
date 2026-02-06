const logger = require(`${basePath}/config/logger.js`);
const accountRepository = require(`${basePath}/repository/accountRepository.js`);
const db = require(`${basePath}/config/database.js`);

/**
 * 계좌목록 조회
 * @param {*} params 
 * @returns 
 */
exports.getAccountList = async params => {
    return Promise.all([
        accountRepository.selectAccountCount(params),
        accountRepository.selectAccountList(params)
    ]).then(values => {
        params.paging.totalCount = Number(values[0].totalCount);
        return {list: values[1], params}
    }).catch(async error => {
        logger.error('getAccountList ERROR ::', error);
        return Promise.reject(error);
    });
}

/**
 * 코드 등록/수정/삭제 적용
 * @param {*} param 
 */
exports.applyAccount = async (params) => {
    
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
            cnts.insertCnt > 0 ? accountRepository.insertAccountList({insertList, userNo}, conn) : null,
            cnts.updateCnt > 0 ? accountRepository.updateAccountList({updateList, userNo}, conn) : null,
            cnts.deleteCnt > 0 ? accountRepository.deleteAccountList({deleteList, userNo}, conn) : null
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
        logger.error('applyAccount ERROR ::', error);
        await conn.rollback();
        throw error;
    }finally{
        conn.release();
    }
}
