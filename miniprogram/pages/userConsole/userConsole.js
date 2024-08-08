// pages/userConsole/userConsole.js
const app = getApp()

const sputil = require('../../utils/sputil.js')
const bleproxy = require('../../utils/bleproxy.js')
const bledata = require('../../utils/bledata.js')
const util = require('../../utils/util.js')
const dbutil = require('../../utils/dbutil.js')
const viewutil = require('../../utils/viewutil.js')
const httputil = require('../../utils/httputil.js')
const log = require('../../utils/log.js')
const onfire = require('../../utils/onfire.js')
import drawQrcode from '../../qrcode/weapp.qrcode.esm.js'

const DEVICE_STATES = [
  '初始', //0
  '撤防', //1
  '启动', //2
  '设防', //3
  '预警', //4
  '监测', //5
  '报警' //6
]

const ADD_DEVICE_TIMEOUT = 30000 //30秒配对超时
const ADD_DEVICE_MSG = '请使用原车遥控器同时按住锁键和开锁键3秒，等待主机“DI”一声提示后松开按键，等待防盗器主机 BI/BI/BI 响三声后即配对成功。'
//我的设备MAC：383995486621
Page({

  data: {
    canIUseGetUserProfile: false,
    logged: false,
    avatarUrl: './user-unlogin.png',
    nickname: '点击登录',
    mac: -1, //选中的设备MAC
    devices: [{
        type: '',
        deviceId: '',
        mac: '',
        name: '+',
        version: '',
        connected: false
      },
      {
        type: '',
        deviceId: '',
        mac: '',
        name: '+',
        version: '',
        connected: false
      },
      {
        type: '',
        deviceId: '',
        mac: '',
        name: '+',
        version: '',
        connected: false
      }
    ],
    bleState: '未连接', //蓝牙连接状态
    deviceId: '+',
    deviceState: '', //设备当前的状态
    sensitivity: 0, //震动灵敏度
    disableSpeedLimit: false, //解除限速
    ganyingAvailable: false, //是否有感应功能
    ganyingChecked: false, //感应开关
    ganyingValue: 3, //感应距离
    ganyingJuli: '中', //感应距离显示的文字
    volume: 0, //限速提示音量
    connectTimerId: -1, //配对超时定时器id
    pairdevice: {
      title: '',
      hidden: true,
      text: ADD_DEVICE_MSG,
      time: ADD_DEVICE_TIMEOUT
    },
    sharedevice: {
      title: '',
      hidden: true,
      text: ''
    },
    inputlogo: {
      hidden: true,
      text: ''
    },
    tempLogo: '',
    isEncrypt: false, //是否加密蓝牙交互数据
    myDevice: null, //临时连接的设备
    showJiHuoButton: false, //是否显示 “激活” 按钮
    showGetPhoneNumberButton: true,
    showActionsheet: false,
    groups: [{
        text: '微信支付',
        value: 1
      },
      {
        text: '激活码',
        value: 2
      }
    ]
  },

  jiHuo() {
    this.setData({
      showActionsheet: true
    });
  },

  btnClick(e) {
    console.log('点击的激活方式', e);
    this.setData({
      showActionsheet: false
    });
    if (e.detail.value == 1) {
      console.log('微信支付');
      this.pay();
    } else if (e.detail.value == 2) {
      console.log('激活码');
      wx.navigateTo({
        url: '../activation/activation',
      })
    }
  },

  testPay(e) {
    this.pay();
  },

  getPhoneNumber(e) {
    console.log('getPhoneNumber', e)
    var that = this;
    var cloudIDType = typeof (e.detail.cloudID);
    if (cloudIDType != 'string') {
      console.error('getPhoneNumber() - cloudIDType=' + cloudIDType)
      return;
    }
    dbutil.cloud.callFunction({
      name: 'openapi',
      data: {
        action: 'getOpenData',
        openData: {
          list: [
            e.detail.cloudID,
          ]
        }
      }
    }).then(res => {
      console.log('[getPhoneNumber] 调用成功：', res);
      let phoneNumber = res.result.list[0].data.phoneNumber;
      console.info("获得手机号", phoneNumber);
      sputil.putPhoneNumber(phoneNumber);
      that.setData({
        showGetPhoneNumberButton: false
      });
      that.jiHuo();
    }).catch(console.error);
  },

  showPairDeviceDialog: function () {
    var self = this

    const countDown = self.selectComponent('.control-count-down');
    countDown.reset()
    countDown.start()

    self.setData({
      pairdevice: {
        title: '',
        hidden: false,
        text: ADD_DEVICE_MSG,
        time: ADD_DEVICE_TIMEOUT
      }
    })

    //开始扫描设备
    bleproxy.startLeScan(true, ADD_DEVICE_TIMEOUT)

    let connectTimerId = setTimeout(function () {
      viewutil.toast('匹配未成功，请重新匹配操作')
      if (self.data.myDevice != null) {
        bleproxy.disconnect(self.data.myDevice.deviceId)
      }
      self.hidePairDeviceDialog() //超时取消配对

    }, ADD_DEVICE_TIMEOUT)

    self.setData({
      connectTimerId: connectTimerId
    })
  },

  //用户取消配对
  pairdeviceCancel: function () {
    var that = this
    console.info('取消配对')
    clearTimeout(that.data.connectTimerId)
    if (that.data.myDevice != null) {
      bleproxy.disconnect(that.data.myDevice.deviceId)
    }
    that.hidePairDeviceDialog()
  },

  //跟设备端配对成功
  pairdeviceSuccess: function () {
    var that = this

    let myDevice = that.data.myDevice
    if (myDevice == null) return

    console.info('pairdeviceSuccess')

    dbutil.bindDevice(myDevice, function (res) {
      //console.info('pairdeviceSuccess', res)
      if (res.result.code == 0) {
        that.doSuccess(res.result.device);
      } else {
        viewutil.toast(res.result.msg)
        // code 见云函数 myclouddb 中 bindeDevice 方法
        if (res.result.code == 2) {
          //设备已被其他用户绑定
          bleproxy.disconnect(myDevice.deviceId)
        }
      }
    })

    clearTimeout(that.data.connectTimerId)
    that.hidePairDeviceDialog()
  },

  doSuccess: function (myDevice) {
    var that = this;
    viewutil.toast('匹配成功');
    console.info('配对成功!', myDevice);
    var mac = '';

    that.data.devices.forEach(element => {
      if (element.deviceId == '') {
        if (mac == '') {
          mac = myDevice.mac
          element.name = myDevice.name
          element.deviceId = myDevice.deviceId
          element.mac = myDevice.mac
          element.version = myDevice.version
          element.connected = true
          element.openid = myDevice.openid
          element.openids = myDevice.openids
          element.type = myDevice.type
          element.lend_code = myDevice.lend_code
        }
      }
    });

    let devices = that.data.devices;

    that.setData({
      mac: mac,
      connected: true,
      bleState: '已连接',
      devices: devices,
      deviceId: myDevice.deviceId,
      ganyingAvailable: that.isGanyingAvailable(myDevice)
    });

    sputil.putDeviceMac(myDevice.mac);
    sputil.putDeviceId(myDevice.deviceId);
    bleproxy.setCurrentDeviceId(myDevice.deviceId);
    sputil.putDevices(devices);

    //绑定成功后
    if (app.isUserAvailable()) {
      //发起HID配对
      if (that.isGanyingAvailable(myDevice)) {
        that.requestHID(myDevice);
      }
    } else {
      //未激活的用户，配对成功后显示“激活”按钮
      const myuser = app.globalData.myuser;
      if (myuser.use_times > 20) {
        that.setData({
          showJiHuoButton: false //true
        });
      }
    }
  },

  //隐藏配对对话框
  hidePairDeviceDialog: function () {
    this.setData({
      pairdevice: {
        title: '',
        hidden: true,
        text: ADD_DEVICE_MSG,
        time: ADD_DEVICE_TIMEOUT
      },
      myDevice: null //重置临时设备
    })
    bleproxy.stopLeScan()
  },


  //分享借车
  shareDevice: function () {
    console.info('分享借车')

    var lendCode = '' //借车码
    var deviceCount = 0 //设备数量
    var isShare = false //是否是通过扫码添加的设备
    this.data.devices.forEach(element => {
      if (element.mac != '') {
        deviceCount++

        if (element.mac == this.data.mac) {
          lendCode = element.lend_code
          //设备绑定的用户id跟当前登录的用户id不一样，是分享来的设备
          //isShare = element.openid != app.globalData.openid
          isShare = element.openids.indexOf(app.globalData.openid, 0) == -1
        }
      }
    });

    if (deviceCount == 0) {
      viewutil.toast('您尚未添加车辆')
      return
    }

    if (isShare) {
      viewutil.toast('该设备是您通过扫码添加的，无法再次分享')
      return
    }

    if (lendCode == '') {
      viewutil.toast('请选择您要分享的车辆')
      return
    }

    if (!app.isUserAvailable()) {
      viewutil.toast('免费体验用户无法分享车辆')
      return
    }

    //生成二维码的库：https://github.com/yingye/weapp-qrcode
    drawQrcode({
      width: 200,
      height: 200,
      canvasId: 'myQrcode',
      // ctx: wx.createCanvasContext('myQrcode'),
      text: wx.arrayBufferToBase64(util.stringToArrayBuffer(lendCode)),
      // v1.0.0+版本支持在二维码上绘制图片
      // image: {
      //   imageResource: '../../images/icon.png',
      //   dx: 70,
      //   dy: 70,
      //   dWidth: 60,
      //   dHeight: 60
      // }
    })
    this.setData({
      sharedevice: {
        title: '借车码',
        hidden: false,
        text: '' //测试显示借车码明文 lendCode
      }
    })
  },


  sharedeviceCancel: function () {
    this.setData({
      sharedevice: {
        title: '',
        hidden: true,
        text: ''
      }
    })
  },


  //跳转到设备扫描页面
  scanDevice: function () {
    wx.navigateTo({
      url: '../scanle/scanle',
    })
  },

  deviceChange: function (e) {
    console.info('deviceChange', e)
    this.setData({
      mac: e.detail.value
    })
  },

  //旧API获取用户信息
  onGetUserInfo: function (e) {
    console.log('onGetUserInfo() - 用户信息', e.detail.userInfo)
    this.setUserInfo(e.detail.userInfo)
  },

  setUserInfo: function (userInfo) {
    if (!this.data.logged) {
      this.setData({
        logged: true,
        avatarUrl: userInfo.avatarUrl,
        nickname: userInfo.nickName,
        userInfo: userInfo
      })
    }
  },


  //新API获取用户信息
  getUserProfile(e) {
    // 推荐使用wx.getUserProfile获取用户信息，开发者每次通过该接口获取用户个人信息均需用户确认
    // 开发者妥善保管用户快速填写的头像昵称，避免重复弹窗
    wx.getUserProfile({
      desc: '用于绑定设备', // 声明获取用户个人信息后的用途，后续会展示在弹窗中，请谨慎填写
      success: (res) => {
        console.log('getUserProfile() - 用户信息', res.userInfo)
        dbutil.addWXUserInfo(res.userInfo) //存储用户信息到云数据库
        this.setUserInfo(res.userInfo)
      },
      fail: (err) => {
        console.error('getUserProfile', err)
      }
    })
  },


  onLoad: function (options) {
    var that = this;
    console.info('手机号 ' + sputil.getPhoneNumber());
    that.setData({
      isEncrypt: sputil.isEncrypt(),
      showGetPhoneNumberButton: sputil.getPhoneNumber() == ''
    });

    if (wx.getUserProfile) {
      that.setData({
        canIUseGetUserProfile: true
      });
    }

    if (!that.data.logged) {
      if (that.data.canIUseGetUserProfile) {
        //获取用户信息-新接口
        dbutil.getWXUserInfo(function (res2) {
          console.log('云数据库获取用户信息', res2);
          if (res2.result == null) { //云端没有存储的用户信息，需用户点击登录弹窗获取
            console.log('云端没有存储的用户信息，需用户点击登录弹窗获取');
          } else {
            console.log('云端已有存储的用户信息');
            that.setUserInfo(res2.result.userInfo);
          }
        })
      } else {
        //获取用户信息-旧接口
        wx.getSetting({
          success: res => {
            console.info('用户信息授权', res.authSetting['scope.userInfo'])
            if (res.authSetting['scope.userInfo']) {
              // 已经授权，可以直接调用 getUserInfo 获取头像昵称，不会弹框
              wx.getUserInfo({
                success: res => {
                  that.setUserInfo(res.userInfo);
                }
              });
            }
          }
        });
      }
    }

    let localDevices = sputil.getDevices();
    console.info('本地存储的设备：' + typeof (localDevices), localDevices);

    wx.getSystemInfo({
      success: (result) => {
        that.setData({
          windowHeight: result.windowHeight - 54 //tabBar的高度设置的54px
        });
      }
    });

    // 监听设备的连接状态
    onfire.on('onBLEConnectionStateChange_userConsole', function (res) {
      let devices = that.data.devices;

      for (var i = 0; i < devices.length; i++) {
        let itemMac = devices[i].mac
        //由于iOS的MAC跟deviceId不一样，这里通过MAC获取deviceId作比较
        let itemDeviceId = sputil.getDeviceIdByMac(itemMac);
        if (!itemDeviceId) {
          itemDeviceId = util.mac2DeviceId(itemMac);
        }
        if (itemDeviceId == res.deviceId) {
          devices[i].connected = res.connected;
          devices[i].deviceId = itemDeviceId;
          //自动选中最新连接的设备
          if (res.connected) {
            sputil.putDeviceMac(itemMac);
            sputil.putDeviceId(itemDeviceId);
            bleproxy.setCurrentDeviceId(itemDeviceId);
            that.setData({
              mac: itemMac,
              deviceId: itemDeviceId,
              ganyingAvailable: that.isGanyingAvailable(devices[i])
            });
          }
          break;
        }
      }
      that.setData({
        devices: devices
      });
    });

    //监听模块端发来的数据
    onfire.on('onBLECharacteristicValueChange_userConsole', function (res) {

      if (sputil.isEncrypt()) {
        bledata.decryptPayload(res.value, function (res2) {
          if (res2.result.value != '') {
            let buffer = util.hex2array(res2.result.value)
            that.handleRxData(buffer, res.deviceId)
          } else {
            console.error('解密数据失败')
          }
        })
      } else {
        that.handleRxData(res.value, res.deviceId)
      }
    })

    //监听设备扫描
    onfire.on('onBluetoothDeviceFound_userConsole', function (myDevice) {
      //发现设备
      //console.info('发现设备' + myDevice.type + ", mac=" + myDevice.mac)

      //配对的对话框没在显示，即没有在配对，不予处理
      if (that.data.pairdevice.hidden) return

      if (!that.isDeviceAdded(myDevice.mac) &&
        myDevice.type.indexOf("+") != -1 && that.data.myDevice == null) {

        const ganyingAvailable = that.isGanyingAvailable(myDevice);
        //匹配模式下的设备
        that.setData({
          myDevice: myDevice,
          deviceId: myDevice.deviceId,
          ganyingAvailable: ganyingAvailable
        });
        bleproxy.stopLeScan();
        //
        console.log('配对连接设备>>>')
        if (ganyingAvailable) {
          //
        }
        bleproxy.connect(myDevice.deviceId);
      }
    });

    onfire.on('userConsole_update_devices', function (device) {
      that.getDevicesFromCloud();
    });
  },

  isByte7Valid: function (byte7) {
    switch (byte7) {
      case 0x82:
      case 0x83:
      case 0x88:
      case 0x89:
      case 0x8A:
      case 0x8B: //目前没有0x8B~0x8F
      case 0x8C:
      case 0x8D:
      case 0x8E:
      case 0x8F:
        return true;
      default:
        return false;
    }
  },

  isByte7ValidWithGanying: function (byte7) {
    switch (byte7) {
      case 0x88:
      case 0x89:
      case 0x8A:
        return true;
      default:
        return false;
    }
  },

  //处理接收到的数据
  handleRxData: function (buffer, deviceId) {
    var that = this;
    let hex = util.array2hex(buffer);
    let timestamp = util.formatTime(new Date());
    console.log(timestamp + ' 收到数据 <<< ' + hex);

    let value = new Uint8Array(buffer);

    let selectedDeviceId = sputil.getDeviceIdByMac(that.data.mac);
    //除了配对的数据，未选中的设备的数据，不处理
    if (value[11] != 7 && selectedDeviceId != deviceId) return;

    console.info('value.length=' + value.length + ', value[6]=' + value[6]);
    console.info('isSharedDevice=' + that.isSharedDevice() + ', isUserAvailable=' + app.isUserAvailable());
    var deviceState = '';
    if (value.length >= 12) {
      let deviceType = sputil.getDeviceTypeById(deviceId);
      console.info('设备类型', deviceType);
      if (that.isGanyingAvailable(deviceType)) {
        //激活用户绑定的设备，才处理感应功能的数据
        if (!that.isSharedDevice() && app.isUserAvailable()) {
          console.info('value[12]=' + value[12]);
          //配对成功发送开感应的指令
          if (sputil.isSendEnableGanyingCmd(deviceId)) {
            sputil.setSendEnableGanyingCmd(deviceId, false); //重置该标志
            //感应距离为1表示感应关闭
            let ganyingValue = value[12] == 1 ? 3 : value[12];
            that.sendEnanbleGanyingCmd(deviceId, ganyingValue);
            setTimeout(function () {
              that.sendEnanbleGanyingCmd(deviceId, ganyingValue);
            }, 200);
          }

          switch (value[12]) {
            case 1:
              that.setData({
                ganyingChecked: false
              });
              break;
            case 2:
              that.setData({
                ganyingChecked: true,
                ganyingValue: value[12],
                ganyingJuli: '近'
              });
              break;
            case 3:
              that.setData({
                ganyingChecked: true,
                ganyingValue: value[12],
                ganyingJuli: '中'
              });
              break;
            case 4:
              that.setData({
                ganyingChecked: true,
                ganyingValue: value[12],
                ganyingJuli: '远'
              });
              break;
          }
        }
      }

      that.setData({
        sensitivity: value[8],
        disableSpeedLimit: value[9] == 2,
        volume: value[10]
      });
      sputil.putSensitivity(util.array2hex(value.slice(8, 11)));
      if (value[11] == 7) {
        //小程序收到0x07状态后，回复0x07，让设备回到正常状态。收到0x07后，即可临时绑定此设备
        deviceState = '匹配模式'
        if (value[6] == 0x82) {
          that.sendPayload(7, false, 0, 0);
        } else {
          that.sendPayload(7, false);
        }
        that.pairdeviceSuccess();

      } else {
        deviceState = DEVICE_STATES[value[11]];
      }
    }

    if (typeof (deviceState) != 'undefined') {
      console.info('userConsole.js 设备状态：', deviceState)
      that.setData({
        deviceState: deviceState
      });
    }
  },


  //处理云端设备
  getDevicesFromCloud: function () {
    var that = this
    dbutil.getDevices(function (res) {

      console.info('云端设备：', res)

      var devices = [{
          type: '',
          deviceId: '',
          mac: '',
          name: '+',
          version: '',
          connected: false
        },
        {
          type: '',
          deviceId: '',
          mac: '',
          name: '+',
          version: '',
          connected: false
        },
        {
          type: '',
          deviceId: '',
          mac: '',
          name: '+',
          version: '',
          connected: false
        }
      ]

      for (var i = 0; i < devices.length; i++) {
        if (i < res.result.length) {
          let deviceId = sputil.getDeviceIdByMac(res.result[i].mac)
          devices[i] = res.result[i]
          devices[i].deviceId = deviceId
          devices[i].connected = bleproxy.isConnected(deviceId)
        }
      }

      ///
      var mac = ''
      var deviceId = ''
      var ganyingAvailable = false
      devices.forEach(element => {
        console.log(element)
        let tempMac = element.mac
        let tempDeviceId = sputil.getDeviceIdByMac(tempMac)
        if(!tempDeviceId) {
          tempDeviceId = util.mac2DeviceId(tempMac);
        }
        element.connected = bleproxy.isConnected(tempDeviceId)
        if (tempMac != '' && tempMac == sputil.getDeviceMac()) {
          mac = tempMac
          deviceId = tempDeviceId
          ganyingAvailable = that.isGanyingAvailable(element)
        }
      })

      //默认选中第一个
      if (mac == '' || deviceId == '') {
        if (devices[0].mac != '') {
          mac = devices[0].mac;
          deviceId = devices[0].deviceId;
          if(!deviceId) {
            deviceId = util.mac2DeviceId(mac);
          }
          ganyingAvailable = that.isGanyingAvailable(devices[0]);
        }
      }
      sputil.putDeviceMac(mac)
      sputil.putDeviceId(deviceId)
      bleproxy.setCurrentDeviceId(deviceId);
      sputil.putDevices(devices)
      that.setData({
        mac: mac,
        devices: devices,
        deviceId: deviceId,
        ganyingAvailable: ganyingAvailable,
        showJiHuoButton: false //that.isShowJiHuoButton()
      });
      ////
    })
  },

  isDeviceAdded: function (mac) {
    let devices = this.data.devices
    var contains = false
    for (var i = 0; i < devices.length; i++) {
      if (devices[i].mac == mac) {
        contains = true
      }
    }
    return contains
  },

  onUnload: function () {
    onfire.un('onBLEConnectionStateChange_userConsole')
    onfire.un('onBLECharacteristicValueChange_userConsole')
    onfire.un('onBluetoothDeviceFound_userConsole')
    onfire.un('userConsole_update_devices')
  },


  sendPayload: function (cmdCode, showToast = false, optCode = 0, ganying) {
    if (!app.globalData.isNetworkOn) {
      viewutil.toast('网络已断开');
      return;
    }

    // 操作码2-设置解除限制，功能控制指令码7-绑定，这两个指令不做限制（即非激活用户可用）
    if (optCode != 2 && cmdCode != 7 && !this.isCanUse()) {
      return;
    }
    let deviceId = this.data.deviceId;
    let sensitivity = this.data.sensitivity;
    let limitSpeed = !this.data.disableSpeedLimit;
    let volume = this.data.volume;

    let arr = new Uint8Array(3);
    arr[0] = sensitivity;
    arr[1] = limitSpeed ? 2 : 1;
    arr[2] = volume;

    sputil.putSensitivity(util.array2hex(arr.buffer));

    let data = bledata.mkData(cmdCode, sensitivity, limitSpeed, volume, optCode, ganying);
    bleproxy.send(deviceId, data, showToast);
  },


  onShow: function () {
    //状态栏颜色
    wx.setNavigationBarColor({
      frontColor: '#000000',
      backgroundColor: '#ffffff',
      animation: {
        duration: 400,
        timingFunc: 'easeIn'
      }
    });
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({
        selected: 1,
        bg_path: '/images/tab_settings_selected.png'
      });
    }
    //云数据库获取用户的设备
    console.info('userConsole.js onShow()');
    this.getDevicesFromCloud();
  },

  //判断是否要显示“激活”按钮
  isShowJiHuoButton: function () {
    const myuser = app.globalData.myuser;
    if (myuser.use_times > 20) {
      return !(app.isUserAvailable()) && sputil.getDeviceCount() > 0;
    }
    return false;
  },


  onUnload: function () {
    var that = this;
    // 断开连接
    wx.closeBLEConnection({
      deviceId: that.data.deviceId,
      success: function (res) {
        console.error('断开连接', res);
      },
    });
  },


  onSensitivityChange: function (e) {
    console.log('灵敏度调节', e.detail.value)
    this.data.sensitivity = e.detail.value
    this.sendPayload(0, false, 1)
  },


  onVolumeChange: function (e) {
    console.log('限速提示音量', e.detail.value)
    this.data.volume = e.detail.value
    this.sendPayload(0, false, 3)
  },

  onSpeedLimitChange: function (e) {
    var checked = e.detail.value
    console.log('设置解除限速', checked)
    this.data.disableSpeedLimit = checked
    this.sendPayload(0, false, 2)
  },

  //发起HID配对
  requestHID: function (myDevice) {
    const deviceId = myDevice.deviceId;
    var that = this;
    //发指令让设备端开启HID配对，允许手机发起配对
    //每250ms发一次，共发5次
    let data = bledata.mkData(0xff, 0, 0, 0, 0, 0);
    bleproxy.send(deviceId, data, false);
    /*var count = 0;
    var timerId = setInterval(function(){
      console.log('count=' + count);
      bleproxy.send(deviceId, data, false);
      count++;
      if(count == 5) {
        clearInterval(timerId);
      }
    }, 250);*/

    setTimeout(function () {
      //设置一下标志，在收到上报的状态数据后再发送开感应的指令
      sputil.setSendEnableGanyingCmd(deviceId, true);
      if (app.globalData.platform == 'android') {
        console.info('android透传绑定成功，发起HID配对');
        //发起蓝牙HID配对，仅针对Android手机
        wx.makeBluetoothPair({
          deviceId: deviceId,
          pin: '',
        });
      } else {
        //iOS断开重连以触发HID配对
        console.info('ios透传绑定成功，断开重连发起HID配对');
        bleproxy.disconnect(deviceId);
      }
    }, 1500);
  },

  sendEnanbleGanyingCmd: function (deviceId, v) {
    console.log('打开感应');
    //打开感应，5代表感应功能，2/3/4默认中档距离
    let data = bledata.mkData(0, 0, true, 0, 5, v);
    bleproxy.send(deviceId, data, false);
  },

  //感应开关变化
  onGanyingCheckChange: function (e) {
    var that = this;
    const checked = e.detail.value;
    console.log('感应开关', checked);

    if (this.isSharedDevice()) {
      wx.showModal({
        content: '分享设备不支持后台感应',
      });
      that.setData({
        ganyingChecked: false
      });
    } else {
      if (app.isUserAvailable()) {
        that.setData({
          ganyingChecked: checked
        });
        //开启HID配对
        that.sendPayload(checked ? 0xFF : 0xFE, false, 4, checked ? this.data.ganyingValue : 1);
        var timeout = 100
        if (checked) {
          timeout += 1500;
          setTimeout(function () {
            if (app.globalData.platform == 'ios') {
              //iOS系统，断开重连，以发起HID配对
              console.info('iOS系统，断开重连，以发起HID配对');
              bleproxy.disconnect(that.data.deviceId);
            } else {
              //发起蓝牙HID配对，仅针对Android手机
              wx.makeBluetoothPair({
                deviceId: that.data.deviceId,
                pin: '',
              });
            }
          }, 1500);
        }
        setTimeout(function () {
          //1-关闭感应
          that.sendPayload(0, false, 5, checked ? that.data.ganyingValue : 1);
        }, timeout);
      } else {
        //体验用户
        that.setData({
          ganyingChecked: false
        });
        wx.showModal({
          content: '体验用户无法开启后台感应功能，如需使用后台感应功能，需付费18元永久使用。',
          success: (res) => {
            if (res.confirm) {
              that.pay();
            }
          }
        });
      }
    }
  },

  //感应距离
  onGanyingChange: function (e) {
    const level = e.detail.value
    console.log('感应距离', level)
    this.data.ganyingValue = level
    var juli = this.data.ganyingJuli
    if (level == 2) juli = '近'
    if (level == 3) juli = '中'
    if (level == 4) juli = '远'
    this.setData({
      ganyingJuli: juli
    })
    this.sendPayload(0, false, 5, level)
  },

  onEncryptChange: function (e) {
    let checked = e.detail.value
    console.log('设置加密', checked)
    this.data.isEncrypt = checked
    sputil.setEncrypt(checked)
  },

  //删除设备
  removeDevice: function (e) {
    console.log('清除匹配', e);

    var that = this
    if (that.data.logged) {
      var item = e.currentTarget.dataset.item
      console.info('removeDevice', item)
      if (item.mac != '') {
        wx.showModal({
          content: '确定删除该设备？',
          showCancel: true,
          success: (res) => {
            if (res.confirm) {
              //用户确定删除设备
              console.log('用户确定删除设备', item);
              dbutil.delDevice(item, function (res2) {
                console.log('云端删除设备', res2);
                if (res2.result.stats.removed > 0 || res2.result.stats.updated > 0) {
                  that.doDelete(item);
                  if (that.isGanyingAvailable(item)) {
                    that.tipAfterDelete(item.type);
                  }
                }
              });
            }
          }
        })
      }
    } else {
      viewutil.toast('请先登录');
    }
  },

  tipAfterDelete: function (deviceType) {
    var productNo = 'XX';
    if (deviceType == '+BA02') {
      productNo = '02'
    }
    if (deviceType == '+BA03') {
      productNo = '03'
    }
    if (deviceType == '+BA08') {
      productNo = '08'
    }
    if (deviceType == '+BA09') {
      productNo = '09'
    }
    wx.showModal({
      content: '确保设备能再次与手机配对，请进入手机-设置-蓝牙-选择 ZXH_BA' + productNo + '****设备点击取消配对或忽略此设备',
      showCancel: false
    });
  },

  doDelete: function (item) {
    let mac = item.mac
    let devices = this.data.devices

    devices.forEach(element => {
      if (element.mac == mac) {
        element._id = ''
        element.openid = ''
        element.name = '+'
        element.deviceId = ''
        element.version = ''
        element.mac = ''
        element.type = ''
        element.lend_code = ''
        element.connected = false
      }
    });

    sputil.putDevices(devices)
    this.setData({
      devices: devices
    })

    if (sputil.getDeviceMac() == mac) {
      sputil.putDeviceMac('')
      sputil.putDeviceId('')
      bleproxy.setCurrentDeviceId('');
      bleproxy.disconnect(this.data.deviceId)

      this.setData({
        mac: '',
        deviceId: ''
      })
    }
  },

  addDevice: function (e) {
    if (this.data.logged) {
      if (!bleproxy.isBluetoothAvailable()) {
        bleproxy.showModal() //提示用户打开蓝牙
        return
      }

      var that = this
      wx.getSystemInfo({
        success: (result) => {
          console.info('定位开关', result.locationEnabled)
          if (!result.locationEnabled) {
            wx.showModal({
              title: '提示',
              content: '扫描蓝牙设备需要打开手机的位置服务，建议您打开位置开关后重新进入小程序',
              confirmText: '好的',
              showCancel: false
            })
          } else {
            var item = e.currentTarget.dataset.item

            if (item.mac == '') {
              console.info('addDevice', item)
              that.showPairDeviceDialog()
            } else {
              //切换设备
              console.info('切换设备', item)
              sputil.putDeviceMac(item.mac)
              sputil.putDeviceId(item.deviceId)
              bleproxy.setCurrentDeviceId(item.deviceId);
              that.setData({
                mac: item.mac,
                deviceId: item.deviceId,
                ganyingAvailable: that.isGanyingAvailable(item)
              });
              //设置感应开关状态，分享来的设备不勾选
              if (that.data.isGanyingAvailable && !that.isSharedDevice()) {
                that.setData({
                  ganyingChecked: false
                });
              }

              //切换设备时查询一次设备
              if (app.globalData.isNetworkOn) {
                bleproxy.send(item.deviceId, bledata.queryState());
              }
            }
          }
        },
      })

    } else {
      viewutil.toast('请先登录')
    }
  },

  //根据设备类型判断是否支持“后台感应功能”
  isGanyingAvailable(device) {
    let deviceType = typeof (device) == 'string' ? device : device.type;
    let num = util.deviceTypeNum(deviceType);
    return num == 2 || num == 3 || num == 4 || num >= 8;
    //return deviceType == '+BA02' || deviceType == '+BA03' || deviceType == '+BA08' || deviceType == '+BA09'
  },

  onLogoInput: function (e) {
    console.log('品牌Logo输入', e.detail.value)
    this.setData({
      tempLogo: e.detail.value
    })
  },

  setLogoCancel: function () {
    console.log('品牌Logo设置 -> 取消')
    this.setData({
      inputlogo: {
        hidden: true,
        text: ''
      },
      tempLogo: ''
    })
  },

  setLogoConfirm: function () {
    let logo = this.data.tempLogo;
    console.log('品牌Logo设置 -> 确定', logo)
    if (logo != '') {
      sputil.putLogo(logo)
    }
    this.setData({
      inputlogo: {
        hidden: true,
        text: ''
      },
      tempLogo: ''
    })
  },

  setLogo: function () {
    console.info('品牌Logo设置')

    if (!this.isCanUse()) {
      return
    }

    this.setData({
      inputlogo: {
        hidden: false,
        text: sputil.getLogo()
      },
      tempLogo: ''
    })
  },

  pay: function () {
    var that = this;
    //调用微信支付云接口
    dbutil.pay((res) => {
      const payment = res.result.payment;
      //payment.appId = 'wxf707393f43bdaa51';
      console.log('##### payment =', payment);
      wx.requestPayment({
        ...payment,
        success(res) {
          console.log('支付成功', res);
          app.globalData.myuser.is_vip = true;
          sputil.setPaySuccess(true);
          that.setData({
            showJiHuoButton: false
          });
        },
        fail(res) {
          console.log('支付失败', res);
        }
      });
    });
  },

  //部分功能需要限制免费用户的使用次数，该方法检测用户是否可以使用
  isCanUse: function () {
    var that = this
    const myuser = app.globalData.myuser
    console.log('userConsole.js isCanUse()', myuser)

    var isShare = that.isSharedDevice(); //是否是通过扫码添加的设备

    if (!isShare) {
      //非分享设备，非VIP用户只可使用20次
      if (!app.isUserAvailable() && myuser.use_times > 20) {
        console.error('userConsole.js 可免费使用20次，目前已使用次数：' + myuser.use_times)
        wx.showModal({
          content: '免费体验已达到上限！如需继续使用手机控车功能，需付费18元，永久使用。',
          success: (res) => {
            if (res.confirm) {
              that.pay()
            }
          }
        });
        return false
      }
    }
    return true
  },

  //判断当前选中的设备是否是分享来的设备【控制页扫码添加的设备】
  isSharedDevice: function () {
    var isShare = false; //是否是通过扫码添加的设备
    let devices = sputil.getDevices();
    devices.forEach(element => {
      if (sputil.getDeviceMac() == element.mac) {
        isShare = element.openids.indexOf(app.globalData.openid, 0) == -1;
      }
    });
    return isShare;
  },

  test: function () {
    console.log('测试XXX');
  },

})