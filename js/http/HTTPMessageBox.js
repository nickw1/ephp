const MessageBox = require('./MessageBox');

class HTTPMessageBox extends MessageBox {
    constructor(msg, options) {
        super(msg, options);
    }

    setRequest() {
        var lines = this.textarea.value.split("\n");
        var components = lines[0].split(/ (.+) HTTP/);
        //var components = lines[0].split(" ");
        this.message.setMethod(components[0]);
        this.message.setUrl(components[1]);
        if(components[0].toUpperCase()=="POST") {
            this.message.setPostData(lines[lines.length-1]);
        }
    }    

    setResponse() {
        var lines = this.textarea.value.split("\n");
        if(lines.length>=1) {
            var status = lines[0].split(/^HTTP\/1\.1 (\d+) (.*)$/);
            if(status.length>=3) {
                this.message.setAlteredStatus(status[1], status[2]);
            }
        }
        var i = 1;
        while(i<lines.length && lines[i].length>0) {
            var curHeader = lines[i].split(": ");
            this.message.setAlteredResponseHeader (curHeader[0], curHeader[1]);
            i++;
        }
        i++; // move past blank length
        var responseText = "";
        while(i<lines.length) {
            responseText += lines[i++]+"\n";
        }
        this.message.setContent(responseText);
    }
}


module.exports = HTTPMessageBox;
