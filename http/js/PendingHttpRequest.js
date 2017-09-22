function PendingHttpRequest(options) {
	this.url = options.url;
	this.method = options.method.toUpperCase();
	this.formData = options.formData;
	this.finalCallback = options.callback;
	this.server = options.server;
	this.analyser=options.analyser;
	this.editableResponse = { headers: {}, content: null };
}

PendingHttpRequest.prototype.setUrl = function(url) {
	this.url=url;
}

PendingHttpRequest.prototype.setMethod = function(method) {
	this.method=method.toUpperCase();
}

PendingHttpRequest.prototype.setPostData = function(postDataQS) {
	this.formData = new FormData();
	var postPairs = postDataQS.split("&");
	for(var i=0; i<postPairs.length; i++) {
		var curPair = postPairs[i].split("=");
		this.formData.append(curPair[0], curPair[1]);
	}
}

// immadiateCallback() runs as soon as we have sent
// it might for example run the http respojse part of an animation, to ensure
// we have the response available
PendingHttpRequest.prototype.send = function(callback, debugMgr=null) {
	var noQsUrl = this.url.indexOf("?")==-1 ? this.url: this.url.split("?")[0];
	var debugPHP = debugMgr!=null && 
		noQsUrl.substring(noQsUrl.length-4)==".php",
		actualUrl;

	if(debugPHP) {
		// added new code from old version to retrieve the source code
		var analyserUrl = this.analyser;
		// Kill the cache - this caused no reload at times
		if(this.method=='GET') {
			analyserUrl+="?killcache="+new Date().getTime()+
				"&target=";
			var parts = this.url.split("?");
			analyserUrl+=(parts.length==2 ? parts[0]+"&"+parts[1] : this.url);
		} else if (this.method=='POST') {
			this.formData.append("target", this.url);
		} 
		actualUrl = analyserUrl;
		http.send (this.method, actualUrl, this.formData).then
			((xmlHTTP) => {
			
				// TODO send the php to the code window...	
				var data= JSON.parse(xmlHTTP.responseText);
				callback(data);

				// launch the dbebug process
				var scriptUrl = this.url;
				// Kill the cache - this caused no reload at times
				if(this.method=='GET') {
					scriptUrl+="?killcache="+new Date().getTime()+
						"&";
					var parts = this.url.split("?");
					scriptUrl+=(parts.length==2 ? parts[0]+"&"+parts[1] : 
						this.url);
				} else if (this.method=='POST') {
			//TODO  do nothing???
				}		 
				debugMgr.setCompleteCallback (this.processResponse.bind(this,
					callback, debugPHP));
				debugMgr.runLauncher(this.method, scriptUrl, this.formData);

			} );

	} else {
		// ALSO do it for HTML urls
		actualUrl = noQsUrl + "?killcache="+new Date().getTime();
		http.send (this.method, actualUrl, this.formData).then
			(this.processResponse.bind(this, callback, debugPHP));
	}
}

PendingHttpRequest.prototype.getRequest = function() {
	var req=this.method + " " + this.url + " HTTP/1.1\nHost: " 
		+this.server+"\n";
	if(this.method=='POST') {
		req+="\n";
		var entries = this.formData.entries();
		var first=true;
		for(entry of entries) {
			if(first==true) {
				first=false;
			} else {
				req+="&";
			}
			req += entry[0] + "="+ entry[1];
		}
	}
	return req;
}

PendingHttpRequest.prototype.getResponse = function() {
	var response = "HTTP/1.1 " + this.editableResponse.status +" " +
				this.editableResponse.statusText+"\n";
	for(header in this.editableResponse.headers) {
		response+=header+": "+ this.editableResponse.headers[header]+"\n";
	}
	response += "\n"+ this.editableResponse.content ;
	return response; 
}

PendingHttpRequest.prototype.processResponse = function( callback, 
		debugPHP, xmlHTTP)
{
				alert('callback: ' + callback +
						' xmlHTTP=' + xmlHTTP + 
						' responseText=' + xmlHTTP.responseText);	
			var responseHeaders = xmlHTTP.getAllResponseHeaders().
				split("\r\n");
			// getAllResponseHeaders() seems to return 1 more than there 
			// actually is
			for(var i=0; i<responseHeaders.length-1; i++) {
				var curHeader = responseHeaders[i].split(": ");
				if(curHeader[0]!="Server") {
					this.editableResponse.headers[curHeader[0]] = curHeader[1];
				}
			}

			// if debugMgr null we put the content in editableResponse
			// otherwise we get it out of the debugMgr json
			var json=null;
			if(debugPHP) {
				/* TODO what we do after the debug session has finished
				needs to be sorted
				json = JSON.parse(xmlHTTP.responseText); 
				if(xmlHTTP.status==200 && json.response) {
					for(header in json.response.headers) {
						if(header!="Server") {
							this.editableResponse.headers[header] = 
								json.response.headers[header];
						}
					}
					this.editableResponse.status = json.response.status.code;
					this.editableResponse.statusText = 
						json.response.status.message;
					this.editableResponse.content = json.response.content;
				} else {
					this.editableResponse.status = xmlHTTP.status;
					this.editableResponse.statusText = xmlHTTP.statusText;
					this.editableResponse.content="";
				}
				*/

				// fix for now by placing the response text inside the 
				// content
				// TODO we still need to deal with different types of content
				if(xmlHTTP.status==200) {
					this.editableResponse.content = xmlHTTP.responseText; 
				} else {
					this.editableResponse.status = xmlHTTP.status;
					this.editableResponse.statusText = xmlHTTP.statusText;
					this.editableResponse.content="";
				}
				this.editableResponse.url = "http://"+this.server+this.url;
			} else {
				this.editableResponse.content = xmlHTTP.responseText; 
				this.editableResponse.url = xmlHTTP.responseURL;
				this.editableResponse.status = xmlHTTP.status;
				this.editableResponse.statusText = xmlHTTP.statusText;
			}
			callback(xmlHTTP);
			//Note:
			// -url is always relative (to root, no server) e.g. /~ephp001/..
			// -responseURL contains full server details
}

PendingHttpRequest.prototype.setAlteredStatus = function(code,text) {
	this.editableResponse.status = code;
	this.editableResponse.statusText = text;
}

PendingHttpRequest.prototype.setAlteredResponseHeader = function(name, value ) {
	this.editableResponse.headers[name] = value;
}
PendingHttpRequest.prototype.setContent = function(content) {
	this.editableResponse.content = content;
}

PendingHttpRequest.prototype.finish = function() {
	this.finalCallback(this.editableResponse);
}
