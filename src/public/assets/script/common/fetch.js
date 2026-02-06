export const postFetch = param => {
	return new Promise((resolve, reject) => {

		inner.start(param);
		fetch(param.url, {
			method: 'POST',				
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
		.finally(() => inner.end(param));
	})
}

const inner = {
	count: 0,
	blindCnt: 0,
	start: param => {
		let blind = document.getElementById('blind');
		if(param.blind != false && blind != undefined && blind != null){
			blind.classList.add('on');
			inner.blindCnt++;
		}
	},
	end: param => {
		if(blind.classList.contains('on') == true){
			inner.blindCnt--;
			if(inner.blindCnt == 0){
				blind.classList.remove('on');
			}
		}
		inner.count--;
	}
}