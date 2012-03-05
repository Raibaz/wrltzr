$.getScript('api.js', function() {
	console.log('finished loading api.js');	
});

function add_service(service) {
	if(service.search_tags || service.search_artist) {
		$('#available_services').append('<span class="service"><label for"' + service.name + '">' + service.name + '</label><input type="checkbox" name="' + service.name + '" id="' + service.name + '"/><div id="' + service.name + '_slider" class="service-weight-slider"/></span>');		
		console.log("Service " + service.name + " has default weight " + service.weight);
		$('#' + service.name + "_slider").slider({
			orientation: "vertical",
			min: 0.1,
			max: 5,
			step: 0.1,
			value: service.weight,
			slide: function(event, ui) {								
				this_id = $(this).attr('id');
				this_id = this_id.replace('_slider', '');

				checkbox = $('#' + this_id);
				console.log(checkbox);
				if(!checkbox.prop('checked')) {
					checkbox.prop('checked', true);
				}
				
				console.log("Setting " + this_id + " weight to " + ui.value);
				service = get_service(this_id);				
				recompute_scores(service, ui.value);
			}
		});
	}
}

var available_songs = {};
var played_songs = [];
var current_song;
var next_song;
var player_playing = false;

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
	if(next_song) {
		$('#next_song_info').html(next_song.artist.name + " - " + next_song.name);
	}
}

function play_next_song() {
	console.log("play_next_song");
	current_song = next_song;
	next_song = undefined;
	delete available_songs[current_song.key];
	played_songs[current_song.key] = current_song;

	//Stop any Soundcloud players
	pause_link = $('.playing a.sc-pause');
	if(pause_link) {
		pause_link.click(); 
	}

	if(current_song.embed && current_song.embed.code) {			
		$('#player').html(current_song.embed.code);
		$('#song_info').html(current_song.artist.name + " - " +current_song.name).show();
		if(current_song.embed.service.name == get_service('youtube').name) {								
			start_youtube_player();						
		} else if(current_song.embed.service.name == get_service('Soundcloud').name) {
			console.log("starting soundcloud");
			start_soundcloud_player(current_song.embed);
		}
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
				if(embed.service_name == get_service('youtube').name) {								
					start_youtube_player();						
				} else if(embed.service_name == get_service('Soundcloud').name) {					
					start_soundcloud_player(embed);
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

function start_soundcloud_player(embed) {
	if(!embed) {
		embed = current_song.embed;
	}	
	$('#player .sc-player').scPlayer({
		links: [{url: embed.key, title: embed.title}],
		autoPlay: true,
		apiKey: sound_cloud.client_id,
		onPlayerTrackFinish: function() {
			play_next_song();
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

function recompute_scores(service, new_weight) {
	for(cur in available_songs) {
		if(!available_songs.hasOwnProperty(cur))  {
			continue;
		}
		loop_song = available_songs[cur];
		if(loop_song.service && loop_song.service.name == service.name) {
			console.log("Updating score for " + cur + " from " + loop_song.score + " to " + ((loop_song.score / loop_song.service.weight) * new_weight));
			loop_song.score = (loop_song.score / loop_song.service.weight) * new_weight;
		}
	}
	service.weight = new_weight;
	if(available_songs)
	compute_next_song();
}