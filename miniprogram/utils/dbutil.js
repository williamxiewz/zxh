const bindDevice = (myDevice, complete) => {
  wx.cloud.callFunction({
    name: 'myclouddb',
    data: {
      action: 'bindDevice',
      device: myDevice
    },
    complete: complete
  })
}

const getDevices = (complete) => {
  wx.cloud.callFunction({
    name: 'myclouddb',
    data: {
      action: 'getDevices'
    },
    complete: complete
  })
}

const getUser = (complete) => {
  wx.cloud.callFunction({
    name: 'myclouddb',
    data: {
      action: 'getUser'
    },
    complete: complete
  })
}

const updateUserIsVip = (isVip, complete) => {
  wx.cloud.callFunction({
    name: 'myclouddb',
    data: {
      action: 'updateUserIsVip',
      isVip: isVip
    },
    complete: complete
  })
}

const updateUserUseTimes = (useTimes, complete) => {
  wx.cloud.callFunction({
    name: 'myclouddb',
    data: {
      action: 'updateUserUseTimes',
      useTimes: useTimes
    },
    complete: complete
  })
}

const delDevice = (myDevice, complete) => {
  wx.cloud.callFunction({
    name: 'myclouddb',
    data: {
      action: 'delDevice',
      device: myDevice
    },
    complete: complete
  })
}

const addDeviceByQRCode = (qrcode, complete) => {
  wx.cloud.callFunction({
    name: 'myclouddb',
    data: {
      action: 'addDeviceByQRCode',
      qrcode: qrcode
    },
    complete: complete
  })
}

const getWXUserInfo = (complete) => {
  wx.cloud.callFunction({
    name: 'myclouddb',
    data: {
      action: 'getWXUserInfo'
    },
    complete: complete
  })
}

const addWXUserInfo = (userInfo, complete) => {
  wx.cloud.callFunction({
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