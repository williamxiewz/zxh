const lookupName = (uuid, isService) => {
  for (var key in attrs) {
    //console.log(key)
    if (key == uuid || key.toUpperCase() == uuid)
      return attrs[key]
  }
  if (isService) {
    return 'Unknown Service'
  }
  return 'Unknown Characteristic'
}

//通用UUID可参考 https://www.bluetooth.com/specifications/gatt/characteristics/
const UUID_Device_Information_Service = '0000180a-0000-1000-8000-00805f9b34fb'
const UUID_Firmware_Revision = '00002a26-0000-1000-8000-00805f9b34fb'

const UUID_TI_OAD_Service = 'f000ffc0-0451-4000-b000-000000000000'
const UUID_TI_OAD_Image_Identify = 'f000ffc1-0451-4000-b000-000000000000'
const UUID_TI_OAD_Image_Block = 'f000ffc2-0451-4000-b000-000000000000'
const UUID_TI_OAD_Image_Count = 'f000ffc3-0451-4000-b000-000000000000'
const UUID_TI_OAD_Image_Status = 'f000ffc4-0451-4000-b000-000000000000'

const UUID_TI_Reset_Service = 'f000ffd0-0451-4000-b000-000000000000'
const UUID_TI_Reset = 'f000ffd1-0451-4000-b000-000000000000'

//蓝牙通信UUID (iOS要大写才能识别)
const SERVICE_UUID = '0000FF10-0000-1000-8000-00805F9B34FB'
const WRITE_UUID = '0000FF12-0000-1000-8000-00805F9B34FB'
const NOTIFY_UUID = '0000FF11-0000-1000-8000-00805F9B34FB'

const attrs = {
  // Service Attributes
  "00001800-0000-1000-8000-00805f9b34fb": "Generic Access",
  "00001801-0000-1000-8000-00805f9b34fb": "Generic Attribute",
  "0000180a-0000-1000-8000-00805f9b34fb": "Device Information",
  // Characteristic Attributes
  "00002a00-0000-1000-8000-00805f9b34fb": "Device Name",
  "00002a01-0000-1000-8000-00805f9b34fb": "Appearance",
  "00002a02-0000-1000-8000-00805f9b34fb": "Peripheral Privacy Flag",
  "00002a03-0000-1000-8000-00805f9b34fb": "Reconnection Address",
  "00002a04-0000-1000-8000-00805f9b34fb": "Peripheral Preferred Connection Parameters",
  "00002a05-0000-1000-8000-00805f9b34fb": "Service Changed",
  "00002a23-0000-1000-8000-00805f9b34fb": "System ID",
  "00002a24-0000-1000-8000-00805f9b34fb": "Model Number String",
  "00002a25-0000-1000-8000-00805f9b34fb": "Serial Number String",
  "00002a26-0000-1000-8000-00805f9b34fb": "Firmware Revision String",
  "00002a27-0000-1000-8000-00805f9b34fb": "Hardware Revision",
  "00002a28-0000-1000-8000-00805f9b34fb": "Software Revision",
  "00002a29-0000-1000-8000-00805f9b34fb": "Manufacturer Name String",
  "00002a2a-0000-1000-8000-00805f9b34fb": "IEEE 11073-20601 Regulatory Certification Data List",
  "00002a50-0000-1000-8000-00805f9b34fb": "PnP ID",
  // Descriptor Attributes
  "00002901-0000-1000-8000-00805f9b34fb": "Characteristic User Description",
  "00002902-0000-1000-8000-00805f9b34fb": "Client Characteristic Configuration",
  // TI OAD Profile
  "f000ffc0-0451-4000-b000-000000000000": "TI OAD Service",
  "f000ffc1-0451-4000-b000-000000000000": "OAD Image Identify",
  "f000ffc2-0451-4000-b000-000000000000": "OAD Image Block",
  "f000ffc3-0451-4000-b000-000000000000": "OAD Image Count",
  "f000ffc4-0451-4000-b000-000000000000": "OAD Image Status",
  // On-Chip OAD需要给ffd1发送数据让模块重启进入OAD状态
  "f000ffd0-0451-4000-b000-000000000000": "TI Reset Service",
  "f000ffd1-0451-4000-b000-000000000000": "Reset",
}

module.exports = {
  lookupName: lookupName,
  UUID_TI_OAD_Service: UUID_TI_OAD_Service,
  UUID_TI_OAD_Image_Identify: UUID_TI_OAD_Image_Identify,
  UUID_TI_OAD_Image_Block: UUID_TI_OAD_Image_Block,
  UUID_TI_OAD_Image_Count: UUID_TI_OAD_Image_Count,
  UUID_TI_OAD_Image_Status: UUID_TI_OAD_Image_Status,
  UUID_TI_Reset_Service: UUID_TI_Reset_Service,
  UUID_TI_Reset: UUID_TI_Reset,
  UUID_Device_Information_Service: UUID_Device_Information_Service,
  UUID_Firmware_Revision: UUID_Firmware_Revision,
  SERVICE_UUID: SERVICE_UUID,
  WRITE_UUID: WRITE_UUID,
  NOTIFY_UUID: NOTIFY_UUID
}