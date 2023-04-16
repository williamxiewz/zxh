Component({
  data: {
    selected: 0,
    color: "#BBBBBB",
    selectedColor: "#fa3d10",
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