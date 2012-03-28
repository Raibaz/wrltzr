var sound_cloud = {
	name: "Soundcloud",
	search_results_count: 20,
	client_id: 'bbddf35ebd6e8fedb840ed23f1c0e7ec',
	weight: 2,
	tooltip_text: "Soundcloud is a music sharing service aimed primarily to producers and record labels, who share their own productions and remixes; thus, most of the music found via Soundcloud is relatively new, sometimes quite underground and often geared towards electronic",
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
			if(!data || data.length == 0) {
				callback(sound_cloud.name);
			}
			$.each(data, function(index, value) {
				results = new Array();
				lookup_service = get_service('Soundcloud');
				$.each(data, function(index, value) {
					sound_cloud.build_song(value, lookup_service, index, function(song) {					
						results.push(song);
					});
				});
			});
			callback(results);
		});
	},
	build_song: function(service_song, lookup_service, index, callback) {
		ret = {
			key: service_song.user.username + "_" + service_song.title,
			name: service_song.title,
			service: sound_cloud,
			artist: {
				name: service_song.user.username
			},
			score: sound_cloud.compute_score(service_song, index),
			embed: {
				key: service_song.permalink_url,
				service: lookup_service,
				service_id: service_song.id,
				title: service_song.title
			},
			tags: service_song.tag_list.split(" ")
		};
		callback(ret);
	},	
	compute_score: function(service_song, index) {
		if(global_configuration.use_normalized_scores) {
			return sound_cloud.search_results_count - index;
		} else {
			return (service_song.playback_count / 1000) + (service_song.favoritings_count / 100);
		}
	},
	search_embed: function(embed, callback) {		
		resp = {
			code: '<div class="sc-player"><a href="' + embed.key + '"/></div>',
			service_name: sound_cloud.name,			
		}
		callback(resp);		
	},
	get_song_tags: function(song, callback) {
		if(song.tags) {
			callback(song.tags);
		}
	}
};

available_services['Soundcloud'] = sound_cloud;

$(document).bind('scPlayer:onMediaEnd', function(event) {
	play_next_song();
});