fx_version "cerulean"

games {"gta5"}

description "fivem-voice"

author "snakewiz"

version "1.0.0"

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
