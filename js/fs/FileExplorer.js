
class FileExplorer {

    constructor(divId, urls, dropId, callbacks) {
        console.log(`divId=${divId}`);
        var container = document.getElementById(divId);
        var toolbar = document.createElement("div");
        var trash = document.createElement("img");
        trash.src = "assets/images/trash.png";
        trash.alt = "Delete selected file(s)";
        trash.addEventListener("click", e=> {
            this.promptDelete(); 
        });
        toolbar.appendChild(trash);
           container.appendChild(toolbar);
 
        this.div = document.createElement("div");
        container.appendChild(this.div);


        this.dir = ".";
        this.curFile = "";
        this.serverUrl = urls.http || 'php/fs.php';
        this.ftpUrl = urls.ftp || null; 
        this.callbacks = callbacks || {};
        this.urlType = "text/uri-list";
        this.dropDiv = document.getElementById(dropId);
        console.log("dropId="+dropId);
        this.selectedFiles = {};

        this.dropDiv.addEventListener("drop", e=> {
            // 020118 it appears that the text/plain type of data always gets the
            // right data (on Firefox). text/uri-list gives the image URL instead
            // if you try to drag an image which is a child of the draggable span.
            // so always send the contents of the text/plain data type.
            // NOW TESTED Chrome!
                e.preventDefault();
                var dataTextPlain = e.dataTransfer.getData("text/plain");
                this.curFile = dataTextPlain;
                if(this.callbacks.fileInfoCallback) {
                    console.log(`calling fileInfoCallback with : ${JSON.stringify(this.getFileInfo())}`);
                    this.callbacks.fileInfoCallback(this.getFileInfo());
                }
                this.sendAjax({name: dataTextPlain});
            });
    
    
    
        document.getElementById(dropId).addEventListener("dragover", 
                    e=> {
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
            this.promptDelete();
        } });
        this.div.setAttribute("tabindex",0);
    }


    getFileInfo() {
        return { "file" : this.curFile , "dir" : this.dir };
    }

    sendAjax(options) {
        options = options || {};
        var url;
        let callback = null;
        if(options.name) {
            url = (this.ftpUrl ? this.ftpUrl:this.serverUrl) + 
            "?dir="+this.dir+"&file="+options.name;
            callback = this.ftpUrl ?
             this.onAjaxFileResponseFtp.bind(this):
             this.onAjaxFileResponse.bind(this);
                
        } else {
            url = this.serverUrl+"?dir="+this.dir;
            callback =  e =>
                { 
                    this.onAjaxDirResponse(e);
                    if(options.callback) {
                        options.callback();
                    }
                };
        }
        const xhr = new XMLHttpRequest();
        xhr.addEventListener("load", callback);
        xhr.open("GET", url);
        xhr.send();
    }

    sendAjaxDelete() {
        var fd = new FormData();
        fd.append("action","delete");    
        fd.append("files", JSON.stringify(Object.keys(this.selectedFiles)));
        const xhr = new XMLHttpRequest();
        xhr.addEventListener("load", e=> {
            const data = JSON.parse(e.target.responseText);
            if(data.status==0) {
                alert('Deleted successfully');
                this.selectedFiles={};
                this.sendAjax();
            } else {
                alert('Error deleting: code ' + data.status);
            }
        });
        xhr.open("POST", this.ftpUrl);
        xhr.send(fd);
    }



    promptDelete() {

        var dialog = new Dialog ("server",
                            { 
                                'OK': ()=> {
                                    dialog.hide();
                                    this.sendAjaxDelete();
                                    
                                }, 
                                'Cancel': ()=> {
                                    dialog.hide();
                                }
                            },
                            {
                                top: '300px',
                                left: '100px',
                                width: '200px',
                                height: '100px',
                                position:'absolute',
                                backgroundColor: '#ffffc0',
                                border: '1px solid black'
                            }
                            );

        var nSelected = Object.keys(this.selectedFiles).length;
        dialog.setContent("Really delete " +nSelected+ " selected file"+
            (nSelected==1 ? "?":"s?")); 
        dialog.show();
    }



    onAjaxDirResponse(e) {
        const xmlHTTP = e.target;
        if(xmlHTTP.status!=200) return;
        this.div.innerHTML = "";
        var json = JSON.parse(xmlHTTP.responseText);
        var name;
        for(var i=0; i<json.content.length; i++) {
            name=null;
            if(json.content[i].name!=".." || this.dir!=".") {
                var type = FileExplorer.filetypes.NONE;
                if(json.content[i].dir==1) {
                    type = FileExplorer.filetypes.DIR;
                }else {
                    var ext = json.content[i].name.substr
                    (json.content[i].name.lastIndexOf(".")+1);
                    type = ext=="html" ? FileExplorer.filetypes.HTML :
                    (ext==window.app.config.extension ? FileExplorer.filetypes.SCRIPT :    FileExplorer.filetypes.UNKNOWN);    
                    name=json.content[i].name;
                }
            
                var span = document.createElement("span");
                var img = document.createElement("img");
                img.src = "assets/images/"+FileExplorer.images[type];

                if(type==FileExplorer.filetypes.DIR) {
                    img.addEventListener
                    ("click", (function(i,name) {
                        this.changeDir(json.content[i].name);
                        this.sendAjax({name:name});
                    }).bind(this,i,name));
                    img.addEventListener("dragstart", (ev)=> {
                        ev.preventDefault();
                    });
                } else {    
                    img.draggable = true;
                    span.addEventListener ("dragstart", (function(i,ev) {
                        // to allow prevention of annoying behaviour in which 
                        // drag data is dumped in the ace editor (see above) 
                        if(this.callbacks.onDragStart) {
                            this.callbacks.onDragStart();
                        }
                        ev.stopPropagation();
                        // stops the url of the image being dragged across

                        // 020118 will this work now on both firefox and chrome?-yes
                        ev.dataTransfer.setData('text/plain', json.content[i].name);
                    }).bind(this,i));

                    span.addEventListener ("click", (function(i,ev) {
                           if(ev.target.selected) {
                            ev.target.selected=false;
                            ev.target.style.backgroundColor='';
                            ev.target.style.border='';
                            this.div.focus();
                            delete(this.selectedFiles [this.dir+"/"+json.content[i].name]);
                           } else {
                            ev.target.selected=true;
                            ev.target.style.backgroundColor='#c0c0ff';
                            ev.target.style.border='1px solid black';
                            this.selectedFiles [this.dir+"/"+json.content[i].name] = true;
                           }
                    }).bind(this,i));

                    span.addEventListener ("mouseover", () =>{
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

    onAjaxFileResponse (e) {
        if(this.callbacks.showContentCallback) {
            var data = JSON.parse(e.target.responseText);
            this.callbacks.showContentCallback (data.contentType, data.content, data.webdirPath, data.webdirUrl);
        }
    }

    onAjaxFileResponseFtp (e) { 
        if(this.callbacks.showContentCallback) {
            var data = JSON.parse(e.target.responseText);
            if(data.status==0) {
                this.callbacks.showContentCallback (data.contentType, data.content, data.webdirPath, data.webdirUrl);
            } else {
                alert("Error: " + data.status);
            }
        }
    }

    findFileSpan(filename) {
        console.log(`Trying to find file span ${filename}`);
        var spans = this.div.getElementsByTagName("span");
        for(var i=0; i<spans.length; i++) {
            if(spans[i].childNodes.length>1 && spans[i].childNodes[1].nodeValue == filename) {
                console.log('FOUND!!!');
                return spans[i];
            }
        }
        return null;
    }

    clearSelected() {
        var spans = this.div.getElementsByTagName("span");
        for(var i=0; i<spans.length; i++) {
            spans[i].classList.remove("selected");
        }
    }

    changeDir(newDir, callback) {
        if(newDir=="..") {
            this.dir=this.dir.substr(0, this.dir.lastIndexOf("/"));
        } else if(newDir!=".") {
            this.dir += "/" + newDir;
        }
        this.sendAjax({callback:callback});
    }

    home(callback) {
        this.dir=".";
        this.sendAjax({callback:callback});
    }
}

FileExplorer.filetypes = { UNKNOWN: 0, DIR: 1, HTML: 2, SCRIPT: 3};
FileExplorer.images = ['unknown.png', 'folder.png', 'html.png', 'script.png'];

module.exports = FileExplorer;
