function Animation(options) {
    this.interval = options.interval || 50;
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

    if(options.phpAnimation) {
        this.phpAnimation = options.phpAnimation;
        this.phpAnimation.setCallback(this.startResponse.bind(this));
    }

    if(options.controlsDiv) {

        var controls = { 'Pause' : [ 'assets/images/control_pause_blue.2.png' , 
                            this.pause.bind(this)],
                        'Play' : [ 'assets/images/control_play_blue.2.png' , 
                            this.play.bind(this)],
                        'Fast forward' : 
                            ['assets/images/control_fastforward_blue.2.png' , 
                                this.fastForward.bind(this) ],
                        'Rewind' : 
                            [ 'assets/images/control_rewind_blue.2.png', 
                                this.rewind.bind(this) ] };
        for(control in controls) {
            var img = document.createElement("img");
            img.setAttribute("alt", control);
            img.setAttribute("src", controls[control][0]);
            img.addEventListener("click", controls[control][1]);
            options.controlsDiv.appendChild(img);
        }

        var slider = new Slider(50, 10, {
        onchange: (function(value) {
            this.interval = value;
        }).bind(this) ,

        parent: options.controlsDiv 
        } );
        slider.setValue(this.interval);
    }
}

Animation.prototype.messageTypes =  { NONE: 0, REQUEST: 1, RESPONSE: -1};
Animation.prototype.boxProps = { relativePos: 40, width:120, height:40,
                            fontSize:10};
Animation.prototype.arrow = { outlineWidth: 2, size: 20 };

Animation.prototype.calculateCanvasPos = function() {
    this.canvasX = this.canvasY = 0; 
    var elem=this.canvas;
    while(elem!=null) {
        this.canvasX+=elem.offsetLeft;
        this.canvasY+=elem.offsetTop;
        elem=elem.offsetParent;
    }    
}

Animation.prototype.setHttp = function(http) {
    this.http=http;
    this.box.http=http;
}

Animation.prototype.animate = function() {
    this.x = 0; 
    this.box.hide();
    if(this.fileExplorer) {
        this.fileExplorer.home ( (function() {
                    this.timer = setTimeout
                        (this.doAnimate.bind(this,this.messageTypes.REQUEST), 
                        this.interval);
                    }.bind(this))); 
    } else {
        this.timer = setTimeout
                (this.doAnimate.bind(this,this.messageTypes.REQUEST), 
                this.interval);
    }
}

Animation.prototype.doAnimate = function(messageType) {
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
        
        if(this.animationState==this.messageTypes.REQUEST) {
            if(this.fileExplorer!=null) {
            
                var urlParts = this.http.url.split("/");    

                var sa = new ServerAnimation(
                    {fileExplorer: this.fileExplorer,
                    urlParts: urlParts,
                    repeat:2, 
                    interval:500, 
                    callback: 
                        (function() {
                            // TODO go in own object - seems poor cohesion to
                            // put here, particularly error checking
                            this.http.send((function(analyserInfo) {
                                var startResponseNow=true;
                                if(analyserInfo) {
                                    if(analyserInfo.errors) {
                                        var errMsg="";
                                        for(var i=0; i<analyserInfo.errors.
                                            length; i++) {
                                            if(analyserInfo.errors[i].
                                                syntaxError) {
                                                errMsg += "There was a " +
                                                    "syntax error in your "+
                                                    "PHP code on line number "+
                                                    analyserInfo.errors[i].
                                                        syntaxError.lineNumber +
                                                    ".\nThe reason is " +
                                                    analyserInfo.errors[i].
                                                        syntaxError.reason +
                                                    "\n. If you cannot see a "+
                                                    "problem with this line, "+
                                                    "look at the preceding "+
                                                    "two or three lines.\n";
                                            } else if (analyserInfo.errors[i].
                                                sqlError) {
                                                errMsg += "There was an " +
                                                    "error in your "+
                                                    "SQL on line number "+
                                                    analyserInfo.errors[i].
                                                        sqlError.lineNumber +
                                                    ".\n("+
                                                    analyserInfo.errors[i].
                                                        sqlError.query +
                                                    ")\nThe reason is " +
                                                    analyserInfo.errors[i].
                                                        sqlError.error +
                                                    "\n.";
                                            } else {
                                                errMsg += 
                                                    analyserInfo.errors[i] +
                                                "\n";
                                            }
                                        }
                                        alert(errMsg);
                                        startResponseNow = false;
                                    } else {
                                        startResponseNow=
                                            !this.phpAnimation.animate
                                                (analyserInfo);
                                    }
                                }

                                if(startResponseNow) {
                                    this.startResponse();
                                }
                            }).bind(this));    
                        }).bind(this)
                    });
                sa.animate();
            }
        } else if (this.animationState==this.messageTypes.RESPONSE) {
            this.fileExplorer.clearSelected();
            this.http.finish();
        }
    }
}

Animation.prototype.startResponse = function() {

    this.timer = setTimeout (this.doAnimate.bind
                                    (this,this.messageTypes.RESPONSE),     
                                    this.interval);
}

Animation.prototype.pause = function() {
    this.paused = true;
    if(this.timer!=null) {
        clearTimeout(this.timer);
        this.timer = null;
    }
}

Animation.prototype.play = function() {    
    if(this.timer==null) {
        this.paused = false;
        this.timer = setTimeout(this.doAnimate.bind(this), this.interval);
    }
}

Animation.prototype.fastForward = function() {
    this.x=(this.animationState==this.messageTypes.RESPONSE ? 20: 
            this.canvas.width-20);
    this.doAnimate();
}

Animation.prototype.rewind = function() {
    this.x=(this.animationState==this.messageTypes.RESPONSE ? 
            this.canvas.width: 0);
    this.doAnimate();
}

Animation.prototype.showHttpBox = function(localX, localY) {
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
