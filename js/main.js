
function init() {
    var fileInfo = { "file": null, "dir": null }, newFileInfo=null;
    var loggedin = null;
    var msgDiv = document.getElementById("msg");
    var filenameDiv = document.getElementById("filename");
    var mode=0;
    var savedLoginHTML="", originalLoginDivContents = "";
    var mq = window.matchMedia("screen and (max-device-height: 799px)");
    document.getElementById("network_canvas").setAttribute
            ("height", mq.matches? "312px": "512px");

    var fileExplorer=new FileExplorer('serverContent', 
                            {http: 'fs/fs.php',
							ftp: 'ftp/ftp.php' } ,'client',
                            { showContentCallback: function(mime,src) {
                                    saveOld(function() {
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
                                    function(fInfo) { 
                                        newFileInfo = fInfo;
                                    }
                                 } 
                             
                            );

    var phpAnimation = new PHPAnimation({divId:"serverContent"});

    var animation = new Animation({canvasId: 'network_canvas',
                                    interval: 10,
                                    step : 1,
                                    fileExplorer: fileExplorer,
                                    phpAnimation: phpAnimation,
									controlsDiv: network_controls });

	/*
    var animation = new GenericAnimation({canvasId: 'network_canvas',
                                    interval: 10,
                                    step : 1,
									onrequestend: 
										
										function(anim) {
            if(fileExplorer!=null) {
            
                var urlParts = anim.http.url.split("/");    

                var sa = new ServerAnimation(
                    {fileExplorer: fileExplorer,
                    urlParts: urlParts,
                    repeat:2, 
                    interval:500, 
                    callback: 
                        (function() {
                            // TODO go in own object - seems poor cohesion to
                            // put here, particularly error checking
                            anim.http.send((function(analyserInfo) {
                                var startResponseNow=true;
                                if(analyserInfo) {
                                    if(analyserInfo.errors) {
                                        var errMsg="";
                                        for(var i=0; i<analyserInfo.errors.
                                            length; i++) {
                                            if(analyserInfo.errors[i].
                                                syntaxError) {
                                                errMsg += "There was a " +
                                                    "syntax error in your "+
                                                    "PHP code on line number "+
                                                    analyserInfo.errors[i].
                                                        syntaxError.lineNumber +
                                                    ".\nThe reason is " +
                                                    analyserInfo.errors[i].
                                                        syntaxError.reason +
                                                    "\n. If you cannot see a "+
                                                    "problem with anim line, "+
                                                    "look at the preceding "+
                                                    "two or three lines.\n";
                                            } else if (analyserInfo.errors[i].
                                                sqlError) {
                                                errMsg += "There was an " +
                                                    "error in your "+
                                                    "SQL on line number "+
                                                    analyserInfo.errors[i].
                                                        sqlError.lineNumber +
                                                    ".\n("+
                                                    analyserInfo.errors[i].
                                                        sqlError.query +
                                                    ")\nThe reason is " +
                                                    analyserInfo.errors[i].
                                                        sqlError.error +
                                                    "\n.";
                                            } else {
                                                errMsg += 
                                                    analyserInfo.errors[i] +
                                                "\n";
                                            }
                                        }
                                        alert(errMsg);
                                        startResponseNow = false;
                                    } else {
                                        startResponseNow=
                                            !anim.phpAnimation.animate
                                                (analyserInfo);
                                    }
                                }

                                if(startResponseNow) {
                                    anim.startResponse();
                                }
                            }).bind(anim));    
                        }).bind(anim)
                    });
                sa.animate();
}

				});
	*/
    var browser = new Browser({divId: 'content', 
                                animation: animation,
                                sourceElement: 'src_ace',
                                saveOldCallback: function(cb) {
                                    saveOld ( function() {
                                        cb();
                                        fileInfo.file=fileInfo.dir=null;
                                        showFilename();
                                    } )
                                }});

    window.addEventListener("resize", 
            animation.calculateCanvasPos.bind(animation));

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
                                'Yes': function() {
                                    dialog.hide();
                                    uploadContent();
                                    if(dialog.additionalCallback) {
                                        dialog.additionalCallback();
                                        dialog.additionalCallback = null;
                                    }
                                }, 
                                'No': function() {
                                    dialog.hide();
                                    if(dialog.additionalCallback) {
                                        dialog.additionalCallback();
                                        dialog.additionalCallback = null;
                                    }
                                },
                                'Cancel': function() {
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


    var askUploadFile = function(additionalCallback) {
        dialog.additionalCallback = additionalCallback;
        dialog.setContent("Unsaved file. Upload to server?");
        dialog.show();
    }

    var uploadContent = function() {
        var formData = new FormData();
        savedLoginHTML = document.getElementById("login").innerHTML;

        if(document.getElementById("username") && 
            document.getElementById("password")) { 
        
            formData.append("username", 
                    document.getElementById("username").value);
            formData.append("password", 
                    document.getElementById("password").value);
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
            msg = "Transferring file...";

            http.post('ftp/ftp.php', formData).then(function(xmlHTTP) {
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

    var login = function(e) {
        var formData = new FormData();
        savedLoginHTML = document.getElementById("login").innerHTML;

        
        if(document.getElementById("username") &&
            document.getElementById("password")) {
            formData.append("username", 
                document.getElementById("username").value);
            formData.append("password", 
                document.getElementById("password").value);
        }
        var msg = "Logging in...";

        originalLoginDivContents = document.getElementById("login").
                    innerHTML;
        document.getElementById("login").innerHTML = msg +
                    "<img src='assets/images/ajax-loader.gif' "+
                    "alt='ajax loader' />";
        http.post('ftp/ftp.php', formData).then(function(xmlHTTP) {
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
                            doToolbar();
                            loadBackedUpFile();
                        } 
            }
        });
    };

    var loadBackedUpFile = function() {
            http.get('ftp/backup.php').then (
                function(xmlHTTP) {
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
                            setInterval(backup, 10000);
    };

    var backup = function() {
        var data = new FormData();
        data.append("src", browser.getCode());
        data.append("filename", fileInfo.file==null ? "":
                        fileInfo.file);
        msgDiv.innerHTML = "Backing up...";
        http.post('ftp/backup.php', data).then(function(xmlHTTP) {
            setTimeout ( showFilename, 2000);
            });
    };

    var showFilename = function(fInfo) {
        fInfo = fInfo || fileInfo;
        filenameDiv.innerHTML = (fInfo.file!=null) ?
                 fInfo.file: "UNSAVED";
    }


    var doTabs = function() {
        var tabs = document.getElementById('client_tabs').
            getElementsByTagName("span");
        for(var j=0; j<tabs.length; j++) {
            tabs[j].classList.remove("active");
        }
        
        tabs[mode].classList.add("active");
    }

    var doToolbar = function() {
        for(id in showInModes[mode] ) {
            document.getElementById(id).style.display = 
                (showInModes[mode][id].length==2 &&
                showInModes[mode][id][1]==true &&
                loggedin==null) ? 
                'none': showInModes[mode][id][0];
        }
    }

    var resetLogin = function() {
        document.getElementById("login").innerHTML = savedLoginHTML;
        initFtpSubmitBtn();
    }

    var initFtpSubmitBtn = function() {
        document.getElementById("ftpsubmit").addEventListener
                    ("click",login);
    }

    var saveOld = function(cb) {
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
            ("click",function() {
                if(loggedin==null) {
                    alert("Not logged in!");
                } else {
                    askUploadFile();
                }

            });

    document.getElementById("file_new").addEventListener
            ("click", function()
                {
                    saveOld (function() {
                        fileInfo.file = null;
                        browser.setCode("");
                        showFilename();
                    });
                }
            );

    // stackoverflow.com/questions/2897619/using-html5-javascript-to-generate-and-save-a-file
    document.getElementById("file_save").addEventListener
            ("click", function(e)
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
                ("click", (function(i,e) {
                    mode=i;
                    doTabs();
                    doToolbar();
                }).bind(this,i));
        tabs[i].addEventListener
                ("mouseover", function(e) {
                    e.target.style.cursor="default";
                } );
    }

    showFilename();
    doTabs();
    doToolbar();
}


