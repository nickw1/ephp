function VarsBox(element) {
	this.varList = {};
	this.element = element;
}

VarsBox.prototype.setVar = function(varName, value) {
	if(!this.varList[varName]) {
		this.createVarRow(varName, value);
	} else {
		this.updateEntry(varName, value);
	}
	this.varList[varName] = value;
}

VarsBox.prototype.createVarRow = function(varName, value) {
	var el = document.createElement("div");
	el.setAttribute("id",  "_vars_entry_" + varName);
	this.element.appendChild(el);
	this.updateEntry(varName, value);
}

VarsBox.prototype.updateEntry = function(varName, value) {
	document.getElementById("_vars_entry_"+varName).innerHTML = 
		"<strong>" + varName + "</strong>: " + value;
}

VarsBox.prototype.setMultipleVars = function(vars) {
	for(varName in vars) {
		if(vars[varName].type=="string") {
			this.setVar(varName, vars[varName].value);
		}
	}
}
