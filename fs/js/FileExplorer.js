
function FileExplorer(divId, urls, dropId, callbacks)
{
    var container = document.getElementById(divId);
    var toolbar = document.createElement("div");
    var trash = document.createElement("img");
    trash.src = "assets/images/trash.png";
    trash.alt = "Delete selected file(s)";
    trash.addEventListener("click", (e)=> {
	this.sendAjaxDelete(); 
	});
    toolbar.appendChild(trash);
  container.appendChild(toolbar);
 
    this.div = document.createElement("div");
   container.appendChild(this.div);


    this.dir = ".";
    this.curFile = "";
    this.serverUrl = urls.http || 'fs.php';
    this.ftpUrl = urls.ftp || null; 
    this.callbacks = callbacks || {};
    this.urlType = "text/uri-list";
    this.dropDiv = document.getElementById(dropId);
    console.log("dropId="+dropId);
    this.selectedFiles = {};

    this.dropDiv.addEventListener("drop",
        (e)=> {
		// 020118 it appears that the text/plain type of data always gets the
		// right data (on Firefox). text/uri-list gives the image URL instead
		// if you try to drag an image which is a child of the draggable span.
		// so always send the contents of the text/plain data type.
		// Untested Chrome!
		console.log("drop event");
                e.preventDefault();
                var data = e.dataTransfer.getData(this.urlType);

                //uri-list wont work on chrome
                if(data=="") {
                    data = e.dataTransfer.getData("text/plain");
                } 
				var dataTextPlain = e.dataTransfer.getData("text/plain");
                this.curFile = dataTextPlain;
                if(this.callbacks.fileInfoCallback) {
                    this.callbacks.fileInfoCallback(this.getFileInfo());
                }
                this.sendAjax({name: dataTextPlain});
		});
    
    
    
    document.getElementById(dropId).addEventListener("dragover", 
                    (e)=> {
                console.log("DRAGOVER EVENT");
                // drag and drop will NOT work without e.preventDefault()
                e.preventDefault();

                // used to control the cursor on the drop element when
                // data being dropped
                e.dataTransfer.dropEffect = "copy";
            });
    
    
    


    this.swappedChildNodes = []; 
   this.div.addEventListener("keyup", (e)=> {
            if(e.keyCode==46) {
                var first=true;
                var str="";
                for(k in this.selectedFiles) {
                    if(first==true) {
                        first=false;
                    } else {
                        str+=",";
                    }
                    str+=k;
                }
            this.sendAjaxDelete();
        } });
    this.div.setAttribute("tabindex",0);
}

FileExplorer.prototype.filetypes = { UNKNOWN: 0, DIR: 1, HTML: 2, PHP: 3};

FileExplorer.prototype.getFileInfo = function() {
    return { "file" : this.curFile , "dir" : this.dir };
}

FileExplorer.prototype.sendAjax = function(options)
{
	console.log("sendAjax(): options="+JSON.stringify(options));
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
        callback =  (xmlHTTP) =>
                { 
                    this.onAjaxDirResponse(xmlHTTP);
                    if(options.callback) {
                        options.callback();
                    }
                };
    }
    http.get(url).then(callback);
}

FileExplorer.prototype.sendAjaxDelete = function() {
    var fd = new FormData();
    fd.append("action","delete");    
    fd.append("files", JSON.stringify(Object.keys(this.selectedFiles)));
	http.post(this.ftpUrl, fd).then( (xmlHTTP)=> {
            data = JSON.parse(xmlHTTP.responseText);
            if(data.status==0) {
                alert('Deleted successfully');
				this.selectedFiles={};
        		this.sendAjax();
            } else {
                alert('Error deleting: code ' + data.status);
            }
        });
}

FileExplorer.prototype.images = 
    ['unknown.png', 'folder.png', 'html.png', 'script.png'];

FileExplorer.prototype.onAjaxDirResponse = function(xmlHTTP)
{
    if(xmlHTTP.status!=200) return;
    this.div.innerHTML = "";
	console.log(xmlHTTP.responseText);
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
                img.addEventListener("dragstart", (ev)=> {
                    ev.preventDefault();
                });
            } else {    
				
				img.draggable = true;
                span.addEventListener
                ("dragstart", (function(i,ev)
                    {
                        console.log("DRAGSTART");
                        // stops the url of the image being dragged across

                        // messy feature sensing but the only way to get
                        // this to work in chrome?
                        // JS The Definitive Guide 6th edition p479
					/*
                    if(ev.dataTransfer.types.contains) {
						console.log("YES");
                        ev.dataTransfer.clearData('text/plain');
                        // to send a link the mime type needs to be 
                        // text/uri-list
                        // if text/plain it dumps the drag data on the 
                        // recipient element: not what we want
                        // however uri-list won't work on chrome: we deal
                        // with this in the drop event
						// 020118 this is not being called on firefox either
						// both using text/plain,
						console.log("Data being sent: "+
							json.content[i].name);
                        ev.dataTransfer.setData(this.urlType,
                             json.content[i].name);
                    } else {
						console.log("Data being sent (notypes): "+
							json.content[i].name);
                        ev.dataTransfer.setData('text/plain',
                             json.content[i].name);
                    }
					*/
					// 020118 will this work now on both firefox and chrome?
					ev.dataTransfer.setData('text/plain', json.content[i].name);
                    }).bind(this,i));

        span.addEventListener
        ("click", (function(i,ev)
            {
               if(ev.target.selected) {
                ev.target.selected=false;
                ev.target.style.backgroundColor='';
                ev.target.style.border='';
                this.div.focus();
                delete(this.selectedFiles
                    [this.dir+"/"+json.content[i].name]);
               } else {
                ev.target.selected=true;
                ev.target.style.backgroundColor='#c0c0ff';
                ev.target.style.border='1px solid black';
                this.selectedFiles
                    [this.dir+"/"+json.content[i].name] = 
                    true;
               }
            }).bind(this,i));

        span.addEventListener
            ("mouseover", () =>{
                document.body.style.cursor='default';
                } );
            }

            span.appendChild(img);
            span.appendChild(document.createTextNode(json.content[i].name));
            span.draggable = true;
			img.draggable = true;
            this.div.appendChild(span);
            this.div.appendChild(document.createElement("br"));

        }
    }    
}

FileExplorer.prototype.onAjaxFileResponse = function(xmlHTTP)
{
    if(this.callbacks.showContentCallback) {
		var data = JSON.parse(xmlHTTP.responseText);
        this.callbacks.showContentCallback
            (data.contentType, data.content, data.webdirUrl);
    }
}

FileExplorer.prototype.onAjaxFileResponseFtp = function(xmlHTTP)
{
    if(this.callbacks.showContentCallback) {
        var data = JSON.parse(xmlHTTP.responseText);
        if(data.status==0) {
            this.callbacks.showContentCallback
                (data.contentType, data.content, data.webdirUrl);
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
