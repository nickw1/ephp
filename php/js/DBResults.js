function DBResults(phpAnim) {
    this.phpAnim = phpAnim;
}

DBResults.prototype.highlightRow = function(id) {
    if(this.lastId) {
        var lastRow = document.getElementById('rec'+this.lastId);
        lastRow.classList.remove("selected");
        var tds = lastRow.getElementsByTagName('td');
        for(var i=0; i<tds.length; i++) {
            tds[i].classList.remove('selected');
        }
    }
    var thisRow = document.getElementById('rec'+id);
    var tds = thistRow.getElementsByTagName('td');
    for(var i=0; i<tds.length; i++) {
        tds[i].classList.add('selected');
    }
    this.lastId = id;
}

DBResults.prototype.showResults = function(sqlquery, hostDiv) {
    var div = document.createElement("div");
    var table = document.createElement("table");
    var id;

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
        id = sqlquery.results[row].id ? sqlquery.results[row].id : 
            -(row+1);
        tr.setAttribute('id','rec'+id);

        for(var col in sqlquery.results[row]) {
            var td=document.createElement("td");
            td.setAttribute("id", "rec"+id+"_" + col);
            td.appendChild
                (document.createTextNode
                    (sqlquery.results[row][col]));
            tr.appendChild(td);
        }
    var td = document.createElement("td");
    td.setAttribute("id","rec"+id+"_var");
    td.appendChild(document.createTextNode("< $row"));
    td.setAttribute("class","varcell");
    tr.appendChild(td);
        table.appendChild(tr);
    }
    var close = document.createElement("img");
    close.setAttribute("alt", "Close");
    close.setAttribute("src", "assets/images/cross.png");

    close.addEventListener("click",
        (e)=> {
            this.pauseLoopAnimate();
            this.resetLoop();
            hostDiv.style.display='none';
        });

    var titlebar = document.createElement("div");
    titlebar.style.textAlign = 'right';
    titlebar.style.backgroundColor = '#c0c0c0';
    titlebar.appendChild(close);

    div.appendChild(titlebar);
    div.appendChild(table);

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
    range.addEventListener("change", (e)=> {
         this.interval = 2000.0 / e.target.value;
        });

    play.addEventListener("click", this.resumeLoopAnimate.bind(this));
    pause.addEventListener("click",this.pauseLoopAnimate.bind(this)); 

    rewind.addEventListener("click", 
        (e)=> {
            document.getElementById("row"+this.rowIndex).
                classList.remove("selected");
            if(this.contLoopAnimate) {
                this.pauseLoopAnimate();
        }
        document.getElementById("row"+this.rowIndex).classList.
                    remove("selected");
            this.unselectSelectedCells();
            this.resetLoop();
            this.clearConsole();
    //            this.resumeLoopAnimate();
            
        });

    div.appendChild(play);
    div.appendChild(rewind);
    div.appendChild(pause);

    var slider = new Slider(2000, 10, {
        onchange: (value)=> {
            this.interval = value;
        } ,

        parent: div
        } );
    slider.setValue(this.interval);
    hostDiv.appendChild(div);
}
