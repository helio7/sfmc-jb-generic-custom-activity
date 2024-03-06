"use strict";
const activity = require("./activity");
const configJsonFile = require("../public/config.json");

/*
 * GET home page.
 */
exports.index = (req, res) => {
	if (!req.session.token) {
		res.render("index", {
			title: "Unauthenticated",
			errorMessage: "This app may only be loaded via Salesforce Marketing Cloud."
		});
	} else {
		res.render("index", {
			title: "Journey Builder Activity",
			results: activity.logExecuteData
		});
	}
};

exports.login = (req, res) => {
	// console.log("req.body: ", req.body);
	res.redirect("/");
};

exports.logout = (req, res) => {
	req.session.token = "";
};

exports.configJson = async (req, res) => {
	const { ENVIRONMENT, APPLICATION_EXTENSION_KEY, THIS_SERVER_BASE_URL, APIGEE_USER_KEY } = process.env;
	let nameEnvironmentLabel = '';
	switch (ENVIRONMENT) {
		case 'desa':
			nameEnvironmentLabel = ' - DESA';
			break;
		case 'test':
			nameEnvironmentLabel = ' - TEST';
			break;
		default:
			break;
	}
	configJsonFile.lang["en-US"].name = `Consulta de pack pendiente${nameEnvironmentLabel}`;
	configJsonFile.configurationArguments.applicationExtensionKey = APPLICATION_EXTENSION_KEY;
	const apigeeUserKeyHeaderValue = "{\"user_key\":\"" + APIGEE_USER_KEY + "\"}";
	configJsonFile.arguments.execute.url = `${THIS_SERVER_BASE_URL}/journeybuilder/execute`;
	configJsonFile.arguments.execute.headers = apigeeUserKeyHeaderValue;
	configJsonFile.configurationArguments.save.url = `${THIS_SERVER_BASE_URL}/journeybuilder/save`;
	configJsonFile.configurationArguments.save.headers = apigeeUserKeyHeaderValue;
	configJsonFile.configurationArguments.publish.url = `${THIS_SERVER_BASE_URL}/journeybuilder/publish`;
	configJsonFile.configurationArguments.publish.headers = apigeeUserKeyHeaderValue;
	configJsonFile.configurationArguments.stop.url = `${THIS_SERVER_BASE_URL}/journeybuilder/stop`;
	configJsonFile.configurationArguments.stop.headers = apigeeUserKeyHeaderValue;
	configJsonFile.configurationArguments.validate.url = `${THIS_SERVER_BASE_URL}/journeybuilder/validate`;
	configJsonFile.configurationArguments.validate.headers = apigeeUserKeyHeaderValue;
	res.json(configJsonFile);
};
