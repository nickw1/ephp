
function MessageBox(msg, options) {
	this.message = msg;
	this.div = document.createElement("div");
	this.div.style.position="absolute";
	/* percentages seem to be wrt the container not the network div. no
	isea why. */ 
	this.div.style.width="400px";
	this.div.style.height="400px";
	this.div.style.left="50%";
	this.div.style.top="25%";
	this.div.style.border="1px solid black";
	this.div.style.backgroundColor="#ffffc0";
	this.div.style.color="black";
	this.div.style.zIndex = 999;
	this.div.style.display="none";
	this.div.style.padding="5px";
	document.getElementById(options.parent).appendChild(this.div);
	this.textarea = document.createElement("textarea");
	this.textarea.style.width="380px";
	this.textarea.style.height="350px";
	this.div.appendChild(this.textarea);
	var btn = document.createElement("input");
	btn.setAttribute("type", "button");
	btn.setAttribute("value", "OK");
	btn.addEventListener("click", (function(e) {
				if(this.messageType == this.messageTypes.REQUEST) {
					var lines = this.textarea.value.split("\n");
					var components = lines[0].split(" ");
					this.message.setMethod(components[0]);
					this.message.setUrl(components[1]);
					if(components[0].toUpperCase()=="POST") {
						this.message.setPostData(lines[lines.length-1]);
					}
				} else if (this.messageType == this.messageTypes.RESPONSE) {
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
						this.message.setAlteredResponseHeader
							(curHeader[0], curHeader[1]);
						i++;
					}
					i++; // move past blank length
					var responseText = "";
					while(i<lines.length) {
						responseText += lines[i++]+"\n";
					}
					this.message.setContent(responseText);
				}
				this.hide();
			}).bind(this));
	this.div.appendChild(btn);
	this.messageType = this.messageTypes.NONE;
}

MessageBox.prototype.messageTypes = { REQUEST: 1, RESPONSE: -1, NONE: 0 };

MessageBox.prototype.showRequest = function() {
	this.textarea.value = this.message.getRequest();
	this.div.style.display="block";
	this.messageType = this.messageTypes.REQUEST;
}

MessageBox.prototype.showResponse = function() {
	this.textarea.value = this.message.getResponse();
	this.div.style.display="block";
	this.messageType = this.messageTypes.RESPONSE;
}

MessageBox.prototype.hide = function() {
	this.div.style.display="none";
	this.messageType = this.messageTypes.NONE;
}
