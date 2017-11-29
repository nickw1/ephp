
function HTTPAnimation(options) {
	console.log("HTTPAnimation constuctore");
    GenericAnimation.prototype.constructor.apply(this,[options]);
    this.fileExplorer = options.fileExplorer;
	if(options.componentAnimator) {
    	this.componentAnimator = options.componentAnimator;
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
		console.log("finishRequest()");
        var debugMgr = new DebugMgr("php/launcher.php",
                { dbgMsgHandler: this.serverAnimation } );

        var urlParts = this.message.url.split("/");    

        var sa = new ServerFilesystemAnimation(
            {fileExplorer: this.fileExplorer,
            urlParts: urlParts,
            repeat:2, 
            interval:500, 
            callback: ()=> {
				if(this.message.isPHPScript()) {
					this.message.retrieveSrc ( (data) => {
						if(data.errors) {
							alert("error(s):\n" + data.errors.join("\n"));
						} else if (this.componentAnimator) { 
							// should only start the debugmgr once
							// the compoonent animator has finished
							this.componentAnimator.startForwardAnim(
								this.showSrcAndLaunchDebug.bind
									(this, data, debugMgr));

						} else {
							this.showSrcAndLaunchDebug(data, debugMgr);
						}
					});
				} else {
                 	this.message.send(this.startResponse.bind(this));
				}
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

HTTPAnimation.prototype.showSrcAndLaunchDebug = function(data, debugMgr) {
	console.log("showSrcAndLaunchDebug()");
	this.serverAnimation.showSrc(data);
	debugMgr.launchDebugSession (this.message.url, this.message.method,
									this.message.formData,
										(xmlHTTP) => {
							this.message.processResponse(xmlHTTP, true);
									});
}
