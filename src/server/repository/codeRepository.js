const logger = require(`${basePath}/config/logger.js`);
const repo = require(`${basePath}/config/repository.js`);

/**
 * 공통코드 조회(view)
 * @returns 
 */
exports.selectViewCodeList = async (params, conn) => {

    let sql = `/* codeRepository.selectViewCodeList */
        SELECT
            CODE      AS code
            , CODE_NM   AS codeNm
            , GROUP_CD  AS groupCd
        FROM SY_CODE
        WHERE USE_YN = 'Y'`;
    let values = [];

    if(params?.groupCdList?.length > 0){
        const placeholders = params.groupCdList.map(() => '?').join(', ');
        sql += ` AND GROUP_CD IN (${placeholders}) AND CODE <> GROUP_CD`;
        values.push(...params.groupCdList);
    }

    sql += ` ORDER BY GROUP_CD`;
    return await repo.selectList(sql, values, conn);
}

/**
 * 공통코드 카운트 조회
 * @param {*} params 
 * @param {*} conn 
 */
exports.selectCodeCount = async(params, conn) => {

    let sql = `/* codeRepository.selectCodeCount */
        SELECT COUNT(1) AS totalCount FROM SY_CODE 
        WHERE 1=1`;
    let values = [];

    if(params?.srhWord){
        switch(params?.srhType){
            case 'code':
                sql += ` AND CODE = ?`;
                values.push(params.srhWord);
                break;
            case 'groupCode':
                sql += ` AND GROUP_CD = ?`;
                values.push(params.srhWord);
                break;
        }
    }

    if(params?.useYn){
        sql += ` AND USE_YN = ?`;
        values.push(params.useYn);
    }

    return await repo.selectOne(sql, values, conn);
}

/**
 * 공통코드 목록 조회
 * @param {*} params 
 * @param {*} conn 
 */
 exports.selectCodeList = async (params, conn) => {

    let sql = `/* codeRepository.selectCodeList */
        SELECT
            CODE_NO     AS codeNo
            , CODE      AS code
            , CODE_NM   AS codeNm
            , GROUP_CD  AS groupCd
            , USE_YN    AS useYn
            , INS_NO    AS insNo
            , DATE_FORMAT(INS_DTTM, '%Y-%m-%d %H:%i:%S') AS insDttm
            , UPT_NO    AS uptNo
            , DATE_FORMAT(UPT_DTTM, '%Y-%m-%d %H:%i:%S') AS uptDttm
        FROM SY_CODE
        WHERE 1=1`;
    let values = [];

    if(params?.srhWord){
        switch(params?.srhType){
            case 'code':
                sql += ` AND CODE = ?`;
                values.push(params.srhWord);
                break;
            case 'groupCode':
                sql += ` AND GROUP_CD = ?`;
                values.push(params.srhWord);
                break;
        }
    }

    if(params?.useYn){
        sql += ` AND USE_YN = ?`;
        values.push(params.useYn);
    }

    sql += ` LIMIT ?, ?`;
    values.push(
        (params.paging.pageNo - 1) * params.paging.pageSize,
        params.paging.pageSize
    );

    return await repo.selectList(sql, values, conn);
}

/**
 * 코드 저장
 * @param {*} params 
 * @param {*} conn 
 * @returns 
 */
 exports.insertCodeList = async (params, conn) => {
    logger.debug(`codeRepository.insertCodeList \n params:: [${JSON.stringify(params)}]`);
    const list = params.insertList ?? [];
    const rowPlaceholder = `(?, ?, ?, 'Y', ?, NOW(), ?, NOW())`;

    const sql = `
    /* codeRepository.insertCodeList */
    INSERT INTO SY_CODE (
        CODE
        , CODE_NM
        , GROUP_CD
        , USE_YN
        , INS_NO
        , INS_DTTM
        , UPT_NO
        , UPT_DTTM
    ) VALUES
    ${list.map(() => rowPlaceholder).join(',\n    ')}`;

    const values = [];
    for(const item of list){
        values.push(
            item.code,
            item.codeNm,
            item.groupCd,
            params.userNo,
            params.userNo
        );
    }

    return await repo.insert(sql, values, conn);
}

/**
 * 코드 수정
 * @param {*} params 
 * @param {*} conn 
 */
exports.updateCodeList = async (params, conn) => {
    logger.debug(`codeRepository.updateCodeList \n params:: [${JSON.stringify(params)}]`);

    const list = params.updateList ?? [];
    const updateNos = list.map(item => item.codeNo);
    const updateNoPlaceholders = updateNos.map(() => '?').join(', ');

    let unionSql = '';
    const unionValues = [];
    for(let i = 0; i < list.length; i++){
        const p = list[i];
        unionSql += `${i === 0 ? '' : ' UNION ALL\n'}SELECT ? AS CODE_NO, ? AS CODE, ? AS CODE_NM, ? AS GROUP_CD, ? AS USE_YN`;
        unionValues.push(p.codeNo, p.code, p.codeNm, p.groupCd, p.useYn);
    }

    const sql = ` /* codeRepository.updateCodeList */
    UPDATE SY_CODE M
    JOIN (
        ${unionSql}
    ) U
    ON U.CODE_NO = M.CODE_NO
    SET
      M.CODE = U.CODE
    , M.CODE_NM = U.CODE_NM
    , M.GROUP_CD = U.GROUP_CD
    , M.USE_YN = U.USE_YN
    , M.UPT_NO = ?
    , M.UPT_DTTM = NOW()
    WHERE M.CODE_NO IN (${updateNoPlaceholders})
    `;

    const values = [...unionValues, params.userNo, ...updateNos];
    return await repo.update(sql, values, conn);
}

/**
 * 코드 삭제
 * @param {*} params 
 * @param {*} conn 
 */
exports.deleteCodeList = async (params, conn) => {
    logger.debug(`codeRepository.deleteCodeList \n params:: [${JSON.stringify(params)}]`);

    const ids = (params.deleteList ?? []).map(item => item.codeNo);
    const placeholders = ids.map(() => '?').join(', ');

    return await repo.delete(
        `/* codeRepository.deleteCodeList */
        DELETE FROM SY_CODE
        WHERE CODE_NO IN (${placeholders})
        `
        , ids
        , conn
    );
}
