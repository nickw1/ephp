// message - a generic message 
// e.g. an http request or sql query

// - all references to http changed to generic "message"

// - changed names of onrequeststart/end to onmessagestart/end as this is
// more accurate

function GenericAnimation(options) {
    this.interval = options.interval || 50;
    this.step = options.step || 1;
    this.timer = null;
    this.message = options.message;
   // this.canvas = document.getElementById(options.canvasId);
    this.canvas = document.createElement("canvas");
    var parentElement = document.getElementById(options.parentId);
    this.canvas.setAttribute("height", options.height);
    this.canvas.setAttribute("width", parentElement.style.width); 
    parentElement.appendChild(this.canvas);
    
    this.ctx = this.canvas.getContext('2d');
    this.animationState = this.messageTypes.NONE;
    this.mouseX = this.mouseY = -1;
    this.lastMoveTime = -1;
    this.box = new MessageBox(this.message, { parent: options.parentId });
    this.calculateCanvasPos();
    this.canvas.addEventListener("mousemove", (function(e) {
                if(this.animationState!=this.messageTypes.NONE) {
                    var localX=e.pageX-this.canvasX,
                        localY=e.pageY-this.canvasY;
                    this.showMessageBox(localX, localY);
                }    
            }).bind(this));

    this.onmessagestart = options.onmessagestart || [];
    this.onmessageend = options.onmessageend || [];

    // Replaced PHPAnimation with a generic ServerAnimation (something which
    // animates server side then returns to the response on finish)
    if(options.serverAnimation) {
        this.serverAnimation = options.serverAnimation;
        this.serverAnimation.setCallback(this.startResponse.bind(this));
    }

    var controlsDiv = document.createElement("div");
    parentElement.appendChild(controlsDiv);
    if(controlsDiv) {

        var controls = { 'Pause' : [ 'assets/images/control_pause_blue.2.png' , 
                            this.pause.bind(this)],
                        'Play' : [ 'assets/images/control_play_blue.2.png' , 
                            this.play.bind(this)],
                        'Rewind' : 
                            [ 'assets/images/control_rewind_blue.2.png', 
                                this.rewind.bind(this) ] ,
                        'Fast forward' : 
                            ['assets/images/control_fastforward_blue.2.png' , 
                                this.fastForward.bind(this) ]
                        };
        for(control in controls) {
            var img = document.createElement("img");
            img.setAttribute("alt", control);
            img.setAttribute("src", controls[control][0]);
            img.addEventListener("click", controls[control][1]);
            controlsDiv.appendChild(img);
        }

        var slider = new Slider(50, 10, {
        onchange: (function(value) {
            this.interval = value;
        }).bind(this) ,

        parent: controlsDiv 
        } );
        slider.setValue(this.interval);
    }
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

GenericAnimation.prototype.setMessage = function(message) {
    this.message=message;
    this.box.message=message;
}

// Now can pass an onmessageend event handler - e.g. if we want to tell the
// parent, typically the browser, that the animation has finished
GenericAnimation.prototype.animate = function() {
    for(var i=0; i<this.onmessagestart.length; i++) {
        this.onmessagestart[i](this.messageTypes.REQUEST);
    }
    this.x = 0; 
    this.box.hide();

    // REMOVED reference to phpanimation.
    // replaced with serverAnimation
    if(this.serverAnimation && this.serverAnimation.isRunning) {
        this.serverAnimation.stop();
    }

    // can be overridden with FileExplorer stuff
    this.fireAnimation();
}

GenericAnimation.prototype.fireAnimation = function(){
    this.timer = setTimeout
        (this.doAnimate.bind(this,this.messageTypes.REQUEST), this.interval);
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
            this.animationState==this.messageTypes.RESPONSE ? "HTTP Response": 
                "HTTP Request", boxX+10, y+5);
        this.ctx.strokeStyle='black';
        this.ctx.strokeRect(boxX-1,y-this.boxProps.height/2-1,
                            this.boxProps.width+2,
                            this.boxProps.height+2);
        this.x += this.step*direction;

        // use same animation state for next timeout, hence no parameter to
        // this.doAnimate()

        if(!this.paused) {
            this.timer = setTimeout
                (this.doAnimate.bind(this), this.interval);
        }
    } else {
        this.timer=null;

        // onmessageend e.g. re-enable the send button from browser for
        // http animation
           for(var i=0; i<this.onmessageend.length; i++)  {
            this.onmessageend[i](this.animationState);
        }
        
        if(this.animationState==this.messageTypes.REQUEST) {
            // NEW onrequestend is an event handler which runs when the
            // request has reached its destination. This would for example
            // run the PHPAnimation (or whatever)
            this.finishRequest();
            
        } else if (this.animationState==this.messageTypes.RESPONSE) {
            //  REMOVED this.fileExplorer.clearSelected();
            this.message.finish();
        }
    }
}

// Default finishRequest - start the server animation if it exists 
// otherwise start the response
// Can be overridden e.g. to parse the PHP analyser info
GenericAnimation.prototype.finishRequest = function() {
    if(this.serverAnimation) { 
        this.serverAnimation.animate();
    } else {
        this.startResponse();
    }
}

GenericAnimation.prototype.startResponse = function() {

    for(var i=0; i<this.onmessagestart.length; i++) {
        this.onmessagestart[i](this.messageTypes.RESPONSE);
    }
    this.timer = setTimeout (this.doAnimate.bind
                                    (this,this.messageTypes.RESPONSE),     
                                    this.interval);
}

GenericAnimation.prototype.pause = function() {
    this.paused = true;
    this.clearTimer();
}

GenericAnimation.prototype.stop = function() {
    this.clearTimer();
    // phpAnimation stuff replaced by serverAnimation
    if(this.serverAnimation && this.serverAnimation.isRunning) {
        this.serverAnimation.stop();
    }
}

GenericAnimation.prototype.clearTimer = function() {
    if(this.timer!=null) {
        clearTimeout(this.timer);
        this.timer = null;
    }
}

GenericAnimation.prototype.play = function() {    
    if(this.timer==null) {
        this.paused = false;
        this.timer = setTimeout(this.doAnimate.bind(this), this.interval);
    }
}

GenericAnimation.prototype.fastForward = function() {
    this.clearTimer();
    this.x=(this.animationState==this.messageTypes.RESPONSE ? 20: 
            this.canvas.width-20);
    this.doAnimate();
}

GenericAnimation.prototype.rewind = function() {
    this.clearTimer();
    this.x=(this.animationState==this.messageTypes.RESPONSE ? 
            this.canvas.width: 0);
    this.doAnimate();
}

GenericAnimation.prototype.showMessageBox = function(localX, localY) {
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

GenericAnimation.prototype.addOnMessageStartListener = function(cb) {
    this.onmessagestart.push(cb);
}

GenericAnimation.prototype.addOnMessageEndListener = function(cb) {
    this.onmessageend.push(cb);
}
