require("es6-promise").polyfill();
var fetch = require("isomorphic-fetch");

var extend = require("./extend");
var HttpsProxyAgent = require("https-proxy-agent");
var userAgent = getUA();

function getUA() {
	var os = require("os");
	var version = require("../package.json").version;

	return os.platform() + "/" + os.release() + " " +
		"node/" + process.versions.node + " " +
		"node-browserstack/" + version;
}

var BaseClient = function(settings) {
	if (!settings.username) {
		throw new Error("Username is required.");
	}
	if (!settings.password) {
		throw new Error("Password is required.");
	}

	extend(this, settings);

	this.authHeader = "Basic " +
		new Buffer(this.username + ":" + this.password).toString("base64");
};

BaseClient.prototype.request = function(options, data, fn) {
	if (typeof data === "function") {
		fn = data;
		data = null;
	}

	fn = fn || function() {};

	var reqOptions = extend({
		method: "GET",
		headers: {
			authorization: this.authHeader,
			"content-type": "application/json",
			"user-agent": userAgent,
			"content-length": typeof data === "string" ? data.length : 0
		},
		agent: (this.proxy) ? new HttpsProxyAgent(this.proxy) : null
	}, options);

	fetch(`https://api.browserstack.com${options.path}`, reqOptions).then(response => {
		var contentType = response.headers.get("content-type");
		if (contentType && contentType.indexOf("json") !== -1) {
			return response.json();
		} else {
			return response.text();
		}
	}).then(message => {
		fn(null, message);
	}).catch(error => {
		fn(new Error(error));
	});
};

module.exports = BaseClient;
