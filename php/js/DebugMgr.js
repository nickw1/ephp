
function DebugMgr(launcher, options) {
    this.launcher = launcher;
    this.dbgMsgHandler = options.dbgMsgHandler || null;
    this.completeCallback = options.completeCallback || null;
}

DebugMgr.prototype.runLauncher = function(method, scriptUrl, formData) {
//    console.log("runLauncher(): scriptUrl="+scriptUrl);
    var fd=new FormData();
    fd.append('cmd', 'start');
    http.send('POST', this.launcher,fd).
        then( (xmlHTTP) => {
                    // startup the websocket stuff
                    var data = JSON.parse(xmlHTTP.responseText);
                    this.user = data.user;
//                    console.log("Launcher returned: "+ xmlHTTP.responseText + " user="+this.user);
                    this.connect(method, scriptUrl, formData);
                } ).catch( (statusCode) => {
                    console.log('http error: ' + statusCode);
                    } );
}

DebugMgr.prototype.connect = function(method, scriptUrl, formData) {
    //console.log("connect(): scriptUrl="+scriptUrl);
    this.ws=new WebSocket('ws://ephp.solent.ac.uk:8080');

    this.ws.onopen = (e) => {
            //console.log('opened websocket! sending user to socket server', true);
            this.ws.send(JSON.stringify({"cmd":"user", "data":this.user}));
    }    

    this.ws.onmessage = (e) => {
        //console.log("websocket sent: " + e.data);
        var data = JSON.parse(e.data);
        var fullDebugUrl = scriptUrl;
        // all debug commands have a user field to identify which user is
        // sending them, others will be ignored
        if(data.cmd && data.user && this.user == data.user &&
            this.dbgMsgHandler != null) {
            //console.log("cmd from web socket server=" + data.cmd);
            switch(data.cmd) {
                case 'opened':
                    switch(method.toUpperCase()) {
                        case 'GET':
                            fullDebugUrl+='&XDEBUG_SESSION_START=' + this.user;
                            break;

                        case 'POST':
                            if(!formData) {
                                formData = new FormData();
                            }
                            formData.append('XDEBUG_SESSION_START', this.user);
                            break;
                    }

                    //console.log("Debugging script: " + fullDebugUrl);
                    http.send(method, fullDebugUrl, formData).then((xmlHTTP)=>
                        {
                            if(this.completeCallback != null) {
                                console.log("debug session finished: Sending completeCallback with response: " + xmlHTTP.responseText);
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
            {console.log('stopped: ' + e.target.responseText); }).
                catch((code)=>{alert(code)});
}

DebugMgr.prototype.setCompleteCallback = function(cb) {
    this.completeCallback = cb;
}

DebugMgr.prototype.launchDebugSession = function(scriptUrl, method, formData, 
        callback) {
    // added new code from old version to retrieve the source code
    // Kill the cache - this caused no reload at times
        var killcache="?killcache="+new Date().getTime();
        if(method=='GET') {
// !! changed this as it seemed to be adding the url twice, presumably left
// over from original EPHP
            var parts = scriptUrl.split("?");
            scriptUrl=(parts.length==2 ? parts[0]+killcache+
                "&"+parts[1] : parts[0]+killcache);
        } else {
            scriptUrl += killcache;
        }
        this.setCompleteCallback (callback);
        //TODO  do nothing???
        this.runLauncher(method, scriptUrl, formData);
} 
