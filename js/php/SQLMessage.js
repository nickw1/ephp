const Eventable = require('../gen/Eventable');

class SQLMessage  extends Eventable {
    constructor(options) {
		super();
		this.sql = options.sql;
		this.results = options.results;
    }

    getRequest() {
		return this.sql;
	}

    getResponse() {
		if(this.results.length == 0) {
			return "No results";
		} else {
			const heading = '<tr>' + Object.keys(this.results[0])
							.map (key => `<td>${key}</td>`).join('') + '</tr>';
			const tbody = this.results.map ( result =>{
				let row = '<tr>';
				for (let col in result) {
					row += `<td>${result[col]}</td>`;
				}
				row += '</tr>';
				return row;
			}).join('');
			return `<table>${heading}${tbody}</table>`;
		}		
    }

    finish() {
    }
}

module.exports = SQLMessage;
