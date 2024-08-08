var c;
var isCloudInit = false;

const initCloud = async () => {
  // 声明新的 cloud 实例
  c = new wx.cloud.Cloud({
    // 资源方 AppID
    resourceAppid: 'wx8040a92bbd85ec46',
    // 资源方环境 ID
    resourceEnv: 'zxh-9g5pei38c7cdc56d',
  });
  await c.init();
  isCloudInit = true;
  console.log('zxh cloud init success');
}

const cloud = () => {
  return c;
}

const isInit = () => {
  return isCloudInit;
}

module.exports = {
  initCloud: initCloud,
  cloud: cloud,
  isInit: isInit
}