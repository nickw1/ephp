// GenericAnimation succlassed to include the specifics of an EPHP
// HTTP animation.


const GenericAnimation = require('./GenericAnimation');
const DebugMgr = require('../php/DebugMgr');
const ServerFilesystemAnimation = require('./ServerFilesystemAnimation');
const NarrativeDialog = require('../ui/NarrativeDialog');

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

        const urlParts = this.message.url.split('/');
        const isPHP = this.message.isPHPScript();

        console.log(`GET data: ${JSON.stringify(this.message.getData())}`);
        console.log(`POST data: ${JSON.stringify(this.message.postData())}`);

        this.serverAnimation.httpRequest = { method: this.message.method, 'GET': this.message.getData(), 'POST': this.message.postData() }; 

        var sa = new ServerFilesystemAnimation(
                {fileExplorer: this.fileExplorer,
                urlParts: urlParts,
                repeat:2, 
                interval:500, 
                callback: ()=> {
                    if(window.app.settings.narrative) {
                        const narrative = new NarrativeDialog({elemId: 'serverContent', 
                            narrative:`<h2>Web server has received request!</h2><p>The web server software has received a request for ${this.message.url}.</p>` + (isPHP ? "<p>This is a PHP script, so it will be run by the web server software's PHP module.</p>" : "<p>This is a static file, so it will be sent straight back to the client.</p>")});
                        narrative.on("dismissed", this.finishRequestPostNarrative.bind(this, isPHP));
                        narrative.show();
                    } else {
                        this.finishRequestPostNarrative(isPHP);
                    }
                }
            });
        sa.animate();
    }

    finishRequestPostNarrative(isPHP) {
        if(isPHP) {
            var debugMgr = new DebugMgr( { dbgMsgHandler: this.serverAnimation, user: this.loggedInUser } );
            if(window.app.settings.server_anim) {
                this.message.retrieveSrc ( { 
                    onSuccess: data => {
                            if(data.errors) {
                            alert("error(s):\n" + data.errors.join("\n"));
                        } else {
                            this.serverAnimation.showSrc(data);
                            this.launchDebug(debugMgr);
                        }
                    },
                    onError: code => {
                        this.message.setErrorResponse(code);
                        this.animation.startResponse();
                    }
                });
            } else {
                debugMgr.setCompleteCallback (this.message.processResponse.bind(this.message));
                debugMgr.requestScriptAjax(this.message.method, this.message.url, this.message.formData, false);
            }
        } else {
             this.message.send();
        }
    }

    launchDebug(debugMgr) {
        debugMgr.launchDebugSession (this.message.url, 
                                     this.message.method,
                                     this.message.formData,
                                     this.message.processResponse.bind(this.message)
                                    );
    }

    calculateCanvasPos () {
        super.calculateCanvasPos();

        // Only makes sense if the canvas is embedded within the page layout
        // Will not make sense if the canvas is being drawn on a dialog
        this.canvas.height = this.parentElement.clientHeight - 40;
        this.canvas.width = this.parentElement.clientWidth;
    }
}

module.exports = EPHPHttpAnimation;
