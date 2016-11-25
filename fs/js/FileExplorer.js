
function FileExplorer(divId, urls, dropId, callbacks)
{
    this.div = document.getElementById(divId);
    this.dir = ".";
    this.curFile = "";
    this.serverUrl = urls.http || 'fs.php';
    this.ftpUrl = urls.ftp || null; 
    this.callbacks = callbacks || {};

    this.urlType = "text/uri-list";

    this.dropDiv = document.getElementById(dropId);

    this.dropDiv.addEventListener("drop",
        (function(e) {
                console.log("DROP EVENT");
                e.preventDefault();
                var data = e.dataTransfer.getData(this.urlType);
                console.log("data returned: " + data);

                //uri-list wont work on chrome
                if(data=="") {
                    data = e.dataTransfer.getData("text/plain");
                } 
                this.curFile = data;
                if(this.callbacks.fileInfoCallback) {
                    this.callbacks.fileInfoCallback(this.getFileInfo());
                }
                console.log("sending ajax: name=" + data);
                this.sendAjax({name:data});
                
            }).bind(this));    


    
    
    
    document.getElementById(dropId).addEventListener("dragover", 
                    function(e) {
                console.log("DRAGOVER EVENT");
                // drag and drop will NOT work without e.preventDefault()
                e.preventDefault();

                // used to control the cursor on the drop element when
                // data being dropped
                e.dataTransfer.dropEffect = "copy";
            });
    
    
    


    this.swappedChildNodes = []; 
}

FileExplorer.prototype.filetypes = { UNKNOWN: 0, DIR: 1, HTML: 2, PHP: 3};

FileExplorer.prototype.getFileInfo = function() {
    return { "file" : this.curFile , "dir" : this.dir };
}

FileExplorer.prototype.sendAjax = function(options)
{
    options = options || {};
    var url;
    if(options.name) {
        url = (this.ftpUrl ? this.ftpUrl:this.serverUrl) + 
            "?dir="+this.dir+"&file="+options.name;
        callback = this.ftpUrl ?
             this.onAjaxFileResponseFtp.bind(this):
             this.onAjaxFileResponse.bind(this);
                
    }
    else {
        url = this.serverUrl+"?dir="+this.dir;
        callback =  (function(xmlHTTP)
                { 
                    this.onAjaxDirResponse(xmlHTTP);
                    if(options.callback) {
                        options.callback();
                    }
                }).bind(this);
    }
    http.get(url).then(callback);
}

FileExplorer.prototype.images = 
    ['unknown.png', 'folder.png', 'html.png', 'script.png'];

FileExplorer.prototype.onAjaxDirResponse = function(xmlHTTP)
{
    if(xmlHTTP.status!=200) return;
    this.div.innerHTML = "";
    var json = JSON.parse(xmlHTTP.responseText);
    var name;
    for(var i=0; i<json.content.length; i++)
    {
        name=null;
        if(json.content[i].name!=".." || this.dir!=".")
        {
            var type = FileExplorer.prototype.filetypes.NONE;
            if(json.content[i].dir==1)
            {
                type = FileExplorer.prototype.filetypes.DIR;
            }
            else
            {
                var ext = json.content[i].name.substr
                    (json.content[i].name.lastIndexOf(".")+1);
                type = ext=="html" ? FileExplorer.prototype.filetypes.HTML :
                    (ext=="php" ? FileExplorer.prototype.filetypes.PHP :    
                        FileExplorer.prototype.filetypes.UNKNOWN);    
                name=json.content[i].name;
            }
            
            var span = document.createElement("span");
            var img = document.createElement("img");
            img.src = "assets/images/"+FileExplorer.prototype.images[type];

            if(type==FileExplorer.prototype.filetypes.DIR) {
                img.addEventListener
                ("click", (function(i,name)
                    {
                        this.changeDir(json.content[i].name);
                        this.sendAjax({name:name});
                    }).bind(this,i,name));
                img.addEventListener("dragstart", function (ev) {
                    ev.preventDefault();
                });
            } else {    
                span.addEventListener
                ("dragstart", (function(i,ev)
                    {
                        console.log("DRAGSTART");
                        // stops the url of the image being dragged across

                        // messy feature sensing but the only way to get
                        // this to work in chrome?
                        // JS The Definitive Guide 6th edition p479
                    if(ev.dataTransfer.types.contains) {
                        ev.dataTransfer.clearData('text/plain');
                        // to send a link the mime type needs to be 
                        // text/uri-list
                        // if text/plain it dumps the drag data on the 
                        // recipient element: not what we want
                        // however uri-list won't work on chrome: we deal
                        // with this in the drop event
                        ev.dataTransfer.setData(this.urlType,
                             json.content[i].name);
                    } else {
                        ev.dataTransfer.setData('text/plain',
                             json.content[i].name);
                    }
                    }).bind(this,i));
            }

            span.appendChild(img);
            span.appendChild(document.createTextNode(json.content[i].name));
            span.draggable = true;
            this.div.appendChild(span);
            this.div.appendChild(document.createElement("br"));

        }
    }    
}

FileExplorer.prototype.onAjaxFileResponse = function(xmlHTTP)
{
    if(this.callbacks.showContentCallback) {
        this.callbacks.showContentCallback
            (xmlHTTP.getResponseHeader("Content-type"),
                        xmlHTTP.responseText);
    }
}

FileExplorer.prototype.onAjaxFileResponseFtp = function(xmlHTTP)
{
    if(this.callbacks.showContentCallback) {
        var data = JSON.parse(xmlHTTP.responseText);
        if(data.status==0) {
            this.callbacks.showContentCallback
                (data.contentType, data.content);
        } else {
            alert("Error: " + data.status);
        }
    }
}

FileExplorer.prototype.findFileSpan = function (filename) {
    var spans = this.div.getElementsByTagName("span");
    for(var i=0; i<spans.length; i++) {
        if(spans[i].childNodes.length>1 && 
            spans[i].childNodes[1].nodeValue == filename) {
            return spans[i];
        }
    }
    return null;
}

FileExplorer.prototype.clearSelected = function() {
    var spans = this.div.getElementsByTagName("span");
    for(var i=0; i<spans.length; i++) {
        spans[i].classList.remove("selected");
    }
}

FileExplorer.prototype.changeDir = function(newDir, callback) {
    if(newDir=="..") {
        this.dir=this.dir.substr(0, this.dir.lastIndexOf("/"));
    } else if(newDir!=".") {
        this.dir += "/" + newDir;
    }
    this.sendAjax({callback:callback});
}

FileExplorer.prototype.home = function(callback) {
    this.dir=".";
    this.sendAjax({callback:callback});
}
