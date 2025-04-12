var cloud;
var isinitialized = false;

const isInit = () => isinitialized;
const getCloud = () => cloud;

const initCloud = async () => {
  // 声明新的 cloud 实例
  cloud = new wx.cloud.Cloud({
    // 资源方 AppID
    resourceAppid: 'wx8040a92bbd85ec46',
    // 资源方环境 ID
    resourceEnv: 'zxh-9g5pei38c7cdc56d',
  });
  await cloud.init();
  isinitialized = true;
  console.log('zxh cloud init success');
}

// 获取 openid
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
// 微信支付
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
// 绑定设备
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
// 获取设备
const getDevices = (complete) => {
  cloud.callFunction({
    name: 'myclouddb',
    data: {
      action: 'getDevices'
    },
    complete: complete
  })
}


// 删除设备
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

// 通过二维码添加设备
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

// 获取用户信息
const getUser = async (complete) => {
  await cloud.callFunction({
    name: 'myclouddb',
    data: {
      action: 'getUser'
    },
    complete: complete
  });
}

// 获取用户userinfo
const getWXUserInfo = (complete) => {
  cloud.callFunction({
    name: 'myclouddb',
    data: {
      action: 'getWXUserInfo'
    },
    complete: complete
  })
}

// 添加 userinfo
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

// 更新用户 VIP
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
// 更新使用次数
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
  isInit: isInit
}