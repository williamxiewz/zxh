//index.js
const app = getApp()

const sputil = require('../../utils/sputil.js')
const bleproxy = require('../../utils/bleproxy.js')
const bledata = require('../../utils/bledata.js')
const util = require('../../utils/util.js')
const viewutil = require('../../utils/viewutil.js')
const onfire = require('../../utils/onfire.js')
const dbutil = require('../../utils/dbutil.js')
const zxh = require('../../utils/zxh.js')

const IMAGE_ARRAY = [
  '../../images/btn_start_normal.png',
  '../../images/btn_lt_normal.png',
  '../../images/btn_rt_normal.png',
  '../../images/btn_lb_normal.png',
  '../../images/btn_rb_normal.png',
  '../../images/btn_start_pressed.png',
  '../../images/btn_lt_pressed.png',
  '../../images/btn_rt_pressed.png',
  '../../images/btn_lb_pressed.png',
  '../../images/btn_rb_pressed.png'
]

const MP3_ID_ARRAY = [
  'cloud://zxh-9g5pei38c7cdc56d.7a78-zxh-9g5pei38c7cdc56d-1304902263/audios/panic.mp3', //START
  'cloud://zxh-9g5pei38c7cdc56d.7a78-zxh-9g5pei38c7cdc56d-1304902263/audios/bi_lock.mp3', //上锁
  'cloud://zxh-9g5pei38c7cdc56d.7a78-zxh-9g5pei38c7cdc56d-1304902263/audios/bibi_unlock.mp3', //撤防
  'cloud://zxh-9g5pei38c7cdc56d.7a78-zxh-9g5pei38c7cdc56d-1304902263/audios/alarmhorn.mp3', //报警
  'cloud://zxh-9g5pei38c7cdc56d.7a78-zxh-9g5pei38c7cdc56d-1304902263/audios/error.mp3' //error
]

