// message - a generic message 
// e.g. an http request or sql query

// - all references to http changed to generic "message"

// - changed names of onrequeststart/end to messagestart/end as this is
// more accurate

const Eventable = require('./Eventable');
const MessageBox = require('./MessageBox');
const Slider = require('../ui/Slider');

class GenericAnimation extends Eventable {

    constructor(options) {
        super();
        this.interval = options.interval || 50;
        this.step = options.step || 1;
        this.timer = null;
        this.setMessage(options.message);
   // this.canvas = document.getElementById(options.canvasId);
        this.canvas = document.createElement("canvas");
        this.parentElement = document.getElementById(options.parentId);
        this.canvas.setAttribute("height", options.height);
        this.canvas.setAttribute("width", this.parentElement.offsetWidth); 

        this.parentElement.appendChild(this.canvas);
        
        this.ctx = this.canvas.getContext('2d');
        this.animationState = GenericAnimation.messageTypes.NONE;
        this.mouseX = this.mouseY = -1;
        this.lastMoveTime = -1;
        this.box = new MessageBox(this.message, { parent: options.parentId });
        this.calculateCanvasPos();
        this.canvas.addEventListener("mousemove", (e)=> {
            //        this.calculateCanvasPos(); // because might be moving
                // now above done in the startResponse()
                    if(this.animationState!=GenericAnimation.messageTypes.NONE) {
                        var localX=e.pageX-this.canvasX,
                            localY=e.pageY-this.canvasY;
                        this.showMessageBox(localX, localY);
                    }    
                });


        // 040118 are we actually doing animation?
        // e.g. allows us to skip straight to PHP debugging without showing request
        this.active = true;

        // Replaced PHPAnimation with a generic ServerAnimation (something which
        // animates server side then returns to the response on finish)
        // TODO replace this with a generic callback
        if(options.serverAnimation) {
            this.serverAnimation = options.serverAnimation;
            this.serverAnimation.setCallback(this.startResponse.bind(this));
        }

        var controlsDiv = document.createElement("div");
        this.parentElement.appendChild(controlsDiv);
        if(controlsDiv) {

            var controls = 
                {     'Pause' : 
                        [ 'assets/images/control_pause_blue.2.png' , 
                            this.pause.bind(this)],
                    'Play' : 
                        [ 'assets/images/control_play_blue.2.png' , 
                            this.play.bind(this)],
                    'Rewind' : 
                        [ 'assets/images/control_rewind_blue.2.png', 
                            this.rewind.bind(this) ] ,
                    'Fast forward' : 
                        ['assets/images/control_fastforward_blue.2.png' , 
                            this.fastForward.bind(this) ]
                };
            for(var control in controls) {
                var img = document.createElement("img");
                img.setAttribute("alt", control);
                img.setAttribute("src", controls[control][0]);
                img.addEventListener("click", controls[control][1]);
                controlsDiv.appendChild(img);
            }

            var slider = new Slider(50, 10, {
                onchange: value=> { this.interval = value; } ,

                parent: controlsDiv 
            } );
            slider.setValue(this.interval);
        }
        this.eventHandlers.messagestart = [];
        this.eventHandlers.messageend = [];
    }

    on(eventType, eventHandler) {
        if(["messagestart", "messageend"].includes(eventType)) {
            this.eventHandlers[eventType].push(eventHandler);
        } else {
            super.on(eventType, eventHandler);
        }
    }

    calculateCanvasPos () {
        this.canvasX = this.canvasY = 0; 
        var elem=this.canvas;
        while(elem!=null) {
            this.canvasX+=elem.offsetLeft;
            this.canvasY+=elem.offsetTop;
            elem=elem.offsetParent;
        }    
    }

    setMessage (message) {
        if(message) {
            this.message=message;
            this.message.on("responseprocessed", this.startResponse.bind(this));
            this.box.message=message;
        }
    }

