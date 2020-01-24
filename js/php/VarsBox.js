class VarsBox {
    constructor(element) {
        this.varList = {};
        this.element = element;
    }

    setVar(varName, type, value) {
        if(!this.varList[varName]) {
            this.createVarRow(varName, type, value);
        } else {
            this.updateEntry(varName, type, value);
        }
        this.varList[varName] = value;
    }

    createVarRow(varName, type, value) {
        var el = document.createElement("div");
        el.setAttribute("id",  "_vars_entry_" + varName);
        this.element.appendChild(el);
        this.updateEntry(varName, type, value);
    }

    updateEntry (varName, type, value) {
        document.getElementById("_vars_entry_"+varName).innerHTML = "<strong>" + varName + "</strong>:"+ (type=='array' ? "<pre>" + JSON.stringify(value, undefined, " ") +"</pre>" : value);
    }

    setMultipleVars(vars) {
        for(let varName in vars) {
            if(vars[varName].type=="string") {
                this.setVar(varName, vars[varName].type, vars[varName].value);
            }
        }
    }

    reset () {
        this.varList = {};
        this.element.innerHTML = "";
    }
}

module.exports = VarsBox;
