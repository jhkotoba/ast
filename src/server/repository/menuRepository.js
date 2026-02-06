const logger = require(`${basePath}/config/logger.js`);
const repo = require(`${basePath}/config/repository.js`);

/**
 * 메뉴권한 체크
 * @param {*} params 
 * @param {*} conn 
 * @returns 
 */
exports.getUserMenuAuthCnt = async (params, conn) => {
    const authList = fnSettingAuthList(params.authCd);
    const authPlaceholders = authList.map(() => '?').join(', ');

    return await repo.selectOne(
        `/* menuRepository.getUserMenuAuthCnt */
        SELECT COUNT(1) AS count FROM SY_MENU 
        WHERE MENU_URL = ?
        AND AUTH_CD IN (${authPlaceholders})
        AND USE_YN = 'Y' 
        AND DISP_YN = 'Y'`
        , [params.path, ...authList]
        , conn
    );
}

/**
 * 메뉴목록 조회
 * @param {*} params 
 * @param {*} conn 
 * @returns 
 */
exports.selectUserMenuList = async (params, conn) => {
    const authList = fnSettingAuthList(params.authCd);
    const authPlaceholders = authList.map(() => '?').join(', ');

    return await repo.selectList(
        `/* menuRepository.selectUserMenuList */
        SELECT
            MENU_NO     AS menuNo
            , MENU_NM   AS menuNm
            , MENU_URL  AS menuUrl
            , MENU_LV   AS menuLv
            , MENU_SEQ  AS menuSeq
            , GROUP_NO  AS groupNo
            , AUTH_CD   AS authCd
            , DISP_YN   AS dispYn
            , USE_YN    AS useYn
        FROM SY_MENU
        WHERE 1=1
        AND DISP_YN = 'Y'
        AND USE_YN = 'Y'
        AND MENU_LV <> 0
        AND AUTH_CD IN (${authPlaceholders})
        `
        , [...authList]
        , conn
    );
}


/**
 * 메뉴목록 조회
 * @returns 
 */
 exports.selectMenuList = async conn => {

    return await repo.selectList(
        `/* menuRepository.selectMenuList */
        SELECT
            MENU_NO     AS menuNo
            , MENU_NM   AS menuNm
            , MENU_URL  AS menuUrl
            , MENU_LV   AS menuLv
            , MENU_SEQ  AS menuSeq
            , GROUP_NO  AS groupNo
            , AUTH_CD   AS authCd
            , DISP_YN   AS dispYn
            , USE_YN    AS useYn
            , INS_NO    AS insNo
            , DATE_FORMAT(INS_DTTM, '%Y-%m-%d %H:%i:%S') AS insDttm
            , UPT_NO    AS uptNo
            , DATE_FORMAT(UPT_DTTM, '%Y-%m-%d %H:%i:%S') AS uptDttm
        FROM SY_MENU`, conn);
}

/**
 * 메뉴목록 저장
 * @param {*} params 
 * @param {*} conn 
 * @returns 
 */
exports.insertMenuList = async (params, conn) => {
    logger.debug(`menuRepository.insertMenuList \n params:: [${JSON.stringify(params)}]`);
    const isTopMenu = Number(params.level) === 1;
    const list = params.insertList ?? [];

    const columns = isTopMenu
        ? `MENU_NM, MENU_LV, MENU_SEQ, GROUP_NO, AUTH_CD, DISP_YN, USE_YN, INS_NO, INS_DTTM, UPT_NO, UPT_DTTM`
        : `MENU_NM, MENU_URL, MENU_LV, MENU_SEQ, GROUP_NO, AUTH_CD, DISP_YN, USE_YN, INS_NO, INS_DTTM, UPT_NO, UPT_DTTM`;

    const rowPlaceholder = isTopMenu
        ? `(?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?, NOW())`
        : `(?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?, NOW())`;

    let sql = `
    /* menuRepository.insertMenuList */
    INSERT INTO SY_MENU (${columns})
    VALUES
    ${list.map(() => rowPlaceholder).join(',\n    ')}`;

    const values = [];
    for(const item of list){
        if(isTopMenu){
            values.push(
                item.menuNm,
                params.level,
                item.menuSeq,
                0,
                item.authCd,
                item.dispYn,
                item.useYn,
                params.userNo,
                params.userNo
            );
        }else{
            values.push(
                item.menuNm,
                item.menuUrl,
                params.level,
                item.menuSeq,
                item.groupNo,
                item.authCd,
                item.dispYn,
                item.useYn,
                params.userNo,
                params.userNo
            );
        }
    }

    return await repo.insert(sql, values, conn);
}

