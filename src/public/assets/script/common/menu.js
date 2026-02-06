/** 메뉴 태그 생성
 */
export const createMenu = menuList => {

	if(menuList.length < 1) return '<ul></ul>';
	
	let levelList = [...new Set(menuList.map(menu => menu.menuLv))].sort();
	let maxlevel = levelList[levelList.length-1];
	
	// 메뉴 레벨별 순서별 정렬
	let resultList = null;
	for(let i=0; i<maxlevel; i++){
		if(i === 0){
			 resultList = menuList.filter(menu => menu.menuLv === (i+1))
			 	.sort((a, b) => a.menuSeq - b.menuSeq)
		}else{
			menuList.filter(menu => menu.menuLv === (i+1))
				.sort((a, b) => b.menuSeq - a.menuSeq)
				.forEach(menu => {
					for(let j=0; j<resultList.length; j++){
						if(resultList[j].menuNo == menu.groupNo){
							resultList.splice((j+1), 0, menu);
						}
					}
				});
		}		
	}
	
	// 메뉴 태그 생성
	let html = '<ul>';
	for(let i=0; i<resultList.length; i++){
		
		let item = resultList[i];
		let next = resultList[i+1];

		if(item.menuLv > 1){
			html += `<li class="off"><div data-url="${resultList[i].menuUrl}">${resultList[i].menuNm}</div>`;
		}else{
			html += `<li><div data-lv="${item.menuLv}">${resultList[i].menuNm}</div>`;
		}

		if(item.menuLv != next?.menuLv){
			if(item.menuLv < next?.menuLv){
				html += '<ul>';
			}else{
				html += '</li></ul>';
				if(next == undefined){
					html += '</li>';
				}else if(item.menuLv > next.menuLv){
					html += '</li>';
				}
			}
		}else{
			html += '</li>';
		}	
	}
	html += '</ul>';
	return html;
}

// act 프로젝트(가계부 축소) 기본 메뉴
export const defaultMenuList = [
	// 1레벨(그룹)
	{ menuNo: 1, menuNm: '가계부', menuUrl: null, menuLv: 1, menuSeq: 1, groupNo: 0 },

	// 2레벨(페이지)
	{ menuNo: 11, menuNm: '메인', menuUrl: '/', menuLv: 2, menuSeq: 1, groupNo: 1 },
	{ menuNo: 12, menuNm: '계좌관리', menuUrl: '/account/account', menuLv: 2, menuSeq: 2, groupNo: 1 },
	{ menuNo: 13, menuNm: '계좌내역', menuUrl: '/account/record', menuLv: 2, menuSeq: 3, groupNo: 1 },
];

export const createDefaultMenu = () => createMenu(defaultMenuList);
