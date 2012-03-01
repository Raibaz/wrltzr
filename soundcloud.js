var soundcloud = {
	name: "Soundcloud",
	search_results_count: 20,
	client_id: 'bbddf35ebd6e8fedb840ed23f1c0e7ec',
	search_all: function(query, callback) {
		soundcloud.search_artist(query, callback);
		soundcloud.search_tags(query, callback);
	},
	search_tags: function(query, callback) {
		soundcloud.search_helper('http://api.soundcloud.com/tracks.json?client_id=' + soundcloud.client_id + '&limit=' + soundcloud.search_results_count + '&order=hotness&filter=streamable&state=finished&tags=' + escape(query).replace(' ', ','), callback);
	},
	search_artist: function(query, callback) {
		soundcloud.search_helper('http://api.soundcloud.com/tracks.json?client_id=' + soundcloud.client_id + '&limit=' + soundcloud.search_results_count + '&order=hotness&filter=streamable&state=finished&q=' + escape(query), callback);
	},
	search_helper: function(url, callback) {
		$.getJSON(url, function(data) {
			console.log(data);
			$.each(data, function(index, value) {
				results = new Array();
				lookup_service = get_service('Soundcloud');
				$.each(data, function(index, value) {
					soundcloud.build_song(value, lookup_service, function(song) {					
						results.push(song);
					});
				});
			});
			callback(results);
		});
	},
	build_song: function(service_song, lookup_service, callback) {
		ret = {
			key: service_song.user.username + "_" + service_song.title,
			name: service_song.title,
			service: soundcloud,
			artist: {
				name: service_song.user.username
			},
			score: soundcloud.compute_score(service_song),
			embed: {
				key: service_song.permalink_url,
				service: lookup_service,
				service_id: service_song.id
			}
		};
		callback(ret);
	},	
	compute_score: function(service_song) {

	},
	search_embed: function(key, callback) {
		$.getJSON('http://soundcloud.com/oembed?url=' + key + '&format=json&auto_play=true&iframe=true&show_comments=false', function(data) {
			resp = {
				code: data.html,
				service_name: soundcloud.name,
				title: data.title
			};
			callback(resp);
		});
	},
	get_song_tags: function(key, callback) {
		
	}
};

SC.initialize({
	client_id: soundcloud.client_id
});

available_services['Soundcloud'] = soundcloud;