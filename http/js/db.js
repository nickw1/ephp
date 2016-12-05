
// Important - animation will not happen if display is none

// TODO can this become more automatically maintainable to avoid
// changing things both in the CSS and here?
// e.g. find the name of the animation names and classes by querying the CSS
// can we obtain percentage widths in CSS from JavaScript? 
// - animation-fill-mode: forwards will retain final width

function DBShow (elements, otherInfo)  {
    this.client = document.getElementById(elements.client);
    this.network = document.getElementById(elements.network);
    this.dbconnect = document.getElementById(elements.dbconnect);
    this.database = document.getElementById(elements.database);
    for(k in otherInfo) {
        this[k] = otherInfo[k];
    }
        
    this.client.addEventListener
            ("animationend", (function(e) {
            if(e.animationName==this.forwardAnimName) {
                        this.client.style.display="none";
                        this.network.style.display="none";
                } else if (e.animationName==this.reverseAnimName) {
                    this.database.style.display="none";
                    this.dbconnect.style.display="none";
                }
            }).bind(this));
}

DBShow.prototype.startShowDB =  function(e) {
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
    
DBShow.prototype.startHideDB = function(e) {
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

DBShow.prototype.displayAll = function() {
    this.client.style.display = this.network.style.display =
    this.dbconnect.style.display = this.database.style.display = "block";
}

function dbinit() {
    
/*
    var dbs = new DBShow({ client: "client", 
                            network: "network", 
                            dbconnect:"dbconnect", 
                            database: "database" },
                        {
                             forwardAnimName:"shrink_main_component", 
                            reverseAnimName:"grow_main_component", 
                            forwardAnimClass:"animating", 
                            reverseAnimClass:"rev_animating" }
                        );
    document.getElementById("dbshow").addEventListener
        ("click", dbs.startShowDB.bind(dbs));
    document.getElementById("dbhide").addEventListener
        ("click", dbs.startHideDB.bind(dbs));
*/    
}
