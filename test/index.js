
const DebugMgr = require('../js/php/DebugMgr');

class Handlr {
    handleText(str) {
        document.getElementById("output").innerHTML += str + "<br />";
    }

    clearQueue() {
    }

    addToQueue(msg) {
        this.handleText(JSON.stringify(msg));
    }

    handleStop() {
        this.handleText("STOP");
    }
}

window.app = {
    config: {
        sockserver: 'localhost'
    }
};

document.getElementById("go").addEventListener("click", ()=> {
    var artists = ["The+Beatles","Elvis+Presley","Cliff+Richard","Westlife","Madonna","Take+That","Spice+Girls","ABBA","Oasis","The+Rolling+Stones","The+Black+Eyed+Peas","McFly","Blondie","U2","Boyzone","Robbie+Williams","Rod+Stewart","Slade","Kylie+Minogue","Michael+Jackson"];
    var dbgMgrs = [];

    var handlr = new Handlr();

    var limit = parseInt(document.getElementById("limit").value);

    for(var i=0; i<artists.length; i++) {
        if(i<limit) {
            setTimeout((function(i) {
                var user = "ephp" + ("00"+(i+1)).slice(-3);
                handlr.handleText("Launching "+ user);
                dbgMgrs[i] = new DebugMgr({dbgMsgHandler: handlr, user: user, overrideUser: user });
                dbgMgrs[i].launchDebugSession('/epup/'+user+'/basicsearch.php?artist='+artists[i], 'GET', null, (xhr) => { handlr.handleText("Launch debug return: " + xhr.responseText); } );    
            }).bind(this, i), i*500);
        }
    }
});


