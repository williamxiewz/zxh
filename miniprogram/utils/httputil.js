const URL_CHECK_CODE = 'https://www.szzxh.top/api/device/check_device'; //检查激活码是否可用
const URL_BIND_CODE = 'https://www.szzxh.top/api/device/bind_device'; //绑定激活码
const URL_CHECK_USER = 'https://www.szzxh.top/api/device/check_user'; //检查账号是否激活

const checkCode = (code, success, fail) => {
  console.log('checkCode', code);
  wx.request({
    url: URL_CHECK_CODE,
    method: 'POST',
    dataType: 'json',
    header: {
      'content-type': 'application/x-www-form-urlencoded'
    },
    data: {
      device_code: code
    },
    success: success,
    fail: fail
  })
}

/**
 * 
 * @param {*} args 对象，包含属性：openid, code, phonenumber, success, fail
 */
const bindCode = (args) => {
  console.log('bindCode', args)
  wx.request({
    url: URL_BIND_CODE,
    method: 'POST',
    header: {
      'content-type': 'application/x-www-form-urlencoded'
    },
    data: {
      device_code: args.code,
      user_open_id: args.openid,
      user_mobile: args.phonenumber
    },
    success: args.success,
    fail: args.fail
  })
}

/**
 * 
 * @param {*} args 对象，包含属性：openid, success, fail
 */
const checkUser = (args) => {
  // console.log('bindCode', args)
  // wx.request({
  //   url: URL_CHECK_USER,
  //   method: 'POST',
  //   header: {
  //     'content-type': 'application/x-www-form-urlencoded'
  //   },
  //   data: {
  //     user_open_id: args.openid
  //   },
  //   success: args.success,
  //   fail: args.fail
  // })
}

module.exports = {
  checkCode: checkCode,
  bindCode: bindCode,
  checkUser: checkUser
}