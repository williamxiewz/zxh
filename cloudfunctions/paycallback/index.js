// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

// 云函数入口函数
exports.main = async (event, context) => {

  /**{ appid: 'wxd2d16a504f24665e',
  attach: '附加数据',
  bankType: 'OTHERS',
  cashFee: 1,
  feeType: 'CNY',
  isSubscribe: 'N',
  mchId: '1800008281',
  nonceStr: '48WQRVGSJ5DUYZ2KYT21M3RUKTA6G9KF',
  openid: 'oPoo44y7gPPbD079yjR9XCLQiSBg',
  outTradeNo: '3435762558438826197935287753',
  resultCode: 'SUCCESS',
  returnCode: 'SUCCESS',
  subAppid: 'wx8040a92bbd85ec46',
  subIsSubscribe: 'N',
  subMchId: '1606704502',
  subOpenid: 'oOjJw5ZMmvq0uiDhL-tEkdDUGRiQ',
  timeEnd: '20210224231228',
  totalFee: 1,
  tradeType: 'JSAPI',
  transactionId: '4200000883202102244011431531',
  userInfo:
   { appId: 'wx8040a92bbd85ec46',
     openId: 'oOjJw5ZMmvq0uiDhL-tEkdDUGRiQ' } } */

  console.log(event)
  if (event.resultCode == 'SUCCESS') {
    const openid = cloud.getWXContext().OPENID
    const db = cloud.database()

    var getRes = await db.collection('my_users').where({
      openid: openid
    }).get()

    const user = getRes.data[0]

    console.log('user', user)

    const updateRes = await db.collection('my_users').doc(user._id).update({
      data: {
        is_vip: true
      }
    })
    console.log('更新VIP', updateRes)

    const result = await db.collection('my_payments').add({
      data: {
        openid: openid,
        fee: event.totalFee,
        timestamp: event.timeEnd
      }
    })
    console.log('保存支付记录', result)
    return { errcode: 0, errmsg: '支付成功' }
  } else {
    return { errcode: -1, errmsg: '支付失败' }
  }
}