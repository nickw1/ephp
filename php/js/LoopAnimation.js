function LoopAnimation(phpAnim, interval) {
	this.phpAnim = phpAnim;
	this.contLoopAnimate=false;
	this.interval = interval || 1000;
}

// resets this.rowIndex to 0 and this.loopLine to first line of loop
// and selectedCells to []
// loopLine is numbered from 1
LoopAnimation.prototype.loopAnimate=function(queryIndex, mainAnimationCallback){
	this.mainAnimationCallback = mainAnimationCallback || null;
	this.sqlquery = this.phpAnim.getSQLQuery(queryIndex);
	this.resetLoop();
	this.resumeLoopAnimate();
}

LoopAnimation.prototype.resetLoop = function() {
	this.rowIndex = 0;
	this.loopLine = this.sqlquery.loop.start;
	this.selectedCells = [];
}

LoopAnimation.prototype.pauseLoopAnimate = function() {
	if(this.timeout) {
		clearTimeout(this.timeout);
		this.timeout=null;
	}
	this.contLoopAnimate = false;
}

LoopAnimation.prototype.resumeLoopAnimate = function() {
	if(this.contLoopAnimate==false) {
		this.contLoopAnimate = true;
		this.iterateLoopAnimate();
	}
}

// resumes without resetting rowIndex, loopLine, selectedCells
LoopAnimation.prototype.iterateLoopAnimate = function() {
	var lines = this.phpAnim.getLines();

	if (this.rowIndex>0 && this.loopLine==this.sqlquery.loop.start) {
       	lines[this.sqlquery.loop.end-1].classList.
			remove("lineHighlight");
	} else if (this.loopLine > 1) {
       	lines[this.loopLine-2].classList.remove("lineHighlight");
	}
    lines[this.loopLine-1].classList.add("lineHighlight");

    var lastRowIndex = this.rowIndex==0 ? 
        this.sqlquery.results.length-1 :
        this.rowIndex-1;

    document.getElementById("row"+lastRowIndex).classList.remove("selected");
	this.unselectSelectedCells();
    document.getElementById("row"+this.rowIndex).classList.add("selected");

    this.selectedCells = [];

    for(var i=0; i<this.sqlquery.loop.vars.length; i++) {
        if(this.loopLine==this.sqlquery.
            loop.vars[i].lineNumber) {
            var cell = document.getElementById("row"+this.rowIndex+"_"+
                this.sqlquery.loop.vars[i].value);
			// 101116 possibility that a nonexistent column is in the loop code
			if(cell!=null) {
            	cell.classList.add("selected");
            	this.selectedCells.push(cell);
			}
        }
    }

    var curLine = lines[this.loopLine-1].innerHTML;

    if(curLine.indexOf("echo") != -1) {
        var inQuotes=false;
        for(var i=0; i<curLine.length; i++) {
            if(curLine[i]=="\"") {
                inQuotes = !inQuotes;
            }
            else if (curLine[i]=="." && !inQuotes) {
                curLine = curLine.substr(0,i)+curLine.substr(i+1);
                i--;
            }
        }

        curLine = curLine.substr(curLine.indexOf("echo")+4).replace
            (/"(([^"\\]|\\.)*)"/g,"$1").
            replace(/&lt;/g,"<").replace(/&gt;/g,">").
            replace(/;\s+$/,"");
        

        var re = new RegExp("\\"+
            this.sqlquery.loop.rowvar+
            "\\[\"?(\\w+)\\\"?]", "g");
        var output = curLine.replace(re, (function(match,p1,offset,string) {
                for(var i=0; i<this.sqlquery.loop.vars.
                    length; i++) {
                    if(p1==this.sqlquery.loop.vars[i].
                        value) {
                        var s=    
                            this.sqlquery.results[this.rowIndex]
                          [this.sqlquery.loop.vars[i].value];
                        return s;
                    }
                }    
                return match;
            }).bind(this));
        var p = document.createElement(p);
        p.innerHTML = output;
        document.getElementById("databaseResultsConsole").appendChild(p);
    }

    if(++this.loopLine > this.sqlquery.loop.end) {
        this.rowIndex++;
       	this.loopLine=this.sqlquery.loop.start;
    }

    if(this.rowIndex < this.sqlquery.results.length &&
			this.contLoopAnimate) {
        this.timeout=
			setTimeout(this.iterateLoopAnimate.bind(this),this.interval);
    } else {
		lines[this.sqlquery.loop.end-1].
			classList.remove("lineHighlight");
		lineCount = this.sqlquery.loop.end+1;
		this.resetLoop();
		if(this.mainAnimationCallback) {
			this.mainAnimationCallback(this.sqlquery.loop.end+1);
		}
	}
}