    // Now can pass an eventHandlers.messageend event handler - e.g. if we want to tell the
    // parent, typically the browser, that the animation has finished
    animate () {
        console.log("animate()...");
        for(var i=0; i<this.eventHandlers.messagestart.length; i++) {
              this.eventHandlers.messagestart[i](GenericAnimation.messageTypes.REQUEST);
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

    fireAnimation(){
        console.log("are we active? "+ this.active);
        if(this.active) {
            this.calculateCanvasPos();
            this.timer = setTimeout (this.doAnimate.bind(this,GenericAnimation.messageTypes.REQUEST), this.interval);
        } else {
            this.finishRequest();
        }
    }

    doAnimate(messageType) {
        this.animationState = messageType || this.animationState;
        var direction = (this.animationState==GenericAnimation.messageTypes.RESPONSE) ? -1 : 1;
        if((direction==1 && this.x < this.canvas.width) || 
            (direction==-1 && this.x>0)) {
            var y = (this.animationState==GenericAnimation.messageTypes.RESPONSE) ?
                (this.canvas.height/4)*3: this.canvas.height/4;
            this.ctx.fillStyle = 'white';
            this.ctx.fillRect(0,0,this.canvas.width,this.canvas.height);
            this.ctx.strokeStyle=
                this.animationState==GenericAnimation.messageTypes.RESPONSE ? 'green':'red';
            this.ctx.lineWidth = GenericAnimation.arrow.outlineWidth;
            this.ctx.fillStyle = 'yellow';
            this.ctx.beginPath();
            this.ctx.moveTo(this.x-direction*GenericAnimation.arrow.size,y-GenericAnimation.arrow.size);
            this.ctx.lineTo(this.x, y);
            this.ctx.lineTo(this.x-direction*GenericAnimation.arrow.size, y+GenericAnimation.arrow.size);    
            this.ctx.lineTo(this.x-direction*GenericAnimation.arrow.size, y+GenericAnimation.arrow.size/2);
            var origin = direction == -1 ? this.canvas.width: 0;
            this.ctx.lineTo(origin,y+GenericAnimation.arrow.size/2);
            this.ctx.lineTo(origin,y-GenericAnimation.arrow.size/2);
            this.ctx.lineTo(this.x-direction*GenericAnimation.arrow.size,y-GenericAnimation.arrow.size/2);
            this.ctx.lineTo(this.x-direction*GenericAnimation.arrow.size,y-GenericAnimation.arrow.size);
            this.ctx.fill();
            this.ctx.stroke();
            this.ctx.fillStyle='lightgray';
            var boxX = this.x - GenericAnimation.boxProps.relativePos*direction -
                (direction==1 ? GenericAnimation.boxProps.width:0);
            this.ctx.fillRect(boxX,y-GenericAnimation.boxProps.height/2,
                                GenericAnimation.boxProps.width,GenericAnimation.boxProps.height);
            this.ctx.fillStyle='blue'; 
            this.ctx.font=GenericAnimation.boxProps.fontSize+'pt Helvetica';
            this.ctx.fillText(
                this.animationState==GenericAnimation.messageTypes.RESPONSE ? "HTTP Response": 
                    "HTTP Request", boxX+10, y+5);
            this.ctx.strokeStyle='black';
            this.ctx.strokeRect(boxX-1,y-GenericAnimation.boxProps.height/2-1,
                                GenericAnimation.boxProps.width+2,
                                GenericAnimation.boxProps.height+2);
            this.x += this.step*direction;

            // use same animation state for next timeout, hence no parameter to
            // this.doAnimate()

            if(!this.paused) {
                this.timer = setTimeout
                    (this.doAnimate.bind(this), this.interval);
            } 
        } else {
            this.timer=null;

            // eventHandlers.messageend e.g. re-enable the send button from browser for
            // http animation
               for(var i=0; i<this.eventHandlers.messageend.length; i++)  {
                this.eventHandlers.messageend[i](this.animationState);
            }
            
            if(this.animationState==GenericAnimation.messageTypes.REQUEST) {
                // NEW onrequestend is an event handler which runs when the
                // request has reached its destination. This would for example
                // run the PHPAnimation (or whatever)
                this.finishRequest();
                
            } else if (this.animationState==GenericAnimation.messageTypes.RESPONSE) {
                //  REMOVED this.fileExplorer.clearSelected();
                this.message.finish();
            }
        }
    }

    finishRequest() {
        this.message.send();
    }

    startResponse() {
        this.calculateCanvasPos(); //eg ComponentAnimator might change this
        for(var i=0; i<this.eventHandlers.messagestart.length; i++) {
            this.eventHandlers.messagestart[i](GenericAnimation.messageTypes.RESPONSE);
        }
        if(this.active) {
            this.timer = setTimeout (this.doAnimate.bind
                                        (this,GenericAnimation.messageTypes.RESPONSE),     
                                        this.interval);
        } else {
            this.message.finish();    
        }
    }

    pause() {
        this.paused = true;
        this.clearTimer();
    }

    stop() {
        this.clearTimer();
        // phpAnimation stuff replaced by serverAnimation
        if(this.serverAnimation && this.serverAnimation.isRunning) {
            this.serverAnimation.stop();
        }
    }

    clearTimer() {
        if(this.timer!=null) {
            clearTimeout(this.timer);
            this.timer = null;
        }
    }

    play() {    
        if(this.timer==null) {
            this.paused = false;
            this.timer = setTimeout(this.doAnimate.bind(this), this.interval);
        }
    }

    fastForward() {
        this.clearTimer();
        this.x=(this.animationState==GenericAnimation.messageTypes.RESPONSE ? 20: 
                this.canvas.width-20);
        this.paused = false;
        this.doAnimate();
    }

    rewind () {
        this.clearTimer();
        this.x=(this.animationState==GenericAnimation.messageTypes.RESPONSE ? 
                this.canvas.width: 0);
        this.paused = false;
        this.doAnimate();
    }

    showMessageBox(localX, localY) {
    //console.log("*** localX="+localX+ " localY=" + localY+" ***");
        var y = (this.animationState==GenericAnimation.messageTypes.RESPONSE) ?
                    (this.canvas.height/4)*3: this.canvas.height/4;
        var direction = (this.animationState== GenericAnimation.messageTypes.RESPONSE) ? -1 : 1;
        var boxX = this.x - GenericAnimation.boxProps.relativePos*direction -
                                (direction==1 ? GenericAnimation.boxProps.width: 0);
        if(localX>=boxX && localX<=boxX+100 &&
                            localY>=y-10 && localY<=y+10) {
            if(this.animationState==GenericAnimation.messageTypes.RESPONSE) {
                this.box.showResponse();
            } else {
                this.box.showRequest();
            }
        }
    }

    resizeCanvas() {
        this.canvas.setAttribute("width", this.parentElement.offsetWidth+"px"); 
    }

    setActive(active) {
        this.active = active;
    }

    clearCanvas() {
        this.ctx.fillStyle = 'white';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }
}

GenericAnimation.messageTypes =  { NONE: 0, REQUEST: 1, RESPONSE: -1};
GenericAnimation.boxProps = { relativePos: 40, width:120, height:40,
                                fontSize:10};
GenericAnimation.arrow = { outlineWidth: 2, size: 20 };


module.exports = GenericAnimation;
