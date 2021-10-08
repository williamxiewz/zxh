// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

// 云函数入口函数
exports.main = async (event, context) => {
  console.info('myclouddb event =', event)
  var res
  switch (event.action) {
    case 'getUser':
      res = await getUser()
      break;

    case 'updateUserIsVip':
      res = await updateUserIsVip(event.isVip)
      break;

    case 'updateUserUseTimes':
      res = await updateUserUseTimes(event.useTimes)
      break;

    case 'bindDevice':
      res = await bindDevice(event.device)
      break;

    case 'getDevices':
      res = await getDevices()
      break;

    case 'delDevice':
      res = await delDevice(event.device)
      break;

    case 'addDeviceByQRCode':
      res = await addDeviceByQRCode(event.qrcode, event.platform)
      break;

    case 'addWXUserInfo':
      res = addWXUserInfo(event.userInfo)
      break;

    case 'getWXUserInfo':
      res = getWXUserInfo()
      break;

    default:
      res = {}
      break;
  }

  return res
}

//////////////////////////////////////////////////////////////////////////////

async function addWXUserInfo(userInfo) {
  const openid = cloud.getWXContext().OPENID
  const db = cloud.database()
  var collection = db.collection('wx_userinfo')

  var getRes = await collection.where({
    openid: openid
  }).get()

  console.log('addWXUserInfo - getRes', getRes)

  if (getRes.data.length == 0) {
    let addRes = await collection.add({
      data: {
        openid: openid,
        userInfo: userInfo
      }
    })
    console.log('addWXUserInfo - addRes', addRes)
    return addRes
  } else {
    const _ = db.command
    let updateRes = await collection.doc(getRes.data[0]._id).update({
      data: {
        userInfo: _.set(userInfo)
      }
    })
    console.log('addWXUserInfo - updateRes', updateRes)
    return updateRes
  }
}


async function getWXUserInfo() {
  const openid = cloud.getWXContext().OPENID
  var collection = cloud.database().collection('wx_userinfo')

  var getRes = await collection.where({
    openid: openid
  }).get()

  console.log('getWXUserInfo', getRes)

  if (getRes.data.length == 1) {
    return getRes.data[0]
  }
  return null
}

//////////////////////////////////////////////////////////////////////////////

async function getUser() {
  const openid = cloud.getWXContext().OPENID
  var collection = cloud.database().collection('my_users')

  var getRes = await collection.where({
    openid: openid
  }).get()

  console.info('getUser getRes', getRes)

  var user = {}
  if (getRes.data.length == 0) {
    user = {
      openid: openid,
      is_vip: false,
      use_times: 0,
      lend_codes: []
    }
    const result = await collection.add({
      data: user
    })
    console.log('addUser result', result)
  } else {
    user = getRes.data[0]
  }
  return user
}

//更新用户是否充值
async function updateUserIsVip(isVip) {
  const user = await getUser()
  const collection = cloud.database().collection('my_users')
  const res = await collection.doc(user._id).update({
    data: {
      is_vip: isVip
    }
  })
  return res
}

//更新用户使用次数
async function updateUserUseTimes(useTimes) {
  const user = await getUser()
  const collection = cloud.database().collection('my_users')
  const res = await collection.doc(user._id).update({
    data: {
      use_times: useTimes
    }
  })
  return res
}

//更新用户的借车码
async function updateUser(user) {
  const collection = cloud.database().collection('my_users')
  const res = collection.doc(user._id).update({
    data: {
      lend_codes: user.lend_codes
    }
  })
  return res
}

//////////////////////////////////////////////////////////////////////////////

