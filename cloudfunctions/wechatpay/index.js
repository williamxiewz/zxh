// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

// 云函数入口函数
exports.main = async (event, context) => {
  //文档：https://developers.weixin.qq.com/miniprogram/dev/wxcloud/guide/wechatpay.html
  //文档：https://developers.weixin.qq.com/miniprogram/dev/wxcloud/reference-sdk-api/open/pay/CloudPay.unifiedOrder.html
  console.log('event=', event);
  let wxContext = cloud.getWXContext();
  let fromAppId = wxContext.FROM_APPID;
  let fromOpenId = wxContext.FROM_OPENID;
  console.log('FROM_APPID=', fromAppId);
  console.log('FROM_OPENID=', fromOpenId);

  if (fromAppId) {
    //使用轩源的小程序测试新的商户号支付
    let subMchId;
    if (fromAppId == "wx5a14988cb9980094" //合美
      || fromAppId == "wx2a456360643bf914" //轩源
      || fromAppId == "wx51e74a3c09ca25a1" //绿佳 智享e+
      || fromAppId == "wxf707393f43bdaa51" //踏浪
      || fromAppId == "wx5973b4d79e2bf5ed" //新蕾
      || fromAppId == "wx11396b66a5bd951d" //新大洲
      || fromAppId == "wx9b669f17cb0f999c" //深豹
      || fromAppId == "wx803ec18123102c43" //小帅
    ) {
      subMchId = "1646374782";//众鑫汇科技
    } else {
      subMchId = "1606704502";//众鑫汇电子
    }

    const res = await cloud.cloudPay({
      appid: fromAppId
    }).unifiedOrder({
      "body": "众鑫汇智控",
      /** 必填，不能给空字符串 */
      "outTradeNo": generateMixed(28, 9),
      /**商户订单号 */
      "spbillCreateIp": "127.0.0.1",
      /**终端IP */
      "subMchId": subMchId,
      "totalFee": event.totalFee,
      /**总金额(单位：分) */
      "envId": "zxh-9g5pei38c7cdc56d",
      /**结果通知回调云函数环境 */
      "functionName": "paycallback",
      /**结果通知回调云函数名 */
      "nonceStr": generateMixed(32, 35),
      /**随机字符串，不长于32位。 */
      "tradeType": "JSAPI",
      "detail": "商品详情",
      /**商品详情 */
      "attach": "附加数据"
    });
    return res;
  }

  const res = await cloud.cloudPay.unifiedOrder({
    "body": "众鑫汇智控",
    /** 必填，不能给空字符串 */
    "outTradeNo": generateMixed(28, 9),
    /**商户订单号 */
    "spbillCreateIp": "127.0.0.1",
    /**终端IP */
    "subMchId": "1646374782",
    "totalFee": 1800,
    /**总金额(单位：分) */
    "envId": "zxh-9g5pei38c7cdc56d",
    /**结果通知回调云函数环境 */
    "functionName": "paycallback",
    /**结果通知回调云函数名 */
    "nonceStr": generateMixed(32, 35),
    /**随机字符串，不长于32位。 */
    "tradeType": "JSAPI",
    "detail": "商品详情",
    /**商品详情 */
    "attach": "附加数据"
  });

  //console.log(res);
  return res
}

var chars = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'];

function generateMixed(n, maxId) {
  var res = "";
  for (var i = 0; i < n; i++) {
    var id = Math.ceil(Math.random() * maxId);
    res += chars[id];
  }
  return res;
}