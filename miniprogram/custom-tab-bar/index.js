Component({
  data: {
    selected: 0,
    color: "#FFFFFF",
    selectedColor: "#FFFFFF",
    bg_path: "/images/tab_ctrl.png",
    list: [{
      pagePath: "/pages/index/index",
      iconPath: "/images/tab_ctrl.png",
      selectedIconPath: "/images/tab_ctrl.png",
      text: ""
    }, {
      pagePath: "/pages/userConsole/userConsole",
      iconPath: "/images/tab_settings.png",
      selectedIconPath: "/images/tab_settings.png",
      text: ""
    }]
  },
  attached() {},
  methods: {
    switchTab(e) {
      const data = e.currentTarget.dataset
      const index = data.index;
      const url = data.path
      const bgPath = index == 0 ? '/images/tab_ctrl.png' : '/images/tab_settings.png'
      console.log("切换tab", e);
      var that = this;
      that.setData({
        selected: index,
        bg_path: bgPath
      });
      wx.switchTab({
        url: url
      });
    }
  }
})