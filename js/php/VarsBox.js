class VarsBox {
    constructor(element) {
        this.varList = {};
        this.element = element;
    }

    setVar(varName, value) {
        if(!this.varList[varName]) {
            this.createVarRow(varName, value);
        } else {
            this.updateEntry(varName, value);
        }
        this.varList[varName] = value;
    }

    createVarRow(varName, value) {
        var el = document.createElement("div");
        el.setAttribute("id",  "_vars_entry_" + varName);
        this.element.appendChild(el);
        this.updateEntry(varName, value);
    }

    updateEntry (varName, value) {
        document.getElementById("_vars_entry_"+varName).innerHTML = "<strong>" + varName + "</strong>: " + value;
    }

    setMultipleVars(vars) {
        for(let varName in vars) {
            if(vars[varName].type=="string") {
                this.setVar(varName, vars[varName].value);
            }
        }
    }

    reset () {
        this.varList = {};
        this.element.innerHTML = "";
    }
}

module.exports = VarsBox;
