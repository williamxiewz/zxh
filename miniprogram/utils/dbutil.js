
var cloud;
var _isCloudInit = false;

const initCloud = async () => {
  // 声明新的 cloud 实例
  cloud = new wx.cloud.Cloud({
    // 资源方 AppID
    resourceAppid: 'wx8040a92bbd85ec46',
    // 资源方环境 ID
    resourceEnv: 'zxh-9g5pei38c7cdc56d',
  });
  await cloud.init();
  _isCloudInit = true;
  console.log('zxh cloud init success');
}

const isCloudInit = () => {
  return _isCloudInit;
}

const getOpenid = async (success) => {
  cloud.callFunction({
    name: 'login',
    data: {},
    success: success,
    fail: err => {
      console.error('[云函数] [login] 调用失败', err)
    }
  });
}

const pay = async (success) => {
  cloud.callFunction({
    name: 'wechatpay',
    data: {
      totalFee: 1800 //金额(单位：分)
    },
    success: success,
    fail: console.error,
  });
}

const bindDevice = (myDevice, complete) => {
  cloud.callFunction({
    name: 'myclouddb',
    data: {
      action: 'bindDevice',
      device: myDevice
    },
    complete: complete
  })
}

const getDevices = (complete) => {
  cloud.callFunction({
    name: 'myclouddb',
    data: {
      action: 'getDevices'
    },
    complete: complete
  })
}

const getUser = async (complete) => {
  await cloud.callFunction({
    name: 'myclouddb',
    data: {
      action: 'getUser'
    },
    complete: complete
  });
}

const updateUserIsVip = (isVip, complete) => {
  cloud.callFunction({
    name: 'myclouddb',
    data: {
      action: 'updateUserIsVip',
      isVip: isVip
    },
    complete: complete
  })
}

const updateUserUseTimes = (useTimes, complete) => {
  cloud.callFunction({
    name: 'myclouddb',
    data: {
      action: 'updateUserUseTimes',
      useTimes: useTimes
    },
    complete: complete
  })
}

const delDevice = (myDevice, complete) => {
  cloud.callFunction({
    name: 'myclouddb',
    data: {
      action: 'delDevice',
      device: myDevice
    },
    complete: complete
  })
}

const addDeviceByQRCode = (qrcode, platform, complete) => {
  cloud.callFunction({
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
  cloud.callFunction({
    name: 'myclouddb',
    data: {
      action: 'getWXUserInfo'
    },
    complete: complete
  })
}

const addWXUserInfo = (userInfo, complete) => {
  cloud.callFunction({
    name: 'myclouddb',
    data: {
      action: 'addWXUserInfo',
      userInfo: userInfo
    },
    complete: complete
  })
}

const getCloud = () => {
  return cloud;
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
  getWXUserInfo: getWXUserInfo,
  initCloud: initCloud,
  getCloud: getCloud,
  getOpenid: getOpenid,
  pay: pay,
  isCloudInit: isCloudInit
}