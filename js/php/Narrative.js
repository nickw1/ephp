
const Eventable = require('../http/Eventable');

class Narrative extends Eventable {

    constructor(options) {
        super();
        this.origContents = [];
        this.options = options;
        this.elem = document.getElementById(options.elemId);
    }

    show() {
        this.saveOriginalContents();    
        this.removeContents();

        this.mainDiv = document.createElement('div');
        this.mainDiv.style.width = this.mainDiv.style.height = '100%';
        this.mainDiv.style.backgroundColor = this.options.backgroundColor || '#ffffe0';
        this.mainDiv.style.color = this.options.color || 'black';
        const narrativeDiv = document.createElement('div');
        narrativeDiv.style.overflow = 'auto';
        narrativeDiv.style.width = '100%';
        narrativeDiv.innerHTML = this.options.narrative || '';
        narrativeDiv.style.height = 'calc(100% - 64px)';
        this.elem.appendChild(this.mainDiv);
        this.mainDiv.appendChild(narrativeDiv);
        const controlsDiv = document.createElement('div');
        controlsDiv.style.width = '100%';
        controlsDiv.style.height = '64px';
        controlsDiv.style.textAlign = 'center';
        const btn = document.createElement('input');
        btn.setAttribute('type' , 'button');
        btn.setAttribute('value', 'OK');
        btn.addEventListener('click', e=> {
            this.restoreOriginalContents();
            if(this.eventHandlers.dismissed) {
                this.eventHandlers.dismissed();
            }
        });
        controlsDiv.appendChild(btn);
        this.mainDiv.appendChild(controlsDiv);

    }


    saveOriginalContents() {
        this.elem.childNodes.forEach ( node => {
            this.origContents.push(node);
        });
    }

    restoreOriginalContents() {
        this.removeContents();
        this.origContents.forEach ( node => {
            this.elem.appendChild(node);
        });
    }

    removeContents() {
        while(this.elem.childNodes.length > 0) {
            this.elem.removeChild(this.elem.firstChild);
        }
    }    
}

module.exports = Narrative;
