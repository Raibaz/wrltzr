var sound_cloud = {
	name: "Soundcloud",
	search_results_count: 20,
	client_id: 'bbddf35ebd6e8fedb840ed23f1c0e7ec',
	search_all: function(query, callback) {
		sound_cloud.search_artist(query, callback);
		sound_cloud.search_tags(query, callback);
	},
	search_tags: function(query, callback) {
		sound_cloud.search_helper('http://api.soundcloud.com/tracks.json?client_id=' + sound_cloud.client_id + '&limit=' + sound_cloud.search_results_count + '&order=hotness&filter=streamable&state=finished&tags=' + escape(query).replace(' ', ','), callback);
	},
	search_artist: function(query, callback) {
		sound_cloud.search_helper('http://api.soundcloud.com/tracks.json?client_id=' + sound_cloud.client_id + '&limit=' + sound_cloud.search_results_count + '&order=hotness&filter=streamable&state=finished&q=' + escape(query), callback);
	},
	search_helper: function(url, callback) {
		$.getJSON(url, function(data) {
			console.log(data);
			$.each(data, function(index, value) {
				results = new Array();
				lookup_service = get_service('Soundcloud');
				$.each(data, function(index, value) {
					sound_cloud.build_song(value, lookup_service, function(song) {					
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
			service: sound_cloud,
			artist: {
				name: service_song.user.username
			},
			score: sound_cloud.compute_score(service_song),
			embed: {
				key: service_song.permalink_url,
				service: lookup_service,
				service_id: service_song.id,
				title: service_song.title
			}
		};
		callback(ret);
	},	
	compute_score: function(service_song) {

	},
	search_embed: function(embed, callback) {		
		resp = {
			code: '<div class="sc-player"><a href="' + embed.key + '"/></div>',
			service_name: sound_cloud.name,			
		}
		callback(resp);		
	},
	get_song_tags: function(key, callback) {
		
	}
};

available_services['Soundcloud'] = sound_cloud;

$(document).bind('scPlayer:onMediaEnd', function(event) {
	play_next_song();
});