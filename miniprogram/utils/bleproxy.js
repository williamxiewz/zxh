const gattattrs = require('/GattAttributes.js')
const viewutil = require('/viewutil.js')
const util = require('/util.js')
const sputil = require('/sputil.js')
const bledata = require('/bledata.js')
const log = require('/log.js')

var currentDeviceId = '';

const getCurrentDeviceId = () => {
  return currentDeviceId;
}

const setCurrentDeviceId = (deviceId) => {
  currentDeviceId = deviceId;
}

//关闭手机蓝牙时调用
const removeAllDeviceIds = () => {
  // connectedIdArr.forEach((item, index, arr) => {
  //   disconnect(item);
  // });
  connectedIdArr.length = 0; //清空数组
}

//已连接的设备id
const connectedIdArr = []

const addDeviceId = (deviceId) => {
  if (!isConnected(deviceId)) {
    connectedIdArr.push(deviceId);
    console.info('addDeviceId() - 已连接的设备ID ', connectedIdArr);
  }
}

const isConnected = (str) => {
  for (var i = 0; i < connectedIdArr.length; i++) {
    if (connectedIdArr[i] == str) {
      return true;
    }
  }
  return false;
}

const removeDeviceId = (str) => {
  connectedIdArr.forEach((item, index, arr) => {
    if (item === str) {
      arr.splice(index, 1);
    }
  });
  console.info('removeDeviceId() - 已连接的设备ID ', connectedIdArr)
}

var scanTimerId = -1

const startLeScan = (allowDuplicatesKey = true, timeout = 0) => {
  console.info("开始扫描蓝牙");
  wx.startBluetoothDevicesDiscovery({
    //services: [gattattrs.SERVICE_UUID],
    allowDuplicatesKey: allowDuplicatesKey,
    interval: 3000, //上报设备的间隔。0 表示找到新设备立即上报，其他数值根据传入的间隔上报。
    powerLevel: 'high', //扫描模式，越高扫描越快，也越耗电, 仅安卓 7.0.12 及以上支持。
    success: function (res) {
      console.log("startBluetoothDevicesDiscovery success", res);
    },
    fail: function (res) {
      console.error("startBluetoothDevicesDiscovery fail", res);
    },
  })

  if (timeout > 0) {
    scanTimerId = setTimeout(function () {
      stopLeScan()
    }, timeout)
    console.info('扫描设备 scanTimerId=' + scanTimerId)
  }
}

const stopLeScan = () => {
  if (scanTimerId != -1) {
    clearTimeout(scanTimerId)
    scanTimerId = -1
  }

  wx.stopBluetoothDevicesDiscovery({
    success: function (res) {
      console.log("stopBluetoothDevicesDiscovery success", res);
    },
    fail: function (res) {
      console.error("stopBluetoothDevicesDiscovery fail", res);
    },
  })
}

const sendToConnectedDevices = (value) => {
  connectedIdArr.forEach(deviceId => {
    send(deviceId, value, false)
  });

}

const send = (deviceId, value, showToast = false) => {
  if (sputil.isEncrypt()) {
    bledata.encryptPayload(value, function (res) {
      console.info('send() - 数据加密结果', res)
      let value = util.hex2array(res.result.value)
      writeBLECharacteristic(deviceId, value, showToast)
    })

  } else {
    writeBLECharacteristic(deviceId, value, showToast)
  }
}


const writeBLECharacteristic = (deviceId, value, showToast = false) => {
  wx.writeBLECharacteristicValue({
    deviceId: deviceId,
    serviceId: gattattrs.SERVICE_UUID,
    characteristicId: gattattrs.WRITE_UUID,
    value: value,
    success: function (res) {
      console.info('发送成功' + util.array2hex(value));
      if (showToast) {
        viewutil.toast('发送成功');
      }
    },
    fail: function (res) {
      console.error('发送失败', res);
      if (showToast) {
        viewutil.toast('发送失败');
      }
    }
  })
}

/**
 * 连接设备
 * @param {*} deviceId 
 */
const connect = (deviceId) => {
  if (!deviceId) {
    console.warn('bleproxy.js connect() >>> deviceId无效 ' + deviceId);
    return;
  }
  if (!bluetoothAvailable) {
    console.warn('bleproxy.js connect() >>> 蓝牙没打开，无法连接 ' + deviceId);
    return;
  }
  if (isConnected(deviceId)) {
    console.warn('bleproxy.js connect() >>> 已经连接 ' + deviceId);
    return;
  }
  disconnect(deviceId);
  log.i('>>> 发起连接 ' + deviceId);

  wx.createBLEConnection({
    deviceId: deviceId,
    success: function (res) {
      log.i('>>> createBLEConnection success')
      //必须要获取一次所有服务
      setTimeout(function () {
        log.i('>>> 获取GATT服务 ' + deviceId)
        wx.getBLEDeviceServices({
          deviceId: deviceId,
          success: function (res) {
            log.i('>>> 获得GATT服务 ' + deviceId)
            //必须要获取一次服务下的所有特征，不然iOS不能收发数据
            wx.getBLEDeviceCharacteristics({
              deviceId: deviceId,
              serviceId: gattattrs.SERVICE_UUID,
              success: function (res) {
                log.i('>>> 开启Notify ' + deviceId)

                // 开启设备特征notifiy
                wx.notifyBLECharacteristicValueChange({
                  deviceId: deviceId,
                  serviceId: gattattrs.SERVICE_UUID,
                  characteristicId: gattattrs.NOTIFY_UUID,
                  state: true,
                  success: function (res) {
                    log.i('>>> 开启Notify成功 ' + deviceId)

                    //查询状态
                    send(deviceId, bledata.queryState(), false)
                  },
                  fail: function (res) {
                    console.error(res, 'bleproxy.js 开启notifiy失败 ' + gattattrs.NOTIFY_UUID);
                  }
                })
              },
              fail: function (res) {
                console.error('bleproxy.js 获取服务下的特征失败', res);
              }
            })
          },
          fail: (err) => {
            console.error('bleproxy.js 获取服务失败', err)
          }
        })
      }, 600)
    },
    fail: function (res) {
      switch (res.errCode) {
        case -1: //已连接，不打印
          break;

        case 10003: //连接失败，不打印
        default:
          //console.error('连接失败', res)
          break;
      }
    }
  })
}


