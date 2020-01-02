
// ref sqlquery - this.data.sqlqueries[queryIndex]

const DbgMsgQueue = require('./DbgMsgQueue');
const VarsBox = require('./VarsBox');
const DBResults = require('./DBResults');
const Slider = require('../ui/Slider');
const DBAnimation = require('./DBAnimation');
const SQLMessage = require('./SQLMessage');
const NarrativeDialog = require('../ui/NarrativeDialog');

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
        this.doneSql = {};
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
        this.loops = {};

        this.setupGUI();

        this.errorDlg = new Dialog('serverContent', {
                    'OK' : ()=> { 
                        this.dbgMsgQueue.start(); 
                        this.errorDlg.hide();
                    }
                },
                { position: 'absolute',
                left: '25%',
                top: '100px',
                border: '1px solid black',
                width: '50%',
                backgroundColor: '#ffffc0' } 
        );
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
        this.runBtn.setAttribute("value",`Send back output to client`);
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
            if(http.method != this.httpRequest.method) {
                this.displayError(`This script was requested with a method of ${this.httpRequest.method}, but this line is trying to use $_${http.method} to read in the data sent to it. Try changing it to $_${this.httpRequest.method}.`);
            } else if (this.httpRequest[http.method][http.httpVar]) {
                this.httpVars[http.phpVar] = { lineno: data.lineno, httpVar: http.httpVar}; 
            } else {
                this.displayError(`You are trying to read in an item of ${http.method} data named '${http.httpVar}', however this does not exist. If using a form, make sure there's a field called '${http.httpVar}' or change your $_${http.method} statement to use the correct form field. If using a query string, ensure there is a variable called '${http.httpVar}' in your query string.`);
            }
        }

        for(let varName in data.vars) {
            console.log(`${varName} is a ${data.vars[varName].type}`);
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
                    if(window.app.settings.db_anim && data.vars[varName].classname=='PDOStatement' && data.vars[varName].value.queryString) {
                        // send off queryString to PHP SQL parser/processor
                        if(!this.doneSql[varName]) {
                            this.doneSql[varName] = true;
                            fetch(`php/sql.php?sql=${data.vars[varName].value.queryString}&fileuri=${this.dbgMsgQueue.fileuri}&resultvar=${varName.replace('$','')}`)
                                .then(response => response.json())
                                .then(data => {
                                    if(data.loopBounds && 
                                       data.loopBounds.start && 
                                       data.loopBounds.end) {
                                        this.loops[varName] = { lines: data.loopBounds, lastLineNo: Number.MAX_VALUE };
                                }
                                this.launchSqlAnimation(data);
                            });
                        } 
                    }
                    break;
            }
        }
        if(this.varsBox) {
            this.varsBox.setMultipleVars(data.vars);
        }
        for(let vname in this.loops) {
            if(data.lineno >= this.loops[vname].lines.start && data.lineno <= this.loops[vname].lines.end) {
                if(data.lineno < this.loops[vname].lastLineNo) {
                    this.dbResults.highlightNextRow();
                }            
                this.loops[vname].lastLineNo = data.lineno;
            }
        }
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
        this.displayError(`Error with SQL statement on line ${data.lineno}: ${data.msg}`);
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
            const retval = this.browserCallback(httpvar, PHPAnimation.colours[this.colourCount%PHPAnimation.colours.length]);
            console.log(`browserCallback returned ${retval} for ${httpvar}`);
            if(retval) {
                this.varComments[lineno]=value;
                this.colourCount++;
            } 
        }
    }

    extractHttpVar(line) {
        const data = /(\$\w+)\s*?=\s*?\$_(GET|POST)\s*\[\s*["'](\w+)["']\s?\]/.exec(line);
        return data ?  { phpVar: data[1], method: data[2], httpVar: data[3] } : null;
    }

    launchSqlAnimation(res) {
        this.dbgMsgQueue.stop();
        if(window.app.settings.narrative) {
            const narrative = new NarrativeDialog({ elemId: 'ephp_container',
                        narrative:`<h2>SQL Query found!</h2><p>Your ${window.app.config.language} script is going to send an SQL query to the MySQL server.</p><p>Query is: <strong>${res.sql}</strong>.</p><p>Click below to send it.</p>`
            });
            narrative.on("dismissed", this.doLaunchSqlAnimation.bind(this, res));
            narrative.show();
        } else {
            this.doLaunchSqlAnimation(res);
        }
    }

    doLaunchSqlAnimation(res) {
        const dlg = new Dialog('ephp_container', {
                },
                { position: 'absolute',
                left: '25%',
                top: 'calc(50% - 200px)',
                border: '1px solid black',
                width: '50%',
                backgroundColor: 'white',
                height: '400px' } );
        dlg.show();
        const sqlAnim = new DBAnimation({parent: dlg.div,
                                    height:this.canvasHeight,
                                    interval: 20,
                                    step : 2,
                                    requestLabel: 'SQL Query',
                                    responseLabel: 'Database results',
                                    msgBoxEditable: false,
                                    msgBoxWidth: '600px',
                                    message: new SQLMessage({ results: res.results, sql: res.sql}),
                                    serverAnimation: null });
        sqlAnim.on("canvasloaded", sqlAnim.animate.bind(sqlAnim));
        sqlAnim.on("finished", msg=> {
                dlg.hide();
                this.handleDBResults(msg);
                this.dbgMsgQueue.start();
        });
    }

    displayError(msg) {
        this.dbgMsgQueue.stop();
        this.errorDlg.setContent(msg);
        this.errorDlg.show();
    }
}

PHPAnimation.colours = ['yellow', '#00ff00', 'cyan', '#ff80ff', '#ff8080', 'orange'];

module.exports = PHPAnimation;
