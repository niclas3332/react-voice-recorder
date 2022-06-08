import React, { Component } from "react";
import styles from "../styles.module.css";
const audioType = "audio/*";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMicrophone, faSave, faTrashCan } from "@fortawesome/free-solid-svg-icons";
import "./styles.css";

class Recorder extends Component {
  constructor(props) {
    super(props);
    this.state = {
      time: {},
      miliseconds: 0,
      recording: false,
      medianotFound: false,
      audios: [],
      audioBlob: null,
      stream: null
    };
    this.timer = 0;
    this.startTimer = this.startTimer.bind(this);
    this.countDown = this.countDown.bind(this);
  }

  handleAudioPause(e) {
    e.preventDefault();
    clearInterval(this.timer);
    this.mediaRecorder.pause();
    this.setState({ pauseRecord: true });
  }

  handleAudioStart(e) {
    e.preventDefault();
    this.startTimer();
    this.mediaRecorder.resume();
    this.setState({ pauseRecord: false });
  }

  startTimer() {
    // if (this.timer === 0 && this.state.seconds > 0) {
    this.timer = setInterval(this.countDown, 100);
    // }
  }

  countDown() {
    // Remove one second, set state so a re-render happens.

    this.setState(prevState => {
      const miliseconds = prevState.miliseconds + 100;
      return ({ time: this.milisecondsToTime(miliseconds), miliseconds: miliseconds });
    });

    this.props.handleCountDown(this.state.time);
  }

  milisecondsToTime(milisecs) {

    let secs = milisecs / 1000;
    let hours = Math.floor(secs / (60 * 60));

    let divisor_for_minutes = secs % (60 * 60);
    let minutes = Math.floor(divisor_for_minutes / 60);

    let divisor_for_seconds = divisor_for_minutes % 60;
    let seconds = Math.ceil(divisor_for_seconds);


    let obj = {
      h: hours,
      m: minutes,
      s: seconds,
      ms: milisecs
    };
    return obj;
  }

  async initRecorder() {
    navigator.getUserMedia =
      navigator.getUserMedia ||
      navigator.webkitGetUserMedia ||
      navigator.mozGetUserMedia ||
      navigator.msGetUserMedia;
    if (navigator.mediaDevices) {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (this.props.mimeTypeToUseWhenRecording) {
        this.mediaRecorder = new MediaRecorder(stream, { mimeType: this.props.mimeTypeToUseWhenRecording });
      } else {
        this.mediaRecorder = new MediaRecorder(stream);
      }
      this.chunks = [];
      this.mediaRecorder.ondataavailable = e => {
        if (e.data && e.data.size > 0) {
          this.chunks.push(e.data);
        }
      };

      this.stream = stream;
    } else {
      this.setState({ medianotFound: true });
      console.log("Media Decives will work only with SSL.....");
    }
  }

  async startRecording(e) {
    e.preventDefault();
    // wipe old data chunks
    this.chunks = [];

    await this.initRecorder();
    // start recorder with 10ms buffer
    this.mediaRecorder.start(10);
    this.startTimer();
    // say that we're recording
    this.setState({ recording: true });
  }


  async stopRecording(e) {
    clearInterval(this.timer);
    this.setState({ time: {} });
    e.preventDefault();
    // stop the recorder

    if (this.stream.getAudioTracks) {
      const tracks = this.stream.getAudioTracks();
      tracks.forEach((track) => {
        track.stop();
      });
    } else {
      console.log("No Tracks Found");
    }

    this.mediaRecorder.stop();

    // say that we're not recording
    this.setState({ recording: false, pauseRecord: false });
    // save the video to memory
    this.saveAudio();
  }

  handleReset(e) {
    if (this.state.recording) {
      this.stopRecording(e);
    }
    this.setState({
      time: {},
      miliseconds: 0,
      recording: false,
      medianotFound: false,
      audios: [],
      audioBlob: null
    }, () => {

      this.props.handleReset(this.state);
    });

  }

  saveAudio() {
    // convert saved chunks to blob
    const blob = new Blob(this.chunks, { type: audioType });
    // generate video url from blob
    const audioURL = window.URL.createObjectURL(blob);
    // append videoURL to list of saved videos for rendering
    const audios = [audioURL];
    this.setState({ audios, audioBlob: blob });
    this.props.handleAudioStop({
      url: audioURL,
      blob: blob,
      chunks: this.chunks,
      duration: this.state.time
    });
    console.log("Save Audio");
  }

  render() {
    const { recording, audios, time, medianotFound, pauseRecord } = this.state;
    const { showUIAudio, title, audioURL, disableFullUI } = this.props;


    return (
      <div>
        <div>
          <div>

            {
              !medianotFound ?
                (
                  <div className={styles.record_section}>
                    <div className={styles.start_button_container}>

                    {
                      !recording ?
                        (
                          <button className={styles.start_button} title="Start recording"
                                  onClick={e => this.startRecording(e)}>
                            <FontAwesomeIcon icon={faMicrophone} />
                          </button>


                        ) :
                        (
                          <>
                            <button className={styles.start_button} title="Upload recording" onClick={async e => {
                              await this.stopRecording(e);

                              setTimeout(() => {
                                this.props.handleAudioUpload(this.state.audioBlob);

                              }, 100);



                            }}>
                              <FontAwesomeIcon icon={faSave} />
                            </button>
                            <button className={styles.cancel_button} title="Cancel recording"
                                    onClick={e => this.handleReset(e)}>
                              <FontAwesomeIcon icon={faTrashCan} />
                            </button>
                          </>
                        )
                    }
                  </div>
                  </div>
                ) :
                (
                  <p style={{ color: "#fff", marginTop: 30, fontSize: 25 }}>
                    Seems the site is Non-SSL
                  </p>
                )

            }

          </div>
        </div>
      </div>
    );
  }
}

export default Recorder;

Recorder.defaultProps = {
  hideHeader: false,
  mimeTypeToUseWhenRecording: null,
  handleCountDown: (data) => {
  }
};
