export const util = { 
    isEmpty(value){
        if(typeof value === "string"){
            if(value.trim() === "") return true;
            else return false;
        }else{
            if(value === undefined || value === null) return true;
            else return false;
        }
    },
    isNotEmpty(value){ 
        return !this.isEmpty(value);
    },
    isFunction(value){
        if(this.isEmpty(value)){
            return false;
        }else if(typeof value === "function"){
            return true;
        }else{
            return false;
        }
    },
    isNotEmptyChildObjct(value, ...arge){
        if(this.isEmpty(value)){
            return false;
        }else{
            let obj = value;
            for(var i=0; i<arge.length; i++){
                if(obj[arge[i]]){
                    obj = obj[arge[i]];
                }else{
                    return false;
                }
            }
            return true;
        }
    },
    isEmptyRtn(value, emptyValue){
        if(this.isEmpty(value)){
            return emptyValue;
        }else{
            return value;
        }
    },
    isFunction(fn){
        if(fn == null || fn == undefined){
            return false;
        }else if(typeof fn === "function"){
            return true;
        }else{
            return false;
        }
    },
    addStyleAttribute(element, style, attribute){
        switch(style){
            case "width":
            case "height":
                if(this.isNotEmpty(attribute)){
                    if(typeof attribute === "number"){
                        element.style[style] = attribute + "px";
                    }else{
                        element.style[style] = attribute;
                    }
                }
                break;
            default: 
                element.style[style] = attribute;
                break;
        }
    },
    //자식 노드 비우기
    elementEmpty(element){
        while(element.hasChildNodes()){
            element.removeChild(element.firstChild);
        }
    },
    childElementEmpty(element){
        while(element.hasChildNodes()){
            element.removeChild(element.firstChild);
        }
    },
    //현재 노드의 부모를 찾다가 TR태그 만날시 멈추고 반환
    getTrNode(node){
        while(true){
            if(node.tagName === "TR"){
                break;						
            }else if(node.tagName === "TABLE" || node.tagName === "BODY" || node.tagName === "HTML"){
                return null;						
            }else{
                node = node.parentNode;
            }
        }
        return node;
    },
    //현재 노드의 부모를 찾다가 TD태그 만날시 멈추고 반환
    getTdNode(node){
        while(true){
            if(node.tagName === "TD"){
                break;						
            }else if(node.tagName === "TABLE" || node.tagName === "BODY" || node.tagName === "HTML"){
                return null;						
            }else{
                node = node.parentNode;
            }
        }
        return node;
    },

    /**
     * 데이터 날짜 포멧 내부함수
     * @param {string/number} value 
     * @param {string} format
     */
    dateFormat : function(value, format){
    
        //YYYYMMDD형식으로 진입시 YYYY-MM-DD로 변환
        if(typeof value == "string" && value.length == 10){
            value = value.replace(/(\d{4})-(\d{2})-(\d{2})/, '$1-$2-$3');
        //YYYYMMDDHHMMSS형식으로 진이시 YYYY-MM-DD HH:MM:SS로 변환
        }else if(typeof value == "string" && value.length == 19){
            value = value.replace(/(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2}):(\d{2})/, '$1-$2-$3 $4:$5:$6');
        }

        //날짜객체 생성
        let date = new Date(value);
        //포멧 세팅
        format = format ? format : "YYYY-MM-DD";
        format = format.toUpperCase();

        let year = date.getFullYear();
        let month = date.getMonth() < 11 ? "0" + (date.getMonth()+1) : (date.getMonth() + 1);
        let day = date.getDate() < 10 ? "0" + date.getDate() : date.getDate();
        let hour = date.getHours() < 10 ? "0" + date.getHours() : date.getHours();
        let minute = date.getMinutes() < 10 ? "0" + date.getMinutes() : date.getMinutes();
        let second = date.getSeconds() < 10 ? "0" + date.getSeconds() : date.getSeconds();
                
        if(format == "YYYY-MM-DD"){
            return year + "-" + month + "-" + day;
        }else if(format == "YYYY-MM-DD HH:MM"){
            return year + "-" + month + "-" + day + " " + hour + ":" + minute;
        }else if(format == "YYYY-MM-DD HH:MM:SS"){
            return year + "-" + month + "-" + day + " " + hour + ":" + minute + ":" + second;
        }else{
            return "";
        }
    },

    /**
     * 찾을 태그의 부모엘리먼트 찾아서 반환
     * @param {string} nodeNm 
     * @param {element} element 
     * @returns 
     */
    closest : function(tagName, node){
        while(true){
            if(node.tagName === tagName) break;
            else if(node.tagName === "BODY" || node.tagName === "HTML") return null;						
            else node = node.parentNode;
        }
        return node;
    }
}