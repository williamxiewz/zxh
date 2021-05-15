const util = require("./util")

const putLogo = (logo) => {
  wx.setStorageSync('settings_logo', logo)
}

const getLogo = () => {
  //默认：众鑫汇智控
  var logo = wx.getStorageSync('settings_logo')
  if (logo == '') return '众鑫汇智控'
  return logo
}

const putDeviceId = (deviceId) => {
  wx.setStorageSync('device_id', deviceId)
}

//当前设备的deviceId
const getDeviceId = () => {
  return getDeviceIdByMac(getDeviceMac())
}

const putDeviceMac = (mac) => {
  wx.setStorageSync('device_mac', mac)
}

//当前设备的MAC
const getDeviceMac = () => {
  return wx.getStorageSync('device_mac')
}

const putDevices = (devices) => {
  console.info('sputil.js 保存设备：' + typeof (devices), devices)
  wx.setStorageSync('device_list', devices)
}

const getDevices = () => {
  return wx.getStorageSync('device_list')
}

const getDeviceCount = () => {
  var count = 0
  const devices = getDevices()
  if (typeof (devices) == 'object') {
    devices.forEach(element => {
      if (element.mac != '') {
        count++
      }
    });
  }
  console.log('当前设备数：' + count)
  return count
}

const getSelfID = () => {
  var id = wx.getStorageSync('self_id');
  if (id == '') {
    id = util.randomSelfID();
    wx.setStorageSync('self_id', id);
  }
  return id;
}

//保存震动灵敏度1~5
/**
 * 
 * @param {*} hex 长度为6的十六进制字符串【协议中的字节8/9/10】
 */
const putSensitivity = (hex) => {
  wx.setStorageSync('sensitivity', hex)
}

//获取震动灵敏度1~5
const getSensitivity = () => {
  return wx.getStorageSync('sensitivity')
}

//针对iOS系统deviceId不一样的情况，将MAC与deviceId成对存储
const putDeviceIdAndMac = (deviceId, mac) => {
  wx.setStorageSync(deviceId, mac)
  wx.setStorageSync(mac, deviceId)
}

const getDeviceIdByMac = (mac) => {
  return wx.getStorageSync(mac)
}

const getMacByDeviceId = (deviceId) => {
  return wx.getStorageSync(deviceId)
}

const isEncrypt = () => {
  // let v = wx.getStorageSync('is_encrypt')
  // return v != '' && v
  return true//正式版本启用数据加密
}

const setEncrypt = (encrypt) => {
  wx.setStorageSync('is_encrypt', encrypt)
}

module.exports = {
  putLogo: putLogo,
  getLogo: getLogo,
  putDeviceId: putDeviceId,
  getDeviceId: getDeviceId,
  putDeviceMac: putDeviceMac,
  getDeviceMac: getDeviceMac,
  putDevices: putDevices,
  getDevices: getDevices,
  getSelfID: getSelfID,
  putSensitivity: putSensitivity,
  getSensitivity: getSensitivity,
  putDeviceIdAndMac: putDeviceIdAndMac,
  getDeviceIdByMac: getDeviceIdByMac,
  getMacByDeviceId: getMacByDeviceId,
  getDeviceCount: getDeviceCount,
  isEncrypt: isEncrypt,
  setEncrypt: setEncrypt
}