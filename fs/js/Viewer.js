function Viewer(options) {
	this.htmlElement = document.getElementById(options.htmlElement);
	this.textElement = document.getElementById(options.textElement);
	this.editor = ace.edit(options.textElement);
	this.editor.getSession().setMode("ace/mode/php");
}

Viewer.prototype.showContent = function (contentType, content) {
	switch(contentType) {
		case "text/html":
			this.showHTML(content);
			break;

		case "text/plain":
			this.showText(content);
			break;
	}
}

Viewer.prototype.showHTML = function(content) {
	this.htmlElement.innerHTML = content;
};

Viewer.prototype.showText = function(text) {
//		this.textElement.value = text;
	this.editor.setValue(text);
}
