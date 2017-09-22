
// ref sqlquery - this.data.sqlqueries[queeyIndex]

function PHPAnimation(options) {
    this.div = document.getElementById(options.divId);
    this.callback = options.callback || null; 
    this.browserCallback = options.browserCallback || null;
    this.audio = new Audio('assets/sound/Game-Spawn.ogg');

    this.divPos = {x:0, y:0};
    var elem = this.div;
    while(elem != null) {
        this.divPos.x += elem.offsetLeft;
        this.divPos.y += elem.offsetTop;
        elem = elem.offsetParent;
    }
    this.tooltip = document.createElement("div");
    this.tooltip.style.backgroundColor = '#ffffc0';
    this.tooltip.style.border = '1px solid black';
    this.tooltip.style.font = '10pt Helvetica';
//    this.tooltip.style.height='16px';
    this.tooltip.style.position='absolute';
    this.tooltip.style.left = this.tooltip.style.top = '0px';

    this.loopAnimation = new LoopAnimation(this);
    this.dbAnimation = options.dbAnimation || null;

    this.interval = options.interval || 1000;
    this.timer=null;
    this.showing=false;
    this.isRunning=false;

	this.codeLines = [];

    this.setupGUI();
}

PHPAnimation.prototype.colours = 
    ['yellow', '#00ff00', 'cyan', '#ff80ff', '#ff8080', 'orange'];

PHPAnimation.prototype.getLines = function() {
    return this.codeLines;
}


PHPAnimation.prototype.setCallback = function(callback) {
    this.callback = callback;
}

PHPAnimation.prototype.setupGUI = function() {
    this.btndiv = document.createElement("div");
    var btn = document.createElement("input");
    btn.setAttribute("type","button");
    btn.setAttribute("value","Run PHP and send back output");
    btn.addEventListener("click", ()=> {
        this.showing=false;
        while(this.div.childNodes.length > 0) {
            this.div.removeChild(this.div.firstChild);
        }
        for(var i=0; i<this.originalDivContents.length; i++) {
            this.div.appendChild(this.originalDivContents[i]); 
        }
        this.div.classList.remove("serverCode");
        if(this.callback) {
            this.callback();
        }

        }); 

    var slider = new Slider(2000, 10, {
        onchange: (value)=> {
            this.interval = value;
            this.loopAnimation.interval = value;
        } ,

        parent: this.btndiv
        } );
    slider.setValue(this.interval);

    this.btndiv.appendChild(document.createElement("br"));
    this.btndiv.appendChild(btn);    
}

// this now just shows the source codee codeLines
// codeLines is now an array of codeLines
PHPAnimation.prototype.showSrc = function(data) {
	var codeLines = data.src || [];
    this.isRunning = true;
	if(true) {
        // If showing some other code from a previous request, blank out the
        // div, otherwise save the original contents
        if(this.showing) {
            this.div.innerHTML = "";
        } else {
            this.showing=true;
            this.originalDivContents = [];
            while(this.div.childNodes.length > 0) {    
                this.originalDivContents.push(this.div.firstChild);
                this.div.removeChild(this.div.firstChild);
            }
            this.div.classList.add("serverCode");
        }

        this.codeLines = [];
        this.varComments = [];
        var curVar=0, curLoopVar=0, line;
        if(true) {
            var lineNoText, lineNoSpan;
            for(var i=0; i<codeLines.length; i++) {
              lineNoText = ""+(i+1);
             
              while(lineNoText.length<3) {
                lineNoText="0"+lineNoText;
              }
              lineNoSpan = document.createElement("span");
              lineNoSpan.setAttribute("class", "lineNumber");
              lineNoSpan.appendChild(document.createTextNode(lineNoText));
              line = document.createElement("span");
              line.setAttribute("class", "code");
              this.div.appendChild(lineNoSpan);
              line.appendChild(document.createTextNode(codeLines[i]));
			  this.div.appendChild(line);
              this.div.appendChild(document.createElement("br"));
              this.codeLines.push(line);
            }
        }
        this.div.appendChild(this.btndiv);
        this.div.appendChild(this.tooltip);
        return true;
    }
}

PHPAnimation.prototype.handleLine = function(data) {
	this.unhighlightLastLine();
	this.highlightLine(data.lineno);
	console.log("Line command: " + data.lineno);
	if(this.varsBox) {
		this.varsBox.display(data.vars);
	}
}

PHPAnimation.prototype.handleNewRow = function(data) {
// row: {type:"array", "value": { array }
	var id = data;

}

PHPAnimation.prototype.highlightLine = function(line) {
        this.codeLines[line-1].classList.add("lineHighlight");
		this.lastLine = this.codeLines[line-1]; 
}

PHPAnimation.prototype.unhighlightLastLine = function(line) {
		if(this.lastLine) {
        	this.lastLine.classList.remove("lineHighlight");
		}
}


PHPAnimation.prototype.stop = function() {
    this.clearTimer();
    if(this.isRunning) {
        this.tooltip.style.display='none';
        if(this.showing) {
            this.div.removeChild(this.tooltip);
        }
        this.isRunning = false;
    }
    this.loopAnimation.stop();
}

PHPAnimation.prototype.clearTimer = function() {
    if(this.timer!=null) {
        clearTimeout(this.timer);
        this.timer=null;
    }
}
