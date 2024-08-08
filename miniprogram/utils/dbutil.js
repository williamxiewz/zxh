const zxh = require("./zxh")

const bindDevice = (myDevice, complete) => {
  zxh.cloud().callFunction({
    name: 'myclouddb',
    data: {
      action: 'bindDevice',
      device: myDevice
    },
    complete: complete
  })
}

const getDevices = (complete) => {
  zxh.cloud().callFunction({
    name: 'myclouddb',
    data: {
      action: 'getDevices'
    },
    complete: complete
  })
}

const getUser = (complete) => {
  zxh.cloud().callFunction({
    name: 'myclouddb',
    data: {
      action: 'getUser'
    },
    complete: complete
  })
}

const updateUserIsVip = (isVip, complete) => {
  zxh.cloud().callFunction({
    name: 'myclouddb',
    data: {
      action: 'updateUserIsVip',
      isVip: isVip
    },
    complete: complete
  })
}

const updateUserUseTimes = (useTimes, complete) => {
  zxh.cloud().callFunction({
    name: 'myclouddb',
    data: {
      action: 'updateUserUseTimes',
      useTimes: useTimes
    },
    complete: complete
  })
}

const delDevice = (myDevice, complete) => {
  zxh.cloud().callFunction({
    name: 'myclouddb',
    data: {
      action: 'delDevice',
      device: myDevice
    },
    complete: complete
  })
}

const addDeviceByQRCode = (qrcode, platform, complete) => {
  zxh.cloud().callFunction({
    name: 'myclouddb',
    data: {
      action: 'addDeviceByQRCode',
      qrcode: qrcode,
      platform: platform
    },
    complete: complete
  })
}

const getWXUserInfo = (complete) => {
  zxh.cloud().callFunction({
    name: 'myclouddb',
    data: {
      action: 'getWXUserInfo'
    },
    complete: complete
  })
}

const addWXUserInfo = (userInfo, complete) => {
  zxh.cloud().callFunction({
    name: 'myclouddb',
    data: {
      action: 'addWXUserInfo',
      userInfo: userInfo
    },
    complete: complete
  })
}

module.exports = {
  getUser: getUser,
  updateUserIsVip: updateUserIsVip,
  updateUserUseTimes: updateUserUseTimes,
  bindDevice: bindDevice,
  getDevices: getDevices,
  delDevice: delDevice,
  addDeviceByQRCode: addDeviceByQRCode,
  addWXUserInfo: addWXUserInfo,
  getWXUserInfo: getWXUserInfo
}