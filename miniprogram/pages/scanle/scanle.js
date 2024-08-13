const util = require('../../utils/util.js')
const sputil = require('../../utils/sputil.js')
const viewutil = require('../../utils/viewutil.js')
const log = require('../../utils/log.js')

Page({
  data: {
    list: [],
  },
  onPullDownRefresh: function () {
    console.log("onPullDownRefresh")

    this.setData({
      list: [] //清空数组
    });

    setTimeout(function () {
      wx.stopBluetoothDevicesDiscovery({
        success: function (res) {
          console.log("stopBluetoothDevicesDiscovery success")
        },
      })
      wx.stopPullDownRefresh()
    }, 3000)

    wx.startBluetoothDevicesDiscovery({
      allowDuplicatesKey: true,
      success: function (res) {
        console.log("startBluetoothDevicesDiscovery success");
      },
      fail: function (res) {
        console.error("startBluetoothDevicesDiscovery fail", res);
      }
    })
  },
  onItemClick: function (tapInfo) {
    var dataset = tapInfo.currentTarget.dataset
    console.log("onItemClick");
    console.log(tapInfo);
    console.log(dataset.name);
    console.log(dataset.deviceid);

    //存储deviceid
    sputil.putDeviceId(dataset.deviceid)
    wx.navigateBack()
  },
  onLoad: function () {
    var that = this;

    //添加扫描设备的监听
    wx.onBluetoothDeviceFound(function (devices) {
      //console.log('onBluetoothDeviceFound')
      /*
      name	                String	    蓝牙设备名称，某些设备可能没有
      deviceId	            String	    用于区分设备的 id
      RSSI	                Number	    当前蓝牙设备的信号强度
      advertisData	        ArrayBuffer	当前蓝牙设备的广播数据段中的ManufacturerData数据段 （注意：vConsole 无法打印出 ArrayBuffer 类型数据）
      advertisServiceUUIDs	Array	      当前蓝牙设备的广播数据段中的ServiceUUIDs数据段
      localName	            String	    当前蓝牙设备的广播数据段中的LocalName数据段
      serviceData	          ArrayBuffer	当前蓝牙设备的广播数据段中的ServiceData数据段
      */

      var list = []
      for (var i = 0; i < devices.devices.length; i++) {
        var device = devices.devices[i]
        var contains = false //防止设备重复
        for (var j = 0; j < that.data.list.length; j++) {
          if (device.deviceId == that.data.list[j].deviceId) {
            that.data.list[j].rssi = device.RSSI
            contains = true
            break
          }
        }

        if (!contains) {
          var name;
          if (device.localName == "") {
            name = 'Unknown Device';
          } else {
            name = device.localName;
          }

          var mfr = util.array2Str(device.advertisData)

          console.info('##############', mfr)

          if (mfr.substring(0, 8) == 'ZXH_BA01') {
            var myDevice = {
              name: name,
              deviceId: device.deviceId,
              rssi: device.RSSI,
              advertisData: mfr,
              uuid: device.advertisServiceUUIDs[0],
              rssi_iamge: viewutil.getIamgeByRssi(device.RSSI)
            };
            list.push(myDevice);
          }
          //  else {
          //   var myDevice = {
          //     name: name,
          //     deviceId: device.deviceId,
          //     rssi: device.RSSI,
          //     advertisData: util.array2hex(device.advertisData),
          //     uuid: device.advertisServiceUUIDs[0],
          //     rssi_iamge: viewutil.getIamgeByRssi(device.RSSI)
          //   };
          //   list.push(myDevice);
          // }

        }
      }

      that.setData({
        list: that.data.list.concat(list) //这里list.concat(list)相当于java中list.addAll()
      });
      //console.log(that.data.list)
    });

    wx.getSystemInfo({
      success: function (res) {
        let h = res.windowHeight
        that.setData({
          scrollheight: h * 1.0
        })
      },
    });

    wx.startPullDownRefresh({
      success: (res) => {
        log.i('startPullDownRefresh success');
      },
      fail: (res) => {
        console.error('startPullDownRefresh fail', res);
      },
      complete: (res) => { },
    });
  },
  onShow: function () {
    wx.getBluetoothAdapterState({
      success: function (res) {
        console.info(res)
        if (!res.available) {
          console.error('蓝牙未开启')
          wx.showModal({
            title: '提示',
            content: '手机蓝牙未打开',
            showCancel: false,
          })
        }
      },
    })
  },
  onHide: function () {
    console.warn("index page onHide")
    wx.stopBluetoothDevicesDiscovery({
      success: function (res) {
        console.log("stopBluetoothDevicesDiscovery success")
        console.log(res)
      },
      fail: function (res) {
        console.error("stopBluetoothDevicesDiscovery fail", res);
      }
    });
  },
  onUnload: function () {
    console.log("index page onUnload");
  },
})