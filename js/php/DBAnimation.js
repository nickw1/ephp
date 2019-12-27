
const GenericAnimation = require('../http/GenericAnimation');

class DBAnimation extends GenericAnimation  {

   constructor(options) {
        super(options);
        this.phpScriptImg = new Image();
        this.phpScriptImg.src = '/ephp/assets/images/php.png';
        this.phpScriptImg.onload = () => {
            this.marginLeft = this.phpScriptImg.width;
            this.dbImg = new Image();
            this.dbImg.src = '/ephp/assets/images/database.png';
            this.dbImg.onload = ()=> {
                this.marginRight = this.dbImg.width;
                this.drawBackground();
                if(this.eventHandlers.canvasloaded) {
                    this.eventHandlers.canvasloaded();
                }
            };
        };
    }


    drawBackground() {
        this.ctx = this.canvas.getContext('2d');
        this.ctx.fillStyle = 'white';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.drawImage(this.phpScriptImg, 0, (this.canvas.height - this.phpScriptImg.height) / 2);    
        this.ctx.drawImage(this.phpScriptImg, this.marginLeft, (this.canvas.height - this.phpScriptImg.height) / 2);    
        this.ctx.drawImage(this.dbImg, this.canvas.width - this.dbImg.width*2, (this.canvas.height - this.dbImg.height) / 2);    
        this.ctx.drawImage(this.dbImg, this.canvas.width - this.dbImg.width, (this.canvas.height - this.dbImg.height) / 2);    
        this.ctx.rect(this.marginLeft, 0, this.canvas.width-this.marginLeft-this.marginRight,this.canvas.height);
        this.ctx.clip();
    }
}

module.exports = DBAnimation;
