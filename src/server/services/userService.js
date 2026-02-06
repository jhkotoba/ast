const logger = require(`${basePath}/config/logger.js`);
const crypto = require('crypto');
const jsencrypt = require(`nodejs-jsencrypt`);
const userRepository = require(`${basePath}/repository/userRepository.js`);
const validation = require(`${basePath}/util/validation.js`);
const db = require(`${basePath}/config/database.js`);

/**
 * 회원체크 조회
 * @param {object} params 
 * @returns 
 */
exports.getLoginUser = async (params) => {

    // 복호화 객체 생성
    const crypt = new jsencrypt.JSEncrypt();
    crypt.setPrivateKey(process.env.AES256_PRIVATE_KEY);

    let userId = crypt.decrypt(params.userId);
    let password = crypt.decrypt(params.password);

    // 회원정보 조회
    let user = await userRepository.selectUser(userId);
    const encryptPwd = crypto.pbkdf2Sync(password, user ? user.salt : '', 54297, 192, 'sha512').toString('base64');

    // 아이디 조회가 되지 않았을 경우
    if(validation.isEmpty(user)){
        throw new Error('ID_OR_PASSWORD_NOT_MATCH');
    }

    // 비밀번호 일치
    if(encryptPwd === user.password){
        return user;
    // 비밀번호 불일치
    }else{
        throw new Error('ID_OR_PASSWORD_NOT_MATCH');
    }
}

/**
 * 회원아이디로 회원정보 조회
 * @param {string} userId 
 */
exports.getUser = userId => userRepository.selectUser(userId);

/**
 * 회원등록
 * @param {object} user 
 * @returns 
 */
 exports.joinUser = async user => {

    let conn;

    try{
        // DB 연결
        conn = await db.getConnection();

        // 트랜잭션 시작
        await conn.beginTransaction();

        // 빈값 체크
        for(let key in user){
            if(validation.isEmpty(user[key])){
                throw new Error('EMPTY_PARAMETER');
            }
        }

        // 이메일 형식 체크
        if(validation.isEmail(user.email) === false){
            throw new Error('NOT_EMAIL_FORMAT');
        }

        // 아이디 중복 체크
        if(validation.isEmpty(await userRepository.selectUser(user.userId, conn)) == false){
            throw new Error('ALREADY_EXISTS_ID');
        }

        // 솔트 생성
        const salt = crypto.randomBytes(32).toString('base64');
        user.salt = salt;

        // 비밀번호 단방향 암호화
        user.password = crypto.pbkdf2Sync(user.password, salt, 54297, 192, 'sha512').toString('base64');

        // 회원등록
        let row = await userRepository.insertUser(user, conn);

        // 저장 결과 확인
        if((row?.affectedRows ?? 0) < 1){
            throw new Error('INSERT_FAIL');
        }

        // 트랜잭션 커밋
        await conn.commit();
    }catch(error){
        // 트랜잭션 롤백
        if(conn){
            await conn.rollback();
        }
        throw error;
    }finally{
        // 커넥션 해제
        if(conn){
            conn.release();
        }
    }
}

/**
 * 사용자 목록 조회
 * @param {*} params.paging.size    페이지사이즈
 * @param {*} params.paging.no      페이지번호
 * @returns
 */
