// 14.06.2016 Pavel Shchegolev
// License GPL 3.0
// v0.4.0

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
	console.log(this,settings)
	// this.method is 
	// to do
	// проверку на невалидный settingss 

	this.$target = $(this.target);	
	this.method = this.method || 'html';
	this.model = {
		root: this.model
	}
	
	
	// this.template = $(this.template);
	this.resultHTML = _.template(this.template)(this.model);
	this.$result = $(this.resultHTML);
	if (typeof this.renderMethod === 'function') {
		this.renderMethod(this.$target, this.$result);
	} else {
		this.out = () => this.method == 'replace' ? this.$target.before(this.$result).remove() : this.$target[this.method](this.$result);
		this.out();
	}
	return this;
}

function FastRender(settings) {
	this.settings = settings || {};
	this.data = {
		root : this.settings.data
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
	defaults = {
		model: {},
		view: {
			method: 'html',
			target: '#id', // $(jq)
			template: '/werw/wer/et.tmpl',
			useLocalStorage: true,
		},
		cb : {}
	}
	settingsExample = {
		model: {},
		view: {
			method: 'html',
			target: '#id', // $(jq)
			template: '/werw/wer/et.tmpl',
			useLocalStorage: true,
		},
		cb : {
			prefetch: function(model){return model},
			onRender: function() {return false},
			beforeRender: function() {return this},
			onLoad: function() {return false},
			onError: function() {return false},
		}
	}
	Object.assign(this, _.defaultsDeep(settings, defaults));

	this.clearOldTemplates();
	// this.dataType = is_jqXHR(this.model) ? 'jqXHR' : typeof this.model;
	this.init();	
	return this
}
AsyncRender.prototype.help = function() {
	console.log(settingsExample);
}
AsyncRender.prototype.init = function() {
	var renderError = (data,textStatus,jqXHR) => {
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
		console.log(this);
		this.$result = new SyncRender({
			method : this.view.method,
			target : this.view.target,
			data : [data,textStatus,jqXHR],
			template : template,
		}).$result

		return this
	}
	var render = (model,template) => {
		this.view.templateSource = template[0];
		if (typeof this.onBeforeRender === 'function') {
			this.onBeforeRender(this);
		}

		if (is_jQuery_response(template)) {
			// save to localStorage
			localStorage[this.view.template] = template[0];
		}
		this.json = is_jQuery_response(model) ? model[0] : model;
		this.$el = new SyncRender({
			method : this.view.method,
			target : this.view.target,
			model : this.prefetch(this.json),
			template : localStorage[this.view.template],
			renderMethod: this.cb.renderMethod
		}).$result;
		this.onRender()
	}

	if (localStorage[this.view.template] && this.view.useLocalStorage) {
		console.warn('Не грузим')
		$.when(this.model, this.view.template ).then(render, renderError).done(()=>this.onLoad());
	} else {
		console.warn('Грузим')
		$.when(this.model, $.ajax({
			cache: false,
			url: this.view.template
		}) ).then(render, renderError).done(()=>this.onLoad());
	}
}
AsyncRender.prototype.clearOldTemplates = function() {
	function getVersion(str) {
		var separator = '?v=';
		var version = str.split(separator)[1]
		return version || false;
	}
	var requestedTemplateVersion = getVersion(this.view.template);
	for (var i in localStorage) {
		if (getVersion(i) < requestedTemplateVersion) {
			console.info(i,'Old version is',getVersion(i),'now it is',requestedTemplateVersion);
			localStorage.removeItem(i);
		}
	}
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
	
AsyncRender.prototype.renderMethod = function() {
	this.css('display','none').fadeIn();
}
AsyncRender.prototype.onRender = function() {
	if (typeof this.cb.onRender == 'function') {
		this.cb.onRender(this);
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


var AR = new AsyncRender({
	// model: $.ajax({
	// 	url: 'ajax.service/faip/top_bar.php',
	// 	data: {
	// 		'action' : 'objectInfo',
	// 		'objectId': 555
	// 	},
	// 	dataType: 'json'
	// }),
	model: {
		customerName:"GEV",
		fcpName:"Социально-экономическое развитие Республики Ингушетия на 2010 - 2016 годы",
		objectName:"321321321",
	},
	view: {
		method: 'html',
		target: '#overview>h2',
		useLocalStorage: true,
		template: 'templates/faip/parts/tmpl/object_header.tmpl',
	},
	cb: {
		onLoad: function(AR) {
			console.log(AR)
		},
		onRender: function(AR) {
			console.log(AR)
		},
		onBeforeRender: function(AR) {
			console.log(AR)
		},
	}
})