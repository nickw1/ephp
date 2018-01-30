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
                    () =>  {
                        this.sendRequest("GET", this.addressBox.value);
                    });
    this.addressDiv.appendChild(this.addressButton);
    this.div.appendChild(this.addressDiv);
    this.nonHTMLContainer = document.createElement("div");
    this.content = document.createElement("div");
    this.div.appendChild(this.nonHTMLContainer);
    this.div.appendChild(this.content);
    if(this.animation!=null) {
        if(this.animation.serverAnimation != null) {
            this.animation.serverAnimation.browserCallback =
                this.highlightFormField.bind(this);
        }
    }
    this.saveOldCallback = options.saveOldCallback || null;
    this.altered=false;
    this.alteredStatusFrozen = false;
    this.webDir="";
    this.editor = ace.edit(options.sourceElement);
    this.editor.setOptions({fontSize:"12pt"});
    this.editor.getSession().setMode("ace/mode/php");
    this.editor.on("change", (e)=> {
        this.showContent('text/html', this.editor.getValue());
        if(!this.alteredStatusFrozen) {
            this.altered=true;
        }
            });
    this.addedCssRules = [];
    this.setRequestingState(false);

    this.animation.addOnMessageStartListener
        (this.setRequestingState.bind(this,true));
    this.animation.addOnMessageEndListener
        (this.setRequestingState.bind(this,false));

    this.doAnimation = true;
}

Browser.prototype.sendRequest = function(method,url,formData) {
    this.setRequestingState(true);
    var regexp=/^(http:\/\/[^\/]+)?(\/.*)$/;    
    var parts = url.match(regexp);
    if(parts==null) {
        alert("Invalid URL: it must use HTTP");
    } else if(this.animation==null) {
        http.send(method, url, formData).then(
                () =>{
                    this.setRequestingState(false);
                    this.loadResponse();
                    } );
    } else {
        var pXHR = new PendingHttpRequest
            ( {
                url: parts[2], 
                method: method,
                formData: formData,
                callback: this.loadResponse.bind(this),
                server: parts[1]?parts[1].replace("http://",""):
                        window.location.hostname,
                sourceRetriever: 'php/retriever.php'
              }
            );

        if(this.doAnimation) {
            this.animation.stop(); // stop any previous animations
            this.animation.setMessage(pXHR);
            this.animation.paused = false;
            this.animation.animate();
        } else {
            // kick off the php stepthrough 
        }
    }
}

Browser.prototype.setRequestingState = function(state) {
    /*
    if(state) {
        this.addressButton.setAttribute("disabled", "disabled");
    } else {
        this.addressButton.removeAttribute("disabled");
    }
    */
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
        // deal with Content-types with charset stuff after
        mimetype = (o.headers["content-type"].split(";"))[0];
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
            if(curHeader[0]=="content-type") {
                mimetype = (curHeader[1].split(";"))[0];
            }
        }    
    }
        
    if(status==200) {

        // Use either supplied parameters (e.g. changed in the animation)
        // or oriignal parameters from original ajax request
        console.log("got a response...");
        this.webDir = url.substr (0,url.lastIndexOf("/"));
        var urlComponents = url.indexOf('?')==-1 ? [url]:
            url.split('?');
        if(urlComponents.length>1) {
            var keyvals = urlComponents[1].split('&');
            var counted=0;
            for(var i=0; i<keyvals.length; i++) {
                if(keyvals[i].substr(0,10)!='killcache=') {
                    urlComponents[0] += (counted==0 ? '?' : '&') + keyvals[i];
                    counted++;
                }
            }
        }
        this.addressBox.value = urlComponents[0];
        if(this.saveOldCallback) {
            this.saveOldCallback 
                (this.loadDocumentOrImage.bind(this,mimetype,url,responseText));
        } else {
            this.loadDocumentOrImage(mimetype, url, responseText);
        }
            
    } else {
        this.showHTMLMsg('HTTP error: ' + status + ' ' + statusText);
    } 
}

Browser.prototype.showHTMLMsg = function(msg) {
    this.nonHTMLContainer.innerHTML = "";
        if(this.shadow) {
            this.shadow.innerHTML = msg;
        } else {
            this.content.innerHTML = msg;
        }
}
    
