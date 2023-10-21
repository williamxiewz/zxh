
const HEX = '0123456789ABCDEF'

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



//字节数组转16进制字符串
const array2hex = (buffer, joinSpace = true) => {
  if (buffer == null) return ''

  var hexArr = Array.prototype.map.call(
    new Uint8Array(buffer),
    function (bit) {
      return ('00' + bit.toString(16)).slice(-2).toUpperCase()
    }
  )
  if (joinSpace) {
    return hexArr.join(' ')
  }
  return hexArr.join('')
}

//字符串string与utf8编码的arraybuffer的相互转换
function stringToArrayBuffer(str) {
  var bytes = new Array();
  var len, c;
  len = str.length;
  for (var i = 0; i < len; i++) {
    c = str.charCodeAt(i);
    if (c >= 0x010000 && c <= 0x10FFFF) {
      bytes.push(((c >> 18) & 0x07) | 0xF0);
      bytes.push(((c >> 12) & 0x3F) | 0x80);
      bytes.push(((c >> 6) & 0x3F) | 0x80);
      bytes.push((c & 0x3F) | 0x80);
    } else if (c >= 0x000800 && c <= 0x00FFFF) {
      bytes.push(((c >> 12) & 0x0F) | 0xE0);
      bytes.push(((c >> 6) & 0x3F) | 0x80);
      bytes.push((c & 0x3F) | 0x80);
    } else if (c >= 0x000080 && c <= 0x0007FF) {
      bytes.push(((c >> 6) & 0x1F) | 0xC0);
      bytes.push((c & 0x3F) | 0x80);
    } else {
      bytes.push(c & 0xFF);
    }
  }
  var array = new Int8Array(bytes.length);
  for (var i in bytes) {
    array[i] = bytes[i];
  }
  return array.buffer;
}

function arrayBufferToString(arr) {
  if (typeof arr === 'string' || typeof arr == 'undefined') {
    return arr;
  }
  var dataview = new DataView(arr);
  var ints = new Uint8Array(arr.byteLength);
  for (var i = 0; i < ints.length; i++) {
    ints[i] = dataview.getUint8(i);
  }
  arr = ints;
  var str = '';
  var _arr = arr;
  for (var i = 0; i < _arr.length; i++) {
    var one = _arr[i].toString(2),
      v = one.match(/^1+?(?=0)/);
    if (v && one.length == 8) {
      var bytesLength = v[0].length;
      var store = _arr[i].toString(2).slice(7 - bytesLength);
      for (var st = 1; st < bytesLength; st++) {
        if (typeof (_arr[st + i]) == 'undefined') continue;
        store += _arr[st + i].toString(2).slice(2);
      }
      str += String.fromCharCode(parseInt(store, 2));
      i += bytesLength - 1;
    } else {
      str += String.fromCharCode(_arr[i]);
    }
  }
  return str;
}

//16进制字符串转字节数组
const hex2array = hex => {
  //去掉所有空格
  hex = hex.replace(/ /g, '').replace(/-/g, '')
  var result = [];
  if (hex.length % 2 == 1) hex = '0' + hex
  for (var i = 0; i < hex.length; i += 2) {
    result.push(parseInt(hex.substring(i, i + 2), 16));
  }
  result = Uint8Array.from(result)
  return result.buffer
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

/**
 * 随机一个手机ID
 */
const randomSelfID = () => {
  var id = "";
  for (var i = 0; i < 4; i++) {
    let v = Math.floor(Math.random() * 256);//[0, 256)随机一个整数
    id += ('0' + v.toString(16)).slice(-2).toUpperCase();//转化成十六进制
  }
  //console.log("生成手机ID: " + id);
  return id;
}

const arraycopy = (src, srcPos, dst, dstPos, len) => {
  for (var i = 0; i < len; i++) {
    dst[dstPos + i] = src[srcPos + i];
  }
}


const getCurrentDate = () => {
  const date = new Date()
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()

  const s = [year, month, day].map(formatNumber).join('')
  console.info('当日日期', s)
  return s
}

const uint8ToHex = (byte) => {
  return HEX[(byte >> 4) & 0xf] + HEX[byte & 0xf];
}
//mac是广播中的，与实际MAC字节序相反，本方法主要用于分享给Android系统的设备连接
const mac2DeviceId = (mac) => {
  if (mac.match(/[0-9A-Fa-f]{12}/)) {
    let arr = new Uint8Array(hex2array(mac));
    let macstd = Array.from(arr).map(e => uint8ToHex(e)).join(':');
    // for (let i = arr.byteLength - 1; i >= 0; i--) {
    //   macstd += uint8ToHex(arr[i]);
    //   if (i > 0) {
    //     macstd += ':';
    //   }
    // }
    console.log(`mac2DeviceId() - ${mac} -> ${macstd}`);
    return macstd;
  } else {
    console.error(`输入的mac格式有误 [${mac}]`);
    return '';
  }
}

const deviceTypeNum = (deviceType) => {
  let num = parseInt(deviceType.substring(3, 5), 16);
  if(num > 0xA0) num -= 0xA0;
  if(num > 0xB0) num -= 0xB0;
  if(num > 0xC0) num -= 0xC0;
  if(num > 0xD0) num -= 0xD0;
  if(num > 0xE0) num -= 0xE0;
  if(num > 0xF0) num -= 0xF0;
  return num;
}

//是否是带寻车功能的设备
const isCall = (device) => {
  if(!device) {
    return true;
  }
  // XL2 是“开座包”，其他是“寻车”
  return device.name.indexOf('XL2') == -1;
}

module.exports = {
  formatTime: formatTime,
  array2hex: array2hex,
  hex2array: hex2array,
  arrayBufferToString: arrayBufferToString,
  stringToArrayBuffer: stringToArrayBuffer,
  randomSelfID: randomSelfID,
  arraycopy: arraycopy,
  getCurrentDate: getCurrentDate,
  mac2DeviceId: mac2DeviceId,
  deviceTypeNum: deviceTypeNum,
  isCall: isCall
}