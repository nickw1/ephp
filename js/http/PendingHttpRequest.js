const Eventable = require('../gen/Eventable');

class PendingHttpRequest extends Eventable {
    constructor(options) {
        super();
        this.url = options.url;
        this.method = options.method.toUpperCase();
        this.formData = options.formData;
        this.server = options.server;
        this.sourceRetriever=options.sourceRetriever;
        this.editableResponse = { headers: {}, content: null };
    }

    setUrl(url) {
        this.url=url;
    }

    setMethod (method) {
        this.method=method.toUpperCase();
    }

    setPostData(postDataQS) {
        this.formData = new FormData();
        var postPairs = postDataQS.split("&");
        for(var i=0; i<postPairs.length; i++) {
            var curPair = postPairs[i].split("=");
            this.formData.append(curPair[0], curPair[1]);
        }
    }

    isPHPScript() {
        var noQsUrl = this.url.indexOf("?")==-1 ? this.url: this.url.split("?")[0];
        return noQsUrl.substring(noQsUrl.length-4)==".php";
    }

    // immadiateCallback() runs as soon as we have sent
    // it might for example run the http response part of an animation, to ensure
    // we have the response available
    // 251119 change to call on callback
    send() {
        var actualUrl = (this.url.indexOf("?")==-1 ? this.url: 
            this.url.split("?")[0]) + "?killcache=" + new Date().getTime();
        var xhr = new XMLHttpRequest();
        xhr.addEventListener("load", e=> {
            if(e.target.status == 200) {
                this.processResponse(e.target, false);
            } else {
                this.setErrorResponse(e.target.status);
                if(this.eventHandlers["responseprocessed"]) {
                    this.eventHandlers["responseprocessed"]();
                }    
            }
        });
        xhr.open(this.method, actualUrl);
        xhr.send(this.formData);
    }

// to be called in debug mode as the first step: 
// retireves the source code using the source retriever
    retrieveSrc(callbacks) {
        var sourceRetrieverUrl = this.sourceRetriever;
        if(this.method=='GET') {
            sourceRetrieverUrl += '?killcache='+new Date().getTime()+'&target=';
            var parts = this.url.split('?');
            sourceRetrieverUrl += (parts.length==2) ? parts[0]+'&'+parts[1]: this.url;
        } else if (this.method=='POST') {
            console.log('PendingHttpRequest.retrieveSrc ' + this.url);
            this.formData.append('target', this.url);
        }
        var xhr = new XMLHttpRequest();
        xhr.addEventListener("load", e=> {
            if(e.target.status == 200) {
                callbacks.onSuccess(JSON.parse(e.target.responseText));
            } else {
                callbacks.onError(e.target.status);
            }
        });
        xhr.open(this.method, sourceRetrieverUrl);
        xhr.send(this.formData);
    }

    getRequest() {
        var req=this.method + " " + this.url + " HTTP/1.1\nHost: " 
            +this.server+"\n";
        if(this.method=='POST') {
            req+="\n";
            var entries = this.formData.entries();
            var first=true;
            for(let entry of entries) {
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

    getResponse() {
        var response = "HTTP/1.1 " + this.editableResponse.status +" " +
                    this.editableResponse.statusText+"\n";
        for(let header in this.editableResponse.headers) {
            response+=header+": "+ this.editableResponse.headers[header]+"\n";
        }
        response += "\n"+ this.editableResponse.content ;
        return response; 
    }

    processResponse( xmlHTTP, debugPHP=true) {
        console.log("response headers: " + xmlHTTP.getAllResponseHeaders());
        var responseHeaders = xmlHTTP.getAllResponseHeaders().split("\r\n");
        // getAllResponseHeaders() seems to return 1 more than there  actually is
        for(var i=0; i<responseHeaders.length-1; i++) {
            var curHeader = responseHeaders[i].split(": ");
            if(curHeader[0].toLowerCase()!="server") {
                this.editableResponse.headers[curHeader[0].toLowerCase()] = curHeader[1];
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
        }

        if(!debugPHP || !window.app.settings.server_anim) {
            if(this.eventHandlers["responseprocessed"]) {
                this.eventHandlers["responseprocessed"](); 
            }
        }

        //Note:
        // -url is always relative (to root, no server) e.g. /~ephp001/..
        // -responseURL contains full server details
    }

    setAlteredStatus(code,text) {
        this.editableResponse.status = code;
        this.editableResponse.statusText = text;
    }

    setAlteredResponseHeader(name, value ) {
        this.editableResponse.headers[name] = value;
    }

    setContent(content) {
        this.editableResponse.content = content;
    }

    setErrorResponse(httpcode) {
        this.setAlteredStatus(httpcode, '');
        this.setAlteredResponseHeader('content-type', 'text/html');
        this.setContent('<p>There was an error retrieving the URL.</p>');
    }

    finish() {
        this.eventHandlers["responsereceived"](this.editableResponse);
    }
}

module.exports = PendingHttpRequest;
