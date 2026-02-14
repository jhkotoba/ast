/** 메뉴 태그 생성 */
export const createMenu = (menuList, currentPath = "/") => {
  if (!Array.isArray(menuList) || menuList.length < 1) {
    return "<ul></ul>";
  }

  const level1 = menuList
    .filter((menu) => menu.menuLv === 1)
    .sort((a, b) => a.menuSeq - b.menuSeq);

  const level2 = menuList
    .filter((menu) => menu.menuLv === 2)
    .sort((a, b) => a.menuSeq - b.menuSeq);

  let html = '<ul class="menu-root">';
  level1.forEach((group) => {
    html += `<li class="menu-group"><div class="menu-group-title">${group.menuNm}</div><ul class="menu-list">`;

    level2
      .filter((menu) => menu.groupNo === group.menuNo)
      .forEach((menu) => {
        const activeClass = menu.menuUrl === currentPath ? " active" : "";
        html += `<li><div class="menu-item${activeClass}" data-url="${menu.menuUrl}">${menu.menuNm}</div></li>`;
      });

    html += "</ul></li>";
  });
  html += "</ul>";
  return html;
};

// 기본 메뉴
export const defaultMenuList = [
  { menuNo: 1, menuNm: "계좌", menuUrl: null, menuLv: 1, menuSeq: 1, groupNo: 0 },
  { menuNo: 2, menuNm: "가계부", menuUrl: null, menuLv: 1, menuSeq: 2, groupNo: 0 },

  { menuNo: 11, menuNm: "계좌관리", menuUrl: "/account/account", menuLv: 2, menuSeq: 1, groupNo: 1 },

  { menuNo: 21, menuNm: "거래등록/목록", menuUrl: "/transaction/create-list", menuLv: 2, menuSeq: 2, groupNo: 2 },
  { menuNo: 22, menuNm: "거래수정/삭제", menuUrl: "/transaction/update-delete", menuLv: 2, menuSeq: 3, groupNo: 2 },
  { menuNo: 23, menuNm: "태그관리", menuUrl: "/tag/tag", menuLv: 2, menuSeq: 4, groupNo: 2 },
  { menuNo: 24, menuNm: "템플릿관리", menuUrl: "/template/template", menuLv: 2, menuSeq: 5, groupNo: 2 },
];

export const createDefaultMenu = () => createMenu(defaultMenuList);
