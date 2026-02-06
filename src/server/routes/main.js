const express = require("express");
const router = express.Router();
const model = require(`${basePath}/config/model.js`);

router.get('/', async (request, response) => response.send(await model.modelAndView('main/main.html', {request})));

router.get('/logout', (request, response) => {
    request.session.destroy();
    response.sendFile(`${public}/view/login/login.html`);
});

module.exports = router;


