var echonest = {
	name: "Echonest",
	search_results_count: 20,
	weight: 2,
	tooltip_text: "The echonest is a music knowledge platform powered by MIT, Columbia and Berkeley R&D providing lots of information about many kinds of music; thus, search results provided by The echo nest are generally very reliable, even if sometimes a little shifted towards mainstream music.",
	api_key: "HXMAGYP12YUFX9IMV",
	search_all: function(query, callback) {
		echonest.search_tags(query, callback);
		echonest.search_artist(query, callback);
	},
	search_tags: function(tags, callback) {
		$.getJSON('http://developer.echonest.com/api/v4/song/search?&api_key=HXMAGYP12YUFX9IMV&format=json&bucket=artist_hotttnesss&bucket=song_hotttnesss&sort=song_hotttnesss-desc&results=' + echonest.search_results_count + '&description=' + escape(tags) + '&style=' + escape(tags) + '&mood=' + escape(tags),
		 function(data) {
				console.log(data);
				response = data.response;
				results = new Array();
				lookup_service = get_service('youtube');
				$.each(response.songs, function(index, value) {
					echonest.build_song(value, lookup_service, index, index, function(song) {
						results.push(song);
					})
				});
				callback(results);		
		}).error(function(data) {callback(echonest.name)});
	},
	search_artist: function(query, callback) {
		$.getJSON('http://developer.echonest.com/api/v4/artist/search?&api_key=HXMAGYP12YUFX9IMV&bucket=familiarity&bucket=hotttnesss&bucket=video&results=' + echonest.search_results_count + '&name=' + escape(query), 
		function(data) {
			console.log(data);
			response = data.response;
			if(!response || !response.artists || response.artists.length == 0) {
				callback(echonest.name);
				return;
			}
			results = new Array();
			lookup_service = get_service('youtube');
			$.each(response.artists, function(index, value) {
				if(value.video != undefined && value.video.length > 0) {
					$.each(value.video, function(video_index, video_value) {
						echonest.build_song_from_video(value, video_value, lookup_service, index, video_index, function(song) {
							results.push(song);
						});
					});				
				} 
			});
			if(results.length == 0) {
				callback(echonest.name);
				return;
			}
			callback(results);		
		}).error(function(data) {callback(echonest.name)});		
	},	
	build_song: function(service_song, lookup_service, artist_index, song_index, callback) {
		ret = {
			key: service_song.artist_name + "_" + service_song.title,
			service: echonest,
			service_id: service_song.id,
			name: service_song.title,
			artist: {
				name: service_song.artist_name,
				service_id: service_song.artist_id
			}, embed: {
				service: lookup_service,
				key: service_song.artist_name + " " + service_song.title
			}, score: echonest.compute_score(service_song.artist_hotttnesss, service_song.song_hotttnesss, artist_index, song_index)
		};
		callback(ret);
	},
	build_song_from_video: function(service_artist, service_song, lookup_service, artist_index, song_index, callback) {
		ret = {
			key: service_artist.name + "_" + service_song.title,
			service: echonest,
			service_id: service_song.id,
			name: service_song.title,
			artist: {
				name: service_artist.name,
				service_id: service_artist.id
			}, embed: {
				service: lookup_service,
				key: echonest.extract_youtube_id_from_video_url(service_song.url)
			}, score: echonest.compute_score(service_artist.hotttnesss, 0, artist_index, song_index)
		}
		callback(ret);
	},
	extract_youtube_id_from_video_url: function(url) {
		return url.replace("http://www.youtube.com/watch?v=", "");
	},
	compute_score: function(artist_hotttnesss, song_hotttnesss, artist_index, song_index) {
		if(global_configuration.use_normalized_scores) {
			return Math.floor(((echonest.search_results_count - artist_index) + (echonest.search_results_count - song_index)) / 2) * echonest.weight;
		} else {
			return 10 * (artist_hotttnesss + song_hotttnesss) * echonest.weight;
		}
	},
	get_similar_artists: function(song, callback) {
		$.getJSON('http://developer.echonest.com/api/v4/artist/similar?&api_key=HXMAGYP12YUFX9IMV&results=5&id=' + escape(song.artist.service_id), function(data) {
			console.log("Similar artists");
			console.log(data);
			response = data.response;
			ret = new Array();
			$.each(response.artists, function(index, value) {				
				ret.push(value.name);
			});
			callback(ret);
		}).error(function(data){callback(echonest.name)});
	}	
};

available_services['Echonest'] = echonest;