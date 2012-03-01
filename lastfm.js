var lastfm = {
	name: "lastfm",
	search_results_count: 20,
	weight: 1,
	search_all: function(query, callback) {
		lastfm.search_tags(query, callback);
		lastfm.search_artist(query, callback);
	},
	search_helper: function(url, callback) {
		$.getJSON(url, function(data) {				
			console.log(data);
			results = new Array();
			var lookup_service = get_service('youtube');
			$.each(data.toptracks.track, function(index, value) {				
				lastfm.build_song(value, lookup_service, function(song) {
					results.push(song);					
				});
			});				
			callback(results);
		});
	},
	search_artist: function(query, callback) {
		lastfm.search_helper('http://ws.audioscrobbler.com/2.0/?method=artist.gettoptracks&artist=' + escape(query) + '&limit=' + lastfm.search_results_count + '&api_key=f1ad626c3a2d588bfd87788d38606b95&format=json', callback);
	},
	search_tags: function(tags, callback) {
		lastfm.search_helper('http://ws.audioscrobbler.com/2.0/?method=tag.gettoptracks&tag=' + escape(tags) + '&limit=' + lastfm.search_results_count + '&api_key=f1ad626c3a2d588bfd87788d38606b95&format=json', callback);
	},
	build_song: function(service_song, lookup_service, callback) {	
		ret = {
			key: service_song.artist.name + "_" + service_song.name,
			service_id: service_song.mbid,
			service: lastfm,
			name: service_song.name,
			artist: {
				name: service_song.artist.name
			}, embed: {
				service: lookup_service,
				key: service_song.artist.name + " " + service_song.name
			}, 
			score: lastfm.compute_score(service_song)
		};
		callback(ret);
	},
	compute_score: function(service_song) {
		return (lastfm.search_results_count - service_song['@attr'].rank) * lastfm.weight;
	},
	get_song_tags: function(song, callback) {
		if(song.service == lastfm && song.service_id) {
			//TODO ricerca per mbid
		} else {
			console.log('get_song_tags');
			$.getJSON('http://ws.audioscrobbler.com/2.0/?method=track.getinfo&artist=' + escape(song.artist.name) + '&track=' + escape(song.name) + '&api_key=f1ad626c3a2d588bfd87788d38606b95&format=json', function(data) {	
				tags = [];
				if(!data.track || !data.track.toptags || !data.track.toptags.tag) {
					return;
				}
				$.each(data.track.toptags.tag, function(index, value) {
					tags.push(value.name);
				});
				callback(tags);
			});
		}
			
	}
};

available_services['lastfm'] = lastfm;