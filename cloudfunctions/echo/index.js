const cloud = require('wx-server-sdk')

//处理数据加密解密的云函数
exports.main = async (event, context) => {
  console.log('action', event.action)
  console.log('value', event.value)
  var result = {}
  if (event.action == 'encrypt') {
    result.value = encryptPayload(hex2array(event.value))
  }
  if (event.action == 'decrypt') {
    result.value = decryptPayload(hex2array(event.value))
  }
  console.log('result', result)
  return result
}



/**
 * 加密数据
 * @param {*} value ArrayBuffer类型
 * @returns string类型
 */
function encryptPayload(value) {
  let randomArr = randomSelfID()
  let uint8Array = new Uint8Array(value)

  //替换前4字节的随机数
  for (var i = 0; i < 4; i++) {
    uint8Array[i] = randomArr[i]
  }

  uint8Array[4] = (uint8Array[0] + uint8Array[2] + uint8Array[6] + uint8Array[8] + uint8Array[10]) & 0xFF
  uint8Array[5] = (uint8Array[1] ^ uint8Array[3] ^ uint8Array[7] ^ uint8Array[9] ^ uint8Array[11]) & 0xFF

  console.log('encryptPayload() - len=' + value.byteLength, array2hex(uint8Array.buffer))

  let encrypted = new Uint8Array(value.byteLength)
  for (var i = 0; i < 4; i++) {
    encrypted[i] = uint8Array[i]
    encrypted[4 + 2 * i] = (uint8Array[4 + 2 * i] ^ uint8Array[i]) & 0xFF
    encrypted[5 + 2 * i] = (uint8Array[5 + 2 * i] + uint8Array[i]) & 0xFF
  }
  if (value.byteLength == 13) {
    encrypted[12] = uint8Array[12]; //加密解密相关的只有前12字节
  }
  //decryptPayload(encrypted.buffer)
  return array2hex(encrypted.buffer, false)
}

/**
 * 解密数据
 * @param {*} value ArrayBuffer类型
 * @returns string类型
 */
function decryptPayload(value) {
  let encrypted = new Uint8Array(value)
  var decrypted = new Uint8Array(encrypted.length)

  for (var i = 0; i < 4; i++) {
    decrypted[i] = encrypted[i]
    decrypted[4 + 2 * i] = (encrypted[4 + 2 * i] ^ encrypted[i]) & 0xFF
    decrypted[5 + 2 * i] = (encrypted[5 + 2 * i] - encrypted[i]) & 0xFF
  }

  if (value.byteLength == 13) decrypted[12] = encrypted[12] //加密解密相关的只有前12字节

  let byte4 = (decrypted[0] + decrypted[2] + decrypted[6] + decrypted[8] + decrypted[10]) & 0xFF
  let byte5 = (decrypted[1] ^ decrypted[3] ^ decrypted[7] ^ decrypted[9] ^ decrypted[11]) & 0xFF
  if ((byte4 == decrypted[4]) && (byte5 == decrypted[5])) {
    console.log('解密成功')
    return array2hex(decrypted.buffer, false)
  } else {
    console.error(array2hex(value))
    console.error(array2hex(decrypted.buffer))
    console.error('byte4 ' + byte4 + '<->' + decrypted[4] + ' byte5 ' + byte5 + '<->' + decrypted[5])
    return ''
  }
}


//字节数组转16进制字符串
function array2hex(buffer, joinSpace = true) {
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

//16进制字符串转字节数组
function hex2array(hex) {
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

function randomSelfID() {
  var id = "";
  for (var i = 0; i < 4; i++) {
    let v = Math.floor(Math.random() * 256); //[0, 256)随机一个整数
    id += ('0' + v.toString(16)).slice(-2).toUpperCase(); //转化成十六进制
  }
  //console.log("生成手机ID: " + id);
  return id;
}