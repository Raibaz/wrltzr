var available_services = {};

$.getScript('youtube.js', function() {
	console.log('loaded youtube.js');
	add_service(youtube);
});

$.getScript('lastfm.js', function() {
	console.log('loaded lastfm.js');
	add_service(lastfm);
});

$.getScript('hype_machine.js', function() {
	console.log('loaded hype_machine.js');
	add_service(hype_machine);
});

$.getScript('soundcloud.js', function() {
	console.log('loaded soundcloud.js');
	add_service(sound_cloud);
});

$.getScript('echonest.js', function() {
	console.log('loaded echonest.js');
	add_service(echonest);
});

$.getScript('exfm.js', function() {
	console.log('loaded exfm.js');
	add_service(exfm);
});

var get_service = function(service_name) {
	return available_services[service_name];
}