//获取当前用户的设备
async function getDevices() {
  const openid = cloud.getWXContext().OPENID
  const _ = cloud.database().command
  var collection = cloud.database().collection('my_devices')

  const user = await getUser()

  var getRes = await collection.where(_.or([
    // {
    //   openid: openid//绑定的设备
    // },
    {
      openids: _.all([openid]) //数组查询操作符。用于数组字段的查询筛选条件，要求数组字段中包含给定数组的所有元素。
    },
    {
      lend_code: _.in(user.lend_codes) //扫码获得的设备
    }
  ])).get()


  console.info('getDevices', getRes)

  var reget = false
  for (var i = 0; i < getRes.data.length; i++) {
    let element = getRes.data[i]
    if (isNeedReplace(element.lend_code)) {
      console.log('更新借车码')
      reget = true
      element.lend_code = createLendCode(element.mac)
      // foreach循环内部使用 await达不到预期效果，这里使用for循环
      const updateRes = await collection.doc(element._id).update({
        data: {
          lend_code: element.lend_code
        }
      })

      console.log('更新借车码', updateRes)
    }
  }


  if (reget) {
    //更新过借车码后重新查一遍
    getRes = await collection.where(_.or([
      // {
      //   openid: openid//绑定的设备
      // },
      {
        openids: _.all([openid]) //数组查询操作符。用于数组字段的查询筛选条件，要求数组字段中包含给定数组的所有元素。
      },
      {
        lend_code: _.in(user.lend_codes) //扫码获得的设备
      }
    ])).get()
    console.info('借车码发生变化，更新查询设备', getRes)
  }

  return getRes.data
}

//////////////////////////////////////////////////////////////////////////////

//设备是否已经被其他用户绑定
async function bindDevice(myDevice) {
  const openid = cloud.getWXContext().OPENID

  console.info('getDevices openid', openid)

  var collection = cloud.database().collection('my_devices')

  var getRes = await collection.where({
    mac: myDevice.mac
  }).get()

  console.info('getDevices', getRes)

  var result = {}
  if (getRes.data.length == 0) {
    var lendCode = createLendCode(myDevice.mac)
    let device = {
      openid: openid,
      mac: myDevice.mac,
      name: myDevice.name,
      type: myDevice.type,
      version: myDevice.version,
      lend_code: lendCode,
      openids: [openid]
    }
    const addRes = await collection.add({
      data: device
    })

    if (addRes.errMsg == 'collection.add:ok') {
      device.deviceId = myDevice.deviceId
      result = {
        code: 0,
        msg: '绑定成功',
        device: device
      }
    } else {
      result = {
        code: -1,
        msg: addRes.errMsg
      }
    }

  } else if (getRes.data[0].openids.indexOf(openid, 0) != -1) {
    //当前用户已经绑定该设备
    result = {
      code: 1,
      msg: '已经绑定该设备'
    }
  } else {
    //该设备已被其他用户绑定
    //result = { code: 2, msg: '该设备已被其他用户绑定' }
    let deviceInfo = getRes.data[0]
    deviceInfo.openids.push(openid)
    //{"stats":{"updated":1},"errMsg":"document.update:ok"}
    const updateRes = await collection.doc(deviceInfo._id).update({
      data: {
        openids: deviceInfo.openids
      }
    })

    console.log('绑定设备 -> 增加openid', updateRes)
    if (updateRes.stats.updated == 1) {
      deviceInfo.deviceId = myDevice.deviceId
      result = {
        code: 0,
        msg: '绑定成功',
        device: deviceInfo
      }
    } else {
      result = {
        code: 3,
        msg: updateRes.errMsg
      }
    }
  }
  return result
}


//////////////////////////////////////////////////////////////////////////////
//删除设备
async function delDevice(myDevice) {
  const openid = cloud.getWXContext().OPENID
  var result = {}
  var collection = cloud.database().collection('my_devices')

  const getRes = await collection.where({
    mac: myDevice.mac
  }).get()

  if (getRes.data.length > 0) {
    var deviceInfo = getRes.data[0]
    let index = deviceInfo.openids.indexOf(openid, 0)
    if (index != -1) {
      //绑定用户删除设备
      deviceInfo.openids.splice(index, 1)
      const updateRes = await collection.doc(deviceInfo._id).update({
        data: {
          openids: deviceInfo.openids
        }
      })
      console.log('绑定用户删除设备', updateRes)
      result = updateRes
    } else {
      //分享用户删除设备
      const user = await getUser()
      const index = user.lend_codes.indexOf(myDevice.lend_code)
      if (index > -1) {
        user.lend_codes.splice(index, 1)
      }
      result = await updateUser(user)
      console.log('分享用户删除设备', result)
    }
  }
  return result
}

