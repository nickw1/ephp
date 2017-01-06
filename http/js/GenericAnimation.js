function GenericAnimation(options) {
    this.interval = options.interval || 500;
    this.step = options.step || 1;
    this.fileExplorer = options.fileExplorer || null;
    this.timer = null;
    this.http = options.http;
    this.canvas = document.getElementById(options.canvasId);
    this.ctx = this.canvas.getContext('2d');
    this.animationState = this.messageTypes.NONE;
    this.mouseX = this.mouseY = -1;
    this.lastMoveTime = -1;
    this.box = new HttpBox(this.http, { parent: 'network' });
    this.calculateCanvasPos();
    this.canvas.addEventListener("mousemove", (function(e) {
                if(this.animationState!=this.messageTypes.NONE) {
                    var localX=e.pageX-this.canvasX,
                        localY=e.pageY-this.canvasY;
                    this.showHttpBox(localX, localY);
                }    
            }).bind(this));

    if(options.phpGenericAnimation) {
        this.phpGenericAnimation = options.phpGenericAnimation;
        this.phpGenericAnimation.setCallback(this.startResponse.bind(this));
    }
	this.messages = options.messages || { request: 'HTTP Request',
											response: 'HTTP Response' };
	this.onrequestend = options.onrequestend || null;
}

GenericAnimation.prototype.messageTypes =  { NONE: 0, REQUEST: 1, RESPONSE: -1};
GenericAnimation.prototype.boxProps = { relativePos: 40, width:120, height:40,
                            fontSize:10};
GenericAnimation.prototype.arrow = { outlineWidth: 2, size: 20 };

GenericAnimation.prototype.calculateCanvasPos = function() {
    this.canvasX = this.canvasY = 0; 
    var elem=this.canvas;
    while(elem!=null) {
        this.canvasX+=elem.offsetLeft;
        this.canvasY+=elem.offsetTop;
        elem=elem.offsetParent;
    }    
}

GenericAnimation.prototype.setHttp = function(http) {
    this.http=http;
    this.box.http=http;
}

GenericAnimation.prototype.animate = function() {
    this.x = 0; 
    this.box.hide();
    if(this.fileExplorer) {
        this.fileExplorer.home ( (function() {
                    this.timer = setInterval
                        (this.doAnimate.bind(this,this.messageTypes.REQUEST), 
                        this.interval);
                    }.bind(this))); 
    } else {
        this.timer = setInterval
                (this.doAnimate.bind(this,this.messageTypes.REQUEST), 
                this.interval);
    }
}

GenericAnimation.prototype.doAnimate = function(messageType) {
    this.animationState = messageType || this.animationState;
    var direction = (this.animationState==this.messageTypes.RESPONSE) ? -1 : 1;
    if((direction==1 && this.x < this.canvas.width) || 
        (direction==-1 && this.x>0)) {
        var y = (this.animationState==this.messageTypes.RESPONSE) ?
            (this.canvas.height/4)*3: this.canvas.height/4;
        this.ctx.fillStyle = 'white';
        this.ctx.fillRect(0,0,this.canvas.width,this.canvas.height);
        this.ctx.strokeStyle=
            this.animationState==this.messageTypes.RESPONSE ? 'green':'red';
        this.ctx.lineWidth = this.arrow.outlineWidth;
        this.ctx.fillStyle = 'yellow';
        this.ctx.beginPath();
        this.ctx.moveTo(this.x-direction*this.arrow.size,y-this.arrow.size);
        this.ctx.lineTo(this.x, y);
        this.ctx.lineTo(this.x-direction*this.arrow.size, y+this.arrow.size);    
        this.ctx.lineTo(this.x-direction*this.arrow.size, y+this.arrow.size/2);
        var origin = direction == -1 ? this.canvas.width: 0;
        this.ctx.lineTo(origin,y+this.arrow.size/2);
        this.ctx.lineTo(origin,y-this.arrow.size/2);
        this.ctx.lineTo(this.x-direction*this.arrow.size,y-this.arrow.size/2);
        this.ctx.lineTo(this.x-direction*this.arrow.size,y-this.arrow.size);
        this.ctx.fill();
        this.ctx.stroke();
        this.ctx.fillStyle='lightgray';
        var boxX = this.x - this.boxProps.relativePos*direction -
            (direction==1 ? this.boxProps.width:0);
        this.ctx.fillRect(boxX,y-this.boxProps.height/2,
                            this.boxProps.width,this.boxProps.height);
        this.ctx.fillStyle='blue'; 
        this.ctx.font=this.boxProps.fontSize+'pt Helvetica';
        this.ctx.fillText(
            this.animationState==this.messageTypes.RESPONSE ? 
				this.messages.response: 
				this.messages.request, boxX+10, y+5);
        this.ctx.strokeStyle='black';
        this.ctx.strokeRect(boxX-1,y-this.boxProps.height/2-1,
                            this.boxProps.width+2,
                            this.boxProps.height+2);
        this.x += this.step*direction;
    } else {
        clearInterval(this.timer);
        this.timer=null;
        
        if(this.animationState==this.messageTypes.REQUEST) {
			
			// onrequestend
			if(this.onrequestend) {
				this.onrequestend(this);
			} else {
				this.startResponse();
			}
        } else if (this.animationState==this.messageTypes.RESPONSE) {
            this.fileExplorer.clearSelected();
            this.http.finish();
        }
    }
}

GenericAnimation.prototype.startResponse = function() {

    this.timer = setInterval (this.doAnimate.bind
                                    (this,this.messageTypes.RESPONSE),     
                                    this.interval);
}

GenericAnimation.prototype.pause = function() {
    if(this.timer!=null) {
        clearInterval(this.timer);
        this.timer = null;
    }
}

GenericAnimation.prototype.play = function() {    
    if(this.timer==null) {
        this.timer = setInterval(this.doAnimate.bind(this), this.interval);
    }
}

GenericAnimation.prototype.fastForward = function() {
    this.x=(this.animationState==this.messageTypes.RESPONSE ? 20: 
            this.canvas.width-20);
    this.doAnimate();
}

GenericAnimation.prototype.rewind = function() {
    this.x=(this.animationState==this.messageTypes.RESPONSE ? 
            this.canvas.width: 0);
    this.doAnimate();
}

GenericAnimation.prototype.showHttpBox = function(localX, localY) {
    var y = (this.animationState==this.messageTypes.RESPONSE) ?
                (this.canvas.height/4)*3: this.canvas.height/4;
    var direction = (this.animationState==
                        this.messageTypes.RESPONSE) ? -1 : 1;
    var boxX = this.x - 
                        this.boxProps.relativePos*direction -
                            (direction==1 ? this.boxProps.width: 0);
    if(localX>=boxX && localX<=boxX+100 &&
                        localY>=y-10 && localY<=y+10) {
        if(this.animationState==this.messageTypes.RESPONSE) {
            this.box.showResponse();
        } else {
            this.box.showRequest();
        }
    }
}    
