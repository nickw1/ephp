
// ref sqlquery - this.data.sqlqueries[queryIndex]

const DbgMsgQueue = require('./DbgMsgQueue');
const VarsBox = require('./VarsBox');
const DBResults = require('./DBResults');
const Slider = require('../ui/Slider');

class PHPAnimation {
    constructor(options) {
        this.parentDiv = document.getElementById(options.divId);
        this.srcDiv = document.createElement("div");
        this.srcDiv.style.position = 'relative';
        this.srcDiv.style.height = '75%';
        this.srcDiv.style.overflow = 'auto';
        this.callback = options.callback || null; 
        this.browserCallback = options.browserCallback || null;
        this.audio = new Audio('assets/sound/Game-Spawn.ogg');
        this.dbgMsgQueue = new DbgMsgQueue(this, 500, 
            { onStart:()=> {
                this.runBtn.setAttribute("disabled", "disabled");
                this.outputWindow.innerHTML = "";
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

        this.varWindow = document.getElementById("varsInner");
        this.outputWindow = document.getElementById("logInner");

        this.dbWindow = document.getElementById("dbInner");


        this.parentDiv.addEventListener("dragover", (e)=> {
            e.preventDefault();
        });
        this.varsBox = new VarsBox(this.varWindow);

        this.dbResults = new DBResults(this);
        this.dbAnimation = options.dbAnimation || null;

        this.interval = options.interval || 1000;
        this.showing=false;

        this.codeLines = [];

        this.colourCount = 0;

        this.httpVars = {};

        this.setupGUI();
    }


    getLines() {
        return this.codeLines;
    }


    setCallback(callback) {
        this.callback = callback;
    }

    setupGUI() {
        this.controlsDiv = document.createElement("div");
        this.setupControls(this.controlsDiv);
        this.btndiv = document.createElement("div");
        this.runBtn = document.createElement("input");
        this.runBtn.setAttribute("type","button");
        this.runBtn.setAttribute("value","Send back output from PHP");
        this.runBtn.addEventListener("click", ()=> {
            this.showing=false;
            this.dbWindow.innerHTML = this.outputWindow.innerHTML = "";
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

    showSrc(data) {
        this.srcDiv.innerHTML = "";
        this.outputWindow.style.display = 'block';
        var codeLines = data.src || [];

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
        this.parentDiv.appendChild(this.controlsDiv);
        this.parentDiv.appendChild(this.btndiv);

        return true;
    }


    handleLine(data) {
        this.unhighlightLastLine();
        this.highlightLine(data.lineno);
    
        let http = null;    
        if((http = this.extractHttpVar(this.codeLines[data.lineno - 1].firstChild.nodeValue)) !== null) {
            this.httpVars[http.phpVar] = { lineno: data.lineno, httpVar: http.httpVar}; 
        }

        for(let varName in data.vars) {
            switch(data.vars[varName].type) {
                case 'string':
                case 'int':
                case 'float':
                case 'bool':
                    if(this.httpVars[varName] && !this.httpVars[varName].done) {
                        this.addVarComment(this.httpVars[varName].lineno, data.vars[varName].value, this.httpVars[varName].httpVar);
                        this.httpVars[varName].done = true;
                    }
                    this.varsBox.setVar(varName, data.vars[varName].value);
                    break;

                case 'array':
                    this.varsBox.setVar(varName, JSON.stringify(data.vars[varName].value));
                    break;
    
                case 'object':
                    // TODO handle SQL queries
					console.log(`*** This is an object: ${JSON.stringify(data)}`);
                    break;
            }
        }
        if(this.varsBox) {
            this.varsBox.setMultipleVars(data.vars);
        }
    }



    handleNewRow(data) {
        this.dbResults.highlightRow(data);
    }

    handleStdout(data)  {
        // TODO handle stdout sent from the debugger
        if(this.outputWindow!==null) {
            this.outputWindow.innerHTML += data.replace(/</g,"&lt;"). replace(/>/g,"&gt;").replace(/\\n/g,"<br />")+"<br />";
        }
    }

    handleDBResults(data) {
        this.dbResults.showResults(data, this.dbWindow);
    }

    handleDBError(data) {
        alert(`Error with SQL statement on line ${data.lineno}: `+ `${data.msg}`);
    }

    handleStop() {
    }

    highlightLine(line) {
        this.codeLines[line-1].classList.add("lineHighlight");
        this.lastLine = this.codeLines[line-1]; 
    }

    unhighlightLastLine(line) {
        if(this.lastLine) {
            this.lastLine.classList.remove("lineHighlight");
        }
    }

    setupControls(div) {

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

    addToQueue(msg) {
        this.dbgMsgQueue.add(msg);
    }

    clearQueue() {
        this.dbgMsgQueue.clear();
    }

    addVarComment(lineno,value,httpvar){
        if(!this.varComments[lineno]) {
            this.audio.play();
            var comment = document.createElement("code");
            comment.appendChild(document.createTextNode("//"+value));
            comment.style.backgroundColor = PHPAnimation.colours[this.colourCount%PHPAnimation.colours.length];
            this.codeLines[lineno-1].appendChild(comment);
            this.browserCallback(httpvar, PHPAnimation.colours[this.colourCount%PHPAnimation.colours.length]);
            this.varComments[lineno]=value;
            this.colourCount++;
        }
    }

    extractHttpVar(line) {
        const data = /(\$\w+)\s*?=\s*?\$_(GET|POST)\s*\[\s*["'](\w+)["']\s?\]/.exec(line);
        return data ?  { phpVar: data[1], method: data[2], httpVar: data[3] } : null;
    }
}

PHPAnimation.colours = ['yellow', '#00ff00', 'cyan', '#ff80ff', '#ff8080', 'orange'];

module.exports = PHPAnimation;
