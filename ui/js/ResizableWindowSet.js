
function ResizableWindowSet(windows, vert=false) {
    this.elem = [];
    var i=0;
    for(winid of windows) {
        this.elem[i++] = document.getElementById(winid);
    }
    this.vert = vert;
	this.onFinishCallback = null;
}

ResizableWindowSet.prototype.setOnFinishCallback = function(cb) {
	this.onFinishCallback = cb;
}

// used this to help out here..
// cssdeck.com/labs/d5u5fol7
ResizableWindowSet.prototype.setup = function() {
    this.totalSpan = 0;
    for(var i=0; i<this.elem.length; i++) {
        this.totalSpan += this.vert? this.elem[i].offsetHeight: 
                    this.elem[i].offsetWidth;
        var resizer = document.createElement("div");
        resizer.style.backgroundColor = 'lightgray';
        resizer.style.border = '1px solid darkgray';
        resizer.style.width = resizer.style.height = '10px';
        resizer.style.position = 'absolute';
        if(this.vert) {
            resizer.style.bottom = '-5px';
            resizer.style.right = '50%';
        } else {
            resizer.style.right = '-5px';
            resizer.style.top = '50%';
        }
        resizer.id = "r_"+i;
        console.log("i="+i+" elem="+this.elem[i].id);
        this.elem[i].appendChild(resizer);
        resizer.addEventListener("mouseover", e =>  
            { document.body.style.cursor=this.vert? 'ns-resize':'ew-resize';} );
        resizer.addEventListener("mouseout", e =>  
            { document.body.style.cursor = 'auto'; } );
        resizer.addEventListener("mousedown", e => {
                        var index = parseInt(e.target.id.substring(2));
                        this.elem[index].dragStartPos =     
                            this.vert? this.elem[index].offsetHeight:
                            this.elem[index].offsetWidth;
                        this.realDrag = this.drag.bind(this,index,
                                this.vert ? e.clientY: e.clientX);
                        document.body.style.cursor=
                            this.vert? 'ns-resize' : 'ew-resize';
                        document.documentElement.addEventListener
                            ("mousemove",this.realDrag); 
                        document.documentElement.addEventListener
                            ("mouseup", this.dragend.bind(this));
                    } );

        
    }
}

ResizableWindowSet.prototype.drag = function(index, origClientPos, e) {
        if(this.vert) {
            this.elem[index].style.height = 
                    (this.elem[index].dragStartPos + 
                    (e.clientY - origClientPos)) + "px";
        } else {
            this.elem[index].style.width = 
                    (this.elem[index].dragStartPos + 
                    (e.clientX - origClientPos)) + "px";
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
                this.elem[j].style.height = 
                        this.elem[j].offsetHeight - 
                        ((actualTotalSpan-this.totalSpan)/
                            (this.elem.length-(index+1))) + "px";
            } else {
                this.elem[j].style.width = 
                    this.elem[j].offsetWidth - 
                        ((actualTotalSpan-this.totalSpan)/
                            (this.elem.length-(index+1))) + "px";
            }
        }
}

ResizableWindowSet.prototype.dragend = function(e) {
    document.documentElement.removeEventListener("mousemove", this.realDrag);
    document.documentElement.removeEventListener("mouseup", this.dragend);
    document.body.style.cursor='auto';
	if(this.onFinishCallback) {
		this.onFinishCallback();
	}
}
