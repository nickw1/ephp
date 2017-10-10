function PendingHttpRequest(options) {
    this.url = options.url;
    this.method = options.method.toUpperCase();
    this.formData = options.formData;
    this.finalCallback = options.callback;
    this.server = options.server;
    this.sourceRetriever=options.sourceRetriever;
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

PendingHttpRequest.prototype.isPHPScript = function() {
	var noQsUrl = this.url.indexOf("?")==-1 ? this.url: this.url.split("?")[0];
	return noQsUrl.substring(noQsUrl.length-4)==".php";
}

// immadiateCallback() runs as soon as we have sent
// it might for example run the http respojse part of an animation, to ensure
// we have the response available
PendingHttpRequest.prototype.send = function(immediateCallback) {

    var actualUrl = (this.url.indexOf("?")==-1 ? this.url: 
			this.url.split("?")[0]) + "?killcache=" + new Date().getTime();
    	http.send (this.method, actualUrl, this.formData).then
       	 ( (xmlHTTP) => { 
			this.processResponse(xmlHTTP,false,immediateCallback);
            } );
}

// to be called in debug mode as the first step: 
// retireves the source code using the source retriever
PendingHttpRequest.prototype.retrieveSrc = function(callback) {
	var sourceRetrieverUrl = this.sourceRetriever;
	if(this.method=='GET') {
		sourceRetrieverUrl += '?killcache='+new Date().getTime()+'&target=';
		var parts = this.url.split('?');
		sourceRetrieverUrl += (parts.length==2) ? parts[0]+'&'+parts[1]: 
                this.url;
	} else if (this.method=='POST') {
		this.formData.append('target', this.url);
	}
	actualUrl = sourceRetrieverUrl;

    http.send (this.method, actualUrl, this.formData).then
        ( (xmlHTTP) => { 
                // if in debug mode we will get PHP source back, so send that
                // back to be displayed (subsequently, a debug session will
                // begin)
				callback(JSON.parse(xmlHTTP.responseText));
            });
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

PendingHttpRequest.prototype.processResponse = function( xmlHTTP,
		debugPHP, callback)
{
            var responseHeaders = xmlHTTP.getAllResponseHeaders().split("\r\n");
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
                if(xmlHTTP.status==200) { 
                    this.editableResponse.status = 200;
                    this.editableResponse.statusText =  xmlHTTP.statusText;
                    this.editableResponse.content =  xmlHTTP.responseText;
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
                if(callback) {
                    callback(); 
                }
            }
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
