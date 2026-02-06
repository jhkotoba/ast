/**
 * 빈값체크
 * @Deprecated
 * @param {*} value 
 * @returns 
 */
exports.isEmpty = value => {
	if(value === null || value === undefined){
		return true;
	}else if((typeof value === "string" && value.trim() === "")){
		return true;
	}else if(typeof value === "object" && !Object.keys(value).length){
		return true;
	}else{
		return false;
	}
}