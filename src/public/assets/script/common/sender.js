/**
 * 비동기 통신
 */
const http = {

	// 호출 카운트
	count: 0,
	// 블라인드 적용 호출 카운트
	blindCnt: 0,
	// 통신 블럭 여부
	isBlock: false,
	// 중복URL 체크용 SET 데이터
	urlSet: new Set(),

	check: param => {

		// 호출중 재호출시 블럭처리
		if(http.isBlock == true){
			return false;
		}

		// 중복URL 호출 허용하지 않을경우(기본값)
		if(param.isOverlapIgnore != true){
			// 호출중인 URL 체크
			if(http.urlSet.has(param.url) == true){
				// 호출중인 URL 존재시 호출하지 않고 종료
				return false;
			}
		}

		// http 통신 허용
		return true;
	},

	/**
	 * 통신 요청
	 * @param {*} param 
	 * @returns 
	 */
	request: param => {
		if(http.check(param) == false) return false;
		return http.fetch(param);
	},

	/**
	 * fetch 호출
	 * @param {*} param 
	 * @returns 
	 */
	fetch: param => {
		return new Promise((resolve, reject) => {
			http.start(param);
			fetch(param.url, {
				method: param.method ? param.method : 'POST',				
				mode: 'cors',
				cache: 'default',
				credentials: 'same-origin',
				headers: {
					'Content-Type': 'application/json',
				},
				redirect: 'follow',
				referrer: 'no-referrer',
				body: JSON.stringify(param.body)
			})
			.then(response => response.json())
			.then(data => resolve(data))
			.catch(error => reject(error))
			.finally(() => http.end(param));
		});
	},

	/**
	 * fetch 실행 직전 호출
	 * @param {*} param 
	 */
	start: param => {

		// 블럭 설정할 경우 통신 종료까지 다른통신 막도록 설정
		if(param.isBlock == true){
			http.isBlock = true;
		}

		// 통신 카운트 증가
		http.count++;

		// 중복호출 막기위한 URL값 SET 데이터
		http.urlSet.add(param.url);

		// 페이지 블라인드 설정
		let blind = document.getElementById('blind');
		if(param.blind != false && blind != undefined && blind != null){
			blind.classList.add('on');
			http.blindCnt++;
		}
	},

	/**
	 * fetch 실행 후(요류상관없이) 호출
	 * @param {*} param 
	 */
	end: param => {

		if(http.isBlock == true) http.isBlock = false;

		// 호출 블라인드 적용 통신이 종료시 블라인드 해제
		let blind = document.getElementById('blind');
		if(param.blind != false && blind != undefined && blind.classList.contains('on') == true){
			http.blindCnt--;
			if(http.blindCnt == 0){
				blind.classList.remove('on');
			}
		}

		// 통신 카운트 감소
		http.count = Math.max(0, http.count - 1);

		// 중복URL 호출 체크 SET 데이터 제거
		http.urlSet.delete(param.url);
	},

	util: {
		

	}
}

/**
 * http 비동기 통신 호출
 */
 export const sender = {
	// 요청
	request: http.request
 }
