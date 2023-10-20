
// Cache references to DOM elements.
let elms = ['track', 'timer', 'duration', 'playBtn', 'pauseBtn', 'prevBtn', 'nextBtn', 'playlistBtn', 'volumeBtn', 'progress', 'progressBar', 'loading', 'playlist', 'list', 'volume', 'barEmpty', 'barFull', 'sliderBtn'];
elms.forEach(function(elm) {
  window[elm] = document.getElementById(elm);
});


/**
 * Player class containing the state of our playlist and where we are in it.
 * Includes all methods for playing, skipping, updating the display, etc.
 * @param {Array} playlist Array of objects with playlist song details ({title, file, howl}).
 */
let Player = function(playlist) {
  this.playlist = playlist;
  this.index = playNum;

  // Display the title of the first track.
  track.innerHTML =  playlist[this.index].title;
  document.querySelector("body").style.backgroundImage = "url(" +media+ encodeURI(playlist[this.index].pic) + ")";

  // Setup the playlist display.

  playlist.forEach(function(song) {
    let div = document.createElement('div');
    div.className = 'list-song';
    div.id = 'list-song-'+playlist.indexOf(song);
    div.innerHTML = song.title;
    div.onclick = function() {
      player.skipTo(playlist.indexOf(song));
    };
    list.appendChild(div);
  });
};
Player.prototype = {
  /**
   * Play a song in the playlist.
   * @param  {Number} index Index of the song in the playlist (leave empty to play the first or current).
   */
  play: function(index) {
    let self = this;
    let sound;

    index = typeof index === 'number' ? index : self.index;
    let data = self.playlist[index];

    // If we already loaded this track, use the current one.
    // Otherwise, setup and load a new Howl.
    if (data.howl) {
      sound = data.howl;
    } else {
      sound = data.howl = new Howl({
        src: [media + data.mp3],
        // html5: true, // Force to HTML5 so that the audio can stream in (best for large files).
        onplay: function() {
          // Display the duration.
          duration.innerHTML = self.formatTime(Math.round(sound.duration()));

          // Start updating the progress of the track.
          requestAnimationFrame(self.step.bind(self));

          // Start the wave animation if we have already loaded
          // wave.container.style.display = 'block';
          // bar.style.display = 'none';
          progressBar.style.display = 'block';
          pauseBtn.style.display = 'block';
        },
        onload: function() {
          // Start the wave animation.
          // wave.container.style.display = 'block';
          // bar.style.display = 'none';
          progressBar.style.display = 'block';
          loading.style.display = 'none';
        },
        onend: function() {
          // Stop the wave animation.
          // wave.container.style.display = 'none';
          // bar.style.display = 'block';
          self.skip('next');
        },
        onpause: function() {
          // Stop the wave animation.
          // wave.container.style.display = 'none';
          // bar.style.display = 'block';
          progressBar.style.display = 'none';
        },
        onstop: function() {
          // Stop the wave animation.
          // wave.container.style.display = 'none';
          // bar.style.display = 'block';
          progressBar.style.display = 'none';
        },
        onseek: function() {
          // Start updating the progress of the track.
          requestAnimationFrame(self.step.bind(self));
        }
      });
    }

    // Begin playing the sound.
    sound.play();

    // Update the track display.
    // track.innerHTML = (index + 1) + '. ' + data.title;
    track.innerHTML = data.title;
    document.title=data.title + " - Gmemp";//显示浏览器TAB栏内容
    document.querySelector("body").style.backgroundImage = "url(" +media+ encodeURI(data.pic) + ")";
    window.location.hash="#"+(index);

    document.querySelector('#list-song-'+playNum).style.backgroundColor='';//清除上一首选中
    document.querySelector('#list-song-'+index).style.backgroundColor='rgba(255, 255, 255, 0.1)';//高亮当前播放
    playNum=index;

    this.analyser=Howler.ctx.createAnalyser();
    this.analyser.fftSize = 256;
    this.bufferLength = this.analyser.frequencyBinCount;
    this.dataArray = new Uint8Array(this.bufferLength);
    Howler.masterGain.connect(this.analyser);
    draw();

    //之后通过如下指令就可获取
    // player.analyser.getByteFrequencyData(player.dataArray);
    // player.analyser.getByteTimeDomainData(player.dataArray);

    // Show the pause button.
    if (sound.state() === 'loaded') {
      playBtn.style.display = 'none';
      pauseBtn.style.display = 'block';
    } else {
      loading.style.display = 'block';
      playBtn.style.display = 'none';
      pauseBtn.style.display = 'none';
    }

    // Keep track of the index we are currently playing.
    self.index = index;
  },

  /**
   * Pause the currently playing track.
   */
  pause: function() {
    let self = this;

    // Get the Howl we want to manipulate.
    let sound = self.playlist[self.index].howl;

    // Puase the sound.
    sound.pause();

    // Show the play button.
    playBtn.style.display = 'block';
    pauseBtn.style.display = 'none';
  },

  /**
   * Skip to the next or previous track.
   * @param  {String} direction 'next' or 'prev'.
   */
  skip: function(direction) {
    let self = this;

    // Get the next track based on the direction of the track.
    let index = 0;
    if (direction === 'next') {
      index = self.index - 1;
      if (index < 0) {
        index = self.playlist.length - 1;
      }
    } else {
      index = self.index + 1;
      if (index >= self.playlist.length) {
        index = 0;
      }
    }

    self.skipTo(index);
  },

  /**
   * Skip to a specific track based on its playlist index.
   * @param  {Number} index Index in the playlist.
   */
  skipTo: function(index) {
    let self = this;

    // Stop the current track.
    if (self.playlist[self.index].howl) {
      self.playlist[self.index].howl.stop();
    }

    // Reset progress.
    progress.style.width = '0%';

    // Play the new track.
    self.play(index);
  },

  /**
   * Set the volume and update the volume slider display.
   * @param  {Number} val Volume between 0 and 1.
   */
  volume: function(val) {
    let self = this;

    // Update the global volume (affecting all Howls).
    Howler.volume(val);

    // Update the display on the slider.
    let barWidth = (val * 90) / 100;
    barFull.style.width = (barWidth * 100) + '%';
    sliderBtn.style.left = (window.innerWidth * barWidth + window.innerWidth * 0.05 - 25) + 'px';
  },

  /**
   * Seek to a new position in the currently playing track.
   * @param  {Number} per Percentage through the song to skip.
   */
  seek: function(per) {
    let self = this;

    // Get the Howl we want to manipulate.
    let sound = self.playlist[self.index].howl;

    // Convert the percent into a seek position.
    if (sound.playing()) {
      sound.seek(sound.duration() * per);
    }
  },

  /**
   * The step called within requestAnimationFrame to update the playback position.
   */
  step: function() {
    let self = this;

    // Get the Howl we want to manipulate.
    let sound = self.playlist[self.index].howl;

    // Determine our current seek position.
    let seek = sound.seek() || 0;
    timer.innerHTML = self.formatTime(Math.round(seek));
    progress.style.width = (((seek / sound.duration()) * 100) || 0) + '%';

    // If the sound is still playing, continue stepping.
    if (sound.playing()) {
      requestAnimationFrame(self.step.bind(self));
    }
  },

  /**
   * Toggle the playlist display on/off.
   */
  togglePlaylist: function() {
    let self = this;
    let display = (playlist.style.display === 'block') ? 'none' : 'block';

    setTimeout(function() {
      playlist.style.display = display;
      if (playlist.style.display=='block'){ //滚动到当前播放歌曲
        let [parentDoc,childDoc]= [list,document.querySelector('#list-song-'+playNum)];
        parentDoc.scrollTop = childDoc.offsetTop - parentDoc.offsetHeight /2 ;
      }

    }, (display === 'block') ? 0 : 500);
    playlist.className = (display === 'block') ? 'fadein' : 'fadeout';
  },

  /**
   * Toggle the volume display on/off.
   */
  toggleVolume: function() {
    let self = this;
    let display = (volume.style.display === 'block') ? 'none' : 'block';

    setTimeout(function() {
      volume.style.display = display;
    }, (display === 'block') ? 0 : 500);
    volume.className = (display === 'block') ? 'fadein' : 'fadeout';
  },

  /**
   * Format the time from seconds to M:SS.
   * @param  {Number} secs Seconds to format.
   * @return {String}      Formatted time.
   */
  formatTime: function(secs) {
    let minutes = Math.floor(secs / 60) || 0;
    let seconds = (secs - minutes * 60) || 0;

    return minutes + ':' + (seconds < 10 ? '0' : '') + seconds;
  }
};

