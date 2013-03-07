var spotify = {
	name: "Spotify",
	search_results_count: 20,
	weight: 1,
	tooltip_text: "Spotify is a music listening application that has a very big catalogue; unfortunately, for this service to work, you need to have the Spotify app installed and it doesn't support autoplay, so you have to press play manually.",
	search_all: function(query, callback) {
		spotify.search_tags(query, callback);
		spotify.search_artist(query, callback);
	},
	search_tags: function(tags, callback) {
		$.getJSON('http://developer.spotify.com/api/v4/song/search?&api_key=HXMAGYP12YUFX9IMV&format=json&bucket=artist_hotttnesss&bucket=song_hotttnesss&sort=song_hotttnesss-desc&results=' + spotify.search_results_count + '&description=' + escape(tags) + '&style=' + escape(tags) + '&mood=' + escape(tags),
		function(data) {
				console.log(data);
				artist = data.artists[0];
				results = [];
				lookup_service = get_service('youtube');
				$.each(response.songs, function(index, value) {
					spotify.build_song(value, lookup_service, index, index, function(song) {
						results.push(song);
					});
				});
				callback(results);
		}).error(function(data) {callback(spotify.name);});
	},
	search_artist: function(query, callback) {
		$.getJSON('http://ws.spotify.com/search/1/artist.json?q=' + escape(query),
		function(data) {
			console.log("Spotify artists");
			console.log(data);
			artist = data.artists[0];
			results = [];
			if(!artist || typeof(artist) === 'undefined') {
				callback(spotify.name);
				return;
			}
			$.getJSON('http://ws.spotify.com/lookup/1/.json?extras=albumdetail&uri=' + artist.href, function(albumData) {
				console.log("Spotify albums");
				console.log(albumData);
				deferredArray = [];
				$.each(albumData.artist.albums, function(index, value) {
					var deferred = new $.Deferred();
					$.getJSON('http://ws.spotify.com/lookup/1/.json?extras=trackdetail&uri=' + value.album.href, function(albumData) {
						$.each(albumData.album.tracks, function(idx, val) {
							spotify.build_song(val, idx, function(song) {
								results.push(song);
							});
						});
						deferred.resolve();
					});
					deferredArray.push(deferred);
				});
				$.when.apply($, deferredArray).then(function() {
					if(results.length === 0) {
						callback(spotify.name);
					} else {
						callback(results, spotify.name);
					}
				});
			});
		}).error(function(data) {callback(spotify.name);});
	},
	build_song: function(service_song, song_index, callback) {
		ret = {
			key: service_song.artists[0].name + "_" + service_song.name,
			services: [spotify],
			service_id: service_song.href,
			name: service_song.name,
			artist: {
				name: service_song.artists[0].name,
				service_id: service_song.artists[0].href
			}, embed: {
				service: spotify,
				key: service_song
			}, score: spotify.compute_score(service_song.popularity, song_index)
		};
		callback(ret);
	},
	search_embed: function(embed, callback) {
		resp = {
			service_name: spotify.name,
			service_id: embed.key.href,
			title: embed.key.name,
			code: '<iframe src="https://embed.spotify.com/?uri=' + embed.key.href + '" width="300" height="300" frameborder="0" allowtransparency="true"></iframe>'
		};
		callback(resp);
	},
	compute_score: function(song_popularity, song_index) {
		/*if(global_configuration.use_normalized_scores) {
			return Math.floor(((spotify.search_results_count - artist_index) + (spotify.search_results_count - song_index)) / 2) * spotify.weight;
		} else {*/
			return 10 * (song_popularity) * spotify.weight;
		/*}*/
	},
	get_similar_artists: function(song, callback) {
		//TODO
		callback(spotify.name);
	}
};

available_services[spotify.name] = spotify;