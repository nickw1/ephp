
function Draggable(elem) {
    this.elem = elem;
    this.onFinishCallback = null;
}

Draggable.prototype.setOnFinishCallback = function(cb) {
    this.onFinishCallback = cb;
}

// used this to help out here..
// cssdeck.com/labs/d5u5fol7
Draggable.prototype.setup = function() {
    var dragger = document.createElement("div");
    dragger.style.backgroundColor = 'lightgray';
    dragger.style.border = '1px solid darkgray';
    dragger.style.width = dragger.style.height = '16px';
    dragger.style.position = 'absolute';
	dragger.style.left='50%';
	dragger.style.top = '-8px';
    this.elem.appendChild(dragger);
    dragger.addEventListener("mouseover", e =>  
            { document.body.style.cursor='move';} );
    dragger.addEventListener("mouseout", e =>  
            { document.body.style.cursor = 'auto'; } );
    dragger.addEventListener("mousedown", e => {
						this.initElemLeft = this.elem.offsetLeft;
						this.initElemTop = this.elem.offsetTop;
						this.origMouseX = e.pageX;
						this.origMouseY = e.pageY;
                        this.realDrag = this.drag.bind(this);
                        document.body.style.cursor= 'move';
                        document.documentElement.addEventListener
                            ("mousemove",this.realDrag);
                        document.documentElement.addEventListener
                            ("mouseup", this.dragend.bind(this));
                    } );
}

Draggable.prototype.drag = function(e) {
    var newLeft = (e.pageX-this.origMouseX)+this.initElemLeft;
    var newTop = (e.pageY-this.origMouseY)+this.initElemTop;
    if(newLeft>0 && newTop>0 &&
        newLeft<this.elem.offsetParent.offsetWidth-this.elem.offsetWidth 
        && newTop<this.elem.offsetParent.offsetHeight-this.elem.offsetHeight) {
        
        this.elem.style.left = newLeft+"px";    
        this.elem.style.top = newTop+"px";    
    }
}

Draggable.prototype.dragend = function(e) {
	console.log("***dragend***");
    document.documentElement.removeEventListener("mousemove", this.realDrag);
    document.documentElement.removeEventListener("mouseup", this.dragend);
    document.body.style.cursor='auto';
    if(this.onFinishCallback) {
        this.onFinishCallback();
    }
}
