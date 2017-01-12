// window.location.hostname
// window.location.protocol http:

function Browser(options) {
    this.div = document.getElementById(options.divId);
    var elem = this.div;

    this.animation = options.animation || null;
    this.addressDiv = document.createElement("div");
    this.addressDiv.appendChild(document.createTextNode("Address:"));
    this.addressDiv.style.display = 'flex';
    this.addressDiv.style.padding= '2px';
    this.addressDiv.style.border= '1px solid black';
    this.addressDiv.style.backgroundColor = '#808080';
    this.addressBox = document.createElement("input");
    this.addressBox.style.flexGrow = 5;
    this.addressDiv.appendChild(this.addressBox);
    this.addressButton = document.createElement("input");
    this.addressButton.style.flexGrow = 1;
    this.addressButton.setAttribute("type", "button");
    this.addressButton.setAttribute("value","Go!");
    this.addressButton.addEventListener("click", 
                    (function()  {
                        this.sendRequest("GET", this.addressBox.value);
                    }).bind(this));
    this.addressDiv.appendChild(this.addressButton);
    this.div.appendChild(this.addressDiv);
    this.content = document.createElement("div");
    this.div.appendChild(this.content);
    if(this.animation!=null) {
        if(this.animation.phpAnimation != null) {
            this.animation.phpAnimation.browserCallback =
                this.highlightFormField.bind(this);
        }
    }
    this.saveOldCallback = options.saveOldCallback || null;
    this.altered=false;
    this.webDir="";
    this.editor = ace.edit(options.sourceElement);
    this.editor.setOptions({fontSize:"12pt"});
    this.editor.getSession().setMode("ace/mode/php");
    this.editor.on("change", (function(e) {
        this.showContent('text/html', this.editor.getValue());
        this.altered=true;
            }).bind(this));
    this.addedCssRules = [];
    this.setRequestingState(false);
}

Browser.prototype.sendRequest = function(method,url,formData) {
    this.setRequestingState(true);
    var regexp=/^(http:\/\/[^\/]+)?(\/.*)$/;    
    var parts = url.match(regexp);
    if(parts==null) {
        alert("Invalid URL");
    } else if(this.animation==null) {
        http.send(method, url, formData).then(
                (function() {
                    this.setRequestingState(false);
                    this.loadResponse();
                    } ).bind(this));
    } else {
        var pXHR = new PendingHttpRequest
            ( {
                url: parts[2], 
                method: method,
                formData: formData,
                callback: this.loadResponse.bind(this),
                server: parts[1]?parts[1].replace("http://",""):
                        window.location.hostname,
                analyser: 'php/analyser.php'
              }
            );

        this.animation.setHttp(pXHR);
        this.animation.animate({onmessagestart:
                                    this.setRequestingState.bind(this,true),
                                onmessageend:
                                    this.setRequestingState.bind(this,false)});
    }
}

Browser.prototype.setRequestingState = function(state) {
    if(state) {
        this.addressButton.setAttribute("disabled", "disabled");
    } else {
        this.addressButton.removeAttribute("disabled");
    }
    this.requesting = state;
}

// Handles editableResponse from animation or ordinary XMLHttpRequest 
Browser.prototype.loadResponse = function(o) {
    this.setRequestingState(false);
    var status=200, url="/", responseText="", mimetype="text/html",
        statusText="OK";
    if(o.headers) {
        status = o.status;
        url = o.url;
        responseText = o.content;
        mimetype = o.headers["Content-Type"];
        console.log("mimetype="+mimetype)
        statusText = o.statusText;
    } else if (o.responseText) {
        status = o.status;
        statusText = o.statusText;
        url = o.responseURL;
        responseText = o.responseText;
        var responseHeaders = e.getAllResponseHeaders().
                split("\r\n");
        for(var i=0; i<responseHeaders.length-1; i++) {
            var curHeader = responseHeaders[i].split(": ");
            if(curHeader[0]=="Content-Type") {
                mimetype = curHeader[1];
            }
        }    
    }
        
    if(status==200) {

        // Use either supplied parameters (e.g. changed in the animation)
        // or oriignal parameters from original ajax request
        this.webDir = url.substr (0,url.lastIndexOf("/"));
        this.addressBox.value =  url;
        if(this.saveOldCallback) {
            this.saveOldCallback 
                (this.loadDocumentOrImage.bind(this,mimetype,url,responseText));
        } else {
            this.loadDocumentOrImage(mimetype, url, responseText);
        }
            
    } else {
        this.content.innerHTML = 'HTTP error: ' + status + 
                ' ' + statusText;
    } 
}


