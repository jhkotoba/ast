const express = require("express");
const router = express.Router();
const model = require(`${basePath}/config/model.js`);
const systemController = require(`${basePath}/controllers/systemController.js`)

// 메뉴관리 페이지
router.get("/menu", async (request, response) => response.send(await model.modelAndView('system/menu.html', {request, code: ['GRP_CD_AUTH']})));

// 코드관리 페이지
router.get("/code", async (request, response) => response.send(await model.modelAndView('system/code.html', {request})));

// 사용자관리 페이지
router.get("/user", async (request, response) => response.send(await model.modelAndView('system/user.html', {request, code: ['GRP_CD_AUTH']})));

// 사용자 메뉴목록 조회
router.post('/getUserMenuList', systemController.getUserMenuList);

// 메뉴목록 조회
router.post("/getMenuList", systemController.getMenuList);

// 메뉴목록 적용
router.post("/applyMenu", systemController.applyMenu);

// 코드목록 조회
router.post('/getCodeList', systemController.getCodeList);

// 코드 적용
router.post('/applyCode', systemController.applyCode);

// 사용자목록 조회
router.post('/getUserList', systemController.getUserList);

module.exports = router;