Browser.prototype.showContent = function(mimetype, responseText) {
    this.nonHTMLContainer.innerHTML = "";
    if (mimetype=='text/plain') {
        if(this.shadow) {
            this.shadow.innerHTML = "";
        } else {
            this.content.innerHTML = "";
        }
        
        var pre = document.createElement("pre");
        pre.appendChild
                (document.createTextNode(responseText));
        this.nonHTMLContainer.appendChild(pre);
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

        this.div.style.position="relative";
        this.content.innerHTML = "";
        if(this.content.attachShadow) { // shadow DOM in Chrome
        console.log("is shadow");
//        if(false) {
            if(!this.shadow) {
                    
            console.log("create shadow");
                this.shadow = this.content.attachShadow({mode:'open'});
//                console.log("link? " + this.shadow.querySelector('link'));
            }
            this.shadow.innerHTML = responseText;
//            var match=this.shadow.innerHTML.match(/link/);
                
        } else { // no shadow - below works in Firefox
        var tmpDoc = document.implementation.createHTMLDocument("tmpDoc");
        tmpDoc.documentElement.innerHTML = responseText;    
        console.log('styleSheets length=' + tmpDoc.styleSheets.length +
                ' document.styleSheets.length=' + document.styleSheets.length);
        for(var i=0; i<tmpDoc.styleSheets.length; i++) {
            for(var j=0; j<tmpDoc.styleSheets[i].cssRules.length; j++) {
                //console.log(tmpDoc.styleSheets[i].cssRules[j].selectorText);
                var newRule = "#" + this.div.id+" #virtualBody "+
                    (tmpDoc.styleSheets[i].cssRules[j].selectorText=="body"?
                    "":tmpDoc.styleSheets[i].cssRules[j].selectorText) + "{"+
                    tmpDoc.styleSheets[i].cssRules[j].style.cssText + 
                    "}";
                //console.log(i+","+j+": new rule="+newRule);
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
        //this.div.style.position="relative";
        //this.content.innerHTML = "";
        this.content.appendChild(virtualBody);
        }
        var forms = this.shadow ? 
            this.shadow.querySelectorAll("form"):
            this.content.getElementsByTagName("form");
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

        var links = this.shadow ?
                this.shadow.querySelectorAll("a"):
                this.content.getElementsByTagName("a"); 
        for(var i=0; i<links.length; i++) {
            links[i].addEventListener("click", (e)=> {
                e.preventDefault();
                var href=e.target.getAttribute("href");
                this.sendRequest('GET',
                    href.substr(0,7)=="http://" ? href:
                        this.webDir+"/"+href);
            });
        }
    }
}

Browser.prototype.showImage = function(url) {
    var img = new Image();
    img.onerror = ()=> {
        this.showHTMLMsg( url + 
            " could not be loaded as it is an invalid image.");
        };
    img.src = url; 
    img.onload = ()=> {
        this.showHTMLMsg("");
        this.nonHTMLContainer.innerHTML = "";
        this.nonHTMLContainer.appendChild(img);
    };
}

Browser.prototype.highlightFormField = function(fieldName, colour) {
    console.log(`****highlightFormField() : ${fieldName} ${colour}`);
    var forms = this.shadow ? 
            this.shadow.querySelectorAll("form"):
            this.content.getElementsByTagName("form");
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
//    this.refresh();
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

Browser.prototype.loadExternalCSS = function() {
        var match =this.shadow.innerHTML.match(/<link[^>]+href="([A-Za-z0-9_\-]+.css)"[^>]*>/);
        if(match && match[1])  {
            console.log("sending css to: " + this.webDir+"/"+match[1]);
            http.send('GET', this.webDir+"/"+match[1]).then(
                    (xmlhttp) =>{
                    console.log("done: " + xmlhttp.responseText.replace("body",":host"));
                    this.shadow.innerHTML += '<style>'+
                            xmlhttp.responseText.replace("body",":host")+ 
                            '</style>';
//                        alert(xmlhttp.responseText);        
                    } ).catch((code)=>{ 
						console.log("Warning - could not load external css: " + code);});
        }
}

Browser.prototype.loadDocumentOrImage = function(mimetype, url, responseText) {
    console.log(`loadDocumentOrImage() ${mimetype} ${url}`);
    if(mimetype=='image/jpeg' || mimetype=='image/png' ||
                mimetype=='image/jpg') { 
        this.showImage(url);
        this.markUnaltered();
    } else if (mimetype=='text/html' || mimetype=='text/plain') {
        this.setContent(mimetype, responseText);
		this.loadExternalCSS();
    } else {
        this.setContent('text/html', 
            'This browser does not recognise the content type '+ mimetype);
    }
}

Browser.prototype.setFreezeAlteredStatus = function(value) {
    this.alteredStatusFrozen = value;
}

Browser.prototype.refresh = function() {
    this.editor.resize(true);
}

Browser.prototype.setAnimation = function(doAnimation) {
    this.doAnimation = doAnimation;
}
