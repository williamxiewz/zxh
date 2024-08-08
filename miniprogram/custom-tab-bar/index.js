const onfire = require('../utils/onfire.js');

Component({
  data: {
    connected: false,//未连接时 GO 按钮显示灰色图片
    selected: 0,
    color: "#AAA",
    selectedColor: "#000",
    list: [{
      pagePath: "/pages/index/index",
      iconPath: "/images/tab_ctrl.png",
      selectedIconPath: "/images/tab_ctrl_sel.png",
      text: "控制"
    },
    {
      bulge: true,
      pagePath: "",
      iconPath: "/images/btn_start_disabled.png",
      selectedIconPath: "/images/btn_start_disabled.png",
      text: ""
    },
    {
      pagePath: "/pages/userConsole/userConsole",
      iconPath: "/images/tab_settings.png",
      selectedIconPath: "/images/tab_settings_sel.png",
      text: "设置"
    }]
  },
  attached() {
    var that = this;
    onfire.on('btnNotStartClick', function() {
      console.info('custom-tab-bar index.js btnNotStartClick');
      that.updateGoImage('/images/btn_start.png');
    });

    onfire.on('onBLEConnectionStateChange_tabbar', function(connected) {
      console.info('custom-tab-bar index.js 连接状态变化 ', connected);
      let path = connected ? '/images/btn_start.png':'/images/btn_start_disabled.png';
      that.updateGoImage(path);
      that.setData({
        connected: connected
      });
    });

    onfire.on('startState', function() {
      that.updateGoImage('/images/btn_start_checked.png');
    });
  },
  methods: {

    updateGoImage(iconPath) {
      let items = this.data.list;
      items[1].iconPath = iconPath;
      items[1].selectedIconPath = iconPath;
      this.setData({
        list: items
      });
    },

    switchTab(e) {
      const data = e.currentTarget.dataset;
      console.log('switchTab()', typeof(data.index));
      console.log('switchTab()', data);
      if(data.index === 1) {
        //启动
        if(this.data.connected) {
          console.log('switchTab() 启动');
          this.updateGoImage('/images/btn_start_checked.png');
          //通知 pages/index.js 页面更新其他按钮状态，发送数据
          onfire.fire('onGoClick');
        }
      } else {
        const url = data.path;
        wx.switchTab({ url });
        this.setData({
          selected: data.index
        });
      }
    }
  }
})