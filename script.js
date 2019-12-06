// Inspired by https://codepen.io/jackrugile/pen/RRPeWe
var canvas, ctx, width, height, mx, my, eyes, eyeClosed;
var detections

function Eye(args) {
    this.x = args.x;
    this.y = args.y;
    this.radius = args.radius;
    this.pupilX = this.x;
    this.pupilY = this.y;
    this.pupilRadius = this.radius / 2;
    this.angle = 0;
    this.magnitude = 0;
    this.magnitudeMax = this.radius - this.pupilRadius;
};

Eye.prototype.draw = function () {
    // draw eyes
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, 2 * Math.PI);
    ctx.fillStyle = 'white';
    ctx.fill();
    ctx.lineWidth = 5;
    ctx.strokeStyle = 'black';
    ctx.stroke();
    if (eyeClosed) {
        // console.log("Eye closed");
        ctx.beginPath();
        ctx.fillStyle = "white";
        ctx.moveTo(width * 0.35 - 70, height * 0.4);
        ctx.lineTo(width * 0.35 + 70, height * 0.4);
        ctx.moveTo(width * 0.65 - 70, height * 0.4);
        ctx.lineTo(width * 0.65 + 70, height * 0.4);
        ctx.stroke();
    } else {
        // calculate distance and moving distance cannot be
        // larger than max distance(eye radius - pupil radius)
        var dx = mx - this.x,
            dy = my - this.y,
            dist = Math.sqrt(dx * dx + dy * dy);
        this.angle = Math.atan2(dy, dx);
        this.magnitude = Math.min(Math.abs(dist), this.magnitudeMax)
        this.pupilX += ((this.x + Math.cos(this.angle) * this.magnitude) - this.pupilX) * 0.1;
        this.pupilY += ((this.y + Math.sin(this.angle) * this.magnitude) - this.pupilY) * 0.1;
        // draw pupils
        ctx.beginPath();
        ctx.arc(this.pupilX, this.pupilY, this.pupilRadius, 0, 2 * Math.PI);
        ctx.fillStyle = 'black';
        ctx.fill();
    }
};

function mousemove(e) {
    mx = e.pageX;
    my = e.pageY;
};

function draw() {
    // clear canvas everytime
    ctx.clearRect(0, 0, width, height);
    // draw two eyes
    eyes[0].draw();
    eyes[1].draw();
    // draw mouth
    ctx.beginPath();
    if (detections && detections[0]) {
        ctx.arc(width / 2, height * 0.65, 150, 0, Math.PI);
        ctx.fillStyle = 'white';
        ctx.fill();
        ctx.strokeStyle = 'black';
        ctx.stroke();
    } else {
        ctx.moveTo(width / 2 + 80, height * 0.7);
        ctx.lineTo(width / 2 - 80, height * 0.7);
        ctx.stroke();
    }
};

function loop() {
    requestAnimationFrame(loop);
    draw();
};

function run() {
    canvas = document.getElementById('faceCanvas');
    ctx = canvas.getContext('2d');
    eyes = [];
    width = innerWidth;
    height = innerHeight - 400;
    canvas.width = width;
    canvas.height = height;
    mx = width / 2;
    my = height / 2;
    eyes.push(new Eye({
        x: width * 0.35,
        y: height * 0.4,
        radius: 70
    }));
    eyes.push(new Eye({
        x: width * 0.65,
        y: height * 0.4,
        radius: 70
    }));
    loop();
};

function blink() {
    // close eyes
    setInterval(function () {
        if (!eyeClosed) {
            eyeClosed = !eyeClosed;
        };
    }, Math.random() * 6000 + 500)
    // open eyes
    setInterval(function () {
        eyeClosed = false;
    }, 500);
};

addEventListener('mousemove', mousemove);
run();
blink();


const loader = document.querySelector(".loading");
const status = document.querySelector("#status");
const statusCode = document.querySelector("#statusCode");
const statusBox = document.querySelector("#statusBox");
const avatarLamp = document.querySelector(".avatar-lamp");
const stopStreaming = document.querySelector("#stopStreaming");
const videoCanvas = document.getElementById("mainCanvas");
const videoCtx = videoCanvas.getContext("2d");

statusCode.innerHTML = "loading module...";
statusBox.classList.add("progress-animation");

Promise.all([
    faceapi.nets.tinyFaceDetector.loadFromUri("./models"),
    faceapi.nets.faceRecognitionNet.loadFromUri("./models"),
    faceapi.nets.faceExpressionNet.loadFromUri("./models"),
]).then(startVideo);
/* This function checks and sets up the camera */
function startVideo() {
    if (navigator.mediaDevices &&
        navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices.getUserMedia({ video: true })
            .then(handleUserMediaSuccess)
            .catch(handleUserMediaError);
    }
    statusCode.innerHTML = "starting video session...";
    statusBox.style.width = "34%";
    speakText("Loading cameras, one moment please!")
}
/* This function stop the camera */
function stopVideo() {
    var video = document.getElementById("myVideo");
    video.srcObject.getTracks().forEach(function (track) {
        track.stop();
    });
}

