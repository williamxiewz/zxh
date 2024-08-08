const util = require("./util")
const sputil = require('./sputil')
const log = require("./log")
const zxh = require("./zxh")

const CMD_LOCK = 1 //设防
const CMD_UNLOCK = 2 //撤防
const CMD_CALL = 3 //寻车
const CMD_MUTE = 4 //静音设防
const CMD_START = 5

/**
 * 
 * @param {*} cmdCode 1-设防，2-撤防，3-寻车，4-静音设防，5-启动，6-测试，0xff-开HID配对，0xfe-关HID配对
 * @param {*} sensitivity 震动灵敏度1~5
 * @param {*} limitSpeed true-限速，false-不限速
 * @param {*} volume 限速提示音量1~3
 * @param {*} optCode 1-标识设置灵敏度，2-表示设置限速开关，3-表示设置限速提示音量，4-控制功能，5-感应功能（BA02新增）
 */
const mkData = (cmdCode, sensitivity, limitSpeed, volume, optCode = 0, ganying) => {
  const ganyingType = typeof (ganying);
  log.i('typeof(ganying)=' + ganyingType);
  const isGanying = ganyingType != 'undefined'

  var value = new Uint8Array(isGanying ? 13 : 12);

  let selfId = util.randomSelfID();
  //let devId = deviceId.replace(/:/g, '').replace(/-/g, '');

  var selfIdArr = new Uint8Array(util.hex2array(selfId));

  util.arraycopy(selfIdArr, 0, value, 0, 4); //4个字节的随机数

  value[6] = isGanying ? 0x02 : 0x01; //设备类型：小程序发送0x01，设备发0x81
  value[7] = optCode;
  value[8] = sensitivity; //灵敏度等级
  if(optCode == 2) {
    value[9] = limitSpeed ? 1 : 2; //限速开关(1/2)
  }
  value[10] = volume; //限速提示音量
  value[11] = cmdCode; //功能码
  if (isGanying) {
    value[12] = ganying;
  }

  log.i('发送数据 >>> ' + util.array2hex(value.buffer));

  return value.buffer;
}

const queryState = () => {
  let type = sputil.getDeviceType();
  let isBA02 = type == '+BA02';
  var value = new Uint8Array(isBA02 ? 13 : 12);
  let selfId = util.randomSelfID();
  var selfIdArr = new Uint8Array(util.hex2array(selfId));
  util.arraycopy(selfIdArr, 0, value, 0, 4); //4个字节的随机数
  //Math.floor(Math.random() * 256)

  // log.i('device type=' + type);
  if (isBA02) {
    value[6] = 0x02; //设备类型：小程序发送0x02，设备发0x82
    value[12] = 0x00;
  } else {
    value[6] = 0x01; //设备类型：小程序发送0x01，设备发0x81
  }
  value[8] = 0; //灵敏度等级
  value[9] = 0; //限速开关(1/0)
  value[10] = 0; //限速提示音量
  value[11] = 0; //功能码
  // log.i('查询状态 >>> ' + util.array2hex(value.buffer));
  return value.buffer;
}

//value 是 ArrayBuffer 类型
const encryptPayload = (value, complete) => {
  if(!zxh.isInit()) return;
  zxh.cloud().callFunction({
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
  zxh.cloud().callFunction({
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