LoopAnimation.prototype.unselectSelectedCells = function() {
    for(var cell=0; cell<this.selectedCells.length; cell++) {
        this.selectedCells[cell].classList.remove("selected");
    }
}

// hostDiv = this.tooltoip
LoopAnimation.prototype.createResultsDiv = function(i, x, y, hostDiv) {
	var div = document.createElement("div");
	var table = document.createElement("table");

	var sqlquery = this.phpAnim.getSQLQuery(i);

	for(var row=0; row<sqlquery.results.length; row++) {
                            
		var tr=document.createElement("tr");
		if(row==0) {
			for(var col in sqlquery.results[0]) {
				var th = document.createElement("th");
				th.appendChild
					(document.createTextNode(col));
				tr.appendChild(th);
			}
			table.appendChild(tr);
			tr=document.createElement("tr");
		}
		tr.setAttribute("id","row"+row);

		for(var col in sqlquery.results[row]) {
			var td=document.createElement("td");
			td.setAttribute("id", "row"+row+"_" + col);
			td.appendChild
				(document.createTextNode
					(sqlquery.results[row][col]));
			tr.appendChild(td);
		}
		table.appendChild(tr);
	}

	var close = document.createElement("img");
	close.setAttribute("alt", "Close");
	close.setAttribute("src", "assets/images/cross.png");

	close.addEventListener("click",
		(function(e) {
			this.pauseLoopAnimate();
			this.resetLoop();
			hostDiv.style.display='none';
		}).bind(this));

	var titlebar = document.createElement("div");
	titlebar.style.textAlign = 'right';
	titlebar.style.backgroundColor = '#c0c0c0';
	titlebar.appendChild(close);

	div.appendChild(titlebar);
	div.appendChild(table);
	/*
	var play = document.createElement("input");
	play.setAttribute("type", "button");    
	play.setAttribute("value", "Show Loop Running");    
	*/
	var play = document.createElement("img");
	play.setAttribute("alt", "Play/Resume Loop");
	play.setAttribute("src", "assets/images/control_play_blue.2.png");


	var pause = document.createElement("img");
	pause.setAttribute("alt", "Pause Loop");
	pause.setAttribute("src", "assets/images/control_pause_blue.2.png");                            
	var rewind = document.createElement("img");
	rewind.setAttribute("alt", "Rewind Loop");
	rewind.setAttribute("src", "assets/images/control_rewind_blue.2.png");                            


	var range = document.createElement("input");
	range.setAttribute("type", "range");
	range.setAttribute("min", 1);
	range.setAttribute("max", 10);
	range.setAttribute("step", 1);
	range.setAttribute("value", 2000.0 / this.interval);
	range.addEventListener("change", (function(e) {
		 this.interval = 2000.0 / e.target.value;
		}).bind(this));

	play.addEventListener("click", this.resumeLoopAnimate.bind(this));
	pause.addEventListener("click",this.pauseLoopAnimate.bind(this)); 

	rewind.addEventListener("click", 
		(function(e) {
			if(this.contLoopAnimate) {
				this.pauseLoopAnimate();
    			document.getElementById("row"+this.rowIndex).classList.
					remove("selected");
				this.unselectSelectedCells();
				this.resetLoop();
				this.resumeLoopAnimate();
			}
		}).bind(this));

	div.appendChild(play);
	div.appendChild(rewind);
	div.appendChild(pause);

	var slider = new Slider(2000, 10, {
		onchange: (function(value) {
			this.interval = value;
		}).bind(this) ,

		parent: div
		} );
	slider.setValue(this.interval);

	var console = document.createElement("div");
	console.setAttribute("id", "databaseResultsConsole");
	console.style.height="200px";
	console.style.backgroundColor = "black";
	console.style.color = "white";
	console.style.fontFamily="Courier, monospace";
	console.style.overflow = "auto";
	console.style.border="1px solid white";
	console.innerHTML = "--Output--<br />";
	div.appendChild(console);
	return { x: x+"px", hideOnMouseOut:false, y: (y+200)+"px", node: div };
}
