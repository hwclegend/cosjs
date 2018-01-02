﻿/**
 * config:session配置
 * config.lock 用户进程锁, 默认:false(关闭),格式:[num,ms,reload],
 * config.lock = [10,500,1]
 * 仅当在session存放用户cache时才有必要将reload设置为 true
 *
 */
"use strict";

const cosjs_redis          = require('../../library/redis/hash');
const cosjs_format          = require('../../library/format').parse;
const cosjs_ObjectID        = require('../../library/ObjectID');

const SESSION_KEY    = '_sess';
const SESSION_LOCK   = '_lock';

module.exports = function(req,res,opts){
    return new session(req,res,opts);
}

module.exports.config = require('./config');
module.exports.crypto = require('./crypto');

function session(req,res,opts) {
    this.sid      = '';    //session id
    this.uid      = '';    // user id

    this._delay    = 0;
    this._locked   = 0;
    this._closed   = 0;          //是否已经终止(前端非正常结束)
    this._dataset  = null;       //session 数据

    var redis,crypto = opts.crypto ? opts.crypto : exports.crypto(opts.secret,6);
    if(typeof opts.redis === 'object' && (opts.redis instanceof cosjs_redis) ){
        redis = opts.redis;
    }
    else {
        redis = new cosjs_redis(opts.redis,opts.prefix);
    }

    Object.defineProperty(this,'opts',{ value: opts, writable: false, enumerable: false, configurable: false,});
    Object.defineProperty(this,'level',{ value: opts['level'], writable: true, enumerable: true, configurable: false,});
    Object.defineProperty(this,'redis',{ value:  redis, writable: false, enumerable: true, configurable: false,});
    Object.defineProperty(this,'crypto',{ value: crypto, writable: false, enumerable: false, configurable: false,});

    //启动session
    this.start = function(callback){
        if(this._dataset){
            throw new Error('session start again');
        }
        if(this.level >=2) {
            var session_unlock_bind = session_unlock.bind(this);
            res.on('close',  session_unlock_bind);
            res.on('finish', session_unlock_bind);
        }
        session_start.call(this,req,res,callback);
    }
    //创建session,登录时使用:uid,data,callback
    this.create = function(){
        if(opts.guid){
            var uid = null,data=arguments[0],callback=arguments[1];
        }
        else if(arguments.length >=3){
            var uid = arguments[0],data=arguments[1],callback=arguments[2];
        }
        else{
            throw new Error('session create arguments length error');
        }
        session_create.call(this,req,res,uid,data,callback);
    }
};

//获取一个或者多个在session中缓存的信息
session.prototype.get = function (key,type) {
    if(!this._dataset || !(key in this._dataset) ){
        return null;
    }
    var val = this._dataset[key];
    if(type){
        val = cosjs_format(val,type);
    }
    return val;
};
//写入数据，不会修改session,可用于临时缓存
session.prototype.set = function (key,val) {
    if(!this.uid){
        return callback('logout','session uid empty');
    }
    this._dataset[key] = val;
    this.redis.set(this.uid,key,val);
};
//删除一个或者多个在session中缓存的信息，keys==null,删除所有信息，退出登录
session.prototype.del = function(key,callback){
    this.redis.del(this.uid,key,callback);
};


function session_start(req,res,callback){
    if(this.level < 1){
        return callback(null,null);
    }
    this.sid = get_session_id.call(this,req,res);
    if( !this.sid ){
        return callback('logout','session id[' + this.opts.key + '] empty');
    }

    if(this.opts.guid){
        this.uid = this.sid;
    }
    else{
        this.uid = this.crypto.decode(this.sid);
    }
    if( !this.uid ){
        return callback('logout','sid error');
    }
    get_session_data.call(this,(err,ret)=>{
        if (err) {
            return callback(err, ret);
        }
        var ret_sid = ret[SESSION_KEY]||'';
        var ret_lock = parseInt(ret[SESSION_LOCK]||0);
        if ( !ret_sid || this.sid !== ret_sid) {
            return callback("logout", "session id illegal");
        }
        if( this.level < 2 ){
            session_result.call(this,callback);
        }
        else if (ret_lock > 0) {
            session_delay.call(this,callback);
        }
        else{
            session_lock.call(this,callback);
        }
    });
};

function get_session_id(req,res){
    var val=null,skey = this.opts.key;
    var reqDataName = {'cookie':'cookies','get':'query','post':'body','path':'params'};
    var keys = this.opts.method ? [this.opts.method] : Object.keys(reqDataName);
    for(let k of keys){
        if(!reqDataName[k]){
            throw new Error('session opts[method] value "'+k+'" is not a valid value');
        }
        var name = reqDataName[k];
        if(req[name] && (skey in req[name])){
            val = req[name][skey];
            break;
        }
    }
    return val;
}


function get_session_data(callback){
    this.redis.get(this.uid, null,  (err, ret)=> {
        if (err) {
            return callback(err, ret);
        }
        else if (!ret) {
            return callback('logout', 'session not exist');
        }
        else{
            this._dataset = ret;
            return callback(err, ret);
        }
    });
}


function session_lock(callback){
    if(this._closed){
        return session_aborted.call(this,callback);
    }
    this.redis.incr(this.uid, SESSION_LOCK, 1,  (err, ret)=> {
        if (err) {
            callback(err, ret);
        }
        else if (ret > 1) {
            session_delay.call(this,callback);
        }
        else {
            this._locked = 1;
            session_result.call(this,callback);
        }
    });
};

function session_delay(callback){
    if(this._closed){
        return session_aborted.call(this,callback);
    }
    if( this._delay >= this.opts.lockNum ){
        return callback("locked",this._delay);
    }
    this._delay ++;
    setTimeout(()=>{
        session_lock.call(this,callback);
    },this.opts.lockTime);
};

function session_result(callback){
    if(this._closed){
        return session_aborted.call(this,callback);
    }
    if( this.level >=3 && this._locked > 0 && this._delay >0){
        get_session_data.call(this,(err,ret)=> {
            if (err) {
                return callback(err, ret);
            }
            callback(null,this._dataset);
        })
    }
    else{
        callback(null,this._dataset);
    }
};



function session_create(req,res,uid,data,callback) {
    if(this.opts.guid){
        this.uid = this.sid = cosjs_ObjectID().toString();
    }
    else{
        this.uid = uid;
        this.sid = this.crypto.encode(uid);
    }

    var newData = Object.assign({},data);
    newData[SESSION_KEY]  = this.sid;
    newData[SESSION_LOCK] = 0;
    this.redis.multi();
    this.redis.set(this.uid,newData,null);
    if(this.opts.expire){
        this.redis.expire(this.uid,this.opts.expire);
    }
    this.redis.save((err,ret)=>{
        if(err){
            return callback(err,ret);
        }
        if( !this.opts.method || this.opts.method.indexOf('cookie') >=0 ){
            res.cookie(this.opts.key, this.sid, {});
        }
        this._locked = 0;
        return callback(null,this.sid);
    });
}

function session_unlock(){
    this._closed = 1;
    if( !this._locked ){
        return false;
    }
    this._locked = 0;
    if(!this.uid){
        return false;
    }
    session_reset.call(this);
};

function session_aborted(callback){
    if(this._locked && this.uid){
        this._locked = 0;
        session_reset.call(this);
    }
    return callback("aborted");
}

function session_reset(){
    this.redis.multi();
    this.redis.set(this.uid,SESSION_LOCK,0);
    this.redis.expire(this.uid,this.opts.expire);
    this.redis.save(function(err,ret){
        //console.log('session_reset',err,ret);
    });
}

