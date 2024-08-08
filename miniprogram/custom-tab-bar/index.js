Component({
  data: {
    selected: 0,
    color: "#FFFFFF",
    selectedColor: "#FFFFFF",
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
  attached() {},
  methods: {
    switchTab(e) {
      const data = e.currentTarget.dataset
      const index = data.index;
      const url = data.path
      console.log("切换tab", e);
      var that = this;
      that.setData({
        selected: index
      });
      wx.switchTab({
        url: url
      });
    }
  }
})