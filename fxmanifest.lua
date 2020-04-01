fx_version "adamant"

games {"gta5"}

description "vRost VoIP Script"

author "xIAlexanderIx"

version "0.1.0"

ui_page "dist/nui/ui.html"

files {
	"dist/config.json",
	"dist/locales/*.json",
	"dist/nui/ui.html",
	"dist/nui/css/style.css",
	"dist/nui/js/script.js",
	"dist/nui/sounds/*.*"
}

server_scripts {
	"dist/server.js"
}

client_scripts {
	"dist/client.js"
}