function handleUserMediaError(error) {
    console.log(error);
}

function handleUserMediaSuccess(stream) {
    var video = document.getElementById("myVideo");
    video.srcObject = stream;
    video.play();
    console.log("Handle User Media Success");
    //   window.setInterval(captureImageFromVideo, 200);
}

function stopStreamedVideo(videoElem) {
    let stream = videoElem.srcObject;
    let tracks = stream.getTracks();
    // console.log(stream,tracks)
    tracks.forEach(function (track) {
        track.stop();
    });
    videoElem.srcObject = null;
}

var video = document.getElementById("myVideo");
var count = 0;
var no_detection = 0;
var recognizing = false;
video.addEventListener("play", () => {
    setTimeout(() => {
        statusCode.innerHTML = "just a moment please..";
        statusBox.style.width = "80%";
    }, 1000);

    setInterval(async () => {
        videoCtx.drawImage(video, 0, 0, video.width, video.height);
        detections = await faceapi
            .detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
            .withFaceExpressions();
        const displaySize = { width: video.width, height: video.height };
        const resizedDetections = faceapi.resizeResults(detections, displaySize);
        faceapi.draw.drawDetections(videoCanvas, resizedDetections);
        // faceapi.draw.drawFaceExpressions(videoCanvas, resizedDetections);
        var lastCode = statusCode.innerHTML;
        if (detections[0]) {
            if (count == 0) {
                console.log("face detected")
                statusBox.style.width = "100%";
                statusBox.classList.remove("progress-animation");
                statusCode.innerHTML = "Hold for 3 seconds";
                loader.style.display = "none"; // hide preloader
                avatarLamp.style.backgroundColor = "lightgreen";
            }
            //   console.log(detections[0].expressions)
            // only call startExercise if count reaches 5
            else if (count >= 5) {
                // console.log(recognition)
                if (!recognizing) {
                    recognition.start();
                }
                startExercise(count - 5);
            }
            no_detection = 0;
            count += 1;
        } else if (no_detection < 2) {
            no_detection += 1;
        } else {
            count = 0;
            statusCode.innerHTML = "can't see you!..";
            avatarLamp.style.backgroundColor = "#ccc";
            recognition.stop();
            console.log("Recognition stopped since there is no detection");
        }
        if (statusCode.innerHTML != lastCode) {
            speakText(statusCode.innerHTML);
        }
        console.log(count);
    }, 1000);
});


var exercises = ["Squat", "Warrior One Pose", "Knee Lift", "Crunch"];
var shuffledExercises = shuffle(exercises)
function startExercise(time) {
    if (time % 30 == 0) {
        var index = Math.floor(time / 30) % exercises.length;
        statusCode.innerHTML = shuffledExercises[index]
    }
}

function shuffle(array) {
    var currentIndex = array.length, temporaryValue, randomIndex;
    // While there remain elements to shuffle...
    while (0 !== currentIndex) {
      // Pick a remaining element...
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex -= 1;
      // And swap it with the current element.
      temporaryValue = array[currentIndex];
      array[currentIndex] = array[randomIndex];
      array[randomIndex] = temporaryValue;
    }
    return array;
}

var grammar =
  "#JSGF V1.0; grammar emar; public <greeting> = hello | hi; <person> = maya | alisa;";
var recognition = new window.webkitSpeechRecognition();
var speechRecognitionList = new window.webkitSpeechGrammarList();
speechRecognitionList.addFromString(grammar, 1);
recognition.grammars = speechRecognitionList;
recognition.continuous = true;
recognition.lang = "en-US";
recognition.interimResults = false;
recognition.maxAlternatives = 1;

function speakText(text) {
  var speech = new SpeechSynthesisUtterance();
  speech.rate = 1;
  speech.pitch = 0.5;
  speech.text = text
  window.speechSynthesis.speak(speech);
};

recognition.onresult = processSpeech;

function processSpeech(event) {
    var inputSpeech = event.results[0][0].transcript;
    var textDiv = document.getElementById("speech");
    console.log("I see, " + inputSpeech);
    if (inputSpeech == "next move") {
        count += 35 - count % 30;
    }
    recognition.stop();
}

recognition.onstart = recognitionStarted;
recognition.onend = recognitionEnded;


function recognitionStarted() {
    console.log("onstart happened");
    recognizing = true;

}
function recognitionEnded() {
    console.log("onend happened");
    recognizing = false;
}