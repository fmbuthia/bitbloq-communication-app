angular.module('bitbloqCom')
    .controller('MainCtrl', function($scope, bluetooth, $rootScope, $interval, $ionicPlatform, $ionicPopup, common, $translate) {

        $scope.soundToPlay = '';
        $scope.loaded = {};
        $scope.lastSoundPlayed = '';
        $scope.bluetoothData = '';
        $scope.torchStatus = common.translate('device-torch-off');
        $scope.isOn = false;
        $scope.isOff = true;
        $scope.isToggling = false;
        $scope.recognizedText = {};
        $scope.textSended = "";
        $scope.buttonText = common.translate('buttonspad-send');
        $scope.torchChange = '';
        $scope.listening = false;
        var configT = {};
        var flashTimer = false;
        var intensityFloat = 100;
        var toggleTimer;
        var toggleTime = 1;
        var toast = false;

        $rootScope.$on('bluetoothSerial:write', function(evt, data) {
            $scope.bluetoothData = data;
            $scope.$apply();
        });
        $rootScope.$on('bluetoothSerial:turnonFlashlight', function(evt) {
            turnonFlashlight();
        });
        $rootScope.$on('bluetoothSerial:turnoffFlashlight', function(evt) {
            turnoffFlashlight();
        });

        $rootScope.$on('bluetoothSerial:toggleFlashlight', function(evt, data) {
            toggle(data);
        });
        $rootScope.$on('bluetoothSerial:twitterConfig', function(evt, data) {
            twitterConfig(data);
            $scope.$apply();
        });

        $rootScope.$on('bluetoothSerial:twitterSend', function(evt, data) {
            sendTwitter(data);
            $scope.$apply();
        });

        $rootScope.$on('bluetoothSerial:readLAccel', function(evt, axis) {
            sendLAccel(axis);
            $scope.$apply();
        });

        $rootScope.$on('bluetoothSerial:readAccel', function(evt, axis) {
            sendAccel(axis);
            $scope.$apply();
        });

        $rootScope.$on('bluetoothSerial:readGravity', function(evt, axis) {
            sendGravity(axis);
            $scope.$apply();
        });
        $rootScope.$on('bluetoothSerial:readOrientation', function(evt, axis) {
            sendOrientation(axis);
            $scope.$apply();
        });
        $rootScope.$on('bluetoothSerial:readGyros', function(evt, axis) {
            sendGyros(axis);
            $scope.$apply();
        });

        $rootScope.$on('bluetoothSerial:readProx', function(evt, covered) {
            sendProx(covered);
            $scope.$apply();
        });

        $rootScope.$on('bluetoothSerial:readLight', function(evt) {
            sendLight();
            $scope.$apply();
        });

        $rootScope.$on('bluetoothSerial:readMagnetic', function(evt, axis) {
            sendMagnetic(axis);
            $scope.$apply();
        });


        $rootScope.$on('bluetoothSerial:playSound', function(evt, data) {
            playSound(data);
        });



        $scope.record = function() {
            $scope.listening = true;
            $scope.recognizedText.text = '';
            $scope.buttonText = common.translate('device-listening-message');
            var recon = '';
            var recognition = new SpeechRecognition();
            recognition.lang = navigator.language || navigator.userLanguage;

            recognition.onresult = function(event) {
                if (event.results.length > 0) {
                    //$scope.recognizedText = event.results[0][0].transcript;
                    setRecognized(event.results[0][0].transcript.replace(/\s+^/gm, ''));
                    $scope.listening = false;
                    $scope.buttonText = common.translate('buttonspad-send');
                    $scope.$apply();
                }
            };

            recognition.start();
        };

        function setRecognized(text){
            $scope.recognizedText.text = text;
        }

        $scope.send = function(message) {
            bluetooth.write(message).then(null, function(error) {
                common.showAlert('Error', commmon.translate('device-bluetooth-error') + ': ' + JSON.stringify(error));
            });
        };


        function playSound(sound) {
            $scope.bluetoothData = '';
            $scope.soundToPlay = sound;
            $scope.$apply();
            if ($scope.loaded[sound.replace(/\s/g, '')]) {
                if ($scope.lastSoundPlayed.length > 0) {
                    window.plugins.NativeAudio.stop($scope.lastSoundPlayed);
                }
                window.plugins.NativeAudio.play(sound); // Play audio track
                $scope.soundToPlay = '';
                $scope.lastSoundPlayed = sound;
            } else {
                window.plugins.NativeAudio.preloadComplex(sound, common.getAudioRoute(sound), 1, 1, 0, function(msg) {
                    $scope.loaded[sound.replace(/\s/g, '')] = true;
                    if ($scope.lastSoundPlayed.length > 0) {
                        window.plugins.NativeAudio.stop($scope.lastSoundPlayed);
                    }
                    window.plugins.NativeAudio.play(sound); // Play audio track
                    $scope.soundToPlay = '';
                    $scope.lastSoundPlayed = sound;
                }, function(msg) {
                    console.log('Error: ' + msg); // Loading error
                });
            }

        }

        function turnonFlashlight() {
            $scope.torchChange = 'on';

            if (flashTimer) {
                console.log('está flashTimer en on');
            } else {
                console.log('no hay flashTimer en on');
                flashTimer = true;
                setTimeout(function() {
                    flashTimer = false;
                }, 500);
                window.plugins.flashlight.available(function(isAvailable) {
                    if (isAvailable) {
                        window.plugins.flashlight.switchOn(
                            function() {
                                console.log("is ON!");
                                $scope.isOn = true;
                                $scope.isOff = false;
                                $scope.torchStatus = common.translate('device-torch-on');
                                console.log($scope.torchStatus);
                                $scope.$apply();
                            }, // optional success callback
                            function() {} // optional as well
                        );
                    } else {
                        common.showAlert('Error', common.translate('device-flashlight-error'));
                    }
                });
            }
        }

        function turnoffFlashlight() {
            $scope.torchChange = 'off';
            if (flashTimer) {
                console.log('está flashTimer en off');
            } else {
                console.log('no hay flashTimer en off');
                flashTimer = true;
                setTimeout(function() {
                    flashTimer = false;
                }, 500);
                window.plugins.flashlight.available(function(isAvailable) {
                    if (isAvailable) {
                        window.plugins.flashlight.switchOff(
                            function(success) {
                                console.log("is OFF!");
                                $scope.isOn = false;
                                $scope.isOff = true;
                                $scope.torchStatus = common.translate('device-torch-off');
                                console.log("en off");
                                console.log($scope.torchStatus);
                                $scope.$apply();
                            },
                            function(error) {
                                console.log("error");
                                console.log(error);
                                $scope.isOn = true;
                                $scope.isOff = false;
                            }
                        );
                    } else {
                        common.showAlert('Error', common.translate('device-flashlight-error'));
                    }
                });
            }
        }


        function toggle(time) {
            $scope.torchChange = 'toggle';
            toggleTime = parseFloat(time);
            if (toggleTime < 0.05) {
                toggleTime = 0.05;
            }
            if (toggleTimer) {
                console.log('no hago nada');
            } else {
                toggleTimer = setInterval(function() {
                    window.plugins.flashlight.toggle();
                    $scope.torchStatus = common.translate('device-torch-toggle');
                    $scope.isToggling = true;
                    $scope.isOff = false;
                    $scope.$apply();
                }, toggleTime * 1000);
            }
        }

        function sendLAccel(axis) {
            document.addEventListener("deviceready", function() {
                $scope.sensorRead = "ACELERÓMETRO para medir aceleración lineal";
                sensors.enableSensor("LINEAR_ACCELERATION");
                sensors.getState(function(values) {
                    var laccel;
                    switch (axis) {
                        case "x":
                            laccel = values[0];
                            break;
                        case "y":
                            laccel = values[1];
                            break;
                        case "z":
                            laccel = values[2];
                            break;
                    }
                    if (!laccel) {
                        laccel = "NaN";
                    }
                    console.log("laccel: " + laccel);
                    bluetooth.write(laccel.toString()).then(function() {
                        $scope.sensorValue = common.translate('device-value-axis') + ' ' + axis + ' ' + common.translate('device-is') + ': ' + laccel + ' (m/s²)';
                    }, function(error) {
                        common.showAlert('Error', commmon.translate('device-bluetooth-error') + ': ' + JSON.stringify(error));
                    });
                });

            });
        }


        function sendAccel(axis) {
            document.addEventListener("deviceready", function() {
                $scope.sensorRead = "ACELERÓMETRO para medir aceleración";
                sensors.enableSensor("ACCELEROMETER");
                sensors.getState(function(values) {
                    var accel;
                    switch (axis) {
                        case "x":
                            accel = values[0];
                            break;
                        case "y":
                            accel = values[1];
                            break;
                        case "z":
                            accel = values[2];
                            break;
                    }
                    if (!accel) {
                        accel = "NaN";
                    }
                    console.log("accel: " + accel);
                    bluetooth.write(accel.toString()).then(function() {
                        $scope.sensorValue = common.translate('device-value-axis') + ' ' + axis + ' ' + common.translate('device-is') + ': ' + accel + ' (m/s²)';
                    }, function(error) {
                        common.showAlert('Error', commmon.translate('device-bluetooth-error') + ': ' + JSON.stringify(error));
                    });
                });

            });
        }



        function sendGravity(axis) {
            document.addEventListener("deviceready", function(axis) {
                $scope.sensorRead = common.translate('device-sensor-gravity');
                sensors.enableSensor("GRAVITY");
                sensors.getState(function(values) {
                    var gravity;
                    switch (axis) {
                        case "x":
                            gravity = values[0];
                            break;
                        case "y":
                            gravity = values[1];
                            break;
                        case "z":
                            gravity = values[2];
                            break;
                    }
                    console.log("hay gravity");
                    if (!gravity) {
                        gravity = "NaN";
                    }
                    bluetooth.write(gravity.toString()).then(function() {
                        $scope.sensorValue = common.translate('device-value-axis') + ' ' + axis + ' ' + common.translate('device-is') + ': ' + gravity + ' (m/s²)';
                    }, function(error) {
                        common.showAlert('Error', commmon.translate('device-bluetooth-error') + ': ' + JSON.stringify(error));
                    });
                });

            });
        }

        function sendOrientation(axis) {
            console.log("axis dentro");
            console.log(axis);
            document.addEventListener("deviceready", function() {
                $scope.sensorRead = common.translate('device-sensor-orientation');
                sensors.enableSensor("ORIENTATION");
                sensors.getState(function(values) {
                    var orientation;
                    switch (axis) {
                        case "azimuth":
                            orientation = values[0];
                            break;
                        case "pitch":
                            orientation = values[1];
                            break;
                        case "roll":
                            orientation = values[2];
                            break;
                    }
                    if (!orientation) {
                        orientation = "NaN";
                    }
                    console.log("orientation: " + orientation);
                    bluetooth.write(orientation.toString()).then(function() {
                        $scope.sensorValue = common.translate('the') + ' ' + axis + ' ' + common.translate('device-is') + ': ' + orientation + ' (º)';
                    }, function(error) {
                        common.showAlert('Error', commmon.translate('device-bluetooth-error') + ': ' + JSON.stringify(error));
                    });
                });

            });
        }

        function sendGyros(axis) {
            document.addEventListener("deviceready", function() {
                $scope.sensorRead = common.translate('device-sensor-gyroscope');
                sensors.enableSensor("GYROSCOPE");
                sensors.getState(function(values) {
                    var gyro;
                    switch (axis) {
                        case "x":
                            gyro = values[0];
                            break;
                        case "y":
                            gyro = values[1];
                            break;
                        case "z":
                            gyro = values[2];
                            break;
                    }
                    console.log("hay gyro");
                    if (!gyro) {
                        console.log("NAN!!!!");
                        gyro = "NaN";
                    }
                    console.log("gyro: " + gyro);
                    bluetooth.write(gyro.toString()).then(function() {
                        $scope.sensorValue = common.translate('device-value-axis') + ' ' + axis + ' ' + common.translate('device-is') + ': ' + gyro + ' (rad/s)';
                    }, function(error) {
                        common.showAlert('Error', commmon.translate('device-bluetooth-error') + ': ' + JSON.stringify(error));
                    });
                });

            });
        }

        function sendProx(covered) {
            document.addEventListener("deviceready", function() {
                $scope.sensorRead = common.translate('device-sensor-proximity');
                sensors.enableSensor("PROXIMITY");
                sensors.getState(function(values) {
                    var isCovered;
                    if (!values || values.length === 0) {
                        isCovered = "NaN";
                    } else {
                        if (values[0] === 0) {
                            //está tapado
                            if (covered === 'covered') {
                                isCovered = true;
                                $scope.sensorValue = common.translate('device-sensor-light-covered');
                            } else {
                                isCovered = false;
                                $scope.sensorValue = common.translate('device-sensor-light-covered');
                            }
                        } else {
                            //no está tapado
                            if (covered === 'covered') {
                                isCovered = false;
                                $scope.sensorValue = common.translate('device-sensor-light-not-covered');
                            } else {
                                isCovered = true;
                                $scope.sensorValue = common.translate('device-sensor-light-not-covered');
                            }
                        }
                    }
                    bluetooth.write(isCovered.toString()).then(function() {}, function(error) {
                        common.showAlert('Error', commmon.translate('device-bluetooth-error') + ': ' + JSON.stringify(error));
                    });
                });
            });
        }



        function sendLight() {
            document.addEventListener("deviceready", function() {
                $scope.sensorRead = common.translate('device-sensor-light');
                sensors.enableSensor("LIGHT");
                sensors.getState(function(values) {
                    var light;
                    if (!values || values.length === 0) {
                        light = "NaN";
                    } else {
                        light = values[0];
                    }
                    console.log("light: " + light);
                    bluetooth.write(light.toString()).then(function() {
                        $scope.sensorValue = light + ' (lx)';
                    }, function(error) {
                        common.showAlert('Error', commmon.translate('device-bluetooth-error') + ': ' + JSON.stringify(error));
                    });
                });

            });
        }



        function sendMagnetic(axis) {
          console.log("sendMagnetic!!");
            $scope.sensorRead = common.translate('device-sensor-magnetic');
            document.addEventListener("deviceready", function() {
                sensors.enableSensor("MAGNETIC_FIELD");
                sensors.getState(function(values) {
                    var magnetic;
                    switch (axis) {
                        case "x":
                            magnetic = values[0];
                            break;
                        case "y":
                            magnetic = values[1];
                            break;
                        case "z":
                            magnetic = values[2];
                            break;
                    }
                    if (!magnetic) {
                        magnetic = "NaN";
                    }
                    console.log("magnetic");
                    console.log(magnetic);
                    bluetooth.write(magnetic.toString()).then(function() {
                        $scope.sensorValue = common.translate('device-value-axis') + ' ' + axis + ' ' + common.translate('device-is') + ': ' + magnetic + ' (µT)';
                    }, function(error) {
                        common.showAlert('Error', commmon.translate('device-bluetooth-error') + ': ' + JSON.stringify(error));
                    });
                });

            });
        }


        function twitterConfig(options) {
            configT = window.twitterWrap.configTwitter(options);
        }

        function sendTwitter(msg) {
            var messages = '';
            if (configT.config) {
                window.twitterWrap.sendTwitter(msg, configT, function(err, res, req) {
                    console.log("req statusCode");
                    console.log(req.statusCode);
                    if (req.statusCode !== 200) {
                        switch (req.statusCode) {
                            case 401:
                                if (!toast) {
                                    common.showAlert(common.translate('device-twitter-error') + ' ' + msg, common.translate('device-twitter-error-credentials'));
                                    toast = true;
                                    $scope.tweetMessage = common.translate('device-twitter-error') + ' ' + msg + ': ' + common.translate('device-twitter-error-credentials');
                                }
                                break;
                            case 403:
                                common.showAlert(common.translate('device-twitter-error') + ' ' + msg, common.translate('device-twitter-error-duplicate'));
                                $scope.tweetMessage = common.translate('device-twitter-error') + ' ' + msg + ': ' + common.translate('device-twitter-error-duplicate');
                                break;
                        }
                    } else {
                        if (messages) {
                            messages = messages + ', ' + msg;
                        } else {
                            messages = msg;
                        }
                        $scope.tweetMessage = common.translate('device-twitter-published') + ': ' + messages;
                    }
                });
            } else {
                common.showAlert(common.translate('device-twitter-error'), common.translate('device-twitter-error-no-credentials'));
                $scope.tweetMessage = common.translate('device-twitter-error') + ': ' + common.translate('device-twitter-error-no-credentials');
            }
        }

        document.addEventListener("backbutton", function() {
            // pass exitApp as callbacks to the switchOff method
            window.plugins.flashlight.switchOff(exitApp, exitApp);
        }, false);

    });