Page({
  data: {
    deviceState: -1, //设备状态
    bluetoothAvailable: false,
    connected: false, //是否已连接设备
    bottomLayoutMatginTop: 200, //rpx
    bottomLayoutWidth: 90, //百分比
    startButtonWidth: 33, //百分比
    topSpace: 48, //rpx
    imageOfState: '../../images/ic_lock_blue.png',
    imageOfStartBtn: '../../images/btn_start_normal.png',
    imageOfLtBtn: '../../images/btn_lt_normal.png',
    imageOfRtBtn: '../../images/btn_rt_normal.png',
    imageOfLbBtn: '../../images/btn_lb_normal.png',
    imageOfRbBtn: '../../images/btn_rb_normal.png',
    RSSI_Image: '../../images/ic_rssi_x.png',
    timerId: -1,
    alarmPlayer: null, //报警播放context
    timerCount: 0, //计数器
    isCall: true, //true是寻车， false是开座包
  },

  //扫码添加设备
  scanCode: function () {
    console.log("扫码");
    const count = sputil.getDeviceCount()
    if (count == 3) {
      viewutil.toast('设备已添加满，请删除设备后再次添加')
      return
    }

    var that = this;
    wx.scanCode({
      onlyFromCamera: false,
      scanType: ['qrCode'],
      success: res => {
        console.info('扫码结果', res.result);
        let text = util.arrayBufferToString(wx.base64ToArrayBuffer(res.result));
        console.info('借车码', text);

        dbutil.addDeviceByQRCode(text, app.globalData.platform, function (res2) {
          console.log('扫码添加设备', res2)
          viewutil.toast(res2.result.msg)
          if (res2.result.code == 0) {
            //onfire.fire('userConsole_update_devices', res2.result.device);
            that.getDevicesFromCloud();
          }
        });
      }
    });
  },

  getDevicesFromCloud() {
    dbutil.getDevices(res => {
      console.info('index.js 云端设备：', res);
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
      devices.forEach(element => {
        console.log(element)
        let tempMac = element.mac
        let tempDeviceId = sputil.getDeviceIdByMac(tempMac)
        element.connected = bleproxy.isConnected(tempDeviceId)
        if (tempMac != '' && tempMac == sputil.getDeviceMac()) {
          mac = tempMac
          deviceId = tempDeviceId
        }
      })

      //默认选中第一个
      if (mac == '' || deviceId == '') {
        if (devices[0].mac != '') {
          mac = devices[0].mac;
          deviceId = devices[0].deviceId;
          if (!deviceId) {
            deviceId = util.mac2DeviceId(mac); //仅限android系统
          }
        }
      }
      sputil.putDeviceMac(mac);
      sputil.putDeviceId(deviceId);
      bleproxy.setCurrentDeviceId(deviceId);
      sputil.putDevices(devices);
      /////
    });
    //////
  },

  readDeviceState(deviceId) {
    if (app.globalData.queryValue) {
      bleproxy.writeBLECharacteristic(deviceId, app.globalData.queryValue);
    }
  },

  //开启定时器读取RSSI，发送心跳包
  startTimer: function () {
    var that = this;

    clearInterval(that.data.timerId);


    let deviceId = bleproxy.getCurrentDeviceId();

    //定时器启动前先发一包心跳包数据
    if (app.globalData.isNetworkOn) {
      this.readDeviceState(deviceId);
      bleproxy.connect(sputil.getDeviceId());
    }

    console.log('启动定时器');

    var timerId = setInterval(function () {
      //定时获取RSSI
      // wx.getBLEDeviceRSSI({
      //   deviceId: sputil.getDeviceId(),
      //   success: (result) => {
      //     //console.info('getBLEDeviceRSSI success', result)
      //     var RSSI_Image = viewutil.getIamgeByRssi(result.RSSI)
      //     that.setData({
      //       RSSI_Image: RSSI_Image
      //     });
      //   }
      // });

      let count = that.data.timerCount + 1
      that.setData({
        timerCount: count
      });
      if ((count % 2) == 0) {
        //每10秒查询一次状态作为心跳包
        console.info('######### deviceId = ' + deviceId)
        that.readDeviceState(deviceId);
      }

      //todo 2021-7-29 带感应功能【HID配对】的产品，配对后没广播，通过 deviceId 去连接
      const devices = sputil.getDevices();
      console.log('typeof(sputil.getDevices())=' + typeof (devices));
      if (typeof (devices) == 'object') {
        devices.forEach(element => {
          if (element.type != '+BA01' && element.mac) {
            console.log('定时器通过 deviceId 连接', element);
            if (element.deviceId) {
              bleproxy.connect(element.deviceId);
            } else {
              let macstd = util.mac2DeviceId(element.mac);
              if (!macstd) {
                macstd = sputil.getDeviceIdByMac(element.mac);
              }
              // sputil.putDeviceIdAndMac(macstd, element.mac);
              bleproxy.connect(macstd);
            }
          }
        });
      }

    }, 5000);
    that.setData({
      timerId: timerId
    });
  },


  onLoad: function () {
    var that = this;

    wx.getBluetoothAdapterState({
      success: (result) => {
        that.setData({
          bluetoothAvailable: result.available
        })
      }
    })
    //监听APP退后台
    onfire.on('onAppHide_index', function (res) {
      if (res.hidden) {
        that.stopAlarm()
      } else {
        that.startTimer();
      }

    })
    //监听蓝牙状态
    onfire.on('onBluetoothAdapterStateChange_index', function (result) {
      if (result.available) {
        that.setData({
          bluetoothAvailable: true
        });
      } else {
        //停止报警
        that.stopAlarm();
        that.setData({
          bluetoothAvailable: false,
          connected: false,
        });
      }
    })

    // 监听设备的连接状态
    onfire.on('onBLEConnectionStateChange_index', function (res) {
      let mac = sputil.getMacByDeviceId(res.deviceId)
      //自动选中最新连接的设备
      if (res.connected) {
        sputil.putDeviceMac(mac)
        sputil.putDeviceId(res.deviceId)
        bleproxy.setCurrentDeviceId(res.deviceId);
        that.startTimer()
      } else {
        //设备断线
        if (sputil.getDeviceId() == res.deviceId) {
          //停止报警
          that.stopAlarm()
        }
      }

      let curMac = sputil.getDeviceMac()
      //只处理当前选中的设备
      if (curMac == '' || curMac == mac) {
        if (that.data.connected == res.connected) return
        that.setData({
          connected: res.connected
        })
        if (res.connected) {
          that.setData({
            RSSI_Image: '../../images/ic_rssi_4.png'
          })
        } else {
          //连接断开
          that.setData({
            RSSI_Image: '../../images/ic_rssi_x.png'
          })
        }
      }
    })

    //监听模块端发来的数据
    onfire.on('onBLECharacteristicValueChange_index', function (res) {
      //未选中的设备的数据，不处理
      if (bleproxy.getCurrentDeviceId() != res.deviceId) return

      if (sputil.isEncrypt()) {
        bledata.decryptPayload(res.value, function (res2) {
          let buffer = util.hex2array(res2.result.value)
          that.handleRxData(buffer)
        })
      } else {
        that.handleRxData(res.value)
      }
    })
  },


  //处理接收到的数据
  handleRxData: function (buffer) {
    var that = this
    let value = new Uint8Array(buffer);
    if (value.length >= 12) {
      var state = value[11]

      if (state < 0 && state > 7) {
        return
      }

      console.error('state=' + state);

      if (that.data.deviceState != state) {
        that.setData({
          deviceState: state
        });
      }

      if (state != 6) {
        that.stopAlarm()
      }
      if (state == 6) {
        //6-报警循环播放
        //that.playSound(3, true)//todo
        that.playBackgroundAudio()
        that.flash2()
      } else if (state == 5) {
        //5-预报警指播一次
        that.playSound(3, false)
        that.flash(0)
      }

      switch (state) {
        case 0: //初始
        case 1: //撤防
        case 7: //匹配
          this.setImage(2, '', true); //解锁
          break;

        case 3: //设防
        case 4: //预警
        case 5: //检测
        case 6: //报警
          //设防状态
          that.setImage(1, '', true);
          break;

        case 2: //启动
          that.setData({
            imageOfState: '../../images/ic_start_red.png'
          });
          break;
      }
    }
  },

  onUnload: function () {
    onfire.un('onBLEConnectionStateChange_index')
    onfire.un('onBLECharacteristicValueChange_index')
    onfire.un('onBluetoothAdapterStateChange_index')
    onfire.un('onAppHide_index')
  },

  testConnectionState: function (e) {
    let isChecked = e.detail.value;
    console.log('testConnectionState() - isChecked =', isChecked);
    this.setData({
      connected: isChecked
    });
  },

  onShow: function () {
    var that = this
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({
        selected: 0,
        bg_path: '/images/tab_ctrl.png'
      });
    }
    let selectedDevice = sputil.getSelectedDevice();
    let deviceId = sputil.getDeviceId();
    if (selectedDevice) {
      deviceId = selectedDevice.deviceId;
      if (!deviceId) {
        deviceId = util.mac2DeviceId(selectedDevice.mac);
      }
    }
    const isConnected = bleproxy.isConnected(deviceId);
    that.startTimer();

    console.error('index.js onShow() - deviceId=' + deviceId);

    that.setData({
      connected: isConnected,
      isCall: util.isCall(selectedDevice)
    });
    //寻车/开座包
    this.setImage(3, this.data.imageOfLbBtn, true);

    wx.getSystemInfo({
      success: (result) => {
        //console.log(result)
        var sc = result.windowHeight / result.windowWidth
        if (sc > 16 / 9) {
          //宽高比大于16/9
          that.setData({
            topSpace: 48,
            bottomLayoutMatginTop: 200,
            bottomLayoutWidth: 96,
            startButtonWidth: 32
          })
        } else {
          that.setData({
            topSpace: 0,
            bottomLayoutMatginTop: 110,
            bottomLayoutWidth: 80,
            startButtonWidth: 26
          })
        }
      },
      fail: (err) => {
        console.error(err)
      }
    })
  },

  sendPayload: function (cmdCode) {
    if (!app.globalData.isNetworkOn) {
      viewutil.toast('网络已断开');
      return;
    }

    var that = this;
    const deviceType = sputil.getDeviceType();
    if (deviceType == '+BA01' || deviceType == '') {
      //第一代产品限制使用次数
      const myuser = app.globalData.myuser;
      console.log('index.js sendPayload()', myuser);

      var isShare = false; //是否是通过扫码添加的设备
      let devices = sputil.getDevices();

      if (!devices) return;

      devices.forEach(element => {
        if (sputil.getDeviceMac() == element.mac) {
          if (element.openids) {
            isShare = element.openids.indexOf(app.globalData.openid, 0) == -1;
          }
        }
      });

      if (!isShare) {
        //非分享设备，非VIP用户只可使用20次
        if (!app.isUserAvailable() && myuser.use_times > 20) {
          console.error('可免费使用20次，目前已使用次数：' + myuser.use_times);
          wx.showModal({
            content: '免费体验已达到上限！如需继续使用手机控车功能，需付费18元，永久使用。',
            success: (res) => {
              if (res.confirm) {
                that.pay(1800);
              }
            }
          });
          return;
        }
      }
    }

    let deviceId = sputil.getDeviceId();
    if (!deviceId) {
      deviceId = bleproxy.getCurrentDeviceId();
    }
    if (bleproxy.isConnected(deviceId)) {
      app.globalData.myuser.use_times++;
      let useTimes = app.globalData.myuser.use_times;
      console.log('index.js sendPayload() - use_times=' + useTimes);
      dbutil.updateUserUseTimes(useTimes, function (res2) {
        console.log('更新用户使用次数 ' + useTimes, res2);
      });
    }

    if (deviceId != '') {
      var arr = new Uint8Array(util.hex2array(sputil.getSensitivity()));
      let sensitivity = arr[0];
      let limitSpeed = arr[1] == 1;
      let volume = arr[2];
      if (sputil.getDeviceType() == '+BA02') {
        //最后一个感应参数0就是为了使第七个字节变为2
        bleproxy.send(deviceId, bledata.mkData(cmdCode, sensitivity, limitSpeed, volume, 4, 0));
      } else {
        bleproxy.send(deviceId, bledata.mkData(cmdCode, sensitivity, limitSpeed, volume, 4));
      }
    }
  },


  onTouchStart: function (e) {
    //console.log("TouchStart", e)
    let index = parseInt(e.currentTarget.dataset.btnindex)
    //console.log("TouchStart", index)
    //console.log("typeof index: " + typeof (index) + ", index=" + index)
    this.setImage(index, IMAGE_ARRAY[index + 5])
  },

  onTouchEnd: function (e) {
    //console.log("TouchEnd", e)
    var that = this

    let index = parseInt(e.currentTarget.dataset.btnindex)
    console.log(`TouchEnd() - index=${index}, deviceState=${this.data.deviceState}`);
    that.setImage(index, IMAGE_ARRAY[index], true);
    if (index == 0 && this.data.deviceState == 2) {
      index = 2; //在启动状态下点击启动，发解锁指令
    }

    if (index == 0) {
      //启动
      this.data.deviceState = 2; //TODO
      console.info("启动");
      that.sendPayload(bledata.CMD_START);
    } else if (index == 1) {
      //上锁
      console.info("上锁");
      that.sendPayload(bledata.CMD_LOCK)
      that.flash(0)
      that.playSound(1)
    } else if (index == 2) {
      //解锁
      console.info("解锁");
      that.sendPayload(bledata.CMD_UNLOCK)
      that.flash(0)
      that.playSound(2)
    } else if (index == 3) {
      //寻车
      console.info("寻车");
      that.sendPayload(bledata.CMD_CALL)
    } else if (index == 4) {
      //静音
      console.info("静音");
      that.sendPayload(bledata.CMD_MUTE)
    }
  },

  //播放报警音
  playBackgroundAudio: function () {
    var that = this
    let audioManager = wx.getBackgroundAudioManager()
    audioManager.src = MP3_ID_ARRAY[3]
    audioManager.title = '众鑫汇智控'
    audioManager.play()
    audioManager.onEnded(function () {
      //console.info('播放结束，继续播放')
      //仅前台报警
      if (that.data.deviceState == 6 && !app.globalData.appHidden) {
        that.playBackgroundAudio()
      }
    })
  },

  test(e) {
    console.log('test()')
  },

  playSound: function (mp3IdIndex, loop = false) {
    // var that = this
    // this.stopAlarm()
    // let audioContext = wx.createInnerAudioContext()
    // audioContext.src = MP3_ID_ARRAY[mp3IdIndex]
    // audioContext.loop = loop
    // audioContext.play()
    // audioContext.onStop(function () {
    //   console.warn('音频播放停止啦！！！')
    //   that.setData({
    //     alarmPlayer: null
    //   })
    // })

    // console.log('赋值播放器context');
    // this.setData({
    //   alarmPlayer: audioContext
    // })
  },

  stopAlarm: function () {
    var audioContext = this.data.alarmPlayer
    if (audioContext != null) {
      console.error('停止播放')
      audioContext.stop()
      // this.setData({
      //   alarmPlayer: null//停止闪烁
      // })
    }
  },

  setImage: function (index, imageurl, isTouchEnd = false) {
    //console.info("setImage() - " + index + " -> " + imageurl)
    switch (index) {
      case 0: //START
        if (isTouchEnd) {
          this.setData({
            imageOfStartBtn: imageurl,
            imageOfState: '../../images/ic_start_red.png'
          })
        } else {
          this.setData({
            imageOfStartBtn: imageurl
          })
        }
        break;

      case 1: //LT 上锁
        if (isTouchEnd) {
          this.setData({
            imageOfLtBtn: '../../images/btn_lt_pressed.png',
            imageOfRtBtn: '../../images/btn_rt_normal.png',
            imageOfState: '../../images/ic_lock_blue.png'
          });
        } else {
          this.setData({
            imageOfLtBtn: imageurl
          });
        }
        break;

      case 2: //RT 解锁
        if (isTouchEnd) {
          this.setData({
            imageOfLtBtn: '../../images/btn_lt_normal.png',
            imageOfRtBtn: '../../images/btn_rt_pressed.png',
            imageOfState: '../../images/ic_unlock_blue.png'
          });
        } else {
          this.setData({
            imageOfRtBtn: imageurl
          });
        }
        break;

      case 3: //LB
        if (!this.data.isCall && imageurl.indexOf('_2') == -1) {
          let index = imageurl.lastIndexOf('/');
          let filename = imageurl.substring(index + 1);
          let arr = filename.split('.');
          imageurl = imageurl.substring(0, index + 1) + arr[0] + '_2.' + arr[1];
          console.error(imageurl);
        }
        this.setData({
          imageOfLbBtn: imageurl
        })
        break;

      case 4: //RB
        this.setData({
          imageOfRbBtn: imageurl
        })
        break;
    }
  },

  /**
   * 闪灯
   * @param {*} count 计数器 
   */
  flash: function (count) {

  },

  /**
   * 
   * @param {一直闪} count 
   */
  flash2: function (count = 0) {

  },

  pay: function (totalFee) {
    var self = this;
    //调用微信支付云接口
    zxh.cloud().callFunction({
      name: 'wechatpay',
      data: {
        totalFee: totalFee //金额(单位：分)
      },
      success: res => {
        const payment = res.result.payment
        wx.requestPayment({
          ...payment,
          success(res) {
            console.log('支付成功', res);
            sputil.setPaySuccess(true);
            app.globalData.myuser.is_vip = true; //更新为付费用户
            console.log('更新为付费用户', app.globalData.myuser.is_vip);
          },
          fail(res) {
            console.log('支付失败', res)
          }
        })
      },
      fail: console.error,
    })
  },

  onHide: function () {
    console.warn('index.js onHide()')
    this.stopAlarm()
  }

})