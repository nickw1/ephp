class ServerFilesystemAnimation {
    constructor(options) {
        this.repeat = options.repeat || 5;
        this.interval = options.interval || 1000;
        this.callback = options.callback;
        this.fileExplorer = options.fileExplorer;
        this.urlParts = options.urlParts;
    }

    animate() {
        if(this.urlParts.length >= 2) {
            this.fileExplorer.clearSelected();
            this.urlPartCounter = this.urlParts[1][0] == "~"  ? 2:1;
            this.counter=0;
            this.element = this.fileExplorer.findFileSpan
            (this.urlParts[this.urlPartCounter].indexOf("?") == -1 ?
                this.urlParts[this.urlPartCounter]:
                this.urlParts[this.urlPartCounter].split("?")[0]);
            if(this.element==null) {
                this.callback();
            } else {
                this.timer=setInterval(this.doAnimate.bind(this), this.interval);
            }
        }
    }

    doAnimate() {
        if(this.counter++ == this.repeat) {
            clearInterval(this.timer);
            this.timer=null;
            this.nextLevel();
        } else {
            if(this.counter%2) {
                console.log("ADDING SELECTED: " + this.element.id);
                this.element.classList.add("selected");
                //this.element.style.backgroundColor = 'red';
            } else {
                console.log("REMOVING SELECTED: " + this.element.id);
                this.element.classList.remove("selected");
                //this.element.style.backgroundColor = 'white';
            }
        }
    }

    nextLevel() {
        if(this.urlPartCounter == this.urlParts.length-1) {
            this.callback();
        } else {
            // load in appropriate fs
            this.fileExplorer.changeDir(this.urlParts[this.urlPartCounter++],
                                    this.animate.bind(this));
        }
    }
}

module.exports = ServerFilesystemAnimation;