//断开连接
const disconnect = deviceId => {
  wx.closeBLEConnection({
    deviceId: deviceId,
    success: function (res) {
      console.info('closeBLEConnection success', res)
    },
    fail: function (res) {
      console.error('closeBLEConnection fail', res)
    },
  });
}


var bluetoothAvailable = false; //状态未变的情况下Android手机会一直回调onBluetoothAdapterStateChange，代码自己记录一下状态

const isBluetoothAvailable = () => {
  return bluetoothAvailable
}

const setBluetoothAvailable = (available) => {
  bluetoothAvailable = available
}

//蓝牙未开启时的提示框
const showModal = (cancelable = false) => {
  console.log('xxxxxxxxxxxxxx isBluetoothAvailable=' + isBluetoothAvailable)
  wx.showModal({
    title: '提示',
    content: '蓝牙未开启，请先开启蓝牙后重新进入小程序',
    confirmText: '好的',
    showCancel: false,
    success: (res) => {
      console.log('xxxxxxxxxxxxxx isBluetoothAvailable=' + isBluetoothAvailable, res)
      if (res.confirm) {
        if (!cancelable && !isBluetoothAvailable) {
          showModal()
        }
      }
    }
  })
}


//初始化蓝牙
const initBluetooth = () => {
  console.log('bleproxy.js initBluetooth()')

  wx.getSystemInfo({
    success: (result) => {
      console.info("initBluetooth() - 系统信息 ", result)
      //////////////////////////////////////
      const platform = result.platform
      const locationEnabled = result.locationEnabled
      const locationAuthorized = result.locationAuthorized
      wx.openBluetoothAdapter({
        mode: 'central',
        success: (res) => {
          console.log('openBluetoothAdapter success', res)

          //获取适配器状态
          wx.getBluetoothAdapterState({
            success: (result) => {
              console.log('getBluetoothAdapterState success', result)
              setBluetoothAvailable(result.available)

              if (result.available) {
                //蓝牙可用，开启扫描
                if (locationEnabled) {
                  if(locationAuthorized) {
                    startLeScan(true)
                  } else {
                    wx.showModal({
                      title: '提示',
                      content: '扫描蓝牙设备需要微信获得定位权限，建议您在系统设置里允许微信使用位置信息后重新进入小程序',
                      confirmText: '好的',
                      showCancel: false
                    })
                  }
                } else {
                  wx.showModal({
                    title: '提示',
                    content: '扫描蓝牙设备需要打开手机的位置服务，建议您打开位置开关后重新进入小程序',
                    confirmText: '好的',
                    showCancel: false
                  })
                }
              } else {
                showModal()
              }
            },
            fail: (err) => {
              console.error('getBluetoothAdapterState fail', err)
            }
          })
        },
        fail: (err) => {
          console.error('openBluetoothAdapter fail', err)
          if (platform == 'android') {
            //10001	当前蓝牙适配器不可用
            if (err.errCode == 10001) {
              showModal()
            }
          }

          if (platform == 'ios') {
            /*  0	未知
                1	重置中
                2	不支持
                3	未授权
                4	未开启 */

            if (err.state == 3) {
              wx.showModal({
                title: '提示',
                content: '您尚未授权微信使用手机蓝牙，您可以在系统设置中进行授权',
                confirmText: '好的',
                showCancel: false
              })
            }
            if (err.state == 4) {
              setBluetoothAvailable(false)
              showModal()
            }
          }
        }
      })

      //////////////////////////////////////
    },
  })

}



const close = () => {
  stopLeScan();
  wx.closeBluetoothAdapter({
    success: function (res) {
      console.info("closeBluetoothAdapter success ", res);
    },
    fail: function (res) {
      console.error('closeBluetoothAdapter fail ', res)
    }
  })
}

module.exports = {
  isBluetoothAvailable: isBluetoothAvailable,
  setBluetoothAvailable: setBluetoothAvailable,
  initBluetooth: initBluetooth,
  startLeScan: startLeScan,
  stopLeScan: stopLeScan,
  connect: connect,
  send: send,
  sendToConnectedDevices: sendToConnectedDevices,
  disconnect: disconnect,
  addDeviceId: addDeviceId,
  removeDeviceId: removeDeviceId,
  isConnected: isConnected,
  close: close,
  showModal: showModal,
  writeBLECharacteristic: writeBLECharacteristic,
  setCurrentDeviceId: setCurrentDeviceId,
  getCurrentDeviceId: getCurrentDeviceId,
  removeAllDeviceIds: removeAllDeviceIds
}