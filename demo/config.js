﻿var root = __dirname;
var dbserv = '192.168.2.250';
exports = module.exports = {
    root    : root,
    debug   : 2,
    cache   : dbserv + ':6379',
    mongodb : dbserv +':27017/test',
}

exports.http = {
    'port'    : 80,
    'shell'   : root+'/share/http',
};


exports.socket = {
    root      : root + '/socket',
    shell     : root + '/share/socket',
    manager   : {host:dbserv,port:6379,name:'manager',emit:'redis'},          //manager emitter opts
    gateway   : {host:'127.0.0.1',port:100,name:'gateway'},
    connector : [
        {host:'127.0.0.1',port:81,maxClient:5000,refresh:1000,},
        {host:'127.0.0.1',port:82,maxClient:5000,refresh:1000,},
        {host:'127.0.0.1',port:83,maxClient:5000,refresh:1000,},
        {host:'127.0.0.1',port:84,maxClient:5000,refresh:1000,},
    ],
    worker : [
        {host:'127.0.0.1',port:90,name:'agent',refresh:1000,},
        {host:'127.0.0.1',port:91,name:'battle',refresh:1000,},
        {host:'127.0.0.1',port:92,name:'battle',refresh:1000,},
    ],

}