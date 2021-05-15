const util = require("./util");
const sputil = require("./sputil");
const log = require("./log");

const CMD_LOCK = 1//设防
const CMD_UNLOCK = 2//撤防
const CMD_CALL = 3//寻车
const CMD_MUTE = 4//静音设防
const CMD_START = 5

/**
 * 
 * @param {*} cmdCode 1-设防，2-撤防，3-寻车，4-静音设防，5-启动，6-测试
 * @param {*} sensitivity 震动灵敏度1~5
 * @param {*} limitSpeed true-限速，false-不限速
 * @param {*} volume 限速提示音量1~5
 * @param {*} optCode 1-标识设置灵敏度，2-表示设置限速开关，3-表示设置限速提示音量，4-控制功能
 */
const mkData = (cmdCode, sensitivity, limitSpeed, volume, optCode = 0) => {
  var value = new Uint8Array(12);

  let selfId = util.randomSelfID();//sputil.getSelfID();
  //let devId = deviceId.replace(/:/g, '').replace(/-/g, '');

  //log.i('bledata.js mkData() - selfId=' + selfId);

  var selfIdArr = new Uint8Array(util.hex2array(selfId));

  util.arraycopy(selfIdArr, 0, value, 0, 4);//4个字节的随机数

  value[6] = 0x01;//设备类型：小程序发送0x01，设备发0x81
  value[7] = optCode;
  value[8] = sensitivity;//灵敏度等级
  value[9] = limitSpeed ? 1 : 2;//限速开关(1/2)
  value[10] = volume;//限速提示音量
  value[11] = cmdCode;//功能码

  log.i('发送数据 >>> ' + util.array2hex(value.buffer));

  return value.buffer;
}

const queryState = () => {
  var value = new Uint8Array(12);

  let selfId = util.randomSelfID();//sputil.getSelfID();

  //log.i('selfId=' + selfId);

  var selfIdArr = new Uint8Array(util.hex2array(selfId));

  util.arraycopy(selfIdArr, 0, value, 0, 4);//4个字节的随机数

  //Math.floor(Math.random() * 256)

  value[6] = 0x01;//设备类型：小程序发送0x01，设备发0x81
  value[8] = 0;//灵敏度等级
  value[9] = 0;//限速开关(1/0)
  value[10] = 0;//限速提示音量
  value[11] = 0;//功能码

  log.i('查询状态 >>> ' + util.array2hex(value.buffer));

  return value.buffer;
}

//value 是 ArrayBuffer 类型
const encryptPayload = (value, complete) => {
  wx.cloud.callFunction({
    name: 'echo',
    data: {
      action: 'encrypt',
      value: util.array2hex(value, false)
    },
    complete: complete
  })
}

//value 是 ArrayBuffer 类型
const decryptPayload = (value, complete) => {
  wx.cloud.callFunction({
    name: 'echo',
    data: {
      action: 'decrypt',
      value: util.array2hex(value, false)
    },
    complete: complete
  })
}

module.exports = {
  mkData: mkData,
  queryState: queryState,
  encryptPayload: encryptPayload,
  decryptPayload: decryptPayload,
  CMD_LOCK: CMD_LOCK,
  CMD_UNLOCK: CMD_UNLOCK,
  CMD_CALL: CMD_CALL,
  CMD_MUTE: CMD_MUTE,
  CMD_START: CMD_START
}