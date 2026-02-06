const logger = require(`${basePath}/config/logger.js`);
const utils = require(`${basePath}/config/utils.js`);
const db = require(`${basePath}/config/database.js`);

/**
 * 쿼리 인자 정규화.
 * 기존 호출 방식도 유지.
 * - (sql, conn)
 * - (sql, params, conn)
 * - (sql, params)
 */
function normalizeQueryArgs(paramsOrConn, conn){
  // conn가 있으면 3번째 인자를 우선 사용
  if(conn){
    return { params: paramsOrConn, conn };
  }

  // 2번째 인자가 커넥션이면 params 없이 처리
  if(paramsOrConn && typeof paramsOrConn.query === 'function'){
    return { params: undefined, conn: paramsOrConn };
  }

  // 2번째 인자는 params
  return { params: paramsOrConn, conn: undefined };
}

// 단건 조회
exports.selectOne = async (sql, paramsOrConn, conn) => {
  const normalized = normalizeQueryArgs(paramsOrConn, conn);
  const oConn = normalized.conn;
  const params = normalized.params;

  logger.debug('\n' + sql);
  const localConn = oConn ? oConn : await db.getConnection();

  try{
    const rows = params === undefined ? await localConn.query(sql) : await localConn.query(sql, params);
    if(rows.length > 1){
      logger.error('SELECT ONE ERROR:: TOO_MANY_RESULT');
      throw new Error('TOO_MANY_RESULT');
    }
    return rows[0];
  }catch(error){
    logger.error('SELECT ONE ERROR::', error);
    throw error;
  }finally{
    // 외부에서 주입한 커넥션은 해제하지 않음
    if(!oConn && localConn){
      localConn.release();
    }
  }
};

// 복수건 조회
exports.selectList = async (sql, paramsOrConn, conn) => {
  const normalized = normalizeQueryArgs(paramsOrConn, conn);
  const oConn = normalized.conn;
  const params = normalized.params;

  logger.debug('\n' + sql);
  const localConn = oConn ? oConn : await db.getConnection();

  try{
    return params === undefined ? await localConn.query(sql) : await localConn.query(sql, params);
  }catch(error){
    logger.error('SELECT LIST ERROR::', error);
    throw error;
  }finally{
    if(!oConn && localConn){
      localConn.release();
    }
  }
}

// 저장
exports.insert = async (sql, paramsOrConn, conn) => {
  const normalized = normalizeQueryArgs(paramsOrConn, conn);
  const oConn = normalized.conn;
  const params = normalized.params;

  logger.debug('\n' + sql);
  const localConn = oConn ? oConn : await db.getConnection();

  try{
    return params === undefined ? await localConn.query(sql) : await localConn.query(sql, params);
  }catch(error){
    logger.error('INSERT ERROR::', error);
    throw error;
  }finally{
    if(!oConn && localConn){
      localConn.release();
    }
  }
}

// 수정
exports.update = async (sql, paramsOrConn, conn) => {
  const normalized = normalizeQueryArgs(paramsOrConn, conn);
  const oConn = normalized.conn;
  const params = normalized.params;

  logger.debug('\n' + sql);
  const localConn = oConn ? oConn : await db.getConnection();

  try{
    return params === undefined ? await localConn.query(sql) : await localConn.query(sql, params);
  }catch(error){
    logger.error('UPDATE ERROR::', error);
    throw error;
  }finally{
    if(!oConn && localConn){
      localConn.release();
    }
  }
}

// 삭제
exports.delete = async (sql, paramsOrConn, conn) => {
  const normalized = normalizeQueryArgs(paramsOrConn, conn);
  const oConn = normalized.conn;
  const params = normalized.params;

  logger.debug('\n' + sql);
  const localConn = oConn ? oConn : await db.getConnection();

  try{
    return params === undefined ? await localConn.query(sql) : await localConn.query(sql, params);
  }catch(error){
    logger.error('DELETE ERROR::', error);
    throw error;
  }finally{
    if(!oConn && localConn){
      localConn.release();
    }
  }
}

// 문자대입
exports.string = value => utils.isEmpty(value) ? 'NULL' : `'${value}'`;

// 숫자 대입
exports.int = value => utils.isEmpty(value) ? 0 : value;
