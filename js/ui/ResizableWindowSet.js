class ResizableWindowSet {
    constructor(windows, vert=false) {
        this.elem = [];
        var i=0;
        for(let w of windows) {
            this.elem[i++] = w; 
        }
        this.vert = vert;
        this.onFinishCallback = null;
    }

    setOnFinishCallback(cb) {
        this.onFinishCallback = cb;
    }

    // used this to help out here..
    // cssdeck.com/labs/d5u5fol7
    setup() {
        this.totalSpan = 0;
        var setupTime = new Date().getTime();
        for(var i=0; i<this.elem.length; i++) {
            this.totalSpan += this.vert? this.elem[i].offsetHeight: this.elem[i].offsetWidth;
            if(this.vert) console.log(`totalSpan=${this.totalSpan}`);
            if(i<this.elem.length - 1) {
                var resizer = document.createElement("div");
                resizer.style.backgroundColor = 'lightgray';
                resizer.style.border = '1px solid darkgray';
                resizer.style.position = 'absolute';
                resizer.setAttribute('class', 'resizer');
                resizer.style.width = resizer.style.height = '10px';
                if(this.vert) {
                    resizer.style.bottom = '-10px'
                    resizer.style.left = '50%';
                } else {
                    resizer.style.right = '-5px';
                    resizer.style.top = '50%';
                }
                resizer.id = "r_"+(setupTime+i);
                console.log(`Appending resizer to element with ID ${this.elem[i].id}`);
                this.elem[i].appendChild(resizer);
                resizer.addEventListener("mouseover", e =>  { document.body.style.cursor=this.vert? 'ns-resize':'ew-resize';} );
                resizer.addEventListener("mouseout", e =>  { document.body.style.cursor = 'auto'; } );
                resizer.addEventListener("mousedown", e => {
                    var index = parseInt(e.target.id.substring(2)) - setupTime;
                    this.elem[index].dragStartPos =     
                            this.vert? this.elem[index].offsetHeight:
                            this.elem[index].offsetWidth;
                    this.realDrag = this.drag.bind(this,index,
                                this.vert ? e.clientY: e.clientX);
                    document.body.style.cursor= this.vert? 'ns-resize' : 'ew-resize';
                    document.documentElement.addEventListener ("mousemove",this.realDrag); 
                    document.documentElement.addEventListener ("mouseup", this.dragend.bind(this));
                } );
            }
        }
    }

    drag(index, origClientPos, e) {
        if(this.vert) {
            var newHeight = (this.elem[index].dragStartPos + (e.clientY - origClientPos));
            this.elem[index].calcFullResizeHeight(newHeight);
        } else {
            var newWidth = (this.elem[index].dragStartPos + 
                    (e.clientX - origClientPos));
            this.elem[index].calcFullResizeWidth(newWidth);
        }

        // calculate width of all elements after the resize
        var actualTotalSpan  = 0;
        for(var j=0; j<this.elem.length; j++) { 
            actualTotalSpan += this.vert ? this.elem[j].offsetHeight:
                    this.elem[j].offsetWidth;
        }
        
        // resize remaining elements to fit into available space
        for(var j=index+1; j<this.elem.length; j++) { 
            if(this.vert) {
                var newHeight = this.elem[j].offsetHeight - 
                        ((actualTotalSpan-this.totalSpan)/
                            (this.elem.length-(index+1)));
                this.elem[j].calcFullResizeHeight(newHeight);
            } else {
                var newWidth = this.elem[j].offsetWidth - 
                        ((actualTotalSpan-this.totalSpan)/
                            (this.elem.length-(index+1)));
                this.elem[j].calcFullResizeWidth(newWidth);
            }
        }
    }

    dragend(e) {
        document.documentElement.removeEventListener("mousemove", this.realDrag);
        document.documentElement.removeEventListener("mouseup", this.dragend);
        document.body.style.cursor='auto';
        if(this.onFinishCallback) {
            this.onFinishCallback();
        }
    }

    showResizer(elem, doShow) {
        for(curElem of this.elem) {
            if(elem == curElem) {
                var resizer = elem.querySelector('.resizer');
                if(resizer) {
                    resizer.style.visibility = doShow? 'visible': 'hidden';    
                }
            }
        }
    }


    recalculateTotalSpan() {
        this.totalSpan = 0;
        for(var i=0; i<this.elem.length; i++) {
            this.totalSpan += this.vert? this.elem[i].offsetHeight: this.elem[i].offsetWidth;
        }
    }
}

ResizableWindowSet.addFullResize = function(elems) {
    for(elem of elems) {
        if(elem.querySelector("canvas")) {
            elem.calcFullResizeWidth = function(sz) {
                this.style.width = sz + "px";
                this.querySelector("canvas").width = sz;
            }
            elem.calcFullResizeHeight = function(sz) {
                this.style.height = sz + "px";
                this.querySelector("canvas").height = sz;
            }
        } else {
            elem.calcFullResizeWidth = function(sz) {
                this.style.width = sz + "px";
            }
            elem.calcFullResizeHeight = function(sz) {
                this.style.height = sz + "px";
            }
        }
    }
}

module.exports = ResizableWindowSet;
