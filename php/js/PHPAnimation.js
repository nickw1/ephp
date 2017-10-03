
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
    this.consoleWindow = document.createElement("div");

	this.consoleWindow.style.backgroundColor = 'black';
	this.consoleWindow.style.color = 'white';
	this.consoleWindow.style.border = '1px solid black';
	this.consoleWindow.style.font = '10pt Courier New';
	this.consoleWindow.style.position = 'absolute';
	this.consoleWindow.style.left = '0px';
	this.consoleWindow.style.top = '0px';
	this.consoleWindow.style.width = '800px';
	this.consoleWindow.style.overflow = 'auto';
	this.consoleWindow.style.display = 'none';
	this.consoleWindow.style.zIndex = 2;

	this.varWindow = document.createElement("div");

	this.varWindow.style.backgroundColor = 'blue';
	this.varWindow.style.color = 'yellow';
	this.varWindow.style.border = '1px solid black';
	this.varWindow.style.font = '10pt Courier New';
	this.varWindow.style.position = 'absolute';
	this.varWindow.style.left = '200px';
	this.varWindow.style.top = '200px';
	this.varWindow.style.width = '200px';
	this.varWindow.style.overflow = 'auto';
	this.varWindow.style.display = 'none';
	this.varWindow.style.zIndex = 3;

	this.varWindow.innerHTML += "<strong>--Vars--</strong><br />";
	
	this.dbWindow = document.createElement("div");

	this.dbWindow.style.backgroundColor = '#ffffc0';
	this.dbWindow.style.color = 'black';
	this.dbWindow.style.border = '1px solid black';
	this.dbWindow.style.font = '10pt Helvetica';
	this.dbWindow.style.position = 'absolute';
	this.dbWindow.style.left = '300px';
	this.dbWindow.style.top = '300px';
	this.dbWindow.style.width = '800px';
	this.dbWindow.style.overflow = 'auto';
	this.dbWindow.style.display = 'none';
	this.dbWindow.style.zIndex = 4;

	this.varsBox = new VarsBox(this.varWindow);

    this.dbResults = new DBResults(this);
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
	this.consoleWindow.style.display = 'block';
	this.varWindow.style.display = 'block';
	this.dbWindow.style.display = 'block';
	console.log("consoleWindow: settiong display blick");
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
		this.div.appendChild(this.consoleWindow);
		this.consoleWindow.style.display = 'block';
		console.log("consoleWindow: settiong display blick");

		this.div.appendChild(this.varWindow);
		this.div.appendChild(this.dbWindow);

        return true;
    }
}

PHPAnimation.prototype.handleLine = function(data) {
    this.unhighlightLastLine();
    this.highlightLine(data.lineno);
	for(varName in data.vars) {
		switch(data.vars[varName]) {
			case 'string':
				this.varsBox.setVar(varName, data.vars[varName].value);
				break;
		}
	}
    if(this.varsBox) {
        this.varsBox.setMultipleVars(data.vars);
    }
}

PHPAnimation.prototype.handleNewRow = function(data) {
	console.log("handleNewRow(): " + data);
	this.dbResults.highlightRow(data);
}

PHPAnimation.prototype.handleStdout = function(data)  {
	console.log("Stdout command: " + data);
    // TODO handle stdout sent from the debugger
	if(this.consoleWindow!==null) {
		this.consoleWindow.innerHTML += data.replace("\n","<br />");
	}
}

PHPAnimation.prototype.handleDBResults = function(data) {
	this.dbResults.showResults(data, this.dbWindow);
}

PHPAnimation.prototype.handleStop = function() {
	console.log("STOP received");
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
		console.log("consoleWindow display none");	
       this.consoleWindow.style.display='none';
        if(this.showing) {
            this.div.removeChild(this.consoleWindow);
        }
	
        this.isRunning = false;
    }
}

PHPAnimation.prototype.clearTimer = function() {
    if(this.timer!=null) {
        clearTimeout(this.timer);
        this.timer=null;
    }
}
