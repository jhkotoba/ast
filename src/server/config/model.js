const fs = require("fs");
const logger = require(`${basePath}/config/logger.js`);
const codeService = require(`${basePath}/services/codeService.js`);
const menuService = require(`${basePath}/services/menuService.js`);

/**
 * 페이지 이동 세팅
 * @param {*} path 
 * @param {*} params 
 * @returns 
 */
exports.modelAndView = function(path, params){
    return Promise.all([
        // 틀 페이지 가져오기
        new Promise((resolve, reject) => {
            fs.readFile(`${public}/view/index.html`, 'UTF-8', (error, value) => {
                if(error) reject(error);
                else resolve(value);
            })
        }),
        // 내용 페이지 가져오기
        new Promise((resolve, reject) => {
            fs.readFile(`${public}/view/${path}`, 'UTF-8', (error, value) => {
                if(error) reject(error);
                else resolve(value);
            })
        }),
        // 공통코드 필요시 세팅
        new Promise((resolve, reject) => {
            if(params?.code?.length > 0){
                codeService.getViewCodeList({groupCdList: params.code})
                    .then(data => resolve(data))
                    .catch(error => {
                        logger.error(error);
                        reject(error);
                    });
            }else{
                resolve([]);
            }
        }),
        // 권한 체크
        new Promise((resolve, reject) => {
            if(params.request.route.path == '/'){
                resolve(true);
            }else{
                menuService.isUserMenuAuth({path, request: params.request})
                    .then(isAuth => resolve(isAuth)
                    ).catch(error => {
                        logger.error(error);
                        reject(error);
                    });
            }
            
        }),
    ])
    .then(values => {
        let html = values[0];
        if(values[3] == true){
            if(values[2].length > 0){
                html = html.replace("</body>", "</body>" + `<script id="tempCode">window.__code = JSON.parse('${JSON.stringify(values[2])}'); document.getElementById('tempCode').remove();</script>`);
            }
            html = html.replace("<main>", "<main>" + values[1]);
        }else if(values[2].length > 0){
            html = html.replace("<body>", "<body>" + `<script>window.location.href = '/';</script>`);
        }
        return html;
    })
    .catch(error => logger.error(error));
}

// /**
//  * 팝업 페이지 세팅
//  * @param {*} path 
//  * @param {*} params 
//  * @returns 
//  */
// exports.modelAndPopup = function(path, params){

//     return Promise.all([
//         // 틀 페이지 가져오기
//         new Promise((resolve, reject) => {
//             fs.readFile(`${public}/view/popup.html`, 'UTF-8', (error, value) => {
//                 if(error) reject(error);
//                 else resolve(value);
//             })
//         }),
//         // 내용 페이지 가져오기
//         new Promise((resolve, reject) => {
//             fs.readFile(`${public}/view/${path}`, 'UTF-8', (error, value) => {
//                 if(error) reject(error);
//                 else resolve(value);
//             })
//         }),
//         // 공통코드 필요시 세팅
//         new Promise((resolve, reject) => {
//             if(params?.code?.length > 0){
//                 codeService.getViewCodeList({groupCdList: params.code})
//                     .then(data => resolve(data))
//                     .catch(error => {
//                         logger.error(error);
//                         reject(error);
//                     });
//             }else{
//                 resolve([]);
//             }
//         }),
//         // 권한 체크
//         new Promise((resolve, reject) => {
//             if(params.request.route.path == '/'){
//                 resolve(true);
//             }else{
//                 menuService.isUserMenuAuth({path, request: params.request})
//                     .then(isAuth => resolve(isAuth)
//                     ).catch(error => {
//                         logger.error(error);
//                         reject(error);
//                     });
//             }
            
//         }),
//     ])
//     .then(values => {
//         let html = values[0];
//         if(values[3] == true){
//             if(values[2].length > 0){
//                 html = html.replace("</body>", "</body>" + `<script>window.__code = JSON.parse('${JSON.stringify(values[2])}');</script>`);
//             }
//             html = html.replace("<main>", "<main>" + values[1]);
//         }else if(values[2].length > 0){
//             html = html.replace("<body>", "<body>" + `<script>alert('403'); window.close(); window.location.href = '/';</script>`);
//         }
//         return html;
//     })
//     .catch(error => logger.error(error));
// }