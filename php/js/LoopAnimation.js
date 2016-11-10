
function LoopAnimation(phpAnim) {
	this.phpAnim = phpAnim;
	this.contLoopAnimate=false;
}


// loopLine is numbered from 1
LoopAnimation.prototype.loopAnimate = function(queryIndex,rowIndex, loopLine, 	
					selectedCells, mainAnimationCallback) {
	var lines = this.phpAnim.getLines();
	var sqlquery = this.phpAnim.getSQLQuery(queryIndex);
    rowIndex = rowIndex || 0;
   	loopLine = loopLine || sqlquery.loop.start;
    selectedCells = selectedCells || [];

	if (rowIndex>0 && loopLine==sqlquery.loop.start) {
       	lines[sqlquery.loop.end-1].classList.
			remove("lineHighlight");
	} else if (loopLine > 1) {
       	lines[loopLine-2].classList.remove("lineHighlight");
	}
    lines[loopLine-1].classList.add("lineHighlight");

    var lastRowIndex = rowIndex==0 ? 
        sqlquery.results.length-1 :
        rowIndex-1;
    document.getElementById("row"+lastRowIndex).classList.remove("selected");

    for(var cell=0; cell<selectedCells.length; cell++) {
        selectedCells[cell].classList.remove("selected");
    }

    document.getElementById("row"+rowIndex).classList.add("selected");

    selectedCells = [];

    for(var i=0; i<sqlquery.loop.vars.length; i++) {
        if(loopLine==sqlquery.
            loop.vars[i].lineNumber) {
            var cell = document.getElementById("row"+rowIndex+"_"+
                sqlquery.loop.vars[i].value);
			// 101116 possibility that a nonexistent column is in the loop code
			if(cell!=null) {
            	cell.classList.add("selected");
            	selectedCells.push(cell);
			}
        }
    }

    var curLine = lines[loopLine-1].innerHTML;

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
            sqlquery.loop.rowvar+
            "\\[\"?(\\w+)\\\"?]", "g");
        var output = curLine.replace(re, (function(match,p1,offset,string) {
                for(var i=0; i<sqlquery.loop.vars.
                    length; i++) {
                    if(p1==sqlquery.loop.vars[i].
                        value) {
                        var s=    
                            sqlquery.results[rowIndex]
                          [sqlquery.loop.vars[i].value];
                        return s;
                    }
                }    
                return match;
            }).bind(this));
        var p = document.createElement(p);
        p.innerHTML = output;
        document.getElementById("databaseResultsConsole").appendChild(p);
    }

    if(++loopLine > sqlquery.loop.end) {
        rowIndex++;
       	loopLine=sqlquery.loop.start;
    }

    if(rowIndex < sqlquery.results.length &&
			this.contLoopAnimate) {
        setTimeout(this.loopAnimate.bind(this,queryIndex,rowIndex,loopLine,
            selectedCells,mainAnimationCallback),1000);
    } else {
		lines[sqlquery.loop.end-1].
			classList.remove("lineHighlight");
		lineCount = sqlquery.loop.end+1;
		if(mainAnimationCallback) {
			mainAnimationCallback(sqlquery.loop.end+1);
		}
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
	div.appendChild(table);
	var btn = document.createElement("input");
	btn.setAttribute("type", "button");    
	btn.setAttribute("value", "Show Loop Running");    
	var closeBtn = document.createElement("input");
	closeBtn.setAttribute("type", "button");    
	closeBtn.setAttribute("value", "Close");
                            
	btn.addEventListener("click", (function(e) {
								 this.contLoopAnimate=true;
                                    this.loopAnimate(i);
                                }).bind(this));
                        
	closeBtn.addEventListener("click",
		(function(e) {
			this.contLoopAnimate=false;
			hostDiv.style.display='none';
		}).bind(this));

	div.appendChild(btn);
	div.appendChild(closeBtn);
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
