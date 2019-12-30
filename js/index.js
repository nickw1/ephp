
const EPHPHttpAnimation = require('./http/EPHPHttpAnimation');
const Browser = require('./http/Browser');
const FileExplorer = require('./fs/FileExplorer');
const ResizableWindowSet = require('./ui/ResizableWindowSet');
const PHPAnimation = require('./php/PHPAnimation');

class App {
    constructor() {
        this.fileInfo = { "file": null, "dir": null }; 
        this.newFileInfo=null;
        this.loggedin = null;
        this.msgDiv = document.getElementById("msg");
        this.filenameDiv = document.getElementById("filename");
        this.mode=0;
        this.savedLoginHTML=""; 
        this.origLoginDivContents = "";

        this.fileExplorer=new FileExplorer('serverContent', 
            {http: 'php/fs.php',
            ftp: 'php/ftp.php' } ,
            'client',
            { showContentCallback: (mime,src,webdirPath, webdirUrl)=> {
                    this.saveOld(()=> {
                        this.browser.setContent(mime,src);
                        this.browser.setFreezeAlteredStatus(false);
                        this.fileInfo = this.newFileInfo;
                        var filePath = webdirUrl+this.fileInfo.dir.substr(1);
                        this.browser.setWebDir(filePath);       
                        this.browser.setFile(this.fileInfo.file);
                        this.browser.loadExternalCSS();
                        this.browser.markUnaltered();
                        this.newFileInfo = null;
                        if(this.mode==0) {
                            this.showFilename();
                        }
                    });
                    }, 
                 fileInfoCallback: fInfo=> { this.newFileInfo = fInfo; },
                 onDragStart: () => { this.browser.setFreezeAlteredStatus(true); },
        });

        this.phpAnim = new PHPAnimation({divId:"serverContent",
                                        consoleElement: "console"});

        this.httpAnim = new EPHPHttpAnimation({parentId: 'network',
                                    interval: 20,
                                    step : 2,
                                    fileExplorer: this.fileExplorer,
                                    serverAnimation: this.phpAnim
                                    
        });

        this.browser = new Browser({divId: 'content', 
                                animation: this.httpAnim,
                                sourceElement: 'src_ace'});

        
        this.browser.on("responseloaded", cb=> {
                           this.saveOld ( ()=> {
                                cb();
                                this.fileInfo.file=this.fileInfo.dir=null;
                                this.showFilename();
                            } )
                        });
        

        // Resize event was here

        this.errors = { 
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

       this.showInModes = [
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

        this.settingsLabels = {
            'narrative': 'Show narrative',
            'server_anim' : 'Show PHP script step-through',
            'db_anim' : 'Show PHP / Database animation'
        };
            
       this.dialog = new Dialog ("client",
                            { 
                                'Yes': ()=> {
                                    this.dialog.hide();
                                    this.uploadContent();
                                    if(this.dialog.additionalCallback) {
                                        this.dialog.additionalCallback();
                                        this.dialog.additionalCallback = null;
                                    }
                                }, 
                                'No': ()=> {
                                    this.dialog.hide();
                                    if(this.dialog.additionalCallback) {
                                        this.dialog.additionalCallback();
                                        this.dialog.additionalCallback = null;
                                    }
                                },
                                'Cancel': ()=> {
                                    this.dialog.hide();
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
        if(document.getElementById("ftpsubmit")) {
            this.initFtpSubmitBtn();
        } else {
            this.login();
        }

        document.getElementById("file_upload").addEventListener
            ("click",()=> {
                if(this.loggedin==null) {
                    alert("Not logged in!");
                } else {
                   this.uploadContent(); 
                }

            });

        document.getElementById("file_new").addEventListener
            ("click", ()=>
                {
                    this.saveOld (()=>{
                        this.fileInfo.file = null;
                        this.browser.setCode("");
                        this.showFilename();
                    });
                }
            );

    // stackoverflow.com/questions/2897619/using-html5-javascript-to-generate-and-save-a-file
        document.getElementById("file_save").addEventListener
            ("click", e=>
                {
                    var a = document.createElement("a"); 
                    this.fileInfo.file = (this.fileInfo.file==null ?
                        prompt("Please enter a filename") :
                        this.fileInfo.file);    
                    if(this.fileInfo.file!=null) {    
                        this.showFilename();
                        a.setAttribute("download", this.fileInfo.file);
                        a.setAttribute("href", "data:text/plain;charset=utf-8,"+encodeURIComponent(this.browser.getCode()));
                    /*
                    var event = new Event('click'); // new way?
                    */
                
                     var event = document.createEvent('MouseEvents');
                      event.initEvent('click', true, true);
                
                        a.dispatchEvent(event);
                    }
                }
            );

        var tabs = document.getElementById('client_tabs').getElementsByTagName("span");

        for(var i=0; i<tabs.length; i++) {
            tabs[i].addEventListener
                ("click",  (function(j,e) {
                    this.mode=j;
                    this.setupTabs();
                    this.setupModeDisplay();
                    // MUST be done after changing visibility
                    this.browser.refresh(); 
                }).bind(this,i));
            tabs[i].addEventListener
                ("mouseover", e=> {
                    e.target.style.cursor="default";
                } );
        }

        this.showFilename();
        this.setupTabs();
        this.setupModeDisplay();
        this.clientServerResizable = new ResizableWindowSet([document.getElementById('client'), 
                                    document.getElementById('networkContainer'),
                                    document.getElementById('server')]);
        this.clientServerResizable.on("finish", this.httpAnim.calculateCanvasPos.bind(this.httpAnim));
        this.clientServerResizable.setup();

        this.logResizable = new ResizableWindowSet([document.getElementById('vars'), 
                                    document.getElementById('dbresults'),
                                    document.getElementById('log')]);
        this.logResizable.setup();

        this.verticalResizable = new ResizableWindowSet([document.getElementById('ephp_container'), document.getElementById('dbg')], true);
        this.verticalResizable.setup();
        this.verticalResizable.on("drag", this.httpAnim.calculateCanvasPos.bind(this.httpAnim));
        this.verticalResizable.on("finish", this.httpAnim.calculateCanvasPos.bind(this.httpAnim));

        

        window.addEventListener("resize",this.onResize.bind(this)); 
        var origWidth, netWidth = 400;

        var networkShowDiv = document.createElement("div");
        networkShowDiv.style.backgroundColor = '#ffffe0';
        networkShowDiv.style.width='75px';
        networkShowDiv.style.border='ridge';
        var cloudImg = new Image();
        cloudImg.src='assets/images/rgtaylor_csc_net_wan_cloud.vsmall.png';
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
            this.httpAnim.setActive(true);
            this.httpAnim.clearCanvas();
            rw.showResizer(netCont, true);
        });

        this.onResize();

        this.settings = { narrative: true, server_anim: true, http_anim: true };

        this.config = { sockserver: 'localhost' };
        fetch('config.json')
            .then(response => response.json())
            .then(json => this.config=json);

    }

    askUploadFile(runAfterUpload) {
        this.dialog.additionalCallback = runAfterUpload;
        this.dialog.setContent("Unsaved file. Upload to server?");
        this.dialog.show();
    }

    uploadContent() {
        var formData = new FormData();
        this.savedLoginHTML = document.getElementById("login").innerHTML;

        if(document.getElementById("ephp_username") && 
            document.getElementById("ephp_password")) { 
        
            formData.append("ephp_username", 
                    document.getElementById("ephp_username").value);
            formData.append("ephp_password", 
                    document.getElementById("ephp_password").value);
        }
        var filename=null, msg="";
        if(this.fileInfo.file==null) {
            filename = prompt("Unsaved file. Please enter a filename:");
            if(filename!=null && this.fileExplorer) {
                filename=this.fileExplorer.dir+"/"+filename;
            } 
        } else {
            filename = this.fileInfo.file;
        }

        if(filename!=null) {
            alert("Transferring: " + filename);
            formData.append("filename", filename);
            formData.append("src",this.browser.getCode());
            formData.append("action", "upload");
            msg = "Transferring file...";

            const xhr = new XMLHttpRequest();
            xhr.addEventListener("load",  e=> {
                var json = JSON.parse(e.target.responseText);
                if(json.status!=0 && (json.status>=256)) {
                    alert('Error: ' + this.errors[json.status]);
                } else {
                    this.browser.markUnaltered();
                    this.fileExplorer.sendAjax();

                    if(this.fileInfo.file==null && filename!="") {
                        this.fileInfo.file = filename;
                        this.showFilename();
                    } 
                }
            });
            xhr.open("POST", "php/ftp.php");
            xhr.send(formData);
        }
    }

    login(e) {
        var formData = new FormData();
        this.savedLoginHTML = document.getElementById("login").innerHTML;
        formData.append("action", "login"); // don't try and transfer

        
        if(document.getElementById("ephp_username") &&
            document.getElementById("ephp_password")) {
            formData.append("ephp_username", 
                document.getElementById("ephp_username").value);
            formData.append("ephp_password", 
                document.getElementById("ephp_password").value);
        }
        var msg = "Logging in...";

        this.origLoginDivContents = document.getElementById("login").
                    innerHTML;
        document.getElementById("login").innerHTML = msg +
                    "<img src='assets/images/ajax-loader.gif' "+
                    "alt='ajax loader' />";
        var xhr2 = new XMLHttpRequest();
        xhr2.addEventListener("load",e=> { 
            var json = JSON.parse(e.target.responseText);
            if( json.status>=1024) {
                alert('Error: ' + this.errors[json.status]);
                this.resetLogin();
            } else {
                
                this.fileExplorer.sendAjax();

                if(json.loggedin!=null) {
                    this.loggedin = json.loggedin;
                    this.httpAnim.setLoggedIn(json.loggedin);
                    document.getElementById("login").innerHTML = 
                                "Logged in as " + this.loggedin +
                                "<a href='php/logout.php'>Logout</a>"+
                                "<div id='settings'><img id='settingsImg' src='assets/images/settings.png' alt='Settings' /><div id='settingsControl'></div></div>";
                    this.setupModeDisplay();
                    this.loadBackedUpFile();
                    this.getSettings();
                } 
            }
        });
        xhr2.open("POST", "php/ftp.php");
        xhr2.send(formData);
    }

    loadBackedUpFile() {
            fetch('php/backup.php').then ( response => response.json()).
                then ( json=> {
                                    this.browser.setCode(json.src);
                                    if(json.filename!="") {
                                        // We want to mark reloaded this.backup code
                                        // as unaltered if already saved
                                        this.browser.markUnaltered();
                                        this.fileInfo.file=json.filename;
                                        // TODO this is a quick and dirty
                                        // HACK. It does not account for
                                        // FTP vs non-FTP this.mode and will not
                                        // work if the backedup file was not
                                        // in the user's web root directory.
                                        if(this.loggedin!=null) {
                                            this.browser.setWebDir('/~' + this.loggedin);
                                            this.browser.setFile(json.filename);
                                        }
                                        this.showFilename();
                                    }
                                });
                setInterval(this.backup.bind(this), 10000);
        
    }

    backup() {
        var data = new FormData();
        data.append("src", this.browser.getCode());
        data.append("filename", this.fileInfo.file==null ? "":
                        this.fileInfo.file);
        const xhr = new XMLHttpRequest();
        xhr.addEventListener("load", e=> {
            setTimeout (this.showFilename.bind(this), 2000);
        });
        xhr.open('POST', 'php/backup.php');
        xhr.send(data);
    }

    showFilename(fInfo) {
        fInfo = fInfo || this.fileInfo;
        this.filenameDiv.innerHTML = (fInfo.file!=null) ?
                 fInfo.file: "UNSAVED";
    }


    setupTabs() {
        var tabs = document.getElementById('client_tabs').
            getElementsByTagName("span");
        for(var j=0; j<tabs.length; j++) {
            tabs[j].classList.remove("active");
        }
        
        tabs[this.mode].classList.add("active");
        
    }

    setupModeDisplay() {
        for(var id in this.showInModes[this.mode] ) {
            document.getElementById(id).style.display = 
                (this.showInModes[this.mode][id].length==2 &&
                this.showInModes[this.mode][id][1]==true &&
                this.loggedin==null) ? 
                'none': this.showInModes[this.mode][id][0];
        }
    }

    resetLogin () {
        document.getElementById("login").innerHTML = this.savedLoginHTML;
        this.initFtpSubmitBtn();
    }

    initFtpSubmitBtn () {
        document.getElementById("ftpsubmit").addEventListener
                    ("click",this.login.bind(this));
    }

    saveOld (cb) {
        if(this.browser.isAltered()) { 
            this.askUploadFile(cb);
        } else {
            cb();
        }
    }

    onResize() {
        var serverWidth = document.body.offsetWidth-
                (document.getElementById('client').offsetWidth+
                    document.getElementById('network').offsetWidth);
        document.getElementById('server').style.width=serverWidth+'px';
        this.httpAnim.calculateCanvasPos();
        this.clientServerResizable.recalculateTotalSpan();
        this.logResizable.recalculateTotalSpan();
        this.verticalResizable.recalculateTotalSpan();
    }

    getSettings() {
        fetch('php/settings.php')
            .then(response => response.json())
            .then(json => {
                this.settings = json;
                this.setupSettingsDialog();
            });
    }

    setupSettingsDialog() {
        const settingsControl = document.getElementById("settingsControl");
        for(let setting in this.settings) {
            const cb = document.createElement("input");
            cb.type = "checkbox";
            cb.checked = this.settings[setting];
            cb.id = setting;
            cb.addEventListener("click", e=>{
                this.settings[e.target.id] = e.target.checked;
                fetch('php/settings.php',
                    { method: "POST",
                        body: JSON.stringify(this.settings),
                        headers: { 'Content-Type': 'application/json' }
                    })
                .then(response => response.text())
                .then(console.log);                    
            });
            settingsControl.appendChild(cb);
            settingsControl.appendChild(document.createTextNode(this.settingsLabels[setting]));
            settingsControl.appendChild(document.createElement("br"));
        }
    }
}

window.app = new App();
