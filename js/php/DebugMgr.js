
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
            // all debug commands have a user field to identify which user is
            // sending them, others will be ignored
            if(data.cmd && data.user && this.user == data.user && this.dbgMsgHandler != null) {
                switch(data.cmd) {
                    case 'opened':
                        this.requestScriptAjax(method, scriptUrl, userFormData);
                        break;

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
            alert('Could not connect to web socket server. Please start sockserver.php or ask your tutor to start it.');
        }
    }

    requestScriptAjax(method, scriptUrl, userFormData, doDebug=true) {
        let fullUrl = scriptUrl;
        let fullFormData = null;
        if(doDebug) {
            switch(method.toUpperCase()) {
                case 'GET':
                    fullUrl+='&XDEBUG_SESSION_START=' + this.user;
                    break;

                case 'POST':
                    fullFormData = new FormData();
                    fullFormData.append ('XDEBUG_SESSION_START', this.user);
                    if(userFormData) {
                        var entries = userFormData.entries();
                        for (var entry of entries) {
                            fullFormData.append(entry[0], entry[1]);
                        }
                    }
                    break;
            }
        } else {
            fullFormData = userFormData;
        }

        console.log("Debugging script: " + fullUrl);
        const xhr = new XMLHttpRequest();
        xhr.addEventListener("load", e=> {    
            if(e.target.status != 200) {
                this.dbgMsgHandler.showError(`HTTP error ${e.target.status}`);
            } else if(this.completeCallback != null) {
               console.log("debug session finished: "+
                "Sending completeCallback with response: " + 
                e.target.responseText);

                if(e.target.responseText.indexOf("Parse error") >=0) {
                     this.dbgMsgHandler.displayError("<p><strong>Syntax error in your PHP script.</strong><?p><p>Details: " + e.target.responseText.substr (e.target.responseText.  indexOf(":")+1).replace(/<[^>]+>/g, "")+"</p><p><em>If you do not see an error in that line, try looking at the line above.</em</p>");
                }
                this.completeCallback(e.target);
            }
        });
        xhr.open(method, fullUrl);
        xhr.send(fullFormData);
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
