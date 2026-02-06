const express = require("express");
const router = express.Router();
const loginController = require(`${basePath}/controllers/loginController.js`)

// 로그인 페이지
router.get("/", async (request, response) => response.sendFile(`${public}/view/login/login.html`, {request}));

// 회원가입 페이지
router.get("/join", async (request, response) => response.sendFile(`${public}/view/login/join.html`, {request}));

// 로그인 처리
router.post("/loginProcess", loginController.loginProcess);

// 회원가입 처리
router.post("/joinProcess", loginController.joinProcess);

module.exports = router;