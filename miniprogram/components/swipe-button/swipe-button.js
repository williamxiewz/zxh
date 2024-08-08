// components/swipe-button/swipe-button.js
const tag = 'swipe-button.js';

Component({
  /**
   * 组件的属性列表
   */
  properties: {
    enabled: {
      type: Boolean,
      value: true,
      observer: function(newVal, oldVal, changePath) {
        console.info(tag + ` newVal=${newVal}, oldVal=${oldVal}, changePath=${changePath}`);
        if(!newVal) {
          this.setData({
            on: false
          });
        }
      }
    },
    on: {
      type: Boolean,
      value: false,
      observer: function(newVal, oldVal, changePath) {
        console.info(tag + ` newVal=${newVal}, oldVal=${oldVal}, changePath=${changePath}`);
        this.setData({
          x_offset: newVal ? this.data.max_offset : 0
        });
      }
    }
  },

  /**
   * 组件的初始数据
   */
  data: {
    left: 0,
    right: 0,
    thumbWidth: 0,
    x_offset: 0,
    max_offset: 0
  },

  /**
   * 组件的方法列表
   */
  methods: {
    getSize() {
      let that = this;
      let query = wx.createSelectorQuery().in(this);
      query.select('#root').boundingClientRect();
      query.select('#thumb').boundingClientRect();
      query.exec(function (res) {
        console.log(tag, res);
        if (res[0] && res[1]) {
          that.setData({
            left: res[0].left,
            right: res[0].right,
            thumbWidth: res[1].width,
            max_offset: res[0].right - res[1].width - res[0].left
          });
          console.info(`${tag} left=${that.data.left}, right=${that.data.right}, thumbWidth=${that.data.thumbWidth}`);
        }
      });
    },
    onTouchStart(e) {
      //console.info(tag + ' onTouchStart() -', e);
      //this.moveThumb(e);
    },
    onTouchMove(e) {
      //console.info(tag + ' onTouchMove() - thumbWidth=' + this.data.thumbWidth, e);
      if(!this.data.enabled) {
        return;
      }
      this.moveThumb(e);
    },
    onTouchEnd(e) {
      //console.info(tag + ' onTouchEnd() -', e);
      if(!this.data.enabled) {
        return;
      }

      let isOn = this.data.on;
      if(this.data.on) {
        this.setData({
          on: false
        });
      } else {
        //console.info(`${tag} onTouchEnd() - x_offset=${this.data.x_offset}`);
        //console.info(`${tag} onTouchEnd() - ${max}`);
        this.setData({
          on: this.data.x_offset > this.data.max_offset / 2
        });
      }
      console.info(`${tag} onTouchEnd() - on=${this.data.on}`);
      if(isOn != this.data.on) {
        this.onValueChange(this.data.on);
      }
    },
    moveThumb(e) {
      if(this.data.on) {
        return;
      }
      let x = e.touches[0].clientX;
      //let y = e.touches[0].clientY;
      let left = this.data.left;
      let right = this.data.right;
      let thumbWidth = this.data.thumbWidth;
      if(x < left) x = left;
      let max = right - thumbWidth;
      if(x > max) x = max;
      let offset = x - left;
      let abs = Math.abs(this.data.x_offset - offset);
      //console.info(`${tag} abs=${abs}`);
      //滑动就是为了防止误触到，所以限制一下
      if(abs > 80) {
        return;
      }
      this.setData({
        x_offset: offset
      });
    },
    onValueChange(value) {
      var myEventDetail = {
        value: value
      } // detail对象，提供给事件监听函数
      var myEventOption = {} // 触发事件的选项
      //wxml 中使用 bindvaluechange
      this.triggerEvent('valuechange', myEventDetail, myEventOption);
    }
  },
  lifetimes: {
    ready() {
      this.getSize();
    }
  }
})