let player;
let playNum=0;
let media="https://cdn.jsdelivr.net/gh/Meekdai/Gmemp@main/media/"
// let requestJson="https://cdn.jsdelivr.net/gh/Meekdai/Gmemp@main/memp.json"
let requestJson="https://music.meekdai.com/memp.json"

let request=new XMLHttpRequest();
request.open("GET",requestJson);
request.responseType='text';
request.send();
request.onload=function(){
    jsonData=JSON.parse(request.response);
    console.log(jsonData);

    if(window.location.hash!=''){
      try{
          playNum=parseInt(window.location.hash.slice(1));
      }
      catch{
          playNum=jsonData.length-1 //默认最近添加的
      }
  }
  else{playNum=jsonData.length-1} //默认最近添加的

    player = new Player(jsonData);
}

// Bind our player controls.
playBtn.addEventListener('click', function() {
  player.play();
});
pauseBtn.addEventListener('click', function() {
  player.pause();
});
prevBtn.addEventListener('click', function() {
  player.skip('prev');
});
nextBtn.addEventListener('click', function() {
  player.skip('next');
});
progressBar.addEventListener('click', function(event) {
  player.seek(event.clientX / window.innerWidth);
});
playlistBtn.addEventListener('click', function() {
  player.togglePlaylist();
});
playlist.addEventListener('click', function() {
  player.togglePlaylist();
});
volumeBtn.addEventListener('click', function() {
  player.toggleVolume();
});
volume.addEventListener('click', function() {
  player.toggleVolume();
});

