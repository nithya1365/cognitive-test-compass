from neurosdk.scanner import Scanner
from em_st_artifacts.utils import lib_settings
from em_st_artifacts.utils import support_classes
from em_st_artifacts import emotional_math
from neurosdk.cmn_types import *

from time import sleep
import csv
from datetime import datetime
import numpy as np

# Initialize global variables
csv_writer = None
output_file = None
math = None

# ApEn function
def compute_apen(U, m=2, r=None):
    U = np.array(U)
    N = len(U)
    if r is None:
        r = 0.2 * np.std(U)

    def _phi(m):
        x = np.array([U[i:i + m] for i in range(N - m + 1)])
        C = []
        for xi in x:
            dist = np.max(np.abs(x - xi), axis=1)
            C.append(np.sum(dist <=r) )
        return np.sum(np.log(C)) / (N - m + 1)

    return abs(_phi(m) - _phi(m + 1))

# Buffers to store recent spectral values
alpha_buffer, beta_buffer, theta_buffer = [], [], []


def sensor_found(scanner, sensors):
    for index in range(len(sensors)):
        print('Sensor found: %s' % sensors[index])


def on_sensor_state_changed(sensor, state):
    print('Sensor {0} is {1}'.format(sensor.name, state))


def on_battery_changed(sensor, battery):
    print('Battery: {0}'.format(battery))


def on_signal_received(sensor, data):
    global csv_writer, math, alpha_buffer, beta_buffer, theta_buffer
    raw_channels = []
    for sample in data:
        left_bipolar = sample.T3 - sample.O1
        right_bipolar = sample.T4 - sample.O2
        raw_channels.append(support_classes.RawChannels(left_bipolar, right_bipolar))

    math.push_data(raw_channels)
    math.process_data_arr()
    print("Artifacted: both sides - {0}, sequence - {1}".format(
        math.is_both_sides_artifacted(), math.is_artifacted_sequence()
    ))

    if not math.calibration_finished():
        print("Calibration percents: {0}".format(math.get_calibration_percents()))
    else:
        mental_data = math.read_mental_data_arr()
        spectral_data = math.read_spectral_data_percents_arr()

        for mind, spec in zip(mental_data, spectral_data):
            now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

            alpha_buffer.append(spec.alpha)
            beta_buffer.append(spec.beta)
            theta_buffer.append(spec.theta)

            if len(alpha_buffer) > 20:
                alpha_buffer.pop(0)
                beta_buffer.pop(0)
                theta_buffer.pop(0)

            apen_alpha = compute_apen(alpha_buffer) if len(alpha_buffer) > 10 else None
            apen_beta = compute_apen(beta_buffer) if len(beta_buffer) > 10 else None
            apen_theta = compute_apen(theta_buffer) if len(theta_buffer) > 10 else None

            # Write to CSV
            csv_writer.writerow([
                now,
                mind.rel_attention, mind.rel_relaxation,
                mind.inst_attention, mind.inst_relaxation,
                spec.delta, spec.theta, spec.alpha, spec.beta, spec.gamma,
                apen_alpha, apen_beta, apen_theta
            ])

            print("Mental data: {0}".format(mind))
            print("Spectral data: {0}".format(spec))
            print(f"ApEn - Alpha: {apen_alpha}, Beta: {apen_beta}, Theta: {apen_theta}")

            sleep(0.3)


def on_resist_received(sensor, data):
    print("O1 resist is normal: {0}. Current O1 resist {1}".format(data.O1 < 2000000, data.O1))
    print("O2 resist is normal: {0}. Current O2 resist {1}".format(data.O2 < 2000000, data.O2))
    print("T3 resist is normal: {0}. Current T3 resist {1}".format(data.T3 < 2000000, data.T3))
    print("T4 resist is normal: {0}. Current T4 resist {1}".format(data.T4 < 2000000, data.T4))

try:
    output_file = open("bci_calm.csv", mode="w", newline='')
    csv_writer = csv.writer(output_file)
    csv_writer.writerow([
        "Timestamp",
        "Rel_Attention", "Rel_Relaxation",
        "Inst_Attention", "Inst_Relaxation",
        "Delta", "Theta", "Alpha", "Beta", "Gamma",
        "ApEn_Alpha", "ApEn_Beta", "ApEn_Theta"
    ])

    scanner = Scanner([SensorFamily.LEHeadband])

    scanner.sensorsChanged = sensor_found
    scanner.start()
    print("Starting search for 25 sec...")
    sleep(25)
    scanner.stop()

    sensorsInfo = scanner.sensors()
    for i in range(len(sensorsInfo)):
        current_sensor_info = sensorsInfo[i]
        sensor = scanner.create_sensor(current_sensor_info)
        print("Current connected device {0}".format(current_sensor_info))

        sensor.sensorStateChanged = on_sensor_state_changed
        sensor.batteryChanged = on_battery_changed
        sensor.signalDataReceived = on_signal_received
        sensor.resistDataReceived = on_resist_received

        sensor.exec_command(SensorCommand.StartResist)
        print("Start resistance")
        sleep(20)
        sensor.exec_command(SensorCommand.StopResist)
        print("Stop resistance")

        calibration_length = 6
        nwins_skip_after_artifact = 10

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

        math = emotional_math.EmotionalMath(mls, ads, sads, mss)
        math.set_calibration_length(calibration_length)
        math.set_mental_estimation_mode(False)
        math.set_skip_wins_after_artifact(nwins_skip_after_artifact)
        math.set_zero_spect_waves(True, 0, 1, 1, 1, 0)
        math.set_spect_normalization_by_bands_width(True)

        if sensor.is_supported_command(SensorCommand.StartSignal):
            sensor.exec_command(SensorCommand.StartSignal)
            print("Start signal")
            math.start_calibration()
            sleep(300)  # 5 min collection
            sensor.exec_command(SensorCommand.StopSignal)
            print("Stop signal")

        sensor.disconnect()
        print("Disconnect from sensor")

        del sensor
        del math

    del scanner
    print('Remove scanner')

except Exception as err:
    print("Error:", err)

finally:
    if output_file:
        output_file.close()
        print("CSV file saved as 'bci_data_log.csv'")