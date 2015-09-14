"use strict";

var config = {
	port: 8000,
	mongo: {
		uri: "mongodb://localhost/swsgather_development"
	},
	secret_token: "",
	session_store_name: "_ENSL_session_key_staging",
	hive_url: "http://hive.naturalselection2.com/",
	ensl_url: "http://staging.ensl.org/",
	steam_bot_link: "http://steamcommunity.com/id/nslgathers"
};

module.exports = config;