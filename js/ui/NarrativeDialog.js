
const Narrative = require('../php/Narrative');
const Eventable = require('../http/Eventable');

class NarrativeDialog extends Eventable {

    constructor(options) {
        super();
        this.dlg = new Dialog(options.elemId, {
                },
                options.dialogStyle || 
                { position: 'absolute',
                left: '25%',
                top: 'calc(50% - 200px)',
                border: '1px solid black',
                width: '50%',
                backgroundColor: '#ffffc0',
                filter: 'grayscale(0%)',
                height: '400px' } );

        const narrativeOptions = {elem : this.dlg.div, narrative: options.narrative};
        this.narrative = new Narrative(narrativeOptions);
        this.greyOutOverlay = document.getElementById(options.greyOutOverlay||'greyOutOverlay');
    }

    on(eventType, eventHandler) {
        if(eventType == "dismissed") {
            this.narrative.on("dismissed", ()=> {
                this.dlg.hide();
                if(this.greyOutOverlay) {
                    this.greyOutOverlay.style.display = 'none';
                }
                eventHandler();    
            });
        } else {
            super.on(eventType, eventHandler);
        }
    }

    show() {
        if(this.greyOutOverlay) {
            this.greyOutOverlay.style.display = 'block';
        }
        this.dlg.show();
        this.narrative.show();
    }
}

module.exports = NarrativeDialog;
