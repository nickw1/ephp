
// ref sqlquery - this.data.sqlqueries[queeyIndex]

function PHPAnimation(options) {
    this.div = document.getElementById(options.divId);
    if(options.callback) {
        this.setCallback(options.callback);
    }
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

}

PHPAnimation.prototype.colours = 
    ['yellow', '#00ff00', 'cyan', '#ff80ff', '#ff8080', 'orange'];

PHPAnimation.prototype.getLines = function() {
    return this.lines;
}

PHPAnimation.prototype.getSQLQuery = function(queryIndex) {
    return this.data.sqlqueries[queryIndex];
}

PHPAnimation.prototype.setCallback = function(callback) {
    this.callback = callback;
    this.btndiv = document.createElement("div");
    var btn = document.createElement("input");
    btn.setAttribute("type","button");
    btn.setAttribute("value","Run PHP and send back output");
    this.callback = callback;
    btn.addEventListener("click", (function() {
        while(this.div.childNodes.length > 0) {
            this.div.removeChild(this.div.firstChild);
        }
        for(var i=0; i<this.originalDivContents.length; i++) {
            this.div.appendChild(this.originalDivContents[i]); 
        }
        this.div.classList.remove("serverCode");
        this.callback(); 
        }).bind(this)); 

    var slider = new Slider(2000, 10, {
        onchange: (function(value) {
            this.interval = value;
            this.loopAnimation.interval = value;
        }).bind(this) ,

        parent: this.btndiv
        } );
    slider.setValue(this.interval);

    this.btndiv.appendChild(document.createElement("br"));
    this.btndiv.appendChild(btn);    
}

PHPAnimation.prototype.animate = function(data) {
    if(data.vars.length==0 && data.sqlqueries.length==0) {
        return false;
    } else {
        this.originalDivContents = [];
        
        while(this.div.childNodes.length > 0) {    
            this.originalDivContents.push(this.div.firstChild);
            this.div.removeChild(this.div.firstChild);
        }
        this.div.classList.add("serverCode");
        this.data = data;
        var lines = this.data.php.split("\n");
        this.lines = [];
        this.varComments = [];
        var curVar=0, curLoopVar=0, line;
        if(this.data.vars.length > 0) {
            var lineNoText, lineNoSpan;
            for(var i=0; i<lines.length; i++) {
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
              line.appendChild(document.createTextNode(lines[i]));
              if(i+1 == this.data.vars[curVar].lineNumber) {
                    var value = document.createElement("code");
                    value.appendChild(document.createTextNode
                        ("//" + this.data.vars[curVar].value));
                    value.style.display="none";
                    value.style.backgroundColor = 
                        this.colours[curVar%this.colours.length];
                    this.varComments.push(value);
                    line.appendChild(value);
                    curVar += (curVar<this.data.vars.length-1 ? 1:0);
                } 
                this.div.appendChild(line);
                this.div.appendChild(document.createElement("br"));
                this.lines.push(line);
            }
        
            this.vars = this.data.vars;
            this.varCount=0;
            this.sqlCount=0;
            this.sqlLoopCount=0;
            setTimeout(this.doAnimate.bind(this), this.interval);
        }
        this.div.appendChild(this.btndiv);
        this.div.appendChild(this.tooltip);
        return true;
    }
}

