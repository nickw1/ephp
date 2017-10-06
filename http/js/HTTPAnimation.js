
function HTTPAnimation(options) {

    GenericAnimation.prototype.constructor.apply(this,[options]);
    this.fileExplorer = options.fileExplorer;
	if(options.componentAnimator) {
    	this.componentAnimator = options.componentAnimator;
		this.componentAnimator.setCanvas(this.canvas);
	} 
    this.onerror = options.onerror;
}

HTTPAnimation.prototype = Object.create(GenericAnimation.prototype);

// Overridden

HTTPAnimation.prototype.fireAnimation = function()  {
    if(this.fileExplorer) {
        this.fileExplorer.home ( () => {
                    this.timer = setTimeout
                        (this.doAnimate.bind(this,this.messageTypes.REQUEST),
                        this.interval);
                    }); 
    } else {
        GenericAnimation.prototype.fireAnimation.apply(this);
    }
}

// Overridden to do the ServerFilesystemAnimation and analyser stuff
HTTPAnimation.prototype.finishRequest = function() {

        /*
        var dbgMsgHandler = { 
            handleLine: function(data) {
                msg("LINE: number="+ data.lineno); 
                this.serverAnimation.receiveLineCommand(data);
            },
            handleNewRow: function(data) {
                msg("NEWROW: id="+ data); 
                this.serverAnimation.receiveNewrowCommand(data);
            },
            handleStop: function() {
                msg("STOPPED");
            }
        };
        */

        var debugMgr = new DebugMgr("/ephpii/php/launcher.php",
                { dbgMsgHandler: this.serverAnimation } );

        var urlParts = this.message.url.split("/");    

        // TODO this whole damned process is getting horribly convoluted...
        // sort it out!
        var sa = new ServerFilesystemAnimation(
            {fileExplorer: this.fileExplorer,
            urlParts: urlParts,
            repeat:2, 
            interval:500, 
            callback: ()=> {
                 this.message.send( 
                        (data)=> {
                            if(data.errors) {
                                alert("error(s):\n" + data.errors.join("\n"));
                            } else if (this.componentAnimator) { 
                                // should only start the debugmgr once
                                // the compoonent animator has finished
                				this.componentAnimator.startForwardAnim  (

                        			() => {
                            			this.serverAnimation.showSrc(data);
                            			this.message.launchDebugMgr();
                        			});
                            }
                        } , debugMgr);
                }
            });
        sa.animate();
}

HTTPAnimation.prototype.startResponse = function() {
    if(this.componentAnimator) {
        this.componentAnimator.startReverseAnim
            (GenericAnimation.prototype.startResponse.bind(this));
    }    
}
