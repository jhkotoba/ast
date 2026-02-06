const repo = require(`${basePath}/config/repository.js`);

/**
 * 회원정보 조회
 * @param {string} userId
 */
exports.selectUser = async (userId, conn) => {
	return repo.selectOne(
		`/* userRepository.selectUser */
        SELECT
            USER_NO     AS userNo
            , USER_ID   AS userId
            , PASSWORD  AS password
            , SALT      AS salt
            , EMAIL     AS email
            , AUTH_CD   AS authCd
        FROM UR_USER
        WHERE USER_ID = ?
        LIMIT 1`
		, [userId]
		, conn
	);
};

/**
 * 회원등록
 */
exports.insertUser = async (user, conn) => {
	return repo.insert(
		`INSERT INTO UR_USER (
            USER_ID
            , PASSWORD
            , SALT
            , EMAIL
            , AUTH_CD
            , USE_YN
            , INS_NO
            , INS_DTTM
            , UPT_NO
            , UPT_DTTM
        ) VALUES (
            ?
            , ?
            , ?
            , ?
            , 'CD_AUTH_GUEST'
            , 'Y'
            , 0
            , NOW()
            , 0
            , NOW()
        )`
		, [user.userId, user.password, user.salt, user.email]
		, conn
	);
};

