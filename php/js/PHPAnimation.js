
// ref sqlquery - this.data.sqlqueries[queryIndex]

function PHPAnimation(options) {
    this.parentDiv = document.getElementById(options.divId);
    this.srcDiv = document.createElement("div");
    this.srcDiv.style.position = 'relative';
    this.srcDiv.style.height = '50%';
    this.srcDiv.style.overflow = 'auto';
    this.callback = options.callback || null; 
    this.browserCallback = options.browserCallback || null;
    this.audio = new Audio('assets/sound/Game-Spawn.ogg');
    this.dbgMsgQueue = new DbgMsgQueue(this, 500, 
            { onStart:()=> {
                this.runBtn.setAttribute("disabled", "disabled");
                },
              onStop: ()=>{
                this.runBtn.removeAttribute("disabled");
                }
            });

    var elem = this.parentDiv;
    this.getSrcDivPos = function(elem) {
        var srcDivPos = {x:0, y:0};
        while(elem != null) {
            srcDivPos.x += elem.offsetLeft;
            srcDivPos.y += elem.offsetTop;
            elem = elem.offsetParent;
        }
        return srcDivPos;
    }
    this.srcDivPos = this.getSrcDivPos(this.parentDiv);

    this.varWindow = document.createElement("div");
    this.outputWindow = document.createElement("div");

    var varDraggable = new Draggable(this.varWindow), 
            consDraggable = new Draggable(this.outputWindow);

    this.varWindow.innerHTML += "<strong>--Vars--</strong><br />";
    this.varWindowInner = document.createElement("div");
    this.varWindow.appendChild(this.varWindowInner);
    this.varWindow.setAttribute("id", "_var_window_" + new Date().getTime());

    this.outputWindow.innerHTML += "<strong>--Output--</strong><br />";
    this.outputWindowInner = document.createElement("div");
    this.outputWindow.appendChild(this.outputWindowInner);
    this.outputWindow.setAttribute
        ("id", "_cons_window_" + new Date().getTime());

    varDraggable.setup();
    consDraggable.setup();

    this.dbWindow = document.createElement("div");
    this.dbWindow.style.position = 'relative';
    this.dbWindow.innerHTML += "<strong>DB Results:</strong><br />";
    this.dbWindowInner = document.createElement("div");
    this.dbWindow.appendChild(this.dbWindowInner);

    this.outputWindow.setAttribute("class","srcconsole");
    this.varWindow.setAttribute("class","srcvar");
    this.dbWindow.setAttribute("class","srcdb");


    // TODO this isn't currently working - not an issue with vertical as a
    // test page works with a vertical resizable window set. Not just 
    // missing position:relative either. Resizers appear but will not resize
    // the window, setting element.style.height=...px does not change the height
    ResizableWindowSet.addFullResize([this.srcDiv, this.dbWindow]);
    var rsz = new ResizableWindowSet([this.srcDiv, this.dbWindow], true);
    rsz.setup();


    this.parentDiv.addEventListener("dragover", (e)=> {
            e.preventDefault();
    });
    this.varsBox = new VarsBox(this.varWindowInner);

    this.dbResults = new DBResults(this);
    this.dbAnimation = options.dbAnimation || null;

    this.interval = options.interval || 1000;
    this.showing=false;

    this.codeLines = [];

    this.colourCount = 0;

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
    this.controlsDiv = document.createElement("div");
    this.setupControls(this.controlsDiv);
    this.btndiv = document.createElement("div");
    this.runBtn = document.createElement("input");
    this.runBtn.setAttribute("type","button");
    this.runBtn.setAttribute("value","Send back output from PHP");
    this.runBtn.addEventListener("click", ()=> {
        this.showing=false;
        this.dbWindowInner.innerHTML = this.outputWindowInner.innerHTML = "";
        this.varsBox.reset();
        this.dbResults.reset();
        this.dbgMsgQueue.clear();
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

    this.btndiv.appendChild(document.createElement("br"));
    this.btndiv.appendChild(this.runBtn);    
    
}

// this now just shows the source codee codeLines
// codeLines is now an array of codeLines
PHPAnimation.prototype.showSrc = function(data) {
    this.srcDiv.innerHTML = "";
    this.outputWindow.style.display = 'block';
    this.varWindow.style.display = 'block';
    this.dbWindow.style.display = 'block';
    var codeLines = data.src || [];
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
        this.colourCount = 0;

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
        this.parentDiv.appendChild(this.dbWindow);
        this.parentDiv.appendChild(this.controlsDiv);
        this.parentDiv.appendChild(this.btndiv);
        this.parentDiv.appendChild(this.outputWindow);
        this.parentDiv.appendChild(this.varWindow);

        return true;
    }
}

PHPAnimation.prototype.handleLine = function(data) {
    this.unhighlightLastLine();
    this.highlightLine(data.lineno);
    for(varName in data.vars) {
        switch(data.vars[varName].type) {
            case 'string':
            case 'int':
            case 'float':
            case 'bool':
                this.varsBox.setVar(varName, data.vars[varName].value);
                if(data.vars[varName].httpvar) {
                    this.addVarComment(data.vars[varName].httpvar.lineno,
                        data.vars[varName].value,     
                        data.vars[varName].httpvar.name);
                }
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
    if(this.outputWindow!==null) {
        this.outputWindowInner.innerHTML += data.replace(/</g,"&lt;").
                replace(/>/g,"&gt;").replace(/\\n/g,"<br />")+"<br />";
    }
}

PHPAnimation.prototype.handleDBResults = function(data) {
    console.log("handleDBResults: "+ JSON.stringify(data));
    this.dbResults.showResults(data, this.dbWindowInner);
}

PHPAnimation.prototype.handleDBError = function(data) {
    console.log('******Error with SQL statement: ' + JSON.stringify(data));
    alert(`Error with SQL statement on line ${data.lineno}: `+
            `${data.msg}`);
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

PHPAnimation.prototype.setupControls = function(div) {



    var pause = document.createElement("img");
    pause.setAttribute("alt", "Pause Loop");
    pause.setAttribute("src", "assets/images/control_pause_blue.2.png");                            
    var play = document.createElement("img");
    play.setAttribute("alt", "Play/Resume Loop");
    play.setAttribute("src", "assets/images/control_play_blue.2.png");

    var rewind = document.createElement("img");
    rewind.setAttribute("alt", "Rewind Loop");
    rewind.setAttribute("src", "assets/images/control_rewind_blue.2.png");                            
    pause.addEventListener("click", (e)=> {this.dbgMsgQueue.stop() });
    play.addEventListener("click", (e)=> {this.dbgMsgQueue.start() });
    rewind.addEventListener("click", (e)=> {this.dbgMsgQueue.rewind() });

    div.appendChild(pause);
    div.appendChild(play);
    div.appendChild(rewind);

    var slider = new Slider(2000, 50, {
        onchange: (value)=> {
            this.dbgMsgQueue.setInterval(value);
        },
        width: '400px',
        parent: div} );
    slider.setValue(this.dbgMsgQueue.getInterval());
}

PHPAnimation.prototype.addToQueue = function(msg) {
    this.dbgMsgQueue.add(msg);
}

PHPAnimation.prototype.clearQueue = function() {
    this.dbgMsgQueue.clear();
}

PHPAnimation.prototype.addVarComment = function(lineno,value,httpvar){
    if(!this.varComments[lineno]) {
		this.audio.play();
        console.log(`addVarComment: ${lineno} ${value} ${httpvar}`);
        var comment = document.createElement("code");
        comment.appendChild(document.createTextNode("//"+value));
        comment.style.backgroundColor = this.colours[this.varComments.length%
                this.colours.length];
        this.codeLines[lineno-1].appendChild(comment);
        this.browserCallback(httpvar, this.colours[this.varComments.length 
            %this.colours.length]);
        this.varComments[lineno]=value;
    }
}
