const bleproxy = require('./utils/bleproxy')
//app.js
const onfire = require('/utils/onfire.js')
const sputil = require('/utils/sputil.js')
const dbutil = require('/utils/dbutil.js')
const util = require('/utils/util.js')
const log = require('/utils/log.js')
const bledata = require('/utils/bledata.js')
const httputil = require('/utils/httputil.js')

//从厂商数据获取的设备类型，加号(+)代表设备处于可配对状态
// const DEVICE_TYPES = [
//   '_BA01', '+BA01',
//   '_BA02', '+BA02',
//   '_BA03', '+BA03',
//   '_BA07', '+BA07',
//   '_BA08', '+BA08',
//   '_BA09', '+BA09'
// ]
//正则表达式匹配设备类型
const TYPE_PATTERN = /^[_+]BA[A-F\d][\d]$/;

App({
  onLaunch: function () {
    console.log('dbutil.xxx =', dbutil.xxx);
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力')
    } else {
      wx.cloud.init({
        // env 参数说明：
        //   env 参数决定接下来小程序发起的云开发调用（wx.cloud.xxx）会默认请求到哪个云环境的资源
        //   此处请填入环境 ID, 环境 ID 可打开云控制台查看
        //   如不填则使用默认环境（第一个创建的环境）
        //env: 'cloud1-9gulotdwa1a40a52',
        env: 'zxh-9g5pei38c7cdc56d',
        traceUser: true,
      });
    }

    this.globalData = {}

    //监听蓝牙状态
    wx.onBluetoothAdapterStateChange((result) => {
      console.log('onBluetoothAdapterStateChange - 蓝牙状态发生变化', result)

      if (!bleproxy.isBluetoothAvailable() && result.available) {
        bleproxy.startLeScan()
      }
      bleproxy.setBluetoothAvailable(result.available)
      console.log('bleproxy.isBluetoothAvailable=' + bleproxy.isBluetoothAvailable())

      onfire.fire('onBluetoothAdapterStateChange_index', result)
    })

    //监听设备的连接状态
    wx.onBLEConnectionStateChange((result) => {
      onfire.fire('onBLEConnectionStateChange_index', result)
      onfire.fire('onBLEConnectionStateChange_userConsole', result)
      if (result.connected) {
        log.i('已连接设备 ' + result.deviceId)
        bleproxy.addDeviceId(result.deviceId)
      } else {
        console.error('连接断开', result.deviceId)
        bleproxy.removeDeviceId(result.deviceId)
      }
    })
    //监听模块发来的数据
    wx.onBLECharacteristicValueChange((result) => {
      onfire.fire('onBLECharacteristicValueChange_index', result)
      onfire.fire('onBLECharacteristicValueChange_userConsole', result)
    })
    //监听设备扫描
    wx.onBluetoothDeviceFound((result) => {
      //console.info('##############', result.devices.length)
      for (var i = 0; i < result.devices.length; i++) {
        var device = result.devices[i]
        if (typeof (device.advertisData) == 'undefined' || device.advertisData.byteLength != 17) {
          continue
        }
        //console.log('advertisData.byteLength=' + device.advertisData.byteLength, device.advertisData)
        var mfrHead = util.arrayBufferToString(device.advertisData.slice(0, 3))
        var mac = util.array2hex(device.advertisData.slice(3, 9), false)
        var deviceType = util.arrayBufferToString(device.advertisData.slice(9, 14))
        var version = util.arrayBufferToString(device.advertisData.slice(14, 17))

        //console.info('### BLE Manufacturer Data:', mfrHead + ' ' + mac + ' ' + deviceType + version)

        //  || mfrHead == 'ZXH' XDZ
        if ((mfrHead == 'XDZ' || mfrHead == 'ZXH') && TYPE_PATTERN.test(deviceType)) {
          let num = parseInt(deviceType.substring(3, 5), 16);
          if(num == 5 || num == 6 || num == 0xA5 || num == 0xA6) continue;
          //成对存储 deviceId 与 MAC
          sputil.putDeviceIdAndMac(device.deviceId, mac);
          sputil.putDeviceType(device.deviceId, deviceType);

          const devices = sputil.getDevices();
          var contains = false;
          if (typeof (devices) == 'object') {
            devices.forEach(element => {
              if (element.mac == mac) {
                contains = true;
              }
            });
          }
          if (contains) {
            //console.info('扫描到已添加的设备', mac)
            if (!bleproxy.isConnected(device.deviceId)) {
              //第一款产品通过扫描连接
              if (deviceType == '+BA01' || deviceType == '_BA01') {
                bleproxy.connect(device.deviceId); //2021-8-1
              }
            }
          } else {

            let myDevice = {
              name: device.localName,
              deviceId: device.deviceId,
              mac: mac,
              type: deviceType,
              version: version
            };
            //console.info('myDevice', myDevice);
            onfire.fire('onBluetoothDeviceFound_userConsole', myDevice);
          }

        }
      }
    })

    //监听网络状态
    wx.onNetworkStatusChange((result) => {
      console.log('网络状态变化', result);
      this.globalData.isNetworkOn = result.isConnected;
    });

    wx.getSystemInfo({
      success: (result) => {
        this.globalData.platform = result.platform;
        console.info('app.globalData', this.globalData);
      },
    });
  },

  onShow: async function () {
    var that = this;
    // wx.setKeepScreenOn({
    //   keepScreenOn: true,
    //    fail() {//如果失败 再进行调用
    //      wx.setKeepScreenOn({
    //          keepScreenOn: true
    //      });
    //    }
    // });
    
    //bleproxy.startLeScan(true)
    console.log('app.js onShow() - getUser()');
    if(!dbutil.isInit()) {
      await dbutil.initCloud();
      bledata.encryptPayload(bledata.queryState(), function(res){ 
        console.info('app.js onShow() - 查询状态的数据加密结果', res); 
        that.globalData.queryValue = util.hex2array(res.result.value); 
      });
    }
    //
    console.log('dbutil.getCloud() =', dbutil.getCloud());
    await dbutil.getUser(function (res) {
      console.log('getUser', res);
      that.globalData.myuser = res.result;
      sputil.setPaySuccess(res.result.is_vip);
    });
    that.getOpenid();
    //bleproxy.initBluetooth();
    this.checkBluetoothPermission();
    //获取网络状态
    wx.getNetworkType({
      success: (result) => {
        console.log('获取网络状态: ' + result.networkType)
        if (result.networkType == 'none') {
          that.globalData.isNetworkOn = false
        } else {
          that.globalData.isNetworkOn = true
        }
      },
    });

    onfire.fire('onAppHide_index', {
      hidden: false
    })
    this.globalData.appHidden = false;
  },

  checkBluetoothPermission() {
    /*逻辑大概是：通过 wx.getSetting 获取 scope.bluetooth 是否为 true
      如果 wx.getSetting 里没有 scope.bluetooth ，则要用 wx.authorize({ scope: "scope.bluetooth" }) 去弹窗要求用户授权
      如果 wx.getSetting 里有 scope.bluetooth 并且为 false，则要用 wx.openSetting 引导用户手动开启授权开关。*/
    wx.getSetting({
      withSubscriptions: true,
      success(res) {
        console.log('系统设置', res.authSetting);
        if (!res.authSetting || !res.authSetting.hasOwnProperty('scope.bluetooth')) {
          //弹窗提示
          wx.authorize({
            scope: "scope.bluetooth",
            success() {
              //用户允许使用蓝牙
              bleproxy.initBluetooth();
            }
          });
        } else if (res.authSetting['scope.bluetooth']) {
          console.info('用户已经允许使用蓝牙');
          bleproxy.initBluetooth();
        } else {
          console.error('用户不允许使用蓝牙');
          wx.showModal({
            content: '连接设备需要使用蓝牙',
            confirmText: '去授权',
            success(res2) {
              if (res2.confirm) {
                //用户点击了“去授权”
                wx.openSetting({
                  withSubscriptions: true,
                });
              }
            }
          });
        }
      }
    });
  },

  onHide: function () {
    bleproxy.stopLeScan()
    this.globalData.appHidden = true
    onfire.fire('onAppHide_index', {
      hidden: true
    })
  },


  getOpenid: async function () {
    var that = this
    // 调用云函数
    dbutil.getOpenid((res) => {
      that.globalData.openid = res.result.openid
      console.log('app.js 获得openid:', that.globalData.openid)
      httputil.checkUser({
        openid: res.result.openid,
        success: (res2) => {
          console.info('查询是否激活', res2);
          if (res2.data.code == 0) {
            if (res2.data.data.length > 0) {
              if (res2.data.data[0].open_id == res.result.openid) {
                console.info('账号已激活');
                that.globalData.isActivated = true;
              }
            }
          } else {
            that.globalData.isActivated = false;
          }
        },
        fail: (err2) => {
          console.error('查询是否激活', err2);
        }
      });
    });
  },


  isUserAvailable() {
    const device = sputil.getSelectedDevice();
    if(device == null) return true;

    if (this.isFreeDevice(device)) {
      return true; //免费类型设备
    }

    let b = sputil.isPaySuccess();
    if (b) {
      return true;
    }
    //已经付费或者已经绑定激活码，视为激活用户，使用不受限制
    if (this.globalData.myuser) {
      var isVip = this.globalData.myuser.hasOwnProperty('is_vip') && this.globalData.myuser.is_vip;
      return isVip || this.globalData.isActivated;
    }
    return false;
  },

  //免费型号
  isFreeDevice(device) {
    console.info('isFreeDevice() - device =', device);
    if(device.type == '') return true;
    let num = util.deviceTypeNum(device.type);
    // if(num == 4) {
    //   return false;// BA04 是付费版本，带感应功能
    // }
    return num >= 7;
  },

  globalData: {
    openid: '',
    myuser: {},
    isNetworkOn: true,
    appHidden: true,
    isActivated: false //账号是否已通过激活码激活
  }
})