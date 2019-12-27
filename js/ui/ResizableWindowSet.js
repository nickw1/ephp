const Eventable = require('../http/Eventable');

class ResizableWindowSet extends Eventable {
    constructor(windows, vert=false) {
        super();
        this.elems = [];
        var i=0;
        for(let w of windows) {
            this.elems[i++] = w; 
        }
        this.vert = vert;
        this.setupResizeChanges();
    }

    // used this to help out here..
    // cssdeck.com/labs/d5u5fol7
    setup() {
        this.totalSpan = 0;
        var setupTime = new Date().getTime();
        for(var i=0; i<this.elems.length; i++) {
            this.totalSpan += this.vert? this.elems[i].offsetHeight: this.elems[i].offsetWidth;
            if(this.vert) console.log(`totalSpan=${this.totalSpan}`);
            if(i<this.elems.length - 1) {
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
                console.log(`Appending resizer to element with ID ${this.elems[i].id}`);
                this.elems[i].appendChild(resizer);
                resizer.addEventListener("mouseover", e =>  { document.body.style.cursor=this.vert? 'ns-resize':'ew-resize';} );
                resizer.addEventListener("mouseout", e =>  { document.body.style.cursor = 'auto'; } );
                resizer.addEventListener("mousedown", e => {
                    var index = parseInt(e.target.id.substring(2)) - setupTime;
                    this.elems[index].dragStartPos =     
                            this.vert? this.elems[index].offsetHeight:
                            this.elems[index].offsetWidth;
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
            var newHeight = (this.elems[index].dragStartPos + (e.clientY - origClientPos));
            this.elems[index].applyResizeHeight(newHeight);
        } else {
            var newWidth = (this.elems[index].dragStartPos + 
                    (e.clientX - origClientPos));
            this.elems[index].applyResizeWidth(newWidth);
        }

        // calculate width of all elements after the resize
        var actualTotalSpan  = 0;
        for(var j=0; j<this.elems.length; j++) { 
            actualTotalSpan += this.vert ? this.elems[j].offsetHeight:
                    this.elems[j].offsetWidth;
        }
        
        // resize remaining elements to fit into available space
        for(var j=index+1; j<this.elems.length; j++) { 
            if(this.vert) {
                var newHeight = this.elems[j].offsetHeight - 
                        ((actualTotalSpan-this.totalSpan)/
                            (this.elems.length-(index+1)));
                this.elems[j].applyResizeHeight(newHeight);
            } else {
                var newWidth = this.elems[j].offsetWidth - 
                        ((actualTotalSpan-this.totalSpan)/
                            (this.elems.length-(index+1)));
                this.elems[j].applyResizeWidth(newWidth);
            }
        }
    }

    dragend(e) {
        document.documentElement.removeEventListener("mousemove", this.realDrag);
        document.documentElement.removeEventListener("mouseup", this.dragend);
        document.body.style.cursor='auto';
        if(this.eventHandlers.finish) {
            this.eventHandlers.finish();
        }
    }

    showResizer(elem, doShow) {
        for(let curElem of this.elems) {
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
        for(var i=0; i<this.elems.length; i++) {
            this.totalSpan += this.vert? this.elems[i].offsetHeight: this.elems[i].offsetWidth;
        }
    }

    setupResizeChanges () {
        for(let elem of this.elems) {
            if(elem.querySelector("canvas")) {
                elem.applyResizeWidth = function(sz) {
                    this.style.width = sz + "px";
                    this.querySelector("canvas").width = sz;
                }
                elem.applyResizeHeight = function(sz) {
                    this.style.height = sz + "px";
                    this.querySelector("canvas").height = sz;
                }
            } else {
                elem.applyResizeWidth = function(sz) {
                    this.style.width = sz + "px";
                }
                elem.applyResizeHeight = function(sz) {
                    this.style.height = sz + "px";
                }
            }
        }
    }
}


module.exports = ResizableWindowSet;