Browser.prototype.showContent = function(mimetype, responseText) {
    if (mimetype=='text/plain') {
        this.content.innerHTML = "";
        var pre = document.createElement("pre");
        pre.appendChild
                (document.createTextNode(responseText));
        this.content.appendChild(pre);
    } else {
        // remove any old added css rules
        // we added them to the beginning of styleshset 0, so this should work
        for(var i=0; i<this.addedCssRules.length; i++) {
            document.styleSheets[0].deleteRule(0);
        }
        this.addedCssRules = [];

        // To get at the CSS rules of the document returned, we need to 
        // create a temporary HTML DOM document and read the rules from that.
        // developer.mozilla.org/en-US/Add-ons/Code_snippets/
        // HTML_to_DOM#Parsing_Complete_HTML_to_DOM
        var tmpDoc = document.implementation.createHTMLDocument("tmpDoc");
        // none of these work
        /*
        tmpDoc.addEventListener("DOMContentLoaded", function(e) {
                alert("ready"); 
                });
        tmpDoc.addEventListener("load", function(e) {
                alert("load event"); 
                });
        tmpDoc.documentElement.addEventListener("DOMContentLoaded", function(e){
                alert("ready document elemnet"); 
                });
        tmpDoc.documentElement.addEventListener("load", function(e) {
                alert("load event dccument element"); 
                });
        tmpDoc.addEventListener("readystatechange", function(e){
                alert("readystatechange"); 
                });
        tmpDoc.documentElement.addEventListener("readystatechange",function(e){
                alert("readystatechange dccument element"); 
                });
        */  

        tmpDoc.documentElement.innerHTML = responseText;    
        //var parser = new DOMParser();
        //var tmpDoc = parser.parseFromString(responseText, "text/html");
        //console.log("created HTML using DOMParser");


        // Note getting the styleSheets fails in Chrome
        // It works on Firefox and IE
        for(var i=0; i<tmpDoc.styleSheets.length; i++) {
            for(var j=0; j<tmpDoc.styleSheets[i].cssRules.length; j++) {
                console.log(tmpDoc.styleSheets[i].cssRules[j].selectorText);
                var newRule = "#" + this.div.id+" #virtualBody "+
                    (tmpDoc.styleSheets[i].cssRules[j].selectorText=="body"?
                    "":tmpDoc.styleSheets[i].cssRules[j].selectorText) + "{"+
                    tmpDoc.styleSheets[i].cssRules[j].style.cssText + 
                    "}";
                console.log(i+","+j+": new rule="+newRule);
                document.styleSheets[0].insertRule(newRule, 0);
                this.addedCssRules.push(newRule);
            }
        }
        var virtualBody = document.createElement("div");
        virtualBody.id = "virtualBody";
        virtualBody.innerHTML = tmpDoc.body.innerHTML; 

        // The only way this seems to get close to working is to set the 
        // virtualBody positioning to absolute and the content div's 
        // positioning to relative. Making everything flex doesn't seem to
        // work. 
        virtualBody.style.width="100%";
        virtualBody.style.height="90%";
        virtualBody.style.position="absolute";
        this.div.style.position="relative";
        this.content.innerHTML = "";
        this.content.appendChild(virtualBody);
        var forms = this.content.getElementsByTagName("form");
        for(var i=0; i<forms.length; i++) {    
            forms[i].addEventListener("submit", (function(form,e){
                e.preventDefault();
                var actionLocalUrl = form.action.substring
                        (form.action.lastIndexOf("/")+1);
                var formData = new FormData();
                var qs="";
                switch(form.method.toUpperCase()) {
                    case 'POST':
                        for(var j=0; j<form.elements.length; j++) {
                            if(form.elements[j].type!="submit") {
                                formData.append(form.elements[j].name, 
                                    form.elements[j].value);    
                            }
                        }
                        break;

                    case 'GET':
                        for(var j=0; j<form.elements.length; j++) {
                            var el = form.elements[j];
                            if(form.elements[j].type!="submit") {
                                qs+= (qs=="" ? "?":"&");
                                qs += form.elements[j].name+ 
                                        "="+form.elements[j].value;
                            }
                        }
                        break;
                }
                actionLocalUrl+=qs;
                this.sendRequest(form.method,
                        this.webDir+"/"+actionLocalUrl,formData);
            }).bind(this,forms[i]));    
        }

        var links = this.content.getElementsByTagName("a"); 
        for(var i=0; i<links.length; i++) {
            links[i].addEventListener("click", (function(e) {
                e.preventDefault();
                var href=e.target.getAttribute("href");
                this.sendRequest('GET',
                    href.substr(0,7)=="http://" ? href:
                        this.webDir+"/"+href);
            }).bind(this));
        }
    }
}

Browser.prototype.showImage = function(url) {
    var img = new Image();
    img.src = url; 
    img.onload = (function() {
        this.content.innerHTML = "";
        this.content.appendChild(img);
    }).bind(this);
}

Browser.prototype.highlightFormField = function(fieldName, colour) {

    var forms = this.content.getElementsByTagName("form");
    for(var i=0; i<forms.length; i++) {
        for(var j=0; j<forms[i].elements.length; j++) {
            if(forms[i].elements[j].name==fieldName) {
                forms[i].elements[j].style.backgroundColor = colour;
                this.selectedField = forms[i].elements[j];
            }
        }
    }
}

Browser.prototype.setCode = function(code) {
    this.setContent('text/html', code);
}

Browser.prototype.setContent = function(mime,code) {
    this.editor.setValue(code);
    this.showContent(mime, code);
    this.markUnaltered();
}
    
Browser.prototype.getCode = function() {
    return this.editor.getValue();
}

Browser.prototype.getContentArea = function() {
    return this.content;
}

Browser.prototype.markUnaltered = function() {
    this.altered = false;
}

Browser.prototype.isAltered = function() {
    return this.altered && this.editor.getValue().length > 0;    
}

Browser.prototype.setWebDir = function(dir){
    this.webDir = dir; 
}

Browser.prototype.setFile = function(file) {
    this.addressBox.value = this.webDir + "/" +file;
}

Browser.prototype.loadDocumentOrImage = function(mimetype, url, responseText) {
    if(mimetype=='image/jpeg' || mimetype=='image/png' ||
                mimetype=='image/jpg') { 
        this.showImage(url);
        this.markUnaltered();
    } else {
        this.setContent(mimetype, responseText);
    }
}
