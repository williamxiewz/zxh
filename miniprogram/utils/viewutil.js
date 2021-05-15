const getIamgeByRssi = rssi => {
  if (rssi > -70)
    return '/images/ic_rssi_4.png'
  else if (rssi > -80)
    return '/images/ic_rssi_4.png'
  else if (rssi > -90)
    return '/images/ic_rssi_3.png'
  else if (rssi > -100)
    return '/images/ic_rssi_2.png'
  else if (rssi > -120)
    return '/images/ic_rssi_1.png'
  else
    return '/images/ic_rssi_x.png'
}

const toast = (toastTitle) => {
  wx.showToast({
    title: toastTitle,
    icon: 'none',
    duration: 2000,
    mask: false,//是否显示透明蒙层，防止触摸穿透
    success: function (res) { },
    fail: function (res) { },
    complete: function (res) { },
  })
}

module.exports = {
  getIamgeByRssi: getIamgeByRssi,
  toast: toast
}