PHPAnimation.prototype.doAnimate = function(lineCount) {
    lineCount = lineCount || 0;
    var end = this.lines.length;
    if(lineCount != end) {
        var nextInterval = this.interval;
        if(lineCount>0) {
            this.lines[lineCount-1].classList.remove("lineHighlight");
        }
        this.lines[lineCount].classList.add("lineHighlight");
        if(lineCount+1 == this.data.vars[this.varCount].lineNumber) {
            nextInterval = 0.4 * this.interval;
            this.varComments[this.varCount].style.display = "inline";
            var matches = null;

            this.findVarsInLines(this.data.vars, this.varCount,
                    (function(i, e) {
                            return { 
                                x: e.pageX+"px",
                                y: e.pageY+"px",
                                node: document.createTextNode
                                    (this.data.vars[i].value),
                                hideOnMouseOut:true
                                }
                    }).bind(this));
            this.audio.play();
            this.browserCallback (this.data.vars[this.varCount].httpVar,
                            this.colours[this.varCount%this.colours.length]);
            this.varCount+=(this.varCount+1<this.data.vars.length ? 1:0);
        } else if(this.data.sqlqueries.length && lineCount+1 == 
            this.data.sqlqueries[this.sqlCount].lineNumber) {

            if(this.dbAnimation) {
                this.dbAnimation.animate
                    (this.data.sqlqueries[this.sqlCount].sql,
                    this.doAnimate.bind(this));
            }
            this.findVarsInLines(this.data.sqlqueries, this.sqlCount,
                     (function(i, e) {
                            return this.loopAnimation.
                                createResultsDiv(i,e.pageX,e.pageY,
                                    this.tooltip);
                        }).bind(this));

            
            this.sqlCount+=(this.sqlCount+1<this.data.sqlqueries.length?1:0);
        }
        lineCount++;    

        if(this.sqlLoopCount < this.data.sqlqueries.length &&
            lineCount+1==this.data.sqlqueries[this.sqlLoopCount].
            loop.start) {
            var tooltipInfo = this.loopAnimation.createResultsDiv
                (this.sqlLoopCount,1024,200,this.tooltip);
            this.tooltip.style.left = tooltipInfo.x; 
            this.tooltip.style.top = tooltipInfo.y; 
            this.tooltip.innerHTML = "";
            this.tooltip.appendChild(tooltipInfo.node); 
            this.tooltip.style.display='block';
            this.tooltip.hideOnMouseOut = tooltipInfo.hideOnMouseOut;
            this.lines[lineCount-1].classList.remove("lineHighlight");
            setTimeout(this.loopAnimation.loopAnimate.bind(this.loopAnimation,
                        this.sqlLoopCount++,0,lineCount+1,[],
                        this.doAnimate.bind(this)),
                nextInterval);
        } else {
            setTimeout(this.doAnimate.bind(this,lineCount), nextInterval);
        }
    } else { // if there is another line to do
        this.lines[this.lines.length-1].classList.remove("lineHighlight");
    }
}

PHPAnimation.prototype.findVarsInLines = function(arr, varCount, 
        getTooltipCallback) {
    for(var i=arr[varCount].lineNumber; i<this.lines.length; i++) {
        var regex = new RegExp(
                            "^(.*?)(\\"+
                            arr[this.varCount].variable+
                            ")(\\W.*)$");
        var newNodes = [];
        for(var node=0; node<this.lines[i].childNodes.length; node++) {
            var matchString = "";
            if(this.lines[i].childNodes[node].nodeType==Node.TEXT_NODE){
                // \r was causing the regex to fail
                matches = regex.exec
                            (this.lines[i].childNodes[node].nodeValue.
                                replace("\r",""));
                //if(matches!=null) {
                while(matches!=null) {
                    var span = document.createElement("span");
                    span.appendChild
                                (document.createTextNode(matches[2]));
                    span.addEventListener("mouseover", 
                            (function(j,e) {
                            // for some reason position:absolute is wrt the
                            // whole page, not the containing element
                            var tooltipInfo = getTooltipCallback(j, e);
                            this.tooltip.style.left = tooltipInfo.x; 
                            this.tooltip.style.top = tooltipInfo.y; 
                            this.tooltip.innerHTML = "";
                            this.tooltip.appendChild(tooltipInfo.node); 
                            this.tooltip.style.display='block';
                            this.tooltip.hideOnMouseOut = 
                                tooltipInfo.hideOnMouseOut;
                        }).bind(this,this.varCount));
                    span.addEventListener("mouseout",
                                    (function(e) {
                                    if(this.tooltip.hideOnMouseOut) {
                                        this.tooltip.style.display='none';
                                    }}).bind(this));
                    span.style.color = 'blue';
                    span.style.textDecoration='underline';
                    span.style.fontWeight='bold'
                    newNodes.push(document.createTextNode(matches[1]));
                    newNodes.push(span);
                    matchString = matches[3];
                    matches = regex.exec(matchString);
                }

                if(matchString != "") {
                    newNodes.push(document.createTextNode(matchString));
                }
            } // if not a text node 
            // if its not a text node or there were no matches
            if(matchString == "") {
                newNodes.push(this.lines[i].childNodes[node]);
            }
        } // node for loop

        while(this.lines[i].childNodes.length>0) {
            this.lines[i].removeChild(this.lines[i].firstChild); 
        }
        for(var node=0; node<newNodes.length; node++) {
            this.lines[i].appendChild(newNodes[node]);
        }
    } //  loop through lines 
}
