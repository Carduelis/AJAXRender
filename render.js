// 14.06.2016 Pavel Shchegolev
// License GPL 3.0
// v0.3.0
function is_jqXHR(obj) {
	return obj.done && obj.fail && obj.always ? true : false;
}

function is_jQuery_response(arr) {
	if (_.isArray(arr)) {
		if ((arr.length == 3) && (arr[1] === 'success') && (typeof arr[2] === 'object')) {
			return true
		}
	}
	return false;
}

function SyncRender(settings) {
	this.settings = settings || {};
	// this.method is 
	// to do
	// проверку на невалидный settingss 

	this.$target = $(this.settings.target);	
	this.method = settings.method || 'html';

	// wrapping data into root-key
	this.data = {
		root : this.settings.data;
	}
	
	this.template = $(this.settings.template);
	this.resultHTML = _.template(this.template)(this.data);
	this.$result = $(this.resultHTML);
	this.out = (this.method) => this.method == 'replace' ? this.$target.before(this.$result).remove() : this.$target[this.method](this.$result);
	this.out();
	return this.$result
}

function FastRender(settings) {
	this.settings = settings || {};
	this.data = {
		root : this.settings.data;
	}
	this.template = this.settings.template;
	this.resultHTML = _.template(this.template)(this.data);
	renderStatus = false;
	this.init = function() {
		if (document.getElementById(this.settings.target)) {
			document.getElementById(this.settings.target).innerHTML = this.resultHTML;
			renderStatus = true
		}
		return renderStatus
	}
}

function AJAXRender(settings) {

	settingsExample = {

	}


	settings = settings || {};
	// to do
	// adequated detect of render-function arguments 
	this.settings = settings;
	this.prefetch = typeof settings.prefetch === 'function' ? settings.prefetch : function(data) {return data;}
	
	this.dataType = is_jqXHR(this.data) ? 'jqXHR' : typeof this.data;
	this.callback = typeof settings.callback === 'function' ? settings.callback(this) : function() {return false;}

	if (localStorage[settings.template]) {
		$.when(this.data, $.get(this.template) ).then(this.render, this.renderError);
	} else {
		$.when(this.data, this.template ).then(this.render, this.renderError);
	}


	this.render = (data,template) => {

		if (is_jQuery_response(template)) {
			// save to localStorage
			localStorage[settings.template] = template[0];
		}

		this.$result = new SyncRender({
			method : settings.method,
			target : settings.target,
			data : is_jQuery_response(template) ? this.prefetch(data[0]) : this.prefetch(data),
			template : localStorage[settings.template],
		}).$result.css('display','none').fadeIn();

		settings.callback(this);
	}

	this.renderError = (data,textStatus,jqXHR) => {
		console.warn(data,textStatus,jqXHR);

		var template = '<br>'
			template+= '<div class="alert alert-danger">'
			template+= 		'<h4><b><%-root[2].status%></b> &mdash; <%-root[2].responseText%> <code class="pull-right"><%-root[1]%></code></h4>'
			template+= 		'<p>Попробуйте повторить запрос позднее.</p>'
			template+= 		'<p><button class="btn btn-sm btn-bordered-danger" type="button" data-toggle="collapse" data-target="#collapseError" aria-expanded="false" aria-controls="collapseError">Информация об ошибке</button>'
			if (jqXHR.status === 401) {
				template+= 		''
			} else {
				template+= 		'<div class="collapse" id="collapseError">'
				template+= 		'<ul><% for (var i in root[0]) { %><% if (typeof root[0][i] != "function") { %><% if (i == "responseText") { %><li><%-i%>: <div class="well"><%=root[0][i]%></div></li><% } else { %><li><%-i%>: <b><%=root[0][i]%></b></li><% } %><% } %><% } %></ul><ul><li><b>jqXHR</b>: <%-root[2]%></li></ul>'
				template+= 		'</div>'
			}
			template+= 		'</div>'

		this.$result = new SyncRender({
			method : settings.method,
			target : settings.target,
			data : [data,textStatus,jqXHR],
			template : template,
		}).$result
	}
	return this
}
