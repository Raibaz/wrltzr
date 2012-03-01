$.getScript('api.js', function() {
	console.log('finished loading api.js');
	//populate_available_services();
});

function add_service(service) {
	$('#available_services').append('<label for"' + service.name + '">' + service.name + '</label><input type="checkbox" name="' + service.name + '" id="' + service.name + '"/>');
}

var available_songs = {};
var played_songs = [];
var current_song;
var next_song;
var player_playing = false;

function populate_available_services() {
	$.each(available_services, function(index, value) {
		$('#available_services').append('<label for"' + value.name + '">' + value.name + '</label><input type="checkbox" name="' + value.name + '" id="' + value.name + '"/>');
	});
}

function compute_next_song() {
	found = undefined;
	$.each(available_songs, function(index, value) {
		if(!found || found.score < value.score) {
			found = value;
		}
	});
	console.log("Computed next song");
	next_song = found;
	console.log(next_song);
	$('#next_song_info').html(next_song.artist.name + " - " + next_song.name);
}

function play_next_song() {
	console.log("play_next_song");
	current_song = next_song;
	next_song = undefined;
	delete available_songs[current_song.key];
	played_songs[current_song.key] = current_song;
	if(current_song.embed && current_song.embed.code) {
		console.log("found embed, using it");
		$('#player').html(current_song.embed.code);
		$('#song_info').html(current_song.artist.name + " - " +current_song.name).show();
		start_youtube_player();
	} else {
		console.log("embed not found, looking for it with key = " + current_song.embed.key);
		current_song.embed.service.search_embed(current_song.embed, function(embed) {			
			if(!embed) {
				delete available_songs[current_song.embed.key];
				compute_next_song();
				play_next_song();
			} else {
				console.log("Loaded embed: " + embed.service_id);
				current_song.embed.code = embed.code;
				$('#player').html(embed.code);
				$('#song_info').html(current_song.artist.name + " - " +current_song.name).show();
				if(embed.service_name === get_service('youtube').name) {								
					start_youtube_player();						
				} else if(embed.service_name === get_service('Soundcloud').name) {
					SC.whenStreamingReady(function() {
						var soundObj = SC.stream(current_song.embed.service_id);
						soundObj.play();
						soundObj.onfinish(function() {
							play_next_song();
						});
					});
				}				
			}
		});
	} 
	add_similar_songs();
	compute_next_song();
}

function add_similar_songs() {
	current_song.service.get_song_tags(current_song, function(tags) {
		console.log("Found tags " + tags);
		if(!tags) {
			return;
		}
		$.each(tags, function(index, value) {
			current_song.service.search_tags(value, add_songs);
		});
	});
}

function add_songs(songs) {
	$.each(results, function(index, value) {
		if(available_songs[value.key]) {
			console.log("Found song " + value.key + ", adding " + value.score + " to its score");
			available_songs[value.key].score += value.score;
			//TODO if there is a better embed, replace it it
		} else {
			available_songs[value.key] = value;
		}

		if(played_songs[value.key]) {
			console.log("Found song " + value.name + " already played, killing its score");
			available_songs[value.key].score /= 5;
		}
		
		var li_id = value.service.name + "_" + index;
		if(value.artist && value.artist.name && value.name) {
				li = '<li class="result" id="' + li_id + '"><span class="song_info">' + value.artist.name + " - " + value.name + '</span></li>';
				$('#results').append(li);
		}
		if(value.embed) {								
			value.embed.service.search_embed(value.embed, function(embed_data) {				
				if(!embed_data) {
					delete available_songs[value.key];					
				} else {
					value.embed.code = embed_data.code;					
				}
			});
		}
	});
}

function start_youtube_player() {
	player = new YT.Player('youtube-player', {
		events: {
			'onReady': function(event) {
				event.target.playVideo();				
			}, 'onStateChange': function(event) {
				if(event.data === YT.PlayerState.ENDED) {
					play_next_song();
				}
			}
		}
	});
}

function update_all_scores(coeff) {
	current_song.service.get_song_tags(current_song, function(tags) {
		$.each(tags, function(index, value) {
			current_song.service.search_tags(value, function(songs) {
				$.each(songs, function(index, value) {					
					if(available_songs[value.key]) {
						artist_coeff = 1;
						if($('#search_type').val() === 'artist' && value.artist.name === current_song.artist.name) {
							console.log("Further bump for same artist");
							artist_coeff = 2;
						}
						console.log("Updating score for " + value.key + " by adding " + (value.score * coeff * artist_coeff));
						available_songs[value.key].score += (value.score * coeff * artist_coeff);
					}
				});
				//TODO: this should be at the end of all tags, not here at the end of every tag				
				compute_next_song();				
			})
		});
	});
}