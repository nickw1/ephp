
function init() {
    var fileInfo = { "file": null, "dir": null }, newFileInfo=null;
    var loggedin = null;
    var msgDiv = document.getElementById("msg");
    var filenameDiv = document.getElementById("filename");
    var mode=0;
    var savedLoginHTML="", originalLoginDivContents = "";
    var canvasHeight = 592; 
    var compAnim = new ComponentAnimator(1000, 5, 200, 
                                            ['client', 'networkContainer', 'server']);

    var fileExplorer=new FileExplorer('serverContent', 
                            {http: 'fs/fs.php',
                            ftp: 'ftp/ftp.php' } ,'client',
                            { showContentCallback: (mime,src,webdirPath,
                                webdirUrl)=> {
                                    saveOld(()=> {
                                        browser.setContent(mime,src);
                                        browser.setFreezeAlteredStatus(false);
                                        fileInfo = newFileInfo;
                                        // remove the . from the current dir 
                                        var localPath = webdirPath + fileInfo.dir.substr(1);
                                        console.log("webdirPath="+webdirPath+" webdirUrl="+webdirUrl+" fileInfo.dir="+fileInfo.dir+" fileInfo.file="+fileInfo.file + " localPath="+
        localPath);
                                        //var filePath='file://'+webdirPath+fileInfo.dir.substr(1);
                                     //   var filePath='file://'+webdirPath+fileInfo.dir.substr(1);
                                        var filePath = webdirUrl+fileInfo.dir.substr(1);
//                                        browser.setWebDir(localPath);
                                        browser.setWebDir(filePath);        
                                        browser.setFile(fileInfo.file);
                                        browser.loadExternalCSS();
                                        browser.markUnaltered();
                                        newFileInfo = null;
                                        if(mode==0) {
                                            showFilename();
                                        }
                                        });
                                    }, 
                                 fileInfoCallback: 
                                    (fInfo)=> { 
                                        newFileInfo = fInfo;
                                    },

                                 onDragStart: () => {
                                        browser.setFreezeAlteredStatus(true);
                                    
                                 },
 
                             });

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

    // Resize event was here

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
                                        // TODO this is a quick and dirty
                                        // HACK. It does not account for
                                        // FTP vs non-FTP mode and will not
                                        // work if the backedup file was not
                                        // in the user's web root directory.
                                        if(loggedin!=null) {
                                            browser.setWebDir('/~' + loggedin);
                                            browser.setFile(json.filename);
                                        }
                                        showFilename();
                                    }
                                });
                setInterval(backup, 10000);
        
    };

    var backup = ()=> {
        var data = new FormData();
        data.append("src", browser.getCode());
        data.append("filename", fileInfo.file==null ? "":
                        fileInfo.file);
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
                       uploadContent(); 
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
                                    document.getElementById('networkContainer'), 
                                    document.getElementById('server')]);
    var rw = new ResizableWindowSet([document.getElementById('client'), 
                                    document.getElementById('networkContainer'),
                                    document.getElementById('server')]);
    rw.setOnFinishCallback(animation.calculateCanvasPos.bind(animation));
    rw.setup();

    ResizableWindowSet.addFullResize([document.getElementById('vars'), 
                                    document.getElementById('dbresults'), 
                                    document.getElementById('log')]);
    var rw2 = new ResizableWindowSet([document.getElementById('vars'), 
                                    document.getElementById('dbresults'),
                                    document.getElementById('log')]);
	rw2.setup();



	/* note vertical currently not working
    ResizableWindowSet.addFullResize([document.getElementById('ephp_container'),
								document.getElementById('msg'), 
								document.getElementById('dbg')]);
	var rw3 = new ResizableWindowSet([document.getElementById('ephp_container'),
									document.getElementById('msg'),
									document.getElementById('dbg')], true);
	rw3.setup();
	*/

    window.addEventListener("resize",onResize.bind(this,animation,compAnim,rw)); 
    var origWidth, netWidth = 400;

    var networkShowDiv = document.createElement("div");
    networkShowDiv.style.backgroundColor = '#ffffe0';
    networkShowDiv.style.width='75px';
    networkShowDiv.style.border='ridge';
    var cloudImg = new Image();
    cloudImg.src='assets/images/rgtaylor_csc_net_wan_cloud.small.png';
    networkShowDiv.appendChild(cloudImg);
    networkShowDiv.addEventListener('click', ()=> {
            var netCont = document.getElementById('networkContainer'),
                net = document.getElementById('network');
            netCont.removeChild(networkShowDiv);
            net.style.display='block';
            netCont.style.width=netWidth+'px';
            netCont.style.height='100%';
            netCont.fullResizeWidth(netWidth);
            var csWidth= ((origWidth-netWidth)/2)+'px';
            document.getElementById('server').style.width = csWidth;
            document.getElementById('client').style.width = csWidth;
            animation.setActive(true);
            animation.clearCanvas();
            compAnim.setIgnored(null);
            rw.showResizer(netCont, true);
        }
    );

    var img = document.createElement('img'); 
    img.src='assets/images/cross.png';
    img.style.position='absolute';
    img.style.right='0px';
    img.style.top='0px';
    img.addEventListener('click', ()=> {
            var netCont = document.getElementById('networkContainer'),
                net = document.getElementById('network');
            origWidth = document.getElementById('client').offsetWidth+
                    netCont.offsetWidth+
                    document.getElementById('server').offsetWidth;
            netCont.style.width='75px';
            netCont.style.height='40px';
            document.getElementById('client').style.width='50%';
            document.getElementById('server').style.width='50%';
            net.style.display='none';
            netCont.appendChild(networkShowDiv);
            animation.setActive(false);
            compAnim.setIgnored(net);
            rw.showResizer(netCont, false);
        });
    document.getElementById('network').appendChild(img);
	onResize(animation, compAnim, rw);
}

function onResize(animation, compAnim, rw) {
            var serverWidth = document.body.offsetWidth-
                (document.getElementById('client').offsetWidth+
                    document.getElementById('network').offsetWidth);
            document.getElementById('server').style.width=serverWidth+'px';
            animation.calculateCanvasPos();
            compAnim.recalculateDimensions();
            rw.recalculateTotalSpan();
}
