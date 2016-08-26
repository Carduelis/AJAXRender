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
	Object.assign(this, settings);
	// this.method is 
	// to do
	// проверку на невалидный settingss 

	this.$target = $(this.settings.target);	
	this.method = settings.method || 'html';

	// wrapping data into root-key
	if (this.wrapData !== false) {
		this.model = {
			root : this.settings.model;
		}
	} else {
		this.model = this.settings.model;
	}
	
	this.template = $(this.settings.template);
	this.resultHTML = _.template(this.template)(this.model);
	this.$result = $(this.resultHTML);
	this.out = (this.method) => this.method == 'replace' ? this.$target.before(this.$result).remove() : this.$target[this.method](this.$result);
	this.out();
	return this;
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

function AsyncRender(settings) {
	settingsExample = {
		model: {},
		view: {
			method: 'html',
			target: '#id', // $(jq)
			template: '/werw/wer/et.tmpl',
			useLocalStorage: true,
		},
		cb : {
			// prefetch: function(model){return model},
			// onRender: function() {return false},
			// beforeRender: function() {return this},
			// onLoad: function() {return false},
			// onError: function() {return false},
		}
	}
	Object.assign(this, _.defaultsDeep(settings, settingsExample));

	this.dataType = is_jqXHR(this.model) ? 'jqXHR' : typeof this.model;

	if (localStorage[this.template] && this.settings.view.useLocalStorage) {
		$.when(this.model, this.view.template ).then(this.render, this.renderError).done(this.onLoad);
	} else {
		$.when(this.model, $.get(this.view.template) ).then(this.render, this.renderError).done(this.onLoad);
	}	
	return this
}

AsyncRender.prototype.onLoad = function() {
	if (typeof this.cb.onLoad == 'function') {
		this.cb.onLoad(this)
	}
	return this
};
	
AsyncRender.prototype.onBeforeRender = function() {
	if (typeof this.cb.onBeforeRender == 'function') {
		this.cb.onBeforeRender(this);
	}
	return this
}
	
AsyncRender.prototype.onRender = function() {
	if (typeof this.cb.onRender == 'function') {
		this.cb.onRender(this);
	} else {
		this.css('display','none').fadeIn();
	}
	return this
}
AsyncRender.prototype.onError = function() {
	if (typeof this.cb.onError == 'function') {
		this.cb.onError(data, textStatus, jqXHR);
	} else {
		this.renderError(data, textStatus, jqXHR)
	}
	return this
}
AsyncRender.prototype.prefetch = function(model) {
	if (typeof this.cb.prefetch == 'function') {
		this.cb.prefetch(model);
	}
	return model
}
AsyncRender.prototype.render = function(data,template) {
	if (typeof this.onBeforeRender === 'function') {
		this.onBeforeRender(this);
	}

	if (is_jQuery_response(template)) {
		// save to localStorage
		localStorage[settings.template] = template[0];
	}

	this.$result = new SyncRender({
		method : this.view.method,
		target : this.view.target,
		model : is_jQuery_response(template) ? this.prefetch(data[0]) : this.prefetch(data),
		view: {
			method: this.method,
			target: this.target,
			template : localStorage[this.template],
		}
	}).$result.onRender();
}

AsyncRender.prototype.renderError = function(data,textStatus,jqXHR) {
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
		template+= 		'</div>';

	this.$result = new SyncRender({
		method : settings.method,
		target : settings.target,
		data : [data,textStatus,jqXHR],
		template : template,
	}).$result

	return this
}