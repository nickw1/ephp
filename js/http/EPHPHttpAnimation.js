// GenericAnimation succlassed to include the specifics of an EPHP
// HTTP animation.


const GenericAnimation = require('./GenericAnimation');
const DebugMgr = require('../php/DebugMgr');
const ServerFilesystemAnimation = require('./ServerFilesystemAnimation');

class EPHPHttpAnimation extends GenericAnimation  {
   constructor(options) {
        super(options);
        this.fileExplorer = options.fileExplorer;
        this.serverAnimation = options.serverAnimation;
        this.loggedInUser = null;
    }

    setLoggedIn(loggedInUser) {
        this.loggedInUser = loggedInUser;
    }

    // Calls fireAnimation() but does the file explorer stuff first 

    fireAnimation()  {
        if(this.fileExplorer) {
            this.fileExplorer.home(super.fireAnimation.bind(this));
        } else {
            super.fireAnimation();
        }
    }

    // to run when a request has been completed
    // starts up the ServerFilesystemAnimation and debugging 
    finishRequest() {
        var debugMgr = new DebugMgr( { dbgMsgHandler: this.serverAnimation, user: this.loggedInUser } );

//        var urlParts = this.message.url.split("/");    
        const urlParts = this.message.url.split('/');

        var sa = new ServerFilesystemAnimation(
                {fileExplorer: this.fileExplorer,
                urlParts: urlParts,
                repeat:2, 
                interval:500, 
                callback: ()=> {
                    if(this.message.isPHPScript()) {
                        this.message.retrieveSrc ( { 
                            onSuccess: data => {
                                if(data.errors) {
                                    alert("error(s):\n" + data.errors.join("\n"));
                                } else {
                                    this.showSrcAndLaunchDebug(data, debugMgr);
                                }
                            },
                            onError: code => {
                                this.message.setErrorResponse(code);
                                this.animation.startResponse();
                            }
                        });
                    } else {
                         this.message.send();
                    }
                }
            });
        sa.animate();
    }

    // componsnetAnimator has been taken out. So remove this
    //startResponse() {

    showSrcAndLaunchDebug(data, debugMgr) {
        this.serverAnimation.showSrc(data);
        debugMgr.launchDebugSession (this.message.url, 
                                     this.message.method,
                                     this.message.formData,
                                    xmlHTTP => { this.message.processResponse(xmlHTTP, true); }
                                    );
    }
}

module.exports = EPHPHttpAnimation;
