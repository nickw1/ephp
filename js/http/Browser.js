// window.location.protocol http:

const Eventable = require('./Eventable');
const PendingHttpRequest = require("./PendingHttpRequest");

class Browser extends Eventable {

    constructor(options) {
        super();
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
        this.altered=false;
        this.alteredStatusFrozen = false;
        this.webDir="";
        this.lock = false;
        this.editor = ace.edit(options.sourceElement);
        this.editor.setOptions({fontSize:"10pt"});
        this.editor.getSession().setMode("ace/mode/php");
        //this.editor.setTheme('ace/theme/twilight');
        this.editor.setTheme('ace/theme/monokai');
        this.editor.on("change", (e)=> {
            if(!this.lock) {
                this.showContent('text/html', this.editor.getValue());
            } 
            if(!this.alteredStatusFrozen) {
                this.altered=true;
            }
                });
        this.addedCssRules = [];
        this.setRequestingState(false);

        this.animation.on("messagestart",this.setRequestingState.bind(this,true));
        this.animation.on("messageend", this.setRequestingState.bind(this,false));

        this.doAnimation = true;
    }


    sendRequest (method,url,formData) {
        this.setRequestingState(true);
        var regexp=/^(https?:\/\/[^\/]+)?\/?(.*)$/;    
        var parts = url.match(regexp);
        if(parts==null) {
            alert("Invalid URL: " + url + " it must use HTTP(S)");
        } else if(this.animation==null) {
            var xhr = new XMLHttpRequest();
            xhr.addEventListener("load", ()=> {
                this.setRequestingState(false);
                this.loadResponse();
            });
            xhr.open(method, url);
            xhr.send(formData);
        } else {
            if(parts[1] && parts[1].replace('http://','') != window.location.hostname) {
                alert(`Cannot fetch a page from another server ${parts[1]}, only this server i.e. ${window.location.hostname}`);
            } else {
                var pXHR = new PendingHttpRequest
                    ( {
                        url: "/"+parts[2], 
                        method: method,
                        formData: formData,
                        server: parts[1]?parts[1].replace("http://",""):
                            window.location.hostname,
                        // TODO different retrievers for different langs
                        sourceRetriever: 'php/retriever.php'
                      }
                    );

				pXHR.on("responsereceived", this.loadResponse.bind(this));

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
    }

    setRequestingState(state) {
        this.requesting = state;
    }

    // Handles editableResponse from animation or ordinary XMLHttpRequest 
    loadResponse(o) {
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
            if(this.eventHandlers.responseloaded) {
                this.eventHandlers.responseloaded(this.loadDocumentOrImage.bind(this,mimetype,url,responseText));
            } else {
                this.loadDocumentOrImage(mimetype, url, responseText);
            }
                
        } else {
            this.showHTMLMsg('HTTP error: ' + status + ' ' + statusText);
        } 
    }

    showHTMLMsg (msg) {
        this.nonHTMLContainer.innerHTML = "";
        if(this.shadow) {
            this.shadow.innerHTML = msg;
        } else {
            this.content.innerHTML = msg;
        }
    }

        
    showContent (mimetype, responseText) {
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
            if(this.content.attachShadow) { // shadow DOM in Chrome dnd now Firefox
                if(!this.shadow) {
                    this.shadow = this.content.attachShadow({mode:'open'});
                }
                this.shadow.innerHTML = responseText;
            } else { // no shadow - below works in Firefox
                // Shadow DOM now works in Firefox so remove this stuff
            }

            this.doFormEventListeners();
            this.doLinkEventListeners();

        }
    }

    showImage (url) {
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

    highlightFormField (fieldName, colour) {
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

    setCode (code) {
        this.setContent('text/html', code);
    }

    setContent (mime,code) {
        this.editor.setValue(code);
//    this.refresh();
        this.showContent(mime, code);
        this.markUnaltered();
    }
        
    getCode() {
        return this.editor.getValue();
    }

    getContentArea() {
        return this.content;
    }

    markUnaltered() {
        this.altered = false;
    }

    isAltered() {
        return this.altered && this.editor.getValue().length > 0;    
    }

    setWebDir(dir){
        this.webDir = dir; 
    }

    setFile(file) {
        this.addressBox.value = this.webDir + "/" +file;
    }

    loadExternalCSS() {
        var match =this.shadow.innerHTML.match
            (/<link[^>]+href="([A-Za-z0-9_\-]+.css)"[^>]*>/);
        if(match)  {
            var xhr = new XMLHttpRequest();
            xhr.addEventListener("load", e=> {    
                if(e.target.status != 200) {
                    console.log(`WARNING: Could not load external CSS: ${e.target.status}`);
                } else {
                    this.lock = true;
                    this.shadow.innerHTML += '<style>'+ 
                        xmlhttp.responseText.replace("body",":host")+ 
                            '</style>';
                    this.lock = false;
                    // Adding the CSS to the innerHTML of shadow seems to screw up
                    // the event listeners we added to our form submit buttons.
                    // So add them again.
                    this.doFormEventListeners();
                    this.doLinkEventListeners();

                } 
            });
            xhr.open("GET", `${this.webDir}/${match[1]}`);
            xhr.send();
        }
    }

    loadDocumentOrImage(mimetype, url, responseText) {
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

    setFreezeAlteredStatus(value) {
        this.alteredStatusFrozen = value;
    }

    refresh() {
        this.editor.resize(true);
    }

    setAnimation(doAnimation) {
        this.doAnimation = doAnimation;
    }

    doFormEventListeners() {
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
                                qs += form.elements[j].name+ "="+form.elements[j].value;
                            }
                        }
                        break;
                    }
                actionLocalUrl+=qs;
                this.sendRequest(form.method,
                            this.webDir+"/"+actionLocalUrl,formData);
            }).bind(this,forms[i]));    
        }
    }

    doLinkEventListeners() {
        var links = this.shadow ?
                    this.shadow.querySelectorAll("a"):
                    this.content.getElementsByTagName("a"); 
        for(var i=0; i<links.length; i++) {
            links[i].addEventListener("click", (e)=> {
                e.preventDefault();
                var href=e.target.getAttribute("href");
                this.sendRequest('GET', href.substr(0,7)=="http://" ? href: this.webDir+"/"+href);
            });
        }
    }
}

module.exports = Browser;
