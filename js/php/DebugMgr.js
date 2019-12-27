
class DebugMgr {
    
    constructor(options) {
        this.dbgMsgHandler = options.dbgMsgHandler || null;
        this.completeCallback = options.completeCallback || null;
        this.overrideUser = options.overrideUser || null;
        this.user = options.user || null;
    }

    connect(method, scriptUrl, userFormData) {
        //console.log("connect(): scriptUrl="+scriptUrl);
        console.log('create new websocket...');
        this.ws=new WebSocket(`ws://${window.app.config.sockserver}:8080`);
        console.log('readystate=' + this.ws.readyState);

        this.ws.onopen = (e) => {
            console.log('onopen: sending ' + this.user);
            this.ws.send(JSON.stringify({"cmd":"user", "data":this.user}));
        }    

        this.ws.onmessage = (e) => {
            var data = JSON.parse(e.data);
            var fullDebugUrl = scriptUrl;
            // all debug commands have a user field to identify which user is
            // sending them, others will be ignored
            if(data.cmd && data.user && this.user == data.user && this.dbgMsgHandler != null) {
                switch(data.cmd) {
                    case 'opened':
                        switch(method.toUpperCase()) {
                            case 'GET':
                                fullDebugUrl+='&XDEBUG_SESSION_START=' + this.user;
                                break;

                            case 'POST':
                                var debugFormData = new FormData();
                                debugFormData.append ('XDEBUG_SESSION_START', this.user);
                                if(userFormData) {
                                    var entries = userFormData.entries();
                                    for (var entry of entries) {
                                        debugFormData.append(entry[0], entry[1]);
                                    }
                                }
                                break;
                        }

                        console.log("Debugging script: " + fullDebugUrl);
                        const xhr = new XMLHttpRequest();
                        xhr.addEventListener("load", e=> {    
                            if(e.target.status != 200) {
                                alert(`HTTP error ${e.target.status}`);
                            } else if(this.completeCallback != null) {
                               console.log("debug session finished: "+
                                "Sending completeCallback with response: " + 
                                e.target.responseText);

                                if(e.target.responseText.indexOf("Parse error") >=0) {
                                     alert("Syntax error in your PHP script.  Details: " + e.target.responseText.substr (e.target.responseText.  indexOf(":")+1).  replace(/<[^>]+>/g, ""));
                                }
                                this.completeCallback(e.target);
                            }
                        });
                        xhr.open(method, fullDebugUrl);
                        xhr.send(debugFormData);
                        break;
"body"
                case 'stop':
                    this.dbgMsgHandler.handleStop();
                    break;

                default:
                    this.dbgMsgHandler.addToQueue(data);
                    break;
            }
        }
    }
        this.ws.onerror = (e) => {
            alert('ERROR: ' + e.data);
        }
    }

    initiateDebugSession() {
        this.ws.send(JSON.stringify({"cmd":"user", "data":document.getElementById("user").value}));
    }

    setCompleteCallback(cb) {
        this.completeCallback = cb;
    }

    launchDebugSession(scriptUrl, method, userFormData, callback) {
        // added new code from old version to retrieve the source code
        // Kill the cache - this caused no reload at times
        var killcache="?killcache="+new Date().getTime();
        if(method=='GET') {
            var parts = scriptUrl.split("?");
            scriptUrl=(parts.length==2 ? parts[0]+killcache+ "&"+parts[1] : parts[0]+killcache);
        } else {
            scriptUrl += killcache;
        }
        this.setCompleteCallback (callback);
        this.dbgMsgHandler.clearQueue();
        if(this.user != null) {    
            this.connect(method, scriptUrl, userFormData);
        } else {
            alert('Cannot launch debug session as not logged in');
        }
    } 

    toString() {
        return `DebugMgr object: user=${this.user}`;
    }
}

module.exports = DebugMgr;
