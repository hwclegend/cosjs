/**
* 一下配置部分仅作演示说明，绝大部分不需要或者使用默认就行
* http的cookie和session一般只开启一种，未开启的不用配置
 **/
//var cosjs = require('cosjs')
var cosjs = require('../index');
//根目录
cosjs.set('root', __dirname);
//共享目录，使用$.config,$.loader时默认到 root/share中找文件
cosjs.set('share', 'share');
/********************http config*********************/
//http 端口，默认：80
cosjs.set("http.port",80);
//设置输出方式，默认html(binary,html,text,jsonp)
cosjs.set("http.output","json");
//开启jsonp,ajax跨域请求,默认：空 = 关闭
cosjs.set("http.jsonp",'jsoncb');
//关闭POST数据
cosjs.set("http.post",false);
//启动worker进程数量，默认：0, CPU个数
cosjs.set("http.workers",0);
//输出格式,默认：utf-8
cosjs.set("http.charset","utf-8");
/********************http cookie*********************/
//cookie（开启认证）参与加密的参数名，如：["uid","name"]
cosjs.set("cookie.key",null);
//cookie 有效期(秒)，默认：0  关闭浏览器失效
cosjs.set("cookie.expires",0);
/********************http session*********************/
//session id 名称，
cosjs.set("session.id","$id");
//session 加密密匙
cosjs.set("session.secret","hello cosjs");
//session 有效期(秒)，默认：0  用不失效
cosjs.set("session.expires",0);
//session 用户级操作锁，开启操作锁后，同一时间一个用户（已经登录）只能有一个操作，默认：false
cosjs.set("session.lock",false);
//session 存储方式，暂时只支持redis、mongo
cosjs.set("session.dtype","redis");
//session 数据库地址，mongo配置需要指明数据库库名，如：127.0.0.1:27017/session
cosjs.set("session.dbase","127.0.0.1:6379");


//fork一个进程
cosjs.fork(function(){
    console.log("this process will be exit for test");
    setTimeout(function(){
        process.exit();
    },10000);
});

/********************http server*********************/
var serv = cosjs.http();
/**
 * 访问api下的所有接口，
 * 格式：http://URL/api/test/index
 * api 可以随意改变，只想要改变url中api对应字符就行了
 * 如 serv.router('/cmd/','api/$2/$3') URL就变成了：http://URL/cmd/test/index
 */
serv.router('/api/','api/$2/$3');
//所有静态资源定位到wwwroot目录
serv.static('/', 'wwwroot');
//启动服务器
serv.start();


