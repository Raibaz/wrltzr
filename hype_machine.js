var hype_machine = {
	name: "Hypemachine",
	search_results_count: 20,
	weight: 1,
	tooltip_text: "The Hype machine is a music blog aggregator whose main goal is to discover new music trends by scouting what gets promoted by popular and underground music blogs. Music found through The Hype machine is typically newish and quasi-mainstream, or soon to be mainstream, or at least quite famous in the indie circuit.",
	search_all: function(query, callback) {		
		hype_machine.search_tags(query, callback);
		hype_machine.search_artist(query, callback);
	},
	search_helper: function(url, callback) {		
		$.getJSON(url, function(data) {
			console.log("Hype machine response: ");
			console.log(data);
			if(!data || data.length == 0 || data[0] == undefined) {
				console.log("Nothing found on hypem");
				callback(hype_machine.name);
				return;
			}
			results = new Array();
			lookup_service = get_service('youtube');
			$.each(data, function(index, value) {
				if(value.title) {
					value.index = index;
					hype_machine.build_song(value, lookup_service, function(song) {
						results.push(song);
					});
				}
			});			
			callback(results);
		});
	},
	search_artist: function(query, callback) {
		hype_machine.search_helper('http://hypem.com/playlist/search/' + escape(query) + '/json/1/data.js', callback);
	},
	search_tags: function(tags, callback) {
		hype_machine.search_helper('http://hypem.com/playlist/tags/' + escape(tags) + '/json/1/data.js', callback);
	},
	build_song: function(service_song, lookup_service, callback) {
		ret = {
			key: service_song.artist + "_" + service_song.title,
			services: [hype_machine],
			name: service_song.title,
			service_id: service_song.mediaid,
			artist: {
				name: service_song.artist
			}, embed: {
				service: lookup_service,
				key: service_song.artist + " " + service_song.title
			}, 
			score: hype_machine.compute_score(service_song)
		};
		callback(ret);
	},
	compute_score: function(service_song) {
		ret = (hype_machine.search_results_count - service_song.index) * hype_machine.weight;
		if(global_configuration.use_normalized_scores) {
			var posted_count_modifier = 0.1;
		 	ret += (service_song.posted_count * posted_count_modifier) * hype_machine.weight;
		}
		return ret;		
	},
	get_song_tags: function(song, callback) {
		if(song.service == hype_machine) {
			$.getJSON('http://hypem.com/playlist/song/' + song.service_id + '/json/1/data.js', function(data) {
				console.log(data);			
				callback(data['0'].tags);
			});
		} else {
			//TODO ricerca per titolo e artista
		}
	}
};

available_services['Hypemachine'] = hype_machine;