
function DebugMgr(launcher, options) {
    this.launcher = launcher;
    this.dbgMsgHandler = options.dbgMsgHandler || null;
    this.completeCallback = options.completeCallback || null;
}

DebugMgr.prototype.runLauncher = function(method, scriptUrl, userFormData) {
    console.log("runLauncher(): scriptUrl="+scriptUrl);
    var launcherFormData=new FormData();
    launcherFormData.append('cmd', 'start');
    http.send('POST', this.launcher,launcherFormData).
        then( (xmlHTTP) => {
                    // startup the websocket stuff
                    console.log("Response text=" + xmlHTTP.responseText);
                    var data = JSON.parse(xmlHTTP.responseText);
                    this.user = data.user;
                    console.log('USER: ' + this.user);
                    console.log("Launcher returned: "+ xmlHTTP.responseText);
                    this.connect(method, scriptUrl, userFormData);
                } ).catch( (statusCode) => {
                    console.log('http error: ' + statusCode);
                    } );
}

DebugMgr.prototype.connect = function(method, scriptUrl, userFormData) {
    //console.log("connect(): scriptUrl="+scriptUrl);
    console.log("create new websocket...");
    this.ws=new WebSocket('ws://ephp.solent.ac.uk:8080');
    //this.ws=new WebSocket('ws://localhost:8080');
    console.log('readystate=' + this.ws.readyState);

    this.ws.onopen = (e) => {
            console.log('onopen: sending ' + this.user);
            this.ws.send(JSON.stringify({"cmd":"user", "data":this.user}));
    }    

    this.ws.onmessage = (e) => {
        console.log("websocket sent: " + e.data);
        var data = JSON.parse(e.data);
        var fullDebugUrl = scriptUrl;
        // all debug commands have a user field to identify which user is
        // sending them, others will be ignored
        if(data.cmd && data.user && this.user == data.user &&
            this.dbgMsgHandler != null) {
            console.log("cmd from web socket server=" + data.cmd);
            switch(data.cmd) {
                case 'opened':
                    switch(method.toUpperCase()) {
                        case 'GET':
                            fullDebugUrl+='&XDEBUG_SESSION_START=' + this.user;
                            break;

                        case 'POST':
                            var debugFormData = new FormData();
                            debugFormData.append
                                ('XDEBUG_SESSION_START', this.user);
                            if(userFormData) {
                                var entries = userFormData.entries();
                                for (var entry of entries) {
                                    debugFormData.append(entry[0], entry[1]);
                                }
                            }
                            break;
                    }

                    console.log("Debugging script: " + fullDebugUrl);
                    http.send(method, fullDebugUrl, debugFormData).then
                        ((xmlHTTP)=>
                        {
                            if(this.completeCallback != null) {

                               console.log("debug session finished: "+
                                "Sending completeCallback with response: " + 
                                xmlHTTP.responseText);

                                if(xmlHTTP.responseText.indexOf("Parse error")
                                    >=0) {
                                     alert("Syntax error in your PHP script. "+
                                            "Details: " + 
                                            xmlHTTP.responseText.substr
                                                (xmlHTTP.responseText.
                                                    indexOf(":")+1).
                                                    replace(/<[^>]+>/g, ""));
                                }
                                this.completeCallback(xmlHTTP);
                        }
                    // send back to whatever called this 
                    }).catch((code)=>alert(code));
                    break;

                case 'stop':
                    this.dbgMsgHandler.handleStop();
                    break;

                default:
                    console.log("adding command to queue: "+ data.cmd);
                    this.dbgMsgHandler.addToQueue(data);
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

DebugMgr.prototype.launchDebugSession = function(scriptUrl, method, userFormData, callback) {
    // added new code from old version to retrieve the source code
    // Kill the cache - this caused no reload at times
    var killcache="?killcache="+new Date().getTime();
    if(method=='GET') {
        var parts = scriptUrl.split("?");
        scriptUrl=(parts.length==2 ? parts[0]+killcache+ 
            "&"+parts[1] : parts[0]+killcache);
    } else {
        scriptUrl += killcache;
    }
    this.setCompleteCallback (callback);
    this.dbgMsgHandler.clearQueue();
    this.runLauncher(method, scriptUrl, userFormData);
} 
