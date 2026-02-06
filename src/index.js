/**
 * dotenv는 환경변수를 .env파일에 저장하고
 * process.env로 로드하는 의존성 모듈
 */
const dotenv = require("dotenv");
// 개발, 운영 분기처리
dotenv.config({ path: process.argv[2] === 'dev' ? '.env.dev' : '.env' });

// 전역상수
global.basePath =  __dirname + '/server';
global.public =  __dirname + '/public';
global.rootPath =  __dirname;

// 서버 호스트
const hostname = process.env.HOST_NAME;
// 서버 포트
const port = process.env.PORT;
/**
 * Node.js를 위한 빠르고 개방적인 간결한 웹 프레임워크
 */
const express = require("express");
const app = express();

// body-parser
app.use(express.urlencoded({extended: true}));
app.use(express.json());

/**
 * Express 프레임워크를 위한 간단한 세션 관리용 미들웨어
 */
const session = require('express-session');

/**
 * Express용 Redis 세션 스토리지를 제공 미들웨어
 */
let redisStore = require("connect-redis")(session);

/**
 * Redis 클라이언트 미들웨어
 */
const redis = require("ioredis");
// 레디스 클라이언트 세팅
let redisClient = new redis({
  host: process.env.REDIS_HOST,
  // 기존 환경변수 오타를 고려.
  // REDIS_PROT, REDIS_PORT 둘 다 지원.
  port: process.env.REDIS_PORT ?? process.env.REDIS_PROT,
  password: process.env.REDIS_PASSWORD,
  db : process.env.REDIS_DB,
});

// 레디스 세션 연결
app.use(
  session({
    store: new redisStore({ client: redisClient, prefix : "session:" }),
    saveUninitialized: false, // 세션에 저장할 때 초기화 여부
    secret: process.env.SESSION_SECRET, // 세션을 발급할 때 사용되는 키
    resave: false, // 세션을 저장하고 불러올 때 세션을 다시 저장할지 여부를 결정
    cookie: {
      // 세션 쿠키 옵션.
      // httpOnly, secure 설정은 cookie 하위에 위치.
      httpOnly: true,
      secure: process.argv[2] === 'dev' ? false : true,
      maxAge: 3600000
    }, // 쿠키의 생명 기간
    rolling: true
  })
);

// 정적자원
app.use(express.static(__dirname + "/public/assets"));

// 세션필터
const sessionFilter = require(`${basePath}/config/sessionFilter.js`);
app.use(sessionFilter);

// 메인
const main = require(`${basePath}/routes/main.js`);
app.use('/', main);

// 로그인
const login = require(`${basePath}/routes/login.js`);
app.use('/login', login);

// 시스템
// 계좌관리
const account = require(`${basePath}/routes/account.js`);
app.use("/account", account);

// 장부관리
//const ledger = require("./routes/ledgerRoute.js");
//app.use("/ledger", ledger);

//404
app.use((request, response, next) => {
  response.status(404).send("404");
});

//500
app.use((error, request, response, next) => {
  console.error(error);
  response.status(500).send("500");
});

//서버시작
app.listen(port, () => {
  console.log(`${process.env.NODE_ENV} Server running at http://${hostname}:${port}/`);
});
