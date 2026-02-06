/**
 * 세션필터
 * @param {*} request 
 * @param {*} response 
 * @param {*} next 
 */
const sessionFilter = (request, response, next) => {

    // 회원번호
    let userNo = request.session.user ? request.session.user.userNo : undefined;    
    // 요청 메소드
    let method = request.method;
    
    // 파비콘 및 정적 자원
    if(request.path.indexOf('favicon.ico') > -1){
        next();
    // 비 로그인 상태
    }else if(userNo == undefined){
        // API 통신
        if(method === "POST"){
            // 로그인, 회원가입 통과
            if(request.path.indexOf('/loginProcess') > -1 ||request.path.indexOf('/joinProcess') > -1 ){
                next();
            // 권한없음
            }else{
                response.status(401).send("401");
            }
        // 페이지 이동
        }else if(method === "GET"){
            // 로그인, 회원가입 페이지 통과
            if(request.path.indexOf('/login') > -1 || request.path.indexOf('/join') > -1){
                next();
            // 권한없으므로 로그인 페이지 이동
            }else{
                response.redirect('/login');
            }
        // 허용되지 않은 메소드
        }else{
            response.status(405).send("405");
        }
    // 로그인 상태
    }else{
        // API 통신
        if(method === "POST"){
            next();
        // 페이지 이동
        }else if(method === "GET"){
            // 로그인, 회원가입 페이지 진입시 메인페이지 이동
            if(request.path.indexOf('/login') > -1 || request.path.indexOf('/join') > -1){
                response.redirect('/');
            // 요청 페이지 이동
            }else{
                next();
            }
        // 허용되지 않은 메소드
        }else{
            response.status(405).send("405");
        }
    }
}
module.exports = sessionFilter;