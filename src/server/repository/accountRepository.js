const logger = require(`${basePath}/config/logger.js`);
const repo = require(`${basePath}/config/repository.js`);

/**
 * 계좌목록 카운트 조회
 * @param {*} params 
 * @param {*} conn 
 */
exports.selectAccountCount = async(params, conn) => {

    return await repo.selectOne(
        `/* accountRepository.selectAccountCount */
        SELECT COUNT(1) AS totalCount FROM AC_ACCOUNT 
        WHERE 1=1
        AND USER_NO = ?`
        , [params.userNo]
        , conn
    );
}

/**
 * 계좌목록 조회
 * @param {*} params 
 * @param {*} conn 
 */
 exports.selectAccountList = async (params, conn) => {

    return await repo.selectList(
        `/* accountRepository.selectAccountList */
        SELECT
            ACCT_NO         AS acctNo
            , USER_NO       AS userNo
            , BANK_CD       AS bankCd
            , ACCT_TP_CD    AS acctTpCd
            , ACCT_NM       AS acctNm
            , ACCT_NUM      AS acctNum
            , ACCT_SEQ      AS acctSeq
            , CUR_MONEY     AS curMoney
            , USE_YN        AS useYn
            , INS_NO        AS insNo
            , DATE_FORMAT(INS_DTTM, '%Y-%m-%d %H:%i:%S') AS insDttm
            , UPT_NO        AS uptNo
            , DATE_FORMAT(UPT_DTTM, '%Y-%m-%d %H:%i:%S') AS uptDttm
        FROM AC_ACCOUNT
        WHERE 1=1
        AND USER_NO = ?
        LIMIT ?, ?`
        , [
            params.userNo,
            (params.paging.pageNo - 1) * params.paging.pageSize,
            params.paging.pageSize
        ]
        , conn
    );
}

/**
 * 계좌목록 저장
 * @param {*} params 
 * @param {*} conn 
 * @returns 
 */
exports.insertAccountList = async (params, conn) => {
    logger.debug(`accountRepository.insertAccountList \n params:: [${JSON.stringify(params)}]`);
    const list = params.insertList ?? [];
    const rowPlaceholder = `(?, ?, ?, ?, ?, ?, 0, ?, ?, NOW(), ?, NOW())`;

    const sql = `
    /* accountRepository.insertAccountList */
    INSERT INTO AC_ACCOUNT (
        USER_NO
        , BANK_CD
        , ACCT_TP_CD
        , ACCT_NM
        , ACCT_NUM
        , ACCT_SEQ
        , CUR_MONEY
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
            params.userNo,
            item.bankCd,
            item.acctTpCd,
            item.acctNm,
            item.acctNum,
            item.acctSeq,
            item.useYn,
            params.userNo,
            params.userNo
        );
    }

    return await repo.insert(sql, values, conn);
}

/**
 * 계좌 수정
 * @param {*} params 
 * @param {*} conn 
 */
exports.updateAccountList = async (params, conn) => {
    logger.debug(`accountRepository.updateAccountList \n params:: [${JSON.stringify(params)}]`);

    const list = params.updateList ?? [];
    const updateNos = list.map(item => item.acctNo);
    const updateNoPlaceholders = updateNos.map(() => '?').join(', ');

    let unionSql = '';
    const unionValues = [];
    for(let i = 0; i < list.length; i++){
        const p = list[i];
        unionSql += `${i === 0 ? '' : ' UNION ALL\n'}SELECT ? AS ACCT_NO, ? AS ACCT_NUM, ? AS ACCT_NM, ? AS BANK_CD, ? AS ACCT_TP_CD, ? AS ACCT_SEQ, ? AS USE_YN`;
        unionValues.push(
            p.acctNo,
            p.acctNum,
            p.acctNm,
            p.bankCd,
            p.acctTpCd,
            p.acctSeq,
            p.useYn
        );
    }

    const sql = ` /* accountRepository.updateAccountList */
    UPDATE AC_ACCOUNT M
    JOIN (
        ${unionSql}
    ) U
    ON U.ACCT_NO = M.ACCT_NO
    SET
      M.ACCT_NUM = U.ACCT_NUM
    , M.ACCT_NM = U.ACCT_NM
    , M.BANK_CD = U.BANK_CD
    , M.ACCT_TP_CD = U.ACCT_TP_CD
    , M.ACCT_SEQ = U.ACCT_SEQ
    , M.USE_YN = U.USE_YN
    , M.UPT_NO = ?
    , M.UPT_DTTM = NOW()
    WHERE M.ACCT_NO IN (${updateNoPlaceholders})
    `;

    const values = [...unionValues, params.userNo, ...updateNos];
    return await repo.update(sql, values, conn);
}

/**
 * 계좌 삭제
 * @param {*} params
 * @param {*} conn
 */
exports.deleteAccountList = async (params, conn) => {
    logger.debug(`accountRepository.deleteAccountList \n params:: [${JSON.stringify(params)}]`);

    const ids = (params.deleteList ?? []).map(item => item.acctNo);
    const placeholders = ids.map(() => '?').join(', ');

    return await repo.delete(
        `/* accountRepository.deleteAccountList */
        DELETE FROM AC_ACCOUNT
        WHERE USER_NO = ?
        AND ACCT_NO IN (${placeholders})
        `
        , [params.userNo, ...ids]
        , conn
    );
}
