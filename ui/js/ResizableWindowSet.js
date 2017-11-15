
function ResizableWindowSet(windows, vert=false) {
    this.elem = [];
    var i=0;
    for(win of windows) {
        this.elem[i++] = win; 
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
	var setupTime = new Date().getTime();
    for(var i=0; i<this.elem.length; i++) {
        this.totalSpan += this.vert? this.elem[i].offsetHeight: 
                    this.elem[i].offsetWidth;
		if(i<this.elem.length - 1) {
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
        resizer.id = "r_"+(setupTime+i);
		console.log("appending to : " + this.elem[i].id);
        this.elem[i].appendChild(resizer);
        resizer.addEventListener("mouseover", e =>  
            { document.body.style.cursor=this.vert? 'ns-resize':'ew-resize';} );
        resizer.addEventListener("mouseout", e =>  
            { document.body.style.cursor = 'auto'; } );
        resizer.addEventListener("mousedown", e => {
                        var index = parseInt(e.target.id.substring(2)) -
							setupTime;
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
}

ResizableWindowSet.prototype.drag = function(index, origClientPos, e) {
//		var canvas = this.elem[index].querySelector("canvas");
        if(this.vert) {
			var newHeight = (this.elem[index].dragStartPos + 
                    (e.clientY - origClientPos));
			/*
            this.elem[index].style.height =  newHeight + "px";
			if(canvas) {
				canvas.height = newHeight;
			}
			*/
			this.elem[index].fullResizeHeight(newHeight);
        } else {
			var newWidth = (this.elem[index].dragStartPos + 
                    (e.clientX - origClientPos));
			/*
            this.elem[index].style.width = newWidth + "px";
			if(canvas) {	
				canvas.width = newWidth;
			}
			*/
			this.elem[index].fullResizeWidth(newWidth);
        }

        // calculate width of all elements after the resize
        var actualTotalSpan  = 0;
        for(var j=0; j<this.elem.length; j++) { 
            actualTotalSpan += this.vert ? this.elem[j].offsetHeight:
                    this.elem[j].offsetWidth;
        }
        
        // resize remaining elements to fit into available space
        for(var j=index+1; j<this.elem.length; j++) { 
			var canvas = this.elem[j].querySelector("canvas");
            if(this.vert) {
				var newHeight = this.elem[j].offsetHeight - 
                        ((actualTotalSpan-this.totalSpan)/
                            (this.elem.length-(index+1)));
				/*
                this.elem[j].style.height = newHeight + "px";
				if(canvas) {
					canvas.height = newHeight;
				}
				*/
				this.elem[j].fullResizeHeight(newHeight);
            } else {
				var newWidth = this.elem[j].offsetWidth - 
                        ((actualTotalSpan-this.totalSpan)/
                            (this.elem.length-(index+1)));
				/*
                this.elem[j].style.width = newWidth + "px";
				if(canvas) {
					canvas.width = newWidth;
				}
				*/
				this.elem[j].fullResizeWidth(newWidth);
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

ResizableWindowSet.addFullResize = function(elems) {
	for(elem of elems) {
		if(elem.querySelector("canvas")) {
			// TODO this is working with width but not height - at least it's
			// not working with the three windows in the server view
			elem.fullResizeWidth = function(sz) {
				this.style.width = sz + "px";
				this.querySelector("canvas").width = sz;
			}
			elem.fullResizeHeight = function(sz) {
				this.style.height = sz + "px";
				this.querySelector("canvas").height = sz;
			}
		} else {
			elem.fullResizeWidth = function(sz) {
				this.style.width = sz + "px";
			}
			elem.fullResizeHeight = function(sz) {
				this.style.height = sz + "px";
			}
		}
	}
}
