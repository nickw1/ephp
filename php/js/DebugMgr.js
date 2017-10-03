
function DebugMgr(launcher, options) {
    this.launcher = launcher;
    this.dbgMsgHandler = options.dbgMsgHandler || null;
    this.completeCallback = options.completeCallback || null;
}

DebugMgr.prototype.runLauncher = function(method, url, formData) {
    var fd=new FormData();
    fd.append('cmd', 'start');
    http.send('POST', this.launcher,fd).
        then( (xmlHTTP) => {
                    // startup the websocket stuff
                    var data = JSON.parse(xmlHTTP.responseText);
                    this.user = data.user;
                    msg("Launcher returned: "+ xmlHTTP.responseText +
                            " user="+this.user);
                    this.connect(method, url, formData);
                } ).catch( (statusCode) => {
                    msg('http error: ' + statusCode);
                    } );
}

DebugMgr.prototype.connect = function(method, url, formData) {
    this.ws=new WebSocket('ws://ephp.solent.ac.uk:8080');

    this.ws.onopen = (e) => {
            msg('opened websocket! sending user to socket server', true);
            this.ws.send(JSON.stringify({"cmd":"user", "data":this.user}));
    }    

    this.ws.onmessage = (e) => {
        msg("<strong>websocket sent:</strong>" + e.data);
        var data = JSON.parse(e.data);
        // all debug commands have a user field to identify which user is
        // sending them, others will be ignored
        if(data.cmd && data.user && this.user == data.user &&
            this.dbgMsgHandler != null) {
            msg('received <strong>' + data.cmd + 
                '</strong> command from web socket server');
//			console.log("cmd from web socket server=" + data.cmd);
            switch(data.cmd) {
                case 'opened':

                    http.send(method, url+
                        '&XDEBUG_SESSION_START='+
                            this.user, formData).then((xmlHTTP)=>
                        {alert('script has finished:<br />'
                            +xmlHTTP.responseText);
                        if(this.completeCallback != null) {
                            this.completeCallback(xmlHTTP);
                        }
                    // sned back to whatever called this 
                    }).catch((code)=>alert(code));
                    break;


                case 'line':
                    this.dbgMsgHandler.handleLine(data.data);
                    break;

                case 'newrow':
                    this.dbgMsgHandler.handleNewRow(data.data);
                    break;

                case 'stdout':
                    this.dbgMsgHandler.handleStdout(data.data);
                    break;
				
				case 'dbresults':
					this.dbgMsgHandler.handleDBResults(data.data);
					break;

                case 'stop':
                    this.dbgMsgHandler.handleStop();
                    break;
            }
        }
    };

    this.ws.onerror = (e) => {
        alert('ERROR: ' + e.data);
    }
};

DebugMgr.prototype.initiateDebugSession = function() {
    this.ws.send(JSON.stringify({"cmd":"user",
                        "data":document.getElementById("user").value}));
}

DebugMgr.prototype.stopServers = function() {
        var fd=new FormData();
        fd.append('cmd', 'stop');
        http.send('POST', this.launcher,fd).
                then((e)=>
            {msg('stopped: ' + e.target.responseText); }).
                catch((code)=>{alert(code)});
}

DebugMgr.prototype.setCompleteCallback = function(cb) {
    this.completeCallback = cb;
}
