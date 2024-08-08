//index.js
const app = getApp()

const sputil = require('../../utils/sputil.js')
const bleproxy = require('../../utils/bleproxy.js')
const bledata = require('../../utils/bledata.js')
const util = require('../../utils/util.js')
const viewutil = require('../../utils/viewutil.js')
const onfire = require('../../utils/onfire.js')
const dbutil = require('../../utils/dbutil.js')

const IMAGE_ARRAY = [
  '../../images/btn_start.png',
  '../../images/btn_lock.png',
  '../../images/btn_unlock.png',
  '../../images/btn_ring.png',
  '../../images/btn_rb_normal.png',
  '../../images/btn_start_disabled.png',
  '../../images/btn_lock_disabled.png',
  '../../images/btn_unlock_disabled.png',
  '../../images/btn_ring_disabled.png',
  '../../images/btn_rb_disabled.png'
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
    logo: '智享e+', //标题
    deviceState: -1, //设备状态
    bluetoothAvailable: false,
    connected: false, //是否已连接设备
    isStart: false, //是否是启动状态
    bottomLayoutMatginTop: 118, //%
    bottomLayoutWidth: 96, //百分比
    startButtonWidth: 33, //百分比
    statusBarHeight: 28,//状态栏高度
    topSpace: 48, //rpx
    selectedBtn: -1,//5个功能按钮的编号 0~4，用于记录选中状态
    imageOfMoto: '../../images/img_moto_normal.png',
    imageOfStartBtn: '../../images/btn_start.png',
    imageOfLtBtn: '../../images/btn_lock.png',
    imageOfRtBtn: '../../images/btn_mute_disabled.png',
    imageOfLbBtn: '../../images/btn_mute_disabled.png',
    imageOfRbBtn: '../../images/btn_rb_normal.png',
    RSSI_Image: '../../images/ic_rssi_x.png',
    timerId: -1,
    alarmPlayer: null, //报警播放context
    timerCount: 0, //计数器
    isCall: false //是否带寻车功能
  },


  //扫码添加设备
  scanCode: function () {
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
            app.getDevicesFromCloud();
          }
        });
      }
    });
  },

  //开启定时器读取RSSI，发送心跳包
  startTimer: function () {
    var that = this;

    clearInterval(that.data.timerId);

    //定时器启动前先发一包心跳包数据
    if (app.globalData.isNetworkOn) {
      // bleproxy.send(sputil.getDeviceId(), bledata.queryState(), false);
      bleproxy.writeBLECharacteristic(sputil.getDeviceId(), app.globalData.queryValue, false);
      //todo 2021-6-20
      bleproxy.connect(sputil.getDeviceId());
    }

    console.log('启动定时器');

    let timerId = setInterval(function () {
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
        bleproxy.sendToConnectedDevices(app.globalData.queryValue, true);
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

  getSystemInfo: function() {
    var that = this;
    wx.getSystemInfo({
      success: (result) => {
        //console.log(result);
        console.log('状态栏高度', result.statusBarHeight);
        let sc = result.windowHeight / result.windowWidth
        if (sc > 16 / 9) {
          //宽高比大于16/9
          that.setData({
            topSpace: 48,
            bottomLayoutMatginTop: 118,
            bottomLayoutWidth: 96,
            startButtonWidth: 32,
            statusBarHeight: result.statusBarHeight
          });
        } else {
          that.setData({
            topSpace: 0,
            bottomLayoutMatginTop: 100,
            bottomLayoutWidth: 80,
            startButtonWidth: 26,
            statusBarHeight: result.statusBarHeight
          });
        }
      },
      fail: (err) => {
        console.error(err);
      }
    });
  },

  onLoad: function () {
    var that = this;

    this.getSystemInfo();

    wx.getBluetoothAdapterState({
      success: (result) => {
        that.setData({
          bluetoothAvailable: result.available
        })
      }
    });
    onfire.on('onGoClick', function(){
      console.log('index.js GO!!!');
      //e.currentTarget.dataset.btnindex
      that.onTouchEnd({
        currentTarget: {
          dataset: {
            btnindex: '0'
          }
        }
      });
    });
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
      if(result.available) {
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
      console.error(`curMac=${curMac}, mac=${mac}`);
      //只处理当前选中的设备
      if (curMac == '' || curMac == mac) {
        if (that.data.connected == res.connected) return;
        that.updateConnectionState(res.connected);
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
      if (sputil.getDeviceId() != res.deviceId) return

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

  //更新连接状态
  updateConnectionState: function(connected) {
    this.setData({
      connected: connected
    });
    onfire.fire('onBLEConnectionStateChange_tabbar', connected);
  },

  testConnectionState: function(e) {
    console.info('testConnectionState()', e);
    this.updateConnectionState(e.detail.value);
  },

  testIsCall: function(e) {
    console.info('testIsCall()', e);
    this.setData({
      isCall: e.detail.value
    });
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

      if (that.data.deviceState != state)
        that.setData({
          deviceState: state
        })

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
          //撤防图案
          that.setData({
            selectedBtn: 2,
            isStart: false
          });
          onfire.fire('btnNotStartClick');
          break;


        case 3: //设防
        case 4: //预警
        case 5: //检测
        case 6: //报警
          //设防图案
          that.setData({
            selectedBtn: 1,
            isStart: false
          });
          onfire.fire('btnNotStartClick');
          break;

        case 2: //启动
          that.setData({
            selectedBtn: 0,
            isStart: true
          });
          onfire.fire('startState');
          break;
      }
    }
  },

  onUnload: function () {
    onfire.un('onBLEConnectionStateChange_index')
    onfire.un('onBLECharacteristicValueChange_index')
    onfire.un('onBluetoothAdapterStateChange_index')
    onfire.un('onAppHide_index')
    onfire.un('onGoClick');
  },

  onShow: function () {
    var that = this;
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
        selected: 0,
        bg_path: '/images/tab_ctrl_sel.png'
      });
    }
    let currentDevice = sputil.getSelectedDevice();
    let deviceId = sputil.getDeviceId();
    if(currentDevice) {
      deviceId = currentDevice.deviceId;
      if(!deviceId) {
        deviceId = util.mac2DeviceId(currentDevice.mac);
        if(!deviceId) {
          deviceId = bleproxy.getCurrentDeviceId();
        }
      }
    }
    const isConnected = bleproxy.isConnected(deviceId);
    that.startTimer();

    console.info('index.js onShow() isUserAvailable=' + app.isUserAvailable());

    that.updateConnectionState(isConnected);

    if(currentDevice) {
      console.info('device name', currentDevice.name);
      that.setData({
        isCall: currentDevice.name.includes('LJ2')
      });
    }
  },

  sendPayload: function (cmdCode) {
    if (!app.globalData.isNetworkOn) {
      viewutil.toast('网络已断开');
      return;
    }

    var that = this;
    const deviceType = sputil.getDeviceType();
    const deviceNum = deviceType == '' ? 0 : parseInt(deviceType.substring(3, 5));
    if (deviceNum == 1 || deviceNum == 4) {
      //产品1 产品4 限制使用次数
      const myuser = app.globalData.myuser;
      console.log('index.js sendPayload()', myuser);

      var isShare = false; //是否是通过扫码添加的设备
      let devices = sputil.getDevices();
      devices.forEach(element => {
        if (sputil.getDeviceMac() == element.mac) {
          isShare = element.openids.indexOf(app.globalData.openid, 0) == -1;
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

    const deviceId = sputil.getDeviceId();
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
    var that = this;
    let index = parseInt(e.currentTarget.dataset.btnindex);
    console.log("TouchEnd() - index=" + index + ", selectedBtn=" + that.data.selectedBtn);
    if(that.data.selectedBtn == 0 && index == 0) {
      index = 2;//启动状态下重复点击启动按钮执行解锁功能
    }
    if(index !== 0) {
      onfire.fire('btnNotStartClick');//通知自定义的 tab bar 更新 GO 图标
    }
    that.setData({
      selectedBtn: index
    });
    //console.log("TouchEnd", index);
    that.setImage(index, IMAGE_ARRAY[index]);

    if (index == 0) {
      //启动
      console.log('启动');
      that.sendPayload(bledata.CMD_START);
    } else if (index == 1) {
      //设防
      console.log('锁车');
      that.sendPayload(bledata.CMD_LOCK);;
      // that.flash(0);
      that.playSound(1);
    } else if (index == 2) {
      //撤防
      console.log('解锁');
      that.sendPayload(bledata.CMD_UNLOCK);
      // that.flash(0);
      that.playSound(2);
    } else if (index == 4) {
      //座垫
      console.log('座垫');
      that.sendPayload(bledata.CMD_CALL);
    } else if (index == 3) {
      //静音
      console.log('静音');
      that.sendPayload(bledata.CMD_MUTE);
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

      //test
      // if (!app.globalData.appHidden) {
      //   that.playBackgroundAudio()
      // }
    })
  },

  test(e) {
    console.log('test()')
    //this.playBackgroundAudio()
  },

  playSound: function (mp3IdIndex, loop = false) {
    var that = this
    this.stopAlarm()
    let audioContext = wx.createInnerAudioContext()
    audioContext.src = MP3_ID_ARRAY[mp3IdIndex]
    audioContext.loop = loop
    audioContext.play()
    audioContext.onStop(function () {
      console.warn('音频播放停止啦！！！')
      that.setData({
        alarmPlayer: null
      })
    })

    //if (mp3IdIndex == 3 && loop) {//报警音
    console.log('赋值播放器context');
    this.setData({
      alarmPlayer: audioContext
    })
    //}
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

  setImage: function (index, imageurl) {
    //console.info("setImage() - " + index + " -> " + imageurl)

    var that = this
    switch (index) {
      case 0: //START
        that.setData({
          imageOfStartBtn: imageurl
        })
        break;

      case 1: //LT
        this.setData({
          imageOfLtBtn: imageurl
        })
        break;

      case 2: //RT
        this.setData({
          imageOfRtBtn: imageurl
        })
        break;

      case 3: //LB
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

    //console.info("### " + this.data.imageOfStartBtn)
  },


  /**
   * 闪灯
   * @param {*} count 计数器 
   */
  flash: function (count) {
    var that = this
    setTimeout(function () {
      var imagePath = count % 2 == 0 ? '../../images/img_moto_normal.png' : '../../images/img_moto_normal.png'

      //console.log('count=' + count + ', imagepPath=' + imagePath)

      that.setData({
        imageOfMoto: imagePath
      })
      if (count < 3) {
        that.flash(++count)
      }
    }, 500)
  },

  /**
   * 
   * @param {一直闪} count 
   */
  flash2: function (count = 0) {
    var that = this
    setTimeout(function () {
      var imagePath = count % 2 == 0 ? '../../images/img_moto_normal.png' : '../../images/img_moto_normal.png'

      console.log('that.data.alarmPlayer=' + that.data.alarmPlayer)

      that.setData({
        imageOfMoto: imagePath
      })
      if (that.data.alarmPlayer != null && count < 3000) {
        that.flash2(++count)
      }
    }, 500)
  },

  pay: function (totalFee) {
    var self = this;
    //调用微信支付云接口
    dbutil.pay((res) => {
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
        });
    });
  },

  onHide: function () {
    console.warn('index.js onHide()')
    this.stopAlarm()
  }

})