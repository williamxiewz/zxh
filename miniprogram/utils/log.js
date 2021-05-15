const formatTime = date => {
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  const hour = date.getHours()
  const minute = date.getMinutes()
  const second = date.getSeconds()
  const ms = date.getMilliseconds()

  let hhmmss = [hour, minute, second].map(formatNumber).join(':')
  //console.error(formatMs(ms))
  return /*[year, month, day].map(formatNumber).join('/') + ' ' + */hhmmss + ':' + formatMs(ms)
}

const formatNumber = n => {
  n = n.toString()
  return n[1] ? n : '0' + n
}

const formatMs = ms => {
  let s = ms.toString()
  if (ms < 10) return '00' + s
  if (ms < 100) return '0' + s
  return s
}

const i = msg => {
  console.info(formatTime(new Date()) + ' - ' + msg)
}

const w = msg => {
  console.warn(formatTime(new Date()) + ' - ' + msg)
}

const e = msg => {
  console.error(formatTime(new Date()) + ' - ' + msg)
}

module.exports = {
  i: i,
  w: w,
  e: e
}