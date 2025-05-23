# bci_api.py

from flask import Flask, jsonify
from flask_cors import CORS
from neurosdk.scanner import Scanner
from em_st_artifacts.utils import lib_settings, support_classes
from em_st_artifacts import emotional_math
from neurosdk.cmn_types import SensorFamily, SensorCommand
from time import sleep
from datetime import datetime
import threading, csv, numpy as np

app = Flask(__name__)
CORS(app)  # allow React at localhost:3000 to fetch

# Global storage for latest data
latest = {
    "timestamp": None,
    "alpha": 0.0,
    "beta":  0.0,
    "theta": 0.0
}

# Copy your compute_apen and buffers if needed...
alpha_buffer, beta_buffer, theta_buffer = [], [], []
math = None  # Will be initialized in bci_thread
scanner = None
current_sensor = None

def sensor_found(scanner, sensors):
    for index in range(len(sensors)):
        print('Sensor found: %s' % sensors[index])

def on_sensor_state_changed(sensor, state):
    print('Sensor {0} is {1}'.format(sensor.name, state))

def on_battery_changed(sensor, battery):
    print('Battery: {0}'.format(battery))

def compute_apen(U, m=2, r=None):
    # [your existing code]
    pass

def on_signal_received(sensor, data):
    global latest, alpha_buffer, beta_buffer, theta_buffer, math

    # Process the raw data first
    raw_channels = []
    for sample in data:
        left_bipolar = sample.T3 - sample.O1
        right_bipolar = sample.T4 - sample.O2
        raw_channels.append(support_classes.RawChannels(left_bipolar, right_bipolar))

    math.push_data(raw_channels)
    math.process_data_arr()

    if not math.calibration_finished():
        print("Calibration percents: {0}".format(math.get_calibration_percents()))
    else:
        mental_data = math.read_mental_data_arr()
        spectral_data = math.read_spectral_data_percents_arr()

        for mind, spec in zip(mental_data, spectral_data):
            # Update buffers
            alpha_buffer.append(spec.alpha)
            beta_buffer.append(spec.beta)
            theta_buffer.append(spec.theta)
            
            if len(alpha_buffer) > 20:
                alpha_buffer.pop(0)
                beta_buffer.pop(0)
                theta_buffer.pop(0)

            # Set latest values
            latest["timestamp"] = datetime.now().isoformat()
            latest["alpha"] = spec.alpha
            latest["beta"] = spec.beta
            latest["theta"] = spec.theta

def on_resist_received(sensor, data):
    print("O1 resist is normal: {0}. Current O1 resist {1}".format(data.O1 < 2000000, data.O1))
    print("O2 resist is normal: {0}. Current O2 resist {1}".format(data.O2 < 2000000, data.O2))
    print("T3 resist is normal: {0}. Current T3 resist {1}".format(data.T3 < 2000000, data.T3))
    print("T4 resist is normal: {0}. Current T4 resist {1}".format(data.T4 < 2000000, data.T4))

def cleanup():
    global scanner, current_sensor, math
    if current_sensor:
        try:
            current_sensor.exec_command(SensorCommand.StopSignal)
            current_sensor.disconnect()
            print("Disconnected from sensor")
        except:
            pass
        current_sensor = None
    
    if math:
        del math
        math = None
    
    if scanner:
        del scanner
        scanner = None

def bci_thread():
    global math, scanner, current_sensor
    try:
        # Initialize scanner
        scanner = Scanner([SensorFamily.LEHeadband])
        scanner.sensorsChanged = sensor_found
        scanner.start()
        print("Starting search for 25 sec...")
        sleep(25)
        scanner.stop()

        sensorsInfo = scanner.sensors()
        if not sensorsInfo:
            print("No sensors found!")
            return

        current_sensor = scanner.create_sensor(sensorsInfo[0])
        print("Connected to device:", sensorsInfo[0])

        # Set up callbacks
        current_sensor.sensorStateChanged = on_sensor_state_changed
        current_sensor.batteryChanged = on_battery_changed
        current_sensor.signalDataReceived = on_signal_received
        current_sensor.resistDataReceived = on_resist_received

        # Check resistance first
        current_sensor.exec_command(SensorCommand.StartResist)
        print("Checking resistance...")
        sleep(20)
        current_sensor.exec_command(SensorCommand.StopResist)
        print("Resistance check complete")

        # Initialize math settings
        mls = lib_settings.MathLibSetting(
            sampling_rate=250,
            process_win_freq=25,
            n_first_sec_skipped=4,
            fft_window=1000,
            bipolar_mode=True,
            squared_spectrum=True,
            channels_number=4,
            channel_for_analysis=0
        )
        ads = lib_settings.ArtifactDetectSetting(
            art_bord=110,
            allowed_percent_artpoints=70,
            raw_betap_limit=800_000,
            global_artwin_sec=4,
            num_wins_for_quality_avg=125,
            hamming_win_spectrum=True,
            hanning_win_spectrum=False,
            total_pow_border=400_000_000,
            spect_art_by_totalp=True
        )
        sads = lib_settings.ShortArtifactDetectSetting(
            ampl_art_detect_win_size=200,
            ampl_art_zerod_area=200,
            ampl_art_extremum_border=25
        )
        mss = lib_settings.MentalAndSpectralSetting(
            n_sec_for_averaging=2,
            n_sec_for_instant_estimation=4
        )

        # Initialize EmotionalMath with the settings
        math = emotional_math.EmotionalMath(mls, ads, sads, mss)
        math.set_calibration_length(6)
        math.set_mental_estimation_mode(False)
        math.set_skip_wins_after_artifact(10)
        math.set_zero_spect_waves(True, 0, 1, 1, 1, 0)
        math.set_spect_normalization_by_bands_width(True)

        if current_sensor.is_supported_command(SensorCommand.StartSignal):
            current_sensor.exec_command(SensorCommand.StartSignal)
            print("Started signal acquisition")
            math.start_calibration()
            
            # Stream until interrupted
            while True:
                sleep(0.1)

    except Exception as err:
        print("Error in BCI thread:", err)
        cleanup()

# Register cleanup on program exit
import atexit
atexit.register(cleanup)

# Start that thread on import
threading.Thread(target=bci_thread, daemon=True).start()

@app.route("/api/data")
def get_data():
    # Return the latest readings JSON
    return jsonify(latest)

if __name__ == "__main__":
    try:
        app.run(debug=False, port=5000)
    except KeyboardInterrupt:
        cleanup()