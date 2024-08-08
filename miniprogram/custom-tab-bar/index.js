const app = getApp();

Component({
  data: {
    height:app.globalData.tabbarheight, // 获取微信小程序底部实际高度 解决底部空白
    selected: 0,
    color: "#5EDCF2",
    selectedColor: "#5EDCF2",
    list: [{
      pagePath: "/pages/index/index",
      iconPath: "/images/tab_ctrl.png",
      selectedIconPath: "/images/tab_ctrl_selected.png",
      text: "控制"
    }, {
      pagePath: "/pages/userConsole/userConsole",
      iconPath: "/images/tab_settings.png",
      selectedIconPath: "/images/tab_settings_selected.png",
      text: "设置"
    }]
  },
  attached() {
  },
  methods: {
    onLoad: function() {
      this.setData({
        height:app.globalData.tabbarheight  
      })
    },

    switchTab(e) {
      const data = e.currentTarget.dataset
      const url = data.path
      wx.switchTab({ url })
      this.setData({
        selected: data.index
      })
    }
  }
})