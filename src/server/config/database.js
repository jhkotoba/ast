// DB - MARIADB
const mariadb = require("mariadb");

console.log("require database");

// DB 정보
const info = {
  host: process.env.MARIA_HOST,
  // 기존 환경변수 오타를 고려.
  // MARIA_UESR, MARIA_USER 둘 다 지원.
  user: process.env.MARIA_USER ?? process.env.MARIA_UESR,
  password: process.env.MARIA_PASSWORD,
  database: process.env.MARIA_DATABASE,
  connectionLimit: 50,
  rowsAsArray: false
}

// Pool 초기화
const pool = mariadb.createPool(info);
exports.getConnection = async function(){
  try{
    return await pool.getConnection();
  }catch(err){
    throw new Error(err);
  }
}
