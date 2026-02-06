const repo = require(`${basePath}/config/repository.js`);

/**
 * 공통코드 조회(view)
 * - 화면 렌더링 시 필요한 코드 리스트만 제공
 */
exports.selectViewCodeList = async (params, conn) => {
	let sql = `/* codeRepository.selectViewCodeList */
        SELECT
            CODE       AS code
            , CODE_NM   AS codeNm
            , GROUP_CD  AS groupCd
        FROM SY_CODE
        WHERE USE_YN = 'Y'`;

	const values = [];
	if(params?.groupCdList?.length > 0){
		const placeholders = params.groupCdList.map(() => '?').join(', ');
		sql += ` AND GROUP_CD IN (${placeholders}) AND CODE <> GROUP_CD`;
		values.push(...params.groupCdList);
	}

	sql += ` ORDER BY GROUP_CD`;
	return repo.selectList(sql, values, conn);
};