// Setup the event listeners to enable dragging of volume slider.
barEmpty.addEventListener('click', function(event) {
  let per = event.layerX / parseFloat(barEmpty.scrollWidth);
  player.volume(per);
});
sliderBtn.addEventListener('mousedown', function() {
  window.sliderDown = true;
});
sliderBtn.addEventListener('touchstart', function() {
  window.sliderDown = true;
});
volume.addEventListener('mouseup', function() {
  window.sliderDown = false;
});
volume.addEventListener('touchend', function() {
  window.sliderDown = false;
});

let move = function(event) {
  if (window.sliderDown) {
    let x = event.clientX || event.touches[0].clientX;
    let startX = window.innerWidth * 0.05;
    let layerX = x - startX;
    let per = Math.min(1, Math.max(0, layerX / parseFloat(barEmpty.scrollWidth)));
    player.volume(per);
  }
};

volume.addEventListener('mousemove', move);
volume.addEventListener('touchmove', move);

// Setup the "waveform" animation.
// let wave = new SiriWave({
//   container: waveform,
//   width: window.innerWidth,
//   height: window.innerHeight * 0.3,
//   cover: true,
//   speed: 0.03,
//   amplitude: 0.7,
//   frequency: 2
// });
// wave.start();

// Update the height of the wave animation.
// These are basically some hacks to get SiriWave.js to do what we want.
let resize = function() {
  // let height = window.innerHeight * 0.3;
  // let width = window.innerWidth;
  // wave.height = height;
  // wave.height_2 = height / 2;
  // wave.MAX = wave.height_2 - 4;
  // wave.width = width;
  // wave.width_2 = width / 2;
  // wave.width_4 = width / 4;
  // wave.canvas.height = height;
  // wave.canvas.width = width;
  // wave.container.style.margin = -(height / 2) + 'px auto';

  // Update the position of the slider.
  // let sound = player.playlist[player.index].howl;
  let sound = null;
  if (sound) {
    let vol = sound.volume();
    let barWidth = (vol * 0.9);
    sliderBtn.style.left = (window.innerWidth * barWidth + window.innerWidth * 0.05 - 25) + 'px';
  }
};
window.addEventListener('resize', resize);
resize();



let c=document.getElementById("waveCanvas");
let canvasCtx=c.getContext("2d");

function draw() {
  let HEIGHT = window.innerHeight;
  let WIDTH = window.innerWidth;
  c.setAttribute('width', WIDTH);
  c.setAttribute('height', HEIGHT);

  canvasCtx.clearRect(0, 0, WIDTH, HEIGHT);
  drawVisual = requestAnimationFrame(draw);

  player.analyser.getByteFrequencyData(player.dataArray);

  canvasCtx.fillStyle = "rgba(0,0,0,0)";
  canvasCtx.fillRect(0, 0, WIDTH, HEIGHT);

  const barWidth = (WIDTH / player.bufferLength);
  let barHeight;
  let x = 0;

  for (let i = 0; i < player.bufferLength; i++) {
    barHeight = player.dataArray[i];

    // canvasCtx.fillStyle = `rgb(${barHeight + 100}, 50, 50)`;
    canvasCtx.fillStyle = 'rgba(0,0,0,0.5)';
    canvasCtx.fillRect(x, HEIGHT - barHeight / 2, barWidth, barHeight/2);

    x += barWidth + 1;
  }
}


// Create an analyser node in the Howler WebAudio context
// let analyser = Howler.ctx.createAnalyser();
// Connect the masterGain -> analyser (disconnecting masterGain -> destination)
// Howler.masterGain.connect(analyser);

// Howler.masterGain.disconnect();
// level = Howler.ctx.createGain();
// Howler.masterGain.connect(level);
// level.gain.setValueAtTime(levelValue, Howler.ctx.currentTime);
// level.connect(Howler.ctx.destination);

