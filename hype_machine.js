var hype_machine = {
	name: "Hypemachine",
	search_results_count: 20,
	weight: 0.75,
	search_all: function(query, callback) {		
		hype_machine.search_tags(query, callback);
		hype_machine.search_artist(query, callback);
	},
	search_helper: function(url, callback) {		
		$.getJSON(url, function(data) {
			console.log("Hype machine response: ");
			console.log(data);
			if(!data || data.length == 0) {
				callback(hype_machine.name);
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
			service: hype_machine,
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
		posted_count_modifier = 0.1;
		ret = ((hype_machine.search_results_count - service_song.index) + (service_song.posted_count * posted_count_modifier)) * hype_machine.weight;
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