
function HTTPAnimation(options) {
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
        this.fileExplorer.home 
            (GenericAnimation.prototype.fireAnimation.bind(this)); 
    } else {
        GenericAnimation.prototype.fireAnimation.apply(this);
    }
}

// Overridden to do the ServerFilesystemAnimation and analyser stuff
HTTPAnimation.prototype.finishRequest = function() {
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
                    this.message.retrieveSrc ( { 
                        onSuccess: (data) => {
                            if(data.errors) {
                                alert("error(s):\n" + data.errors.join("\n"));
                            } else if (this.componentAnimator) { 
                                // should only start the debugmgr once
                                // the component animator has finished
                                this.componentAnimator.startForwardAnim(
                                    this.showSrcAndLaunchDebug.bind
                                        (this, data, debugMgr));

                            } else {
                            this.showSrcAndLaunchDebug(data, debugMgr);
                            }
                        },
                        onError: (code) => {
                            this.message.setErrorResponse(code);
                            this.startResponse();
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
    if(this.componentAnimator && this.message.isPHPScript()) {
        // If it's a PHP script, animate the components first, otherwise
        // just get straight on with the reverse animation
        this.componentAnimator.startReverseAnim
            (GenericAnimation.prototype.startResponse.bind(this));
    } else {
        GenericAnimation.prototype.startResponse.apply(this);
    }
}

HTTPAnimation.prototype.showSrcAndLaunchDebug = function(data, debugMgr) {
    this.serverAnimation.showSrc(data);
    debugMgr.launchDebugSession (this.message.url, this.message.method,
                                    this.message.formData,
                                        (xmlHTTP) => {
                            this.message.processResponse(xmlHTTP, true);
                                    });
}
