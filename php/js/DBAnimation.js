
// Important - animation will not happen if display is none

// TODO can this become more automatically maintainable to avoid
// changing things both in the CSS and here?
// e.g. find the name of the animation names and classes by querying the CSS
// can we obtain percentage widths in CSS from JavaScript? 
// - animation-fill-mode: forwards will retain final width

function DBAnimation (elements, callback, otherOptions)  {
    this.client = document.getElementById(elements.client);
    this.network = document.getElementById(elements.network);
    this.dbconnect = document.getElementById(elements.dbconnect);
    this.database = document.getElementById(elements.database);
    for(k in otherOptions) {
        this[k] = otherOptions[k];
    }
        
    this.client.addEventListener
            ("animationend", (e)=> {
            if(e.animationName==this.forwardAnimName) {
                        this.client.style.display="none";
                        this.network.style.display="none";
						this.showSQLRequest (this.sql, this.showResultSet);
                } else if (e.animationName==this.reverseAnimName) {
                    this.database.style.display="none";
                    this.dbconnect.style.display="none";
					callback();
                }
            });
}

DBAnimation.prototype.animate = function() {
	this.startShowDB();
}


DBAnimation.prototype.startShowDB =  function(e) {
        this.displayAll();
        this.client.classList.remove(this.reverseAnimClass);
        this.network.classList.remove(this.reverseAnimClass);
        this.database.classList.remove(this.reverseAnimClass);
        this.dbconnect.classList.remove(this.reverseAnimClass);
        this.client.classList.add(this.forwardAnimClass);
        this.network.classList.add(this.forwardAnimClass);
        this.database.classList.add(this.forwardAnimClass);
        this.dbconnect.classList.add(this.forwardAnimClass);
    };
    
DBAnimation.prototype.startHideDB = function(e) {
        this.displayAll();
        this.client.classList.remove(this.forwardAnimClass);
        this.network.classList.remove(this.forwardAnimClass);
        this.database.classList.remove(this.forwardAnimClass);
        this.dbconnect.classList.remove(this.forwardAnimClass);
        this.client.classList.add(this.reverseAnimClass);
        this.network.classList.add(this.reverseAnimClass);
        this.database.classList.add(this.reverseAnimClass);
        this.dbconnect.classList.add(this.reverseAnimClass);
}

DBAnimation.prototype.displayAll = function() {
    this.client.style.display = this.network.style.display =
    this.dbconnect.style.display = this.database.style.display = "block";
}

DBAnimation.prototype.showSQLRequest = function(sql, resultFunc) {
	// TODO animation similar to HTTP to show sql query sent to DB
}

DBAnimation.prototype.showResultSet = function() {
	// TODO show the result set on the database div

	// button which when clicked sends the result set back
}
