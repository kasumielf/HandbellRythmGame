var rate = 100;
var dropTime = 3000;
var intervalId = 0;
var elapsed = 0;
var paused = false;
var notes = [];
var onloaded = function (notes) { }

function onChangeMusicFile(files) {
    if(files.length === 0) {
        alert("파일을 선택하지 않았습니다.");
        return;
    }

    const file = files[0];
    const audio = document.getElementById('audio');
    audio.src = URL.createObjectURL(file);
    alert("음악 파일을 불러왔습니다.");
}

function onChangeNoteFile(files) {
    if(files.length === 0) {
        alert("파일을 선택하지 않았습니다.");
        return;
    }

    const file = files[0];
    const reader = new FileReader();
    reader.onload = function(e) {
        console.log(e);
        const contents = e.target.result;
        try {
            const json = JSON.parse(contents);

            if(json.notes === undefined || !Array.isArray(json.notes)) {
                alert("올바른 파일이 아닙니다.");
                return;
            }

            notes = json.notes;
            var t = 0;
            var duration = 0;
            var bpm = 90;

            for (var i = 0; i < notes.length; i++) {
                if (notes[i].beat !== undefined) {
                    t += notes[i].beat;
                    notes[i].time = ((60 / bpm) * notes[i].beat) * 1000;
                    duration += notes[i].time;
                }

                if (notes[i].code !== undefined) {
                    notes[i].codes = notes[i].code.split('');
                }
            }
            console.log("Total beats: " + t);
            console.log("Total duration: " + duration + " milliseconds");

            onloaded(notes);
            alert("파일을 불러왔습니다.");
        } catch (err) {
            alert("Error parsing JSON: " + err.message);
        }
    };
    reader.readAsText(file);
}

async function onStartButtonClick(e) {
    var bells = {
        'c': document.querySelector('.bell[aria-label="c"]'),
        'd': document.querySelector('.bell[aria-label="d"]'),
        'e': document.querySelector('.bell[aria-label="e"]'),
        'f': document.querySelector('.bell[aria-label="f"]'),
        'g': document.querySelector('.bell[aria-label="g"]'),
        'a': document.querySelector('.bell[aria-label="a"]'),
        'b': document.querySelector('.bell[aria-label="b"]'),
        'w': document.querySelector('.bell[aria-label="w"]'),
    }

    paused = false;
    const audio = document.getElementById('audio');
    audio.currentTime = 1.0;
    audio.play();

    for(const n of notes) {
        if (n.time === undefined) continue;
        await new Promise(async (resolve) => {
            if(n.code !== 'rest') {
                for (const c of n.codes) {
                    const bell = bells[c];
                    if (bell) {
                        const clone = bell.cloneNode(true);
                        const rect = bell.getBoundingClientRect();
                        clone.style.position = 'fixed';
                        clone.style.top = '0px';
                        clone.style.left = rect.left + 'px';
                        clone.style.width = rect.width + 'px';
                        clone.style.height = rect.height + 'px';
                        clone.style.zIndex = '9999';
                        clone.style.pointerEvents = 'none';
                        document.body.appendChild(clone);

                        let startTime = null;
                        function fall(ts) {
                            if (paused) {
                                requestAnimationFrame(fall);
                                return;
                            }
                            if (!startTime) startTime = ts;
                            const elapsedMs = ts - startTime;
                            if (elapsedMs >= dropTime) {
                                clone.remove();
                                return;
                            }
                            const progress = elapsedMs / dropTime;
                            const endY = window.innerHeight - clone.offsetHeight;
                            clone.style.top = (endY * progress) + 'px';
                            requestAnimationFrame(fall);
                        }
                        requestAnimationFrame(fall);
                    }
                }
            }

            setTimeout(resolve, n.time);
        });
    }
}

function onPauseButtonClick(e) {
    paused = true;
}

function onStopButtonClick(e) {
    clearInterval(intervalId);
    elapsed = 0;
}