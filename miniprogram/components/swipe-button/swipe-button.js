const tag = 'swipe-button.js';

Component({
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

  data: {
    left: 0,
    right: 0,
    thumbWidth: 0,
    x_offset: 0,
    max_offset: 0,
    touchDotX:0,
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
            max_offset: res[0].right - res[1].width - res[0].left - 10
          });
          console.info(`${tag} left=${that.data.left}, right=${that.data.right}, thumbWidth=${that.data.thumbWidth}`);
        }
      });
    },
    onTouchStart(e) {
      let _that = this
      _that.setData({
        touchDotX: e.touches[0].clientX
      }) 
      
    },
    onTouchMove(e) {
      // console.info(tag + ' onTouchMove() - thumbWidth=' + this.data.thumbWidth, e);
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
      
      let touchMoveX = e.changedTouches[0].clientX
      let isOn = this.data.on;
      let current_x_offset = this.data.x_offset
      let touchDotX = this.data.touchDotX
      // console.log('current_x_offset',current_x_offset,touchDotX,touchMoveX)
  
      if (isOn) {
        // let changeOn = Math.abs(touchDotX - this.data.x_offset)  >  this.data.max_offset / 2
        let changeOn = Math.abs(touchMoveX - touchDotX) > this.data.max_offset / 2
        // console.log('touchMoveX - touchDotX',touchMoveX - touchDotX, Math.abs(touchMoveX - touchDotX))


        if(changeOn){
          this.setData({
            on: false
          })
        } else {
          this.setData({
            x_offset:  this.data.max_offset
          });
        }

        

      } else {
      let changeOn = this.data.x_offset > this.data.max_offset / 2
        this.setData({
          on: changeOn,
          x_offset: changeOn? this.data.max_offset : 0
        });
      }

     

    
      // console.info(`${tag} onTouchEnd() - on=${this.data.on}`);
      // console.log('this.data.x_offset ',this.data.x_offset )
      if(isOn != this.data.on) {
        this.onValueChange(this.data.on);
      }
    },
    moveThumb(e) {
     
      let x = e.touches[0].clientX;
      let left = this.data.left;
      let right = this.data.right;
      let thumbWidth = this.data.thumbWidth;
      // console.log('x,left,right,thumbWidth',x,left,right,thumbWidth)
      if(x < left) x = left;
      let max = right - thumbWidth;
      if(x > max) x = max;
      let offset = x - left;
      let abs = Math.abs(this.data.x_offset - offset);
      // console.log('offset,max_offset/2',offset,this.data.max_offset / 2)
      // console.info(`${tag} abs=${abs}`);
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
