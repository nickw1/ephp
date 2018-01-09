
function ComponentAnimator (totalTime, interval, minWidth, elemIds) {
    this.elem = [];
    this.origWidths = [];
    this.midSteps = [];

    var i=0;
    for(elemId of elemIds) {
        this.elem[i++] = document.getElementById(elemId);
    }

    this.interval = interval;
    this.nSteps = totalTime / this.interval;

    // noete canvas doesn't exist here yet
    // does exist on doAnim though
    this.minWidth = minWidth;

    this.timer = null;
    this.ignored = null;

    this.isAlteredState = false;
}

ComponentAnimator.prototype.startForwardAnim = function(cb) {
    if(this.timer == null) {
        this.recalculateDimensions();
        this.timer = setInterval(this.doAnim.bind(this, 1, cb), this.interval);
        this.isAlteredState = true;
    }
}

ComponentAnimator.prototype.startReverseAnim = function(cb) {
    if(this.midSteps[1] < 0.0001) {
        console.log('WARNING! midSteps is 0');
    } else {
        if(this.timer == null) {
            this.timer = setInterval(this.doAnim.bind(this, -1, cb), 
                this.interval);
            for(var i=0; i<this.elem.length; i++) {
                if(this.elem[i] != this.ignored) {
                    this.elem[i].style.display = 'inline-block';
                }
            }
        }        
    }
}

// offseWidth includes border; without this the animation won't work
// correctly
ComponentAnimator.prototype.doAnim = function (direction, cb) {

    var grower = direction==-1 ? this.elem[0] : this.elem[this.elem.length-1];
    var shrinker = direction==-1 ? this.elem[this.elem.length-1]: this.elem[0];

    shrinker.fullResizeWidth(shrinker.offsetWidth-this.endsStep);
    var growerWidth = grower.offsetWidth + this.endsStep;
    for(var i=1; i<this.elem.length-1; i++) {
        if(this.elem[i] != this.ignored) {
            this.elem[i].fullResizeWidth
                (this.elem[i].offsetWidth- (this.midSteps[i]*direction));
        }
    
        growerWidth += this.midSteps[i];
    }
    grower.fullResizeWidth(growerWidth);
    
    if(document.getElementById(shrinker.id+"_img")) {
        document.getElementById(shrinker.id+"_img").width = 
            (shrinker.offsetWidth> 75 ? 75: shrinker.offsetWidth);
    }
    for(var i=1; i<this.elem.length-1; i++) {
        if(this.elem[i] != this.ignored) {
            if(document.getElementById(this.elem[i].id+"_img")) {
                document.getElementById(this.elem[i].id+"_img").width = 
                (this.elem[i].offsetWidth> 75 ? 75: this.elem[i].offsetWidth);
            }
            
        }
    }

    if(direction==1 && this.elem[0].offsetWidth<this.minWidth) {
        this.elem[0].fullResizeWidth(this.minWidth);
        for(var i=1; i<this.elem.length-1; i++) {
            if(this.elem[i] != this.ignored) {
                this.elem[i].fullResizeWidth(this.minWidth* 
                    (this.origWidths[i]/this.origWidths[0]));
            }
        }
        this.finishAnim(cb);
    } else if (direction==-1 && this.elem[0].offsetWidth> this.origWidths[0]) {
        this.elem[0].fullResizeWidth(this.origWidths[0]);
        for(var i=1; i<this.elem.length-1; i++) {
            if(this.elem[i] != this.ignored) {
                this.elem[i].fullResizeWidth(this.origWidths[i]);
            }
        }
        this.elem[this.elem.length-1].fullResizeWidth
            (this.origWidths[this.origWidths.length-1]);
        this.isAlteredState = false;
        this.finishAnim(cb);
    }
}

ComponentAnimator.prototype.finishAnim = function (cb) {
    clearTimeout(this.timer);
    this.timer = null;
    if(cb) {
        cb();
    }
}

ComponentAnimator.prototype.recalculateDimensions = function() {
    if(!this.isAlteredState) {
        this.endsStep = Math.round((this.elem[0].offsetWidth-this.minWidth) / 
            this.nSteps);
        for(var i=0; i<this.elem.length; i++) {
            this.origWidths[i] = this.elem[i].offsetWidth;
            if(i>=1 && i<this.elem.length-1) {
                this.midSteps[i]=this.endsStep*
                (this.elem[i].offsetWidth/this.elem[0].offsetWidth);
            }
        }
    }
}

ComponentAnimator.prototype.setIgnored = function(elem) {
    this.ignored = elem;
}
