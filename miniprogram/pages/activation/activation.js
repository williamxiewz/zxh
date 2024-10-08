// miniprogram/pages/activation/activation.js
const app = getApp()
const viewutil = require('../../utils/viewutil.js')
const httputil = require('../../utils/httputil.js')
const sputil = require('../../utils/sputil.js')
const dbutil = require('../../utils/dbutil.js')

Page({
  data: {
    code: '',
    timer: 0
  },
  onCodeInput(e) {
    console.log(e.detail.value);
    this.setData({
      code: e.detail.value
    });
  },
  onOkClick(e) {
    if (this.data.code == '') {
      viewutil.toast('请输入激活码');
      return;
    }
    var that = this;
    httputil.checkCode(
      this.data.code,
      (res) => {
        console.info(res);
        if (res.data.code == 0) {
          that.bindCode();
        } else {
          viewutil.toast(res.data.msg);
        }
      },
      (err) => {
        console.error(err);
      });
  },
  bindCode() {
    var that = this;
    httputil.bindCode({
      openid: app.globalData.openid,
      code: this.data.code,
      phonenumber: sputil.getPhoneNumber(),
      success: (res) => {
        console.info(res);
        viewutil.toast(res.data.msg);
        if (res.data.code == 0) {
          //激活成功
          app.globalData.isActivated = true;
          clearTimeout(that.data.timer);
          that.data.timer = setTimeout(function () {
            wx.navigateBack();
          }, 1000); //延时1秒关闭窗口，不然看不到绑定成功的提示，显得突兀

        }
      },
      fail: (err) => {
        console.error(err);
      }
    });
  },
  onLoad: function (options) {

  },
  onReady: function () {

  },
  onShow: function () {

  },
  onHide: function () {

  },
  onUnload: function () {
    clearTimeout(this.data.timer);
  },
  onPullDownRefresh: function () {

  },
  onReachBottom: function () {

  },
  onShareAppMessage: function () {

  }
})