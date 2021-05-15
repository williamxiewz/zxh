const bleproxy = require('./utils/bleproxy')
//app.js
const onfire = require('/utils/onfire.js')
const sputil = require('/utils/sputil.js')
const dbutil = require('/utils/dbutil.js')
const util = require('/utils/util.js')
const log = require('/utils/log.js')
const bledata = require('/utils/bledata.js')

//从厂商数据获取的设备类型，加号(+)代表设备处于可配对状态
const DEVICE_TYPES = [
  '_BA01', '+BA01',
  '_BA02', '+BA02'
]

App({
  onLaunch: function () {

    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力')
    } else {
      wx.cloud.init({
        // env 参数说明：
        //   env 参数决定接下来小程序发起的云开发调用（wx.cloud.xxx）会默认请求到哪个云环境的资源
        //   此处请填入环境 ID, 环境 ID 可打开云控制台查看
        //   如不填则使用默认环境（第一个创建的环境）
        env: 'zxh-9g5pei38c7cdc56d',
        traceUser: true,
      })
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

        if (mfrHead == 'ZXH' && DEVICE_TYPES.indexOf(deviceType, 0) != -1) {
          //成对存储 deviceId 与 MAC
          sputil.putDeviceIdAndMac(device.deviceId, mac)

          const devices = sputil.getDevices()
          var contains = false
          if (typeof (devices) == 'object') {
            devices.forEach(element => {
              if (element.mac == mac) {
                contains = true
              }
            })
          }
          if (contains) {
            //console.info('扫描到已添加的设备', mac)
            if (!bleproxy.isConnected(device.deviceId)) {
              bleproxy.connect(device.deviceId)
            }
          } else {

            let myDevice = {
              name: device.localName,
              deviceId: device.deviceId,
              mac: mac,
              type: deviceType,
              version: version
            }
            //console.info('myDevice', myDevice)
            onfire.fire('onBluetoothDeviceFound_userConsole', myDevice)
          }

        }
      }
    })

    //监听网络状态
    wx.onNetworkStatusChange((result) => {
      console.log('网络状态变化', result)
      this.globalData.isNetworkOn = result.isConnected
    })

  },

  onShow: function () {
    var that = this
    //bleproxy.startLeScan(true)
    that.getOpenid()
    bleproxy.initBluetooth()
    dbutil.getUser(function (res) {
      console.log('getUser', res)
      that.globalData.myuser = res.result
    })
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
    })

    onfire.fire('onAppHide_index', {
      hidden: false
    })
    this.globalData.appHidden = false
  },

  onHide: function () {
    bleproxy.stopLeScan()
    this.globalData.appHidden = true
    onfire.fire('onAppHide_index', {
      hidden: true
    })
  },


  getOpenid: function () {
    var that = this
    // 调用云函数
    wx.cloud.callFunction({
      name: 'login',
      data: {},
      success: res => {
        that.globalData.openid = res.result.openid
        console.log('app.js 获得openid:', that.globalData.openid)
      },
      fail: err => {
        console.error('[云函数] [login] 调用失败', err)
      }
    })
  },

  globalData: {
    openid: '',
    myuser: {},
    isNetworkOn: true,
    appHidden: true
  }
})