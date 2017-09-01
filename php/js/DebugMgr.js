
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
					alert("Launcher returned: "+ xmlHTTP.responseText +
							" user="+this.user);
					this.connect(method, url, formData);
				} ).catch( (statusCode) => {
					alert('http error: ' + statusCode);
					} );
}

DebugMgr.prototype.connect = function(method, url, formData) {
	this.ws=new WebSocket('ws://ephp.solent.ac.uk:8080');

	this.ws.onopen = (e) => {
			alert('opened websocket! now starting the debugging');

			// the ajax callback should run when the debug session is
			// complete???
			http.send(method, url+
				'&XDEBUG_SESSION_START='+
					this.user, formData).then((xmlHTTP)=>
				{alert('completed: ' + xmlHTTP.responseText);
				if(this.completeCallback != null) {
					this.completeCallback(xmlHTTP.responseText);
				}
					// sned back to whatever called this 
				}).
				catch((code)=>alert(code));
	}    

	this.ws.onmessage = (e) => {
		console.log("Message from websocket="+e.data);
		var data = JSON.parse(e.data);
		// all debug commands have a user field to identify which user is
		// sending them, others will be ignored
		if(data.cmd && data.user && this.user == data.user &&
			this.dbgMsgHandler != null) {
			if (data.cmd && data.cmd=='line') {
				// handle line number
				this.dbgMsgHandler.handleLine(data.data);
			} else if (data.cmd && data.cmd=='newrow') {
				// handle a new database row
				this.dbgMsgHandler.handleNewRow(data.data);
			} else if (data.cmd.stop) {
				this.dbgMsgHandler.handleStop();
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
            {alert('stopped: ' + e.target.responseText); }).
				catch((code)=>{alert(code)});
}

DebugMgr.prototype.setCompleteCallback = function(cb) {
	this.completeCallback = cb;
}