async function delDevice2(myDevice) {
  var result = {}
  if (myDevice.openid == cloud.getWXContext().OPENID) {
    //设备绑定的用户删除设备
    var collection = cloud.database().collection('my_devices')
    const removeRes = await collection.where({
      mac: myDevice.mac
    }).remove()
    //result.stats.removed
    console.log('主账号删除设备', removeRes)
    result = removeRes
  } else {
    //分享用户删除设备
    const user = await getUser()
    const index = user.lend_codes.indexOf(myDevice.lend_code)
    if (index > -1) {
      user.lend_codes.splice(index, 1)
    }
    result = await updateUser(user)
    console.log('分享用户删除设备', result)
  }
  return result
}


//////////////////////////////////////////////////////////////////////////////

async function addDeviceByQRCode(qrcode, platform) {
  const openid = cloud.getWXContext().OPENID
  //借车码: MAC + 日期 + 随机字符串
  const mac = qrcode.substring(0, 12)
  // const date = qrcode.substring(12, 20)
  // const rdCode = qrcode.substring(20, 28)

  var collection = cloud.database().collection('my_devices')
  const getRes = await collection.where({
    mac: mac
  }).get()
  console.log('扫码添加设备', getRes)

  var result = {}
  if (getRes.data.length > 0) {
    var device = getRes.data[0]
    if (device.openids.indexOf(openid, 0) != -1) {
      //设备绑定的用户扫码
      result = {
        code: -1,
        msg: '您已绑定该设备'
      }
    } else if (device.lend_code == qrcode) {
      console.log('deviceType=' + device.type + ', platform=' + platform);
      if (device.type != '+BA01' && 'ios' == platform) {
        result = {
          code: 3,
          msg: '苹果设备暂不支持分享借车',
          device: device
        };
      } else {
        const user = await getUser()
        if (user.lend_codes.indexOf(qrcode) == -1) {
          user.lend_codes.push(qrcode)
          updateUser(user)
        }
        result = {
          code: 0,
          msg: '添加成功',
          device: device
        }
      }
    } else {
      result = {
        code: 1,
        msg: '借车码无效'
      }
    }
  } else {
    result = {
      code: 2,
      msg: '无法获得该车辆信息'
    }
  }

  return result
}

//////////////////////////////////////////////////////////////////////////////


//////////////////////////////////////////////////////////////////////////////


//////////////////////////////////////////////////////////////////////////////

//生成借车码: MAC + 日期 + 随机字符串
function createLendCode(mac) {
  return mac + getCurrentDate() + randomString()
}

function isNeedReplace(lendCode) {
  //if (lendCode == '') return true

  var match = /[0-9a-fA-F]{28}/.test(lendCode)

  if (!match) return true

  let date = lendCode.substring(12, 20)
  return date != getCurrentDate() //日期不同则更换
}

function randomString() {
  var id = "";
  for (var i = 0; i < 4; i++) {
    let v = Math.floor(Math.random() * 256); //[0, 256)随机一个整数
    id += ('0' + v.toString(16)).slice(-2).toUpperCase(); //转化成十六进制
  }
  console.log("随机字符串: " + id);
  return id;
}

function getCurrentDate() {
  var timezone = 8; //目标时区时间，东八区
  const date = new Date()
  var offset_GMT = new Date().getTimezoneOffset();
  var nowDate = new Date().getTime(); // 本地时间距 1970 年 1 月 1 日午夜（GMT 时间）之间的毫秒数
  var targetDate = new Date(nowDate + offset_GMT * 60 * 1000 + timezone * 60 * 60 * 1000);


  console.log('date', formatDate(date))
  console.log('targetDate', formatDate(targetDate))

  const year = targetDate.getFullYear()
  const month = targetDate.getMonth() + 1
  const day = targetDate.getDate()

  const s = [year, month, day].map(formatNumber).join('')
  console.info('当日日期', s)
  return s
}

// yyyy-MM-dd HH:mm:ss
function formatDate(date) {
  let dateStr = [date.getFullYear(), date.getMonth() + 1, date.getDate()].map(formatNumber).join('-')
  let timeStr = [date.getHours(), date.getMinutes(), date.getSeconds()].map(formatNumber).join(':')
  return dateStr + ' ' + timeStr
}

function formatNumber(n) {
  n = n.toString()
  return n[1] ? n : '0' + n
}