
function init() {
    var fileInfo = { "file": null, "dir": null }, newFileInfo=null;
    var loggedin = null;
    var msgDiv = document.getElementById("msg");
    var filenameDiv = document.getElementById("filename");
    var mode=0;
    var savedLoginHTML="", originalLoginDivContents = "";
    var mq = window.matchMedia("screen and (max-device-height: 799px)");
    var canvasHeight =  mq.matches? "472px": "592px";
    var compAnim = new ComponentAnimator(2500, 250, 100, 
                                            ['client', 'network', 'server']);

    var fileExplorer=new FileExplorer('serverContent', 
                            {http: 'fs/fs.php',
                            ftp: 'ftp/ftp.php' } ,'client',
                            { showContentCallback: (mime,src)=> {
                                    saveOld(()=> {
                                        browser.setContent(mime,src);
                                        fileInfo = newFileInfo;
                                        // remove the . from the current dir 
                                        var localPath = 
                                            "/~" + loggedin +
                                                fileInfo.dir.substr(1);
                                        browser.setWebDir(localPath);
                                        browser.setFile(fileInfo.file);
                                        newFileInfo = null;
                                        if(mode==0) {
                                            showFilename();
                                        }
                                        });
                                    }, 
                                 fileInfoCallback: 
                                    (fInfo)=> { 
                                        newFileInfo = fInfo;
                                    }
                                 } 
                             
                            );

    var phpAnimation = new PHPAnimation({divId:"serverContent",
                                        consoleElement: "console"});

    var animation = new HTTPAnimation({parentId: 'network',
                                        height:canvasHeight,
                                    interval: 20,
                                    step : 2,
                                    fileExplorer: fileExplorer,
                                    serverAnimation: phpAnimation,
                                    componentAnimator: compAnim,
                                    onerror: ()=> { }
            });

    var browser = new Browser({divId: 'content', 
                                animation: animation,
                                sourceElement: 'src_ace',
                                saveOldCallback: (cb)=> {
                                    saveOld ( ()=> {
                                        cb();
                                        fileInfo.file=fileInfo.dir=null;
                                        showFilename();
                                    } )
                                }});

    window.addEventListener("resize",  () => {
            animation.calculateCanvasPos();
            compAnim.recalculateDimensions();
            } );

    var errors = { 
                    256: 'Unable to move temporary file on server',
                    257: 'File upload security violation detected',
                    258: 'Exceeded maximum file size',
                    259: 'Blank filename',
                    512: 'Unable to connect to server via FTP',
                    513: 'Unable to transfer file via FTP',
                    514: 'Invalid filename',
                    515: 'Unable to write to temporary file on server',
                    1024: 'Invalid FTP login',
                    1025: 'Invalid username'
                };

    var showInModes = [
        { 'content': ['none'],
          'filename': [ 'block'],
          'src_ace': ['block'],
          'file_upload': ['inline',true],
          'file_new': ['inline'],
          'file_save' : ['inline'] },

        { 'content': ['block'],
          'filename' : ['none'],
          'src_ace': ['none'],
          'file_upload': ['none'],
          'file_new' : ['none'],
          'file_save' : ['none'] }
        ];

    var dialog = new Dialog ("client",
                            { 
                                'Yes': ()=> {
                                    dialog.hide();
                                    uploadContent();
                                    if(dialog.additionalCallback) {
                                        dialog.additionalCallback();
                                        dialog.additionalCallback = null;
                                    }
                                }, 
                                'No': ()=> {
                                    dialog.hide();
                                    if(dialog.additionalCallback) {
                                        dialog.additionalCallback();
                                        dialog.additionalCallback = null;
                                    }
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


    var askUploadFile = (additionalCallback)=> {
        dialog.additionalCallback = additionalCallback;
        dialog.setContent("Unsaved file. Upload to server?");
        dialog.show();
    }

    var uploadContent = ()=> {
        var formData = new FormData();
        savedLoginHTML = document.getElementById("login").innerHTML;

        if(document.getElementById("ephp_username") && 
            document.getElementById("ephp_password")) { 
        
            formData.append("ephp_username", 
                    document.getElementById("ephp_username").value);
            formData.append("ephp_password", 
                    document.getElementById("ephp_password").value);
        }
        var filename=null, msg="";
        if(fileInfo.file==null) {
            filename = prompt("Unsaved file. Please enter a filename:");
            if(filename!=null && fileExplorer) {
                filename=fileExplorer.dir+"/"+filename;
            } 
        } else {
            filename = fileInfo.file;
        }

        if(filename!=null) {
            alert("Transferring: " + filename);
            formData.append("filename", filename);
            formData.append("src",browser.getCode());
			formData.append("action", "upload");
            msg = "Transferring file...";

            http.post('ftp/ftp.php', formData).then((xmlHTTP)=> {
                var json = JSON.parse(xmlHTTP.responseText);
                if(json.status!=0 && (json.status>=256)) {
                    alert('Error: ' + errors[json.status]);
                } else {
                    browser.markUnaltered();
                    fileExplorer.sendAjax();

                    if(fileInfo.file==null && filename!="") {
                        fileInfo.file = filename;
                        showFilename();
                    } 
                }
            });
        }
    };

    var login = (e)=> {
        var formData = new FormData();
        savedLoginHTML = document.getElementById("login").innerHTML;
		formData.append("action", "login"); // don't try and transfer

        
        if(document.getElementById("ephp_username") &&
            document.getElementById("ephp_password")) {
            formData.append("ephp_username", 
                document.getElementById("ephp_username").value);
            formData.append("ephp_password", 
                document.getElementById("ephp_password").value);
        }
        var msg = "Logging in...";

        originalLoginDivContents = document.getElementById("login").
                    innerHTML;
        document.getElementById("login").innerHTML = msg +
                    "<img src='assets/images/ajax-loader.gif' "+
                    "alt='ajax loader' />";
        http.post('ftp/ftp.php', formData).then((xmlHTTP)=> {
                    var json = JSON.parse(xmlHTTP.responseText);
                    if(json.status!=0 && (json.status>=1024)) {
                        alert('Error: ' + errors[json.status]);
                        resetLogin();
                    } else {
                        fileExplorer.sendAjax();

                        if(json.loggedin!=null) {
                            loggedin = json.loggedin;
                            document.getElementById("login").innerHTML = 
                                "<p>Logged in as " + loggedin +
                                " <a href='ftp/logout.php'>Logout</a></p>";
                            doModeDisplay();
                            loadBackedUpFile();
                        } 
            }
        });
    };

    var loadBackedUpFile = ()=> {
            http.get('ftp/backup.php').then (
                (xmlHTTP)=> {
                    var json=JSON.parse(xmlHTTP.responseText);
                                    browser.setCode(json.src);
                                    if(json.filename!="") {
                                        // We want to mark reloaded backup code
                                        // as unaltered if already saved
                                        browser.markUnaltered();
                                        fileInfo.file=json.filename;
                                        showFilename();
                                    }
                                });
// TODO dealwith                            setInterval(backup, 10000);
    };

    var backup = ()=> {
        var data = new FormData();
        data.append("src", browser.getCode());
        data.append("filename", fileInfo.file==null ? "":
                        fileInfo.file);
        msgDiv.innerHTML = "Backing up...";
        http.post('ftp/backup.php', data).then((xmlHTTP)=> {
            setTimeout ( showFilename, 2000);
            });
    };

    var showFilename = (fInfo)=> {
        fInfo = fInfo || fileInfo;
        filenameDiv.innerHTML = (fInfo.file!=null) ?
                 fInfo.file: "UNSAVED";
    }


    var doTabs = ()=> {
        var tabs = document.getElementById('client_tabs').
            getElementsByTagName("span");
        for(var j=0; j<tabs.length; j++) {
            tabs[j].classList.remove("active");
        }
        
        tabs[mode].classList.add("active");
        
    }

    var doModeDisplay = ()=> {
        for(id in showInModes[mode] ) {
            document.getElementById(id).style.display = 
                (showInModes[mode][id].length==2 &&
                showInModes[mode][id][1]==true &&
                loggedin==null) ? 
                'none': showInModes[mode][id][0];
        }
    }

    var fakeEvent = (el,eventtype)=> {
        // stackoverflow.com/questions/2705583
        var e = document.createEvent('Events');
        e.initEvent(eventtype, true, false);
        document.getElementById(el).dispatchEvent(e);
    }

    var resetLogin = ()=> {
        document.getElementById("login").innerHTML = savedLoginHTML;
        initFtpSubmitBtn();
    }

    var initFtpSubmitBtn = ()=> {
        document.getElementById("ftpsubmit").addEventListener
                    ("click",login);
    }

    var saveOld = (cb)=> {
        if(browser.isAltered()) { 
            askUploadFile(cb);
        } else {
            cb();
        }
    }

    if(document.getElementById("ftpsubmit")) {
        initFtpSubmitBtn();
    } else {
        // Page reload when logged in
//        loadBackedUpFile();
        login();
    }

    document.getElementById("file_upload").addEventListener
            ("click",()=> {
                if(loggedin==null) {
                    alert("Not logged in!");
                } else {
                    askUploadFile();
                }

            });

    document.getElementById("file_new").addEventListener
            ("click", ()=>
                {
                    saveOld (()=>{
                        fileInfo.file = null;
                        browser.setCode("");
                        showFilename();
                    });
                }
            );

    // stackoverflow.com/questions/2897619/using-html5-javascript-to-generate-and-save-a-file
    document.getElementById("file_save").addEventListener
            ("click", (e)=>
                {
                    var a = document.createElement("a"); 
                    fileInfo.file = (fileInfo.file==null ?
                        prompt("Please enter a filename") :
                        fileInfo.file);    
                    if(fileInfo.file!=null) {    
                        showFilename();
                        a.setAttribute("download", fileInfo.file);
                        a.setAttribute("href", "data:text/plain;charset=utf-8,"+encodeURIComponent(browser.getCode()));
                    /*
                    var event = new Event('click'); // new way?
                    */
                
                     var event = document.createEvent('MouseEvents');
                      event.initEvent('click', true, true);
                
                        a.dispatchEvent(event);
                    }
                }
            );

    var tabs = document.getElementById('client_tabs').
        getElementsByTagName("span");
    for(var i=0; i<tabs.length; i++) {
        tabs[i].addEventListener
                ("click", ((i,e)=> {
                    mode=i;
                    doTabs();
                    doModeDisplay();
					// MUST be done after changing visibility
                    browser.refresh(); 
                }).bind(this,i));
        tabs[i].addEventListener
                ("mouseover", (e)=> {
                    e.target.style.cursor="default";
                } );
    }

    showFilename();
    doTabs();
    doModeDisplay();
    ResizableWindowSet.addFullResize([document.getElementById('client'), 
                                    document.getElementById('network'), 
                                    document.getElementById('server')]);
    var rw = new ResizableWindowSet([document.getElementById('client'), 
                                    document.getElementById('network'), 
                                    document.getElementById('server')]);
    rw.setOnFinishCallback(animation.calculateCanvasPos.bind(animation));
    rw.setup();
}

function msg(msg, bold=false) {
}

