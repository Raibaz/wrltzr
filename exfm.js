var exfm = {
	name: "Exfm",
	search_results_count: 20,
	weight: 2,
	tooltip_text: 'Ex.fm is a music discovery platform that scans through countless websites, blogs and tumblelogs to find new music; It offers features to find similar artists and song tags, so the associations it picks are likely to make sense.',
	search_all: function(query, callback) {
		exfm.search_artist(query, callback);
		exfm.search_tags(query, callback);
	},
	search_tags: function(query, callback) {
		exfm.search_helper('http://ex.fm/api/v3/trending/tag/' + escape(query) + '?results=20', callback);
	},
	search_artist: function(url, callback) {
		exfm.search_helper('http://ex.fm/api/v3/song/search/' + escape(query) + '?results=20', callback);
	},
	search_helper: function(url, callback) {
		$.getJSON(url, function(data) {
			console.log(data);
			results = new Array();
			lookup_service = get_service('youtube');
			$.each(data.songs, function(index, value) {
				exfm.build_song(value, lookup_service, index, function(song) {
					results.push(song);
				});
			});
			callback(results);
		});
	},	
	build_song: function(service_song, lookup_service, index, callback) {
		ret = {
			key: service_song.artist + "_" + service_song.title,
			service: exfm,
			service_id: service_song.id,
			name: service_song.title,
			artist: {
				name: service_song.artist				
			}, embed: {
				service: lookup_service,
				key: service_song.artist + " " + service_song.title
			},
			score: exfm.compute_score(service_song.loved_count, index),
			tags: service_song.tags,
			similar_artists: service_song.similar_artists
		};
		callback(ret);
	},
	compute_score: function(loved_count, index) {
		if(global_configuration.use_normalized_scores) {
			return (exfm.search_results_count - index) * exfm.weight;
		} else {
			return 10 * (loved_count) * echonest.weight;
		}
	},
	get_similar_artists: function(song, callback) {
		if(song.similar_artists) {
			callback(song.similar_artists);
			return;
		} else if(song.service == exfm) {
			$.getJSON('http://ex.fm/api/v3/song/' + song.service_id, function(data) {
				callback(data.song.similar_artists);				
			})
			return;
		} else {
			$.getJSON('http://ex.fm/api/v3/song/search/' + escape(song.key) + '?results=1', function(data) {
				if(!data.songs || data.songs.length <= 0) {
					return;
				}
				callback(data.songs[0].similar_artists);
			});
		}
	},
	get_song_tags: function(song, callback) {
		if(song.tags) {
			callback(song.tags);
			return;
		} else if(song.service == exfm) {
			$.getJSON('http://ex.fm/api/v3/song/' + song.service_id, function(data) {
				callback(data.song.tags);				
			})
			return;
		} else {
			$.getJSON('http://ex.fm/api/v3/song/search/' + escape(song.key) + '?results=1', function(data) {
				if(!data.songs || data.songs.length <= 0) {
					return;
				}
				callback(data.songs[0].tags);
			});	
		}
	}
};

available_services['Exfm'] = exfm;