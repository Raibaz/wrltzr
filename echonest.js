var echonest = {
	name: "Echonest",
	search_results_count: 20,
	weight: 2.5,
	api_key: "HXMAGYP12YUFX9IMV",
	search_all: function(query, callback) {
		echonest.search_tags(query, callback);
		echonest.search_artist(query, callback);
	},
	search_tags: function(tags, callback) {
		$.getJSON('http://developer.echonest.com/api/v4/song/search?api_key=N6E4NIOVYMTHNDM8J&format=json&bucket=artist_hotttnesss&bucket=song_hotttnesss&sort=song_hotttnesss-desc&results=' + echonest.search_results_count + '&description=' + escape(tags) + '&style=' + escape(tags) + '&mood=' + escape(tags), function(data) {
			console.log(data);
			response = data.response;
			results = new Array();
			lookup_service = get_service('youtube');
			$.each(response.songs, function(index, value) {
				echonest.build_song(value, lookup_service, function(song) {
					results.push(song);
				})
			});
			callback(results);
		});
	},
	search_artist: function(query, callback) {
		$.getJSON('http://developer.echonest.com/api/v4/artist/search?api_key=N6E4NIOVYMTHNDM8J&bucket=familiarity&bucket=hotttnesss&bucket=video&results=' + echonest.search_results_count + '&name=' + escape(query), function(data) {
			console.log(data);
			response = data.response;
			if(!response || !response.artists || response.artists.length == 0) {
				callback(echonest.name);
			}
			results = new Array();
			lookup_service = get_service('youtube');
			$.each(response.artists, function(index, value) {
				$.each(value.video, function(video_index, video_value) {
					echonest.build_song_from_video(value, video_value, lookup_service, function(song) {
						results.push(song);
					});
				});				
			});
			callback(results);
		});		
	},	
	build_song: function(service_song, lookup_service, callback) {
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
			}, score: echonest.compute_score(service_song.artist_hotttnesss, service_song.song_hotttnesss)
		};
		callback(ret);
	},
	build_song_from_video: function(service_artist, service_song, lookup_service, callback) {
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
			}, score: echonest.compute_score(service_artist.hotttnesss, 0)
		}
		callback(ret);
	},
	extract_youtube_id_from_video_url: function(url) {
		return url.replace("http://www.youtube.com/watch?v=", "");
	},
	compute_score: function(artist_hotttnesss, song_hotttnesss) {
		return 10 * (artist_hotttnesss + song_hotttnesss) * echonest.weight;
	},
	get_similar_artists: function(song, callback) {
		$.getJSON('http://developer.echonest.com/api/v4/artist/similar?api_key=N6E4NIOVYMTHNDM8J&results=5&id=' + escape(song.artist.service_id), function(data) {
			console.log("Similar artists");
			console.log(data);
			response = data.response;
			ret = new Array();
			$.each(response.artists, function(index, value) {
				ret.push(value.name);
			});
			callback(ret);
		});
	},
	get_song_tags: function(song, callback) {

	}
};

available_services['Echonest'] = echonest;