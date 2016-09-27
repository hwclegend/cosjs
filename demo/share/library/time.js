const DAYRESET   = 5;
const DAYRESETMS = DAYRESET * 3600 * 1000 ;
const DAYTOTALMS = 86400*1000;
//本周开始时间
exports.week = function(){
    var nowTime = Date.now();
    var newDate = new Date( nowTime -  DAYRESETMS );
    var newTime = newDate.getTime();
    var week = newDate.getDay() || 7;
    var TEMP = newTime - (week - 1)* DAYTOTALMS;
    var SDate = new Date(TEMP);
    SDate.setHours(DAYRESET,0,0,0);
    return SDate.getTime();
}


//本日开始时间
exports.today = function(){
    var nowTime = Date.now();
    var newDate = new Date( nowTime -  DAYRESETMS );
    newDate.setHours(DAYRESET,0,0,0);
    return newDate.getTime();
}

//有效天数
exports.expire = function(stime,days){
    if(arguments.length==1){
        var expire = arguments[0];
        var newTime = exports.today();
    }
    else{
        var expire = days;
        var newDate = new Date(stime);
        newDate.setHours(DAYRESET,0,0,0);
        var newTime = newDate.getTime();
    }
    return newTime + expire * DAYTOTALMS;
}

//每日时间标签
exports.sign = function(time){
    var time = time || Date.now();
    var newDate = new Date( time- DAYRESETMS);
    return parseInt(exports.format('yyMMdd',newDate));
}




exports.format = function(format,time){
    var date;
    if(!time){
        date = new Date();
    }
    else if(typeof time =='object'){
        date = time;
    }
    else{
        date = new Date(time);
    }
    var o = {
        "M+": date.getMonth() + 1, //月份
        "d+": date.getDate(), //日
        "h+": date.getHours(), //小时
        "m+": date.getMinutes(), //分
        "s+": date.getSeconds(), //秒
        "q+": Math.floor((date.getMonth() + 3) / 3), //季度
        "S": date.getMilliseconds() //毫秒
    };
    if (/(y+)/.test(format)) {
        format = format.replace(RegExp.$1, (date.getFullYear() + "").substr(4 - RegExp.$1.length));
    }
    for (var k in o) {
        if (new RegExp("(" + k + ")").test(format)) {
            format = format.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
        }
    }
    return format;
}
