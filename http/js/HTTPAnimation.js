
function HTTPAnimation(options) {

    GenericAnimation.prototype.constructor.apply(this,[options]);
    this.fileExplorer = options.fileExplorer;
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


        var urlParts = this.message.url.split("/");    

        var sa = new ServerFilesystemAnimation(
            {fileExplorer: this.fileExplorer,
            urlParts: urlParts,
            repeat:2, 
            interval:500, 
            callback: this.startResponse.bind(this) // TODO as in Animation.js
            });
        sa.animate();
}

HTTPAnimation.prototype.startResponse = function() {

        GenericAnimation.prototype.startResponse.apply(this);
}
