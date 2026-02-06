const codeRepository = require(`${basePath}/repository/codeRepository.js`);

/**
 * 공통코드 조회(view)
 * - act 프로젝트는 코드 "관리"(CRUD) 화면/기능을 사용하지 않으므로,
 *   화면 렌더링에 필요한 조회 기능만 남긴다.
 */
exports.getViewCodeList = (params) => codeRepository.selectViewCodeList(params);