/**
 * 메뉴목록 수정
 * @param {*} params 
 * @param {*} conn 
 */
exports.updateMenuList = async (params, conn) => {
    logger.debug(`menuRepository.updateMenuList \n params:: [${JSON.stringify(params)}]`);

    const level = Number(params.level);
    const isTopMenu = level === 1;
    const list = params.updateList ?? [];

    // 수정 대상 키 값
    const updateNos = list.map(item => item.menuNo);
    const updateNoPlaceholders = updateNos.map(() => '?').join(', ');

    // 변경 데이터 테이블 생성
    let unionSql = '';
    const unionValues = [];
    for(let i = 0; i < list.length; i++){
        const p = list[i];
        unionSql += `${i === 0 ? '' : ' UNION ALL\n'}SELECT ? AS MENU_NO, ? AS MENU_NM, ? AS MENU_URL, ? AS MENU_LV, ? AS MENU_SEQ, ? AS GROUP_NO, ? AS AUTH_CD, ? AS DISP_YN, ? AS USE_YN`;
        unionValues.push(
            p.menuNo,
            p.menuNm,
            p.menuUrl ?? null,
            p.menuLv,
            p.menuSeq,
            p.groupNo,
            p.authCd,
            p.dispYn,
            p.useYn
        );
    }

    const sql = ` /* menuRepository.updateMenuList */
    UPDATE SY_MENU M
    JOIN (
        ${unionSql}
    ) U
    ON U.MENU_NO = M.MENU_NO
    SET
      M.MENU_NM = U.MENU_NM
      ${isTopMenu ? '' : ', M.MENU_URL = U.MENU_URL'}
    , M.MENU_LV = U.MENU_LV 
    , M.MENU_SEQ = U.MENU_SEQ
    , M.GROUP_NO = U.GROUP_NO
    , M.AUTH_CD = U.AUTH_CD
    , M.DISP_YN = U.DISP_YN
    , M.USE_YN = U.USE_YN
    , M.UPT_NO = ?
    , M.UPT_DTTM = NOW()
    WHERE M.MENU_NO IN (${updateNoPlaceholders})
    `;

    const values = [...unionValues, params.userNo, ...updateNos];
    return await repo.update(sql, values, conn);
}

/**
 * 메뉴 삭제
 * @param {*} params 
 * @param {*} conn 
 */
exports.deleteMenuList = async (params, conn) => {
    const idxs = (params.deleteList ?? []).map(item => item.menuNo);
    const placeholders = idxs.map(() => '?').join(', ');

    // 상위 메뉴를 삭제할 경우 하위 메뉴도 함께 삭제
    return await repo.delete(
        `/* menuRepository.deleteMenuList */
        DELETE FROM SY_MENU
        WHERE MENU_NO IN (${placeholders})
        OR GROUP_NO IN (${placeholders})`
        , [...idxs, ...idxs]
        , conn
    );
}

/**
 * 권한코드 세팅
 * @param {} authCd 
 * @returns 
 */
function fnSettingAuthList(authCd){
    let result = [];
    switch(authCd){
    case 'CD_AUTH_DEVELOPER':
        result = ['CD_AUTH_DEVELOPER', 'CD_AUTH_ADMIN', 'CD_AUTH_USER', 'CD_AUTH_GUEST'];
        break;
    case 'CD_AUTH_ADMIN':
        result = ['CD_AUTH_ADMIN', 'CD_AUTH_USER', 'CD_AUTH_GUEST'];
        break
    case 'CD_AUTH_USER':
        result = ['CD_AUTH_USER', 'CD_AUTH_GUEST'];
        break
    case 'CD_AUTH_GUEST':
        result = ['CD_AUTH_GUEST'];
        break;
    }

    return result;
}
