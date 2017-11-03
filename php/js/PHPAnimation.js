
// ref sqlquery - this.data.sqlqueries[queeyIndex]

function PHPAnimation(options) {
	this.parentDiv = document.getElementById(options.divId);
    this.srcDiv = document.createElement("div");
	this.srcDiv.style.height = '50%';
	this.srcDiv.style.overflow = 'auto';
    this.callback = options.callback || null; 
    this.browserCallback = options.browserCallback || null;
    this.audio = new Audio('assets/sound/Game-Spawn.ogg');

    this.srcDivPos = {x:0, y:0};
    var elem = this.parentDiv;
    while(elem != null) {
        this.srcDivPos.x += elem.offsetLeft;
        this.srcDivPos.y += elem.offsetTop;
        elem = elem.offsetParent;
    }
    this.consoleWindow = document.createElement("div");
	this.consoleWindow.innerHTML += "<strong>--Console--</strong><br />";
	this.consoleWindowInner = document.createElement("div");
	this.consoleWindow.appendChild(this.consoleWindowInner);
	this.varWindow = document.createElement("div");
	this.varWindow.innerHTML += "<strong>--Vars--</strong><br />";
	this.varWindowInner = document.createElement("div");
	this.varWindow.appendChild(this.varWindowInner);
	this.dbWindow = document.createElement("div");
	this.dbWindow.innerHTML += "<strong>DB Results:</strong><br />";
	this.dbWindowInner = document.createElement("div");
	this.dbWindow.appendChild(this.dbWindowInner);
	this.consoleWindow.setAttribute("class","srcconsole");
	this.varWindow.setAttribute("class","srcvar");
	this.dbWindow.setAttribute("class","srcdb");


	this.varsBox = new VarsBox(this.varWindowInner);

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
		this.dbWindowInner.innerHTML = this.consoleWindowInner.innerHTML = "";
		this.varsBox.reset();
		this.dbResults.reset();
        while(this.parentDiv.childNodes.length > 0) {
			var d = this.parentDiv.firstChild;
            this.parentDiv.removeChild(d);
        }

        for(var i=0; i<this.originalDivContents.length; i++) {
            this.parentDiv.appendChild(this.originalDivContents[i]); 
        }
        this.parentDiv.classList.remove("serverCode");
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
	this.srcDiv.innerHTML = "";
	this.consoleWindow.style.display = 'block';
	this.varWindow.style.display = 'block';
	this.dbWindow.style.display = 'block';
    var codeLines = data.src || [];
    this.isRunning = true;
    if(true) {
        // If showing some other code from a previous request, blank out the
        // div, otherwise save the original contents
        if(this.showing) {
            this.parentDiv.innerHTML = "";
        } else {
            this.showing=true;
            this.originalDivContents = [];
            while(this.parentDiv.childNodes.length > 0) {    
                this.originalDivContents.push(this.parentDiv.firstChild);
                this.parentDiv.removeChild(this.parentDiv.firstChild);
            }
            this.parentDiv.classList.add("serverCode");
			this.parentDiv.appendChild(this.srcDiv);
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
              this.srcDiv.appendChild(lineNoSpan);
              line.appendChild(document.createTextNode(codeLines[i]));
              this.srcDiv.appendChild(line);
              this.srcDiv.appendChild(document.createElement("br"));
              this.codeLines.push(line);
            }
        }
		this.parentDiv.appendChild(this.btndiv);
		this.parentDiv.appendChild(this.dbWindow);
		this.parentDiv.appendChild(this.consoleWindow);
		this.parentDiv.appendChild(this.varWindow);

        return true;
    }
}

PHPAnimation.prototype.handleLine = function(data) {
    this.unhighlightLastLine();
    this.highlightLine(data.lineno);
	for(varName in data.vars) {
		switch(data.vars[varName]) {
			case 'string':
			case 'int':
			case 'float':
			case 'bool':
				this.varsBox.setVar(varName, data.vars[varName].value);
				break;
		}
	}
    if(this.varsBox) {
        this.varsBox.setMultipleVars(data.vars);
    }
}

PHPAnimation.prototype.handleNewRow = function(data) {
	console.log("handleNewRow(): id="+data);
	this.dbResults.highlightRow(data);
}

PHPAnimation.prototype.handleStdout = function(data)  {
    // TODO handle stdout sent from the debugger
	if(this.consoleWindow!==null) {
		this.consoleWindowInner.innerHTML += data.replace("<","&lt;").
				replace(">","&gt;").replace("\n","<br />")+"<br />";
	}
}

PHPAnimation.prototype.handleDBResults = function(data) {
	this.dbResults.showResults(data, this.dbWindowInner);
}

PHPAnimation.prototype.handleDBError = function(data) {
	alert('Error with SQL statement: ' + data);
}

PHPAnimation.prototype.handleStop = function() {
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
       this.consoleWindow.style.display='none';
        if(this.showing) {
            //this.srcDiv.removeChild(this.consoleWindow);
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
