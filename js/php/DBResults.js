
class DBResults {
    constructor(phpAnim) {
        this.phpAnim = phpAnim;
        this.index = 0;
    }

    highlightNextRow() {
        const rows = this.table.getElementsByTagName("tr");

        if(this.index > 0) {
            var lastRow = rows[this.index]; 
            lastRow.classList.remove("selected");
            var tds = lastRow.getElementsByTagName('td');
            for(var i=0; i<tds.length; i++) {
                tds[i].classList.remove('selected');
            }
        }

        if(++this.index < rows.length) {
            var thisRow = rows[this.index]; 
            var tds = thisRow.getElementsByTagName('td');
            for(var i=0; i<tds.length; i++) {
                tds[i].classList.add('selected');
            }
        }
    }

    showResults(sqlquery, hostDiv) {
		this.index = 0;
        while(hostDiv.childNodes.length > 0) {
            hostDiv.removeChild(hostDiv.firstChild);
        }
    
        var div = document.createElement("div");
        this.table = document.createElement("table");
        var id;

        for(var row=0; row<sqlquery.results.length; row++) {
                            
            var tr=document.createElement("tr");
            if(row==0) {
                for(var col in sqlquery.results[0]) {
                    var th = document.createElement("th");
                    th.appendChild (document.createTextNode(col));
                    tr.appendChild(th);
                }
                this.table.appendChild(tr);
                tr=document.createElement("tr");
            }
            
            id = sqlquery.results[row].id ? sqlquery.results[row].id : 
            (sqlquery.results[row].ID ? sqlquery.results[row].ID :-(row+1));
            tr.setAttribute('id','rec'+id);

            for(var col in sqlquery.results[row]) {
                var td=document.createElement("td");
                td.setAttribute("id", "rec"+id+"_" + col);
                td.appendChild (document.createTextNode (sqlquery.results[row][col]));
                tr.appendChild(td);
            }
            var td = document.createElement("td");
            td.setAttribute("id","rec"+id+"_var");
            td.appendChild(document.createTextNode("< $row"));
            td.setAttribute("class","varcell");
            tr.appendChild(td);
            this.table.appendChild(tr);
        }
        var close = document.createElement("img");
        close.setAttribute("alt", "Close");
        close.setAttribute("src", "assets/images/cross.png");

        close.addEventListener("click", e=> { 
            hostDiv.style.display='none';
        });

        var titlebar = document.createElement("div");
        titlebar.style.textAlign = 'right';
        titlebar.style.backgroundColor = '#c0c0c0';
        titlebar.appendChild(close);

        div.appendChild(titlebar);
        div.appendChild(this.table);

        hostDiv.appendChild(div);
    }

    reset() {
        this.index = 0;
    }
}

module.exports = DBResults;

