class MessageBox {
    constructor(msg, options) {
        this.message = msg;
        this.div = document.createElement("div");
        this.div.style.position="absolute";
        this.div.style.width=options.width || "400px";
        this.div.style.height=options.height || "400px";
        this.div.style.overflow = 'auto';
        this.div.style.left="50%";
        this.div.style.top="25%";
        this.div.style.border="1px solid black";
        this.div.style.backgroundColor="#ffffc0";
        this.div.style.color="black";
        this.div.style.zIndex = 999;
        this.div.style.display="none";
        this.div.style.padding="5px";
        options.parent.appendChild(this.div);
        console.log(`MessageBox : options.editable=${options.editable}`);
        const editable = options.editable !== false;
        if(editable) {
            this.textarea = document.createElement("textarea");
            this.textarea.style.width="380px";
            this.textarea.style.height="350px";
            this.div.appendChild(this.textarea);
        } else {
            this.innerDiv = document.createElement('innerDiv');
            this.innerDiv.style.width = '90%';
            this.innerDiv.style.height = '90%';
            this.innerDiv.style.overflow = 'auto';
            this.innerDiv.style.position = 'relative';
            this.div.appendChild(this.innerDiv);
        }
        this.addBtn();
        this.messageType = MessageBox.messageTypes.NONE;
    }

    setRequest() {
    }

    setResponse() {
    }

    addBtn() {
        var btn = document.createElement("input");
        btn.setAttribute("type", "button");
        btn.setAttribute("value", "OK");
        btn.addEventListener("click", (e)=> {
                if(this.messageType == MessageBox.messageTypes.REQUEST) {
                    this.setRequest();
                } else if (this.messageType == MessageBox.messageTypes.RESPONSE) {
                    this.setResponse();
                }
                this.hide();
            });
        this.div.appendChild(btn);
    }

    showRequest() {
        if(this.textarea) {
            this.textarea.value = this.message.getRequest();
        } else {
            this.innerDiv.innerHTML = this.message.getRequest();
        }
        this.div.style.display="block";
        this.messageType = MessageBox.messageTypes.REQUEST;
    }

    showResponse() {
        if(this.textarea) {
            this.textarea.value = this.message.getResponse();
        } else {
            this.innerDiv.innerHTML = this.message.getResponse();
        }
        this.div.style.display="block";
        this.messageType = MessageBox.messageTypes.RESPONSE;
    }

    hide() {
        this.div.style.display="none";
        this.messageType = MessageBox.messageTypes.NONE;
    }
}

MessageBox.messageTypes = { REQUEST: 1, RESPONSE: -1, NONE: 0 };

module.exports = MessageBox;
